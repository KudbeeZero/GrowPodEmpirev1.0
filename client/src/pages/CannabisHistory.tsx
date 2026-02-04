import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  FlaskConical, 
  Music, 
  Scale, 
  Factory,
  Brain,
  MapPin,
  Trophy,
  CheckCircle,
  XCircle,
  Globe,
  Clock,
  Sparkles,
  ChevronRight,
  Play
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { HistoricalTimeline } from "@/components/history/HistoricalTimeline";
import { TriviaQuiz } from "@/components/history/TriviaQuiz";
import { MythBuster } from "@/components/history/MythBuster";
import { CannabisWorldMap } from "@/components/history/CannabisWorldMap";

const sections = [
  { id: "ancient", label: "Ancient History", icon: Clock, color: "text-amber-400" },
  { id: "medical", label: "Medical Use", icon: FlaskConical, color: "text-emerald-400" },
  { id: "cultural", label: "Cultural Impact", icon: Music, color: "text-purple-400" },
  { id: "legal", label: "Legal Journey", icon: Scale, color: "text-blue-400" },
  { id: "industrial", label: "Industrial Uses", icon: Factory, color: "text-cyan-400" },
];

const interactiveFeatures = [
  { id: "quiz", label: "Trivia Quiz", icon: Brain, color: "text-pink-400" },
  { id: "timeline", label: "Interactive Timeline", icon: Clock, color: "text-amber-400" },
  { id: "myths", label: "Man vs. Myth", icon: CheckCircle, color: "text-green-400" },
  { id: "map", label: "World Map", icon: Globe, color: "text-blue-400" },
];

