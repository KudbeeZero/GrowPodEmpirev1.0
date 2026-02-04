import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertCircle, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface MythFact {
  statement: string;
  isMyth: boolean;
  explanation: string;
  category: string;
  sources?: string[];
}

const mythsAndFacts: MythFact[] = [
  {
    statement: "Cannabis is a 'gateway drug' that inevitably leads to harder drug use",
    isMyth: true,
    explanation: "Research shows no causal link between cannabis use and progression to harder drugs. The 'gateway theory' has been debunked by numerous studies. Most cannabis users never use other illicit drugs, and correlation doesn't equal causation.",
    category: "Social Myths",
    sources: ["National Institute on Drug Abuse", "Journal of School Health 2012"],
  },
  {
    statement: "Cannabis has legitimate medical applications recognized by modern medicine",
    isMyth: false,
    explanation: "True! Cannabis and cannabinoids have proven medical applications. The FDA has approved CBD medication (Epidiolex) for epilepsy, and THC-based medications for nausea and appetite loss. Medical cannabis programs exist in over 50 countries.",
    category: "Medical Facts",
    sources: ["FDA", "WHO", "Medical research journals"],
  },
  {
    statement: "Cannabis kills brain cells and causes permanent brain damage",
    isMyth: true,
    explanation: "This myth originated from flawed 1970s research. Modern brain imaging studies show cannabis doesn't kill brain cells or cause structural brain damage in adults. However, heavy use during adolescence may affect developing brains.",
    category: "Health Myths",
    sources: ["Journal of Neuroscience", "JAMA Psychiatry"],
  },
  {
    statement: "It's impossible to overdose fatally on cannabis",
    isMyth: false,
    explanation: "True! There has never been a documented case of fatal cannabis overdose. The amount needed to cause death is impossibly large. While excessive consumption can cause discomfort, it's not lethal like many other substances.",
    category: "Health Facts",
    sources: ["DEA", "American Scientist Journal"],
  },
  {
    statement: "Cannabis is more addictive than alcohol",
    isMyth: true,
    explanation: "Research shows cannabis has lower addiction potential than alcohol, tobacco, or opioids. About 9% of cannabis users develop dependence, compared to 15% for alcohol and 32% for tobacco. Addiction is possible but less likely.",
    category: "Health Myths",
    sources: ["National Institute on Drug Abuse", "Addiction journal"],
  },
  {
    statement: "Hemp and marijuana are the same plant",
    isMyth: false,
    explanation: "True! Hemp and marijuana are both Cannabis sativa. The difference is THC content: hemp has <0.3% THC (legal threshold in U.S.) while marijuana has higher THC. They're bred for different purposes but are the same species.",
    category: "Plant Facts",
    sources: ["2018 U.S. Farm Bill", "Botanical studies"],
  },
  {
    statement: "Cannabis has no legitimate industrial or commercial uses",
    isMyth: true,
    explanation: "Hemp has over 25,000 known uses including textiles, paper, construction materials, biofuel, plastics, and food products. It's been used industrially for thousands of years and is experiencing a renaissance as a sustainable material.",
    category: "Industrial Myths",
    sources: ["USDA", "Hemp Industries Association"],
  },
  {
    statement: "Cannabis legalization increases youth usage rates",
    isMyth: true,
    explanation: "Studies in legalized states/countries show youth usage rates remain stable or decrease after legalization. Regulated markets with age restrictions and education may actually reduce teen access compared to black markets.",
    category: "Social Myths",
    sources: ["JAMA Pediatrics", "Colorado Department of Public Health"],
  },
  {
    statement: "Ancient civilizations used cannabis for medicinal and spiritual purposes",
    isMyth: false,
    explanation: "True! Cannabis use dates back thousands of years. Ancient Chinese medicine (2737 BCE), Indian Vedic texts, Egyptian papyri, and many other historical documents record cannabis use for medicine, spirituality, and textiles.",
    category: "Historical Facts",
    sources: ["Archaeological records", "Ebers Papyrus", "Vedic texts"],
  },
  {
    statement: "Cannabis smoke is harmless and contains no carcinogens",
    isMyth: true,
    explanation: "Cannabis smoke does contain carcinogens and tar similar to tobacco smoke. However, research hasn't found the same lung cancer correlation as tobacco. Vaporization or edible consumption eliminates smoke-related risks.",
    category: "Health Myths",
    sources: ["American Lung Association", "Respiratory research"],
  },
  {
    statement: "CBD (cannabidiol) gets you high",
    isMyth: true,
    explanation: "CBD is non-intoxicating and doesn't produce a 'high'. THC is the psychoactive cannabinoid. CBD has therapeutic properties without impairment, which is why it's legal in many places where THC isn't.",
    category: "Science Myths",
    sources: ["WHO", "Clinical research"],
  },
  {
    statement: "Cannabis can help reduce opioid use and overdose deaths",
    isMyth: false,
    explanation: "True! Research shows states with medical cannabis laws have lower opioid prescription rates and overdose deaths. Many patients successfully use cannabis as an alternative to opioids for chronic pain management.",
    category: "Medical Facts",
    sources: ["JAMA Internal Medicine", "Drug and Alcohol Dependence journal"],
  },
];

