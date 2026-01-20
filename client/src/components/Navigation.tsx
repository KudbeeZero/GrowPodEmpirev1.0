import { Link, useLocation } from "wouter";
import { useAlgorand, useGameState } from "@/hooks/use-algorand";
import { CurrencyDisplay } from "./CurrencyDisplay";
import { cn } from "@/lib/utils";
import { 
  Sprout, 
  LayoutDashboard, 
  Warehouse, 
  FlaskConical, 
  Store, 
  Wallet,
  Menu,
  X,
  LogOut,
  Loader2,
  Droplets,
  BookOpen,
  Trophy,
  BarChart3,
  Award,
  Gamepad2,
  Users,
  Sparkles
} from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "./ui/navigation-menu";

export function Navigation() {
  const [location] = useLocation();
  const { isConnected, isConnecting, connectWallet, disconnectWallet, account } = useAlgorand();
  const { budBalance, terpBalance, pods } = useGameState(account);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const plantsNeedingWater = pods.filter(p => p.canWater && p.status !== 'empty' && p.status !== 'needs_cleanup').length;
  const plantsReadyToHarvest = pods.filter(p => p.status === 'harvest_ready').length;
  const totalAttentionNeeded = plantsNeedingWater + plantsReadyToHarvest;

  const gameItems = [
    { href: "/seed-bank", label: "Seed Bank", icon: Sparkles, description: "Premium genetics for your grow" },
    { href: "/vault", label: "Seed Vault", icon: Warehouse, description: "Manage your seed collection" },
    { href: "/lab", label: "Combiner Lab", icon: FlaskConical, description: "Breed and create new strains" },
    { href: "/store", label: "Supply Store", icon: Store, description: "Buy supplies and upgrades" },
    { href: "/staking", label: "Cure Vault", icon: Sprout, description: "Stake tokens for rewards" },
  ];

  const communityItems = [
    { href: "/leaderboards", label: "Leaderboards", icon: Trophy, description: "See top growers" },
    { href: "/stats", label: "Stats", icon: BarChart3, description: "Global game statistics" },
    { href: "/achievements", label: "Achievements", icon: Award, description: "Your milestones" },
    { href: "/tutorial", label: "How to Play", icon: BookOpen, description: "Learn the basics" },
  ];

  const allNavItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    ...gameItems,
    ...communityItems,
  ];

  const truncatedAddress = account 
    ? `${account.slice(0, 6)}...${account.slice(-4)}` 
    : '';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 gap-4">
        
        <div className="flex items-center gap-2 font-display text-xl font-bold tracking-wider text-primary shrink-0">
          <Sprout className="h-6 w-6" />
          <span className="hidden sm:inline-block bg-clip-text text-transparent bg-gradient-to-r from-primary to-emerald-300">
            GROWPOD EMPIRE
          </span>
        </div>

        <nav className="hidden lg:flex items-center">
          <NavigationMenu>
            <NavigationMenuList className="gap-1">
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link 
                    href="/"
                    className={cn(
                      "group inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50",
                      location === "/" ? "text-primary" : "text-muted-foreground"
                    )}
                    data-testid="nav-dashboard"
                  >
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Dashboard
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-muted-foreground">
                  <Gamepad2 className="h-4 w-4 mr-2" />
                  Game
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[320px] gap-1 p-2">
                    {gameItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <li key={item.href}>
                          <NavigationMenuLink asChild>
                            <Link 
                              href={item.href}
                              className={cn(
                                "block select-none rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                                location === item.href ? "bg-accent/50" : ""
                              )}
                              data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                            >
                              <div className="flex items-center gap-3">
                                <Icon className="h-5 w-5 text-primary" />
                                <div>
                                  <div className="text-sm font-medium leading-none">{item.label}</div>
                                  <p className="text-xs leading-snug text-muted-foreground mt-1">
                                    {item.description}
                                  </p>
                                </div>
                              </div>
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      );
                    })}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-muted-foreground">
                  <Users className="h-4 w-4 mr-2" />
                  Community
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[320px] gap-1 p-2">
                    {communityItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <li key={item.href}>
                          <NavigationMenuLink asChild>
                            <Link 
                              href={item.href}
                              className={cn(
                                "block select-none rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                                location === item.href ? "bg-accent/50" : ""
                              )}
                              data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                            >
                              <div className="flex items-center gap-3">
                                <Icon className="h-5 w-5 text-primary" />
                                <div>
                                  <div className="text-sm font-medium leading-none">{item.label}</div>
                                  <p className="text-xs leading-snug text-muted-foreground mt-1">
                                    {item.description}
                                  </p>
                                </div>
                              </div>
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      );
                    })}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </nav>

        <div className="flex items-center gap-4">
          {isConnected && totalAttentionNeeded > 0 && (
            <Link href="/">
              <Badge 
                variant="secondary" 
                className="bg-blue-500/20 text-blue-400 border-blue-500/30 cursor-pointer hover:bg-blue-500/30"
                data-testid="badge-attention-needed"
              >
                <Droplets className="h-3 w-3 mr-1" />
                {totalAttentionNeeded} need attention
              </Badge>
            </Link>
          )}
          
          {isConnected && (
            <div className="hidden lg:block">
              <CurrencyDisplay 
                budAmount={budBalance} 
                terpAmount={terpBalance} 
                compact 
              />
            </div>
          )}

          {isConnected ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline"
                  className="font-display font-semibold border-primary/50 text-primary hover:bg-primary/10"
                  data-testid="button-wallet-menu"
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  {truncatedAddress}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-mono text-xs">
                  {account}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="lg:hidden">
                  <div className="flex flex-col gap-1 w-full">
                    <span className="text-xs text-muted-foreground">Balances</span>
                    <CurrencyDisplay 
                      budAmount={budBalance} 
                      terpAmount={terpBalance} 
                      compact 
                    />
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="lg:hidden" />
                <DropdownMenuItem 
                  onClick={disconnectWallet}
                  className="text-destructive focus:text-destructive"
                  data-testid="button-disconnect"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button 
              onClick={connectWallet}
              disabled={isConnecting}
              className="font-display font-semibold bg-gradient-to-r from-primary to-emerald-600 hover:brightness-110 shadow-lg shadow-primary/20"
              data-testid="button-connect-wallet"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="mr-2 h-4 w-4" />
                  Connect Wallet
                </>
              )}
            </Button>
          )}

          <button 
            className="lg:hidden text-foreground p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="button-mobile-menu"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-white/10 bg-background/95 backdrop-blur-xl absolute w-full left-0 top-16 animate-accordion-down z-50 shadow-xl">
          <ScrollArea className="h-[calc(100vh-4rem)] max-h-[70vh]">
            <nav className="flex flex-col p-4 pb-safe">
              <Link 
                href="/"
                className={cn(
                  "flex items-center gap-3 p-4 rounded-lg hover:bg-white/5 transition-colors min-h-[48px]",
                  location === "/" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary"
                )}
                onClick={() => setMobileMenuOpen(false)}
                data-testid="mobile-nav-dashboard"
              >
                <LayoutDashboard className="h-5 w-5" />
                Dashboard
              </Link>

              <div className="mt-4 mb-2 px-2">
                <p className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider flex items-center gap-2">
                  <Gamepad2 className="h-3 w-3" />
                  Game
                </p>
              </div>
              {gameItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.href;
                return (
                  <Link 
                    key={item.href} 
                    href={item.href} 
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-lg hover:bg-white/5 transition-colors min-h-[48px]",
                      isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary"
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                    data-testid={`mobile-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Icon className="h-5 w-5" />
                    <div>
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs text-muted-foreground/70">{item.description}</div>
                    </div>
                  </Link>
                );
              })}

              <div className="mt-4 mb-2 px-2">
                <p className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider flex items-center gap-2">
                  <Users className="h-3 w-3" />
                  Community
                </p>
              </div>
              {communityItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.href;
                return (
                  <Link 
                    key={item.href} 
                    href={item.href} 
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-lg hover:bg-white/5 transition-colors min-h-[48px]",
                      isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary"
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                    data-testid={`mobile-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Icon className="h-5 w-5" />
                    <div>
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs text-muted-foreground/70">{item.description}</div>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>
        </div>
      )}
    </header>
  );
}
