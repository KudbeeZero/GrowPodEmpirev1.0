import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, CheckCircle, XCircle, Trophy, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
}

const quizQuestions: QuizQuestion[] = [
  {
    question: "In which ancient civilization was cannabis first documented for medicinal use?",
    options: ["Ancient Egypt", "Ancient China", "Ancient India", "Ancient Greece"],
    correctAnswer: 1,
    explanation: "Emperor Shen Nung of China documented cannabis use around 2737 BCE, making it one of the earliest recorded medicinal uses.",
    category: "Ancient History",
    difficulty: "easy",
  },
  {
    question: "What year did California legalize medical cannabis, becoming the first U.S. state to do so?",
    options: ["1992", "1996", "2000", "2004"],
    correctAnswer: 1,
    explanation: "California passed Proposition 215 in 1996, pioneering medical cannabis legalization in the United States.",
    category: "Legal History",
    difficulty: "medium",
  },
  {
    question: "Which country became the first to fully legalize recreational cannabis nationwide?",
    options: ["Canada", "Netherlands", "Uruguay", "Portugal"],
    correctAnswer: 2,
    explanation: "Uruguay legalized recreational cannabis in 2013, becoming the first country in the world to do so.",
    category: "Legal History",
    difficulty: "medium",
  },
  {
    question: "What is the scientific name of the cannabis plant?",
    options: ["Cannabis indica", "Cannabis sativa", "Both are correct", "Cannabis ruderalis"],
    correctAnswer: 2,
    explanation: "Cannabis sativa is the most common species, but Cannabis indica is also widely recognized. Together they make up the primary cannabis species.",
    category: "Science",
    difficulty: "easy",
  },
  {
    question: "In which sacred Hindu texts is cannabis mentioned as one of five sacred plants?",
    options: ["The Upanishads", "The Vedas", "The Bhagavad Gita", "The Ramayana"],
    correctAnswer: 1,
    explanation: "The Vedas, ancient Hindu scriptures dating back to around 2000 BCE, mention cannabis as one of five sacred plants.",
    category: "Ancient History",
    difficulty: "hard",
  },
  {
    question: "Which U.S. founding father grew hemp on his farm?",
    options: ["Benjamin Franklin", "George Washington", "Thomas Jefferson", "All of the above"],
    correctAnswer: 3,
    explanation: "George Washington, Thomas Jefferson, and Benjamin Franklin all grew hemp. Washington grew it at Mount Vernon, and Franklin owned a hemp paper mill.",
    category: "Industrial History",
    difficulty: "medium",
  },
  {
    question: "What FDA-approved medication contains CBD for treating severe epilepsy?",
    options: ["Marinol", "Epidiolex", "Sativex", "Dronabinol"],
    correctAnswer: 1,
    explanation: "Epidiolex was approved by the FDA in 2018 for treating severe forms of childhood epilepsy.",
    category: "Medical Use",
    difficulty: "medium",
  },
  {
    question: "How many known uses does industrial hemp have approximately?",
    options: ["5,000", "10,000", "25,000", "50,000"],
    correctAnswer: 2,
    explanation: "Industrial hemp has over 25,000 known uses, from textiles and paper to biofuel and construction materials.",
    category: "Industrial History",
    difficulty: "hard",
  },
  {
    question: "Which music genre is most famously associated with cannabis culture?",
    options: ["Jazz", "Reggae", "Hip-Hop", "All of the above"],
    correctAnswer: 3,
    explanation: "Cannabis has been deeply intertwined with jazz (1920s-40s), reggae (Bob Marley era), and hip-hop cultures throughout history.",
    category: "Cultural Impact",
    difficulty: "easy",
  },
  {
    question: "When did the UN remove cannabis from its list of most dangerous drugs?",
    options: ["2015", "2018", "2020", "2022"],
    correctAnswer: 2,
    explanation: "In December 2020, the UN Commission on Narcotic Drugs removed cannabis from Schedule IV, recognizing its medical value.",
    category: "Legal History",
    difficulty: "hard",
  },
  {
    question: "What percentage of THC must hemp contain to be classified as industrial hemp in the U.S.?",
    options: ["Less than 0.1%", "Less than 0.3%", "Less than 0.5%", "Less than 1%"],
    correctAnswer: 1,
    explanation: "In the U.S., industrial hemp must contain less than 0.3% THC on a dry weight basis to be legally classified as hemp.",
    category: "Industrial History",
    difficulty: "medium",
  },
  {
    question: "Which ancient document, dating to 1550 BCE, documented cannabis for treating inflammation?",
    options: ["The Dead Sea Scrolls", "The Ebers Papyrus", "The Code of Hammurabi", "The Rosetta Stone"],
    correctAnswer: 1,
    explanation: "The Ebers Papyrus, an ancient Egyptian medical document from around 1550 BCE, documents cannabis use for various medical conditions.",
    category: "Ancient History",
    difficulty: "hard",
  },
];

