import { useAlgorand, useGameState } from "@/hooks/use-algorand";
import { CurrencyDisplay } from "@/components/CurrencyDisplay";
import { PodCard } from "@/components/PodCard";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Plus, Sprout } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { account, isConnected, connectWallet } = useAlgorand();
  const { budBalance, terpBalance, pods } = useGameState(account);
  const { toast } = useToast();

  const handleWater = (id: number) => {
    // In real app: Sign transaction to water smart contract
    toast({
      title: "Watering Pod...",
      description: `Watering initiated for Pod #${id}. Transaction pending.`,
    });
  };

  const handleHarvest = (id: number) => {
    // In real app: Sign transaction to harvest
    toast({
      title: "Harvesting...",
      description: `Harvesting Pod #${id}. Rewards calculating...`,
    });
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Hero / Stats Section */}
      <section className="relative pt-12 pb-12 px-4 overflow-hidden">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-8">
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">
                Command Center
              </h1>
              <p className="text-muted-foreground text-lg">
                Manage your hydroponic empire on Algorand.
              </p>
            </div>
            
            <CurrencyDisplay budAmount={budBalance} terpAmount={terpBalance} />
          </div>

          {!isConnected && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6 mb-8 flex items-center justify-between backdrop-blur-sm"
            >
              <div>
                <h3 className="text-yellow-500 font-bold flex items-center gap-2">
                  Demo Mode Active
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Connect your Pera Wallet to access your real assets and save progress.
                </p>
              </div>
              <Button onClick={connectWallet} variant="outline" className="border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10">
                Connect Wallet
              </Button>
            </motion.div>
          )}

          {/* Action Bar */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-display font-semibold flex items-center gap-2">
              <Sprout className="text-primary" /> Active Grow Pods
            </h2>
            <Link href="/vault">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 group">
                <Plus className="mr-2 h-4 w-4 group-hover:rotate-90 transition-transform" /> 
                Plant New Seed
              </Button>
            </Link>
          </div>

          {/* Pod Grid */}
          {pods.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {pods.map((pod) => (
                <PodCard 
                  key={pod.id} 
                  pod={pod} 
                  onWater={handleWater} 
                  onHarvest={handleHarvest} 
                />
              ))}
              
              {/* Empty Slot Placeholder */}
              <Link href="/vault" className="group relative border-2 border-dashed border-white/10 rounded-xl p-6 flex flex-col items-center justify-center min-h-[300px] hover:border-primary/50 hover:bg-white/5 transition-all cursor-pointer">
                <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform group-hover:bg-primary/20">
                  <Plus className="h-8 w-8 text-muted-foreground group-hover:text-primary" />
                </div>
                <h3 className="font-display font-bold text-muted-foreground group-hover:text-foreground">Empty Pod</h3>
                <p className="text-sm text-muted-foreground/50 mt-1">Plant a seed to start growing</p>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-card/20 rounded-2xl border border-white/5">
              <Sprout className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-xl font-bold text-muted-foreground">No Active Pods</h3>
              <p className="text-muted-foreground/70 mt-2 mb-6">Your hydroponic garden is empty.</p>
              <Link href="/vault">
                <Button>Go to Seed Vault</Button>
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
