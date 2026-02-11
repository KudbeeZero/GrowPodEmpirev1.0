/**
 * Biomass Inventory Component
 * Displays all Biomass NFTs owned by the user
 * Allows processing (burning) biomass to extract $BUD tokens
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, Coins, FlaskConical, Scale, Loader2, Flame, Clock, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAlgorand } from '@/hooks/use-algorand';
import { useBiomassNFTs, useNFTTransactions, formatWeight, formatBudFromWeight, type BiomassNFT } from '@/hooks/use-nfts';

interface BiomassInventoryProps {
  onCureVault?: (biomassAssetId: number) => void;
}

const QUALITY_COLORS = {
  D: 'bg-gray-500/20 text-gray-400',
  C: 'bg-gray-400/20 text-gray-300',
  B: 'bg-blue-500/20 text-blue-400',
  A: 'bg-green-500/20 text-green-400',
  'A+': 'bg-emerald-500/20 text-emerald-400',
  S: 'bg-amber-500/20 text-amber-400',
};

const CURE_STATUS_COLORS = {
  fresh: 'bg-green-500/20 text-green-400',
  curing: 'bg-amber-500/20 text-amber-400',
  cured: 'bg-purple-500/20 text-purple-400',
};

export function BiomassInventory({ onCureVault }: BiomassInventoryProps) {
  const { account, isConnected } = useAlgorand();
  const { data: biomassNFTs = [], isLoading } = useBiomassNFTs(account);
  const { processBiomass } = useNFTTransactions();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedBiomass, setSelectedBiomass] = useState<BiomassNFT | null>(null);
  const [confirmProcessOpen, setConfirmProcessOpen] = useState(false);

  // Calculate total portfolio value
  const totalWeightMg = biomassNFTs.reduce((sum, b) => sum + b.weightMg, 0);
  const totalBudValue = formatBudFromWeight(totalWeightMg);

  const handleProcess = async (biomass: BiomassNFT) => {
    setIsProcessing(true);
    setConfirmProcessOpen(false);

    toast({
      title: 'Processing Biomass...',
      description: `Converting ${formatWeight(biomass.weightMg)} to $BUD tokens.`,
    });

    try {
      const txId = await processBiomass(biomass.assetId, biomass.weightMg);
      toast({
        title: 'Processing Complete!',
        description: `Received ${formatBudFromWeight(biomass.weightMg)} $BUD. TX: ${txId?.slice(0, 8)}...`,
      });
      setSelectedBiomass(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Transaction failed';
      toast({
        title: 'Processing Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isConnected) {
    return (
      <Card className="bg-card/40 border-emerald-500/20">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Leaf className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">Connect wallet to view biomass</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="bg-card/40 border-emerald-500/20">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mb-4" />
          <p className="text-muted-foreground">Loading biomass inventory...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-card/40 border-emerald-500/20">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-emerald-500" />
            Biomass Vault
            <Badge variant="secondary" className="ml-2">{biomassNFTs.length}</Badge>
          </CardTitle>
          {biomassNFTs.length > 0 && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total Value</p>
              <p className="font-bold text-emerald-400 flex items-center gap-1">
                <Coins className="h-4 w-4" />
                {totalBudValue} $BUD
              </p>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {biomassNFTs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Scale className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground mb-2">No biomass in your vault</p>
              <p className="text-sm text-muted-foreground/60">
                Harvest your plants to receive Biomass NFTs
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {biomassNFTs.map((biomass) => {
                  const quality = biomass.metadata?.quality_grade || 'B';
                  const cureStatus = biomass.metadata?.cure_status || 'fresh';
                  const cureBonusPercent = biomass.metadata?.cure_bonus_percent || 0;

                  return (
                    <motion.div
                      key={biomass.assetId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setSelectedBiomass(biomass)}
                      className="cursor-pointer rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-900/20 to-green-900/10 p-4 hover:border-emerald-500/50 transition-all"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-medium text-sm">
                            {biomass.metadata?.strain || biomass.name}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            #{biomass.assetId}
                          </p>
                        </div>
                        <Badge className={QUALITY_COLORS[quality as keyof typeof QUALITY_COLORS]}>
                          {quality}
                        </Badge>
                      </div>

                      {/* Weight Display */}
                      <div className="bg-card/60 rounded-lg p-3 mb-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Scale className="h-3 w-3" />
                            Weight
                          </span>
                          <span className="font-bold text-emerald-400">
                            {formatWeight(biomass.weightMg)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Coins className="h-3 w-3" />
                            $BUD Value
                          </span>
                          <span className="font-medium text-yellow-400">
                            {formatBudFromWeight(biomass.weightMg)}
                          </span>
                        </div>
                      </div>

                      {/* Cure Status */}
                      <div className="flex items-center justify-between">
                        <Badge className={CURE_STATUS_COLORS[cureStatus as keyof typeof CURE_STATUS_COLORS]}>
                          {cureStatus === 'fresh' && <Sparkles className="h-3 w-3 mr-1" />}
                          {cureStatus === 'curing' && <Clock className="h-3 w-3 mr-1" />}
                          {cureStatus.charAt(0).toUpperCase() + cureStatus.slice(1)}
                        </Badge>
                        {cureBonusPercent > 0 && (
                          <span className="text-xs text-amber-400">+{cureBonusPercent}% bonus</span>
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

      {/* Biomass Details Dialog */}
      <Dialog open={!!selectedBiomass} onOpenChange={() => setSelectedBiomass(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Leaf className="h-5 w-5 text-emerald-500" />
              {selectedBiomass?.metadata?.strain || selectedBiomass?.name}
            </DialogTitle>
            <DialogDescription>
              Biomass NFT #{selectedBiomass?.assetId}
            </DialogDescription>
          </DialogHeader>

          {selectedBiomass && (
            <div className="space-y-4">
              {/* Weight & Value */}
              <div className="bg-gradient-to-br from-emerald-900/30 to-green-900/20 rounded-xl p-4">
                <div className="text-center mb-4">
                  <p className="text-sm text-muted-foreground">Weight</p>
                  <p className="text-3xl font-bold text-emerald-400">
                    {formatWeight(selectedBiomass.weightMg)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">$BUD Value</p>
                  <p className="text-2xl font-bold text-yellow-400 flex items-center justify-center gap-2">
                    <Coins className="h-5 w-5" />
                    {formatBudFromWeight(selectedBiomass.weightMg)}
                  </p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-card rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Quality</p>
                  <Badge className={QUALITY_COLORS[selectedBiomass.metadata?.quality_grade as keyof typeof QUALITY_COLORS || 'B']}>
                    {selectedBiomass.metadata?.quality_grade || 'B'}
                  </Badge>
                </div>
                <div className="bg-card rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge className={CURE_STATUS_COLORS[selectedBiomass.metadata?.cure_status as keyof typeof CURE_STATUS_COLORS || 'fresh']}>
                    {(selectedBiomass.metadata?.cure_status || 'fresh').toUpperCase()}
                  </Badge>
                </div>
                {selectedBiomass.metadata?.thc_actual && (
                  <div className="bg-card rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">THC</p>
                    <p className="font-medium">{selectedBiomass.metadata.thc_actual}%</p>
                  </div>
                )}
                {selectedBiomass.metadata?.cbd_actual && (
                  <div className="bg-card rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">CBD</p>
                    <p className="font-medium">{selectedBiomass.metadata.cbd_actual}%</p>
                  </div>
                )}
              </div>

              {/* Terpene Profile */}
              {selectedBiomass.metadata?.terpene_profile && (
                <div className="bg-card rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                    <FlaskConical className="h-3 w-3" />
                    Terpene Profile
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(selectedBiomass.metadata.terpene_profile)
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

              {/* Care Stats */}
              {(selectedBiomass.metadata?.water_count || selectedBiomass.metadata?.nutrient_count) && (
                <div className="bg-card rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-2">Growth Care</p>
                  <div className="flex gap-4">
                    <span className="text-sm">
                      Waters: <strong>{selectedBiomass.metadata.water_count || 0}</strong>
                    </span>
                    <span className="text-sm">
                      Nutrients: <strong>{selectedBiomass.metadata.nutrient_count || 0}</strong>
                    </span>
                  </div>
                </div>
              )}

              {/* Cure Bonus */}
              {selectedBiomass.metadata?.cure_status === 'curing' && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-amber-400 flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Curing Progress
                    </span>
                    <span className="text-sm font-medium text-amber-400">
                      +{selectedBiomass.metadata.cure_bonus_percent || 0}%
                    </span>
                  </div>
                  <Progress
                    value={(selectedBiomass.metadata.cure_bonus_percent || 0) * 4}
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Max +25% bonus after 30 days
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 border-amber-500/50 text-amber-500 hover:bg-amber-500/10"
                  onClick={() => {
                    if (onCureVault) {
                      onCureVault(selectedBiomass.assetId);
                      setSelectedBiomass(null);
                    }
                  }}
                  disabled={selectedBiomass.metadata?.cure_status === 'curing'}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Cure Vault
                </Button>
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => setConfirmProcessOpen(true)}
                  disabled={isProcessing}
                >
                  <Flame className="h-4 w-4 mr-2" />
                  Process to $BUD
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Process Dialog */}
      <Dialog open={confirmProcessOpen} onOpenChange={setConfirmProcessOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-500">
              <Flame className="h-5 w-5" />
              Confirm Processing
            </DialogTitle>
            <DialogDescription>
              This will permanently burn your Biomass NFT and convert it to $BUD tokens.
            </DialogDescription>
          </DialogHeader>

          {selectedBiomass && (
            <div className="bg-card rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">You will receive</p>
              <p className="text-2xl font-bold text-emerald-400 flex items-center justify-center gap-2">
                <Coins className="h-5 w-5" />
                {formatBudFromWeight(selectedBiomass.weightMg)} $BUD
              </p>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmProcessOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              onClick={() => selectedBiomass && handleProcess(selectedBiomass)}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Flame className="h-4 w-4 mr-2" />
              )}
              Process
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
