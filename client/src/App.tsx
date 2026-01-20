import { useState, useEffect, type ReactNode } from "react";
import { Switch, Route } from "wouter";
import { queryClient, apiRequest } from "./lib/queryClient";
import { QueryClientProvider, useQuery, useMutation } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AlgorandProvider } from "@/context/AlgorandContext";
import { useAlgorand } from "@/hooks/use-algorand";
import { Navigation } from "@/components/Navigation";
import { AnnouncementModal } from "@/components/AnnouncementModal";
import Dashboard from "@/pages/Dashboard";
import SeedVault from "@/pages/SeedVault";
import CombinerLab from "@/pages/CombinerLab";
import Store from "@/pages/Store";
import CureVault from "@/pages/CureVault";
import Tutorial from "@/pages/Tutorial";
import Leaderboards from "@/pages/Leaderboards";
import Stats from "@/pages/Stats";
import Achievements from "@/pages/Achievements";
import Jukebox from "@/pages/Jukebox";
import SeedBank from "@/pages/SeedBank";
import Admin from "@/pages/Admin";
import { MiniPlayer } from "@/components/MiniPlayer";
import NotFound from "@/pages/not-found";
import type { AnnouncementVideo } from "@shared/schema";

interface AnnouncementCheckResponse {
  needsToWatch: boolean;
  announcement: AnnouncementVideo | null;
}

function AnnouncementWrapper({ children }: { children: ReactNode }) {
  const { account } = useAlgorand();
  const [dismissed, setDismissed] = useState(false);

  const { data: announcementCheck } = useQuery<AnnouncementCheckResponse>({
    queryKey: ["/api/announcement/check", account],
    queryFn: async () => {
      if (!account) return { needsToWatch: false, announcement: null };
      const res = await fetch(`/api/announcement/check/${account}`);
      return res.json();
    },
    enabled: !!account,
  });

  const markWatchedMutation = useMutation({
    mutationFn: async (announcementId: number) => {
      return apiRequest("POST", "/api/announcement/watched", {
        walletAddress: account,
        announcementId,
      });
    },
    onSuccess: () => {
      setDismissed(true);
      queryClient.invalidateQueries({ queryKey: ["/api/announcement/check", account] });
    },
  });

  const handleComplete = () => {
    if (announcementCheck?.announcement) {
      markWatchedMutation.mutate(announcementCheck.announcement.id);
    }
  };

  useEffect(() => {
    if (announcementCheck?.needsToWatch) {
      setDismissed(false);
    }
  }, [account, announcementCheck?.announcement?.id, announcementCheck?.needsToWatch]);

  if (!dismissed && announcementCheck?.needsToWatch && announcementCheck.announcement) {
    return (
      <AnnouncementModal
        announcement={announcementCheck.announcement}
        onComplete={handleComplete}
      />
    );
  }

  return <>{children}</>;
}

function Router() {
  return (
    <AnnouncementWrapper>
      <div className="min-h-screen bg-background font-body text-foreground selection:bg-primary/20">
        <Navigation />
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/vault" component={SeedVault} />
          <Route path="/lab" component={CombinerLab} />
          <Route path="/store" component={Store} />
          <Route path="/staking" component={CureVault} />
          <Route path="/tutorial" component={Tutorial} />
          <Route path="/leaderboards" component={Leaderboards} />
          <Route path="/stats" component={Stats} />
          <Route path="/achievements" component={Achievements} />
          <Route path="/jukebox" component={Jukebox} />
          <Route path="/seed-bank" component={SeedBank} />
          <Route path="/admin" component={Admin} />
          <Route component={NotFound} />
        </Switch>
        {/* Floating mini player - always available */}
        <MiniPlayer />
      </div>
    </AnnouncementWrapper>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AlgorandProvider>
          <Toaster />
          <Router />
        </AlgorandProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
