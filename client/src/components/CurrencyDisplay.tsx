import { cn } from "@/lib/utils";
import { Leaf, Sparkles, Coins } from "lucide-react";
import { formatTokenAmount } from "@/hooks/use-algorand";

interface CurrencyDisplayProps {
  budAmount: string | number;
  terpAmount: string | number;
  algoAmount?: string | number;
  className?: string;
  compact?: boolean;
}

export function CurrencyDisplay({ 
  budAmount, 
  terpAmount, 
  algoAmount,
  className,
  compact = false 
}: CurrencyDisplayProps) {

  if (compact) {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <div className="flex items-center gap-1.5 text-sm" data-testid="balance-bud-compact">
          <Leaf className="h-4 w-4 text-primary" />
          <span className="font-mono font-medium">{formatTokenAmount(budAmount)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm" data-testid="balance-terp-compact">
          <Sparkles className="h-4 w-4 text-purple-400" />
          <span className="font-mono font-medium">{formatTokenAmount(terpAmount)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap gap-4", className)}>
      <div 
        className="flex items-center gap-3 bg-black/30 backdrop-blur-sm border border-primary/20 rounded-lg px-4 py-2 shadow-inner shadow-black/20"
        data-testid="balance-bud"
      >
        <div className="bg-primary/20 p-2 rounded-full">
          <Leaf className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">$BUD</p>
          <p className="text-lg font-display font-bold text-foreground">
            {formatTokenAmount(budAmount)}
          </p>
        </div>
      </div>

      <div 
        className="flex items-center gap-3 bg-black/30 backdrop-blur-sm border border-purple-500/20 rounded-lg px-4 py-2 shadow-inner shadow-black/20"
        data-testid="balance-terp"
      >
        <div className="bg-purple-500/20 p-2 rounded-full">
          <Sparkles className="h-5 w-5 text-purple-400" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">$TERP</p>
          <p className="text-lg font-display font-bold text-foreground">
            {formatTokenAmount(terpAmount)}
          </p>
        </div>
      </div>

      {algoAmount !== undefined && (
        <div 
          className="flex items-center gap-3 bg-black/30 backdrop-blur-sm border border-gray-500/20 rounded-lg px-4 py-2 shadow-inner shadow-black/20"
          data-testid="balance-algo"
        >
          <div className="bg-gray-500/20 p-2 rounded-full">
            <Coins className="h-5 w-5 text-gray-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">ALGO</p>
            <p className="text-lg font-display font-bold text-foreground">
              {formatTokenAmount(algoAmount)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
