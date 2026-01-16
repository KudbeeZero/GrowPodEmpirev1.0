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
  Loader2
} from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export function Navigation() {
  const [location] = useLocation();
  const { isConnected, isConnecting, connectWallet, disconnectWallet, account } = useAlgorand();
  const { budBalance, terpBalance } = useGameState(account);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/vault", label: "Seed Vault", icon: Warehouse },
    { href: "/lab", label: "Combiner Lab", icon: FlaskConical },
    { href: "/store", label: "Supply Store", icon: Store },
    { href: "/staking", label: "Cure Vault", icon: Sprout },
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

        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className={cn(
                  "flex items-center gap-2 text-sm font-medium transition-all hover:text-primary",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
                data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4">
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
            className="md:hidden text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="button-mobile-menu"
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/10 bg-background/95 backdrop-blur-xl absolute w-full left-0 top-16 animate-accordion-down">
          <nav className="flex flex-col p-4 gap-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return (
                <Link 
                  key={item.href} 
                  href={item.href} 
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors",
                    isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