export function MythBuster() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState<boolean | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });

  const current = mythsAndFacts[currentIndex];
  const isCorrect = userAnswer === current.isMyth;

  const handleAnswer = (answer: boolean) => {
    setUserAnswer(answer);
    setShowResult(true);
    
    if (answer === current.isMyth) {
      setScore(prev => ({ ...prev, correct: prev.correct + 1 }));
    } else {
      setScore(prev => ({ ...prev, incorrect: prev.incorrect + 1 }));
    }
  };

  const handleNext = () => {
    if (currentIndex < mythsAndFacts.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setUserAnswer(null);
      setShowResult(false);
    } else {
      // Could show final score summary
      setCurrentIndex(0);
      setUserAnswer(null);
      setShowResult(false);
      setScore({ correct: 0, incorrect: 0 });
    }
  };

  return (
    <Card className="border-green-500/20 bg-gradient-to-br from-background to-green-500/5">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="font-display flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-green-400" />
            Man vs. Myth
          </CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-green-500/20 border-green-500/30">
              ✓ {score.correct}
            </Badge>
            <Badge variant="outline" className="bg-red-500/20 border-red-500/30">
              ✗ {score.incorrect}
            </Badge>
          </div>
        </div>
        <CardDescription>
          Separate cannabis facts from fiction. Is this statement a myth or reality?
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Badge variant="secondary" className="mb-2">
            {current.category}
          </Badge>

          <Card className="border-white/10 bg-gradient-to-br from-white/5 to-transparent">
            <CardContent className="p-6">
              <p className="text-lg leading-relaxed">
                {current.statement}
              </p>
            </CardContent>
          </Card>
        </div>

        {!showResult ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 gap-4"
          >
            <Button
              onClick={() => handleAnswer(true)}
              size="lg"
              variant="outline"
              className="h-24 flex flex-col gap-2 border-2 border-red-500/30 hover:bg-red-500/10 hover:border-red-500"
            >
              <XCircle className="h-8 w-8 text-red-400" />
              <span className="text-lg font-semibold">MYTH</span>
            </Button>
            <Button
              onClick={() => handleAnswer(false)}
              size="lg"
              variant="outline"
              className="h-24 flex flex-col gap-2 border-2 border-green-500/30 hover:bg-green-500/10 hover:border-green-500"
            >
              <CheckCircle className="h-8 w-8 text-green-400" />
              <span className="text-lg font-semibold">FACT</span>
            </Button>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Result Card */}
              <Card className={cn(
                "border-2",
                isCorrect 
                  ? "border-green-500/30 bg-green-500/5" 
                  : "border-red-500/30 bg-red-500/5"
              )}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {isCorrect ? (
                      <div className="p-2 rounded-full bg-green-500/20">
                        <CheckCircle className="h-6 w-6 text-green-400" />
                      </div>
                    ) : (
                      <div className="p-2 rounded-full bg-red-500/20">
                        <XCircle className="h-6 w-6 text-red-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className={cn(
                        "font-semibold text-lg mb-2",
                        isCorrect ? "text-green-400" : "text-red-400"
                      )}>
                        {isCorrect ? "Correct!" : "Incorrect"}
                      </h4>
                      <div className="space-y-2">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            current.isMyth 
                              ? "bg-red-500/20 border-red-500/30 text-red-400"
                              : "bg-green-500/20 border-green-500/30 text-green-400"
                          )}
                        >
                          {current.isMyth ? "This is a MYTH" : "This is a FACT"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Explanation Card */}
              <Card className="border-blue-500/20 bg-blue-500/5">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="h-5 w-5 text-blue-400 mt-0.5" />
                    <div className="flex-1 space-y-3">
                      <h4 className="font-semibold text-blue-400">Explanation</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {current.explanation}
                      </p>
                      {current.sources && current.sources.length > 0 && (
                        <div className="pt-3 border-t border-white/5">
                          <p className="text-xs text-muted-foreground">
                            <strong>Sources:</strong> {current.sources.join(", ")}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button
                onClick={handleNext}
                className="w-full bg-primary"
              >
                {currentIndex < mythsAndFacts.length - 1 ? "Next Statement" : "Restart"}
              </Button>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Progress</span>
            <span>{currentIndex + 1} / {mythsAndFacts.length}</span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
              initial={{ width: 0 }}
              animate={{ 
                width: `${((currentIndex + (showResult ? 1 : 0)) / mythsAndFacts.length) * 100}%` 
              }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
