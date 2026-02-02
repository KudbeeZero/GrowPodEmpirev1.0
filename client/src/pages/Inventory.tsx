/**
 * Inventory Page - V2 NFT-based inventory system
 * Shows Seeds and Biomass NFTs with full management capabilities
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Leaf, Package, Coins, FlaskConical, Dna, ArrowRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAlgorand } from '@/hooks/use-algorand';
import { useSeedNFTs, useBiomassNFTs, formatWeight, formatBudFromWeight } from '@/hooks/use-nfts';
import { SeedInventory } from '@/components/SeedInventory';
import { BiomassInventory } from '@/components/BiomassInventory';

export default function Inventory() {
  const { account, isConnected } = useAlgorand();
  const { data: seeds = [] } = useSeedNFTs(account);
  const { data: biomass = [] } = useBiomassNFTs(account);

  const totalBiomassWeight = biomass.reduce((sum, b) => sum + b.weightMg, 0);

  return (
    <div className="min-h-screen pb-20">
      <section className="relative pt-12 pb-12 px-4">
        <div className="container mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">
                NFT Inventory
              </h1>
              <p className="text-muted-foreground text-lg">
                Manage your Seeds and Biomass NFTs
              </p>
            </div>

            {/* Portfolio Stats */}
            {isConnected && (
              <div className="flex gap-4">
                <Card className="bg-card/40 border-primary/20 px-4 py-2">
                  <div className="flex items-center gap-3">
                    <Leaf className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Seeds</p>
                      <p className="text-xl font-bold">{seeds.length}</p>
                    </div>
                  </div>
                </Card>
                <Card className="bg-card/40 border-emerald-500/20 px-4 py-2">
                  <div className="flex items-center gap-3">
                    <Package className="h-8 w-8 text-emerald-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Biomass</p>
                      <p className="text-xl font-bold">{biomass.length}</p>
                    </div>
                  </div>
                </Card>
                <Card className="bg-card/40 border-yellow-500/20 px-4 py-2">
                  <div className="flex items-center gap-3">
                    <Coins className="h-8 w-8 text-yellow-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Total Value</p>
                      <p className="text-xl font-bold text-yellow-400">
                        {formatBudFromWeight(totalBiomassWeight)} $BUD
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>

          {/* NFT Flow Diagram */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-primary/10 via-emerald-500/10 to-yellow-500/10 border border-white/10 rounded-xl p-6 mb-8"
          >
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Dna className="h-5 w-5 text-primary" />
              How NFT Tokenomics Work
            </h3>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
              <div className="flex items-center gap-2 bg-primary/20 rounded-lg px-3 py-2">
                <Leaf className="h-4 w-4 text-primary" />
                <span>Seed NFT</span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <div className="flex items-center gap-2 bg-green-500/20 rounded-lg px-3 py-2">
                <FlaskConical className="h-4 w-4 text-green-500" />
                <span>Plant & Grow</span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <div className="flex items-center gap-2 bg-emerald-500/20 rounded-lg px-3 py-2">
                <Package className="h-4 w-4 text-emerald-500" />
                <span>Biomass NFT</span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <div className="flex items-center gap-2 bg-yellow-500/20 rounded-lg px-3 py-2">
                <Coins className="h-4 w-4 text-yellow-500" />
                <span>$BUD Tokens</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Seeds hold genetics. Skill affects yield. Biomass weight = $BUD value. Cure for bonuses.
            </p>
          </motion.div>

          {/* Tabs */}
          <Tabs defaultValue="seeds" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2 mx-auto">
              <TabsTrigger value="seeds" className="flex items-center gap-2">
                <Leaf className="h-4 w-4" />
                Seeds
                {seeds.length > 0 && (
                  <Badge variant="secondary" className="ml-1">{seeds.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="biomass" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Biomass
                {biomass.length > 0 && (
                  <Badge variant="secondary" className="ml-1">{biomass.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="seeds">
              <SeedInventory />
            </TabsContent>

            <TabsContent value="biomass">
              <BiomassInventory />
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
}
