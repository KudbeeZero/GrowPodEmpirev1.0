import { cn } from "@/lib/utils";
import { Leaf, Coins } from "lucide-react";

interface CurrencyDisplayProps {
  budAmount: number;
  terpAmount: number;
  className?: string;
}

export function CurrencyDisplay({ budAmount, terpAmount, className }: CurrencyDisplayProps) {
  return (
    <div className={cn("flex flex-wrap gap-4", className)}>
      {/* BUD Balance */}
      <div className="flex items-center gap-3 bg-black/30 backdrop-blur-sm border border-primary/20 rounded-lg px-4 py-2 shadow-inner shadow-black/20">
        <div className="bg-primary/20 p-2 rounded-full">
          <Leaf className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Bud</p>
          <p className="text-lg font-display font-bold text-foreground">{budAmount.toLocaleString()}</p>
        </div>
      </div>

      {/* TERP Balance */}
      <div className="flex items-center gap-3 bg-black/30 backdrop-blur-sm border border-purple-500/20 rounded-lg px-4 py-2 shadow-inner shadow-black/20">
        <div className="bg-purple-500/20 p-2 rounded-full">
          <Coins className="h-5 w-5 text-purple-400" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Terp</p>
          <p className="text-lg font-display font-bold text-foreground">{terpAmount.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
