import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { 
  Trophy, 
  Sprout, 
  Coins, 
  FlaskConical,
  Crown,
  Medal,
  Award,
  Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LeaderboardEntry {
  rank: number;
  wallet: string;
  value: number;
  displayValue: string;
}

function LeaderboardTable({ 
  entries, 
  valueLabel,
  isLoading 
}: { 
  entries: LeaderboardEntry[]; 
  valueLabel: string;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isLoading && entries.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Trophy className="h-12 w-12 mx-auto mb-4 opacity-30" />
        <p>No data yet. Be the first to make the leaderboard!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wide">
        <div className="col-span-1">Rank</div>
        <div className="col-span-8">Wallet</div>
        <div className="col-span-3 text-right">{valueLabel}</div>
      </div>
      {entries.map((entry, idx) => (
        <motion.div
          key={entry.wallet}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          className={cn(
            "grid grid-cols-12 gap-4 px-4 py-3 rounded-lg items-center",
            entry.rank === 1 ? "bg-amber-500/10 border border-amber-500/20" :
            entry.rank === 2 ? "bg-slate-400/10 border border-slate-400/20" :
            entry.rank === 3 ? "bg-orange-600/10 border border-orange-600/20" :
            "bg-card/50 border border-white/5"
          )}
        >
          <div className="col-span-1 flex items-center gap-2">
            {entry.rank === 1 ? (
              <Crown className="h-5 w-5 text-amber-400" />
            ) : entry.rank === 2 ? (
              <Medal className="h-5 w-5 text-slate-400" />
            ) : entry.rank === 3 ? (
              <Award className="h-5 w-5 text-orange-500" />
            ) : (
              <span className="text-muted-foreground font-mono">{entry.rank}</span>
            )}
          </div>
          <div className="col-span-8 font-mono text-sm truncate">
            {entry.wallet.slice(0, 8)}...{entry.wallet.slice(-6)}
          </div>
          <div className="col-span-3 text-right font-bold text-primary">
            {entry.displayValue}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default function Leaderboards() {
  const { data: harvestLeaders = [], isLoading: harvestLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ['/api/leaderboard/harvests'],
    staleTime: 60000,
  });

  const { data: budLeaders = [], isLoading: budLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ['/api/leaderboard/bud'],
    staleTime: 60000,
  });

  const { data: terpLeaders = [], isLoading: terpLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ['/api/leaderboard/terp'],
    staleTime: 60000,
  });

  return (
    <div className="min-h-screen py-12 px-4 container mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-amber-500/20 p-3 rounded-lg">
          <Trophy className="h-8 w-8 text-amber-400" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold">Leaderboards</h1>
          <p className="text-muted-foreground">Top growers in GrowPod Empire.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display">Rankings</CardTitle>
          <CardDescription>
            See who's leading the pack in harvests, $BUD earned, and rare terpene discoveries.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="harvests" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="harvests" className="gap-2" data-testid="tab-harvests">
                <Sprout className="h-4 w-4" />
                <span className="hidden sm:inline">Harvests</span>
              </TabsTrigger>
              <TabsTrigger value="bud" className="gap-2" data-testid="tab-bud">
                <Coins className="h-4 w-4" />
                <span className="hidden sm:inline">$BUD Earned</span>
              </TabsTrigger>
              <TabsTrigger value="terp" className="gap-2" data-testid="tab-terp">
                <FlaskConical className="h-4 w-4" />
                <span className="hidden sm:inline">$TERP Earned</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="harvests">
              <LeaderboardTable 
                entries={harvestLeaders} 
                valueLabel="Harvests"
                isLoading={harvestLoading}
              />
            </TabsContent>

            <TabsContent value="bud">
              <LeaderboardTable 
                entries={budLeaders} 
                valueLabel="$BUD"
                isLoading={budLoading}
              />
            </TabsContent>

            <TabsContent value="terp">
              <LeaderboardTable 
                entries={terpLeaders} 
                valueLabel="$TERP"
                isLoading={terpLoading}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <Card className="border-amber-500/20">
          <CardContent className="pt-6 text-center">
            <Crown className="h-10 w-10 text-amber-400 mx-auto mb-3" />
            <h3 className="font-display font-bold">Top Harvester</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Most total harvests completed
            </p>
          </CardContent>
        </Card>

        <Card className="border-emerald-500/20">
          <CardContent className="pt-6 text-center">
            <Coins className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
            <h3 className="font-display font-bold">$BUD Baron</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Most $BUD tokens earned
            </p>
          </CardContent>
        </Card>

        <Card className="border-purple-500/20">
          <CardContent className="pt-6 text-center">
            <FlaskConical className="h-10 w-10 text-purple-400 mx-auto mb-3" />
            <h3 className="font-display font-bold">Terpene Hunter</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Most rare terpenes discovered
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
