/**
 * NFT Hooks for GrowPod Empire V2
 * Fetches and manages Seed NFTs and Biomass NFTs from Algorand
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import algosdk from 'algosdk';
import { useAlgorand, CONTRACT_CONFIG } from './use-algorand';
import { algodClient } from '@/context/AlgorandContext';
import type {
  SeedNFTMetadata,
  BiomassNFTMetadata,
  SeedProperties,
  BiomassProperties,
} from '@shared/nft-schemas';

// ============================================
// TYPES
// ============================================

export interface SeedNFT {
  assetId: number;
  name: string;
  unitName: string;
  metadata: SeedProperties | null;
  imageUrl: string | null;
}

export interface BiomassNFT {
  assetId: number;
  name: string;
  unitName: string;
  metadata: BiomassProperties | null;
  imageUrl: string | null;
  weightMg: number;
  budValue: bigint;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Parse note field from asset to extract metadata
 * (helper removed because it was unused)
 */
/**
 * Fetch ARC-69 metadata from asset note or URL
 */
async function fetchAssetMetadata(assetId: number): Promise<any | null> {
  try {
    const assetInfo = await algodClient.getAssetByID(assetId).do();

    // Try to get metadata from URL (IPFS)
    if (assetInfo.params.url) {
      const url = assetInfo.params.url.replace('ipfs://', 'https://ipfs.io/ipfs/');
      if (url.startsWith('http')) {
        const response = await fetch(url);
        if (response.ok) {
          return await response.json();
        }
      }
    }

    // Fallback: return empty object (note field not available in algosdk v3)
    return {};
  } catch (error) {
    console.error(`Error fetching metadata for asset ${assetId}:`, error);
    return null;
  }
}

// ============================================
// HOOKS
// ============================================

/**
 * Fetch all Seed NFTs owned by the user
 */
export function useSeedNFTs(account: string | null) {
  return useQuery({
    queryKey: ['/api/seed-nfts', account],
    enabled: !!account,
    queryFn: async (): Promise<SeedNFT[]> => {
      if (!account) return [];

      try {
        const accountInfo = await algodClient.accountInformation(account).do();
        const assets = accountInfo.assets || [];

        const seedNFTs: SeedNFT[] = [];

        for (const asset of assets) {
          // Only include assets with balance > 0
          if (asset.amount <= 0) continue;

          try {
            const assetInfo = await algodClient.getAssetByID(asset.assetId).do();
            const params = assetInfo.params;

            // Check if it's a SEED NFT
            if (params.unitName === 'SEED' && Number(params.total) === 1) {
              const metadata = await fetchAssetMetadata(Number(asset.assetId));

              seedNFTs.push({
                assetId: Number(asset.assetId),
                name: params.name || `Seed #${asset.assetId}`,
                unitName: params.unitName,
                metadata: metadata?.properties || null,
                imageUrl: metadata?.image?.replace('ipfs://', 'https://ipfs.io/ipfs/') || null,
              });
            }
          } catch (e) {
            console.error(`Error fetching asset ${asset.assetId}:`, e);
          }
        }

        return seedNFTs;
      } catch (error) {
        console.error('Error fetching seed NFTs:', error);
        return [];
      }
    },
    refetchInterval: 15000, // Refetch every 15 seconds
  });
}

/**
 * Fetch all Biomass NFTs owned by the user
 */
