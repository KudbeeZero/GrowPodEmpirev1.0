import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Globe, MapPin, CheckCircle, AlertCircle, XCircle, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Region {
  name: string;
  status: "legal-recreational" | "legal-medical" | "decriminalized" | "illegal" | "mixed";
  countries: CountryInfo[];
  summary: string;
}

interface CountryInfo {
  name: string;
  flag: string;
  status: "legal-recreational" | "legal-medical" | "decriminalized" | "illegal" | "mixed";
  details: string;
  year?: string;
  significance?: string;
}

const worldRegions: Region[] = [
  {
    name: "North America",
    status: "mixed",
    summary: "Progressive reform with several jurisdictions legalizing recreational use",
    countries: [
      {
        name: "Canada",
        flag: "🇨🇦",
        status: "legal-recreational",
        details: "Fully legalized recreational cannabis nationwide in 2018. Regulated market with licensed producers and retail stores.",
        year: "2018",
        significance: "Second country to fully legalize",
      },
      {
        name: "United States",
        flag: "🇺🇸",
        status: "mixed",
        details: "Legal status varies by state. 24+ states have legalized recreational use, 38+ have medical programs. Federally still Schedule I.",
        year: "2012+",
        significance: "State-level reform leader",
      },
      {
        name: "Mexico",
        flag: "🇲🇽",
        status: "decriminalized",
        details: "Personal possession decriminalized. Medical cannabis legal. Working toward full recreational legalization.",
        year: "2021",
        significance: "Largest decriminalization in Latin America",
      },
    ],
  },
  {
    name: "South America",
    status: "mixed",
    summary: "Uruguay pioneered full legalization, others following with medical programs",
    countries: [
      {
        name: "Uruguay",
        flag: "🇺🇾",
        status: "legal-recreational",
        details: "First country in the world to fully legalize recreational cannabis in 2013. Government-regulated production and sales.",
        year: "2013",
        significance: "World's first legal country",
      },
      {
        name: "Colombia",
        flag: "🇨🇴",
        status: "legal-medical",
        details: "Medical cannabis legal with growing export industry. Personal possession decriminalized.",
        year: "2016",
        significance: "Major medical cannabis exporter",
      },
      {
        name: "Argentina",
        flag: "🇦🇷",
        status: "legal-medical",
        details: "Medical cannabis legal. Personal cultivation for medical use allowed.",
        year: "2020",
      },
    ],
  },
  {
    name: "Europe",
    status: "mixed",
    summary: "Varies widely from full legalization to strict prohibition",
    countries: [
      {
        name: "Netherlands",
        flag: "🇳🇱",
        status: "decriminalized",
        details: "Famous 'coffee shop' policy. Technically illegal but tolerated. Medical cannabis available.",
        year: "1976",
        significance: "Pioneered tolerance policy",
      },
      {
        name: "Germany",
        flag: "🇩🇪",
        status: "legal-recreational",
        details: "Legalized recreational cannabis in 2024. Medical program since 2017.",
        year: "2024",
        significance: "Largest European country to legalize",
      },
      {
        name: "Portugal",
        flag: "🇵🇹",
        status: "decriminalized",
        details: "All drugs decriminalized since 2001. Focus on treatment over punishment. Medical cannabis legal.",
        year: "2001",
        significance: "Revolutionary decriminalization model",
      },
      {
        name: "Spain",
        flag: "🇪🇸",
        status: "decriminalized",
        details: "Personal use and cultivation decriminalized. Cannabis clubs operate in legal grey area.",
        year: "2015",
      },
      {
        name: "Switzerland",
        flag: "🇨🇭",
        status: "legal-medical",
        details: "Medical cannabis legal. Pilot programs for recreational sales in several cities.",
        year: "2022",
      },
    ],
  },
  {
    name: "Asia",
    status: "illegal",
    summary: "Mostly illegal with few exceptions, though attitudes slowly changing",
    countries: [
      {
        name: "Thailand",
        flag: "🇹🇭",
        status: "legal-medical",
        details: "Decriminalized in 2022 after legalizing medical use. First Asian country to legalize medical cannabis.",
        year: "2022",
        significance: "First Asian country to decriminalize",
      },
      {
        name: "Israel",
        flag: "🇮🇱",
        status: "legal-medical",
        details: "World leader in cannabis research. Comprehensive medical program. Decriminalized for personal use.",
        year: "1990s",
        significance: "Global research leader",
      },
      {
        name: "Lebanon",
        flag: "🇱🇧",
        status: "legal-medical",
        details: "Legalized medical cultivation and export. Long history of cannabis cultivation.",
        year: "2020",
      },
    ],
  },
  {
    name: "Africa",
    status: "mixed",
    summary: "Emerging medical cannabis industry, personal use increasingly tolerated",
    countries: [
      {
        name: "South Africa",
        flag: "🇿🇦",
        status: "decriminalized",
        details: "Personal use and cultivation decriminalized by Constitutional Court in 2018. Growing medical industry.",
        year: "2018",
        significance: "First African country to decriminalize",
      },
      {
        name: "Lesotho",
        flag: "🇱🇸",
        status: "legal-medical",
        details: "First African country to legalize medical cannabis cultivation and export.",
        year: "2017",
        significance: "African medical cannabis pioneer",
      },
      {
        name: "Zimbabwe",
        flag: "🇿🇼",
        status: "legal-medical",
        details: "Medical cannabis and research licenses available.",
        year: "2018",
      },
    ],
  },
  {
    name: "Oceania",
    status: "mixed",
    summary: "Medical programs established, some decriminalization",
    countries: [
      {
        name: "Australia",
        flag: "🇦🇺",
        status: "legal-medical",
        details: "Medical cannabis legal nationwide. Australian Capital Territory decriminalized personal possession.",
        year: "2016",
      },
      {
        name: "New Zealand",
        flag: "🇳🇿",
        status: "legal-medical",
        details: "Medical cannabis legal. Personal possession decriminalized. Recreational referendum narrowly failed in 2020.",
        year: "2020",
      },
    ],
  },
];

