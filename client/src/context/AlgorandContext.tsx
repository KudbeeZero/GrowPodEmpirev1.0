import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { PeraWalletConnect } from '@perawallet/connect';
import { DeflyWalletConnect } from '@blockshake/defly-connect';
import LuteConnect from 'lute-connect';
import algosdk from 'algosdk';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@shared/routes';

const ALGOD_SERVER = 'https://testnet-api.algonode.cloud';
const ALGOD_TOKEN = '';
const CHAIN_ID = 416002;

// Lute needs the genesis ID string to connect (identifies the network)
const TESTNET_GENESIS_ID = 'testnet-v1.0';

const LUTE_WALLET_KEY = 'growpod_lute_wallet';

export const CONTRACT_CONFIG = {
  appId: Number(import.meta.env.VITE_GROWPOD_APP_ID) || 753910199,
  budAssetId: Number(import.meta.env.VITE_BUD_ASSET_ID) || 753910204,
  terpAssetId: Number(import.meta.env.VITE_TERP_ASSET_ID) || 753910205,
  slotAssetId: Number(import.meta.env.VITE_SLOT_ASSET_ID) || 753910206,
  appAddress: import.meta.env.VITE_GROWPOD_APP_ADDRESS || 'DOZMB24AAMRL4BRVMUNGO3IWV64OMU33UQ7O7D5ISTXIZUSFIXOMXO4TEI',
};

export const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, '');

// Lazy-initialize wallet connectors to avoid module-level failures
// if polyfills (Buffer, global, process) haven't loaded yet
let _peraWallet: PeraWalletConnect | null = null;
let _deflyWallet: DeflyWalletConnect | null = null;
let _luteWallet: LuteConnect | null = null;

function getPeraWallet(): PeraWalletConnect {
  if (!_peraWallet) {
    _peraWallet = new PeraWalletConnect({ chainId: CHAIN_ID });
  }
  return _peraWallet;
}

function getDeflyWallet(): DeflyWalletConnect {
  if (!_deflyWallet) {
    _deflyWallet = new DeflyWalletConnect({ chainId: CHAIN_ID });
  }
  return _deflyWallet;
}

function getLuteWallet(): LuteConnect {
  if (!_luteWallet) {
    _luteWallet = new LuteConnect('GrowPod Empire');
  }
  return _luteWallet;
}

export type WalletType = 'pera' | 'defly' | 'lute' | null;

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
          return;
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
          return;
        }
      } catch (err) {
        console.error('Defly reconnect failed:', err);
      }

      // Try Lute (stateless -- restore from localStorage)
      try {
        const savedLuteAddress = localStorage.getItem(LUTE_WALLET_KEY);
        if (!cancelled && savedLuteAddress) {
          setAccount(savedLuteAddress);
          setIsConnected(true);
          setWalletType('lute');
          await syncWithBackend(savedLuteAddress);
        }
      } catch (err) {
        console.error('Lute reconnect failed:', err);
      }
    };

    reconnect();

    // Setup disconnect listeners for Pera/Defly
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
      } else if (type === 'lute') {
        accounts = await getLuteWallet().connect(TESTNET_GENESIS_ID);
      } else {
        throw new Error('Unsupported wallet type');
      }

      const address = accounts[0];
      setAccount(address);
      setIsConnected(true);
      setWalletType(type);

      // Persist Lute address (stateless wallet, no session to reconnect)
      if (type === 'lute') {
        localStorage.setItem(LUTE_WALLET_KEY, address);
      }

      // Sync with backend (non-blocking)
      syncWithBackend(address).catch(() => {});

      const walletName = type === 'pera' ? 'Pera' : type === 'defly' ? 'Defly' : 'Lute';
      toast({
        title: "Wallet Connected!",
        description: `Connected via ${walletName}: ${address.slice(0, 6)}...${address.slice(-4)}`
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
      } else if (walletType === 'lute') {
        // Lute is stateless -- just clear our saved address
        localStorage.removeItem(LUTE_WALLET_KEY);
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
    } else if (walletType === 'lute') {
      // Lute uses ARC-0001 format: base64-encoded msgpack transactions
      const luteResult = await getLuteWallet().signTxns(
        txns.map(txn => ({
          txn: Buffer.from(algosdk.encodeUnsignedTransaction(txn)).toString('base64'),
        }))
      );
      // Filter out nulls (unsigned txns in a group) and convert to Uint8Array
      signedTxns = luteResult
        .filter((t): t is Uint8Array => t !== null);
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
