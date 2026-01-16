import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navigation } from "@/components/Navigation";
import Dashboard from "@/pages/Dashboard";
import SeedVault from "@/pages/SeedVault";
import CombinerLab from "@/pages/CombinerLab";
import Store from "@/pages/Store";
import CureVault from "@/pages/CureVault";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="min-h-screen bg-background font-body text-foreground selection:bg-primary/20">
      <Navigation />
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/vault" component={SeedVault} />
        <Route path="/lab" component={CombinerLab} />
        <Route path="/store" component={Store} />
        <Route path="/staking" component={CureVault} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
