import { ShoppingBag, Star, ShieldCheck, Droplet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const ITEMS = [
  { id: 1, name: "Advanced Nutrients", price: 150, type: "nutrient", icon: Star, desc: "Boosts growth speed by 10% for 24h." },
  { id: 2, name: "Neem Oil Spray", price: 75, type: "pest", icon: ShieldCheck, desc: "Cures pest infestations instantly." },
  { id: 3, name: "pH Regulator", price: 50, type: "ph", icon: Droplet, desc: "Corrects soil acidity levels." },
];

export default function Store() {
  const { toast } = useToast();

  const handleBuy = (item: typeof ITEMS[0]) => {
    toast({
      title: "Purchase Successful",
      description: `Bought ${item.name} for ${item.price} BUD.`,
    });
  };

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.id} className="bg-card border border-white/10 rounded-xl p-6 flex flex-col hover:border-orange-500/50 transition-colors">
              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-4">
                <Icon className="h-6 w-6 text-foreground" />
              </div>
              
              <h3 className="font-display font-bold text-lg">{item.name}</h3>
              <p className="text-sm text-muted-foreground mt-2 mb-6 flex-grow">{item.desc}</p>
              
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                <span className="font-bold text-lg text-primary">{item.price} BUD</span>
                <Button onClick={() => handleBuy(item)} variant="outline" className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10 hover:text-orange-300">
                  Buy Now
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