export function useBiomassNFTs(account: string | null) {
  return useQuery({
    queryKey: ['/api/biomass-nfts', account],
    enabled: !!account,
    queryFn: async (): Promise<BiomassNFT[]> => {
      if (!account) return [];

      try {
        const accountInfo = await algodClient.accountInformation(account).do();
        const assets = accountInfo.assets || [];

        const biomassNFTs: BiomassNFT[] = [];

        for (const asset of assets) {
          if (asset.amount <= 0) continue;

          try {
            const assetInfo = await algodClient.getAssetByID(asset.assetId).do();
            const params = assetInfo.params;

            // Check if it's a BIOMASS NFT
            if (params.unitName === 'BIOMASS' && Number(params.total) === 1) {
              const metadata = await fetchAssetMetadata(Number(asset.assetId));

              // Prefer weight from ARC-69 metadata properties (weight_mg), fall back to 0
              const rawWeight =
                (metadata?.properties as BiomassProperties | undefined)?.weight_mg;
              let weightMg: number;
              if (typeof rawWeight === 'string') {
                const parsed = parseInt(rawWeight, 10);
                weightMg = Number.isFinite(parsed) ? parsed : 0;
              } else if (typeof rawWeight === 'number') {
                weightMg = Number.isFinite(rawWeight) ? Math.floor(rawWeight) : 0;
              } else {
                weightMg = 0;
              }
              biomassNFTs.push({
                assetId: Number(asset.assetId),
                name: params.name || `Biomass #${asset.assetId}`,
                unitName: params.unitName,
                metadata: metadata?.properties || null,
                imageUrl: metadata?.image?.replace('ipfs://', 'https://ipfs.io/ipfs/') || null,
                weightMg,
                budValue: BigInt(weightMg),
              });
            }
          } catch (e) {
            console.error(`Error fetching asset ${asset.assetId}:`, e);
          }
        }

        return biomassNFTs;
      } catch (error) {
        console.error('Error fetching biomass NFTs:', error);
        return [];
      }
    },
    refetchInterval: 15000,
  });
}

/**
 * NFT Transaction hooks
 */
