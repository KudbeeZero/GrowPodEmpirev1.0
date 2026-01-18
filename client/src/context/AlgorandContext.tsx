import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { PeraWalletConnect } from '@perawallet/connect';
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

export const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, '');

const peraWallet = new PeraWalletConnect({
  chainId: CHAIN_ID,
});

interface AlgorandContextType {
  account: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  signTransactions: (txns: algosdk.Transaction[]) => Promise<Uint8Array[]>;
  algodClient: algosdk.Algodv2;
  peraWallet: PeraWalletConnect;
}

const AlgorandContext = createContext<AlgorandContextType | null>(null);

export function AlgorandProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    peraWallet.reconnectSession().then(async (accounts) => {
      if (accounts.length) {
        const address = accounts[0];
        setAccount(address);
        setIsConnected(true);
        
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
      }
    }).catch(console.error);

    peraWallet.connector?.on('disconnect', () => {
      setAccount(null);
      setIsConnected(false);
    });
  }, [queryClient]);

  const connectWallet = useCallback(async () => {
    if (isConnecting) return;
    setIsConnecting(true);
    
    try {
      const accounts = await peraWallet.connect();
      const address = accounts[0];
      setAccount(address);
      setIsConnected(true);
      
      await fetch(api.users.login.path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address })
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      
      toast({ 
        title: "Wallet Connected!", 
        description: `Connected: ${address.slice(0, 6)}...${address.slice(-4)}` 
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      if (!errorMessage.includes('CONNECT_MODAL_CLOSED')) {
        toast({ 
          title: "Connection Failed", 
          description: errorMessage,
          variant: "destructive" 
        });
      }
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting, queryClient, toast]);

  const disconnectWallet = useCallback(async () => {
    try {
      await peraWallet.disconnect();
      setAccount(null);
      setIsConnected(false);
      queryClient.clear();
      toast({ title: "Wallet Disconnected" });
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  }, [queryClient, toast]);

  const signTransactions = useCallback(async (txns: algosdk.Transaction[]): Promise<Uint8Array[]> => {
    if (!account) throw new Error('Wallet not connected');
    
    const signedTxns = await peraWallet.signTransaction([
      txns.map(txn => ({ txn }))
    ]);
    
    return signedTxns;
  }, [account]);

  return (
    <AlgorandContext.Provider value={{
      account,
      isConnected,
      isConnecting,
      connectWallet,
      disconnectWallet,
      signTransactions,
      algodClient,
      peraWallet
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
