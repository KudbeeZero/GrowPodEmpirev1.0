import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAlgorand, useGameState } from "@/hooks/use-algorand";
import { 
  Award,
  Sprout,
  Droplets,
  FlaskConical,
  Coins,
  Crown,
  Star,
  Zap,
  Lock,
  CheckCircle2
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  requirement: string;
  check: (stats: PlayerAchievementStats) => boolean;
}

interface PlayerAchievementStats {
  harvestCount: number;
  podSlots: number;
  budBalance: number;
  terpBalance: number;
  isConnected: boolean;
}

const achievements: Achievement[] = [
  {
    id: "first_harvest",
    title: "First Harvest",
    description: "Successfully harvest your first plant",
    icon: Sprout,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/20",
    requirement: "1 harvest",
    check: (stats) => stats.harvestCount >= 1,
  },
  {
    id: "green_thumb",
    title: "Green Thumb",
    description: "Complete 5 successful harvests",
    icon: Droplets,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/20",
    requirement: "5 harvests",
    check: (stats) => stats.harvestCount >= 5,
  },
  {
    id: "master_grower",
    title: "Master Grower",
    description: "Complete 25 successful harvests",
    icon: Crown,
    color: "text-amber-400",
    bgColor: "bg-amber-500/20",
    requirement: "25 harvests",
    check: (stats) => stats.harvestCount >= 25,
  },
  {
    id: "legend",
    title: "Living Legend",
    description: "Complete 100 successful harvests",
    icon: Star,
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
    requirement: "100 harvests",
    check: (stats) => stats.harvestCount >= 100,
  },
  {
    id: "slot_unlock",
    title: "Expansion Pack",
    description: "Unlock your 3rd pod slot",
    icon: Zap,
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/20",
    requirement: "3 pod slots",
    check: (stats) => stats.podSlots >= 3,
  },
  {
    id: "full_farm",
    title: "Full Farm",
    description: "Unlock all 5 pod slots",
    icon: Award,
    color: "text-orange-400",
    bgColor: "bg-orange-500/20",
    requirement: "5 pod slots",
    check: (stats) => stats.podSlots >= 5,
  },
  {
    id: "terp_hunter",
    title: "Terpene Hunter",
    description: "Earn your first $TERP from a rare terpene discovery",
    icon: FlaskConical,
    color: "text-pink-400",
    bgColor: "bg-pink-500/20",
    requirement: "Any $TERP earned",
    check: (stats) => stats.terpBalance > 0,
  },
  {
    id: "bud_baron",
    title: "$BUD Baron",
    description: "Accumulate 10,000 $BUD tokens",
    icon: Coins,
    color: "text-green-400",
    bgColor: "bg-green-500/20",
    requirement: "10,000 $BUD",
    check: (stats) => stats.budBalance >= 10000,
  },
];

function AchievementCard({ 
  achievement, 
  isUnlocked,
  delay = 0 
}: { 
  achievement: Achievement; 
  isUnlocked: boolean;
  delay?: number;
}) {
  const Icon = achievement.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
    >
      <Card className={cn(
        "relative overflow-hidden transition-all",
        isUnlocked 
          ? "border-primary/30 hover:border-primary/50" 
          : "border-white/5 opacity-60"
      )}>
        {isUnlocked && (
          <div className="absolute top-3 right-3">
            <CheckCircle2 className="h-5 w-5 text-primary" />
          </div>
        )}
        {!isUnlocked && (
          <div className="absolute top-3 right-3">
            <Lock className="h-5 w-5 text-muted-foreground/50" />
          </div>
        )}
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className={cn(
              "p-3 rounded-lg shrink-0 transition-all",
              isUnlocked ? achievement.bgColor : "bg-muted/20"
            )}>
              <Icon className={cn(
                "h-6 w-6 transition-colors",
                isUnlocked ? achievement.color : "text-muted-foreground/50"
              )} />
            </div>
            <div className="flex-1">
              <h3 className={cn(
                "font-display font-bold",
                isUnlocked ? "" : "text-muted-foreground"
              )}>
                {achievement.title}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {achievement.description}
              </p>
              <p className={cn(
                "text-xs mt-2 font-mono",
                isUnlocked ? "text-primary" : "text-muted-foreground/50"
              )}>
                {achievement.requirement}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Achievements() {
  const { isConnected, account } = useAlgorand();
  const { harvestCount, podSlots, budBalance, terpBalance } = useGameState(account);

  const stats: PlayerAchievementStats = {
    harvestCount: harvestCount || 0,
    podSlots: podSlots || 2,
    budBalance: typeof budBalance === 'string' ? parseFloat(budBalance) : (budBalance || 0),
    terpBalance: typeof terpBalance === 'string' ? parseFloat(terpBalance) : (terpBalance || 0),
    isConnected,
  };

  const unlockedCount = achievements.filter(a => a.check(stats)).length;

  return (
    <div className="min-h-screen py-12 px-4 container mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-purple-500/20 p-3 rounded-lg">
          <Award className="h-8 w-8 text-purple-400" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold">Achievements</h1>
          <p className="text-muted-foreground">
            {isConnected 
              ? `${unlockedCount} of ${achievements.length} unlocked`
              : "Connect wallet to track progress"
            }
          </p>
        </div>
      </div>

      <Card className="mb-8 border-primary/20">
        <CardHeader>
          <CardTitle className="font-display">Your Progress</CardTitle>
          <CardDescription>
            Complete milestones to unlock achievements and show off your growing skills!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(unlockedCount / achievements.length) * 100}%` }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="h-full bg-gradient-to-r from-primary to-emerald-400"
              />
            </div>
            <span className="text-sm font-mono text-primary">
              {Math.round((unlockedCount / achievements.length) * 100)}%
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {achievements.map((achievement, idx) => (
          <AchievementCard
            key={achievement.id}
            achievement={achievement}
            isUnlocked={achievement.check(stats)}
            delay={idx * 0.05}
          />
        ))}
      </div>
    </div>
  );
}
