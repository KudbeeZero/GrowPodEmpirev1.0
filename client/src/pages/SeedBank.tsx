import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Leaf, 
  Sparkles, 
  Flame, 
  Droplets,
  ShoppingCart,
  Package,
  Crown,
  Star,
  Zap,
  Info,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAlgorand } from "@/hooks/use-algorand";
import { useToast } from "@/hooks/use-toast";
import type { SeedBankItem, UserSeed } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const RARITY_CONFIG = {
  common: { 
    label: "Common", 
    color: "bg-slate-500/20 text-slate-300 border-slate-500/30",
    glow: "shadow-slate-500/20",
    icon: Leaf 
  },
  uncommon: { 
    label: "Uncommon", 
    color: "bg-green-500/20 text-green-300 border-green-500/30",
    glow: "shadow-green-500/20",
    icon: Droplets 
  },
  rare: { 
    label: "Rare", 
    color: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    glow: "shadow-blue-500/30",
    icon: Star 
  },
  legendary: { 
    label: "Legendary", 
    color: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    glow: "shadow-purple-500/40",
    icon: Sparkles 
  },
  mythic: { 
    label: "Mythic", 
    color: "bg-gradient-to-r from-pink-500/20 to-amber-500/20 text-amber-300 border-amber-500/30",
    glow: "shadow-amber-500/50",
    icon: Crown 
  },
};

