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

// Contract Configuration (set these after deployment)
export const CONTRACT_CONFIG = {
  appId: 0, // Set after deployment
  budAssetId: 0, // $BUD ASA ID
  terpAssetId: 0, // $TERP ASA ID
  appAddress: '', // Application address
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

  const signTransactions = useCallback(async (txns: algosdk.Transaction[]) => {
    if (!account) throw new Error('Wallet not connected');
    
    const signedTxns = await peraWallet.signTransaction([
      txns.map(txn => ({ txn }))
    ]);
    
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
          if (asset['asset-id'] === CONTRACT_CONFIG.budAssetId) {
            budBalance = String(asset.amount || 0);
          }
          if (asset['asset-id'] === CONTRACT_CONFIG.terpAssetId) {
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
        const appLocalStates = accountInfo['apps-local-state'] || [];
        
        for (const appState of appLocalStates) {
          if (appState.id === CONTRACT_CONFIG.appId) {
            const state: Record<string, number | string> = {};
            
            for (const kv of appState['key-value'] || []) {
              const key = atob(kv.key);
              if (kv.value.type === 2) {
                state[key] = kv.value.uint;
              } else {
                state[key] = kv.value.bytes;
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
    if (!localState) {
      return [
        { 
          id: 1, 
          name: "Demo Pod #1", 
          stage: 3 as PodStage, 
          waterCount: 6, 
          lastWatered: Date.now() - 90000000, 
          health: 95, 
          status: 'flowering' as PodStatus, 
          dna: '0xA1B2...', 
          terpeneProfile: '',
          minorProfile: '',
          pests: false,
          canWater: true,
          waterCooldownRemaining: 0
        },
        { 
          id: 2, 
          name: "Demo Pod #2", 
          stage: 5 as PodStage, 
          waterCount: 10, 
          lastWatered: Date.now(), 
          health: 100, 
          status: 'harvest_ready' as PodStatus, 
          dna: '0xD4E5...', 
          terpeneProfile: '',
          minorProfile: '',
          pests: false,
          canWater: false,
          waterCooldownRemaining: 86400
        },
      ];
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
  return [
    { id: 'item-1', name: 'Nutrient Pack A', count: 5, type: 'nutrient', icon: 'FlaskConical', budCost: 100000000 },
    { id: 'item-2', name: 'Neem Oil', count: 2, type: 'pest_control', icon: 'Bug', budCost: 50000000 },
    { id: 'item-3', name: 'pH Up', count: 1, type: 'ph_adjuster', icon: 'Droplets', budCost: 25000000 },
    { id: 'item-4', name: 'Ladybugs', count: 3, type: 'pest_control', icon: 'Bug', budCost: 75000000 },
    { id: 'item-5', name: 'Potassium Bicarb', count: 2, type: 'fungicide', icon: 'Shield', budCost: 60000000 },
  ];
}

export function useSeeds() {
  return [
    { id: 'seed-1', name: 'Mystery Seed', dna: '???', rarity: 'Unknown', type: 'mystery' },
    { id: 'seed-2', name: 'OG Kush Hybrid', dna: '0x123...', rarity: 'Rare', type: 'hybrid' },
    { id: 'seed-3', name: 'Blue Dream x Sour D', dna: '0x456...', rarity: 'Epic', type: 'hybrid' },
  ];
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
