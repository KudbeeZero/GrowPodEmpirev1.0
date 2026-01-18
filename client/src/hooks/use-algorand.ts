import { useMemo, useCallback } from 'react';
import algosdk from 'algosdk';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAlgorandContext, CONTRACT_CONFIG, algodClient } from '@/context/AlgorandContext';

export { CONTRACT_CONFIG } from '@/context/AlgorandContext';

// Pod/Plant status types
export type PodStage = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type PodStatus = 'empty' | 'seedling' | 'vegetative' | 'flowering' | 'mature' | 'harvest_ready' | 'dead' | 'needs_cleanup';

// Constants for cooldowns
export const WATER_COOLDOWN = 86400; // 24 hours in seconds
export const NUTRIENT_COOLDOWN = 21600; // 6 hours in seconds
export const MAX_PODS = 2; // Maximum pods per user

export interface GrowPod {
  id: number;
  name: string;
  stage: PodStage;
  waterCount: number;
  nutrientCount: number;
  lastWatered: number;
  lastNutrients: number;
  health: number;
  status: PodStatus;
  dna: string;
  terpeneProfile: string;
  minorProfile: string;
  pests: boolean;
  canWater: boolean;
  canAddNutrients: boolean;
  waterCooldownRemaining: number;
  nutrientCooldownRemaining: number;
}

export interface TokenBalances {
  budBalance: string;
  terpBalance: string;
  algoBalance: string;
}

const stageToStatus = (stage: number): PodStatus => {
  switch (stage) {
    case 0: return 'empty';
    case 1: return 'seedling';
    case 2: return 'vegetative';
    case 3: return 'flowering';
    case 4: return 'mature';
    case 5: return 'harvest_ready';
    case 6: return 'needs_cleanup';
    default: return 'empty';
  }
};

export function useAlgorand() {
  return useAlgorandContext();
}

export function useTokenBalances(account: string | null): TokenBalances {
  const { data: balances } = useQuery({
    queryKey: ['/api/balances', account],
    enabled: !!account && !!CONTRACT_CONFIG.budAssetId,
    queryFn: async (): Promise<TokenBalances> => {
      if (!account) return { budBalance: '0', terpBalance: '0', algoBalance: '0' };
      
      try {
        const accountInfo = await algodClient.accountInformation(account).do();
        
        let budBalance = '0';
        let terpBalance = '0';
        const algoBalance = String(accountInfo.amount || 0);
        
        const assets = accountInfo.assets || [];
        for (const asset of assets) {
          if (Number(asset.assetId) === CONTRACT_CONFIG.budAssetId) {
            budBalance = String(asset.amount || 0);
          }
          if (Number(asset.assetId) === CONTRACT_CONFIG.terpAssetId) {
            terpBalance = String(asset.amount || 0);
          }
        }
        
        return { budBalance, terpBalance, algoBalance };
      } catch (error) {
        console.error('Error fetching balances:', error);
        return { budBalance: '0', terpBalance: '0', algoBalance: '0' };
      }
    },
    refetchInterval: 10000,
  });
  
  return balances || { budBalance: '0', terpBalance: '0', algoBalance: '0' };
}

