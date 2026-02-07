import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Leaf, Droplets, FlaskConical, Zap, Sparkles, Clock } from "lucide-react";
import type { HarvestedBiomass } from "@shared/schema";

interface BiomassCardProps {
  biomass: HarvestedBiomass;
  onClick?: () => void;
  selected?: boolean;
}

const rarityColors: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  common: {
    bg: "from-gray-800/80 to-gray-900/80",
    border: "border-gray-600/50",
    text: "text-gray-300",
    glow: "shadow-gray-500/20",
  },
  uncommon: {
    bg: "from-green-900/80 to-emerald-950/80",
    border: "border-green-500/50",
    text: "text-green-400",
    glow: "shadow-green-500/30",
  },
  rare: {
    bg: "from-blue-900/80 to-indigo-950/80",
    border: "border-blue-500/50",
    text: "text-blue-400",
    glow: "shadow-blue-500/30",
  },
  epic: {
    bg: "from-purple-900/80 to-violet-950/80",
    border: "border-purple-500/50",
    text: "text-purple-400",
    glow: "shadow-purple-500/40",
  },
  legendary: {
    bg: "from-amber-900/80 to-orange-950/80",
    border: "border-amber-500/50",
    text: "text-amber-400",
    glow: "shadow-amber-500/50",
  },
};

const qualityLabels: Record<string, string> = {
  standard: "Standard",
  premium: "Premium",
  exotic: "Exotic",
  legendary: "Legendary",
};

function formatBudValue(value: string): string {
  const num = BigInt(value);
  const decimals = BigInt(1000000);
  const whole = Number(num / decimals);
  return whole.toLocaleString();
}

function TerpeneBar({ name, percentage, color }: { name: string; percentage: number; color?: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{name}</span>
        <span className="font-mono">{percentage}%</span>
      </div>
      <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ backgroundColor: color || "#22c55e" }}
        />
      </div>
    </div>
  );
}

export function BiomassCard({ biomass, onClick, selected }: BiomassCardProps) {
  const rarity = biomass.rarity || "common";
  const colors = rarityColors[rarity] || rarityColors.common;
  const terpeneProfile = (biomass.terpeneProfile || []) as { name: string; percentage: number }[];

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`cursor-pointer ${selected ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
    >
      <Card
        className={`relative overflow-hidden bg-gradient-to-br ${colors.bg} ${colors.border} border-2 ${colors.glow} shadow-lg`}
        style={{
          boxShadow: `0 0 30px ${biomass.glowColor}33, inset 0 0 60px ${biomass.glowColor}11`,
        }}
      >
        {/* Animated glow effect */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: `radial-gradient(circle at 50% 0%, ${biomass.glowColor}44 0%, transparent 60%)`,
          }}
        />

        {/* NFT ID Badge */}
        <div className="absolute top-3 right-3">
          <Badge variant="outline" className="font-mono text-xs bg-black/40 border-white/20">
            {biomass.nftId}
          </Badge>
        </div>

        <CardContent className="p-5 space-y-4">
          {/* Header: Rarity & Quality */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className={`${colors.text} bg-black/40 border ${colors.border}`}>
                {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
              </Badge>
              <Badge variant="secondary" className="bg-black/40">
                {qualityLabels[biomass.quality] || biomass.quality}
              </Badge>
            </div>
          </div>

          {/* Main Stats */}
          <div className="grid grid-cols-2 gap-4">
            {/* BUD Value */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-green-400" />
                <span>$BUD Value</span>
              </div>
              <p className="text-xl font-bold text-green-400">
                {formatBudValue(biomass.budValue)}
              </p>
            </div>

            {/* Biomass Weight */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Leaf className="h-3.5 w-3.5 text-emerald-400" />
                <span>Biomass</span>
              </div>
              <p className="text-xl font-bold text-emerald-400">
                {biomass.biomassGrams}g
              </p>
            </div>
          </div>

          {/* Terpene Profile */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <FlaskConical className="h-3.5 w-3.5" style={{ color: biomass.glowColor || "#22c55e" }} />
              <span>Terpene Profile</span>
              {biomass.dominantTerpene && (
                <Badge variant="outline" className="ml-auto text-[10px] h-5" style={{ borderColor: biomass.glowColor || "#22c55e" }}>
                  {biomass.dominantTerpene}
                </Badge>
              )}
            </div>
            <div className="space-y-2">
              {terpeneProfile.slice(0, 3).map((terp, i) => (
                <TerpeneBar
                  key={i}
                  name={terp.name}
                  percentage={terp.percentage}
                  color={i === 0 ? biomass.glowColor || "#22c55e" : undefined}
                />
              ))}
            </div>
          </div>

          {/* Care & Potency Stats */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                <Droplets className="h-3 w-3 text-blue-400" />
              </div>
              <p className="font-mono text-sm">{biomass.waterCount}/10</p>
              <p className="text-[10px] text-muted-foreground">Waters</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                <FlaskConical className="h-3 w-3 text-purple-400" />
              </div>
              <p className="font-mono text-sm">{biomass.nutrientCount}</p>
              <p className="text-[10px] text-muted-foreground">Nutrients</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                <Zap className="h-3 w-3 text-amber-400" />
              </div>
              <p className="font-mono text-sm">{biomass.potency}%</p>
              <p className="text-[10px] text-muted-foreground">Potency</p>
            </div>
          </div>

          {/* DNA Hash */}
          <div className="pt-2 border-t border-white/10">
            <p className="text-[10px] text-muted-foreground font-mono truncate">
              DNA: {biomass.strainDna}
            </p>
            {biomass.harvestedAt && (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
                <Clock className="h-3 w-3" />
                {new Date(biomass.harvestedAt).toLocaleDateString()}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Compact version for lists
export function BiomassCardCompact({ biomass, onClick }: BiomassCardProps) {
  const rarity = biomass.rarity || "common";
  const colors = rarityColors[rarity] || rarityColors.common;

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="cursor-pointer"
    >
      <Card className={`bg-gradient-to-r ${colors.bg} ${colors.border} border`}>
        <CardContent className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${biomass.glowColor}33` }}
            >
              <Leaf className="h-5 w-5" style={{ color: biomass.glowColor || "#22c55e" }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">{biomass.nftId}</span>
                <Badge variant="outline" className={`text-[10px] h-4 ${colors.text}`}>
                  {rarity}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {biomass.biomassGrams}g · {biomass.dominantTerpene}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold text-green-400">{formatBudValue(biomass.budValue)}</p>
            <p className="text-xs text-muted-foreground">$BUD</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default BiomassCard;
