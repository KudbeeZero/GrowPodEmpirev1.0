import { useState, useEffect, useCallback, useMemo } from 'react';
import { PeraWalletConnect } from '@perawallet/connect';
import algosdk from 'algosdk';
import { useToast } from './use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@shared/routes';

// Algorand TestNet Configuration
const ALGOD_SERVER = 'https://testnet-api.algonode.cloud';
const ALGOD_TOKEN = '';
const CHAIN_ID = 416002;

// Contract Configuration (reads from environment variables)
export const CONTRACT_CONFIG = {
  appId: parseInt(import.meta.env.VITE_GROWPOD_APP_ID || '0'),
  budAssetId: parseInt(import.meta.env.VITE_BUD_ASSET_ID || '0'),
  terpAssetId: parseInt(import.meta.env.VITE_TERP_ASSET_ID || '0'),
  appAddress: import.meta.env.VITE_GROWPOD_APP_ADDRESS || '',
};

// Create Algorand client
const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, '');

// Pera Wallet instance
const peraWallet = new PeraWalletConnect({
  chainId: CHAIN_ID,
});

// Pod/Plant status types
export type PodStage = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type PodStatus = 'empty' | 'seedling' | 'vegetative' | 'flowering' | 'mature' | 'harvest_ready' | 'dead' | 'needs_cleanup';

export interface GrowPod {
  id: number;
  name: string;
  stage: PodStage;
  waterCount: number;
  lastWatered: number;
  health: number;
  status: PodStatus;
  dna: string;
  terpeneProfile: string;
  minorProfile: string;
  pests: boolean;
  canWater: boolean;
  waterCooldownRemaining: number;
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
  const [account, setAccount] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    peraWallet.reconnectSession().then((accounts) => {
      if (accounts.length) {
        setAccount(accounts[0]);
        setIsConnected(true);
      }
    }).catch(console.error);
  }, []);

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
    
    // Pera Wallet expects an array of transaction groups
    // Each group is an array of { txn: Transaction } objects
    const signedTxns = await peraWallet.signTransaction([
      txns.map(txn => ({ txn }))
    ]);
    
    // signedTxns is Uint8Array[] - the signed transaction blobs
    return signedTxns;
  }, [account]);

  return { 
    account, 
    isConnected, 
    isConnecting,
    connectWallet, 
    disconnectWallet,
    signTransactions,
    algodClient,
    peraWallet
  };
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
    
    const stage = (localState.stage as number) || 0;
    const lastWatered = (localState.last_watered as number) || 0;
    const currentTime = Math.floor(Date.now() / 1000);
    const timeSinceWater = currentTime - lastWatered;
    const canWater = lastWatered === 0 || timeSinceWater >= 86400;
    const cooldownRemaining = canWater ? 0 : Math.max(0, 86400 - timeSinceWater);
    
    return [{
      id: 1,
      name: "GrowPod #001",
      stage: stage as PodStage,
      waterCount: (localState.water_count as number) || 0,
      lastWatered: lastWatered * 1000,
      health: stage === 6 ? 0 : 100,
      status: stageToStatus(stage),
      dna: (localState.dna as string) || '',
      terpeneProfile: (localState.terpene_profile as string) || '',
      minorProfile: (localState.minor_profile as string) || '',
      pests: false,
      canWater: canWater && stage >= 1 && stage <= 4,
      waterCooldownRemaining: cooldownRemaining,
    }];
  }, [localState]);

  return { 
    budBalance: balances.budBalance, 
    terpBalance: balances.terpBalance,
    algoBalance: balances.algoBalance,
    pods,
    localState
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

  const refreshState = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/balances'] });
    queryClient.invalidateQueries({ queryKey: ['/api/local-state'] });
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

  // Mint a new GrowPod - calls "mint_pod" on the smart contract
  const mintPod = useCallback(async (): Promise<string | null> => {
    if (!account) {
      throw new Error('Please connect your wallet first');
    }
    if (!CONTRACT_CONFIG.appId) {
      throw new Error('Contract not configured. App ID: ' + CONTRACT_CONFIG.appId);
    }
    
    try {
      const suggestedParams = await algodClient.getTransactionParams().do();
      
      const txn = algosdk.makeApplicationNoOpTxnFromObject({
        sender: account,
        suggestedParams,
        appIndex: CONTRACT_CONFIG.appId,
        appArgs: [encodeArg('mint_pod')],
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
  const waterPlant = useCallback(async (): Promise<string | null> => {
    if (!account || !CONTRACT_CONFIG.appId) return null;
    
    try {
      const suggestedParams = await algodClient.getTransactionParams().do();
      
      const txn = algosdk.makeApplicationNoOpTxnFromObject({
        sender: account,
        suggestedParams,
        appIndex: CONTRACT_CONFIG.appId,
        appArgs: [encodeArg('water')],
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

  // Harvest a plant - calls "harvest" on the smart contract
  const harvestPlant = useCallback(async (): Promise<string | null> => {
    if (!account || !CONTRACT_CONFIG.appId) return null;
    
    try {
      const suggestedParams = await algodClient.getTransactionParams().do();
      
      const txn = algosdk.makeApplicationNoOpTxnFromObject({
        sender: account,
        suggestedParams,
        appIndex: CONTRACT_CONFIG.appId,
        appArgs: [encodeArg('harvest')],
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
  const cleanupPod = useCallback(async (): Promise<string | null> => {
    if (!account || !CONTRACT_CONFIG.appId || !CONTRACT_CONFIG.budAssetId) return null;
    
    try {
      const suggestedParams = await algodClient.getTransactionParams().do();
      
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
        appArgs: [encodeArg('cleanup')],
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
    harvestPlant,
    cleanupPod,
    breedPlants,
    checkAppOptedIn,
    checkAssetOptedIn,
  };
}
