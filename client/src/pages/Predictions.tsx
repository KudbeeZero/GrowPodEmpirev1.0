import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAlgorand } from "@/hooks/use-algorand";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Clock,
  Flame,
  Wallet,
  ChevronRight,
  Loader2,
  BarChart3,
  Lock,
  Info,
} from "lucide-react";

interface PredictionMarket {
  id: number;
  title: string;
  description?: string;
  category: string;
  asset?: string;
  targetPrice?: string;
  comparison?: string;
  expirationTime: string;
  outcome?: string;
  yesPrice: number;
  noPrice: number;
  totalYesShares: string;
  totalNoShares: string;
  totalVolume: string;
  status: string;
}

interface MarketPosition {
  marketId: number;
  marketTitle: string;
  marketStatus: string;
  marketOutcome?: string;
  yesShares: string;
  noShares: string;
  avgYesPrice: number;
  avgNoPrice: number;
  currentYesPrice: number;
  currentNoPrice: number;
  expirationTime: string;
}

interface SmokeBalance {
  balance: string;
  totalBurned: string;
  totalWon: string;
  totalLost: string;
}

function formatTimeRemaining(expirationTime: string): string {
  const expiration = new Date(expirationTime);
  const now = new Date();
  const diff = expiration.getTime() - now.getTime();

  if (diff <= 0) return "Expired";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatSmoke(amount: string): string {
  const num = BigInt(amount || "0");
  const decimals = 1000000n;
  
  // Use BigInt division to get whole part
  const whole = num / decimals;
  const remainder = num % decimals;
  
  // Convert to number only after division for display
  const wholeNum = Number(whole);
  const fractional = Number(remainder) / 1000000;
  const total = wholeNum + fractional;
  
  if (wholeNum >= 1000000) return `${(wholeNum / 1000000).toFixed(1)}M`;
  if (wholeNum >= 1000) return `${(wholeNum / 1000).toFixed(1)}K`;
  return total.toFixed(2);
}

function MarketCard({
  market,
  onClick,
}: {
  market: PredictionMarket;
  onClick: () => void;
}) {
  const yesChance = market.yesPrice;
  const timeRemaining = formatTimeRemaining(market.expirationTime);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      className={cn(
        "cursor-pointer border rounded-xl p-4 transition-all",
        "bg-card/50 hover:bg-card border-white/10 hover:border-primary/30"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">
            {market.category}
          </span>
          {market.asset && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
              {market.asset}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{timeRemaining}</span>
        </div>
      </div>

      <h3 className="text-lg font-semibold mb-4 line-clamp-2">{market.title}</h3>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-2xl font-bold",
              yesChance >= 50 ? "text-emerald-400" : "text-rose-400"
            )}
          >
            {yesChance}%
          </span>
          <span className="text-sm text-muted-foreground">chance</span>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
          >
            Yes {market.yesPrice}¢
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20"
          >
            No {market.noPrice}¢
          </Button>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-muted-foreground">
        <span>Volume: {formatSmoke(market.totalVolume)} $SMOKE</span>
        <ChevronRight className="h-4 w-4" />
      </div>
    </motion.div>
  );
}

function MarketDetailModal({
  market,
  isOpen,
  onClose,
  smokeBalance,
  onBuy,
  isPending,
}: {
  market: PredictionMarket | null;
  isOpen: boolean;
  onClose: () => void;
  smokeBalance: string;
  onBuy: (side: "yes" | "no", shares: string) => void;
  isPending: boolean;
}) {
  const [selectedSide, setSelectedSide] = useState<"yes" | "no">("yes");
  const [amount, setAmount] = useState("");

  if (!market) return null;

  const pricePerShare = selectedSide === "yes" ? market.yesPrice : market.noPrice;
  const totalCost = amount ? (parseInt(amount) * pricePerShare).toString() : "0";
  const potentialWin = amount ? (parseInt(amount) * 100).toString() : "0";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              {market.category}
            </span>
            {market.asset && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                {market.asset}
              </span>
            )}
          </div>
          <DialogTitle className="text-xl pr-8">{market.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Probability Display */}
          <div className="flex items-center justify-center gap-8 py-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-emerald-400">
                {market.yesPrice}%
              </div>
              <div className="text-sm text-muted-foreground">Yes</div>
            </div>
            <div className="h-12 w-px bg-white/10" />
            <div className="text-center">
              <div className="text-4xl font-bold text-rose-400">
                {market.noPrice}%
              </div>
              <div className="text-sm text-muted-foreground">No</div>
            </div>
          </div>

          {/* Key Stats */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-black/20 rounded-lg">
            <div>
              <div className="text-sm text-muted-foreground">Time Remaining</div>
              <div className="text-lg font-semibold">
                {formatTimeRemaining(market.expirationTime)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total Volume</div>
              <div className="text-lg font-semibold">
                {formatSmoke(market.totalVolume)} $SMOKE
              </div>
            </div>
          </div>

          {market.description && (
            <div className="p-4 bg-black/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">About</span>
              </div>
              <p className="text-sm text-muted-foreground">{market.description}</p>
            </div>
          )}

          {/* Buy Interface */}
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                className={cn(
                  "flex-1 h-12 text-lg font-semibold transition-all",
                  selectedSide === "yes"
                    ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                    : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                )}
                variant={selectedSide === "yes" ? "default" : "outline"}
                onClick={() => setSelectedSide("yes")}
              >
                Yes · {market.yesPrice}¢
              </Button>
              <Button
                className={cn(
                  "flex-1 h-12 text-lg font-semibold transition-all",
                  selectedSide === "no"
                    ? "bg-rose-500 hover:bg-rose-600 text-white"
                    : "bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20"
                )}
                variant={selectedSide === "no" ? "default" : "outline"}
                onClick={() => setSelectedSide("no")}
              >
                No · {market.noPrice}¢
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                Number of shares
              </label>
              <Input
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-12 text-lg"
              />
            </div>

            <div className="p-4 bg-black/20 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cost</span>
                <span>{formatSmoke(totalCost)} $SMOKE</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Potential return</span>
                <span className="text-emerald-400">
                  {formatSmoke(potentialWin)} $SMOKE
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Your balance</span>
                <span>{formatSmoke(smokeBalance)} $SMOKE</span>
              </div>
            </div>

            <Button
              className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
              disabled={
                !amount ||
                parseInt(amount) <= 0 ||
                BigInt(totalCost) > BigInt(smokeBalance) ||
                isPending
              }
              onClick={() => onBuy(selectedSide, amount)}
            >
              {isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : BigInt(totalCost) > BigInt(smokeBalance) ? (
                "Insufficient $SMOKE"
              ) : (
                `Buy ${selectedSide.toUpperCase()}`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function BurnBudDialog({
  isOpen,
  onClose,
  onBurn,
  isPending,
}: {
  isOpen: boolean;
  onClose: () => void;
  onBurn: (amount: string) => void;
  isPending: boolean;
}) {
  const [budAmount, setBudAmount] = useState("");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Burn $BUD for $SMOKE
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <p className="text-sm text-muted-foreground">
            Burn your harvested $BUD tokens to receive $SMOKE for prediction
            trading. The exchange rate is 1:1.
          </p>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              Amount of $BUD to burn
            </label>
            <Input
              type="number"
              placeholder="0"
              value={budAmount}
              onChange={(e) => setBudAmount(e.target.value)}
              className="h-12 text-lg"
            />
          </div>

          <div className="p-4 bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-lg">
            <div className="flex items-center gap-2 text-orange-400 mb-2">
              <Flame className="h-4 w-4" />
              <span className="font-medium">You will receive</span>
            </div>
            <div className="text-2xl font-bold">
              {budAmount || "0"} $SMOKE
            </div>
          </div>

          <Button
            className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500"
            disabled={!budAmount || parseInt(budAmount) <= 0 || isPending}
            onClick={() => onBurn(budAmount)}
          >
            {isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Flame className="h-5 w-5 mr-2" />
                Burn $BUD
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Predictions() {
  const { toast } = useToast();
  const { account } = useAlgorand();
  const [selectedMarket, setSelectedMarket] = useState<PredictionMarket | null>(null);
  const [showBurnDialog, setShowBurnDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("markets");

  // Fetch markets
  const { data: markets = [], isLoading: marketsLoading } = useQuery<PredictionMarket[]>({
    queryKey: ["/api/markets", { status: "open" }],
    queryFn: async () => {
      const res = await fetch("/api/markets?status=open");
      return res.json();
    },
    staleTime: 10000,
  });

  // Fetch smoke balance
  const { data: smokeData } = useQuery<SmokeBalance>({
    queryKey: ["/api/smoke", account],
    queryFn: async () => {
      if (!account) return { balance: "0", totalBurned: "0", totalWon: "0", totalLost: "0" };
      const res = await fetch(`/api/smoke/${account}`);
      return res.json();
    },
    enabled: !!account,
    staleTime: 5000,
  });

  // Fetch positions
  const { data: positions = [] } = useQuery<MarketPosition[]>({
    queryKey: ["/api/positions", account],
    queryFn: async () => {
      if (!account) return [];
      const res = await fetch(`/api/positions/${account}`);
      return res.json();
    },
    enabled: !!account,
    staleTime: 10000,
  });

  // Burn mutation
  const burnMutation = useMutation({
    mutationFn: async (budAmount: string) => {
      return await apiRequest("POST", "/api/smoke/burn", {
        walletAddress: account,
        budAmount: (BigInt(budAmount) * BigInt(1000000)).toString(), // Convert to micro units
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/smoke", account] });
      setShowBurnDialog(false);
      toast({ title: "$BUD burned! $SMOKE credited to your balance." });
    },
    onError: () => {
      toast({ title: "Failed to burn $BUD", variant: "destructive" });
    },
  });

  // Buy shares mutation
  const buyMutation = useMutation({
    mutationFn: async ({
      marketId,
      side,
      shares,
    }: {
      marketId: number;
      side: "yes" | "no";
      shares: string;
    }) => {
      return await apiRequest("POST", "/api/markets/buy", {
        walletAddress: account,
        marketId,
        side,
        shares,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/smoke", account] });
      queryClient.invalidateQueries({ queryKey: ["/api/positions", account] });
      queryClient.invalidateQueries({ queryKey: ["/api/markets"] });
      setSelectedMarket(null);
      toast({ title: "Position opened successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to buy shares", variant: "destructive" });
    },
  });

  const smokeBalance = smokeData?.balance || "0";

  return (
    <div className="min-h-screen py-8 px-4 container mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-purple-500/30 to-pink-500/30 p-4 rounded-xl">
            <BarChart3 className="h-10 w-10 text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Predictions
            </h1>
            <p className="text-muted-foreground">Trade crypto price predictions with $SMOKE</p>
          </div>
        </div>

        {/* Smoke Balance */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg">
            <div className="text-xs text-muted-foreground">$SMOKE Balance</div>
            <div className="text-xl font-bold text-purple-400">
              {formatSmoke(smokeBalance)}
            </div>
          </div>
          <Button
            onClick={() => setShowBurnDialog(true)}
            className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500"
            disabled={!account}
          >
            <Flame className="h-4 w-4 mr-2" />
            Get $SMOKE
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-black/20 border border-white/10">
          <TabsTrigger value="markets" className="data-[state=active]:bg-primary/20">
            Markets
          </TabsTrigger>
          <TabsTrigger value="positions" className="data-[state=active]:bg-primary/20">
            My Positions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="markets" className="space-y-4">
          {!account ? (
            <Card className="border-yellow-500/20">
              <CardContent className="flex items-center gap-4 py-8">
                <Lock className="h-8 w-8 text-yellow-500" />
                <div>
                  <h3 className="font-semibold">Connect Wallet</h3>
                  <p className="text-sm text-muted-foreground">
                    Connect your Pera wallet to start trading predictions
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : marketsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : markets.length === 0 ? (
            <Card className="border-white/10">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground mb-4 opacity-30" />
                <h3 className="font-semibold mb-2">No active markets</h3>
                <p className="text-sm text-muted-foreground">
                  Check back soon for new prediction markets
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {markets.map((market) => (
                <MarketCard
                  key={market.id}
                  market={market}
                  onClick={() => setSelectedMarket(market)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="positions" className="space-y-4">
          {positions.length === 0 ? (
            <Card className="border-white/10">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Wallet className="h-12 w-12 text-muted-foreground mb-4 opacity-30" />
                <h3 className="font-semibold mb-2">No positions yet</h3>
                <p className="text-sm text-muted-foreground">
                  Start trading to see your positions here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {positions.map((position) => (
                <Card key={position.marketId} className="border-white/10">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold mb-1">{position.marketTitle}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>
                            {BigInt(position.yesShares) > BigInt(0) && (
                              <span className="text-emerald-400">
                                {position.yesShares} YES @ {position.avgYesPrice}¢
                              </span>
                            )}
                            {BigInt(position.noShares) > BigInt(0) && (
                              <span className="text-rose-400">
                                {position.noShares} NO @ {position.avgNoPrice}¢
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Status</div>
                        <div
                          className={cn(
                            "font-semibold",
                            position.marketStatus === "open"
                              ? "text-emerald-400"
                              : position.marketOutcome
                              ? "text-purple-400"
                              : "text-yellow-400"
                          )}
                        >
                          {position.marketStatus === "open"
                            ? "Active"
                            : position.marketOutcome
                            ? `Resolved: ${position.marketOutcome.toUpperCase()}`
                            : "Pending"}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Market Detail Modal */}
      <MarketDetailModal
        market={selectedMarket}
        isOpen={!!selectedMarket}
        onClose={() => setSelectedMarket(null)}
        smokeBalance={smokeBalance}
        onBuy={(side, shares) => {
          if (selectedMarket) {
            buyMutation.mutate({ marketId: selectedMarket.id, side, shares });
          }
        }}
        isPending={buyMutation.isPending}
      />

      {/* Burn BUD Dialog */}
      <BurnBudDialog
        isOpen={showBurnDialog}
        onClose={() => setShowBurnDialog(false)}
        onBurn={(amount) => burnMutation.mutate(amount)}
        isPending={burnMutation.isPending}
      />
    </div>
  );
}