export function TriviaQuiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState<boolean[]>(
    new Array(quizQuestions.length).fill(false)
  );

  const question = quizQuestions[currentQuestion];
  const isCorrect = selectedAnswer === question.correctAnswer;

  const handleAnswerSelect = (answerIndex: number) => {
    if (!showResult) {
      setSelectedAnswer(answerIndex);
    }
  };

  const handleSubmit = () => {
    if (selectedAnswer === null) return;

    setShowResult(true);
    
    if (!answeredQuestions[currentQuestion]) {
      const newAnswered = [...answeredQuestions];
      newAnswered[currentQuestion] = true;
      setAnsweredQuestions(newAnswered);

      if (isCorrect) {
        setScore(score + 1);
      }
    }
  };

  const handleNext = () => {
    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setQuizComplete(true);
    }
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setQuizComplete(false);
    setAnsweredQuestions(new Array(quizQuestions.length).fill(false));
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "text-green-400 bg-green-500/20 border-green-500/30";
      case "medium":
        return "text-yellow-400 bg-yellow-500/20 border-yellow-500/30";
      case "hard":
        return "text-red-400 bg-red-500/20 border-red-500/30";
      default:
        return "text-muted-foreground";
    }
  };

  if (quizComplete) {
    const percentage = Math.round((score / quizQuestions.length) * 100);
    let message = "";
    let emoji = "";
    
    if (percentage >= 90) {
      message = "Outstanding! You're a cannabis history expert!";
      emoji = "🏆";
    } else if (percentage >= 70) {
      message = "Great job! You know your cannabis history well!";
      emoji = "🌟";
    } else if (percentage >= 50) {
      message = "Good effort! Keep learning about cannabis history!";
      emoji = "👍";
    } else {
      message = "Keep exploring! There's so much to learn!";
      emoji = "📚";
    }

    return (
      <Card className="border-pink-500/20 bg-gradient-to-br from-background to-pink-500/5">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <Trophy className="h-5 w-5 text-pink-400" />
            Quiz Complete!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center space-y-4"
          >
            <div className="text-6xl">{emoji}</div>
            <div>
              <div className="text-4xl font-display font-bold text-primary mb-2">
                {score} / {quizQuestions.length}
              </div>
              <div className="text-lg text-muted-foreground mb-2">
                {percentage}% Correct
              </div>
              <p className="text-sm text-muted-foreground">{message}</p>
            </div>
          </motion.div>

          <Button
            onClick={handleRestart}
            className="w-full bg-pink-500 hover:bg-pink-600"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-pink-500/20 bg-gradient-to-br from-background to-pink-500/5">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="font-display flex items-center gap-2">
            <Brain className="h-5 w-5 text-pink-400" />
            Cannabis History Trivia
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-pink-500/20 border-pink-500/30">
              {currentQuestion + 1} / {quizQuestions.length}
            </Badge>
            <Badge variant="outline" className="bg-primary/20 border-primary/30">
              Score: {score}
            </Badge>
          </div>
        </div>
        <CardDescription>
          Test your knowledge of cannabis history, culture, and science
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={getDifficultyColor(question.difficulty)}>
              {question.difficulty}
            </Badge>
            <Badge variant="secondary">{question.category}</Badge>
          </div>

          <h3 className="text-lg font-semibold leading-tight">
            {question.question}
          </h3>
        </div>

        <div className="space-y-2">
          <AnimatePresence mode="wait">
            {question.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrectAnswer = index === question.correctAnswer;
              const showCorrect = showResult && isCorrectAnswer;
              const showIncorrect = showResult && isSelected && !isCorrect;

              return (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={showResult}
                  className={cn(
                    "w-full p-4 rounded-lg text-left transition-all border-2",
                    "hover:border-primary/50 disabled:cursor-not-allowed",
                    !showResult && isSelected && "border-primary bg-primary/10",
                    !showResult && !isSelected && "border-white/5 bg-white/5",
                    showCorrect && "border-green-500 bg-green-500/10",
                    showIncorrect && "border-red-500 bg-red-500/10"
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className={cn(
                      "flex-1",
                      showCorrect && "text-green-400 font-semibold",
                      showIncorrect && "text-red-400"
                    )}>
                      {option}
                    </span>
                    {showCorrect && <CheckCircle className="h-5 w-5 text-green-400" />}
                    {showIncorrect && <XCircle className="h-5 w-5 text-red-400" />}
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>

        {showResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className={cn(
              "border-2",
              isCorrect ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"
            )}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {isCorrect ? (
                    <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-400 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className={cn(
                      "font-semibold mb-1",
                      isCorrect ? "text-green-400" : "text-red-400"
                    )}>
                      {isCorrect ? "Correct!" : "Incorrect"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {question.explanation}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <div className="flex gap-2">
          {!showResult ? (
            <Button
              onClick={handleSubmit}
              disabled={selectedAnswer === null}
              className="flex-1 bg-pink-500 hover:bg-pink-600"
            >
              Submit Answer
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className="flex-1 bg-primary"
            >
              {currentQuestion < quizQuestions.length - 1 ? "Next Question" : "See Results"}
            </Button>
          )}
        </div>

        {/* Progress bar */}
        <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-pink-500 to-primary"
            initial={{ width: 0 }}
            animate={{ 
              width: `${((currentQuestion + (showResult ? 1 : 0)) / quizQuestions.length) * 100}%` 
            }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
