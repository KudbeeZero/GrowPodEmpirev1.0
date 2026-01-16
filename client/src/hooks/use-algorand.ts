import { useState, useEffect, useCallback } from 'react';
import { PeraWalletConnect } from '@perawallet/connect';
import algosdk from 'algosdk';
import { useToast } from './use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@shared/routes';

// Mock Data Types
export interface MockPod {
  id: number;
  stage: number; // 0-5
  waterCount: number;
  lastWatered: number; // timestamp
  health: number; // 0-100
  status: 'active' | 'dead' | 'harvest_ready';
  dna: string;
  pests: boolean;
  name: string;
}

const peraWallet = new PeraWalletConnect({
  chainId: 416002, // TestNet
});

export function useAlgorand() {
  const [account, setAccount] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Reconnect to session on load
    peraWallet.reconnectSession().then((accounts) => {
      if (accounts.length) {
        setAccount(accounts[0]);
        setIsConnected(true);
      }
      
      // Cleanup on unmount
      peraWallet.connector?.on("disconnect", handleDisconnect);
    });

    return () => {
      peraWallet.connector?.off("disconnect", handleDisconnect);
    };
  }, []);

  const handleDisconnect = useCallback(() => {
    setAccount(null);
    setIsConnected(false);
    toast({
      title: "Disconnected",
      description: "Wallet disconnected successfully.",
    });
  }, [toast]);

  const connectWallet = async () => {
    try {
      const accounts = await peraWallet.connect();
      setAccount(accounts[0]);
      setIsConnected(true);
      
      // Sync user with backend
      await fetch(api.users.login.path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: accounts[0] })
      });
      
      toast({
        title: "Connected!",
        description: `Wallet: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
      });
    } catch (error) {
      if (error?.data?.type !== "CONNECT_MODAL_CLOSED") {
        console.error(error);
        toast({
          variant: "destructive",
          title: "Connection Failed",
          description: "Could not connect to Pera Wallet.",
        });
      }
    }
  };

  const disconnectWallet = async () => {
    await peraWallet.disconnect();
    handleDisconnect();
  };

  return {
    account,
    isConnected,
    connectWallet,
    disconnectWallet,
    peraWallet
  };
}

// Mock Hook for Game State (Simulating Smart Contract Reads)
export function useGameState(account: string | null) {
  // Return mocked data if no account, or specific data if account exists
  // In production, this would use useQuery to fetch from Algorand Indexer
  
  const [budBalance, setBudBalance] = useState(0);
  const [terpBalance, setTerpBalance] = useState(0);
  const [pods, setPods] = useState<MockPod[]>([]);

  useEffect(() => {
    if (!account) {
      // Demo Mode Data
      setBudBalance(1250);
      setTerpBalance(450);
      setPods([
        { id: 1, name: "Alpha Kush", stage: 3, waterCount: 4, lastWatered: Date.now() - 3600000, health: 95, status: 'active', dna: '0xA1...', pests: false },
        { id: 2, name: "Purple Haze", stage: 1, waterCount: 1, lastWatered: Date.now() - 90000000, health: 80, status: 'active', dna: '0xB2...', pests: true }, // Needs water
        { id: 3, name: "Dead Pod", stage: 2, waterCount: 2, lastWatered: Date.now() - 1000000000, health: 0, status: 'dead', dna: '0xC3...', pests: false },
        { id: 4, name: "Golden Goat", stage: 5, waterCount: 10, lastWatered: Date.now(), health: 100, status: 'harvest_ready', dna: '0xD4...', pests: false },
      ]);
    } else {
      // "Connected" User Mock Data
      setBudBalance(5000);
      setTerpBalance(1200);
      setPods([
         { id: 5, name: "Master OG", stage: 4, waterCount: 8, lastWatered: Date.now() - 10000, health: 98, status: 'active', dna: '0xE5...', pests: false },
      ]);
    }
  }, [account]);

  return { budBalance, terpBalance, pods };
}

// Mock Hook for Inventory
export function useInventory() {
  return [
    { id: 'item-1', name: 'Nutrient Pack A', count: 5, type: 'nutrient', icon: 'FlaskConical' },
    { id: 'item-2', name: 'Neem Oil', count: 2, type: 'pest_control', icon: 'Bug' },
    { id: 'item-3', name: 'pH Up', count: 1, type: 'ph_adjuster', icon: 'Droplets' },
  ];
}

// Mock Hook for Seeds
export function useSeeds() {
  return [
    { id: 'seed-1', name: 'OG Kush Seed', dna: '0x123...', rarity: 'Common' },
    { id: 'seed-2', name: 'Sour Diesel Seed', dna: '0x456...', rarity: 'Rare' },
    { id: 'seed-3', name: 'Blue Dream Seed', dna: '0x789...', rarity: 'Epic' },
  ];
}
