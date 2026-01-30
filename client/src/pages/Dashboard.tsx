import { useAlgorand, useGameState, useTransactions, CONTRACT_CONFIG, MAX_PODS, WATER_COOLDOWN, WATER_COOLDOWN_TESTNET } from "@/hooks/use-algorand";
import { CurrencyDisplay } from "@/components/CurrencyDisplay";
import { PodCard } from "@/components/PodCard";
import { ShareButtons } from "@/components/ShareButtons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useNotifications, usePlantNotifications } from "@/hooks/use-notifications";
import { Plus, Sprout, Leaf, FlaskConical, Flame, Zap, Sparkles, TestTube2, Info, Coins, ExternalLink, Bell, BellOff, X, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { UserSeed, SeedBankItem } from "@shared/schema";

export default function Dashboard() {
  const { account, isConnected, connectWallet } = useAlgorand();
  const { budBalance, terpBalance, algoBalance, pods, activePods, canMintMorePods, maxPods, harvestCount } = useGameState(account);
  const { mintPod, waterPlant, addNutrients, harvestPlant, cleanupPod, optInToApp, optInToAsset, checkAppOptedIn, checkAssetOptedIn } = useTransactions();
  const { toast } = useToast();
  const { permission, isSupported, requestPermission } = useNotifications();
  const { scheduledCount } = usePlantNotifications(pods, isConnected);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isOptedInApp, setIsOptedInApp] = useState(false);
  const [isOptedInBud, setIsOptedInBud] = useState(false);
  const [isOptedInTerp, setIsOptedInTerp] = useState(false);
  const [fastModeEnabled, setFastModeEnabled] = useState(false);
  const [harvestDialogOpen, setHarvestDialogOpen] = useState(false);
  const [lastHarvestData, setLastHarvestData] = useState<{podId: number; budEarned: number; rareTerp: boolean; terpEarned: number} | null>(null);
  const [seedSelectOpen, setSeedSelectOpen] = useState(false);
  const [selectedSeed, setSelectedSeed] = useState<(UserSeed & { seed: SeedBankItem }) | null>(null);

  // Fetch user's seed inventory
  const { data: userSeeds = [], isLoading: loadingSeeds } = useQuery<(UserSeed & { seed: SeedBankItem })[]>({
    queryKey: ["/api/user-seeds", account],
    queryFn: async () => {
      if (!account) return [];
      const res = await fetch(`/api/user-seeds/${account}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!account,
  });

  // Mutation to use a seed from inventory
  const useSeedMutation = useMutation({
    mutationFn: async (seedId: number) => {
      return apiRequest("POST", `/api/user-seeds/${seedId}/use`, { walletAddress: account });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-seeds", account] });
    },
  });

  // Get the active cooldown based on Fast Mode toggle
  const activeWaterCooldown = fastModeEnabled ? WATER_COOLDOWN_TESTNET : WATER_COOLDOWN;
  
  const handleEnableNotifications = async () => {
    const granted = await requestPermission();
    if (granted) {
      toast({
        title: "Notifications Enabled",
        description: "You'll be reminded when your plants need water or are ready to harvest.",
      });
    } else {
      toast({
        title: "Notifications Blocked",
        description: "Enable notifications in your browser settings to receive reminders.",
        variant: "destructive",
      });
    }
  };

  const isContractConfigured = CONTRACT_CONFIG.appId > 0;

  useEffect(() => {
    const checkOptIns = async () => {
      if (!isConnected || !account) {
        setIsOptedInApp(false);
        setIsOptedInBud(false);
        setIsOptedInTerp(false);
        return;
      }
      
      try {
        const [appOptedIn, budOptedIn, terpOptedIn] = await Promise.all([
          checkAppOptedIn(),
          CONTRACT_CONFIG.budAssetId > 0 ? checkAssetOptedIn(CONTRACT_CONFIG.budAssetId) : Promise.resolve(false),
          CONTRACT_CONFIG.terpAssetId > 0 ? checkAssetOptedIn(CONTRACT_CONFIG.terpAssetId) : Promise.resolve(false),
        ]);
        setIsOptedInApp(appOptedIn);
        setIsOptedInBud(budOptedIn);
        setIsOptedInTerp(terpOptedIn);
      } catch (error) {
        console.error('Error checking opt-ins:', error);
      }
    };
    
    checkOptIns();
  }, [isConnected, account, checkAppOptedIn, checkAssetOptedIn]);

  const handleOptIn = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet Required",
        description: "Please connect your Pera Wallet first.",
        variant: "destructive",
      });
      return;
    }
    
    setIsActionLoading(true);
    
    try {
      if (!isOptedInApp) {
        toast({
          title: "Opting into Contract...",
          description: "Sign the transaction in your Pera Wallet.",
        });
        await optInToApp();
        setIsOptedInApp(true);
      }
      
      if (!isOptedInBud && CONTRACT_CONFIG.budAssetId > 0) {
        toast({
          title: "Opting into $BUD Token...",
          description: "Sign the transaction in your Pera Wallet.",
        });
        await optInToAsset(CONTRACT_CONFIG.budAssetId);
        setIsOptedInBud(true);
      }
      
      if (!isOptedInTerp && CONTRACT_CONFIG.terpAssetId > 0) {
        toast({
          title: "Opting into $TERP Token...",
          description: "Sign the transaction in your Pera Wallet.",
        });
        await optInToAsset(CONTRACT_CONFIG.terpAssetId);
        setIsOptedInTerp(true);
      }
      
      toast({
        title: "Setup Complete!",
        description: "You can now mint your first GrowPod!",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Transaction failed';
      toast({
        title: "Opt-in Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const needsOptIn = isConnected && (!isOptedInApp || !isOptedInBud || !isOptedInTerp);

  const openSeedSelect = () => {
    if (!isConnected) {
      toast({
        title: "Wallet Required",
        description: "Please connect your Pera Wallet first.",
        variant: "destructive",
      });
      return;
    }
    
    if (!isContractConfigured) {
      toast({
        title: "Contract Not Deployed",
        description: "The smart contract has not been deployed yet. Set VITE_GROWPOD_APP_ID environment variable.",
        variant: "destructive",
      });
      return;
    }

    if (needsOptIn) {
      toast({
        title: "Setup Required",
        description: "Please complete the setup first by opting into the contract and tokens.",
        variant: "destructive",
      });
      return;
    }

    if (!canMintMorePods) {
      toast({
        title: "Pod Limit Reached",
        description: `You can only have ${maxPods} active pods at a time. Harvest or cleanup existing pods first.`,
        variant: "destructive",
      });
      return;
    }
    
    setSeedSelectOpen(true);
  };

  const handleMintPod = async (useSeed: (UserSeed & { seed: SeedBankItem }) | null = null) => {
    setSeedSelectOpen(false);
    setIsActionLoading(true);
    
    const seedName = useSeed ? useSeed.seed.name : "Mystery Seed";
    toast({
      title: `Planting ${seedName}...`,
      description: "Sign the transaction in your Pera Wallet.",
    });
    
    try {
      // If using a premium seed, consume it from inventory
      if (useSeed) {
        await useSeedMutation.mutateAsync(useSeed.seedId);
      }
      
      // Determine which pod slot to use - find the first empty slot
      const pod1Empty = pods.find(p => p.id === 1)?.stage === 0 || !pods.find(p => p.id === 1);
      const podIdToMint = pod1Empty ? 1 : 2;
      
      const txId = await mintPod(podIdToMint);
      toast({
        title: `${seedName} Planted!`,
        description: `Pod #${podIdToMint} is now growing${useSeed?.seed.growthBonus ? ` with +${useSeed.seed.growthBonus}% yield bonus` : ''}! TX: ${txId?.slice(0, 8)}...`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Transaction failed';
      toast({
        title: "Plant Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(false);
      setSelectedSeed(null);
    }
  };

  const handleWater = async (id: number) => {
    if (!isConnected) {
      toast({
        title: "Wallet Required",
        description: "Please connect your Pera Wallet first.",
        variant: "destructive",
      });
      return;
    }
    
    if (!isContractConfigured) {
      toast({
        title: "Contract Not Deployed",
        description: "The smart contract has not been deployed yet.",
        variant: "destructive",
      });
      return;
    }
    
    setIsActionLoading(true);
    toast({
      title: "Watering Plant...",
      description: `Sign the transaction to water Pod #${id}.`,
    });
    
    try {
      // Pass the cooldown based on Fast Mode toggle
      const txId = await waterPlant(id, activeWaterCooldown);
      toast({
        title: "Watered Successfully!",
        description: `Your plant is growing. Next water in 10 min. TX: ${txId?.slice(0, 8)}...`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Transaction failed';
      toast({
        title: "Water Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleNutrients = async (id: number) => {
    if (!isConnected) {
      toast({
        title: "Wallet Required",
        description: "Please connect your Pera Wallet first.",
        variant: "destructive",
      });
      return;
    }
    
    if (!isContractConfigured) {
      toast({
        title: "Contract Not Deployed",
        description: "The smart contract has not been deployed yet.",
        variant: "destructive",
      });
      return;
    }
    
    setIsActionLoading(true);
    toast({
      title: "Adding Nutrients...",
      description: `Sign the transaction to feed Pod #${id}.`,
    });
    
    try {
      const txId = await addNutrients(id);
      toast({
        title: "Nutrients Added!",
        description: `Your plant is getting stronger. Next feed in 10 min. TX: ${txId?.slice(0, 8)}...`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Transaction failed';
      toast({
        title: "Feed Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleHarvest = async (id: number) => {
    if (!isConnected) {
      toast({
        title: "Wallet Required",
        description: "Please connect your Pera Wallet first.",
        variant: "destructive",
      });
      return;
    }
    
    if (!isContractConfigured) {
      toast({
        title: "Contract Not Deployed",
        description: "The smart contract has not been deployed yet.",
        variant: "destructive",
      });
      return;
    }
    
    setIsActionLoading(true);
    toast({
      title: "Harvesting...",
      description: `Calculating yield for Pod #${id}...`,
    });
    
    try {
      const txId = await harvestPlant(id);
      const pod = pods.find(p => p.id === id);
      const waterBonus = pod && pod.waterCount > 10 ? (pod.waterCount - 10) * 10 : 0;
      const nutrientBonus = pod && pod.nutrientCount > 10 ? (pod.nutrientCount - 10) * 5 : 0;
      const estimatedBud = 100 + waterBonus + nutrientBonus;
      
      setLastHarvestData({
        podId: id,
        budEarned: estimatedBud,
        rareTerp: false,
        terpEarned: 0,
      });
      setHarvestDialogOpen(true);
      
      toast({
        title: "Harvest Complete!",
        description: `Pod #${id} harvested! You received ~${estimatedBud} $BUD! TX: ${txId?.slice(0, 8)}...`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Transaction failed';
      toast({
        title: "Harvest Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCleanup = async (id: number) => {
    if (!isConnected) {
      toast({
        title: "Wallet Required",
        description: "Please connect your Pera Wallet first.",
        variant: "destructive",
      });
      return;
    }
    
    if (!isContractConfigured) {
      toast({
        title: "Contract Not Deployed",
        description: "The smart contract has not been deployed yet.",
        variant: "destructive",
      });
      return;
    }
    
    setIsActionLoading(true);
    toast({
      title: "Cleaning Pod...",
      description: "This will burn 500 $BUD.",
    });
    
    try {
      const txId = await cleanupPod(id);
      toast({
        title: "Pod Cleaned!",
        description: `Pod #${id} is ready for new planting. TX: ${txId?.slice(0, 8)}...`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Transaction failed';
      toast({
        title: "Cleanup Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSmokeBud = () => {
    toast({
      title: "Entourage Effect Activated!",
      description: "10% yield boost applied to your next harvest. Terpene profile analyzed.",
    });
  };

  return (
    <div className="min-h-screen pb-20">
      <section className="relative pt-12 pb-12 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-8">
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">
                Command Center
              </h1>
              <p className="text-muted-foreground text-lg">
                Manage your hydroponic empire on Algorand TestNet.
              </p>
            </div>
            
            <div className="flex flex-col gap-4">
              <CurrencyDisplay 
                budAmount={budBalance} 
                terpAmount={terpBalance} 
                algoAmount={algoBalance}
              />
            </div>
          </div>

          {!isConnected && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-primary/10 border border-primary/20 rounded-xl p-6 mb-8 flex items-center justify-between backdrop-blur-sm"
              data-testid="connect-wallet-banner"
            >
              <div>
                <h3 className="text-primary font-bold flex items-center gap-2">
                  <Sprout className="h-5 w-5" />
                  Welcome to GrowPod Empire
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Connect your Pera Wallet to start growing on Algorand TestNet.
                </p>
              </div>
              <Button 
                onClick={connectWallet} 
                className="bg-primary hover:bg-primary/90"
                data-testid="button-connect-wallet-banner"
              >
                Connect Wallet
              </Button>
            </motion.div>
          )}

          {needsOptIn && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 backdrop-blur-sm"
              data-testid="opt-in-banner"
            >
              <div>
                <h3 className="text-amber-500 font-bold flex items-center gap-2">
                  <Sprout className="h-5 w-5" />
                  Setup Required
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Opt into the smart contract and tokens to start playing. This is a one-time setup.
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Need TestNet ALGO?{' '}
                  <a 
                    href="https://bank.testnet.algorand.network/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                    data-testid="link-faucet"
                  >
                    Get free ALGO from the faucet <ExternalLink className="h-3 w-3" />
                  </a>
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className={`text-xs px-2 py-1 rounded ${isOptedInApp ? 'bg-green-500/20 text-green-400' : 'bg-muted text-muted-foreground'}`}>
                    Contract: {isOptedInApp ? 'Ready' : 'Not opted in'}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${isOptedInBud ? 'bg-green-500/20 text-green-400' : 'bg-muted text-muted-foreground'}`}>
                    $BUD: {isOptedInBud ? 'Ready' : 'Not opted in'}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${isOptedInTerp ? 'bg-green-500/20 text-green-400' : 'bg-muted text-muted-foreground'}`}>
                    $TERP: {isOptedInTerp ? 'Ready' : 'Not opted in'}
                  </span>
                </div>
              </div>
              <Button 
                onClick={handleOptIn} 
                className="bg-amber-500 hover:bg-amber-600 text-amber-950"
                disabled={isActionLoading}
                data-testid="button-opt-in"
              >
                {isActionLoading ? 'Signing...' : 'Complete Setup'}
              </Button>
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="bg-card/40 border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Plant a Seed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full bg-primary hover:bg-primary/90"
                  onClick={openSeedSelect}
                  disabled={isActionLoading || !canMintMorePods}
                  data-testid="button-mint-pod"
                >
                  <Plus className="mr-2 h-4 w-4" /> Plant Now
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Pods: {activePods}/{maxPods} {!canMintMorePods && <span className="text-amber-500">(Max reached)</span>}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/40 border-purple-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-500" />
                  Smoke $BUD
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline"
                  className="w-full border-orange-500/50 text-orange-500 hover:bg-orange-500/10"
                  onClick={handleSmokeBud}
                  data-testid="button-smoke-bud"
                >
                  <Leaf className="mr-2 h-4 w-4" /> Activate Buff
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Entourage effect: +10% yield boost
                </p>
              </CardContent>
            </Card>

            <Link href="/lab">
              <Card className="bg-card/40 border-blue-500/20 cursor-pointer hover:border-blue-500/50 transition-colors h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <FlaskConical className="h-4 w-4 text-blue-500" />
                    Combiner Lab
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="outline"
                    className="w-full border-blue-500/50 text-blue-500 hover:bg-blue-500/10"
                    data-testid="button-breed"
                  >
                    <Zap className="mr-2 h-4 w-4" /> Breed Plants
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Combine DNA for hybrid seeds (1000 $BUD)
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Card className="bg-card/40 border-emerald-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Sprout className="h-4 w-4 text-emerald-500" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Active Pods:</span>
                    <span className="font-mono">{activePods}/{maxPods}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Ready to Harvest:</span>
                    <span className="font-mono text-amber-500">{pods.filter(p => p.status === 'harvest_ready').length}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Need Water:</span>
                    <span className="font-mono text-blue-400">{pods.filter(p => p.canWater).length}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Need Nutrients:</span>
                    <span className="font-mono text-green-400">{pods.filter(p => p.canAddNutrients).length}</span>
                  </div>
                </div>
                
                <div className="mt-4 pt-3 border-t border-white/10">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <Coins className="h-3.5 w-3.5 text-yellow-500" />
                      <span className="text-xs text-muted-foreground">Pod Slots</span>
                    </div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button 
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          data-testid="button-slot-info"
                        >
                          <Info className="h-4 w-4" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 text-sm" side="top">
                        <div className="space-y-3">
                          <h4 className="font-semibold text-foreground flex items-center gap-2">
                            <Coins className="h-4 w-4 text-yellow-500" />
                            How Slot Tokens Work
                          </h4>
                          <p className="text-muted-foreground">
                            Slot Tokens let you unlock more grow pod slots (up to 5 total). Here's how to earn them:
                          </p>
                          <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground">
                            <li><span className="text-foreground font-medium">Harvest 5 plants</span> - your harvest count builds up over time</li>
                            <li><span className="text-foreground font-medium">Burn 2,500 $BUD</span> - pay to claim your Slot Token</li>
                            <li><span className="text-foreground font-medium">Token appears in wallet</span> - it's a real Algorand asset!</li>
                            <li><span className="text-foreground font-medium">Burn 1 Slot Token</span> - unlocks a new pod slot</li>
                          </ol>
                          <p className="text-xs text-muted-foreground/70 pt-2 border-t border-white/10">
                            You start with 2 slots and can unlock up to 5 total. Slot Tokens are tradeable ASAs that stay in your wallet until burned.
                          </p>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Current Slots:</span>
                    <span className="font-mono text-yellow-500">{maxPods}/5</span>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-white/10">
                  <label 
                    className="flex items-center gap-2 cursor-pointer group"
                    data-testid="label-fast-mode"
                  >
                    <Checkbox 
                      checked={fastModeEnabled}
                      onCheckedChange={(checked) => setFastModeEnabled(checked === true)}
                      data-testid="checkbox-fast-mode"
                    />
                    <div className="flex items-center gap-1.5">
                      <TestTube2 className="h-3.5 w-3.5 text-cyan-400" />
                      <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                        Fast Mode (TestNet)
                      </span>
                    </div>
                  </label>
                  <p className="text-xs text-muted-foreground/60 mt-1 ml-6">
                    10 min water cooldown
                  </p>
                </div>
                
                {isSupported && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    {permission === 'granted' ? (
                      <div className="flex items-center gap-2 text-xs text-green-400">
                        <Bell className="h-3.5 w-3.5" />
                        <span>Reminders on ({scheduledCount} scheduled)</span>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs h-7 text-muted-foreground hover:text-foreground"
                        onClick={handleEnableNotifications}
                        data-testid="button-enable-notifications"
                      >
                        <BellOff className="h-3.5 w-3.5 mr-1.5" />
                        Enable Water Reminders
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-display font-semibold flex items-center gap-2">
              <Sprout className="text-primary" /> Active Grow Pods
            </h2>
            <Link href="/vault">
              <Button 
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 group"
                data-testid="button-seed-vault"
              >
                <Plus className="mr-2 h-4 w-4 group-hover:rotate-90 transition-transform" /> 
                Plant New Seed
              </Button>
            </Link>
          </div>

          {pods.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {pods.map((pod) => (
                <PodCard 
                  key={pod.id} 
                  pod={pod} 
                  onWater={handleWater}
                  onNutrients={handleNutrients}
                  onHarvest={handleHarvest}
                  onCleanup={handleCleanup}
                  isLoading={isActionLoading}
                />
              ))}
              
              {canMintMorePods && (
                <div 
                  onClick={openSeedSelect}
                  className="group relative border-2 border-dashed border-white/10 rounded-xl p-6 flex flex-col items-center justify-center min-h-[300px] hover:border-primary/50 hover:bg-white/5 transition-all cursor-pointer"
                  data-testid="button-mint-empty-slot"
                >
                  <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform group-hover:bg-primary/20">
                    <Plus className="h-8 w-8 text-muted-foreground group-hover:text-primary" />
                  </div>
                  <h3 className="font-display font-bold text-muted-foreground group-hover:text-foreground">Plant a Seed</h3>
                  <p className="text-sm text-muted-foreground/50 mt-1">Choose mystery or premium seeds</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-card/20 rounded-2xl border border-white/5">
              <Sprout className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-xl font-bold text-muted-foreground">No Active Pods</h3>
              <p className="text-muted-foreground/70 mt-2 mb-6">Your hydroponic garden is empty.</p>
              <Button onClick={openSeedSelect} data-testid="button-mint-first-pod">
                <Plus className="mr-2 h-4 w-4" /> Plant Your First Seed
              </Button>
            </div>
          )}
        </div>
      </section>

      <Dialog open={harvestDialogOpen} onOpenChange={setHarvestDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <Sprout className="h-6 w-6 text-primary" />
              Harvest Complete!
            </DialogTitle>
            <DialogDescription>
              Your estimated rewards are based on care provided during growth.
            </DialogDescription>
          </DialogHeader>
          {lastHarvestData && (
            <div className="space-y-4">
              <div className="bg-card rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Pod</span>
                  <span className="font-bold">#{lastHarvestData.podId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Est. $BUD Earned</span>
                  <span className="font-bold text-emerald-400">~{lastHarvestData.budEarned}</span>
                </div>
                {lastHarvestData.rareTerp && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <FlaskConical className="h-4 w-4 text-purple-400" />
                      Rare Terpene!
                    </span>
                    <span className="font-bold text-purple-400">+{lastHarvestData.terpEarned} $TERP</span>
                  </div>
                )}
              </div>
              
              <div className="pt-2">
                <p className="text-sm text-muted-foreground mb-3">Share your harvest with the world!</p>
                <ShareButtons 
                  harvestAmount={lastHarvestData.budEarned}
                  harvestCount={harvestCount || 1}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={seedSelectOpen} onOpenChange={setSeedSelectOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <Sprout className="h-6 w-6 text-primary" />
              Choose Your Seed
            </DialogTitle>
            <DialogDescription>
              Plant a mystery seed for free, or use one from your collection.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 mt-4">
            <Button
              className="w-full justify-start h-auto p-4 bg-gradient-to-r from-primary/20 to-primary/5 border border-primary/30 hover:border-primary/50"
              variant="outline"
              onClick={() => handleMintPod(null)}
              disabled={isActionLoading}
              data-testid="button-plant-mystery"
            >
              <div className="flex items-center gap-3 w-full">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-medium text-foreground">Mystery Seed</p>
                  <p className="text-xs text-muted-foreground">Random genetics - Free to plant</p>
                </div>
                <Badge variant="secondary">Free</Badge>
              </div>
            </Button>

            {loadingSeeds ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : userSeeds.length > 0 ? (
              <>
                <div className="flex items-center gap-2 pt-2">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">Your Seeds</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                {userSeeds.map((userSeed) => (
                  <Button
                    key={userSeed.id}
                    className="w-full justify-start h-auto p-4 border hover:border-primary/50"
                    variant="outline"
                    onClick={() => handleMintPod(userSeed)}
                    disabled={isActionLoading || userSeed.quantity <= 0}
                    style={{ borderColor: `${userSeed.seed.glowColor || "#a855f7"}40` }}
                    data-testid={`button-plant-seed-${userSeed.seedId}`}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${userSeed.seed.glowColor || "#a855f7"}20` }}
                      >
                        <Leaf className="h-6 w-6" style={{ color: userSeed.seed.glowColor || "#a855f7" }} />
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <p 
                          className="font-medium truncate"
                          style={{ color: userSeed.seed.glowColor || undefined }}
                        >
                          {userSeed.seed.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {userSeed.seed.growthBonus && userSeed.seed.growthBonus > 0 
                            ? `+${userSeed.seed.growthBonus}% yield bonus` 
                            : userSeed.seed.rarity}
                        </p>
                      </div>
                      <Badge variant="outline" className="shrink-0">
                        x{userSeed.quantity}
                      </Badge>
                    </div>
                  </Button>
                ))}
              </>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Leaf className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No seeds in your collection</p>
                <Link href="/seed-bank">
                  <Button variant="ghost" className="text-primary mt-2">
                    Visit the Seed Bank
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
