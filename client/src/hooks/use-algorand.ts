import { useMemo, useCallback } from 'react';
import algosdk from 'algosdk';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAlgorandContext, CONTRACT_CONFIG, algodClient } from '@/context/AlgorandContext';
import { TESTNET_CONFIG, toRawAmount } from '@/data/testnetConfig';
import type { UserSeed, SeedBankItem } from '@shared/schema';

export { CONTRACT_CONFIG } from '@/context/AlgorandContext';

// Pod/Plant status types
export type PodStage = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type PodStatus = 'empty' | 'seedling' | 'vegetative' | 'flowering' | 'mature' | 'harvest_ready' | 'dead' | 'needs_cleanup';

// Re-export cooldowns from centralized config for backward compat
export const WATER_COOLDOWN = TESTNET_CONFIG.waterCooldownSeconds;
export const NUTRIENT_COOLDOWN = TESTNET_CONFIG.nutrientCooldownSeconds;
export const MAX_PODS = TESTNET_CONFIG.maxPods;

/** Get the correct smart contract method name for a given pod and action */
function getPodMethodName(podId: number, action: string): string {
  return podId === 2 ? `${action}_2` : action;
}

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
  pests: boolean;
  canWater: boolean;
  canAddNutrients: boolean;
  waterCooldownRemaining: number;
  nutrientCooldownRemaining: number;
}

export interface TokenBalances {
  budBalance: string;
  terpBalance: string;
  slotBalance: string;
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
      if (!account) return { budBalance: '0', terpBalance: '0', slotBalance: '0', algoBalance: '0' };
      
      try {
        const accountInfo = await algodClient.accountInformation(account).do();
        
        let budBalance = '0';
        let terpBalance = '0';
        let slotBalance = '0';
        const algoBalance = String(accountInfo.amount || 0);
        
        const assets = accountInfo.assets || [];
        for (const asset of assets) {
          if (Number(asset.assetId) === CONTRACT_CONFIG.budAssetId) {
            budBalance = String(asset.amount || 0);
          }
          if (Number(asset.assetId) === CONTRACT_CONFIG.terpAssetId) {
            terpBalance = String(asset.amount || 0);
          }
          if (Number(asset.assetId) === CONTRACT_CONFIG.slotAssetId) {
            slotBalance = String(asset.amount || 0);
          }
        }
        
        return { budBalance, terpBalance, slotBalance, algoBalance };
      } catch (error) {
        console.error('Error fetching balances:', error);
        return { budBalance: '0', terpBalance: '0', slotBalance: '0', algoBalance: '0' };
      }
    },
    refetchInterval: TESTNET_CONFIG.balanceRefetchInterval,
  });

  return balances || { budBalance: '0', terpBalance: '0', slotBalance: '0', algoBalance: '0' };
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
    refetchInterval: TESTNET_CONFIG.stateRefetchInterval,
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

    // Build a pod from local state keys, using an optional suffix for pod 2+
    const buildPod = (podId: number, suffix: string): GrowPod | null => {
      const stage = getNum(`stage${suffix}`);
      // Pod 1 always included; subsequent pods only if stage > 0
      if (podId > 1 && stage === 0) return null;

      const lastWatered = getNum(`last_watered${suffix}`);
      const lastNutrients = getNum(`last_nutrients${suffix}`);
      const timeSinceWater = lastWatered > 0 ? currentTime - lastWatered : WATER_COOLDOWN;
      const timeSinceNutrients = lastNutrients > 0 ? currentTime - lastNutrients : NUTRIENT_COOLDOWN;
      const canWater = lastWatered === 0 || timeSinceWater >= WATER_COOLDOWN;
      const canNutrients = lastNutrients === 0 || timeSinceNutrients >= NUTRIENT_COOLDOWN;
      const isGrowing = stage >= 1 && stage <= 4;

      return {
        id: podId,
        name: `GrowPod #${String(podId).padStart(3, '0')}`,
        stage: stage as PodStage,
        waterCount: getNum(`water_count${suffix}`),
        nutrientCount: getNum(`nutrient_count${suffix}`),
        lastWatered: lastWatered * 1000,
        lastNutrients: lastNutrients * 1000,
        health: stage === 6 ? 0 : 100,
        status: stageToStatus(stage),
        dna: getStr(`dna${suffix}`),
        terpeneProfile: getStr(`terpene_profile${suffix}`),
        pests: false,
        canWater: canWater && isGrowing,
        canAddNutrients: canNutrients && isGrowing,
        waterCooldownRemaining: canWater ? 0 : Math.max(0, WATER_COOLDOWN - timeSinceWater),
        nutrientCooldownRemaining: canNutrients ? 0 : Math.max(0, NUTRIENT_COOLDOWN - timeSinceNutrients),
      };
    };

    // Pod 1 uses base keys (no suffix), pod 2 uses "_2" suffix
    const pod1 = buildPod(1, '');
    if (pod1) result.push(pod1);
    const pod2 = buildPod(2, '_2');
    if (pod2) result.push(pod2);

    return result;
  }, [localState]);

  // Get harvest count and pod slots from local state
  const harvestCount = localState ? (typeof localState['harvest_count'] === 'number' ? localState['harvest_count'] : 0) : 0;
  const podSlots = localState ? (typeof localState['pod_slots'] === 'number' ? localState['pod_slots'] : 1) : 1;
  
  // Calculate active pods count - count any pod with stage > 0 (including needs_cleanup)
  const activePods = pods.filter(p => p.stage > 0).length;
  const canMintMorePods = activePods < podSlots;
  
  // Can claim slot token: when harvest count >= 5 (contract deducts 5 on each claim)
  const harvestsForNextSlot = harvestCount >= 5 ? 0 : 5 - harvestCount;
  const canClaimSlotToken = harvestCount >= 5;
  
  // Can unlock slot: has slot tokens and hasn't reached max
  const canUnlockSlot = podSlots < MAX_PODS;

  return {
    budBalance: balances.budBalance,
    terpBalance: balances.terpBalance,
    slotBalance: balances.slotBalance,
    algoBalance: balances.algoBalance,
    pods,
    localState,
    activePods,
    canMintMorePods,
    maxPods: MAX_PODS,
    podSlots,
    harvestCount,
    harvestsForNextSlot,
    canClaimSlotToken,
    canUnlockSlot,
  };
}

