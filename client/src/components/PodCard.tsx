import { type GrowPod, formatCooldown } from "@/hooks/use-algorand";
import { cn } from "@/lib/utils";
import { 
  Droplets, 
  Skull, 
  Flower, 
  AlertTriangle, 
  Trash2,
  Sprout,
  Clock
} from "lucide-react";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import seedlingPodImage from "@assets/8FB8A93B-2A96-4974-88BB-83E5EA7E9FA2_1768610870600.png";

interface PodCardProps {
  pod: GrowPod;
  onWater: (id: number) => void;
  onHarvest: (id: number) => void;
  onCleanup?: (id: number) => void;
  isLoading?: boolean;
}

export function PodCard({ pod, onWater, onHarvest, onCleanup, isLoading = false }: PodCardProps) {
  const [cooldownDisplay, setCooldownDisplay] = useState('');
  
  const isDead = pod.status === 'dead';
  const isHarvestReady = pod.status === 'harvest_ready';
  const needsCleanup = pod.status === 'needs_cleanup';
  const isEmpty = pod.status === 'empty';
  
  const growthProgress = isEmpty ? 0 : (Math.min(pod.stage, 5) / 5) * 100;
  const waterProgress = (pod.waterCount / 10) * 100;

  useEffect(() => {
    if (pod.waterCooldownRemaining <= 0) {
      setCooldownDisplay('');
      return;
    }
    
    const updateCooldown = () => {
      const now = Date.now();
      const lastWatered = pod.lastWatered;
      const elapsed = Math.floor((now - lastWatered) / 1000);
      const remaining = Math.max(0, 86400 - elapsed);
      setCooldownDisplay(formatCooldown(remaining));
    };
    
    updateCooldown();
    const interval = setInterval(updateCooldown, 60000);
    return () => clearInterval(interval);
  }, [pod.lastWatered, pod.waterCooldownRemaining]);

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
        {isEmpty ? (
          <div className="text-center">
            <Sprout className="h-12 w-12 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">No plant</p>
          </div>
        ) : isDead || needsCleanup ? (
          <Skull className="h-16 w-16 text-muted-foreground/50" />
        ) : isHarvestReady ? (
          <Flower className="h-16 w-16 text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)] animate-bounce" />
        ) : (
          <img 
            src={seedlingPodImage} 
            alt="GrowPod Seedling" 
            className="h-full w-full object-contain"
          />
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
            <span className="text-muted-foreground">Water Count</span>
            <span className="font-mono text-foreground">{pod.waterCount} / 10</span>
          </div>
          <Progress value={waterProgress} className="h-2 bg-black/40" />
        </div>

        {!pod.canWater && cooldownDisplay && !isHarvestReady && !needsCleanup && !isEmpty && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-black/20 rounded px-2 py-1">
            <Clock className="h-3 w-3" />
            <span>Next water: {cooldownDisplay}</span>
          </div>
        )}
      </div>

      <div className="mt-6 flex gap-3 relative">
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
          <Button 
            className={cn(
              "w-full transition-all", 
              pod.canWater ? "animate-pulse shadow-lg shadow-blue-500/20" : "opacity-80"
            )}
            variant={pod.canWater ? "default" : "secondary"}
            disabled={!pod.canWater || isLoading}
            onClick={() => onWater(pod.id)}
            data-testid={`button-water-${pod.id}`}
          >
            <Droplets className={cn("mr-2 h-4 w-4", pod.canWater ? "text-blue-200" : "")} /> 
            {pod.canWater ? "Water Now" : cooldownDisplay || "Hydrated"}
          </Button>
        )}
      </div>
    </motion.div>
  );
}
