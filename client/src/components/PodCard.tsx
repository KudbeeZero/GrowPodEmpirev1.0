import { MockPod } from "@/hooks/use-algorand";
import { cn } from "@/lib/utils";
import { Droplets, Skull, Flower, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { motion } from "framer-motion";

interface PodCardProps {
  pod: MockPod;
  onWater: (id: number) => void;
  onHarvest: (id: number) => void;
}

export function PodCard({ pod, onWater, onHarvest }: PodCardProps) {
  const isDead = pod.status === "dead";
  const isHarvestReady = pod.status === "harvest_ready";
  const needsWater = pod.status === "active" && (Date.now() - pod.lastWatered > 86400000); // > 24h
  
  // Calculate progress relative to max stage (5)
  const growthProgress = (pod.stage / 5) * 100;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative overflow-hidden rounded-xl border p-6 transition-all duration-300",
        isDead ? "border-destructive/30 bg-destructive/5" : "border-primary/20 bg-card/40 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
      )}
    >
      {/* Background Texture/Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      
      {/* Header */}
      <div className="relative flex justify-between items-start mb-4">
        <div>
          <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
            {pod.name}
            {pod.pests && <AlertTriangle className="h-4 w-4 text-amber-500 animate-pulse" />}
          </h3>
          <p className="text-xs text-muted-foreground font-mono mt-1">DNA: {pod.dna}</p>
        </div>
        <div className={cn(
          "px-2 py-1 rounded text-xs font-bold uppercase tracking-wider",
          isDead ? "bg-destructive/20 text-destructive" : 
          isHarvestReady ? "bg-amber-500/20 text-amber-500" : "bg-primary/20 text-primary"
        )}>
          {pod.status.replace("_", " ")}
        </div>
      </div>

      {/* Visual Representation (Placeholder for NFT Art) */}
      <div className="relative h-32 w-full bg-black/20 rounded-lg mb-6 flex items-center justify-center border border-white/5 overflow-hidden group">
         {/* Simple visualization based on stage */}
         {isDead ? (
           <Skull className="h-16 w-16 text-muted-foreground/50" />
         ) : isHarvestReady ? (
           <Flower className="h-16 w-16 text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)] animate-bounce" />
         ) : (
           <div className="relative">
             <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-24 bg-gradient-to-t from-green-800 to-green-500 rounded-full origin-bottom transition-all" style={{ height: `${(pod.stage + 1) * 15}%` }} />
             <div className="absolute bottom-[20%] left-1/2 -translate-x-1/2 w-12 h-12 bg-green-500/20 rounded-full blur-xl" />
           </div>
         )}
      </div>

      {/* Stats */}
      <div className="space-y-4 relative">
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Growth Stage</span>
            <span className="font-mono text-foreground">{pod.stage} / 5</span>
          </div>
          <Progress value={growthProgress} className="h-2 bg-black/40" indicatorClassName="bg-primary" />
        </div>
        
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Health</span>
            <span className={cn("font-mono", pod.health < 50 ? "text-destructive" : "text-green-400")}>
              {pod.health}%
            </span>
          </div>
          <Progress value={pod.health} className="h-2 bg-black/40" indicatorClassName={pod.health < 50 ? "bg-destructive" : "bg-green-500"} />
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex gap-3 relative">
        {isHarvestReady ? (
          <Button 
            className="w-full bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold shadow-lg shadow-amber-500/20"
            onClick={() => onHarvest(pod.id)}
          >
            <Flower className="mr-2 h-4 w-4" /> Harvest
          </Button>
        ) : isDead ? (
          <Button variant="destructive" className="w-full opacity-50 cursor-not-allowed" disabled>
            <Skull className="mr-2 h-4 w-4" /> Dead Plant
          </Button>
        ) : (
          <Button 
            className={cn(
              "w-full transition-all", 
              needsWater ? "animate-pulse shadow-lg shadow-blue-500/20" : "opacity-80"
            )}
            variant={needsWater ? "default" : "secondary"}
            disabled={!needsWater}
            onClick={() => onWater(pod.id)}
          >
            <Droplets className={cn("mr-2 h-4 w-4", needsWater ? "text-blue-200" : "")} /> 
            {needsWater ? "Water Now" : "Hydrated"}
          </Button>
        )}
      </div>
    </motion.div>
  );
}
