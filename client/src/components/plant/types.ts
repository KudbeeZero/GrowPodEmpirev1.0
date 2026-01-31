/**
 * Type definitions for the dynamic plant rendering system
 */

// Growth stages matching smart contract
export type GrowthStage = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const STAGE_NAMES: Record<GrowthStage, string> = {
  0: 'empty',
  1: 'seedling',
  2: 'young',
  3: 'vegetative',
  4: 'flowering',
  5: 'harvest_ready',
  6: 'needs_cleanup',
};

// Strain types from seed genetics
export type StrainType = 'indica' | 'sativa' | 'hybrid';

// Plant health conditions
export type PlantCondition =
  | 'healthy'
  | 'needs_water'
  | 'overwatered'
  | 'nutrient_deficiency'
  | 'pest_infestation'
  | 'thriving';

// Terpene types for color mapping
export type TerpeneType =
  | 'myrcene'
  | 'limonene'
  | 'caryophyllene'
  | 'pinene'
  | 'linalool'
  | 'humulene';

// Rarity levels from seed NFTs
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

/**
 * Visual traits derived from seed genetics
 */
export interface PlantVisualTraits {
  strainType: StrainType;
  dominantTerpene: TerpeneType;
  thcPotential: number; // 0-100, affects trichome density
  growthModifier: number; // 0.8-1.5, affects size
  rarity: Rarity;
}

/**
 * Current plant state for rendering
 */
export interface PlantState {
  stage: GrowthStage;
  waterCount: number;
  nutrientCount: number;
  condition: PlantCondition;
  traits: PlantVisualTraits;
  // Progress within current stage (0-1)
  stageProgress: number;
}

/**
 * Point in 2D space
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Bezier curve control points
 */
export interface BezierCurve {
  start: Point;
  control1: Point;
  control2: Point;
  end: Point;
}

/**
 * Stem node for branching structure
 */
export interface StemNode {
  position: Point;
  thickness: number;
  angle: number;
  length: number;
  children: StemNode[];
}

/**
 * Leaf configuration
 */
export interface LeafConfig {
  position: Point;
  rotation: number;
  scale: number;
  fingerCount: number;
  fingerWidth: number;
  health: number; // 0-1, affects color/droop
  age: number; // affects size/color
}

/**
 * Bud/flower configuration
 */
export interface BudConfig {
  position: Point;
  size: number;
  density: number; // trichome coverage
  maturity: number; // 0-1
  pistilColor: string;
}

/**
 * Particle for effects
 */
export interface Particle {
  id: string;
  position: Point;
  velocity: Point;
  life: number; // 0-1, decreases over time
  maxLife: number;
  size: number;
  color: string;
  type: 'water' | 'sparkle' | 'nutrient' | 'pest' | 'celebration';
}

/**
 * Animation frame data
 */
export interface AnimationState {
  time: number;
  deltaTime: number;
  swayOffset: number;
  pulseScale: number;
  particles: Particle[];
}

/**
 * Render context with canvas and state
 */
export interface RenderContext {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  scale: number; // for retina displays
  plantState: PlantState;
  animState: AnimationState;
}

/**
 * Color palette for a plant
 */
export interface PlantColors {
  stem: string;
  stemDark: string;
  leafPrimary: string;
  leafSecondary: string;
  leafVein: string;
  budPrimary: string;
  budSecondary: string;
  pistil: string;
  trichome: string;
}

/**
 * Props for the PlantCanvas component
 */
export interface PlantCanvasProps {
  stage: GrowthStage;
  waterCount: number;
  nutrientCount: number;
  traits?: Partial<PlantVisualTraits>;
  condition?: PlantCondition;
  width?: number;
  height?: number;
  className?: string;
  onAction?: (action: 'water' | 'nutrient' | 'harvest') => void;
}
