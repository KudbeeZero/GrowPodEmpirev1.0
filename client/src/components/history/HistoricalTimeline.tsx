import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const timelineEvents = [
  {
    year: "2737 BCE",
    era: "Ancient",
    region: "China",
    title: "Emperor Shen Nung's Discovery",
    description: "According to legend, Emperor Shen Nung discovers the medicinal properties of cannabis and documents its use in treating various ailments.",
    significance: "First documented medicinal use",
    icon: "🏮",
  },
  {
    year: "2000 BCE",
    era: "Ancient",
    region: "India",
    title: "Vedic Sacred Plant",
    description: "Cannabis mentioned in the Vedas as one of the five sacred plants. Used in religious ceremonies and Ayurvedic medicine.",
    significance: "Spiritual and medicinal integration",
    icon: "🕉️",
  },
  {
    year: "1550 BCE",
    era: "Ancient",
    region: "Egypt",
    title: "Ebers Papyrus",
    description: "The Ebers Papyrus documents cannabis use for treating inflammation, glaucoma, and other medical conditions.",
    significance: "Early medical documentation",
    icon: "📜",
  },
  {
    year: "440 BCE",
    era: "Ancient",
    region: "Greece",
    title: "Greek Medical Use",
    description: "Herodotus documents cannabis use by the Scythians, and Greek physicians use it for medicinal purposes.",
    significance: "Spread to Mediterranean",
    icon: "🏛️",
  },
  {
    year: "100 CE",
    era: "Ancient",
    region: "Rome",
    title: "Roman Empire Adoption",
    description: "Cannabis cultivated widely in the Roman Empire for fiber and medicine.",
    significance: "Industrial hemp production",
    icon: "🏛️",
  },
  {
    year: "1000 CE",
    era: "Medieval",
    region: "Middle East",
    title: "Islamic Golden Age",
    description: "Cannabis used medicinally and recreationally in Islamic world. Mentioned in Arabian Nights tales.",
    significance: "Cultural integration",
    icon: "🌙",
  },
  {
    year: "1545",
    era: "Colonial",
    region: "Americas",
    title: "Introduction to Americas",
    description: "Spanish bring cannabis to the New World. Hemp cultivation begins in Chile.",
    significance: "Global spread begins",
    icon: "⛵",
  },
  {
    year: "1619",
    era: "Colonial",
    region: "America",
    title: "Virginia Hemp Law",
    description: "Jamestown Colony requires all farmers to grow hemp. Hemp becomes legal tender in some colonies.",
    significance: "Economic importance",
    icon: "🌾",
  },
  {
    year: "1840",
    era: "Modern",
    region: "Europe",
    title: "Western Medical Recognition",
    description: "Dr. William O'Shaughnessy introduces cannabis to Western medicine after studying its use in India.",
    significance: "Scientific study begins",
    icon: "🔬",
  },
  {
    year: "1850-1915",
    era: "Modern",
    region: "Global",
    title: "Pharmaceutical Era",
    description: "Cannabis widely available in pharmacies. Used to treat pain, seizures, and various conditions.",
    significance: "Mainstream medical use",
    icon: "💊",
  },
  {
    year: "1937",
    era: "Prohibition",
    region: "USA",
    title: "Marijuana Tax Act",
    description: "U.S. effectively criminalizes cannabis through prohibitive taxation and regulation.",
    significance: "Beginning of prohibition",
    icon: "⚖️",
  },
  {
    year: "1961",
    era: "Prohibition",
    region: "Global",
    title: "UN Single Convention",
    description: "United Nations treaty classifies cannabis as dangerous narcotic with no medical value.",
    significance: "Global prohibition framework",
    icon: "🌍",
  },
  {
    year: "1970",
    era: "Prohibition",
    region: "USA",
    title: "Controlled Substances Act",
    description: "Cannabis classified as Schedule I drug in the U.S., declaring no accepted medical use.",
    significance: "Strengthened prohibition",
    icon: "🚫",
  },
  {
    year: "1996",
    era: "Reform",
    region: "California",
    title: "Proposition 215",
    description: "California becomes first U.S. state to legalize medical cannabis.",
    significance: "Modern legalization begins",
    icon: "🏥",
  },
  {
    year: "2012",
    era: "Reform",
    region: "USA",
    title: "Recreational Legalization",
    description: "Colorado and Washington become first states to legalize recreational cannabis.",
    significance: "Recreational reform milestone",
    icon: "🎉",
  },
  {
    year: "2013",
    era: "Reform",
    region: "Uruguay",
    title: "First Country to Legalize",
    description: "Uruguay becomes the first country to fully legalize cannabis production, sale, and consumption.",
    significance: "National legalization precedent",
    icon: "🇺🇾",
  },
  {
    year: "2018",
    era: "Reform",
    region: "Canada",
    title: "Canada Legalizes",
    description: "Canada legalizes recreational cannabis nationwide, becoming second country after Uruguay.",
    significance: "Major national legalization",
    icon: "🇨🇦",
  },
  {
    year: "2020",
    era: "Reform",
    region: "Global",
    title: "UN Reclassification",
    description: "United Nations removes cannabis from most dangerous drugs category, recognizing medical value.",
    significance: "International recognition",
    icon: "🌐",
  },
  {
    year: "2024",
    era: "Modern",
    region: "Global",
    title: "Continued Reform",
    description: "Dozens of countries and states have medical programs. Multiple nations pursuing legalization.",
    significance: "Ongoing global reform",
    icon: "📈",
  },
];

