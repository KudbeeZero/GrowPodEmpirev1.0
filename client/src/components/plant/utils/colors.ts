/**
 * Color utilities for plant rendering
 * Maps genetics/terpenes to visual color palettes
 */

import type { TerpeneType, PlantColors, PlantVisualTraits, Rarity } from '../types';

/**
 * Terpene-based color accents
 */
export const TERPENE_COLORS: Record<TerpeneType, { primary: string; accent: string }> = {
  myrcene: { primary: '#2E7D32', accent: '#81C784' },      // Earthy green
  limonene: { primary: '#F9A825', accent: '#FFF176' },     // Citrus yellow
  caryophyllene: { primary: '#6D4C41', accent: '#A1887F' }, // Spicy brown
  pinene: { primary: '#1B5E20', accent: '#4CAF50' },       // Forest green
  linalool: { primary: '#7B1FA2', accent: '#CE93D8' },     // Lavender purple
  humulene: { primary: '#795548', accent: '#BCAAA4' },     // Woody tan
};

/**
 * Rarity glow colors
 */
export const RARITY_COLORS: Record<Rarity, { glow: string; intensity: number }> = {
  common: { glow: '#9E9E9E', intensity: 0 },
  uncommon: { glow: '#4CAF50', intensity: 0.3 },
  rare: { glow: '#2196F3', intensity: 0.5 },
  epic: { glow: '#9C27B0', intensity: 0.7 },
  legendary: { glow: '#FFD700', intensity: 1.0 },
};

/**
 * Base plant colors (healthy state)
 */
const BASE_COLORS = {
  stem: '#3E6B31',
  stemDark: '#2D4E24',
  leafPrimary: '#4CAF50',
  leafSecondary: '#81C784',
  leafVein: '#2E7D32',
  budPrimary: '#8BC34A',
  budSecondary: '#AED581',
  pistil: '#FFFFFF',
  trichome: '#E8F5E9',
};

/**
 * Generate plant color palette based on genetics
 */
export function generatePlantColors(traits: PlantVisualTraits): PlantColors {
  const terpeneColor = TERPENE_COLORS[traits.dominantTerpene];

  // Blend base colors with terpene accent
  return {
    stem: blendColors(BASE_COLORS.stem, terpeneColor.primary, 0.2),
    stemDark: blendColors(BASE_COLORS.stemDark, terpeneColor.primary, 0.15),
    leafPrimary: blendColors(BASE_COLORS.leafPrimary, terpeneColor.primary, 0.3),
    leafSecondary: blendColors(BASE_COLORS.leafSecondary, terpeneColor.accent, 0.25),
    leafVein: blendColors(BASE_COLORS.leafVein, terpeneColor.primary, 0.2),
    budPrimary: blendColors(BASE_COLORS.budPrimary, terpeneColor.accent, 0.35),
    budSecondary: blendColors(BASE_COLORS.budSecondary, terpeneColor.accent, 0.3),
    pistil: traits.thcPotential > 80 ? '#FF9800' : '#FFFFFF',
    trichome: `rgba(255, 255, 255, ${0.5 + traits.thcPotential * 0.005})`,
  };
}

/**
 * Blend two hex colors
 */
export function blendColors(color1: string, color2: string, ratio: number): string {
  const r1 = parseInt(color1.slice(1, 3), 16);
  const g1 = parseInt(color1.slice(3, 5), 16);
  const b1 = parseInt(color1.slice(5, 7), 16);

  const r2 = parseInt(color2.slice(1, 3), 16);
  const g2 = parseInt(color2.slice(3, 5), 16);
  const b2 = parseInt(color2.slice(5, 7), 16);

  const r = Math.round(r1 + (r2 - r1) * ratio);
  const g = Math.round(g1 + (g2 - g1) * ratio);
  const b = Math.round(b1 + (b2 - b1) * ratio);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Adjust color brightness
 */
export function adjustBrightness(color: string, factor: number): string {
  const r = Math.min(255, Math.max(0, Math.round(parseInt(color.slice(1, 3), 16) * factor)));
  const g = Math.min(255, Math.max(0, Math.round(parseInt(color.slice(3, 5), 16) * factor)));
  const b = Math.min(255, Math.max(0, Math.round(parseInt(color.slice(5, 7), 16) * factor)));

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Convert hex to rgba
 */
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Get health-adjusted colors (for wilting, deficiency, etc.)
 */
export function getHealthAdjustedColors(
  colors: PlantColors,
  health: number // 0-1, 1 = healthy
): PlantColors {
  if (health >= 0.9) return colors;

  // Yellow/brown shift for unhealthy plants
  const yellowShift = '#A5A52A';
  const brownShift = '#8B4513';

  const blendAmount = 1 - health;

  return {
    ...colors,
    leafPrimary: blendColors(colors.leafPrimary, yellowShift, blendAmount * 0.5),
    leafSecondary: blendColors(colors.leafSecondary, yellowShift, blendAmount * 0.4),
    budPrimary: blendColors(colors.budPrimary, brownShift, blendAmount * 0.3),
  };
}
