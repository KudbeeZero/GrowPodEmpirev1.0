/**
 * AlgorandContext - Multi-Wallet Support
 *
 * Supports multiple Algorand wallets via @txnlab/use-wallet-react:
 * - Pera Wallet (Mobile & Web)
 * - Defly Wallet (Mobile & Web)
 * - Exodus (Browser Extension)
 * - Kibisis (Browser Extension)
 * - Lute (Web Wallet)
 *
 * Maintains backward compatibility with existing useAlgorand hook
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import algosdk from 'algosdk';
import { useMultiWallet, CONTRACT_CONFIG, algodClient } from '@/hooks/use-multi-wallet';
import { WalletModal } from '@/components/WalletModal';
import { monitor, addBreadcrumb } from '@/lib/growpod-monitor';

// Re-export for backward compatibility
export { CONTRACT_CONFIG, algodClient };

interface AlgorandContextType {
  account: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  signTransactions: (txns: algosdk.Transaction[]) => Promise<Uint8Array[]>;
  algodClient: algosdk.Algodv2;
  // New multi-wallet features
  openWalletModal: () => void;
  activeWalletName: string | null;
}

const AlgorandContext = createContext<AlgorandContextType | null>(null);

export function AlgorandProvider({ children }: { children: ReactNode }) {
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
