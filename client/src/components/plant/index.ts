/**
 * Dynamic Plant Rendering System
 *
 * Exports the main PlantCanvas component and supporting utilities
 * for procedurally generating cannabis plants in the game.
 */

// Main component
export { PlantCanvas, default } from './PlantCanvas';

// Core renderer
export { PlantRenderer } from './PlantRenderer';

// Types
export type {
  GrowthStage,
  StrainType,
  PlantCondition,
  TerpeneType,
  Rarity,
  PlantVisualTraits,
  PlantState,
  PlantCanvasProps,
  PlantColors,
  Point,
  BezierCurve,
  LeafConfig,
  BudConfig,
  Particle,
  AnimationState,
  RenderContext,
} from './types';

export { STAGE_NAMES } from './types';

// Utilities
export {
  generatePlantColors,
  blendColors,
  adjustBrightness,
  hexToRgba,
  getHealthAdjustedColors,
  TERPENE_COLORS,
  RARITY_COLORS,
} from './utils/colors';

export {
  perlin2,
  fbm,
  simpleNoise,
  smoothSway,
  seededRandom,
  getElementOffset,
} from './utils/noise';

export {
  evaluateBezier,
  getBezierTangent,
  generateStemCurve,
  generateBranchCurve,
  drawTaperedBezier,
  getBezierPoints,
  getBezierLength,
  lerpPoint,
  distance,
  rotatePoint,
} from './utils/bezier';
