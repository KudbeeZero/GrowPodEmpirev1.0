import { useState, useEffect, useCallback } from 'react';
import { PeraWalletConnect } from '@perawallet/connect';
import algosdk from 'algosdk';
import { useToast } from './use-toast';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { api } from '@shared/routes';

export interface MockPod {
  id: number;
  stage: number;
  waterCount: number;
  lastWatered: number;
  health: number;
  status: 'active' | 'dead' | 'harvest_ready';
  dna: string;
  pests: boolean;
  name: string;
}

const peraWallet = new PeraWalletConnect({
  chainId: 416002,
});

export function useAlgorand() {
  const [account, setAccount] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    peraWallet.reconnectSession().then((accounts) => {
      if (accounts.length) {
        setAccount(accounts[0]);
        setIsConnected(true);
      }
    });
  }, []);

  const connectWallet = async () => {
    try {
      const accounts = await peraWallet.connect();
      setAccount(accounts[0]);
      setIsConnected(true);
      await fetch(api.users.login.path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: accounts[0] })
      });
      toast({ title: "Connected!" });
    } catch (error) {
      console.error(error);
    }
  };

  const disconnectWallet = async () => {
    await peraWallet.disconnect();
    setAccount(null);
    setIsConnected(false);
  };

  return { account, isConnected, connectWallet, disconnectWallet };
}

export function useGameState(account: string | null) {
  const { data: user } = useQuery({
    queryKey: ['/api/users', account],
    enabled: !!account,
    queryFn: async () => {
      const res = await fetch(`/api/users/${account}`);
      return res.json();
    }
  });

  const pods: MockPod[] = [
    { id: 1, name: "Alpha Kush", stage: 3, waterCount: 4, lastWatered: Date.now() - 3600000, health: 95, status: 'active', dna: '0xA1...', pests: false },
    { id: 4, name: "Golden Goat", stage: 5, waterCount: 10, lastWatered: Date.now(), health: 100, status: 'harvest_ready', dna: '0xD4...', pests: false },
  ];

  return { 
    budBalance: user?.budBalance || "0", 
    terpBalance: user?.terpBalance || "0", 
    pods 
  };
}

export function useInventory() {
  return [
    { id: 'item-1', name: 'Nutrient Pack A', count: 5, type: 'nutrient', icon: 'FlaskConical' },
    { id: 'item-2', name: 'Neem Oil', count: 2, type: 'pest_control', icon: 'Bug' },
    { id: 'item-3', name: 'pH Up', count: 1, type: 'ph_adjuster', icon: 'Droplets' },
  ];
}

export function useSeeds() {
  return [
    { id: 'seed-1', name: 'OG Kush Seed', dna: '0x123...', rarity: 'Common' },
    { id: 'seed-2', name: 'Sour Diesel Seed', dna: '0x456...', rarity: 'Rare' },
    { id: 'seed-3', name: 'Blue Dream Seed', dna: '0x789...', rarity: 'Epic' },
  ];
}