function SeedCard({ 
  seed, 
  onPurchase, 
  isPurchasing,
  onViewDetails 
}: { 
  seed: SeedBankItem; 
  onPurchase: () => void;
  isPurchasing: boolean;
  onViewDetails: () => void;
}) {
  const rarity = RARITY_CONFIG[seed.rarity as keyof typeof RARITY_CONFIG] || RARITY_CONFIG.common;
  const RarityIcon = rarity.icon;
  const terpenes = seed.terpeneProfile as string[] || [];
  const effects = seed.effects as string[] || [];
  const isSoldOut = seed.totalSupply !== null && seed.mintedCount >= seed.totalSupply;
  
  return (
    <div className="group">
      <Card 
        className={cn(
          "relative overflow-hidden border-2 transition-all duration-300",
          "bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm",
          "hover:border-opacity-70",
          rarity.glow,
          "hover:shadow-lg"
        )}
        style={{ 
          borderColor: seed.glowColor || "#a855f7",
          boxShadow: `0 0 20px ${seed.glowColor || "#a855f7"}20`
        }}
      >
        <div 
          className="absolute inset-0 opacity-10 bg-gradient-to-br"
          style={{ 
            backgroundImage: `linear-gradient(135deg, ${seed.glowColor || "#a855f7"}40 0%, transparent 60%)` 
          }}
        />
        
        <div className="absolute top-3 right-3 z-10">
          <Badge className={cn("border", rarity.color)}>
            <RarityIcon className="h-3 w-3 mr-1" />
            {rarity.label}
          </Badge>
        </div>

        <CardContent className="p-5 relative z-10">
          <div className="flex justify-center mb-4">
            <div 
              className="relative w-28 h-28 rounded-full flex items-center justify-center"
              style={{
                background: `radial-gradient(circle, ${seed.glowColor || "#a855f7"}30 0%, transparent 70%)`,
              }}
            >
              <div 
                className="absolute inset-0 rounded-full border-2 border-dashed opacity-40 animate-[spin_20s_linear_infinite]"
                style={{ borderColor: seed.glowColor || "#a855f7" }}
              />
              <div 
                className="absolute inset-2 rounded-full border opacity-60"
                style={{ borderColor: seed.glowColor || "#a855f7" }}
              />
              {seed.imagePath ? (
                <img 
                  src={seed.imagePath} 
                  alt={seed.name} 
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${seed.glowColor || "#a855f7"}30` }}
                >
                  <Leaf className="h-8 w-8" style={{ color: seed.glowColor || "#a855f7" }} />
                </div>
              )}
            </div>
          </div>

          <div className="text-center mb-4">
            <h3 
              className="font-display font-bold text-xl mb-1"
              style={{ color: seed.glowColor || "#a855f7" }}
            >
              {seed.name}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {seed.description}
            </p>
          </div>

          {terpenes.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Flame className="h-3 w-3" /> Terpenes
              </p>
              <div className="flex flex-wrap gap-1">
                {terpenes.slice(0, 3).map((terp, i) => (
                  <Badge key={i} variant="outline" className="text-xs py-0 px-1.5 border-white/10">
                    {terp}
                  </Badge>
                ))}
                {terpenes.length > 3 && (
                  <Badge variant="outline" className="text-xs py-0 px-1.5 border-white/10">
                    +{terpenes.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {effects.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Zap className="h-3 w-3" /> Effects
              </p>
              <div className="flex flex-wrap gap-1">
                {effects.slice(0, 2).map((effect, i) => (
                  <Badge key={i} variant="secondary" className="text-xs py-0 px-1.5">
                    {effect}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-4 py-2 px-3 rounded-lg bg-black/20">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">THC:</span>
              <span className="text-sm font-mono font-bold text-green-400">{seed.thcRange}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">CBD:</span>
              <span className="text-sm font-mono font-bold text-blue-400">{seed.cbdRange}</span>
            </div>
          </div>

          {seed.totalSupply !== null && (
            <div className="mb-3">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Minted</span>
                <span>{seed.mintedCount} / {seed.totalSupply}</span>
              </div>
              <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all"
                  style={{ 
                    width: `${(seed.mintedCount / seed.totalSupply) * 100}%`,
                    backgroundColor: seed.glowColor || "#a855f7"
                  }}
                />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={onViewDetails}
              data-testid={`button-view-seed-${seed.id}`}
            >
              <Info className="h-4 w-4 mr-1" />
              Details
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={onPurchase}
              disabled={isPurchasing || isSoldOut}
              style={{ 
                backgroundColor: isSoldOut ? undefined : seed.glowColor || "#a855f7",
              }}
              data-testid={`button-purchase-seed-${seed.id}`}
            >
              {isPurchasing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isSoldOut ? (
                "Sold Out"
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4 mr-1" />
                  {parseInt(seed.budPrice) >= 1000000 
                    ? `${parseInt(seed.budPrice) / 1000000}M $BUD`
                    : parseInt(seed.budPrice) >= 1000 
                      ? `${parseInt(seed.budPrice) / 1000}K $BUD`
                      : `${seed.budPrice} $BUD`
                  }
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SeedDetailModal({ 
  seed, 
  isOpen, 
  onClose 
}: { 
  seed: SeedBankItem | null; 
  isOpen: boolean; 
  onClose: () => void; 
}) {
  if (!seed) return null;
  
  const rarity = RARITY_CONFIG[seed.rarity as keyof typeof RARITY_CONFIG] || RARITY_CONFIG.common;
  const terpenes = seed.terpeneProfile as string[] || [];
  const effects = seed.effects as string[] || [];
  const flavors = seed.flavorNotes as string[] || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader className="sticky top-0 bg-background/95 backdrop-blur pb-2 -mx-6 px-6 pt-0 z-10">
          <DialogTitle 
            className="text-xl sm:text-2xl font-display"
            style={{ color: seed.glowColor || "#a855f7" }}
          >
            {seed.name}
          </DialogTitle>
          <DialogDescription className="text-sm">{seed.description}</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2">
            <Badge className={cn("border", rarity.color)}>
              {rarity.label}
            </Badge>
            {seed.growthBonus && seed.growthBonus > 0 && (
              <Badge variant="secondary">
                +{seed.growthBonus}% Yield Bonus
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-black/20">
              <p className="text-xs text-muted-foreground mb-1">THC Range</p>
              <p className="text-lg font-mono font-bold text-green-400">{seed.thcRange}</p>
            </div>
            <div className="p-3 rounded-lg bg-black/20">
              <p className="text-xs text-muted-foreground mb-1">CBD Range</p>
              <p className="text-lg font-mono font-bold text-blue-400">{seed.cbdRange}</p>
            </div>
          </div>

          {terpenes.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                <Flame className="h-4 w-4" style={{ color: seed.glowColor || "#a855f7" }} /> 
                Terpene Profile
              </p>
              <div className="flex flex-wrap gap-2">
                {terpenes.map((terp, i) => (
                  <Badge key={i} variant="outline" className="border-white/20">
                    {terp}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {effects.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                <Zap className="h-4 w-4" style={{ color: seed.glowColor || "#a855f7" }} /> 
                Effects
              </p>
              <div className="flex flex-wrap gap-2">
                {effects.map((effect, i) => (
                  <Badge key={i} variant="secondary">
                    {effect}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {flavors.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                <Droplets className="h-4 w-4" style={{ color: seed.glowColor || "#a855f7" }} /> 
                Flavor Notes
              </p>
              <div className="flex flex-wrap gap-2">
                {flavors.map((flavor, i) => (
                  <Badge key={i} variant="outline" className="border-white/20">
                    {flavor}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div 
            className="p-4 rounded-lg text-center"
            style={{ backgroundColor: `${seed.glowColor || "#a855f7"}20` }}
          >
            <p className="text-sm text-muted-foreground mb-1">Price</p>
            <p 
              className="text-2xl font-display font-bold"
              style={{ color: seed.glowColor || "#a855f7" }}
            >
              {parseInt(seed.budPrice).toLocaleString()} $BUD
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InventoryCard({ 
  userSeed 
}: { 
  userSeed: UserSeed & { seed: SeedBankItem };
}) {
  const seed = userSeed.seed;
  const rarity = RARITY_CONFIG[seed.rarity as keyof typeof RARITY_CONFIG] || RARITY_CONFIG.common;

  return (
    <div className="group">
      <Card 
        className="relative overflow-hidden border transition-all"
        style={{ borderColor: `${seed.glowColor || "#a855f7"}40` }}
      >
        <CardContent className="p-4 flex items-center gap-4">
          <div 
            className="w-14 h-14 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${seed.glowColor || "#a855f7"}20` }}
          >
            {seed.imagePath ? (
              <img src={seed.imagePath} alt={seed.name} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <Leaf className="h-6 w-6" style={{ color: seed.glowColor || "#a855f7" }} />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 
                className="font-display font-bold truncate"
                style={{ color: seed.glowColor || "#a855f7" }}
              >
                {seed.name}
              </h4>
              <Badge className={cn("border text-xs shrink-0", rarity.color)}>
                {rarity.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Quantity: <span className="font-mono font-bold text-foreground">{userSeed.quantity}</span>
            </p>
          </div>

          <Button 
            size="sm" 
            variant="outline"
            style={{ borderColor: seed.glowColor || "#a855f7" }}
            data-testid={`button-plant-seed-${seed.id}`}
          >
            Plant
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SeedBank() {
  const { toast } = useToast();
  const { account: address } = useAlgorand();
  const [selectedSeed, setSelectedSeed] = useState<SeedBankItem | null>(null);
  const [purchasingSeedId, setPurchasingSeedId] = useState<number | null>(null);

  const { data: seeds = [], isLoading: seedsLoading } = useQuery<SeedBankItem[]>({
    queryKey: ["/api/seed-bank"],
    staleTime: 30000,
  });

  const { data: userSeeds = [], isLoading: userSeedsLoading } = useQuery<(UserSeed & { seed: SeedBankItem })[]>({
    queryKey: ["/api/user-seeds", address],
    enabled: !!address,
    staleTime: 30000,
  });

  const purchaseMutation = useMutation({
    mutationFn: async (seedId: number) => {
      setPurchasingSeedId(seedId);
      return await apiRequest("POST", `/api/seed-bank/${seedId}/purchase`, { walletAddress: address });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seed-bank"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user-seeds", address] });
      toast({ 
        title: "Seed Purchased!", 
        description: "Check your inventory to plant your new seed." 
      });
    },
    onError: (err: any) => {
      toast({ 
        title: "Purchase Failed", 
        description: err.message || "Could not complete purchase",
        variant: "destructive" 
      });
    },
    onSettled: () => {
      setPurchasingSeedId(null);
    },
  });

  return (
    <div className="min-h-screen py-8 px-4 container mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-gradient-to-br from-purple-500/30 to-pink-500/30 p-4 rounded-xl">
          <Sparkles className="h-10 w-10 text-purple-400" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Seed Bank
          </h1>
          <p className="text-muted-foreground">Premium genetics for your grow operation</p>
        </div>
      </div>

      <Tabs defaultValue="shop" className="space-y-6">
        <TabsList className="bg-card/50">
          <TabsTrigger value="shop" className="gap-2" data-testid="tab-shop">
            <ShoppingCart className="h-4 w-4" />
            Shop
          </TabsTrigger>
          <TabsTrigger value="inventory" className="gap-2" data-testid="tab-inventory">
            <Package className="h-4 w-4" />
            My Seeds
            {userSeeds.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {userSeeds.reduce((acc, s) => acc + s.quantity, 0)}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="shop">
          {seedsLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
            </div>
          ) : seeds.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-card/20 rounded-2xl border border-white/5">
              <Leaf className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-xl font-bold text-muted-foreground">No Seeds Available</h3>
              <p className="text-muted-foreground/70 mt-2 text-center max-w-md">
                Check back soon for exclusive seed drops from the GrowPod Empire.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {seeds.map((seed) => (
                <SeedCard
                  key={seed.id}
                  seed={seed}
                  onPurchase={() => {
                    if (!address) {
                      toast({ 
                        title: "Wallet Required", 
                        description: "Connect your wallet to purchase seeds",
                        variant: "destructive"
                      });
                      return;
                    }
                    purchaseMutation.mutate(seed.id);
                  }}
                  isPurchasing={purchasingSeedId === seed.id}
                  onViewDetails={() => setSelectedSeed(seed)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="inventory">
          {!address ? (
            <div className="flex flex-col items-center justify-center py-20 bg-card/20 rounded-2xl border border-white/5">
              <Package className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-xl font-bold text-muted-foreground">Connect Wallet</h3>
              <p className="text-muted-foreground/70 mt-2 text-center max-w-md">
                Connect your wallet to view your seed inventory.
              </p>
            </div>
          ) : userSeedsLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
            </div>
          ) : userSeeds.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-card/20 rounded-2xl border border-white/5">
              <Package className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-xl font-bold text-muted-foreground">No Seeds Yet</h3>
              <p className="text-muted-foreground/70 mt-2 text-center max-w-md">
                Purchase seeds from the shop to start growing premium strains.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userSeeds.map((userSeed) => (
                <InventoryCard key={userSeed.id} userSeed={userSeed} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <SeedDetailModal
        seed={selectedSeed}
        isOpen={!!selectedSeed}
        onClose={() => setSelectedSeed(null)}
      />
    </div>
  );
}
