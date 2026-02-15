import { type GrowPod, formatCooldown, NUTRIENT_COOLDOWN, WATER_COOLDOWN } from "@/hooks/use-algorand";
import { cn } from "@/lib/utils";
import { 
  Droplets, 
  Skull, 
  Flower, 
  AlertTriangle, 
  Trash2,
  Sprout,
  Clock,
  FlaskRound
} from "lucide-react";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

// Stage images - new consistent pod visuals
import emptyPodImage from "@assets/7E2DCD79-6E12-4293-B9B5-5201C0EFC9EB_1768755213394.png";
import seedlingAnimation from "@assets/seedling_animation.mp4";
import seedlingPodImage from "@assets/8FB8A93B-2A96-4974-88BB-83E5EA7E9FA2_1768743434278.png";
import youngPodImage from "@assets/BCD9AEF2-730A-4176-8342-F462B3B83E92_1768743434278.png";
import vegetativePodImage from "@assets/F322B8F1-F1D1-4058-ABDF-78160DFA37D8_1768755213394.png";
import floweringPodImage from "@assets/7C542371-F326-4E95-AED7-A466A176000D_1768755213394.png";
import harvestReadyPodImage from "@assets/5D819CC1-3731-4404-B2D9-B373C29A7C51_1768755213394.png";
import cleanupPodImage from "@assets/56C0CC72-650C-4187-92E6-0820A9E1C9B2_1768755213394.png";

// Map stage numbers to images
const stageImages: Record<number, string> = {
  0: emptyPodImage,
  1: seedlingPodImage,
  2: youngPodImage,
  3: vegetativePodImage,
  4: floweringPodImage,
  5: harvestReadyPodImage,
  6: cleanupPodImage,
};

// Check if pod should show seedling animation (stage 1)
function shouldShowSeedlingAnimation(pod: { status: string; stage: number | null }): boolean {
  if (pod.status === 'empty' || pod.status === 'dead' || pod.status === 'needs_cleanup' || pod.status === 'harvest_ready') {
    return false;
  }
  return pod.stage === 1 || pod.status === 'seedling';
}

// Get the correct image based on pod status and stage
function getPodImage(pod: { status: string; stage: number | null }): string {
  // Status-based overrides for special states
  if (pod.status === 'empty') return emptyPodImage;
  if (pod.status === 'dead') return cleanupPodImage;
  if (pod.status === 'needs_cleanup') return cleanupPodImage;
  if (pod.status === 'harvest_ready') return harvestReadyPodImage;
  
  // Use stage-based image for growing plants
  const stage = pod.stage ?? 1;
  return stageImages[stage] || seedlingPodImage;
}

interface PodCardProps {
  pod: GrowPod;
  onWater: (id: number) => void;
  onNutrients: (id: number) => void;
  onHarvest: (id: number) => void;
  onCleanup?: (id: number) => void;
  isLoading?: boolean;
}

