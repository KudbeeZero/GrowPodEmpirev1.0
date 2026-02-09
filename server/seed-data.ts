// Default seed bank data - maps the seed library strains to database format
// These populate the seed_bank table on first server startup

import type { InsertSeedBankItem } from "@shared/schema";

// Helper to extract dominant terpene names from a profile
function dominantTerpenes(profile: Record<string, number>): string[] {
  return Object.entries(profile)
    .sort((a, b) => b[1] - a[1])
    .filter(([, v]) => v >= 0.3)
    .map(([name]) => name.charAt(0).toUpperCase() + name.slice(1));
}

// Map library rarity to database rarity
// Library: Common, Rare, Epic, Legendary
// DB: common, uncommon, rare, legendary, mythic
function mapRarity(rarity: string): string {
  switch (rarity) {
    case "Common": return "common";
    case "Rare": return "rare";
    case "Epic": return "legendary";
    case "Legendary": return "mythic";
    default: return "common";
  }
}

// Generate effects based on strain type
function getEffects(type: string): string[] {
  switch (type) {
    case "Sativa": return ["Energizing", "Creative", "Uplifting"];
    case "Indica": return ["Relaxing", "Sedating", "Pain Relief"];
    case "Hybrid": return ["Balanced", "Versatile", "Full-Body"];
    default: return ["Balanced"];
  }
}

// Generate flavor notes from dominant terpenes
function getFlavorNotes(profile: Record<string, number>): string[] {
  const flavors: Record<string, string[]> = {
    myrcene: ["Earthy", "Musky"],
    limonene: ["Citrus", "Lemon"],
    caryophyllene: ["Spicy", "Pepper"],
    pinene: ["Pine", "Woody"],
    linalool: ["Floral", "Lavender"],
    terpinolene: ["Herbal", "Fresh"],
  };

  const notes: string[] = [];
  Object.entries(profile)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .forEach(([terp]) => {
      if (flavors[terp]) {
        notes.push(flavors[terp][0]);
      }
    });
  return notes;
}

interface SeedDefinition {
  name: string;
  description: string;
  type: string;
  rarity: string;
  terpeneProfile: Record<string, number>;
  thc: number;
  cbd: number;
  yieldMultiplier: number;
  color: string;
}