const eras = ["All", "Ancient", "Medieval", "Colonial", "Modern", "Prohibition", "Reform"];

export function HistoricalTimeline() {
  const [selectedEra, setSelectedEra] = useState("All");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredEvents = selectedEra === "All" 
    ? timelineEvents 
    : timelineEvents.filter(event => event.era === selectedEra);

  const currentEvent = filteredEvents[selectedIndex];

  const handlePrevious = () => {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredEvents.length - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev < filteredEvents.length - 1 ? prev + 1 : 0));
  };

  return (
    <Card className="border-amber-500/20 bg-gradient-to-br from-background to-amber-500/5">
      <CardHeader>
        <CardTitle className="font-display flex items-center gap-2">
          <Clock className="h-5 w-5 text-amber-400" />
          Interactive Historical Timeline
        </CardTitle>
        <CardDescription>
          Navigate through 5,000 years of cannabis history
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Era Filter */}
        <div className="flex flex-wrap gap-2">
          {eras.map((era) => (
            <Button
              key={era}
              variant={selectedEra === era ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setSelectedEra(era);
                setSelectedIndex(0);
              }}
              className={cn(
                "text-xs",
                selectedEra === era && "bg-amber-500 hover:bg-amber-600"
              )}
            >
              {era}
            </Button>
          ))}
        </div>

        {/* Main Event Display */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${selectedEra}-${selectedIndex}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-5xl">{currentEvent.icon}</span>
                    <div>
                      <Badge variant="outline" className="mb-2 bg-amber-500/20 border-amber-500/30">
                        {currentEvent.year}
                      </Badge>
                      <h3 className="text-2xl font-display font-bold">{currentEvent.title}</h3>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {currentEvent.region}
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    {currentEvent.era}
                  </Badge>
                </div>

                <p className="text-muted-foreground">{currentEvent.description}</p>

                <div className="pt-3 border-t border-white/5">
                  <p className="text-sm">
                    <span className="font-semibold text-amber-400">Historical Significance:</span>{" "}
                    <span className="text-muted-foreground">{currentEvent.significance}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevious}
            className="flex-1"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          <div className="text-sm text-muted-foreground whitespace-nowrap">
            {selectedIndex + 1} / {filteredEvents.length}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            className="flex-1"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        {/* Timeline Dots */}
        <ScrollArea className="w-full">
          <div className="flex gap-2 pb-2">
            {filteredEvents.map((event, idx) => (
              <button
                key={`${event.year}-${idx}`}
                onClick={() => setSelectedIndex(idx)}
                className={cn(
                  "h-2 rounded-full transition-all shrink-0",
                  idx === selectedIndex 
                    ? "w-12 bg-amber-500" 
                    : "w-2 bg-amber-500/30 hover:bg-amber-500/50"
                )}
                title={event.title}
              />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
