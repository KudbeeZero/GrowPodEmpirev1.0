import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { PeraWalletConnect } from '@perawallet/connect';
import { DeflyWalletConnect } from '@blockshake/defly-connect';
import algosdk from 'algosdk';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@shared/routes';

const ALGOD_SERVER = 'https://testnet-api.algonode.cloud';
const ALGOD_TOKEN = '';
const CHAIN_ID = 416002;

// Reown (WalletConnect) Project ID for TestNet
export const REOWN_PROJECT_ID = 'e237c5b78b0ae2a29f1a98bdb575e5ce';

export const CONTRACT_CONFIG = {
  appId: Number(import.meta.env.VITE_GROWPOD_APP_ID) || 755243944,
  budAssetId: Number(import.meta.env.VITE_BUD_ASSET_ID) || 755243947,
  terpAssetId: Number(import.meta.env.VITE_TERP_ASSET_ID) || 755243948,
  slotAssetId: Number(import.meta.env.VITE_SLOT_ASSET_ID) || 755243949,
  appAddress: import.meta.env.VITE_GROWPOD_APP_ADDRESS || 'CWGAVWZRVKKFHRYZHEPQPELVJMFNW2QMIWNEB2H3ZXCKOXRIPKWCW2IBRI',
};

export const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, '');

// Lazy-initialize wallet connectors to avoid module-level failures
// if polyfills (Buffer, global, process) haven't loaded yet
let _peraWallet: PeraWalletConnect | null = null;
let _deflyWallet: DeflyWalletConnect | null = null;

function getPeraWallet(): PeraWalletConnect {
  if (!_peraWallet) {
    _peraWallet = new PeraWalletConnect({
      chainId: CHAIN_ID,
      projectId: REOWN_PROJECT_ID,
    });
  }
  return _peraWallet;
}

function getDeflyWallet(): DeflyWalletConnect {
  if (!_deflyWallet) {
    _deflyWallet = new DeflyWalletConnect({ chainId: CHAIN_ID });
  }
  return _deflyWallet;
}

type WalletType = 'pera' | 'defly' | null;

interface AlgorandContextType {
  account: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  walletType: WalletType;
  connectWallet: (type: WalletType) => Promise<void>;
  disconnectWallet: () => Promise<void>;
  signTransactions: (txns: algosdk.Transaction[]) => Promise<Uint8Array[]>;
  algodClient: algosdk.Algodv2;
  peraWallet: PeraWalletConnect;
  deflyWallet: DeflyWalletConnect;
}

const AlgorandContext = createContext<AlgorandContextType | null>(null);

export function AlgorandProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletType, setWalletType] = useState<WalletType>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Helper to sync account with backend
  const syncWithBackend = useCallback(async (address: string) => {
    try {
      await fetch(api.users.login.path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address })
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    } catch (error) {
      console.error('Backend sync failed:', error);
    }
  }, [queryClient]);

  useEffect(() => {
    let cancelled = false;

    const reconnect = async () => {
      // Try Pera first
      try {
        const peraAccounts = await getPeraWallet().reconnectSession();
        if (!cancelled && peraAccounts.length) {
          const address = peraAccounts[0];
          setAccount(address);
          setIsConnected(true);
          setWalletType('pera');
          await syncWithBackend(address);
          return; // Pera connected, skip Defly
        }
      } catch (err) {
        console.error('Pera reconnect failed:', err);
      }

      // Try Defly if Pera didn't connect
      try {
        const deflyAccounts = await getDeflyWallet().reconnectSession();
        if (!cancelled && deflyAccounts.length) {
          const address = deflyAccounts[0];
          setAccount(address);
          setIsConnected(true);
          setWalletType('defly');
          await syncWithBackend(address);
        }
      } catch (err) {
        console.error('Defly reconnect failed:', err);
      }
    };

    reconnect();

    // Setup disconnect listeners
    try {
      getPeraWallet().connector?.on('disconnect', () => {
        setAccount(null);
        setIsConnected(false);
        setWalletType(null);
      });
    } catch (err) {
      console.error('Failed to set up Pera disconnect listener:', err);
    }

    try {
      getDeflyWallet().connector?.on('disconnect', () => {
        setAccount(null);
        setIsConnected(false);
        setWalletType(null);
      });
    } catch (err) {
      console.error('Failed to set up Defly disconnect listener:', err);
    }

    return () => {
      cancelled = true;
    };
  }, [queryClient, syncWithBackend]);

  const connectWallet = useCallback(async (type: WalletType = 'pera') => {
    if (isConnecting || !type) return;
    setIsConnecting(true);

    try {
      let accounts: string[];

      if (type === 'pera') {
        accounts = await getPeraWallet().connect();
      } else if (type === 'defly') {
        accounts = await getDeflyWallet().connect();
      } else {
        throw new Error('Unsupported wallet type');
      }

      const address = accounts[0];
      setAccount(address);
      setIsConnected(true);
      setWalletType(type);

      // Sync with backend (non-blocking, don't let failure prevent connection)
      syncWithBackend(address).catch(() => {});

      toast({
        title: "Wallet Connected!",
        description: `Connected via ${type === 'pera' ? 'Pera' : 'Defly'}: ${address.slice(0, 6)}...${address.slice(-4)}`
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      if (!errorMessage.includes('CONNECT_MODAL_CLOSED') && !errorMessage.includes('cancelled')) {
        console.error('Wallet connection error:', error);
        toast({
          title: "Connection Failed",
          description: errorMessage,
          variant: "destructive"
        });
      }
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting, toast, syncWithBackend]);

  const disconnectWallet = useCallback(async () => {
    try {
      if (walletType === 'pera') {
        await getPeraWallet().disconnect();
      } else if (walletType === 'defly') {
        await getDeflyWallet().disconnect();
      }
      setAccount(null);
      setIsConnected(false);
      setWalletType(null);
      queryClient.clear();
      toast({ title: "Wallet Disconnected" });
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  }, [walletType, queryClient, toast]);

  const signTransactions = useCallback(async (txns: algosdk.Transaction[]): Promise<Uint8Array[]> => {
    if (!account) throw new Error('Wallet not connected');

    let signedTxns: Uint8Array[];

    if (walletType === 'pera') {
      signedTxns = await getPeraWallet().signTransaction([
        txns.map(txn => ({ txn }))
      ]);
    } else if (walletType === 'defly') {
      signedTxns = await getDeflyWallet().signTransaction([
        txns.map(txn => ({ txn }))
      ]);
    } else {
      throw new Error('No wallet connected');
    }

    return signedTxns;
  }, [account, walletType]);

  return (
    <AlgorandContext.Provider value={{
      account,
      isConnected,
      isConnecting,
      walletType,
      connectWallet,
      disconnectWallet,
      signTransactions,
      algodClient,
      peraWallet: getPeraWallet(),
      deflyWallet: getDeflyWallet()
    }}>
      {children}
    </AlgorandContext.Provider>
  );
}

export function useAlgorandContext() {
  const context = useContext(AlgorandContext);
  if (!context) {
    throw new Error('useAlgorandContext must be used within an AlgorandProvider');
  }
  return context;
}
