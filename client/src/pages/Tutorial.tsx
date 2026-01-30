import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAlgorand } from "@/hooks/use-algorand";
import { 
  BookOpen, 
  Wallet, 
  Sprout, 
  Droplets, 
  Sun, 
  Scissors, 
  Coins, 
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Dna
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

const steps = [
  {
    step: 1,
    title: "Connect Your Wallet",
    description: "Use Pera Wallet to connect to GrowPod Empire. You'll need some TestNet ALGO to pay for transactions.",
    icon: Wallet,
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
    tips: [
      "Download Pera Wallet from App Store or Google Play",
      "Switch to TestNet in wallet settings",
      "Get free TestNet ALGO from the faucet"
    ]
  },
  {
    step: 2,
    title: "Opt In to the Game",
    description: "Before playing, you need to opt into the smart contract and the game tokens ($BUD, $TERP, Slot Tokens).",
    icon: CheckCircle2,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/20",
    tips: [
      "Opting in costs a small amount of ALGO",
      "This only needs to be done once",
      "You'll see opt-in buttons on the Dashboard"
    ]
  },
  {
    step: 3,
    title: "Mint Your First Pod",
    description: "Click 'Mint Pod' on an empty pod slot to create your first GrowPod NFT. A mystery seed will automatically be planted!",
    icon: Sprout,
    color: "text-green-400",
    bgColor: "bg-green-500/20",
    tips: [
      "GrowPod NFTs are soulbound until first harvest",
      "You start with 2 pod slots",
      "Each pod can grow one plant at a time"
    ]
  },
  {
    step: 4,
    title: "Water Your Plants",
    description: "Water your plants every 10 minutes to help them grow. Each water advances the growth stage.",
    icon: Droplets,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/20",
    tips: [
      "Plants need 10 waterings to reach harvest",
      "Enable notifications to get reminders",
      "Missing a water won't kill your plant"
    ]
  },
  {
    step: 5,
    title: "Add Nutrients",
    description: "Give your plants nutrients for bonus yield. Nutrients have a separate cooldown from water.",
    icon: Sun,
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/20",
    tips: [
      "Nutrients boost your $BUD harvest",
      "10+ nutrients = maximum yield bonus",
      "Nutrient cooldown is also 10 minutes"
    ]
  },
  {
    step: 6,
    title: "Harvest & Earn",
    description: "Once fully grown, harvest your plant to earn $BUD tokens. Rare terpene profiles can earn you $TERP too!",
    icon: Scissors,
    color: "text-amber-400",
    bgColor: "bg-amber-500/20",
    tips: [
      "Base harvest: 100 $BUD",
      "Bonuses for extra water/nutrients",
      "Rare terpenes = 5,000-50,000 $TERP"
    ]
  },
  {
    step: 7,
    title: "Cleanup & Repeat",
    description: "After harvesting, cleanup the pod (costs 500 $BUD) to plant again. Each harvest counts toward unlocking new slots!",
    icon: Coins,
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
    tips: [
      "Every 5 harvests = 1 Slot Token claimable",
      "Burn 2,500 $BUD to claim Slot Token",
      "Burn 1 Slot Token to unlock new pod (max 5)"
    ]
  }
];

const tokenInfo = [
  {
    name: "$BUD",
    description: "The main gameplay token. Earned from harvests, burned for cleanup and breeding.",
    color: "text-emerald-400",
    supply: "10 billion max"
  },
  {
    name: "$TERP",
    description: "Rare reward token. Earned when harvesting plants with rare terpene profiles.",
    color: "text-purple-400",
    supply: "100 million fixed"
  },
  {
    name: "Slot Token",
    description: "Progression token. Claim after 5 harvests, burn to unlock new pod slots.",
    color: "text-amber-400",
    supply: "1 million fixed"
  }
];

export default function Tutorial() {
  const { isConnected, connectWallet, isConnecting } = useAlgorand();

  return (
    <div className="min-h-screen py-12 px-4 container mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-primary/20 p-3 rounded-lg">
          <BookOpen className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold">How to Play</h1>
          <p className="text-muted-foreground">Your guide to growing in GrowPod Empire.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 mb-12">
        <Card className="lg:col-span-2 border-primary/20">
          <CardHeader>
            <CardTitle className="font-display">Getting Started</CardTitle>
            <CardDescription>
              GrowPod Empire is a blockchain-based idle farming game on Algorand TestNet. 
              Grow virtual plants, earn tokens, and expand your empire!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isConnected ? (
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={connectWallet} 
                  disabled={isConnecting}
                  className="bg-primary"
                  data-testid="button-connect-tutorial"
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  {isConnecting ? "Connecting..." : "Connect Wallet"}
                </Button>
                <Button variant="outline" asChild>
                  <a 
                    href="https://bank.testnet.algorand.network/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    Get TestNet ALGO <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild className="bg-primary">
                  <Link href="/">
                    Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-amber-500/20">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Dna className="h-5 w-5 text-amber-400" />
              Token Economy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {tokenInfo.map((token) => (
              <div key={token.name} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className={cn("font-bold font-display", token.color)}>{token.name}</span>
                  <span className="text-xs text-muted-foreground">{token.supply}</span>
                </div>
                <p className="text-xs text-muted-foreground">{token.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-display font-bold mb-6">Step-by-Step Guide</h2>
      
      <div className="space-y-6">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="border-white/5 hover:border-white/10 transition-colors">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex items-start gap-4">
                      <div className={cn("p-3 rounded-lg shrink-0", step.bgColor)}>
                        <Icon className={cn("h-6 w-6", step.color)} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-mono text-muted-foreground">STEP {step.step}</span>
                        </div>
                        <h3 className="font-display font-bold text-lg mb-2">{step.title}</h3>
                        <p className="text-muted-foreground text-sm">{step.description}</p>
                      </div>
                    </div>
                    <div className="md:w-64 shrink-0 pl-4 md:pl-0 md:border-l border-white/5">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Tips</span>
                      <ul className="mt-2 space-y-1">
                        {step.tips.map((tip, tipIdx) => (
                          <li key={tipIdx} className="text-xs text-muted-foreground flex items-start gap-2">
                            <span className="text-primary mt-0.5">•</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-12 text-center">
        <Button asChild size="lg" className="bg-primary">
          <Link href="/">
            Start Growing <Sprout className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