export function useInventory() {
  // Inventory will be loaded from blockchain/backend when implemented
  return [];
}

export function useSeeds(): (UserSeed & { seed: SeedBankItem })[] {
  const { account } = useAlgorandContext();

  const { data: seeds } = useQuery({
    queryKey: ['/api/user-seeds', account],
    enabled: !!account,
    queryFn: async (): Promise<(UserSeed & { seed: SeedBankItem })[]> => {
      if (!account) return [];
      const response = await fetch(`/api/user-seeds/${account}`);
      if (!response.ok) return [];
      return response.json();
    },
    staleTime: 30000,
  });

  return seeds || [];
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

  // Helper to get transaction params with retry
  const getParamsWithRetry = async (retries = 3): Promise<algosdk.SuggestedParams> => {
    for (let i = 0; i < retries; i++) {
      try {
        return await algodClient.getTransactionParams().do();
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
    throw new Error('Failed to get transaction parameters');
  };

  // Simple refresh function - uses current values from closure (non-blocking)
  const refreshState = () => {
    // Invalidate all balance and state queries to force refresh
    queryClient.invalidateQueries({ queryKey: ['/api/balances', account] });
    queryClient.invalidateQueries({ queryKey: ['/api/local-state', account] });
    // Refetch with a slight delay to allow blockchain to update
    setTimeout(() => {
      queryClient.refetchQueries({ queryKey: ['/api/balances', account] });
      queryClient.refetchQueries({ queryKey: ['/api/local-state', account] });
    }, 2000);
  };

  // Helper to encode string to Uint8Array (browser-safe, no Buffer dependency)
  const encodeArg = (str: string) => new TextEncoder().encode(str);

  // Opt-in to the application
  const optInToApp = useCallback(async (): Promise<string | null> => {
    if (!account || !CONTRACT_CONFIG.appId) return null;
    
    try {
      const suggestedParams = await getParamsWithRetry();
      
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
      const suggestedParams = await getParamsWithRetry();
      
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
      const suggestedParams = await getParamsWithRetry();
      
      const txn = algosdk.makeApplicationNoOpTxnFromObject({
        sender: account,
        suggestedParams,
        appIndex: CONTRACT_CONFIG.appId,
        appArgs: [encodeArg(getPodMethodName(podId, 'mint_pod'))],
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
  // Optional cooldownSeconds parameter (default: 600s / 10 minutes for TestNet)
  const waterPlant = useCallback(async (podId: number = 1, cooldownSeconds?: number): Promise<string | null> => {
    if (!account || !CONTRACT_CONFIG.appId) return null;
    
    try {
      const suggestedParams = await getParamsWithRetry();
      
      // Build app args array - include cooldown if provided
      const appArgs: Uint8Array[] = [encodeArg(getPodMethodName(podId, 'water'))];
      if (cooldownSeconds !== undefined) {
        // Encode cooldown as 8-byte big-endian uint64
        const cooldownBytes = new Uint8Array(8);
        const view = new DataView(cooldownBytes.buffer);
        view.setBigUint64(0, BigInt(cooldownSeconds), false); // false = big-endian
        appArgs.push(cooldownBytes);
      }
      
      const txn = algosdk.makeApplicationNoOpTxnFromObject({
        sender: account,
        suggestedParams,
        appIndex: CONTRACT_CONFIG.appId,
        appArgs,
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
      const suggestedParams = await getParamsWithRetry();
      
      const txn = algosdk.makeApplicationNoOpTxnFromObject({
        sender: account,
        suggestedParams,
        appIndex: CONTRACT_CONFIG.appId,
        appArgs: [encodeArg(getPodMethodName(podId, 'nutrients'))],
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
      const suggestedParams = await getParamsWithRetry();
      
      const txn = algosdk.makeApplicationNoOpTxnFromObject({
        sender: account,
        suggestedParams,
        appIndex: CONTRACT_CONFIG.appId,
        appArgs: [encodeArg(getPodMethodName(podId, 'harvest'))],
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

  // Cleanup pod - requires burning 500 $BUD
  const cleanupPod = useCallback(async (podId: number = 1): Promise<string | null> => {
    if (!account || !CONTRACT_CONFIG.appId || !CONTRACT_CONFIG.budAssetId) return null;

    try {
      const suggestedParams = await getParamsWithRetry();

      // Transaction 1: Burn cleanup cost in $BUD (send to app address)
      const burnTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender: account,
        receiver: CONTRACT_CONFIG.appAddress,
        amount: toRawAmount(TESTNET_CONFIG.economics.cleanupCost),
        assetIndex: CONTRACT_CONFIG.budAssetId,
        suggestedParams,
      });

      // Transaction 2: Call cleanup on contract (expects BUD burn at group_index - 1)
      const appTxn = algosdk.makeApplicationNoOpTxnFromObject({
        sender: account,
        suggestedParams,
        appIndex: CONTRACT_CONFIG.appId,
        appArgs: [encodeArg(getPodMethodName(podId, 'cleanup'))],
      });

      // Group the transactions
      const txns = [burnTxn, appTxn];
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
      const suggestedParams = await getParamsWithRetry();
      
      // Transaction 1: Burn breed cost in $BUD
      const burnTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender: account,
        receiver: CONTRACT_CONFIG.appAddress,
        amount: toRawAmount(TESTNET_CONFIG.economics.breedCost),
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

  // Claim a Slot Token - requires burning 2,500 $BUD and at least 5 total harvests
  const claimSlotToken = useCallback(async (): Promise<string | null> => {
    if (!account || !CONTRACT_CONFIG.appId || !CONTRACT_CONFIG.budAssetId || !CONTRACT_CONFIG.slotAssetId) return null;
    
    try {
      const suggestedParams = await getParamsWithRetry();
      
      // Transaction 1: Burn slot unlock cost in $BUD (send to app address)
      const burnTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender: account,
        receiver: CONTRACT_CONFIG.appAddress,
        amount: toRawAmount(TESTNET_CONFIG.economics.slotUnlockCost),
        assetIndex: CONTRACT_CONFIG.budAssetId,
        suggestedParams,
      });
      
      // Transaction 2: Call claim_slot_token on contract
      const appTxn = algosdk.makeApplicationNoOpTxnFromObject({
        sender: account,
        suggestedParams,
        appIndex: CONTRACT_CONFIG.appId,
        appArgs: [encodeArg('claim_slot_token')],
        foreignAssets: [CONTRACT_CONFIG.slotAssetId],
      });
      
      // Group the transactions
      const txns = [burnTxn, appTxn];
      algosdk.assignGroupID(txns);
      
      const signedTxns = await signTransactions(txns);
      const txId = await submitTransaction(signedTxns);
      refreshState();
      return txId;
    } catch (error) {
      console.error('Claim slot token failed:', error);
      throw error;
    }
  }, [account, signTransactions]);

  // Unlock a new pod slot - requires burning 1 Slot Token
  const unlockSlot = useCallback(async (): Promise<string | null> => {
    if (!account || !CONTRACT_CONFIG.appId || !CONTRACT_CONFIG.slotAssetId) return null;
    
    try {
      const suggestedParams = await getParamsWithRetry();
      
      // Transaction 1: Burn 1 Slot Token (send to app address)
      const burnTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender: account,
        receiver: CONTRACT_CONFIG.appAddress,
        amount: BigInt(1), // 1 Slot Token (0 decimals)
        assetIndex: CONTRACT_CONFIG.slotAssetId,
        suggestedParams,
      });
      
      // Transaction 2: Call unlock_slot on contract
      const appTxn = algosdk.makeApplicationNoOpTxnFromObject({
        sender: account,
        suggestedParams,
        appIndex: CONTRACT_CONFIG.appId,
        appArgs: [encodeArg('unlock_slot')],
      });
      
      // Group the transactions
      const txns = [burnTxn, appTxn];
      algosdk.assignGroupID(txns);
      
      const signedTxns = await signTransactions(txns);
      const txId = await submitTransaction(signedTxns);
      refreshState();
      return txId;
    } catch (error) {
      console.error('Unlock slot failed:', error);
      throw error;
    }
  }, [account, signTransactions]);

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
    claimSlotToken,
    unlockSlot,
  };
}