export function useNFTTransactions() {
  const { account, signTransactions } = useAlgorand();
  const queryClient = useQueryClient();

  const submitTransaction = async (signedTxns: Uint8Array[]): Promise<string> => {
    const result = await algodClient.sendRawTransaction(signedTxns).do();
    const txId = result.txid;
    await algosdk.waitForConfirmation(algodClient, txId, 4);
    return txId;
  };

  const refreshNFTs = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/seed-nfts', account] });
    queryClient.invalidateQueries({ queryKey: ['/api/biomass-nfts', account] });
    queryClient.invalidateQueries({ queryKey: ['/api/balances', account] });
    queryClient.invalidateQueries({ queryKey: ['/api/local-state', account] });
  };

  const encodeArg = (str: string) => new TextEncoder().encode(str);

  /**
   * Plant a Seed NFT in a pod
   */
  const plantSeed = useCallback(async (seedAssetId: number, podId: number = 1): Promise<string | null> => {
    if (!account || !CONTRACT_CONFIG.appId) return null;

    try {
      const suggestedParams = await algodClient.getTransactionParams().do();
      const appArg = podId === 2 ? 'plant_seed_2' : 'plant_seed';

      // Transaction 1: Transfer Seed NFT to contract
      const seedTransferTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender: account,
        receiver: CONTRACT_CONFIG.appAddress,
        amount: BigInt(1),
        assetIndex: seedAssetId,
        suggestedParams,
      });

      // Transaction 2: Call plant_seed on contract
      const appTxn = algosdk.makeApplicationNoOpTxnFromObject({
        sender: account,
        suggestedParams,
        appIndex: CONTRACT_CONFIG.appId,
        appArgs: [encodeArg(appArg)],
      });

      const txns = [seedTransferTxn, appTxn];
      algosdk.assignGroupID(txns);

      const signedTxns = await signTransactions(txns);
      const txId = await submitTransaction(signedTxns);

      setTimeout(refreshNFTs, 2000);
      return txId;
    } catch (error) {
      console.error('Plant seed failed:', error);
      throw error;
    }
  }, [account, signTransactions]);

  /**
   * Process a Biomass NFT to extract $BUD
   */
  const processBiomass = useCallback(async (biomassAssetId: number, weightMg: number): Promise<string | null> => {
    if (!account || !CONTRACT_CONFIG.appId) return null;

    try {
      const suggestedParams = await algodClient.getTransactionParams().do();

      // Transaction 1: Transfer Biomass NFT to contract (burns it)
      const biomassTransferTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender: account,
        receiver: CONTRACT_CONFIG.appAddress,
        amount: BigInt(1),
        assetIndex: biomassAssetId,
        suggestedParams,
      });

      // Transaction 2: Call process on contract with weight
      const weightBytes = new Uint8Array(8);
      const view = new DataView(weightBytes.buffer);
      view.setBigUint64(0, BigInt(weightMg), false);

      const appTxn = algosdk.makeApplicationNoOpTxnFromObject({
        sender: account,
        suggestedParams,
        appIndex: CONTRACT_CONFIG.appId,
        appArgs: [encodeArg('process'), weightBytes],
        foreignAssets: CONTRACT_CONFIG.budAssetId ? [CONTRACT_CONFIG.budAssetId] : undefined,
      });

      const txns = [biomassTransferTxn, appTxn];
      algosdk.assignGroupID(txns);

      const signedTxns = await signTransactions(txns);
      const txId = await submitTransaction(signedTxns);

      setTimeout(refreshNFTs, 2000);
      return txId;
    } catch (error) {
      console.error('Process biomass failed:', error);
      throw error;
    }
  }, [account, signTransactions]);

  /**
   * Mint a new Seed NFT from the seed bank
   */
  const mintSeed = useCallback(async (): Promise<string | null> => {
    if (!account || !CONTRACT_CONFIG.appId || !CONTRACT_CONFIG.budAssetId) return null;

    // NOTE: The current on-chain contract does not implement a `mint_seed` method.
    // To avoid submitting failing transactions, this action is temporarily disabled
    // until the contract supports it and TEAL is recompiled.
    console.warn('mintSeed is currently disabled: the smart contract does not expose a `mint_seed` method.');
    return null;
  }, [account, signTransactions]);

  /**
   * Breed two seeds to create a new unique seed
   */
  const breedSeeds = useCallback(async (seed1AssetId: number, seed2AssetId: number): Promise<string | null> => {
    if (!account || !CONTRACT_CONFIG.appId || !CONTRACT_CONFIG.budAssetId) return null;

    try {
      const suggestedParams = await algodClient.getTransactionParams().do();

      // Transaction 1: Pay 1000 $BUD breeding cost
      const paymentTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender: account,
        receiver: CONTRACT_CONFIG.appAddress,
        amount: BigInt(1000000000), // 1000 $BUD
        assetIndex: CONTRACT_CONFIG.budAssetId,
        suggestedParams,
      });

      // Transaction 2: Transfer Seed 1
      const seed1Txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender: account,
        receiver: CONTRACT_CONFIG.appAddress,
        amount: BigInt(1),
        assetIndex: seed1AssetId,
        suggestedParams,
      });

      // Transaction 3: Transfer Seed 2
      const seed2Txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender: account,
        receiver: CONTRACT_CONFIG.appAddress,
        amount: BigInt(1),
        assetIndex: seed2AssetId,
        suggestedParams,
      });

      // Transaction 4: Call breed on contract
      const appTxn = algosdk.makeApplicationNoOpTxnFromObject({
        sender: account,
        suggestedParams,
        appIndex: CONTRACT_CONFIG.appId,
        appArgs: [encodeArg('breed')],
      });

      const txns = [seed1Txn, seed2Txn, paymentTxn, appTxn];
      algosdk.assignGroupID(txns);

      const signedTxns = await signTransactions(txns);
      const txId = await submitTransaction(signedTxns);

      setTimeout(refreshNFTs, 2000);
      return txId;
    } catch (error) {
      console.error('Breed seeds failed:', error);
      throw error;
    }
  }, [account, signTransactions]);

  return {
    plantSeed,
    processBiomass,
    mintSeed,
    breedSeeds,
  };
}

/**
 * Format weight in milligrams to grams display
 */
export function formatWeight(weightMg: number): string {
  const grams = weightMg / 1000000;
  return `${grams.toFixed(2)}g`;
}

/**
 * Format $BUD value from weight
 */
export function formatBudFromWeight(weightMg: number): string {
  // 1mg = 1 micro-unit, so divide by 1,000,000 for display
  const bud = weightMg / 1000000;
  return bud.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