export function PodCard({ pod, onWater, onNutrients, onHarvest, onCleanup, isLoading = false }: PodCardProps) {
  const [cooldownDisplay, setCooldownDisplay] = useState('');
  const [nutrientCooldownDisplay, setNutrientCooldownDisplay] = useState('');
  
  const isDead = pod.status === 'dead';
  const isHarvestReady = pod.status === 'harvest_ready';
  const needsCleanup = pod.status === 'needs_cleanup';
  const isEmpty = pod.status === 'empty';
  
  const growthProgress = isEmpty ? 0 : (Math.min(pod.stage, 5) / 5) * 100;
  const waterProgress = (pod.waterCount / 10) * 100;
  const nutrientProgress = ((pod.nutrientCount || 0) / 10) * 100;

  useEffect(() => {
    if (pod.waterCooldownRemaining <= 0) {
      setCooldownDisplay('');
      return;
    }
    
    const updateCooldown = () => {
      const now = Date.now();
      const lastWatered = pod.lastWatered;
      const elapsed = Math.floor((now - lastWatered) / 1000);
      const remaining = Math.max(0, WATER_COOLDOWN - elapsed);
      setCooldownDisplay(formatCooldown(remaining));
    };
    
    updateCooldown();
    const interval = setInterval(updateCooldown, 60000);
    return () => clearInterval(interval);
  }, [pod.lastWatered, pod.waterCooldownRemaining]);

  useEffect(() => {
    if (pod.nutrientCooldownRemaining <= 0) {
      setNutrientCooldownDisplay('');
      return;
    }
    
    const updateNutrientCooldown = () => {
      const now = Date.now();
      const lastNutrients = pod.lastNutrients || 0;
      const elapsed = Math.floor((now - lastNutrients) / 1000);
      const remaining = Math.max(0, NUTRIENT_COOLDOWN - elapsed);
      setNutrientCooldownDisplay(formatCooldown(remaining));
    };
    
    updateNutrientCooldown();
    const interval = setInterval(updateNutrientCooldown, 60000);
    return () => clearInterval(interval);
  }, [pod.lastNutrients, pod.nutrientCooldownRemaining]);

  const getStageLabel = () => {
    switch (pod.status) {
      case 'empty': return 'Empty';
      case 'seedling': return 'Seedling';
      case 'vegetative': return 'Vegetative';
      case 'flowering': return 'Flowering';
      case 'mature': return 'Mature';
      case 'harvest_ready': return 'Harvest Ready';
      case 'needs_cleanup': return 'Needs Cleanup';
      case 'dead': return 'Dead';
      default: return 'Unknown';
    }
  };

  const getStatusColor = () => {
    if (isDead || needsCleanup) return "destructive";
    if (isHarvestReady) return "default";
    return "secondary";
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative overflow-hidden rounded-xl border p-6 transition-all duration-300",
        isDead || needsCleanup 
          ? "border-destructive/30 bg-destructive/5" 
          : isHarvestReady 
            ? "border-amber-500/30 bg-amber-500/5 shadow-lg shadow-amber-500/10"
            : "border-primary/20 bg-card/40 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
      )}
      data-testid={`pod-card-${pod.id}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      
      <div className="relative flex justify-between items-start mb-4">
        <div>
          <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
            {pod.name}
            {pod.pests && <AlertTriangle className="h-4 w-4 text-amber-500 animate-pulse" />}
          </h3>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            DNA: {pod.dna ? `${pod.dna.slice(0, 8)}...` : 'N/A'}
          </p>
        </div>
        <Badge variant={getStatusColor()} data-testid={`pod-status-${pod.id}`}>
          {getStageLabel()}
        </Badge>
      </div>

      <div className="relative h-48 w-full bg-black/40 rounded-lg mb-6 flex items-center justify-center border border-white/5 overflow-hidden group">
        <AnimatePresence mode="wait">
          {shouldShowSeedlingAnimation(pod) ? (
            <motion.video
              key={`${pod.status}-${pod.stage}-video`}
              src={seedlingAnimation}
              autoPlay
              loop
              muted
              playsInline
              className="h-full w-full object-contain"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              data-testid={`pod-video-${pod.id}`}
            />
          ) : (
            <motion.img
              key={`${pod.status}-${pod.stage}`}
              src={getPodImage(pod)}
              alt={`GrowPod ${getStageLabel()}`}
              className={cn(
                "h-full w-full object-contain",
                isHarvestReady && "drop-shadow-[0_0_20px_rgba(251,191,36,0.4)]"
              )}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              data-testid={`pod-image-${pod.id}`}
            />
          )}
        </AnimatePresence>
        {isHarvestReady && (
          <motion.div 
            className="absolute inset-0 pointer-events-none"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="absolute inset-0 bg-gradient-radial from-amber-500/20 to-transparent" />
          </motion.div>
        )}
      </div>

      <div className="space-y-4 relative">
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Growth Stage</span>
            <span className="font-mono text-foreground">{Math.min(pod.stage, 5)} / 5</span>
          </div>
          <Progress value={growthProgress} className="h-2 bg-black/40" />
        </div>
        
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <Droplets className="h-3 w-3 text-blue-400" /> Water Count
            </span>
            <span className="font-mono text-foreground">{pod.waterCount} / 10</span>
          </div>
          <Progress value={waterProgress} className="h-2 bg-black/40" />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <FlaskRound className="h-3 w-3 text-green-400" /> Nutrients
            </span>
            <span className="font-mono text-foreground">{pod.nutrientCount || 0} / 10</span>
          </div>
          <Progress value={nutrientProgress} className="h-2 bg-black/40" />
        </div>

        <div className="flex flex-col gap-1">
          {!pod.canWater && cooldownDisplay && !isHarvestReady && !needsCleanup && !isEmpty && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-black/20 rounded px-2 py-1">
              <Clock className="h-3 w-3 text-blue-400" />
              <span>Next water: {cooldownDisplay}</span>
            </div>
          )}
          {!pod.canAddNutrients && nutrientCooldownDisplay && !isHarvestReady && !needsCleanup && !isEmpty && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-black/20 rounded px-2 py-1">
              <Clock className="h-3 w-3 text-green-400" />
              <span>Next nutrients: {nutrientCooldownDisplay}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 relative">
        {isHarvestReady ? (
          <Button 
            className="w-full bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold shadow-lg shadow-amber-500/20"
            onClick={() => onHarvest(pod.id)}
            disabled={isLoading}
            data-testid={`button-harvest-${pod.id}`}
          >
            <Flower className="mr-2 h-4 w-4" /> Harvest
          </Button>
        ) : needsCleanup ? (
          <Button 
            variant="destructive" 
            className="w-full"
            onClick={() => onCleanup?.(pod.id)}
            disabled={isLoading}
            data-testid={`button-cleanup-${pod.id}`}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Clean Pod (500 $BUD)
          </Button>
        ) : isDead ? (
          <Button variant="destructive" className="w-full opacity-50" disabled>
            <Skull className="mr-2 h-4 w-4" /> Dead Plant
          </Button>
        ) : isEmpty ? (
          <Button variant="secondary" className="w-full opacity-50" disabled>
            <Sprout className="mr-2 h-4 w-4" /> Plant a Seed
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button 
              className={cn(
                "flex-1 transition-all", 
                pod.canWater ? "animate-pulse shadow-lg shadow-blue-500/20" : "opacity-80"
              )}
              variant={pod.canWater ? "default" : "secondary"}
              disabled={!pod.canWater || isLoading}
              onClick={() => onWater(pod.id)}
              data-testid={`button-water-${pod.id}`}
            >
              <Droplets className={cn("mr-1 h-4 w-4", pod.canWater ? "text-blue-200" : "")} /> 
              {pod.canWater ? "Water" : "Watered"}
            </Button>
            <Button 
              className={cn(
                "flex-1 transition-all", 
                pod.canAddNutrients ? "shadow-lg shadow-green-500/20 bg-green-600 hover:bg-green-700" : "opacity-80"
              )}
              variant={pod.canAddNutrients ? "default" : "secondary"}
              disabled={!pod.canAddNutrients || isLoading}
              onClick={() => onNutrients(pod.id)}
              data-testid={`button-nutrients-${pod.id}`}
            >
              <FlaskRound className={cn("mr-1 h-4 w-4", pod.canAddNutrients ? "text-green-200" : "")} /> 
              {pod.canAddNutrients ? "Feed" : "Fed"}
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
