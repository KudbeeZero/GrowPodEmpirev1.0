import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Wallet, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface WalletOption {
  id: 'pera' | 'defly';
  name: string;
  description: string;
  icon: string;
  available: boolean;
}

interface WalletSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectWallet: (walletId: WalletOption['id']) => Promise<void>;
  isConnecting: boolean;
}

export function WalletSelector({ open, onOpenChange, onSelectWallet, isConnecting }: WalletSelectorProps) {
  const [selectedWallet, setSelectedWallet] = useState<WalletOption['id'] | null>(null);
  
  const wallets: WalletOption[] = [
    {
      id: 'pera',
      name: 'Pera Wallet',
      description: 'Secure and user-friendly Algorand wallet',
      icon: '🔷',
      available: true,
    },
    {
      id: 'defly',
      name: 'Defly Wallet',
      description: 'All-in-one DeFi wallet for Algorand',
      icon: '🦋',
      available: true,
    },
  ];

  const handleConnect = async (walletId: WalletOption['id']) => {
    setSelectedWallet(walletId);
    try {
      await onSelectWallet(walletId);
      onOpenChange(false);
    } catch (error) {
      console.error('Wallet connection failed:', error);
    } finally {
      setSelectedWallet(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Connect Wallet
          </DialogTitle>
          <DialogDescription>
            Choose your preferred Algorand wallet to connect
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-4">
          {wallets.map((wallet) => (
            <Button
              key={wallet.id}
              variant="outline"
              disabled={!wallet.available || isConnecting}
              onClick={() => handleConnect(wallet.id)}
              className={cn(
                "h-auto p-4 justify-start text-left transition-all",
                "hover:bg-primary/10 hover:border-primary/50",
                selectedWallet === wallet.id && "bg-primary/20 border-primary"
              )}
            >
              <div className="flex items-center gap-4 w-full">
                <div className="text-3xl">{wallet.icon}</div>
                <div className="flex-1">
                  <div className="font-semibold flex items-center gap-2">
                    {wallet.name}
                    {selectedWallet === wallet.id && isConnecting && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {wallet.description}
                  </div>
                </div>
                {!wallet.available && (
                  <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                    Unavailable
                  </div>
                )}
              </div>
            </Button>
          ))}
        </div>
        <div className="text-xs text-muted-foreground text-center">
          Don't have a wallet?{" "}
          <a 
            href="https://perawallet.app/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Download Pera Wallet
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
