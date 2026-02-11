/**
 * ConnectWalletButton - Universal wallet connection button
 *
 * Shows connect button when disconnected, wallet info when connected.
 * Opens WalletModal for wallet selection.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Wallet, LogOut, Copy, ExternalLink, ChevronDown } from 'lucide-react';
import { WalletModal } from './WalletModal';
import { useMultiWallet } from '@/hooks/use-multi-wallet';
import { useToast } from '@/hooks/use-toast';

interface ConnectWalletButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

export function ConnectWalletButton({
  className,
  variant = 'default',
  size = 'default',
}: ConnectWalletButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const { account, isConnected, activeWalletName, disconnectWallet } = useMultiWallet();
  const { toast } = useToast();

  const copyAddress = () => {
    if (account) {
      navigator.clipboard.writeText(account);
      toast({
        title: 'Address Copied',
        description: 'Wallet address copied to clipboard',
      });
    }
  };

  const viewOnExplorer = () => {
    if (account) {
      window.open(`https://testnet.explorer.perawallet.app/address/${account}`, '_blank');
    }
  };

  if (!isConnected) {
    return (
      <>
        <Button
          variant={variant}
          size={size}
          className={className}
          onClick={() => setModalOpen(true)}
        >
          <Wallet className="w-4 h-4 mr-2" />
          Connect Wallet
        </Button>
        <WalletModal open={modalOpen} onOpenChange={setModalOpen} />
      </>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size={size} className={className}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="font-mono">
                {account?.slice(0, 4)}...{account?.slice(-4)}
              </span>
              <ChevronDown className="w-4 h-4 opacity-50" />
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">
                Connected via {activeWalletName}
              </span>
              <span className="font-mono text-xs truncate">{account}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={copyAddress}>
            <Copy className="w-4 h-4 mr-2" />
            Copy Address
          </DropdownMenuItem>
          <DropdownMenuItem onClick={viewOnExplorer}>
            <ExternalLink className="w-4 h-4 mr-2" />
            View on Explorer
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setModalOpen(true)}>
            <Wallet className="w-4 h-4 mr-2" />
            Change Wallet
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={disconnectWallet}
            className="text-destructive focus:text-destructive"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <WalletModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
}

export default ConnectWalletButton;
