import { useMemo, useCallback } from 'react';
import algosdk from 'algosdk';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAlgorandContext, CONTRACT_CONFIG, algodClient } from '@/context/AlgorandContext';
import type { UserSeed, SeedBankItem } from '@shared/schema';

export { CONTRACT_CONFIG } from '@/context/AlgorandContext';

// Pod/Plant status types
export type PodStage = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type PodStatus = 'empty' | 'seedling' | 'vegetative' | 'flowering' | 'mature' | 'harvest_ready' | 'dead' | 'needs_cleanup';

// Constants for cooldowns (TestNet values - 10 minutes each)
export const WATER_COOLDOWN = 600; // 10 minutes in seconds (TestNet)
export const WATER_COOLDOWN_TESTNET = 600; // 10 minutes in seconds (TestNet)
export const NUTRIENT_COOLDOWN = 600; // 10 minutes in seconds (TestNet)
export const MAX_PODS = 5; // Maximum number of pods a player can have

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
    refetchInterval: 10000,
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
        pests: false,
        canWater: canWater2 && stage2 >= 1 && stage2 <= 4,
        canAddNutrients: canNutrients2 && stage2 >= 1 && stage2 <= 4,
        waterCooldownRemaining: waterCooldown2,
        nutrientCooldownRemaining: nutrientCooldown2,
      });
    }
    
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
  const canUnlockSlot = podSlots < 5;

  return { 
    budBalance: balances.budBalance, 
    terpBalance: balances.terpBalance,
    slotBalance: balances.slotBalance,
    algoBalance: balances.algoBalance,
    pods,
    localState,
    activePods,
    canMintMorePods,
    maxPods: 5,
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

// ABI method definitions matching contracts/artifacts/GrowPodEmpire.arc4.json
const ABI_METHODS = {
  optInToApplication: new algosdk.ABIMethod({ name: 'optInToApplication', args: [], returns: { type: 'void' } }),
  mintPod: new algosdk.ABIMethod({ name: 'mintPod', args: [], returns: { type: 'void' } }),
  mintPod2: new algosdk.ABIMethod({ name: 'mintPod2', args: [], returns: { type: 'void' } }),
  water: new algosdk.ABIMethod({ name: 'water', args: [{ type: 'uint64', name: 'cooldownSeconds' }], returns: { type: 'void' } }),
  water2: new algosdk.ABIMethod({ name: 'water2', args: [{ type: 'uint64', name: 'cooldownSeconds' }], returns: { type: 'void' } }),
  nutrients: new algosdk.ABIMethod({ name: 'nutrients', args: [], returns: { type: 'void' } }),
  nutrients2: new algosdk.ABIMethod({ name: 'nutrients2', args: [], returns: { type: 'void' } }),
  harvest: new algosdk.ABIMethod({ name: 'harvest', args: [], returns: { type: 'void' } }),
  harvest2: new algosdk.ABIMethod({ name: 'harvest2', args: [], returns: { type: 'void' } }),
  cleanup: new algosdk.ABIMethod({ name: 'cleanup', args: [{ type: 'axfer', name: 'budBurnTxn' }], returns: { type: 'void' } }),
  cleanup2: new algosdk.ABIMethod({ name: 'cleanup2', args: [{ type: 'axfer', name: 'budBurnTxn' }], returns: { type: 'void' } }),
  checkTerp: new algosdk.ABIMethod({ name: 'checkTerp', args: [], returns: { type: 'void' } }),
  checkTerp2: new algosdk.ABIMethod({ name: 'checkTerp2', args: [], returns: { type: 'void' } }),
  breed: new algosdk.ABIMethod({
    name: 'breed',
    args: [
      { type: 'axfer', name: 'seed1Txn' },
      { type: 'axfer', name: 'seed2Txn' },
      { type: 'uint64', name: 'seed1AssetId' },
      { type: 'uint64', name: 'seed2AssetId' },
    ],
    returns: { type: 'void' },
  }),
  claimSlotToken: new algosdk.ABIMethod({ name: 'claimSlotToken', args: [{ type: 'axfer', name: 'budBurnTxn' }], returns: { type: 'void' } }),
  unlockSlot: new algosdk.ABIMethod({ name: 'unlockSlot', args: [{ type: 'axfer', name: 'slotBurnTxn' }], returns: { type: 'void' } }),
};

// Transaction builder and submitter hook
export function useTransactions() {
  const { account, walletType, peraWallet, deflyWallet } = useAlgorand();
  const queryClient = useQueryClient();

  // Build an ATC-compatible TransactionSigner from Pera/Defly wallet
  const getSigner = useCallback((): algosdk.TransactionSigner => {
    if (!account || !walletType) throw new Error('Wallet not connected');

    return async (txnGroup: algosdk.Transaction[], indexesToSign: number[]): Promise<Uint8Array[]> => {
      // Build the signer array in Pera/Defly format:
      // { txn, signers: undefined } = sign this txn, { txn, signers: [] } = skip
      const signerTxns = txnGroup.map((txn, i) => ({
        txn,
        signers: indexesToSign.includes(i) ? undefined : ([] as string[]),
      }));

      let signedTxns: Uint8Array[];
      if (walletType === 'pera') {
        signedTxns = await peraWallet.signTransaction([signerTxns]);
      } else if (walletType === 'defly') {
        signedTxns = await deflyWallet.signTransaction([signerTxns]);
      } else {
        throw new Error('No wallet connected');
      }

      // ATC expects only the signed txns for the requested indexes
      return indexesToSign.map(i => signedTxns[i]);
    };
  }, [account, walletType, peraWallet, deflyWallet]);

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
    queryClient.invalidateQueries({ queryKey: ['/api/balances', account] });
    queryClient.invalidateQueries({ queryKey: ['/api/local-state', account] });
    setTimeout(() => {
      queryClient.refetchQueries({ queryKey: ['/api/balances', account] });
      queryClient.refetchQueries({ queryKey: ['/api/local-state', account] });
    }, 2000);
  };

  // Execute an ATC and return the first transaction ID
  const executeAtc = async (atc: algosdk.AtomicTransactionComposer): Promise<string> => {
    const result = await atc.execute(algodClient, 4);
    return result.txIDs[0];
  };

  // Opt-in to the application (ABI method call with OptIn onComplete)
  const optInToApp = useCallback(async (): Promise<string | null> => {
    if (!account || !CONTRACT_CONFIG.appId) return null;

    try {
      const suggestedParams = await getParamsWithRetry();
      const signer = getSigner();

      const atc = new algosdk.AtomicTransactionComposer();
      atc.addMethodCall({
        appID: CONTRACT_CONFIG.appId,
        method: ABI_METHODS.optInToApplication,
        methodArgs: [],
        sender: account,
        suggestedParams,
        signer,
        onComplete: algosdk.OnApplicationComplete.OptInOC,
      });

      const txId = await executeAtc(atc);
      refreshState();
      return txId;
    } catch (error) {
      console.error('Opt-in to app failed:', error);
      throw error;
    }
  }, [account, getSigner]);

  // Opt-in to an ASA (asset) - plain transaction, no ABI method
  const optInToAsset = useCallback(async (assetId: number): Promise<string | null> => {
    if (!account || !assetId) return null;

    try {
      const suggestedParams = await getParamsWithRetry();
      const signer = getSigner();

      const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender: account,
        receiver: account,
        amount: BigInt(0),
        assetIndex: assetId,
        suggestedParams,
      });

      const atc = new algosdk.AtomicTransactionComposer();
      atc.addTransaction({ txn, signer });

      const txId = await executeAtc(atc);
      refreshState();
      return txId;
    } catch (error) {
      console.error('Opt-in to asset failed:', error);
      throw error;
    }
  }, [account, getSigner]);

  // Mint a new GrowPod via ABI method call
  const mintPod = useCallback(async (podId: number = 1): Promise<string | null> => {
    if (!account) {
      throw new Error('Please connect your wallet first');
    }
    if (!CONTRACT_CONFIG.appId) {
      throw new Error('Contract not configured. App ID: ' + CONTRACT_CONFIG.appId);
    }

    try {
      const suggestedParams = await getParamsWithRetry();
      const signer = getSigner();

      const atc = new algosdk.AtomicTransactionComposer();
      atc.addMethodCall({
        appID: CONTRACT_CONFIG.appId,
        method: podId === 2 ? ABI_METHODS.mintPod2 : ABI_METHODS.mintPod,
        methodArgs: [],
        sender: account,
        suggestedParams,
        signer,
      });

      const txId = await executeAtc(atc);
      refreshState();
      return txId;
    } catch (error) {
      console.error('Mint pod failed:', error);
      throw error;
    }
  }, [account, getSigner]);

  // Water a plant via ABI method call with cooldown parameter
  const waterPlant = useCallback(async (podId: number = 1, cooldownSeconds: number = WATER_COOLDOWN): Promise<string | null> => {
    if (!account || !CONTRACT_CONFIG.appId) return null;

    try {
      const suggestedParams = await getParamsWithRetry();
      const signer = getSigner();

      const atc = new algosdk.AtomicTransactionComposer();
      atc.addMethodCall({
        appID: CONTRACT_CONFIG.appId,
        method: podId === 2 ? ABI_METHODS.water2 : ABI_METHODS.water,
        methodArgs: [cooldownSeconds],
        sender: account,
        suggestedParams,
        signer,
      });

      const txId = await executeAtc(atc);
      refreshState();
      return txId;
    } catch (error) {
      console.error('Water plant failed:', error);
      throw error;
    }
  }, [account, getSigner]);

  // Add nutrients via ABI method call
  const addNutrients = useCallback(async (podId: number = 1): Promise<string | null> => {
    if (!account || !CONTRACT_CONFIG.appId) return null;

    try {
      const suggestedParams = await getParamsWithRetry();
      const signer = getSigner();

      const atc = new algosdk.AtomicTransactionComposer();
      atc.addMethodCall({
        appID: CONTRACT_CONFIG.appId,
        method: podId === 2 ? ABI_METHODS.nutrients2 : ABI_METHODS.nutrients,
        methodArgs: [],
        sender: account,
        suggestedParams,
        signer,
      });

      const txId = await executeAtc(atc);
      refreshState();
      return txId;
    } catch (error) {
      console.error('Add nutrients failed:', error);
      throw error;
    }
  }, [account, getSigner]);

  // Harvest a plant via ABI method call (needs foreignAssets for inner BUD transfer)
  const harvestPlant = useCallback(async (podId: number = 1): Promise<string | null> => {
    if (!account || !CONTRACT_CONFIG.appId) return null;

    try {
      const suggestedParams = await getParamsWithRetry();
      const signer = getSigner();

      const atc = new algosdk.AtomicTransactionComposer();
      atc.addMethodCall({
        appID: CONTRACT_CONFIG.appId,
        method: podId === 2 ? ABI_METHODS.harvest2 : ABI_METHODS.harvest,
        methodArgs: [],
        sender: account,
        suggestedParams,
        signer,
        appForeignAssets: CONTRACT_CONFIG.budAssetId ? [CONTRACT_CONFIG.budAssetId] : undefined,
      });

      const txId = await executeAtc(atc);
      refreshState();
      return txId;
    } catch (error) {
      console.error('Harvest failed:', error);
      throw error;
    }
  }, [account, getSigner]);

  // Cleanup pod via ABI method call - preceding axfer burns 500 $BUD
  const cleanupPod = useCallback(async (podId: number = 1): Promise<string | null> => {
    if (!account || !CONTRACT_CONFIG.appId || !CONTRACT_CONFIG.budAssetId) return null;

    try {
      const suggestedParams = await getParamsWithRetry();
      const signer = getSigner();

      // Build the BUD burn transaction (passed as axfer arg to the ABI method)
      const burnTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender: account,
        receiver: CONTRACT_CONFIG.appAddress,
        amount: BigInt(500000000), // 500 $BUD (6 decimals)
        assetIndex: CONTRACT_CONFIG.budAssetId,
        suggestedParams,
      });

      const atc = new algosdk.AtomicTransactionComposer();
      atc.addMethodCall({
        appID: CONTRACT_CONFIG.appId,
        method: podId === 2 ? ABI_METHODS.cleanup2 : ABI_METHODS.cleanup,
        methodArgs: [{ txn: burnTxn, signer }], // axfer passed as TransactionWithSigner
        sender: account,
        suggestedParams,
        signer,
      });

      const txId = await executeAtc(atc);
      refreshState();
      return txId;
    } catch (error) {
      console.error('Cleanup failed:', error);
      throw error;
    }
  }, [account, getSigner]);

  // Breed plants via ABI method call - two seed NFT transfers + asset IDs
  const breedPlants = useCallback(async (seed1AssetId: number, seed2AssetId: number): Promise<string | null> => {
    if (!account || !CONTRACT_CONFIG.appId) return null;

    try {
      const suggestedParams = await getParamsWithRetry();
      const signer = getSigner();

      // Build seed 1 transfer
      const seed1Txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender: account,
        receiver: CONTRACT_CONFIG.appAddress,
        amount: BigInt(1),
        assetIndex: seed1AssetId,
        suggestedParams,
      });

      // Build seed 2 transfer
      const seed2Txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender: account,
        receiver: CONTRACT_CONFIG.appAddress,
        amount: BigInt(1),
        assetIndex: seed2AssetId,
        suggestedParams,
      });

      const atc = new algosdk.AtomicTransactionComposer();
      atc.addMethodCall({
        appID: CONTRACT_CONFIG.appId,
        method: ABI_METHODS.breed,
        methodArgs: [
          { txn: seed1Txn, signer },  // axfer: seed1
          { txn: seed2Txn, signer },  // axfer: seed2
          seed1AssetId,                // uint64: seed1AssetId
          seed2AssetId,                // uint64: seed2AssetId
        ],
        sender: account,
        suggestedParams,
        signer,
      });

      const txId = await executeAtc(atc);
      refreshState();
      return txId;
    } catch (error) {
      console.error('Breed failed:', error);
      throw error;
    }
  }, [account, getSigner]);

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

  // Claim a Slot Token via ABI method call - preceding axfer burns 2,500 $BUD
  const claimSlotToken = useCallback(async (): Promise<string | null> => {
    if (!account || !CONTRACT_CONFIG.appId || !CONTRACT_CONFIG.budAssetId || !CONTRACT_CONFIG.slotAssetId) return null;

    try {
      const suggestedParams = await getParamsWithRetry();
      const signer = getSigner();

      // Build the BUD burn transaction
      const burnTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender: account,
        receiver: CONTRACT_CONFIG.appAddress,
        amount: BigInt(2500000000), // 2,500 $BUD (6 decimals)
        assetIndex: CONTRACT_CONFIG.budAssetId,
        suggestedParams,
      });

      const atc = new algosdk.AtomicTransactionComposer();
      atc.addMethodCall({
        appID: CONTRACT_CONFIG.appId,
        method: ABI_METHODS.claimSlotToken,
        methodArgs: [{ txn: burnTxn, signer }], // axfer passed as TransactionWithSigner
        sender: account,
        suggestedParams,
        signer,
        appForeignAssets: [CONTRACT_CONFIG.slotAssetId],
      });

      const txId = await executeAtc(atc);
      refreshState();
      return txId;
    } catch (error) {
      console.error('Claim slot token failed:', error);
      throw error;
    }
  }, [account, getSigner]);

  // Unlock a new pod slot via ABI method call - preceding axfer burns 1 Slot Token
  const unlockSlot = useCallback(async (): Promise<string | null> => {
    if (!account || !CONTRACT_CONFIG.appId || !CONTRACT_CONFIG.slotAssetId) return null;

    try {
      const suggestedParams = await getParamsWithRetry();
      const signer = getSigner();

      // Build the Slot Token burn transaction
      const burnTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender: account,
        receiver: CONTRACT_CONFIG.appAddress,
        amount: BigInt(1), // 1 Slot Token (0 decimals)
        assetIndex: CONTRACT_CONFIG.slotAssetId,
        suggestedParams,
      });

      const atc = new algosdk.AtomicTransactionComposer();
      atc.addMethodCall({
        appID: CONTRACT_CONFIG.appId,
        method: ABI_METHODS.unlockSlot,
        methodArgs: [{ txn: burnTxn, signer }], // axfer passed as TransactionWithSigner
        sender: account,
        suggestedParams,
        signer,
      });

      const txId = await executeAtc(atc);
      refreshState();
      return txId;
    } catch (error) {
      console.error('Unlock slot failed:', error);
      throw error;
    }
  }, [account, getSigner]);

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
