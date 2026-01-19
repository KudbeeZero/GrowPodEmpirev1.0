import { Button } from "./ui/button";
import { SiX } from "react-icons/si";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface ShareButtonsProps {
  harvestAmount?: number;
  harvestCount?: number;
}

export function ShareButtons({ 
  harvestAmount = 100, 
  harvestCount = 1 
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const getShareText = () => {
    let text = `Just harvested ~${harvestAmount} $BUD in @GrowPodEmpire! `;
    
    text += `Harvest #${harvestCount} complete. `;
    text += `\n\nGrow your own empire on Algorand TestNet`;
    
    return text;
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const handleTwitterShare = () => {
    const text = encodeURIComponent(getShareText());
    const url = encodeURIComponent(shareUrl);
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const handleCopyLink = async () => {
    const text = `${getShareText()}\n\n${shareUrl}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Share text copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleTwitterShare}
        className="gap-2"
        data-testid="button-share-twitter"
      >
        <SiX className="h-4 w-4" />
        Share on X
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopyLink}
        className="gap-2"
        data-testid="button-copy-share"
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
        Copy
      </Button>
    </div>
  );
}
