import { ShoppingBag } from "lucide-react";

export default function Store() {
  return (
    <div className="min-h-screen py-12 px-4 container mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-orange-500/20 p-3 rounded-lg">
          <ShoppingBag className="h-8 w-8 text-orange-400" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold">Supply Depot</h1>
          <p className="text-muted-foreground">Trade BUD tokens for essential supplies.</p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center py-20 bg-card/20 rounded-2xl border border-white/5">
        <ShoppingBag className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h3 className="text-xl font-bold text-muted-foreground">Supply Depot Coming Soon</h3>
        <p className="text-muted-foreground/70 mt-2 text-center max-w-md">
          The supply depot is under construction. Soon you'll be able to trade $BUD for nutrients, pest control, and other grow supplies.
        </p>
      </div>
    </div>
  );
}
