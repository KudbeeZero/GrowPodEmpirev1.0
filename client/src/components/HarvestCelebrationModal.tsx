import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Leaf, Sparkles, FlaskConical, Zap, Trophy, ArrowRight } from "lucide-react";
import type { HarvestedBiomass } from "@shared/schema";
import confetti from "canvas-confetti";

interface HarvestCelebrationModalProps {
  open: boolean;
  onClose: () => void;
  biomass: HarvestedBiomass | null;
  onViewInVault: () => void;
}

const rarityMessages: Record<string, { title: string; subtitle: string }> = {
  common: { title: "Harvest Complete!", subtitle: "A solid grow" },
  uncommon: { title: "Nice Harvest!", subtitle: "Quality cultivation" },
  rare: { title: "Impressive Yield!", subtitle: "Exceptional quality" },
  epic: { title: "Epic Harvest!", subtitle: "Master grower status" },
  legendary: { title: "LEGENDARY HARVEST!", subtitle: "You are the chosen one" },
};

const rarityColors: Record<string, string> = {
  common: "#6b7280",
  uncommon: "#22c55e",
  rare: "#3b82f6",
  epic: "#a855f7",
  legendary: "#f59e0b",
};

function formatBudValue(value: string): string {
  const num = BigInt(value);
  const decimals = BigInt(1000000);
  const whole = Number(num / decimals);
  return whole.toLocaleString();
}

