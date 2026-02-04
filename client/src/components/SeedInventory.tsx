/**
 * Seed Inventory Component
 * Displays all Seed NFTs owned by the user
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, Sparkles, Dna, FlaskConical, Plus, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAlgorand } from '@/hooks/use-algorand';
import { useSeedNFTs, useNFTTransactions, type SeedNFT } from '@/hooks/use-nfts';

interface SeedInventoryProps {
  onPlantSeed?: (seedAssetId: number) => void;
  selectionMode?: boolean;
  selectedSeedId?: number | null;
}

const RARITY_COLORS = {
  common: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  uncommon: 'bg-green-500/20 text-green-400 border-green-500/30',
  rare: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  epic: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  legendary: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
};

const RARITY_GLOW = {
  common: '',
  uncommon: 'shadow-green-500/20',
  rare: 'shadow-blue-500/30 shadow-lg',
  epic: 'shadow-purple-500/40 shadow-xl',
  legendary: 'shadow-amber-500/50 shadow-xl animate-pulse',
};

export function SeedInventory({ onPlantSeed, selectionMode = false, selectedSeedId }: SeedInventoryProps) {
  const { account, isConnected } = useAlgorand();
  const { data: seeds = [], isLoading } = useSeedNFTs(account);
  const { mintSeed } = useNFTTransactions();
  const { toast } = useToast();
  const [isMinting, setIsMinting] = useState(false);
  const [selectedSeed, setSelectedSeed] = useState<SeedNFT | null>(null);

  const handleMintSeed = async () => {
    if (!isConnected) {
      toast({
        title: 'Wallet Required',
        description: 'Please connect your wallet first.',
        variant: 'destructive',
      });
      return;
    }

    setIsMinting(true);
    toast({
      title: 'Minting Seed...',
      description: 'Sign the transaction to mint a new Seed NFT (250 $BUD).',
    });

    try {
      const txId = await mintSeed();
      if (!txId) {
        throw new Error('Minting is currently unavailable. Please try again later.');
      }
      toast({
        title: 'Seed Minted!',
        description: `New seed added to your inventory. TX: ${txId.slice(0, 8)}...`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Transaction failed';
      toast({
        title: 'Mint Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsMinting(false);
    }
  };

  const handleSelectSeed = (seed: SeedNFT) => {
    if (selectionMode && onPlantSeed) {
      onPlantSeed(seed.assetId);
    } else {
      setSelectedSeed(seed);
    }
  };

  if (!isConnected) {
    return (
      <Card className="bg-card/40 border-primary/20">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Leaf className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">Connect wallet to view seeds</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="bg-card/40 border-primary/20">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading seeds...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-card/40 border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-primary" />
            Seed Collection
            <Badge variant="secondary" className="ml-2">{seeds.length}</Badge>
          </CardTitle>
          {!selectionMode && (
            <Button
              size="sm"
              onClick={handleMintSeed}
              disabled={isMinting}
              className="bg-primary hover:bg-primary/90"
            >
              {isMinting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Buy Seed (250 $BUD)
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {seeds.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Sparkles className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground mb-4">No seeds in your collection</p>
              <Button onClick={handleMintSeed} disabled={isMinting}>
                <Plus className="h-4 w-4 mr-2" />
                Get Your First Seed
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <AnimatePresence>
                {seeds.map((seed) => {
                  const rarity = seed.metadata?.rarity || 'common';
                  const isSelected = selectedSeedId === seed.assetId;

                  return (
                    <motion.div
                      key={seed.assetId}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => handleSelectSeed(seed)}
                      className={`
                        cursor-pointer rounded-xl border p-4 transition-all
                        ${isSelected
                          ? 'border-primary bg-primary/10 ring-2 ring-primary'
                          : 'border-white/10 bg-card/60 hover:border-primary/50'
                        }
                        ${RARITY_GLOW[rarity]}
                      `}
                    >
                      {/* Seed Image */}
                      <div className="aspect-square rounded-lg bg-gradient-to-br from-green-900/30 to-emerald-900/30 flex items-center justify-center mb-3 overflow-hidden">
                        {seed.imageUrl ? (
                          <img
                            src={seed.imageUrl}
                            alt={seed.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Leaf className="h-12 w-12 text-green-500/50" />
                        )}
                      </div>

                      {/* Seed Info */}
                      <div className="space-y-2">
                        <h3 className="font-medium text-sm truncate">
                          {seed.metadata?.strain || seed.name}
                        </h3>

                        <Badge className={RARITY_COLORS[rarity]}>
                          {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
                        </Badge>

                        {seed.metadata?.terpene_dominant && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <FlaskConical className="h-3 w-3" />
                            {seed.metadata.terpene_dominant}
                          </p>
                        )}

                        {seed.metadata?.thc_potential && (
                          <p className="text-xs text-muted-foreground">
                            THC: {seed.metadata.thc_potential}%
                          </p>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Seed Details Dialog */}
      <Dialog open={!!selectedSeed && !selectionMode} onOpenChange={() => setSelectedSeed(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Dna className="h-5 w-5 text-primary" />
              {selectedSeed?.metadata?.strain || selectedSeed?.name}
            </DialogTitle>
            <DialogDescription>
              Seed NFT #{selectedSeed?.assetId}
            </DialogDescription>
          </DialogHeader>

          {selectedSeed && (
            <div className="space-y-4">
              {/* Seed Image */}
              <div className="aspect-video rounded-lg bg-gradient-to-br from-green-900/30 to-emerald-900/30 flex items-center justify-center overflow-hidden">
                {selectedSeed.imageUrl ? (
                  <img
                    src={selectedSeed.imageUrl}
                    alt={selectedSeed.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Leaf className="h-20 w-20 text-green-500/50" />
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-card rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Rarity</p>
                  <Badge className={RARITY_COLORS[selectedSeed.metadata?.rarity || 'common']}>
                    {(selectedSeed.metadata?.rarity || 'common').toUpperCase()}
                  </Badge>
                </div>
                <div className="bg-card rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="font-medium capitalize">
                    {selectedSeed.metadata?.strain_type || 'Hybrid'}
                  </p>
                </div>
                <div className="bg-card rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">THC Potential</p>
                  <p className="font-medium">
                    {selectedSeed.metadata?.thc_potential || '?'}%
                  </p>
                </div>
                <div className="bg-card rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">CBD Potential</p>
                  <p className="font-medium">
                    {selectedSeed.metadata?.cbd_potential || '?'}%
                  </p>
                </div>
              </div>

              {/* Terpene Profile */}
              {selectedSeed.metadata?.terpene_profile && (
                <div className="bg-card rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                    <FlaskConical className="h-3 w-3" />
                    Terpene Profile
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(selectedSeed.metadata.terpene_profile)
                      .filter(([_, value]) => value > 0)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 4)
                      .map(([name, value]) => (
                        <Badge key={name} variant="outline" className="text-xs">
                          {name}: {value}%
                        </Badge>
                      ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => {
                    if (onPlantSeed) {
                      onPlantSeed(selectedSeed.assetId);
                      setSelectedSeed(null);
                    }
                  }}
                >
                  <Leaf className="h-4 w-4 mr-2" />
                  Plant This Seed
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
