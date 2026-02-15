import { Sprout, TrendingUp, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGameState, useAlgorand } from "@/hooks/use-algorand";

export default function CureVault() {
  const { account } = useAlgorand();
  const { budBalance } = useGameState(account);

  return (
    <div className="min-h-screen py-12 px-4 container mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-emerald-500/20 p-3 rounded-lg">
          <Lock className="h-8 w-8 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold">Curing Vault</h1>
          <p className="text-muted-foreground">Stake your harvest to cure it and earn bonuses.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Staking Panel */}
        <div className="bg-card border border-white/10 rounded-xl p-8 shadow-xl">
          <h2 className="text-2xl font-bold mb-6">Stake BUD</h2>
          
          <div className="bg-black/30 rounded-lg p-4 mb-6">
            <div className="flex justify-between text-sm text-muted-foreground mb-1">
              <span>Available Balance</span>
              <span>{budBalance} BUD</span>
            </div>
            <div className="text-3xl font-mono font-bold text-primary">0.00</div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">APY</span>
              <span className="text-muted-foreground">Coming soon</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Lock Period</span>
              <span className="text-muted-foreground">Coming soon</span>
            </div>
          </div>

          <Button className="w-full mt-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12" disabled>
            Staking Coming Soon
          </Button>
        </div>

        {/* Stats Panel */}
        <div className="space-y-6">
          <div className="bg-card/50 border border-white/5 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="text-emerald-400 h-5 w-5" />
              <h3 className="font-bold">Total Value Locked</h3>
            </div>
            <p className="text-3xl font-display font-bold">0 BUD</p>
            <p className="text-xs text-muted-foreground mt-1">Coming soon</p>
          </div>

          <div className="bg-card/50 border border-white/5 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Sprout className="text-emerald-400 h-5 w-5" />
              <h3 className="font-bold">Your Rewards</h3>
            </div>
            <p className="text-3xl font-display font-bold text-emerald-400">0.00 BUD</p>
            <Button variant="outline" size="sm" className="mt-4 w-full">Claim Rewards</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
