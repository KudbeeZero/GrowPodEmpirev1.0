/**
 * useMultiWallet - Custom hook for multi-wallet integration
 *
 * Wraps @txnlab/use-wallet-react and adds game-specific functionality:
 * - Backend user sync on connect
 * - Transaction helpers
 * - Network status
 */

import { useCallback, useEffect, useMemo } from 'react';
import { useWallet, useNetwork } from '@txnlab/use-wallet-react';
import algosdk from 'algosdk';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { api } from '@shared/routes';
import { WALLET_METADATA, WalletId, algodClient } from '@/context/MultiWalletProvider';

// Contract configuration
export const CONTRACT_CONFIG = {
  appId: Number(import.meta.env.VITE_GROWPOD_APP_ID) || 754825112,
  budAssetId: Number(import.meta.env.VITE_BUD_ASSET_ID) || 754825127,
  terpAssetId: Number(import.meta.env.VITE_TERP_ASSET_ID) || 754825128,
  slotAssetId: Number(import.meta.env.VITE_SLOT_ASSET_ID) || 754825129,
  appAddress: import.meta.env.VITE_GROWPOD_APP_ADDRESS || '6P55NJ7FDJSZA2YSZNT2HRF2FBIUYNKBZLPX4LJ72Q76SBDN4VAB65W6KM',
};

// Re-export algodClient from provider
export { algodClient };

/**
 * Wallet info with metadata
 */
export interface WalletInfo {
  id: WalletId;
  name: string;
  icon: string;
  description: string;
  downloadUrl?: string;
  type: 'mobile' | 'extension' | 'web';
  isAvailable: boolean;
  isActive: boolean;
}

/**
 * Main multi-wallet hook
 */
export function useMultiWallet() {
  const {
    wallets,
    activeWallet,
    activeAccount,
    activeAddress,
    isReady,
    signTransactions,
    transactionSigner,
  } = useWallet();

  const { activeNetwork, setActiveNetwork } = useNetwork();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Map wallets to display info
  const availableWallets = useMemo<WalletInfo[]>(() => {
    return wallets.map((wallet) => {
      const metadata = WALLET_METADATA[wallet.id] || {
        name: wallet.metadata?.name || wallet.id,
        icon: wallet.metadata?.icon || '',
        description: '',
        type: 'web' as const,
      };

      // Check availability - use 'isAvailable' if it exists, otherwise assume true
      const isAvailable = 'isAvailable' in wallet ? (wallet as { isAvailable: boolean }).isAvailable : true;

      return {
        id: wallet.id as WalletId,
        name: metadata.name,
        icon: metadata.icon,
        description: metadata.description,
        downloadUrl: metadata.downloadUrl,
        type: metadata.type,
        isAvailable,
        isActive: wallet.isActive,
      };
    });
  }, [wallets]);

  // Sync with backend when wallet connects
  useEffect(() => {
    const syncUser = async () => {
      if (activeAddress && isReady) {
        try {
          await fetch(api.users.login.path, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ walletAddress: activeAddress }),
          });
          queryClient.invalidateQueries({ queryKey: ['/api/users'] });
        } catch (error) {
          console.error('Backend sync failed:', error);
        }
      }
    };

    syncUser();
  }, [activeAddress, isReady, queryClient]);

  /**
   * Connect to a specific wallet
   */
  const connectWallet = useCallback(
    async (walletId: WalletId) => {
      const wallet = wallets.find((w) => w.id === walletId);
      if (!wallet) {
        toast({
          title: 'Wallet Not Found',
          description: `${walletId} wallet is not configured.`,
          variant: 'destructive',
        });
        return null;
      }

      // Check availability defensively
      const isAvailable = 'isAvailable' in wallet ? (wallet as { isAvailable: boolean }).isAvailable : true;
      if (!isAvailable) {
        const metadata = WALLET_METADATA[walletId];
        toast({
          title: 'Wallet Not Available',
          description: metadata?.downloadUrl
            ? `Please install ${metadata.name} from ${metadata.downloadUrl}`
            : `${metadata?.name || walletId} is not available on this device.`,
          variant: 'destructive',
        });
        return null;
      }

      try {
        const accounts = await wallet.connect();
        if (accounts && accounts.length > 0) {
          toast({
            title: 'Wallet Connected!',
            description: `Connected via ${WALLET_METADATA[walletId]?.name || walletId}`,
          });
          return accounts[0].address;
        }
        return null;
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Connection failed';
        // Don't show error if user closed modal
        if (!errorMessage.includes('MODAL_CLOSED') && !errorMessage.includes('User rejected')) {
          toast({
            title: 'Connection Failed',
            description: errorMessage,
            variant: 'destructive',
          });
        }
        return null;
      }
    },
    [wallets, toast]
  );

  /**
   * Disconnect current wallet
   */
  const disconnectWallet = useCallback(async () => {
    if (activeWallet) {
      try {
        await activeWallet.disconnect();
        queryClient.clear();
        toast({ title: 'Wallet Disconnected' });
      } catch (error) {
        console.error('Disconnect error:', error);
      }
    }
  }, [activeWallet, queryClient, toast]);

  /**
   * Sign and submit a transaction
   */
  const signAndSubmit = useCallback(
    async (txns: algosdk.Transaction[]): Promise<string | null> => {
      if (!activeAddress) {
        toast({
          title: 'Wallet Not Connected',
          description: 'Please connect a wallet first.',
          variant: 'destructive',
        });
        return null;
      }

      try {
        // Encode transactions
        const encodedTxns = txns.map((txn) => txn.toByte());

        // Sign with active wallet
        const signedTxns = await signTransactions(encodedTxns);

        // Filter out null values and submit
        const validSignedTxns = signedTxns.filter((t): t is Uint8Array => t !== null);

        if (validSignedTxns.length === 0) {
          throw new Error('No transactions were signed');
        }

        // Submit to network
        const result = await algodClient.sendRawTransaction(validSignedTxns).do();

        // Get txId from result - handle both old and new API formats
        const txId = typeof result === 'object' && result !== null
          ? (result as { txid?: string; txId?: string }).txid || (result as { txid?: string; txId?: string }).txId || ''
          : String(result);

        // Wait for confirmation
        await algosdk.waitForConfirmation(algodClient, txId, 4);

        return txId;
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Transaction failed';
        if (!errorMessage.includes('User rejected')) {
          toast({
            title: 'Transaction Failed',
            description: errorMessage,
            variant: 'destructive',
          });
        }
        return null;
      }
    },
    [activeAddress, signTransactions, toast]
  );

  /**
   * Get the active wallet's name for display
   */
  const activeWalletName = useMemo(() => {
    if (!activeWallet) return null;
    return WALLET_METADATA[activeWallet.id]?.name || activeWallet.id;
  }, [activeWallet]);

  return {
    // State
    account: activeAddress,
    activeAccount,
    isConnected: !!activeAddress,
    isReady,
    activeWallet,
    activeWalletName,
    activeNetwork,

    // Available wallets
    wallets: availableWallets,

    // Actions
    connectWallet,
    disconnectWallet,
    signTransactions,
    signAndSubmit,
    transactionSigner,
    setActiveNetwork,

    // Clients
    algodClient,
  };
}

export default useMultiWallet;
