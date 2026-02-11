/**
 * WalletModal - Wallet selection dialog
 *
 * Displays all available Algorand wallets and allows users to connect.
 * Shows wallet status (available, installed, etc.)
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ExternalLink, Smartphone, Globe, Puzzle } from 'lucide-react';
import { useMultiWallet, type WalletInfo } from '@/hooks/use-multi-wallet';
import { WalletId } from '@/context/MultiWalletProvider';
import { cn } from '@/lib/utils';

interface WalletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Wallet icons as inline SVGs (fallbacks)
const WalletIcons: Record<string, React.ReactNode> = {
  [WalletId.PERA]: (
    <svg viewBox="0 0 40 40" className="w-10 h-10">
      <rect width="40" height="40" rx="8" fill="#FFEE55" />
      <path
        d="M20 8L12 28h4l1.5-4h5l1.5 4h4L20 8zm0 8l1.5 4h-3l1.5-4z"
        fill="#000"
      />
    </svg>
  ),
  [WalletId.DEFLY]: (
    <svg viewBox="0 0 40 40" className="w-10 h-10">
      <rect width="40" height="40" rx="8" fill="#131313" />
      <path
        d="M20 10l-8 10 8 10 8-10-8-10zm0 4l4 6-4 6-4-6 4-6z"
        fill="#00D395"
      />
    </svg>
  ),
  [WalletId.EXODUS]: (
    <svg viewBox="0 0 40 40" className="w-10 h-10">
      <rect width="40" height="40" rx="8" fill="#1F1837" />
      <path
        d="M28 14l-8 6 8 6v-4l-4-2 4-2v-4zM12 14v12l8-6-8-6z"
        fill="#8B5CF6"
      />
    </svg>
  ),
  [WalletId.KIBISIS]: (
    <svg viewBox="0 0 40 40" className="w-10 h-10">
      <rect width="40" height="40" rx="8" fill="#6366F1" />
      <circle cx="20" cy="20" r="8" fill="white" />
      <circle cx="20" cy="20" r="4" fill="#6366F1" />
    </svg>
  ),
  [WalletId.LUTE]: (
    <svg viewBox="0 0 40 40" className="w-10 h-10">
      <rect width="40" height="40" rx="8" fill="#059669" />
      <path
        d="M20 10c-5.5 0-10 4.5-10 10s4.5 10 10 10 10-4.5 10-10-4.5-10-10-10zm0 16c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6z"
        fill="white"
      />
    </svg>
  ),
};

// Type icon based on wallet type
function WalletTypeIcon({ type }: { type: WalletInfo['type'] }) {
  switch (type) {
    case 'mobile':
      return <Smartphone className="w-3 h-3" />;
    case 'extension':
      return <Puzzle className="w-3 h-3" />;
    case 'web':
      return <Globe className="w-3 h-3" />;
  }
}

// Type label
function getTypeLabel(type: WalletInfo['type']): string {
  switch (type) {
    case 'mobile':
      return 'Mobile';
    case 'extension':
      return 'Extension';
    case 'web':
      return 'Web';
  }
}

export function WalletModal({ open, onOpenChange }: WalletModalProps) {
  const { wallets, connectWallet, isConnected, account, disconnectWallet } = useMultiWallet();
  const [connecting, setConnecting] = useState<WalletId | null>(null);

  const handleConnect = async (walletId: WalletId) => {
    setConnecting(walletId);
    try {
      const address = await connectWallet(walletId);
      if (address) {
        onOpenChange(false);
      }
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async () => {
    await disconnectWallet();
    onOpenChange(false);
  };

  // Group wallets by type
  const mobileWallets = wallets.filter((w) => w.type === 'mobile');
  const extensionWallets = wallets.filter((w) => w.type === 'extension');
  const webWallets = wallets.filter((w) => w.type === 'web');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-sm border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-primary">
            {isConnected ? 'Wallet Connected' : 'Connect Wallet'}
          </DialogTitle>
          <DialogDescription>
            {isConnected
              ? `Connected: ${account?.slice(0, 6)}...${account?.slice(-4)}`
              : 'Choose a wallet to connect to GrowPod Empire'}
          </DialogDescription>
        </DialogHeader>

        {isConnected ? (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-sm font-mono break-all">{account}</p>
            </div>
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleDisconnect}
            >
              Disconnect Wallet
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Mobile Wallets */}
            {mobileWallets.length > 0 && (
              <WalletSection
                title="Mobile Wallets"
                description="Scan QR code with your phone"
                wallets={mobileWallets}
                connecting={connecting}
                onConnect={handleConnect}
              />
            )}

            {/* Browser Extensions */}
            {extensionWallets.length > 0 && (
              <WalletSection
                title="Browser Extensions"
                description="Connect with installed extensions"
                wallets={extensionWallets}
                connecting={connecting}
                onConnect={handleConnect}
              />
            )}

            {/* Web Wallets */}
            {webWallets.length > 0 && (
              <WalletSection
                title="Web Wallets"
                description="No installation required"
                wallets={webWallets}
                connecting={connecting}
                onConnect={handleConnect}
              />
            )}
          </div>
        )}

        <div className="text-xs text-muted-foreground text-center mt-4">
          By connecting, you agree to the Terms of Service
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface WalletSectionProps {
  title: string;
  description: string;
  wallets: WalletInfo[];
  connecting: WalletId | null;
  onConnect: (walletId: WalletId) => void;
}

function WalletSection({
  title,
  description,
  wallets,
  connecting,
  onConnect,
}: WalletSectionProps) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="grid gap-2">
        {wallets.map((wallet) => (
          <WalletButton
            key={wallet.id}
            wallet={wallet}
            isConnecting={connecting === wallet.id}
            onClick={() => onConnect(wallet.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface WalletButtonProps {
  wallet: WalletInfo;
  isConnecting: boolean;
  onClick: () => void;
}

function WalletButton({ wallet, isConnecting, onClick }: WalletButtonProps) {
  const isDisabled = isConnecting || (!wallet.isAvailable && wallet.type === 'extension');

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        'flex items-center gap-3 w-full p-3 rounded-lg border transition-all',
        'hover:bg-primary/5 hover:border-primary/30',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        wallet.isActive && 'border-primary bg-primary/10',
        !wallet.isAvailable && wallet.type === 'extension' && 'opacity-60'
      )}
    >
      {/* Wallet Icon */}
      <div className="flex-shrink-0">
        {WalletIcons[wallet.id] || (
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
            <WalletTypeIcon type={wallet.type} />
          </div>
        )}
      </div>

      {/* Wallet Info */}
      <div className="flex-1 text-left">
        <div className="flex items-center gap-2">
          <span className="font-medium">{wallet.name}</span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            <WalletTypeIcon type={wallet.type} />
            <span className="ml-1">{getTypeLabel(wallet.type)}</span>
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-1">
          {wallet.description}
        </p>
      </div>

      {/* Status */}
      <div className="flex-shrink-0">
        {isConnecting ? (
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        ) : !wallet.isAvailable && wallet.type === 'extension' ? (
          wallet.downloadUrl && (
            <a
              href={wallet.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-primary hover:underline text-xs flex items-center gap-1"
            >
              Install
              <ExternalLink className="w-3 h-3" />
            </a>
          )
        ) : (
          <div className="w-2 h-2 rounded-full bg-green-500" />
        )}
      </div>
    </button>
  );
}

export default WalletModal;
