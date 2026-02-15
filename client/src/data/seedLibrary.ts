export type StrainType = 'Sativa' | 'Indica' | 'Hybrid';
export type Rarity = 'Common' | 'Rare' | 'Epic' | 'Legendary';

export interface TerpeneProfile {
  myrcene: number;
  limonene: number;
  caryophyllene: number;
  pinene: number;
  linalool: number;
  terpinolene: number;
}

export interface GrowthTraits {
  speed: number;        // 1-10 (10 = fastest)
  resistance: number;   // 1-10 (10 = most resistant)
  yieldMultiplier: number; // 1.0 - 3.0x
}

export interface Strain {
  id: string;
  name: string;
  type: StrainType;
  rarity: Rarity;
  description: string;
  terpeneProfile: TerpeneProfile;
  growthTraits: GrowthTraits;
  thc: number;   // percentage
  cbd: number;   // percentage
  color: string; // hex color for UI theme
  price: number; // 0 = free on TestNet
}

export const RARITY_COLORS: Record<Rarity, string> = {
  Common: '#9ca3af',    // gray
  Rare: '#3b82f6',      // blue
  Epic: '#a855f7',      // purple
  Legendary: '#f59e0b', // gold
};

export const STRAIN_TYPE_COLORS: Record<StrainType, string> = {
  Sativa: '#22c55e',
  Indica: '#8b5cf6',
  Hybrid: '#f59e0b',
};

