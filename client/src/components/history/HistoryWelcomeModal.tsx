import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { BookOpen, Clock, Brain, MapPin, Trophy } from "lucide-react";

// Delay before showing welcome modal to allow page to render smoothly
const WELCOME_MODAL_DELAY_MS = 500;

interface WelcomeModalProps {
  onClose: () => void;
}

/**
 * Welcome modal for first-time visitors to the Cannabis History section
 * Shows overview of features and guides users through what to expect
 */
export function HistoryWelcomeModal({ onClose }: WelcomeModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem("history-welcome-seen", "true");
    }
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl flex items-center gap-2">
            <BookOpen className="h-7 w-7 text-primary" />
            Welcome to Cannabis History
          </DialogTitle>
          <DialogDescription className="text-base">
            Journey through 10,000+ years of cannabis cultivation, culture, and science
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card/40 p-4 rounded-lg border border-primary/20">
              <div className="flex items-start gap-3">
                <div className="bg-amber-500/20 p-2 rounded-md">
                  <Clock className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Historical Content</h3>
                  <p className="text-sm text-muted-foreground">
                    Explore 5 comprehensive sections covering ancient civilizations to modern times
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card/40 p-4 rounded-lg border border-primary/20">
              <div className="flex items-start gap-3">
                <div className="bg-pink-500/20 p-2 rounded-md">
                  <Brain className="h-5 w-5 text-pink-500" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Trivia Quiz</h3>
                  <p className="text-sm text-muted-foreground">
                    Test your knowledge with our interactive cannabis history quiz
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card/40 p-4 rounded-lg border border-primary/20">
              <div className="flex items-start gap-3">
                <div className="bg-blue-500/20 p-2 rounded-md">
                  <MapPin className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">World Map</h3>
                  <p className="text-sm text-muted-foreground">
                    Discover global cannabis history with our interactive map
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card/40 p-4 rounded-lg border border-primary/20">
              <div className="flex items-start gap-3">
                <div className="bg-green-500/20 p-2 rounded-md">
                  <Trophy className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Myth Buster</h3>
                  <p className="text-sm text-muted-foreground">
                    Separate fact from fiction with our myth-busting feature
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Tip */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <p className="text-sm">
              <strong className="text-primary">💡 Pro Tip:</strong> Navigate between sections using the tabs above, 
              and explore the interactive features to get the most out of your learning experience!
            </p>
          </div>

          {/* Don't Show Again Checkbox */}
          <div className="flex items-center gap-2">
            <Checkbox 
              id="dont-show" 
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(checked === true)}
            />
            <label 
              htmlFor="dont-show" 
              className="text-sm text-muted-foreground cursor-pointer"
            >
              Don't show this message again
            </label>
          </div>

          {/* Action Button */}
          <Button 
            onClick={handleClose}
            className="w-full bg-primary hover:bg-primary/90"
          >
            Start Exploring
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook to manage the welcome modal visibility based on localStorage
 */
export function useHistoryWelcome() {
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem("history-welcome-seen");
    if (!hasSeenWelcome) {
      // Show welcome modal after a short delay for better UX
      const timer = setTimeout(() => setShowWelcome(true), WELCOME_MODAL_DELAY_MS);
      return () => clearTimeout(timer);
    }
  }, []);

  const closeWelcome = () => setShowWelcome(false);

  return { showWelcome, closeWelcome };
}