export function useGameState(account: string | null) {
  const balances = useTokenBalances(account);
  
  const { data: localState } = useQuery({
    queryKey: ['/api/local-state', account],
    enabled: !!account && !!CONTRACT_CONFIG.appId,
    queryFn: async () => {
      if (!account || !CONTRACT_CONFIG.appId) return null;
      
      try {
        const accountInfo = await algodClient.accountInformation(account).do();
        const appLocalStates = accountInfo.appsLocalState || [];
        
        for (const appState of appLocalStates) {
          if (Number(appState.id) === CONTRACT_CONFIG.appId) {
            const state: Record<string, number | string> = {};
            
            for (const kv of appState.keyValue || []) {
              const keyBytes = kv.key;
              const key = typeof keyBytes === 'string' ? atob(keyBytes) : new TextDecoder().decode(keyBytes);
              if (kv.value.type === 2) {
                state[key] = Number(kv.value.uint);
              } else {
                const bytes = kv.value.bytes;
                state[key] = typeof bytes === 'string' ? bytes : new TextDecoder().decode(bytes);
              }
            }
            
            return state;
          }
        }
        return null;
      } catch (error) {
        console.error('Error fetching local state:', error);
        return null;
      }
    },
    refetchInterval: 5000,
  });

  const pods: GrowPod[] = useMemo(() => {
    // Return empty array if no local state (user not connected or no active pod)
    if (!localState) {
      return [];
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    const result: GrowPod[] = [];
    
    // Helper to safely get number values with defaults
    const getNum = (key: string): number => {
      const val = localState[key];
      return typeof val === 'number' ? val : 0;
    };
    const getStr = (key: string): string => {
      const val = localState[key];
      return typeof val === 'string' ? val : '';
    };
    
    // Check for pod 1 (primary pod - from original local state keys)
    const stage1 = getNum('stage');
    const lastWatered1 = getNum('last_watered');
    const lastNutrients1 = getNum('last_nutrients');
    const timeSinceWater1 = lastWatered1 > 0 ? currentTime - lastWatered1 : WATER_COOLDOWN;
    const timeSinceNutrients1 = lastNutrients1 > 0 ? currentTime - lastNutrients1 : NUTRIENT_COOLDOWN;
    const canWater1 = lastWatered1 === 0 || timeSinceWater1 >= WATER_COOLDOWN;
    const canNutrients1 = lastNutrients1 === 0 || timeSinceNutrients1 >= NUTRIENT_COOLDOWN;
    const waterCooldown1 = canWater1 ? 0 : Math.max(0, WATER_COOLDOWN - timeSinceWater1);
    const nutrientCooldown1 = canNutrients1 ? 0 : Math.max(0, NUTRIENT_COOLDOWN - timeSinceNutrients1);
    
    // Always include pod 1 if stage >= 0 (representing a slot)
    result.push({
      id: 1,
      name: "GrowPod #001",
      stage: stage1 as PodStage,
      waterCount: getNum('water_count'),
      nutrientCount: getNum('nutrient_count'),
      lastWatered: lastWatered1 * 1000,
      lastNutrients: lastNutrients1 * 1000,
      health: stage1 === 6 ? 0 : 100,
      status: stageToStatus(stage1),
      dna: getStr('dna'),
      terpeneProfile: getStr('terpene_profile'),
      minorProfile: getStr('minor_profile'),
      pests: false,
      canWater: canWater1 && stage1 >= 1 && stage1 <= 4,
      canAddNutrients: canNutrients1 && stage1 >= 1 && stage1 <= 4,
      waterCooldownRemaining: waterCooldown1,
      nutrientCooldownRemaining: nutrientCooldown1,
    });
    
    // Check for pod 2 (secondary pod - with "_2" suffix in local state keys)
    const stage2 = getNum('stage_2');
    const lastWatered2 = getNum('last_watered_2');
    const lastNutrients2 = getNum('last_nutrients_2');
    const timeSinceWater2 = lastWatered2 > 0 ? currentTime - lastWatered2 : WATER_COOLDOWN;
    const timeSinceNutrients2 = lastNutrients2 > 0 ? currentTime - lastNutrients2 : NUTRIENT_COOLDOWN;
    const canWater2 = lastWatered2 === 0 || timeSinceWater2 >= WATER_COOLDOWN;
    const canNutrients2 = lastNutrients2 === 0 || timeSinceNutrients2 >= NUTRIENT_COOLDOWN;
    const waterCooldown2 = canWater2 ? 0 : Math.max(0, WATER_COOLDOWN - timeSinceWater2);
    const nutrientCooldown2 = canNutrients2 ? 0 : Math.max(0, NUTRIENT_COOLDOWN - timeSinceNutrients2);
    
    // Only add pod 2 if it exists (stage > 0)
    if (stage2 > 0) {
      result.push({
        id: 2,
        name: "GrowPod #002",
        stage: stage2 as PodStage,
        waterCount: getNum('water_count_2'),
        nutrientCount: getNum('nutrient_count_2'),
        lastWatered: lastWatered2 * 1000,
        lastNutrients: lastNutrients2 * 1000,
        health: stage2 === 6 ? 0 : 100,
        status: stageToStatus(stage2),
        dna: getStr('dna_2'),
        terpeneProfile: getStr('terpene_profile_2'),
        minorProfile: getStr('minor_profile_2'),
        pests: false,
        canWater: canWater2 && stage2 >= 1 && stage2 <= 4,
        canAddNutrients: canNutrients2 && stage2 >= 1 && stage2 <= 4,
        waterCooldownRemaining: waterCooldown2,
        nutrientCooldownRemaining: nutrientCooldown2,
      });
    }
    
    return result;
  }, [localState]);

  // Calculate active pods count - count any pod with stage > 0 (including needs_cleanup)
  const activePods = pods.filter(p => p.stage > 0).length;
  const canMintMorePods = activePods < MAX_PODS;

  return { 
    budBalance: balances.budBalance, 
    terpBalance: balances.terpBalance,
    algoBalance: balances.algoBalance,
    pods,
    localState,
    activePods,
    canMintMorePods,
    maxPods: MAX_PODS
  };
}

export function useInventory() {
  // Inventory will be loaded from blockchain/backend when implemented
  return [];
}

export function useSeeds() {
  // Seeds will be loaded from blockchain/backend when implemented
  return [];
}

export function formatTokenAmount(amount: string | number, decimals: number = 6): string {
  const val = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(val)) return '0.00';
  return (val / Math.pow(10, decimals)).toLocaleString(undefined, { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
}

export function formatCooldown(seconds: number): string {
  if (seconds <= 0) return 'Ready';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

// Transaction builder and submitter hook
export function useTransactions() {
  const { account, signTransactions } = useAlgorand();
  const queryClient = useQueryClient();

  const submitTransaction = async (signedTxns: Uint8Array[]): Promise<string> => {
    const result = await algodClient.sendRawTransaction(signedTxns).do();
    const txId = result.txid;
    await algosdk.waitForConfirmation(algodClient, txId, 4);
    return txId;
  };

  // Simple refresh function - uses current values from closure
  const refreshState = () => {
    // Invalidate all balance and state queries to force refresh
    queryClient.invalidateQueries({ queryKey: ['/api/balances', account] });
    queryClient.invalidateQueries({ queryKey: ['/api/local-state', account] });
    // Also refetch immediately
    queryClient.refetchQueries({ queryKey: ['/api/balances', account] });
    queryClient.refetchQueries({ queryKey: ['/api/local-state', account] });
  };

  // Helper to encode string to Uint8Array (browser-safe, no Buffer dependency)
  const encodeArg = (str: string) => new TextEncoder().encode(str);

  // Opt-in to the application
  const optInToApp = useCallback(async (): Promise<string | null> => {
    if (!account || !CONTRACT_CONFIG.appId) return null;
    
    try {
      const suggestedParams = await algodClient.getTransactionParams().do();
      
      const txn = algosdk.makeApplicationOptInTxnFromObject({
        sender: account,
        suggestedParams,
        appIndex: CONTRACT_CONFIG.appId,
      });
      
      const signedTxns = await signTransactions([txn]);
      const txId = await submitTransaction(signedTxns);
      refreshState();
      return txId;
    } catch (error) {
      console.error('Opt-in to app failed:', error);
      throw error;
    }
  }, [account, signTransactions]);

  // Opt-in to an ASA (asset)
  const optInToAsset = useCallback(async (assetId: number): Promise<string | null> => {
    if (!account || !assetId) return null;
    
    try {
      const suggestedParams = await algodClient.getTransactionParams().do();
      
      const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender: account,
        receiver: account,
        amount: BigInt(0),
        assetIndex: assetId,
        suggestedParams,
      });
      
      const signedTxns = await signTransactions([txn]);
      const txId = await submitTransaction(signedTxns);
      refreshState();
      return txId;
    } catch (error) {
      console.error('Opt-in to asset failed:', error);
      throw error;
    }
  }, [account, signTransactions]);

  // Mint a new GrowPod - calls "mint_pod" or "mint_pod_2" on the smart contract
  const mintPod = useCallback(async (podId: number = 1): Promise<string | null> => {
    if (!account) {
      throw new Error('Please connect your wallet first');
    }
    if (!CONTRACT_CONFIG.appId) {
      throw new Error('Contract not configured. App ID: ' + CONTRACT_CONFIG.appId);
    }
    
    try {
      const suggestedParams = await algodClient.getTransactionParams().do();
      
      // Use different app arg based on pod ID
      const appArg = podId === 2 ? 'mint_pod_2' : 'mint_pod';
      
      const txn = algosdk.makeApplicationNoOpTxnFromObject({
        sender: account,
        suggestedParams,
        appIndex: CONTRACT_CONFIG.appId,
        appArgs: [encodeArg(appArg)],
      });
      
      const signedTxns = await signTransactions([txn]);
      const txId = await submitTransaction(signedTxns);
      refreshState();
      return txId;
    } catch (error) {
      console.error('Mint pod failed:', error);
      throw error;
    }
  }, [account, signTransactions]);

  // Water a plant - calls "water" on the smart contract
  const waterPlant = useCallback(async (podId: number = 1): Promise<string | null> => {
    if (!account || !CONTRACT_CONFIG.appId) return null;
    
    try {
      const suggestedParams = await algodClient.getTransactionParams().do();
      
      // Use different app arg based on pod ID
      const appArg = podId === 2 ? 'water_2' : 'water';
      
      const txn = algosdk.makeApplicationNoOpTxnFromObject({
        sender: account,
        suggestedParams,
        appIndex: CONTRACT_CONFIG.appId,
        appArgs: [encodeArg(appArg)],
      });
      
      const signedTxns = await signTransactions([txn]);
      const txId = await submitTransaction(signedTxns);
      refreshState();
      return txId;
    } catch (error) {
      console.error('Water plant failed:', error);
      throw error;
    }
  }, [account, signTransactions]);

  // Add nutrients to a plant - calls "nutrients" on the smart contract (6h cooldown)
  const addNutrients = useCallback(async (podId: number = 1): Promise<string | null> => {
    if (!account || !CONTRACT_CONFIG.appId) return null;
    
    try {
      const suggestedParams = await algodClient.getTransactionParams().do();
      
      // Use different app arg based on pod ID
      const appArg = podId === 2 ? 'nutrients_2' : 'nutrients';
      
      const txn = algosdk.makeApplicationNoOpTxnFromObject({
        sender: account,
        suggestedParams,
        appIndex: CONTRACT_CONFIG.appId,
        appArgs: [encodeArg(appArg)],
      });
      
      const signedTxns = await signTransactions([txn]);
      const txId = await submitTransaction(signedTxns);
      refreshState();
      return txId;
    } catch (error) {
      console.error('Add nutrients failed:', error);
      throw error;
    }
  }, [account, signTransactions]);

  // Harvest a plant - calls "harvest" or "harvest_2" on the smart contract
  const harvestPlant = useCallback(async (podId: number = 1): Promise<string | null> => {
    if (!account || !CONTRACT_CONFIG.appId) return null;
    
    try {
      const suggestedParams = await algodClient.getTransactionParams().do();
      
      // Use different app arg based on pod ID
      const appArg = podId === 2 ? 'harvest_2' : 'harvest';
      
      const txn = algosdk.makeApplicationNoOpTxnFromObject({
        sender: account,
        suggestedParams,
        appIndex: CONTRACT_CONFIG.appId,
        appArgs: [encodeArg(appArg)],
        foreignAssets: CONTRACT_CONFIG.budAssetId ? [CONTRACT_CONFIG.budAssetId] : undefined,
      });
      
      const signedTxns = await signTransactions([txn]);
      const txId = await submitTransaction(signedTxns);
      refreshState();
      return txId;
    } catch (error) {
      console.error('Harvest failed:', error);
      throw error;
    }
  }, [account, signTransactions]);

  // Cleanup pod - requires burning 500 $BUD + 1 ALGO fee
  const cleanupPod = useCallback(async (podId: number = 1): Promise<string | null> => {
    if (!account || !CONTRACT_CONFIG.appId || !CONTRACT_CONFIG.budAssetId) return null;
    
    try {
      const suggestedParams = await algodClient.getTransactionParams().do();
      
      // Use different app arg based on pod ID
      const appArg = podId === 2 ? 'cleanup_2' : 'cleanup';
      
      // Transaction 1: Burn 500 $BUD (send to app address)
      const burnTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender: account,
        receiver: CONTRACT_CONFIG.appAddress,
        amount: BigInt(500000000), // 500 $BUD (6 decimals)
        assetIndex: CONTRACT_CONFIG.budAssetId,
        suggestedParams,
      });
      
      // Transaction 2: Send 1 ALGO fee
      const feeTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: account,
        receiver: CONTRACT_CONFIG.appAddress,
        amount: BigInt(1000000), // 1 ALGO
        suggestedParams,
      });
      
      // Transaction 3: Call cleanup on contract
      const appTxn = algosdk.makeApplicationNoOpTxnFromObject({
        sender: account,
        suggestedParams,
        appIndex: CONTRACT_CONFIG.appId,
        appArgs: [encodeArg(appArg)],
      });
      
      // Group the transactions
      const txns = [burnTxn, feeTxn, appTxn];
      algosdk.assignGroupID(txns);
      
      const signedTxns = await signTransactions(txns);
      const txId = await submitTransaction(signedTxns);
      refreshState();
      return txId;
    } catch (error) {
      console.error('Cleanup failed:', error);
      throw error;
    }
  }, [account, signTransactions]);

  // Breed plants - requires burning 1000 $BUD
  const breedPlants = useCallback(async (): Promise<string | null> => {
    if (!account || !CONTRACT_CONFIG.appId || !CONTRACT_CONFIG.budAssetId) return null;
    
    try {
      const suggestedParams = await algodClient.getTransactionParams().do();
      
      // Transaction 1: Burn 1000 $BUD
      const burnTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender: account,
        receiver: CONTRACT_CONFIG.appAddress,
        amount: BigInt(1000000000), // 1000 $BUD (6 decimals)
        assetIndex: CONTRACT_CONFIG.budAssetId,
        suggestedParams,
      });
      
      // Transaction 2: Call breed on contract
      const appTxn = algosdk.makeApplicationNoOpTxnFromObject({
        sender: account,
        suggestedParams,
        appIndex: CONTRACT_CONFIG.appId,
        appArgs: [encodeArg('breed')],
      });
      
      // Group the transactions
      const txns = [burnTxn, appTxn];
      algosdk.assignGroupID(txns);
      
      const signedTxns = await signTransactions(txns);
      const txId = await submitTransaction(signedTxns);
      refreshState();
      return txId;
    } catch (error) {
      console.error('Breed failed:', error);
      throw error;
    }
  }, [account, signTransactions]);

  // Check if user is opted into the app
  const checkAppOptedIn = useCallback(async (): Promise<boolean> => {
    if (!account || !CONTRACT_CONFIG.appId) return false;
    
    try {
      const accountInfo = await algodClient.accountInformation(account).do();
      const appsLocalState = accountInfo.appsLocalState || [];
      return appsLocalState.some((app) => Number(app.id) === CONTRACT_CONFIG.appId);
    } catch {
      return false;
    }
  }, [account]);

  // Check if user is opted into an asset
  const checkAssetOptedIn = useCallback(async (assetId: number): Promise<boolean> => {
    if (!account || !assetId) return false;
    
    try {
      const accountInfo = await algodClient.accountInformation(account).do();
      const assets = accountInfo.assets || [];
      return assets.some((asset) => Number(asset.assetId) === assetId);
    } catch {
      return false;
    }
  }, [account]);

  return {
    optInToApp,
    optInToAsset,
    mintPod,
    waterPlant,
    addNutrients,
    harvestPlant,
    cleanupPod,
    breedPlants,
    checkAppOptedIn,
    checkAssetOptedIn,
  };
}
