/**
 * Multi-Wallet Provider Configuration
 *
 * Supports multiple Algorand wallets for TestNet:
 * - Pera Wallet (Mobile & Web)
 * - Lute (Web Wallet)
 * - AlgoSigner (Browser Extension - Deprecated but still works)
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
 * Create the WalletManager instance with all 5 wallets
 */
export const walletManager = new WalletManager({
  wallets: [
    WalletId.PERA,
    WalletId.DEFLY,
    WalletId.EXODUS,
    WalletId.KIBISIS,
    WalletId.LUTE,
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
  [WalletId.LUTE]: {
    name: 'Lute Wallet',
    icon: '/wallet-icons/lute.svg',
    description: 'Web-based Algorand wallet. No installation required!',
    downloadUrl: 'https://lute.app/',
    type: 'web',
  },
  [WalletId.DEFLY]: {
    name: 'Defly Wallet',
    icon: '/wallet-icons/defly.svg',
    description: 'Mobile wallet with built-in DeFi features and swaps.',
    downloadUrl: 'https://defly.app/',
    type: 'mobile',
  },
  [WalletId.EXODUS]: {
    name: 'Exodus',
    icon: '/wallet-icons/exodus.svg',
    description: 'Multi-chain browser extension wallet.',
    downloadUrl: 'https://www.exodus.com/',
    type: 'extension',
  },
  [WalletId.KIBISIS]: {
    name: 'Kibisis',
    icon: '/wallet-icons/kibisis.svg',
    description: 'Privacy-focused browser extension wallet.',
    downloadUrl: 'https://kibis.is/',
    type: 'extension',
  },
};

interface MultiWalletProviderProps {
  children: ReactNode;
}

/**
 * MultiWalletProvider - Wraps the app with wallet functionality
 *
 * Provides:
 * - Connection to Pera, Lute, and Defly Wallets
 * - Transaction signing
 * - Account management
 * - TestNet support
 */
export function MultiWalletProvider({ children }: MultiWalletProviderProps) {
  return (
    <UseWalletProvider manager={walletManager}>
      {children}
    </UseWalletProvider>
  );
}

export { WalletId, NetworkId };
