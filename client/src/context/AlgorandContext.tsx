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

export const CONTRACT_CONFIG = {
  appId: Number(import.meta.env.VITE_GROWPOD_APP_ID) || 753910199,
  budAssetId: Number(import.meta.env.VITE_BUD_ASSET_ID) || 753910204,
  terpAssetId: Number(import.meta.env.VITE_TERP_ASSET_ID) || 753910205,
  slotAssetId: Number(import.meta.env.VITE_SLOT_ASSET_ID) || 753910206,
  appAddress: import.meta.env.VITE_GROWPOD_APP_ADDRESS || 'DOZMB24AAMRL4BRVMUNGO3IWV64OMU33UQ7O7D5ISTXIZUSFIXOMXO4TEI',
};
/**
 * AlgorandContext - Wallet Integration
 *
 * Integrates Algorand wallets via @txnlab/use-wallet-react.
 *
 * Currently configured and tested with:
 * - Pera Wallet (Mobile & Web)
 *
 * The underlying multi-wallet infrastructure can be extended to support
 * additional wallets (e.g. Defly, Exodus, Kibisis, Lute) by modifying
 * the wallet configuration in MultiWalletProvider.tsx.
 *
 * Maintains backward compatibility with the existing useAlgorand hook.
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import algosdk from 'algosdk';
import { useMultiWallet, CONTRACT_CONFIG, algodClient } from '@/hooks/use-multi-wallet';
import { WalletModal } from '@/components/WalletModal';
import { monitor, addBreadcrumb } from '@/lib/growpod-monitor';

// Re-export for backward compatibility
export { CONTRACT_CONFIG, algodClient };

const deflyWallet = new DeflyWalletConnect({
  chainId: CHAIN_ID,
});

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
  // New multi-wallet features
  openWalletModal: () => void;
  activeWalletName: string | null;
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
    // Try to reconnect Pera Wallet
    peraWallet.reconnectSession().then(async (accounts) => {
      if (accounts.length) {
        const address = accounts[0];
        setAccount(address);
        setIsConnected(true);
        setWalletType('pera');
        await syncWithBackend(address);
      }
    }).catch(console.error);

    // Try to reconnect Defly Wallet
    deflyWallet.reconnectSession().then(async (accounts) => {
      if (accounts.length && !account) { // Only if Pera didn't connect
        const address = accounts[0];
        setAccount(address);
        setIsConnected(true);
        setWalletType('defly');
        await syncWithBackend(address);
      }
    }).catch(console.error);

    // Setup disconnect listeners
    peraWallet.connector?.on('disconnect', () => {
      if (walletType === 'pera') {
        setAccount(null);
        setIsConnected(false);
        setWalletType(null);
      }
    });

    deflyWallet.connector?.on('disconnect', () => {
      if (walletType === 'defly') {
        setAccount(null);
        setIsConnected(false);
        setWalletType(null);
      }
    });
  }, [queryClient, syncWithBackend]);

  const connectWallet = useCallback(async (type: WalletType = 'pera') => {
    if (isConnecting || !type) return;
    setIsConnecting(true);
    
    try {
      let accounts: string[];
      
      if (type === 'pera') {
        accounts = await peraWallet.connect();
      } else if (type === 'defly') {
        accounts = await deflyWallet.connect();
      } else {
        throw new Error('Unsupported wallet type');
      }
      
      const address = accounts[0];
      setAccount(address);
      setIsConnected(true);
      setWalletType(type);
      
      await syncWithBackend(address);
      
      toast({ 
        title: "Wallet Connected!", 
        description: `Connected via ${type === 'pera' ? 'Pera' : 'Defly'}: ${address.slice(0, 6)}...${address.slice(-4)}` 
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      if (!errorMessage.includes('CONNECT_MODAL_CLOSED') && !errorMessage.includes('cancelled')) {
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
        await peraWallet.disconnect();
      } else if (walletType === 'defly') {
        await deflyWallet.disconnect();
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
  const [modalOpen, setModalOpen] = useState(false);
  const {
    account,
    isConnected,
    isReady,
    disconnectWallet,
    signTransactions: multiSignTransactions,
    activeWalletName,
  } = useMultiWallet();

  // Set user in monitor when wallet connects/disconnects
  useEffect(() => {
    if (isConnected && account) {
      monitor.setUser(account);
      addBreadcrumb('wallet_connected', 'blockchain', {
        walletAddress: account,
        walletName: activeWalletName
      });
    } else {
      monitor.setUser(null);
    }
  }, [isConnected, account, activeWalletName]);

  // Wrapper to open modal instead of directly connecting
  // This provides the multi-wallet selection experience
  const connectWallet = async () => {
    setModalOpen(true);
  };

  // Wrapper for signTransactions to maintain compatibility
  const signTransactions = async (txns: algosdk.Transaction[]): Promise<Uint8Array[]> => {
    if (!account) throw new Error('Wallet not connected');
    
    let signedTxns: Uint8Array[];
    
    if (walletType === 'pera') {
      signedTxns = await peraWallet.signTransaction([
        txns.map(txn => ({ txn }))
      ]);
    } else if (walletType === 'defly') {
      signedTxns = await deflyWallet.signTransaction([
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
      peraWallet,
      deflyWallet
    }}>

    // Encode transactions for signing
    const encodedTxns = txns.map((txn) => txn.toByte());

    // Sign with multi-wallet
    const signedTxns = await multiSignTransactions(encodedTxns);

    // Filter out null values
    return signedTxns.filter((t): t is Uint8Array => t !== null);
  };

  const openWalletModal = () => setModalOpen(true);

  return (
    <AlgorandContext.Provider
      value={{
        account,
        isConnected,
        isConnecting: !isReady && !isConnected,
        connectWallet,
        disconnectWallet,
        signTransactions,
        algodClient,
        openWalletModal,
        activeWalletName,
      }}
    >
      {children}
      <WalletModal open={modalOpen} onOpenChange={setModalOpen} />
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
