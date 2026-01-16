import { Link, useLocation } from "wouter";
import { useAlgorand } from "@/hooks/use-algorand";
import { cn } from "@/lib/utils";
import { 
  Sprout, 
  LayoutDashboard, 
  Warehouse, 
  FlaskConical, 
  Store, 
  Wallet,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";

export function Navigation() {
  const [location] = useLocation();
  const { isConnected, connectWallet, disconnectWallet, account } = useAlgorand();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/vault", label: "Seed Vault", icon: Warehouse },
    { href: "/lab", label: "Combiner Lab", icon: FlaskConical },
    { href: "/store", label: "Supply Store", icon: Store },
    { href: "/staking", label: "Cure Vault", icon: Sprout },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        
        {/* Logo */}
        <div className="flex items-center gap-2 font-display text-xl font-bold tracking-wider text-primary">
          <Sprout className="h-6 w-6" />
          <span className="hidden sm:inline-block bg-clip-text text-transparent bg-gradient-to-r from-primary to-emerald-300">
            GROWPOD EMPIRE
          </span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} className={cn(
                "flex items-center gap-2 text-sm font-medium transition-all hover:text-primary",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Wallet & Mobile Toggle */}
        <div className="flex items-center gap-4">
          <Button 
            onClick={isConnected ? disconnectWallet : connectWallet}
            variant={isConnected ? "outline" : "default"}
            className={cn(
              "font-display font-semibold transition-all shadow-lg shadow-primary/20",
              isConnected ? "border-primary/50 text-primary hover:bg-primary/10" : "bg-gradient-to-r from-primary to-emerald-600 hover:brightness-110"
            )}
          >
            <Wallet className="mr-2 h-4 w-4" />
            {isConnected ? `${account?.slice(0, 4)}...${account?.slice(-4)}` : "Connect Wallet"}
          </Button>

          <button 
            className="md:hidden text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/10 bg-background/95 backdrop-blur-xl absolute w-full left-0 top-16 animate-accordion-down">
          <nav className="flex flex-col p-4 gap-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link 
                  key={item.href} 
                  href={item.href} 
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-primary transition-colors"
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