export default function CannabisHistory() {
  const [activeSection, setActiveSection] = useState("ancient");
  const [activeFeature, setActiveFeature] = useState<string | null>(null);

  return (
    <div className="min-h-screen py-12 px-4 container mx-auto">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 mb-8"
      >
        <div className="bg-primary/20 p-3 rounded-lg">
          <BookOpen className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-emerald-300">
            History of Cannabis
          </h1>
          <p className="text-muted-foreground">
            Explore the rich history, culture, and science behind cannabis
          </p>
        </div>
      </motion.div>

      {/* Interactive Features Showcase */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Interactive Features
            </CardTitle>
            <CardDescription>
              Test your knowledge and explore cannabis history in engaging ways
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {interactiveFeatures.map((feature) => {
                const Icon = feature.icon;
                return (
                  <Button
                    key={feature.id}
                    variant={activeFeature === feature.id ? "default" : "outline"}
                    className={cn(
                      "h-auto flex flex-col items-center gap-2 py-4",
                      activeFeature === feature.id && "bg-primary"
                    )}
                    onClick={() => setActiveFeature(activeFeature === feature.id ? null : feature.id)}
                  >
                    <Icon className={cn("h-6 w-6", feature.color)} />
                    <span className="text-sm font-medium text-center">{feature.label}</span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Interactive Feature Content */}
      <AnimatePresence mode="wait">
        {activeFeature && (
          <motion.div
            key={activeFeature}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-8"
          >
            {activeFeature === "quiz" && <TriviaQuiz />}
            {activeFeature === "timeline" && <HistoricalTimeline />}
            {activeFeature === "myths" && <MythBuster />}
            {activeFeature === "map" && <CannabisWorldMap />}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Tabs */}
      <Tabs value={activeSection} onValueChange={setActiveSection} className="space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 h-auto gap-2 bg-transparent p-0">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <TabsTrigger
                key={section.id}
                value={section.id}
                className="flex items-center gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary border border-white/5 py-3"
              >
                <Icon className={cn("h-4 w-4", section.color)} />
                <span className="hidden sm:inline">{section.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="ancient" className="space-y-6">
          <AncientHistoryContent />
        </TabsContent>

        <TabsContent value="medical" className="space-y-6">
          <MedicalUseContent />
        </TabsContent>

        <TabsContent value="cultural" className="space-y-6">
          <CulturalInfluenceContent />
        </TabsContent>

        <TabsContent value="legal" className="space-y-6">
          <LegalJourneyContent />
        </TabsContent>

        <TabsContent value="industrial" className="space-y-6">
          <IndustrialUsesContent />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Ancient History Content
function AncientHistoryContent() {
  const civilizations = [
    {
      name: "Ancient China",
      period: "~2737 BCE",
      description: "Emperor Shen Nung is said to have discovered the healing properties of cannabis. Used in traditional Chinese medicine for pain, inflammation, and various ailments.",
      highlights: ["Traditional medicine", "Hemp cultivation", "Textile production"],
      icon: "🏮",
    },
    {
      name: "Ancient India",
      period: "~2000 BCE",
      description: "Cannabis, known as 'bhang' and 'ganja', held sacred status in Hindu culture. Featured in Vedic texts as one of the five sacred plants.",
      highlights: ["Religious ceremonies", "Ayurvedic medicine", "Spiritual practices"],
      icon: "🕉️",
    },
    {
      name: "Ancient Egypt",
      period: "~1550 BCE",
      description: "The Ebers Papyrus documents cannabis use for inflammation and other medical conditions. Used in various preparations and remedies.",
      highlights: ["Medical papyri", "Treating inflammation", "Pain relief"],
      icon: "🏛️",
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="border-amber-500/20">
        <CardHeader>
          <CardTitle className="font-display text-2xl flex items-center gap-2">
            <Clock className="h-6 w-6 text-amber-400" />
            Origins of Cannabis
          </CardTitle>
          <CardDescription>
            Cannabis has been used by human civilizations for thousands of years, serving medicinal, spiritual, and practical purposes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="prose prose-invert max-w-none">
            <p className="text-muted-foreground">
              Cannabis sativa is believed to have originated in Central Asia, with archaeological evidence suggesting its use dating back to the Neolithic period. 
              Ancient civilizations quickly recognized the plant's versatility, utilizing it for fiber, food, medicine, and religious ceremonies.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {civilizations.map((civ, idx) => (
              <motion.div
                key={civ.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="border-amber-500/10 hover:border-amber-500/30 transition-colors h-full">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-3xl">{civ.icon}</span>
                      <div>
                        <CardTitle className="text-lg">{civ.name}</CardTitle>
                        <Badge variant="outline" className="text-xs mt-1">
                          {civ.period}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      {civ.description}
                    </p>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-amber-400">Key Highlights:</p>
                      {civ.highlights.map((highlight, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <ChevronRight className="h-3 w-3 text-amber-400" />
                          {highlight}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Medical Use Content
function MedicalUseContent() {
  const historicalUses = [
    { period: "Ancient Times", use: "Pain relief, inflammation, digestive issues" },
    { period: "Medieval Period", use: "Analgesic, anticonvulsant, sleep aid" },
    { period: "19th Century", use: "Western pharmaceutical preparations widespread" },
    { period: "Modern Era", use: "Chronic pain, epilepsy, PTSD, cancer treatment support" },
  ];

  const modernApplications = [
    {
      condition: "Chronic Pain",
      description: "CBD and THC help manage neuropathic and inflammatory pain",
      evidence: "Strong clinical evidence",
      icon: "🩹",
    },
    {
      condition: "Epilepsy",
      description: "FDA-approved CBD medication for severe childhood epilepsy",
      evidence: "FDA approved (Epidiolex)",
      icon: "🧠",
    },
    {
      condition: "Multiple Sclerosis",
      description: "Reduces muscle spasticity and pain in MS patients",
      evidence: "Moderate to strong evidence",
      icon: "💪",
    },
    {
      condition: "Cancer Support",
      description: "Manages chemotherapy-induced nausea and improves appetite",
      evidence: "Strong evidence for symptom relief",
      icon: "🎗️",
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="border-emerald-500/20">
        <CardHeader>
          <CardTitle className="font-display text-2xl flex items-center gap-2">
            <FlaskConical className="h-6 w-6 text-emerald-400" />
            Medical Applications Through History
          </CardTitle>
          <CardDescription>
            From ancient remedies to modern pharmaceuticals
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Historical Timeline of Medical Use</h3>
            <div className="grid gap-3">
              {historicalUses.map((item, idx) => (
                <motion.div
                  key={item.period}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-start gap-3 p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/10"
                >
                  <div className="bg-emerald-500/20 p-2 rounded">
                    <Clock className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-emerald-400">{item.period}</div>
                    <div className="text-sm text-muted-foreground">{item.use}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Modern Medical Applications</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {modernApplications.map((app, idx) => (
                <motion.div
                  key={app.condition}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="border-emerald-500/10 h-full">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{app.icon}</span>
                        <CardTitle className="text-base">{app.condition}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm text-muted-foreground">{app.description}</p>
                      <Badge variant="outline" className="text-xs bg-emerald-500/10 border-emerald-500/30">
                        {app.evidence}
                      </Badge>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <p className="text-sm text-amber-200">
              <strong>Note:</strong> Medical cannabis research is ongoing. Always consult healthcare professionals before using cannabis for medical purposes.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Cultural Influence Content
function CulturalInfluenceContent() {
  const culturalAreas = [
    {
      area: "Music",
      icon: Music,
      color: "text-purple-400",
      description: "From jazz and reggae to hip-hop and electronic music, cannabis has influenced musical creativity and culture.",
      examples: [
        "Jazz musicians in the 1920s-30s",
        "Bob Marley and reggae culture",
        "Hip-hop's relationship with cannabis",
        "Electronic music and festival culture",
      ],
    },
    {
      area: "Art & Literature",
      icon: BookOpen,
      color: "text-pink-400",
      description: "Cannabis has inspired countless artists, writers, and creators throughout history.",
      examples: [
        "Beat Generation writers",
        "Psychedelic art movement",
        "Contemporary cannabis art",
        "Cannabis-themed literature",
      ],
    },
    {
      area: "Social Movements",
      icon: Globe,
      color: "text-cyan-400",
      description: "Cannabis has been central to various social and political movements worldwide.",
      examples: [
        "Counterculture of the 1960s",
        "Legalization advocacy",
        "Criminal justice reform",
        "Medical access movements",
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="border-purple-500/20">
        <CardHeader>
          <CardTitle className="font-display text-2xl flex items-center gap-2">
            <Music className="h-6 w-6 text-purple-400" />
            Cultural Impact & Influence
          </CardTitle>
          <CardDescription>
            How cannabis shaped art, music, and global culture
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="prose prose-invert max-w-none">
            <p className="text-muted-foreground">
              Cannabis has left an indelible mark on global culture, influencing music, art, literature, and social movements. 
              Its impact extends far beyond its physical properties, becoming a symbol of creativity, rebellion, and social change.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {culturalAreas.map((area, idx) => {
              const Icon = area.icon;
              return (
                <motion.div
                  key={area.area}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.15 }}
                >
                  <Card className="border-white/5 hover:border-purple-500/30 transition-colors h-full">
                    <CardHeader>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 rounded-lg bg-purple-500/20">
                          <Icon className={cn("h-5 w-5", area.color)} />
                        </div>
                        <CardTitle className="text-lg">{area.area}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        {area.description}
                      </p>
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-purple-400">Notable Examples:</p>
                        {area.examples.map((example, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                            <ChevronRight className="h-3 w-3 text-purple-400 mt-0.5" />
                            {example}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Legal Journey Content
function LegalJourneyContent() {
  const legalMilestones = [
    {
      year: "1937",
      event: "Marijuana Tax Act (USA)",
      description: "Effectively criminalized cannabis in the United States",
      type: "prohibition",
    },
    {
      year: "1961",
      event: "UN Single Convention",
      description: "International treaty classified cannabis as a dangerous narcotic",
      type: "prohibition",
    },
    {
      year: "1996",
      event: "California Proposition 215",
      description: "First U.S. state to legalize medical cannabis",
      type: "reform",
    },
    {
      year: "2012",
      event: "Colorado & Washington",
      description: "First states to legalize recreational cannabis",
      type: "reform",
    },
    {
      year: "2018",
      event: "Canada Legalization",
      description: "Second country (after Uruguay) to fully legalize cannabis",
      type: "reform",
    },
    {
      year: "2020-Present",
      event: "Global Reform Wave",
      description: "Multiple countries and states implementing legalization",
      type: "reform",
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="border-blue-500/20">
        <CardHeader>
          <CardTitle className="font-display text-2xl flex items-center gap-2">
            <Scale className="h-6 w-6 text-blue-400" />
            The Legal Journey
          </CardTitle>
          <CardDescription>
            From prohibition to legalization: A timeline of cannabis law
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="prose prose-invert max-w-none">
            <p className="text-muted-foreground">
              The legal status of cannabis has undergone dramatic changes over the past century. 
              From widespread prohibition to gradual reform, the legal landscape continues to evolve globally.
            </p>
          </div>

          <div className="relative space-y-4">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-red-500 via-yellow-500 to-green-500" />

            {legalMilestones.map((milestone, idx) => (
              <motion.div
                key={milestone.year}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="relative pl-20"
              >
                <div className={cn(
                  "absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center border-2",
                  milestone.type === "prohibition" 
                    ? "bg-red-500/20 border-red-500" 
                    : "bg-green-500/20 border-green-500"
                )}>
                  {milestone.type === "prohibition" ? (
                    <XCircle className="h-4 w-4 text-red-400" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  )}
                </div>

                <Card className="border-white/5">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "w-fit",
                          milestone.type === "prohibition"
                            ? "border-red-500/30 text-red-400"
                            : "border-green-500/30 text-green-400"
                        )}
                      >
                        {milestone.year}
                      </Badge>
                      <span className="text-xs text-muted-foreground uppercase tracking-wider">
                        {milestone.type === "prohibition" ? "Prohibition" : "Reform"}
                      </span>
                    </div>
                    <h4 className="font-semibold mb-1">{milestone.event}</h4>
                    <p className="text-sm text-muted-foreground">{milestone.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <Card className="border-blue-500/10 bg-blue-500/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-blue-400 mt-0.5" />
                <div className="space-y-2">
                  <h4 className="font-semibold text-blue-400">Current Global Status</h4>
                  <p className="text-sm text-muted-foreground">
                    As of 2024, cannabis remains illegal in many countries but legal reform is accelerating. 
                    Over 50 countries have medical cannabis programs, and recreational use is legal in Canada, Uruguay, 
                    parts of the USA, and several other nations.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}

// Industrial Uses Content
function IndustrialUsesContent() {
  const industrialApplications = [
    {
      category: "Textiles & Fabric",
      icon: "👔",
      description: "Hemp fiber has been used for thousands of years to make rope, canvas, and clothing.",
      uses: [
        "Durable clothing and fabrics",
        "Rope and cordage",
        "Canvas and sails",
        "Modern sustainable fashion",
      ],
      benefits: "Stronger than cotton, requires less water, naturally pest-resistant",
    },
    {
      category: "Paper & Materials",
      icon: "📄",
      description: "Hemp paper is more sustainable than wood pulp and doesn't require bleaching chemicals.",
      uses: [
        "Fine printing paper",
        "Currency and banknotes",
        "Filters and specialized papers",
        "Cardboard and packaging",
      ],
      benefits: "Faster growth, more paper per acre, longer-lasting than wood paper",
    },
    {
      category: "Construction",
      icon: "🏗️",
      description: "Hempcrete and other hemp-based materials offer sustainable building solutions.",
      uses: [
        "Hempcrete insulation",
        "Building blocks",
        "Fiberboard and paneling",
        "Biodegradable plastics",
      ],
      benefits: "Carbon-negative, excellent insulation, pest and mold resistant",
    },
    {
      category: "Biofuel & Energy",
      icon: "⚡",
      description: "Hemp can be converted into biodiesel and ethanol, offering renewable energy alternatives.",
      uses: [
        "Hemp biodiesel",
        "Hemp ethanol",
        "Biomass fuel pellets",
        "Carbon sequestration",
      ],
      benefits: "Renewable, low sulfur emissions, carbon-neutral growth cycle",
    },
    {
      category: "Food & Nutrition",
      icon: "🌾",
      description: "Hemp seeds are nutritionally dense and can be used in various food products.",
      uses: [
        "Hemp seed oil",
        "Protein powder",
        "Hemp milk alternatives",
        "Whole seeds and hearts",
      ],
      benefits: "Complete protein, omega-3 and omega-6 fatty acids, highly digestible",
    },
    {
      category: "Cosmetics & Body Care",
      icon: "🧴",
      description: "Hemp oil and CBD are increasingly popular in skincare and wellness products.",
      uses: [
        "Moisturizers and lotions",
        "Hair care products",
        "CBD topicals",
        "Soap and cleansers",
      ],
      benefits: "Anti-inflammatory, moisturizing, rich in vitamins and antioxidants",
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="border-cyan-500/20">
        <CardHeader>
          <CardTitle className="font-display text-2xl flex items-center gap-2">
            <Factory className="h-6 w-6 text-cyan-400" />
            Industrial Applications
          </CardTitle>
          <CardDescription>
            Hemp's versatile applications in industry and manufacturing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="prose prose-invert max-w-none">
            <p className="text-muted-foreground">
              Industrial hemp (cannabis with &lt;0.3% THC) has over 25,000 known uses. 
              From textiles to biofuels, hemp offers sustainable alternatives to traditional materials. 
              The hemp industry is experiencing a renaissance as environmental concerns drive demand for eco-friendly products.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {industrialApplications.map((app, idx) => (
              <motion.div
                key={app.category}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="border-cyan-500/10 hover:border-cyan-500/30 transition-colors h-full">
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-3xl">{app.icon}</span>
                      <CardTitle className="text-base">{app.category}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      {app.description}
                    </p>
                    
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-cyan-400">Applications:</p>
                      <div className="grid grid-cols-1 gap-1">
                        {app.uses.map((use, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                            <CheckCircle className="h-3 w-3 text-cyan-400 mt-0.5 shrink-0" />
                            {use}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/5">
                      <p className="text-xs text-cyan-300/80">
                        <strong>Benefits:</strong> {app.benefits}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <Card className="border-emerald-500/20 bg-emerald-500/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-emerald-400 mt-0.5" />
                <div className="space-y-2">
                  <h4 className="font-semibold text-emerald-400">Environmental Impact</h4>
                  <p className="text-sm text-muted-foreground">
                    Hemp is one of the most sustainable crops on Earth. It grows quickly (ready in 3-4 months), 
                    requires minimal water and pesticides, improves soil health, and sequesters significant amounts of CO₂. 
                    One acre of hemp can produce as much paper as 4 acres of trees over a 20-year cycle.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}