export const SEED_LIBRARY: Strain[] = [
  {
    id: 'purple-haze',
    name: 'Purple Haze',
    type: 'Sativa',
    rarity: 'Rare',
    description: 'A legendary sativa with psychedelic purple hues and electric cerebral effects. Named after the iconic Hendrix classic.',
    terpeneProfile: {
      myrcene: 0.3,
      limonene: 0.5,
      caryophyllene: 0.2,
      pinene: 0.4,
      linalool: 0.6,
      terpinolene: 0.8,
    },
    growthTraits: {
      speed: 6,
      resistance: 5,
      yieldMultiplier: 1.4,
    },
    thc: 21,
    cbd: 0.5,
    color: '#9333ea',
    price: 0,
  },
  {
    id: 'green-crack',
    name: 'Green Crack',
    type: 'Sativa',
    rarity: 'Common',
    description: 'An energizing sativa with tangy mango flavor. Perfect for daytime focus and productivity.',
    terpeneProfile: {
      myrcene: 0.8,
      limonene: 0.6,
      caryophyllene: 0.3,
      pinene: 0.4,
      linalool: 0.1,
      terpinolene: 0.5,
    },
    growthTraits: {
      speed: 8,
      resistance: 6,
      yieldMultiplier: 1.2,
    },
    thc: 18,
    cbd: 0.3,
    color: '#22c55e',
    price: 0,
  },
  {
    id: 'northern-lights',
    name: 'Northern Lights',
    type: 'Indica',
    rarity: 'Rare',
    description: 'One of the most famous indicas of all time. Resinous buds with a pungently sweet aroma and cosmic relaxation.',
    terpeneProfile: {
      myrcene: 0.9,
      limonene: 0.2,
      caryophyllene: 0.4,
      pinene: 0.3,
      linalool: 0.7,
      terpinolene: 0.1,
    },
    growthTraits: {
      speed: 7,
      resistance: 8,
      yieldMultiplier: 1.5,
    },
    thc: 22,
    cbd: 0.8,
    color: '#06b6d4',
    price: 0,
  },
  {
    id: 'og-kush',
    name: 'OG Kush',
    type: 'Hybrid',
    rarity: 'Epic',
    description: 'The backbone of West Coast cannabis. Complex fuel-forward aroma with powerful full-body effects.',
    terpeneProfile: {
      myrcene: 0.7,
      limonene: 0.8,
      caryophyllene: 0.6,
      pinene: 0.3,
      linalool: 0.5,
      terpinolene: 0.2,
    },
    growthTraits: {
      speed: 5,
      resistance: 6,
      yieldMultiplier: 1.8,
    },
    thc: 25,
    cbd: 0.4,
    color: '#84cc16',
    price: 0,
  },
  {
    id: 'blue-dream',
    name: 'Blue Dream',
    type: 'Hybrid',
    rarity: 'Common',
    description: 'A balanced hybrid with sweet berry flavor. Gentle cerebral invigoration paired with full-body relaxation.',
    terpeneProfile: {
      myrcene: 0.8,
      limonene: 0.4,
      caryophyllene: 0.3,
      pinene: 0.6,
      linalool: 0.3,
      terpinolene: 0.4,
    },
    growthTraits: {
      speed: 7,
      resistance: 7,
      yieldMultiplier: 1.3,
    },
    thc: 19,
    cbd: 1.0,
    color: '#3b82f6',
    price: 0,
  },
  {
    id: 'sour-diesel',
    name: 'Sour Diesel',
    type: 'Sativa',
    rarity: 'Rare',
    description: 'Fast-acting sativa with a pungent diesel aroma. Delivers energizing, dreamy cerebral effects.',
    terpeneProfile: {
      myrcene: 0.4,
      limonene: 0.9,
      caryophyllene: 0.7,
      pinene: 0.3,
      linalool: 0.2,
      terpinolene: 0.3,
    },
    growthTraits: {
      speed: 5,
      resistance: 4,
      yieldMultiplier: 1.6,
    },
    thc: 24,
    cbd: 0.2,
    color: '#eab308',
    price: 0,
  },
  {
    id: 'granddaddy-purple',
    name: 'Granddaddy Purple',
    type: 'Indica',
    rarity: 'Epic',
    description: 'A famous California indica with massive purple buds. Berry and grape aroma with deep physical relaxation.',
    terpeneProfile: {
      myrcene: 0.9,
      limonene: 0.3,
      caryophyllene: 0.2,
      pinene: 0.1,
      linalool: 0.8,
      terpinolene: 0.2,
    },
    growthTraits: {
      speed: 4,
      resistance: 7,
      yieldMultiplier: 2.0,
    },
    thc: 23,
    cbd: 0.6,
    color: '#7c3aed',
    price: 0,
  },
  {
    id: 'girl-scout-cookies',
    name: 'Girl Scout Cookies',
    type: 'Hybrid',
    rarity: 'Epic',
    description: 'A potent hybrid born in California. Bold mint and sweet cookie flavors with euphoric full-body effects.',
    terpeneProfile: {
      myrcene: 0.5,
      limonene: 0.6,
      caryophyllene: 0.8,
      pinene: 0.2,
      linalool: 0.7,
      terpinolene: 0.3,
    },
    growthTraits: {
      speed: 5,
      resistance: 6,
      yieldMultiplier: 1.9,
    },
    thc: 26,
    cbd: 0.3,
    color: '#a16207',
    price: 0,
  },
  {
    id: 'gorilla-glue',
    name: 'Gorilla Glue',
    type: 'Hybrid',
    rarity: 'Rare',
    description: 'Insanely sticky buds with pungent earthy and sour aromas. Heavy-handed euphoria glues you to the couch.',
    terpeneProfile: {
      myrcene: 0.6,
      limonene: 0.4,
      caryophyllene: 0.9,
      pinene: 0.5,
      linalool: 0.3,
      terpinolene: 0.2,
    },
    growthTraits: {
      speed: 6,
      resistance: 8,
      yieldMultiplier: 1.7,
    },
    thc: 27,
    cbd: 0.4,
    color: '#65a30d',
    price: 0,
  },
  {
    id: 'wedding-cake',
    name: 'Wedding Cake',
    type: 'Indica',
    rarity: 'Legendary',
    description: 'A decadent indica-leaning hybrid with rich vanilla frosting flavors. Award-winning potency and bag appeal.',
    terpeneProfile: {
      myrcene: 0.6,
      limonene: 0.7,
      caryophyllene: 0.8,
      pinene: 0.2,
      linalool: 0.9,
      terpinolene: 0.1,
    },
    growthTraits: {
      speed: 4,
      resistance: 5,
      yieldMultiplier: 2.5,
    },
    thc: 28,
    cbd: 0.5,
    color: '#ec4899',
    price: 0,
  },
  {
    id: 'white-widow',
    name: 'White Widow',
    type: 'Hybrid',
    rarity: 'Common',
    description: 'A classic Dutch strain covered in white crystal resin. Balanced high with a burst of energy and creativity.',
    terpeneProfile: {
      myrcene: 0.5,
      limonene: 0.3,
      caryophyllene: 0.4,
      pinene: 0.7,
      linalool: 0.3,
      terpinolene: 0.6,
    },
    growthTraits: {
      speed: 7,
      resistance: 9,
      yieldMultiplier: 1.3,
    },
    thc: 20,
    cbd: 0.7,
    color: '#e5e7eb',
    price: 0,
  },
  {
    id: 'quantum-kush',
    name: 'Quantum Kush',
    type: 'Sativa',
    rarity: 'Legendary',
    description: 'An ultra-potent sativa reaching stratospheric THC levels. Mind-bending cerebral effects from another dimension.',
    terpeneProfile: {
      myrcene: 0.4,
      limonene: 0.8,
      caryophyllene: 0.5,
      pinene: 0.9,
      linalool: 0.3,
      terpinolene: 0.7,
    },
    growthTraits: {
      speed: 3,
      resistance: 3,
      yieldMultiplier: 3.0,
    },
    thc: 33,
    cbd: 0.1,
    color: '#00ff94',
    price: 0,
  },
];

export function getStrainById(id: string): Strain | undefined {
  return SEED_LIBRARY.find(s => s.id === id);
}

export function getStrainsByType(type: StrainType): Strain[] {
  return SEED_LIBRARY.filter(s => s.type === type);
}

export function getStrainsByRarity(rarity: Rarity): Strain[] {
  return SEED_LIBRARY.filter(s => s.rarity === rarity);
}