// Particle component for the background
function Particles({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{ backgroundColor: color }}
          initial={{
            x: Math.random() * 400 - 200,
            y: 400,
            opacity: 0,
            scale: 0,
          }}
          animate={{
            y: -100,
            opacity: [0, 1, 0],
            scale: [0, 1, 0.5],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

export function HarvestCelebrationModal({
  open,
  onClose,
  biomass,
  onViewInVault,
}: HarvestCelebrationModalProps) {
  const [stage, setStage] = useState<"reveal" | "stats" | "complete">("reveal");

  useEffect(() => {
    if (open && biomass) {
      setStage("reveal");

      // Trigger confetti on open
      const color = rarityColors[biomass.rarity || "common"];
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: [color, "#22c55e", "#ffffff"],
      });

      // Progress through stages
      const timer1 = setTimeout(() => setStage("stats"), 1500);
      const timer2 = setTimeout(() => {
        setStage("complete");
        // Second confetti burst for legendary/epic
        if (biomass.rarity === "legendary" || biomass.rarity === "epic") {
          confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.5 },
            colors: [color, "#ffd700", "#ffffff"],
          });
        }
      }, 3000);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [open, biomass]);

  if (!biomass) return null;

  const rarity = biomass.rarity || "common";
  const color = rarityColors[rarity];
  const message = rarityMessages[rarity] || rarityMessages.common;
  const terpeneProfile = (biomass.terpeneProfile || []) as { name: string; percentage: number }[];

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md bg-gradient-to-b from-gray-900 to-black border-2 overflow-hidden p-0"
        style={{ borderColor: `${color}66` }}
      >
        {/* Background particles */}
        <Particles color={color} />

        {/* Radial glow */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(circle at 50% 30%, ${color}44 0%, transparent 60%)`,
          }}
        />

        <div className="relative z-10 p-6">
          <AnimatePresence mode="wait">
            {/* Stage 1: Initial Reveal */}
            {stage === "reveal" && (
              <motion.div
                key="reveal"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="text-center py-8"
              >
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{ duration: 0.5, repeat: 2 }}
                >
                  <Leaf className="h-24 w-24 mx-auto" style={{ color }} />
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl font-bold mt-4"
                  style={{ color }}
                >
                  {message.title}
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-muted-foreground mt-2"
                >
                  {message.subtitle}
                </motion.p>
              </motion.div>
            )}

            {/* Stage 2: Stats Reveal */}
            {stage === "stats" && (
              <motion.div
                key="stats"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6 py-4"
              >
                {/* NFT ID */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  <Badge variant="outline" className="text-lg font-mono px-4 py-1" style={{ borderColor: color }}>
                    {biomass.nftId}
                  </Badge>
                </motion.div>

                {/* Main Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-black/40 rounded-lg p-4 text-center border"
                    style={{ borderColor: `${color}33` }}
                  >
                    <Sparkles className="h-6 w-6 mx-auto text-green-400 mb-2" />
                    <p className="text-2xl font-bold text-green-400">
                      {formatBudValue(biomass.budValue)}
                    </p>
                    <p className="text-xs text-muted-foreground">$BUD Earned</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-black/40 rounded-lg p-4 text-center border"
                    style={{ borderColor: `${color}33` }}
                  >
                    <Leaf className="h-6 w-6 mx-auto mb-2" style={{ color }} />
                    <p className="text-2xl font-bold" style={{ color }}>
                      {biomass.biomassGrams}g
                    </p>
                    <p className="text-xs text-muted-foreground">Biomass</p>
                  </motion.div>
                </div>

                {/* Terpene Profile */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-black/40 rounded-lg p-4 border"
                  style={{ borderColor: `${color}33` }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <FlaskConical className="h-4 w-4" style={{ color }} />
                    <span className="text-sm font-medium">Terpene Profile</span>
                    {biomass.dominantTerpene && (
                      <Badge variant="outline" className="ml-auto text-xs" style={{ borderColor: color, color }}>
                        {biomass.dominantTerpene}
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-2">
                    {terpeneProfile.slice(0, 3).map((terp, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-24">{terp.name}</span>
                        <div className="flex-1 h-2 bg-black/60 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${terp.percentage}%` }}
                            transition={{ duration: 0.8, delay: 0.5 + i * 0.1 }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: i === 0 ? color : `${color}88` }}
                          />
                        </div>
                        <span className="text-xs font-mono w-10 text-right">{terp.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Quality Stats */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="flex justify-center gap-6"
                >
                  <div className="text-center">
                    <Zap className="h-5 w-5 mx-auto text-amber-400 mb-1" />
                    <p className="font-bold">{biomass.potency}%</p>
                    <p className="text-xs text-muted-foreground">Potency</p>
                  </div>
                  <div className="text-center">
                    <Trophy className="h-5 w-5 mx-auto mb-1" style={{ color }} />
                    <p className="font-bold capitalize">{rarity}</p>
                    <p className="text-xs text-muted-foreground">Rarity</p>
                  </div>
                  <div className="text-center">
                    <Sparkles className="h-5 w-5 mx-auto text-purple-400 mb-1" />
                    <p className="font-bold capitalize">{biomass.quality}</p>
                    <p className="text-xs text-muted-foreground">Quality</p>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Stage 3: Complete */}
            {stage === "complete" && (
              <motion.div
                key="complete"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6 py-4"
              >
                <div className="text-center">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Leaf className="h-16 w-16 mx-auto" style={{ color }} />
                  </motion.div>
                  <h2 className="text-xl font-bold mt-4">Biomass NFT Created!</h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    Your harvest has been preserved in the Cure Vault
                  </p>
                  <Badge variant="outline" className="mt-3 font-mono" style={{ borderColor: color }}>
                    {biomass.nftId}
                  </Badge>
                </div>

                {/* Summary */}
                <div className="bg-black/40 rounded-lg p-4 border" style={{ borderColor: `${color}33` }}>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Value</span>
                    <span className="text-xl font-bold text-green-400">
                      {formatBudValue(biomass.budValue)} $BUD
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-muted-foreground">Biomass Weight</span>
                    <span className="font-medium" style={{ color }}>{biomass.biomassGrams}g</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-muted-foreground">Dominant Terpene</span>
                    <span className="font-medium">{biomass.dominantTerpene}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button variant="outline" onClick={onClose} className="flex-1">
                    Continue Growing
                  </Button>
                  <Button
                    onClick={onViewInVault}
                    className="flex-1"
                    style={{ backgroundColor: color }}
                  >
                    View in Vault
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default HarvestCelebrationModal;
