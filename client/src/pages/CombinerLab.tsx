import { useState } from "react";
import { FlaskConical, Plus, Atom } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSeeds, useTransactions, useAlgorand, CONTRACT_CONFIG } from "@/hooks/use-algorand";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function CombinerLab() {
  const seeds = useSeeds();
  const { toast } = useToast();
  const { isConnected } = useAlgorand();
  const { breedPlants } = useTransactions();
  const [selectedParent1, setSelectedParent1] = useState<string | null>(null);
  const [selectedParent2, setSelectedParent2] = useState<string | null>(null);
  const [isBreeding, setIsBreeding] = useState(false);

  const isContractConfigured = CONTRACT_CONFIG.appId > 0;

  const handleSelect = (id: string) => {
    if (selectedParent1 === id) {
      setSelectedParent1(null);
    } else if (selectedParent2 === id) {
      setSelectedParent2(null);
    } else if (!selectedParent1) {
      setSelectedParent1(id);
    } else if (!selectedParent2) {
      setSelectedParent2(id);
    }
  };

  const handleBreed = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet Required",
        description: "Please connect your Pera Wallet first.",
        variant: "destructive",
      });
      return;
    }

    if (!isContractConfigured) {
      toast({
        title: "Contract Not Deployed",
        description: "The smart contract has not been deployed yet.",
        variant: "destructive",
      });
      return;
    }

    setIsBreeding(true);
    toast({
      title: "Breeding Initiated",
      description: "Burning 1000 $BUD to fuse genetic material...",
    });

    try {
      const txId = await breedPlants();
      toast({
        title: "Breeding Complete!",
        description: `New hybrid seed created! TX: ${txId?.slice(0, 8)}...`,
      });
      setSelectedParent1(null);
      setSelectedParent2(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Transaction failed';
      toast({
        title: "Breeding Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsBreeding(false);
    }
  };

  const isReady = selectedParent1 && selectedParent2;

  return (
    <div className="min-h-screen py-12 px-4 container mx-auto">
      <div className="flex flex-col items-center text-center mb-12">
        <div className="bg-purple-500/20 p-4 rounded-full mb-4">
          <FlaskConical className="h-10 w-10 text-purple-400" />
        </div>
        <h1 className="text-4xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
          Genetic Combiner Lab
        </h1>
        <p className="text-muted-foreground mt-2 max-w-lg">
          Select two parent seeds to breed a new hybrid strain. Breeding costs BUD tokens and may result in mutations.
        </p>
      </div>

      {/* Breeding Slots */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-16">
        {/* Slot 1 */}
        <div className={cn(
          "w-48 h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all",
          selectedParent1 ? "border-purple-500 bg-purple-500/10" : "border-white/20 bg-black/20"
        )}>
          {selectedParent1 ? (
            <>
              <Atom className="h-12 w-12 text-purple-400 animate-pulse mb-4" />
              <span className="font-bold text-purple-200">Parent #1 Selected</span>
              <Button variant="ghost" size="sm" onClick={() => setSelectedParent1(null)} className="mt-4 hover:bg-purple-500/20">Remove</Button>
            </>
          ) : (
            <span className="text-muted-foreground">Select Parent 1</span>
          )}
        </div>

        {/* Action Button */}
        <div className="relative">
          <div className="absolute inset-0 bg-purple-500 blur-xl opacity-20 rounded-full" />
          <Button 
            size="lg" 
            className={cn(
              "rounded-full h-16 w-16 p-0 border-4 border-background transition-all",
              isReady && !isBreeding ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-110 shadow-lg shadow-purple-500/40" : "bg-muted cursor-not-allowed"
            )}
            disabled={!isReady || isBreeding}
            onClick={handleBreed}
            data-testid="button-breed-confirm"
          >
            <Plus className={cn("h-8 w-8", isReady && !isBreeding ? "text-white" : "text-muted-foreground", isBreeding && "animate-spin")} />
          </Button>
        </div>

        {/* Slot 2 */}
        <div className={cn(
          "w-48 h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all",
          selectedParent2 ? "border-pink-500 bg-pink-500/10" : "border-white/20 bg-black/20"
        )}>
          {selectedParent2 ? (
            <>
              <Atom className="h-12 w-12 text-pink-400 animate-pulse mb-4" />
              <span className="font-bold text-pink-200">Parent #2 Selected</span>
              <Button variant="ghost" size="sm" onClick={() => setSelectedParent2(null)} className="mt-4 hover:bg-pink-500/20">Remove</Button>
            </>
          ) : (
            <span className="text-muted-foreground">Select Parent 2</span>
          )}
        </div>
      </div>

      {/* Inventory Selection */}
      <h3 className="font-display font-bold text-xl mb-6 border-b border-white/10 pb-2">Available Seeds</h3>
      {seeds.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {seeds.map((seed) => {
            const isSelected = selectedParent1 === seed.id || selectedParent2 === seed.id;
            return (
              <div 
                key={seed.id}
                onClick={() => handleSelect(seed.id)}
                className={cn(
                  "cursor-pointer border rounded-lg p-4 transition-all hover:bg-white/5",
                  isSelected ? "border-purple-500 bg-purple-500/10 ring-1 ring-purple-500" : "border-white/10"
                )}
              >
                <div className="text-sm font-bold truncate">{seed.name}</div>
                <div className="text-xs text-muted-foreground mt-1">{seed.rarity}</div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 bg-card/20 rounded-xl border border-white/5">
          <Atom className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-bold text-muted-foreground">No Seeds Available</h3>
          <p className="text-muted-foreground/70 mt-2 text-center max-w-md">
            Harvest plants to collect seeds for breeding. Costs 1000 $BUD per breed.
          </p>
        </div>
      )}
    </div>
  );
}