const statusInfo = {
  "legal-recreational": {
    label: "Legal (Recreational)",
    color: "text-green-400 bg-green-500/20 border-green-500/30",
    icon: CheckCircle,
    description: "Full legalization for adult recreational use",
  },
  "legal-medical": {
    label: "Legal (Medical)",
    color: "text-blue-400 bg-blue-500/20 border-blue-500/30",
    icon: CheckCircle,
    description: "Legal for medical purposes with prescription",
  },
  "decriminalized": {
    label: "Decriminalized",
    color: "text-yellow-400 bg-yellow-500/20 border-yellow-500/30",
    icon: AlertCircle,
    description: "Personal use not criminally prosecuted",
  },
  "illegal": {
    label: "Illegal",
    color: "text-red-400 bg-red-500/20 border-red-500/30",
    icon: XCircle,
    description: "Prohibited with criminal penalties",
  },
  "mixed": {
    label: "Mixed Status",
    color: "text-purple-400 bg-purple-500/20 border-purple-500/30",
    icon: Info,
    description: "Status varies within the region",
  },
};

export function CannabisWorldMap() {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  const currentRegion = selectedRegion 
    ? worldRegions.find(r => r.name === selectedRegion)
    : null;

  return (
    <Card className="border-blue-500/20 bg-gradient-to-br from-background to-blue-500/5">
      <CardHeader>
        <CardTitle className="font-display flex items-center gap-2">
          <Globe className="h-5 w-5 text-blue-400" />
          Cannabis Around the World
        </CardTitle>
        <CardDescription>
          Explore global cannabis laws and how they vary across regions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Legend */}
        <Card className="border-white/10">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {Object.entries(statusInfo).map(([key, info]) => {
                const Icon = info.icon;
                return (
                  <div key={key} className="flex items-center gap-2">
                    <Badge variant="outline" className={cn("text-xs", info.color)}>
                      <Icon className="h-3 w-3 mr-1" />
                      {info.label.split(" ")[0]}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Region Selection */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {worldRegions.map((region) => {
            const statusData = statusInfo[region.status];
            const Icon = statusData.icon;
            return (
              <Button
                key={region.name}
                variant={selectedRegion === region.name ? "default" : "outline"}
                className={cn(
                  "h-auto py-4 flex flex-col items-start gap-2",
                  selectedRegion === region.name && "bg-blue-500/20 border-blue-500"
                )}
                onClick={() => setSelectedRegion(selectedRegion === region.name ? null : region.name)}
              >
                <div className="flex items-center gap-2 w-full">
                  <MapPin className="h-4 w-4" />
                  <span className="font-semibold text-sm">{region.name}</span>
                </div>
                <Badge variant="outline" className={cn("text-xs", statusData.color)}>
                  <Icon className="h-3 w-3 mr-1" />
                  {statusData.label}
                </Badge>
              </Button>
            );
          })}
        </div>

        {/* Region Details */}
        <AnimatePresence mode="wait">
          {currentRegion && (
            <motion.div
              key={currentRegion.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="border-blue-500/20">
                <CardHeader>
                  <CardTitle className="text-xl">{currentRegion.name}</CardTitle>
                  <CardDescription>{currentRegion.summary}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-4">
                      {currentRegion.countries.map((country, idx) => {
                        const statusData = statusInfo[country.status];
                        const Icon = statusData.icon;
                        return (
                          <motion.div
                            key={country.name}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                          >
                            <Card className="border-white/5">
                              <CardContent className="p-4">
                                <div className="space-y-3">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                      <span className="text-3xl">{country.flag}</span>
                                      <div>
                                        <h4 className="font-semibold text-lg">{country.name}</h4>
                                        {country.year && (
                                          <p className="text-xs text-muted-foreground">
                                            Since {country.year}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <Badge variant="outline" className={cn("shrink-0", statusData.color)}>
                                      <Icon className="h-3 w-3 mr-1" />
                                      {statusData.label}
                                    </Badge>
                                  </div>

                                  <p className="text-sm text-muted-foreground">
                                    {country.details}
                                  </p>

                                  {country.significance && (
                                    <div className="pt-2 border-t border-white/5">
                                      <p className="text-xs text-blue-300/80">
                                        <strong>Significance:</strong> {country.significance}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {!selectedRegion && (
          <Card className="border-white/5 bg-white/5">
            <CardContent className="p-6 text-center">
              <Globe className="h-12 w-12 text-blue-400 mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">
                Select a region above to explore cannabis laws around the world
              </p>
            </CardContent>
          </Card>
        )}

        {/* Global Statistics */}
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-display font-bold text-emerald-400">50+</div>
                <div className="text-xs text-muted-foreground">Countries with medical programs</div>
              </div>
              <div>
                <div className="text-2xl font-display font-bold text-green-400">3</div>
                <div className="text-xs text-muted-foreground">Fully legal countries</div>
              </div>
              <div>
                <div className="text-2xl font-display font-bold text-yellow-400">30+</div>
                <div className="text-xs text-muted-foreground">Decriminalized jurisdictions</div>
              </div>
              <div>
                <div className="text-2xl font-display font-bold text-blue-400">Ongoing</div>
                <div className="text-xs text-muted-foreground">Global reform movement</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
