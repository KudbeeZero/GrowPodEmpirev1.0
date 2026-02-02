/**
 * Multi-Wallet Provider Configuration
 *
 * Simplified to Pera Wallet only for a streamlined user experience.
 * Pera Wallet works on both Mobile (iOS/Android) and Web via QR code.
 *
 * Using @txnlab/use-wallet-react for wallet management
 */

import { ReactNode } from 'react';
import {
  NetworkId,
  WalletId,
  WalletManager,
  WalletProvider as UseWalletProvider,
} from '@txnlab/use-wallet-react';
import algosdk from 'algosdk';

// Create algod client manually for TestNet
const ALGOD_SERVER = 'https://testnet-api.algonode.cloud';
const ALGOD_TOKEN = '';
export const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, '');

/**
 * Create the WalletManager instance
 * Simplified to Pera Wallet only
 */
export const walletManager = new WalletManager({
  wallets: [
    // Pera Wallet - Most popular Algorand wallet (Mobile & Web)
    WalletId.PERA,
  ],
  defaultNetwork: NetworkId.TESTNET,
});

/**
 * Wallet metadata for UI display
 */
export const WALLET_METADATA: Record<string, {
  name: string;
  icon: string;
  description: string;
  downloadUrl?: string;
  type: 'mobile' | 'extension' | 'web';
}> = {
  [WalletId.PERA]: {
    name: 'Pera Wallet',
    icon: '/wallet-icons/pera.svg',
    description: 'The most popular Algorand wallet. Scan QR code or use on mobile.',
    downloadUrl: 'https://perawallet.app/',
    type: 'mobile',
  },
};

interface MultiWalletProviderProps {
  children: ReactNode;
}

/**
 * MultiWalletProvider - Wraps the app with wallet functionality
 *
 * Provides:
 * - Connection to Pera Wallet
 * - Transaction signing
 * - Account management
 */
export function MultiWalletProvider({ children }: MultiWalletProviderProps) {
  return (
    <UseWalletProvider manager={walletManager}>
      {children}
    </UseWalletProvider>
  );
}

export { WalletId, NetworkId };
