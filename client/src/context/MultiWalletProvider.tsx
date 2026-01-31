/**
 * Multi-Wallet Provider Configuration
 *
 * Supports multiple Algorand wallets:
 * - Pera Wallet (Mobile & Web)
 * - Defly Wallet (Mobile & Web)
 * - Exodus (Browser Extension)
 * - Kibisis (Browser Extension)
 * - Lute (Web Wallet)
 *
 * Using @txnlab/use-wallet-react for unified wallet management
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
 * This manages all wallet connections and state
 */
export const walletManager = new WalletManager({
  wallets: [
    // Pera Wallet - Most popular Algorand mobile wallet
    WalletId.PERA,
    // Defly Wallet - Feature-rich mobile wallet with DeFi focus
    WalletId.DEFLY,
    // Exodus - Multi-chain browser extension wallet
    WalletId.EXODUS,
    // Kibisis - Algorand-focused browser extension
    WalletId.KIBISIS,
    // Lute - Web-based wallet (no extension needed)
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
    description: 'The most popular Algorand wallet. Available on iOS and Android.',
    downloadUrl: 'https://perawallet.app/',
    type: 'mobile',
  },
  [WalletId.DEFLY]: {
    name: 'Defly Wallet',
    icon: '/wallet-icons/defly.svg',
    description: 'DeFi-focused wallet with built-in swaps and portfolio tracking.',
    downloadUrl: 'https://defly.app/',
    type: 'mobile',
  },
  [WalletId.EXODUS]: {
    name: 'Exodus',
    icon: '/wallet-icons/exodus.svg',
    description: 'Multi-chain wallet supporting 100+ cryptocurrencies.',
    downloadUrl: 'https://www.exodus.com/',
    type: 'extension',
  },
  [WalletId.KIBISIS]: {
    name: 'Kibisis',
    icon: '/wallet-icons/kibisis.svg',
    description: 'Algorand-native browser extension with advanced features.',
    downloadUrl: 'https://kibis.is/',
    type: 'extension',
  },
  [WalletId.LUTE]: {
    name: 'Lute Wallet',
    icon: '/wallet-icons/lute.svg',
    description: 'Web-based wallet. No download required.',
    downloadUrl: 'https://lute.app/',
    type: 'web',
  },
};

interface MultiWalletProviderProps {
  children: ReactNode;
}

/**
 * MultiWalletProvider - Wraps the app with wallet functionality
 *
 * Provides:
 * - Connection to multiple wallet types
 * - Transaction signing
 * - Account management
 * - Network switching
 */
export function MultiWalletProvider({ children }: MultiWalletProviderProps) {
  return (
    <UseWalletProvider manager={walletManager}>
      {children}
    </UseWalletProvider>
  );
}

export { WalletId, NetworkId };