const SEED_DEFINITIONS: SeedDefinition[] = [
  {
    name: "Purple Haze",
    description: "A legendary sativa with psychedelic purple hues and electric cerebral effects. Named after the iconic Hendrix classic.",
    type: "Sativa",
    rarity: "Rare",
    terpeneProfile: { myrcene: 0.3, limonene: 0.5, caryophyllene: 0.2, pinene: 0.4, linalool: 0.6, terpinolene: 0.8 },
    thc: 21, cbd: 0.5, yieldMultiplier: 1.4, color: "#9333ea",
  },
  {
    name: "Green Crack",
    description: "An energizing sativa with tangy mango flavor. Perfect for daytime focus and productivity.",
    type: "Sativa",
    rarity: "Common",
    terpeneProfile: { myrcene: 0.8, limonene: 0.6, caryophyllene: 0.3, pinene: 0.4, linalool: 0.1, terpinolene: 0.5 },
    thc: 18, cbd: 0.3, yieldMultiplier: 1.2, color: "#22c55e",
  },
  {
    name: "Northern Lights",
    description: "One of the most famous indicas of all time. Resinous buds with a pungently sweet aroma and cosmic relaxation.",
    type: "Indica",
    rarity: "Rare",
    terpeneProfile: { myrcene: 0.9, limonene: 0.2, caryophyllene: 0.4, pinene: 0.3, linalool: 0.7, terpinolene: 0.1 },
    thc: 22, cbd: 0.8, yieldMultiplier: 1.5, color: "#06b6d4",
  },
  {
    name: "OG Kush",
    description: "The backbone of West Coast cannabis. Complex fuel-forward aroma with powerful full-body effects.",
    type: "Hybrid",
    rarity: "Epic",
    terpeneProfile: { myrcene: 0.7, limonene: 0.8, caryophyllene: 0.6, pinene: 0.3, linalool: 0.5, terpinolene: 0.2 },
    thc: 25, cbd: 0.4, yieldMultiplier: 1.8, color: "#84cc16",
  },
  {
    name: "Blue Dream",
    description: "A balanced hybrid with sweet berry flavor. Gentle cerebral invigoration paired with full-body relaxation.",
    type: "Hybrid",
    rarity: "Common",
    terpeneProfile: { myrcene: 0.8, limonene: 0.4, caryophyllene: 0.3, pinene: 0.6, linalool: 0.3, terpinolene: 0.4 },
    thc: 19, cbd: 1.0, yieldMultiplier: 1.3, color: "#3b82f6",
  },
  {
    name: "Sour Diesel",
    description: "Fast-acting sativa with a pungent diesel aroma. Delivers energizing, dreamy cerebral effects.",
    type: "Sativa",
    rarity: "Rare",
    terpeneProfile: { myrcene: 0.4, limonene: 0.9, caryophyllene: 0.7, pinene: 0.3, linalool: 0.2, terpinolene: 0.3 },
    thc: 24, cbd: 0.2, yieldMultiplier: 1.6, color: "#eab308",
  },
  {
    name: "Granddaddy Purple",
    description: "A famous California indica with massive purple buds. Berry and grape aroma with deep physical relaxation.",
    type: "Indica",
    rarity: "Epic",
    terpeneProfile: { myrcene: 0.9, limonene: 0.3, caryophyllene: 0.2, pinene: 0.1, linalool: 0.8, terpinolene: 0.2 },
    thc: 23, cbd: 0.6, yieldMultiplier: 2.0, color: "#7c3aed",
  },
  {
    name: "Girl Scout Cookies",
    description: "A potent hybrid born in California. Bold mint and sweet cookie flavors with euphoric full-body effects.",
    type: "Hybrid",
    rarity: "Epic",
    terpeneProfile: { myrcene: 0.5, limonene: 0.6, caryophyllene: 0.8, pinene: 0.2, linalool: 0.7, terpinolene: 0.3 },
    thc: 26, cbd: 0.3, yieldMultiplier: 1.9, color: "#a16207",
  },
  {
    name: "Gorilla Glue",
    description: "Insanely sticky buds with pungent earthy and sour aromas. Heavy-handed euphoria glues you to the couch.",
    type: "Hybrid",
    rarity: "Rare",
    terpeneProfile: { myrcene: 0.6, limonene: 0.4, caryophyllene: 0.9, pinene: 0.5, linalool: 0.3, terpinolene: 0.2 },
    thc: 27, cbd: 0.4, yieldMultiplier: 1.7, color: "#65a30d",
  },
  {
    name: "Wedding Cake",
    description: "A decadent indica-leaning hybrid with rich vanilla frosting flavors. Award-winning potency and bag appeal.",
    type: "Indica",
    rarity: "Legendary",
    terpeneProfile: { myrcene: 0.6, limonene: 0.7, caryophyllene: 0.8, pinene: 0.2, linalool: 0.9, terpinolene: 0.1 },
    thc: 28, cbd: 0.5, yieldMultiplier: 2.5, color: "#ec4899",
  },
  {
    name: "White Widow",
    description: "A classic Dutch strain covered in white crystal resin. Balanced high with a burst of energy and creativity.",
    type: "Hybrid",
    rarity: "Common",
    terpeneProfile: { myrcene: 0.5, limonene: 0.3, caryophyllene: 0.4, pinene: 0.7, linalool: 0.3, terpinolene: 0.6 },
    thc: 20, cbd: 0.7, yieldMultiplier: 1.3, color: "#e5e7eb",
  },
  {
    name: "Quantum Kush",
    description: "An ultra-potent sativa reaching stratospheric THC levels. Mind-bending cerebral effects from another dimension.",
    type: "Sativa",
    rarity: "Legendary",
    terpeneProfile: { myrcene: 0.4, limonene: 0.8, caryophyllene: 0.5, pinene: 0.9, linalool: 0.3, terpinolene: 0.7 },
    thc: 33, cbd: 0.1, yieldMultiplier: 3.0, color: "#00ff94",
  },
];

/**
 * Convert seed definitions to database-ready insert objects.
 * Prices are 0 on TestNet so all seeds are free to acquire.
 */
export function getDefaultSeeds(): InsertSeedBankItem[] {
  return SEED_DEFINITIONS.map((def) => {
    const growthBonus = Math.round((def.yieldMultiplier - 1.0) * 100);

    return {
      name: def.name,
      description: def.description,
      rarity: mapRarity(def.rarity),
      terpeneProfile: dominantTerpenes(def.terpeneProfile),
      effects: getEffects(def.type),
      flavorNotes: getFlavorNotes(def.terpeneProfile),
      thcRange: `${def.thc}%`,
      cbdRange: `${def.cbd}%`,
      growthBonus,
      budPrice: "0", // Free on TestNet
      glowColor: def.color,
      totalSupply: null, // Unlimited on TestNet
      maxPerUser: 5,
      isActive: true,
    } as InsertSeedBankItem;
  });
}
