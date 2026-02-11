/**
 * GrowPod Empire NFT Schemas
 *
 * Uses ARC-19 (mutable metadata via reserve address) for dynamic NFTs
 * All NFTs follow ARC-69 metadata standard for on-chain properties
 */

// ============================================
// SEED NFT - The starting genetics
// ============================================
export interface SeedNFTMetadata {
  standard: 'arc69';
  name: string;  // e.g., "GrowPod Seed: Purple Haze #12345"
  description: string;
  image: string; // IPFS hash for seed image
  properties: SeedProperties;
}

export interface SeedProperties {
  // Strain Information
  strain: string;           // e.g., "Purple Haze"
  strain_type: 'indica' | 'sativa' | 'hybrid';

  // Lineage (for bred seeds)
  lineage: {
    parent1_asa_id: number | null;  // null for "OG" seeds
    parent2_asa_id: number | null;
    generation: number;             // 0 = original, 1+ = bred
  };

  // Terpene Profile (percentages, must sum to 100)
  terpene_profile: {
    myrcene: number;
    limonene: number;
    caryophyllene: number;
    pinene: number;
    linalool: number;
    humulene: number;
    terpinolene: number;
    ocimene: number;
  };
  terpene_dominant: string;  // Highest terpene

  // Potency Potential (can vary in final biomass)
  thc_potential: number;     // 0-35 percentage
  cbd_potential: number;     // 0-25 percentage

  // Growth Characteristics
  growth_modifier: number;   // 1.0 = base, 1.1 = +10% yield bonus
  flowering_time_modifier: number; // 1.0 = normal, 0.9 = 10% faster

  // Rarity & Value
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

  // Metadata
  created_at: number;        // Unix timestamp
  created_by: string;        // Wallet address of creator/breeder
  seed_bank_origin: boolean; // true if from official seed bank, false if bred
}

// ============================================
// BIOMASS NFT - The harvested product
// ============================================
export interface BiomassNFTMetadata {
  standard: 'arc69';
  name: string;  // e.g., "Purple Haze Flower #67890"
  description: string;
  image: string; // IPFS hash for biomass image (based on quality)
  properties: BiomassProperties;
}

export interface BiomassProperties {
  // Origin
  seed_asa_id: number;       // Reference to original seed NFT
  strain: string;            // Inherited from seed
  strain_type: 'indica' | 'sativa' | 'hybrid';

  // THE VALUE - Weight in milligrams (1g = 1,000,000 $BUD)
  weight_mg: number;         // e.g., 2500000 = 2.5g = 2,500,000 $BUD

  // Quality (affects value perception, not $BUD amount)
  quality_grade: 'D' | 'C' | 'B' | 'A' | 'A+' | 'S';

  // Inherited & Final Terpene Profile
  terpene_profile: {
    myrcene: number;
    limonene: number;
    caryophyllene: number;
    pinene: number;
    linalool: number;
    humulene: number;
    terpinolene: number;
    ocimene: number;
  };
  terpene_dominant: string;

  // Actual potency (varies slightly from seed potential)
  thc_actual: number;
  cbd_actual: number;

  // Growth History
  harvest_date: number;      // Unix timestamp
  grower: string;            // Wallet address
  water_count: number;       // Care stats
  nutrient_count: number;
  growth_days: number;       // Days from plant to harvest

  // Cure Status (dynamic - changes in Cure Vault)
  cure_status: 'fresh' | 'curing' | 'cured';
  cure_start_date: number | null;
  cure_days: number;
  cure_bonus_percent: number; // 0-25%, increases while in vault

  // Rarity inherited from seed
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate base weight from care quality
 * Base: 2.0g with perfect care
 * Range: 0.5g (neglected) to 3.5g (perfect + bonuses)
 */
export function calculateBiomassWeight(
  waterCount: number,
  nutrientCount: number,
  seedGrowthModifier: number = 1.0
): number {
  const BASE_WEIGHT_MG = 2000000; // 2.0g base
  const MIN_WEIGHT_MG = 500000;   // 0.5g minimum
  const MAX_WEIGHT_MG = 3500000;  // 3.5g maximum

  // Water bonus: 10 waters = base, each extra +2% up to +20%
  const waterBonus = Math.min(0.2, Math.max(0, (waterCount - 10) * 0.02));

  // Nutrient bonus: each nutrient adds +3% up to +30%
  const nutrientBonus = Math.min(0.3, nutrientCount * 0.03);

  // Penalty for under-watering (less than 10 waters)
  const waterPenalty = waterCount < 10 ? (10 - waterCount) * 0.05 : 0;

  // Calculate final weight
  let weight = BASE_WEIGHT_MG * (1 + waterBonus + nutrientBonus - waterPenalty);

  // Apply seed's growth modifier
  weight *= seedGrowthModifier;

  // Clamp to min/max
  return Math.max(MIN_WEIGHT_MG, Math.min(MAX_WEIGHT_MG, Math.round(weight)));
}

/**
 * Calculate quality grade based on care
 */
export function calculateQualityGrade(
  waterCount: number,
  nutrientCount: number
): BiomassProperties['quality_grade'] {
  const score = waterCount + (nutrientCount * 1.5);

  if (score >= 25) return 'S';
  if (score >= 20) return 'A+';
  if (score >= 16) return 'A';
  if (score >= 12) return 'B';
  if (score >= 8) return 'C';
  return 'D';
}

/**
 * Calculate cure bonus based on days in vault
 * Max 25% bonus after 30 days
 */
export function calculateCureBonus(cureDays: number): number {
  const MAX_BONUS = 25;
  const DAYS_FOR_MAX = 30;

  return Math.min(MAX_BONUS, Math.round((cureDays / DAYS_FOR_MAX) * MAX_BONUS));
}

/**
 * Calculate final $BUD value from biomass
 * Weight in mg = $BUD tokens (with 6 decimals)
 * Plus cure bonus if cured
 */
export function calculateBudValue(
  weightMg: number,
  cureBonusPercent: number = 0
): bigint {
  const baseValue = BigInt(weightMg);
  const bonus = baseValue * BigInt(cureBonusPercent) / BigInt(100);
  return baseValue + bonus;
}

/**
 * Rarity weights for random seed generation
 */
export const RARITY_WEIGHTS = {
  common: 50,
  uncommon: 30,
  rare: 15,
  epic: 4,
  legendary: 1,
};

/**
 * Growth modifier by rarity
 */
export const RARITY_GROWTH_MODIFIERS = {
  common: 1.0,
  uncommon: 1.05,
  rare: 1.10,
  epic: 1.20,
  legendary: 1.35,
};

/**
 * Available strains in the seed bank
 */
export const STRAIN_CATALOG = [
  { name: 'Purple Haze', type: 'sativa', dominant: 'myrcene' },
  { name: 'OG Kush', type: 'hybrid', dominant: 'limonene' },
  { name: 'Blue Dream', type: 'hybrid', dominant: 'myrcene' },
  { name: 'Granddaddy Purple', type: 'indica', dominant: 'linalool' },
  { name: 'Sour Diesel', type: 'sativa', dominant: 'caryophyllene' },
  { name: 'Girl Scout Cookies', type: 'hybrid', dominant: 'caryophyllene' },
  { name: 'Jack Herer', type: 'sativa', dominant: 'pinene' },
  { name: 'Northern Lights', type: 'indica', dominant: 'myrcene' },
  { name: 'White Widow', type: 'hybrid', dominant: 'pinene' },
  { name: 'Gelato', type: 'hybrid', dominant: 'limonene' },
] as const;

export type StrainName = typeof STRAIN_CATALOG[number]['name'];
