import { useSeeds } from "@/hooks/use-algorand";
import { Button } from "@/components/ui/button";
import { Warehouse, ArrowRight, Dna } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function SeedVault() {
  const seeds = useSeeds();
  const { toast } = useToast();

  const handlePlant = (seedId: string) => {
    toast({
      title: "Planting Seed",
      description: `Preparing soil for seed ${seedId}. Transaction pending...`,
    });
  };

  return (
    <div className="min-h-screen py-12 px-4 container mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-indigo-500/20 p-3 rounded-lg">
          <Warehouse className="h-8 w-8 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold">Seed Vault</h1>
          <p className="text-muted-foreground">Your collection of genetic potential.</p>
        </div>
      </div>

      {seeds.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {seeds.map((seed, idx) => (
            <motion.div
              key={seed.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="group relative bg-card border border-border rounded-xl p-6 hover:border-indigo-500/50 transition-all hover:shadow-lg hover:shadow-indigo-500/10"
            >
              <div className="absolute top-4 right-4">
                <span className={cn(
                  "px-2 py-1 text-xs font-bold rounded uppercase",
                  seed.rarity === "Common" ? "bg-slate-500/20 text-slate-400" :
                  seed.rarity === "Rare" ? "bg-blue-500/20 text-blue-400" :
                  "bg-purple-500/20 text-purple-400"
                )}>
                  {seed.rarity}
                </span>
              </div>

              <div className="flex justify-center my-6">
                <div className="relative w-24 h-24 rounded-full bg-black/40 flex items-center justify-center border border-white/10 group-hover:border-indigo-500/30 transition-colors">
                  <div className="absolute inset-0 rounded-full border border-dashed border-white/20 animate-[spin_10s_linear_infinite]" />
                  <Dna className="h-10 w-10 text-indigo-400" />
                </div>
              </div>

              <div className="text-center mb-6">
                <h3 className="font-display font-bold text-lg group-hover:text-indigo-400 transition-colors">{seed.name}</h3>
                <p className="text-xs font-mono text-muted-foreground mt-1 truncate px-4">{seed.dna}</p>
              </div>

              <Button 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={() => handlePlant(seed.id)}
              >
                Plant in Empty Pod <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-card/20 rounded-2xl border border-white/5">
          <Dna className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-xl font-bold text-muted-foreground">No Seeds Yet</h3>
          <p className="text-muted-foreground/70 mt-2 text-center max-w-md">
            Breed plants in the Combiner Lab to create new seeds, or harvest plants to discover rare genetics.
          </p>
        </div>
      )}
    </div>
  );
}
