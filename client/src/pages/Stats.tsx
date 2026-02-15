import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { 
  BarChart3, 
  Sprout, 
  Coins, 
  Users, 
  FlaskConical,
  Loader2,
  TrendingUp
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlobalStats {
  totalHarvests: number;
  totalBudMinted: string;
  totalPlayers: number;
  rareTerpenesFound: number;
}

function formatLargeNumber(num: number | string): string {
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (n >= 1000000000) {
    return `${(n / 1000000000).toFixed(2)}B`;
  } else if (n >= 1000000) {
    return `${(n / 1000000).toFixed(2)}M`;
  } else if (n >= 1000) {
    return `${(n / 1000).toFixed(1)}K`;
  }
  return n.toLocaleString();
}

function StatCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  color,
  delay = 0 
}: { 
  title: string; 
  value: string | number; 
  description: string; 
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className="border-white/5 hover:border-white/10 transition-colors">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-3xl font-display font-bold mt-2">{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            </div>
            <div className={cn("p-3 rounded-lg", color)}>
              <Icon className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Stats() {
  const { data: stats, isLoading, isError } = useQuery<GlobalStats>({
    queryKey: ['/api/stats/global'],
    staleTime: 30000,
    retry: 2,
  });

  const budMinted = stats?.totalBudMinted 
    ? formatLargeNumber(parseFloat(stats.totalBudMinted) / 1000000) 
    : '0';

  return (
    <div className="min-h-screen py-12 px-4 container mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-cyan-500/20 p-3 rounded-lg">
          <BarChart3 className="h-8 w-8 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold">Global Statistics</h1>
          <p className="text-muted-foreground">Live metrics from GrowPod Empire.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <BarChart3 className="h-12 w-12 mb-4 opacity-30" />
          <p>Unable to load statistics. Please try again later.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12">
            <StatCard
              title="Total Harvests"
              value={formatLargeNumber(stats?.totalHarvests || 0)}
              description="Plants successfully grown"
              icon={Sprout}
              color="bg-emerald-500/20 text-emerald-400"
              delay={0}
            />
            <StatCard
              title="$BUD Minted"
              value={budMinted}
              description="Total tokens distributed"
              icon={Coins}
              color="bg-green-500/20 text-green-400"
              delay={0.1}
            />
            <StatCard
              title="Active Growers"
              value={formatLargeNumber(stats?.totalPlayers || 0)}
              description="Players with harvests"
              icon={Users}
              color="bg-blue-500/20 text-blue-400"
              delay={0.2}
            />
            <StatCard
              title="Rare Terpenes"
              value={formatLargeNumber(stats?.rareTerpenesFound || 0)}
              description="Rare profiles discovered"
              icon={FlaskConical}
              color="bg-purple-500/20 text-purple-400"
              delay={0.3}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Economy Health
                </CardTitle>
                <CardDescription>
                  Token distribution and game economy metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">$BUD Supply Cap</span>
                    <span className="font-mono">10,000,000,000</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">$TERP Fixed Supply</span>
                    <span className="font-mono">100,000,000</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Slot Tokens Fixed</span>
                    <span className="font-mono">1,000,000</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-amber-500/20">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <Coins className="h-5 w-5 text-amber-400" />
                  Token Burns
                </CardTitle>
                <CardDescription>
                  Tokens removed from circulation through gameplay
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Cleanup Cost</span>
                    <span className="font-mono text-red-400">-500 $BUD</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Breeding Cost</span>
                    <span className="font-mono text-red-400">-1,000 $BUD</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Slot Token Claim</span>
                    <span className="font-mono text-red-400">-2,500 $BUD</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
