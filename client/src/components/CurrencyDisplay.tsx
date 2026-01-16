import { cn } from "@/lib/utils";
import { Leaf, Sparkles } from "lucide-react";

interface CurrencyDisplayProps {
  budAmount: string | number;
  terpAmount: string | number;
  className?: string;
}

export function CurrencyDisplay({ budAmount, terpAmount, className }: CurrencyDisplayProps) {
  const formatAmount = (amt: string | number) => {
    const val = typeof amt === 'string' ? parseFloat(amt) : amt;
    return (val / 1000000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className={cn("flex flex-wrap gap-4", className)}>
      <div className="flex items-center gap-3 bg-black/30 backdrop-blur-sm border border-primary/20 rounded-lg px-4 py-2 shadow-inner shadow-black/20">
        <div className="bg-primary/20 p-2 rounded-full">
          <Leaf className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Bud</p>
          <p className="text-lg font-display font-bold text-foreground">{formatAmount(budAmount)}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 bg-black/30 backdrop-blur-sm border border-purple-500/20 rounded-lg px-4 py-2 shadow-inner shadow-black/20">
        <div className="bg-purple-500/20 p-2 rounded-full">
          <Sparkles className="h-5 w-5 text-purple-400" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Terp</p>
          <p className="text-lg font-display font-bold text-foreground">{formatAmount(terpAmount)}</p>
        </div>
      </div>
    </div>
  );
}
