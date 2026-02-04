import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { ChevronRight, LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface FeatureHighlightProps {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  gradient?: string;
  className?: string;
}

/**
 * Reusable component for highlighting new or featured content on the Dashboard
 * Follows the cyberpunk theme with glowing effects and animations
 */
export function FeatureHighlight({
  title,
  description,
  href,
  icon: Icon,
  badge = "NEW",
  gradient = "from-primary via-emerald-400 to-primary",
  className = "",
}: FeatureHighlightProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className={className}
    >
      <Card className="relative overflow-hidden bg-gradient-to-br from-card/60 to-card/30 border-primary/30 hover:border-primary/50 transition-all duration-300 backdrop-blur-md group">
        {/* Animated gradient background */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className={`absolute inset-0 bg-gradient-to-r ${gradient} opacity-5`} />
        </div>
        
        {/* Glow effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className={`absolute inset-0 bg-gradient-to-r ${gradient} blur-xl opacity-20`} />
        </div>

        <CardContent className="p-6 relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className={`h-12 w-12 rounded-full bg-gradient-to-br ${gradient} bg-opacity-20 flex items-center justify-center shrink-0`}>
              <Icon className="h-6 w-6 text-primary" />
            </div>
            {badge && (
              <Badge 
                variant="outline" 
                className="border-primary/50 text-primary bg-primary/10 animate-pulse"
              >
                {badge}
              </Badge>
            )}
          </div>

          <h3 className="text-xl font-display font-bold mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{description}</p>

          <Link href={href}>
            <Button 
              variant="ghost" 
              className="w-full justify-between group-hover:bg-primary/10 transition-colors"
            >
              <span>Explore Now</span>
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  );
}
