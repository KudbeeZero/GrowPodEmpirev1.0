import { useAlgorand } from "@/hooks/use-algorand";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  AlertTriangle,
  Activity,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  Loader2,
  RefreshCw,
  Eye,
  ChevronDown,
  ChevronUp,
  Zap,
  Database,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { MonitorError, MonitorTransaction } from "@shared/schema";

interface DashboardStats {
  errorsLast24h: number;
  transactionsLast24h: number;
  successRate: number;
  avgTransactionDuration: number;
  activeUsersLast24h: number;
  topErrors: MonitorError[];
  transactionsByAction: { action: string; count: number; successCount: number }[];
  errorTrend: { hour: string; count: number }[];
}

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  description,
  variant = "default",
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  description?: string;
  variant?: "default" | "success" | "warning" | "danger";
}) {
  const variantStyles = {
    default: "from-purple-500/20 to-blue-500/20 border-purple-500/30",
    success: "from-green-500/20 to-emerald-500/20 border-green-500/30",
    warning: "from-yellow-500/20 to-orange-500/20 border-yellow-500/30",
    danger: "from-red-500/20 to-pink-500/20 border-red-500/30",
  };

  return (
    <Card className={`bg-gradient-to-br ${variantStyles[variant]} border`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <div className="p-3 rounded-full bg-background/50">
            <Icon className="h-6 w-6" />
          </div>
        </div>
        {trend && (
          <div className="mt-2 flex items-center text-xs text-muted-foreground">
            <TrendingUp className="h-3 w-3 mr-1" />
            {trend}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ErrorRow({
  error,
  onResolve,
  isResolving,
}: {
  error: MonitorError;
  onResolve: (id: number) => void;
  isResolving: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-border/50 rounded-lg bg-background/50 overflow-hidden">
      <div
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/30"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Badge
            variant={error.resolved ? "secondary" : "destructive"}
            className="shrink-0"
          >
            {error.count}x
          </Badge>
          <div className="min-w-0">
            <p className="font-mono text-sm truncate">{error.message}</p>
            <p className="text-xs text-muted-foreground">
              {error.source} · {error.type} ·{" "}
              {new Date(error.lastSeen!).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!error.resolved && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onResolve(error.id);
              }}
              disabled={isResolving}
            >
              {isResolving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
            </Button>
          )}
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
      </div>
      {expanded && (
        <div className="border-t border-border/50 p-4 bg-muted/20">
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Stack Trace
              </p>
              <pre className="text-xs font-mono bg-background/80 p-3 rounded overflow-x-auto max-h-48">
                {error.stack || "No stack trace available"}
              </pre>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs font-medium text-muted-foreground">URL</p>
                <p className="font-mono text-xs truncate">{error.url || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Wallet
                </p>
                <p className="font-mono text-xs truncate">
                  {error.walletAddress || "Anonymous"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  First Seen
                </p>
                <p className="text-xs">
                  {new Date(error.firstSeen!).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Session ID
                </p>
                <p className="font-mono text-xs truncate">
                  {error.sessionId || "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TransactionRow({ tx }: { tx: MonitorTransaction }) {
  const statusColors = {
    success: "bg-green-500/20 text-green-400 border-green-500/30",
    failed: "bg-red-500/20 text-red-400 border-red-500/30",
    pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  };

  return (
    <div className="border border-border/50 rounded-lg bg-background/50 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge className={statusColors[tx.status as keyof typeof statusColors]}>
            {tx.status === "success" ? (
              <CheckCircle className="h-3 w-3 mr-1" />
            ) : tx.status === "failed" ? (
              <XCircle className="h-3 w-3 mr-1" />
            ) : (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            )}
            {tx.status}
          </Badge>
          <div>
            <p className="font-medium">{tx.action}</p>
            <p className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">
              {tx.walletAddress}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm">
            {tx.duration ? `${tx.duration}ms` : "—"}
          </p>
          <p className="text-xs text-muted-foreground">
            {new Date(tx.createdAt!).toLocaleString()}
          </p>
        </div>
      </div>
      {tx.errorMessage && (
        <div className="mt-2 p-2 bg-red-500/10 rounded text-xs text-red-400">
          {tx.errorMessage}
        </div>
      )}
      {tx.txId && (
        <div className="mt-2 text-xs text-muted-foreground font-mono truncate">
          TX: {tx.txId}
        </div>
      )}
    </div>
  );
}

function ActionChart({
  data,
}: {
  data: { action: string; count: number; successCount: number }[];
}) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No transaction data available
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count));

  return (
    <div className="space-y-3">
      {data.map((item) => {
        const successRate =
          item.count > 0 ? (item.successCount / item.count) * 100 : 0;
        return (
          <div key={item.action}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="font-medium capitalize">
                {item.action.replace(/_/g, " ")}
              </span>
              <span className="text-muted-foreground">
                {item.count} ({successRate.toFixed(0)}% success)
              </span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all"
                style={{ width: `${(item.count / maxCount) * 100}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function MonitorDashboard() {
  const { account, isConnected } = useAlgorand();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");

  // Check admin status
  const { data: adminCheck } = useQuery({
    queryKey: ["/api/announcement/admin-check", account],
    queryFn: async () => {
      if (!account) return { isAdmin: false };
      const res = await fetch(`/api/announcement/admin-check/${account}`);
      return res.json();
    },
    enabled: !!account,
  });

  const isAdmin = adminCheck?.isAdmin;

  // Fetch dashboard stats
  const {
    data: stats,
    isLoading: loadingStats,
    refetch: refetchStats,
  } = useQuery<DashboardStats>({
    queryKey: ["/api/monitor/dashboard", account],
    queryFn: async () => {
      const res = await fetch(
        `/api/monitor/dashboard?walletAddress=${account}`
      );
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
    enabled: !!account && isAdmin,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch errors
  const { data: errors = [], isLoading: loadingErrors } = useQuery<
    MonitorError[]
  >({
    queryKey: ["/api/monitor/errors", account],
    queryFn: async () => {
      const res = await fetch(
        `/api/monitor/errors?walletAddress=${account}&resolved=false`
      );
      if (!res.ok) throw new Error("Failed to fetch errors");
      return res.json();
    },
    enabled: !!account && isAdmin,
  });

  // Fetch transactions
  const { data: transactions = [], isLoading: loadingTx } = useQuery<
    MonitorTransaction[]
  >({
    queryKey: ["/api/monitor/transactions", account],
    queryFn: async () => {
      const res = await fetch(
        `/api/monitor/transactions?adminWallet=${account}&limit=50`
      );
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return res.json();
    },
    enabled: !!account && isAdmin,
  });

  // Resolve error mutation
  const resolveErrorMutation = useMutation({
    mutationFn: async (errorId: number) => {
      const res = await fetch(`/api/monitor/errors/${errorId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: account }),
      });
      if (!res.ok) throw new Error("Failed to resolve error");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/monitor/errors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/monitor/dashboard"] });
      toast({ title: "Error resolved", description: "The error has been marked as resolved." });
    },
    onError: () => {
      toast({ title: "Failed to resolve error", variant: "destructive" });
    },
  });

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-bold mb-2">Connect Wallet</h2>
          <p className="text-muted-foreground">
            Connect your wallet to access the monitoring dashboard
          </p>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
          <h2 className="text-xl font-bold mb-2">Admin Access Required</h2>
          <p className="text-muted-foreground">
            This dashboard is only available to administrators
          </p>
        </Card>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Database className="h-8 w-8 text-purple-500" />
            GrowPod Monitor
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time error tracking and performance monitoring
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            refetchStats();
            queryClient.invalidateQueries({ queryKey: ["/api/monitor"] });
          }}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {loadingStats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="h-32 animate-pulse bg-muted/20" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="Errors (24h)"
            value={stats?.errorsLast24h || 0}
            icon={AlertTriangle}
            variant={
              (stats?.errorsLast24h || 0) > 10
                ? "danger"
                : (stats?.errorsLast24h || 0) > 0
                ? "warning"
                : "success"
            }
          />
          <StatCard
            title="Transactions (24h)"
            value={stats?.transactionsLast24h || 0}
            icon={Zap}
            variant="default"
          />
          <StatCard
            title="Success Rate"
            value={`${(stats?.successRate || 100).toFixed(1)}%`}
            icon={CheckCircle}
            variant={
              (stats?.successRate || 100) >= 95
                ? "success"
                : (stats?.successRate || 100) >= 80
                ? "warning"
                : "danger"
            }
          />
          <StatCard
            title="Avg Duration"
            value={`${Math.round(stats?.avgTransactionDuration || 0)}ms`}
            icon={Clock}
            variant="default"
          />
          <StatCard
            title="Active Users (24h)"
            value={stats?.activeUsersLast24h || 0}
            icon={Users}
            variant="default"
          />
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="errors">
            Errors
            {errors.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {errors.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Errors */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Top Errors
                </CardTitle>
                <CardDescription>
                  Most frequent unresolved errors
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingStats ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="h-16 bg-muted/20 rounded animate-pulse"
                      />
                    ))}
                  </div>
                ) : stats?.topErrors && stats.topErrors.length > 0 ? (
                  <div className="space-y-3">
                    {stats.topErrors.slice(0, 5).map((error) => (
                      <div
                        key={error.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-mono text-sm truncate">
                            {error.message}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {error.source}
                          </p>
                        </div>
                        <Badge variant="destructive">{error.count}x</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                    No unresolved errors
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Transactions by Action */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-purple-500" />
                  Transactions by Action
                </CardTitle>
                <CardDescription>
                  Blockchain transaction breakdown (24h)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingStats ? (
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className="h-8 bg-muted/20 rounded animate-pulse"
                      />
                    ))}
                  </div>
                ) : (
                  <ActionChart data={stats?.transactionsByAction || []} />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Errors Tab */}
        <TabsContent value="errors" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Error Log</CardTitle>
              <CardDescription>
                All unresolved errors from the last 24 hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingErrors ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="h-20 bg-muted/20 rounded animate-pulse"
                    />
                  ))}
                </div>
              ) : errors.length > 0 ? (
                <div className="space-y-3">
                  {errors.map((error) => (
                    <ErrorRow
                      key={error.id}
                      error={error}
                      onResolve={(id) => resolveErrorMutation.mutate(id)}
                      isResolving={resolveErrorMutation.isPending}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
                  <p className="text-lg font-medium">All clear!</p>
                  <p>No unresolved errors</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>
                Blockchain transaction history and status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTx ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="h-20 bg-muted/20 rounded animate-pulse"
                    />
                  ))}
                </div>
              ) : transactions.length > 0 ? (
                <div className="space-y-3">
                  {transactions.map((tx) => (
                    <TransactionRow key={tx.id} tx={tx} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Activity className="h-16 w-16 mx-auto mb-4" />
                  <p className="text-lg font-medium">No transactions yet</p>
                  <p>Transaction data will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
