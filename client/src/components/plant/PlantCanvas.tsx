/**
 * PlantCanvas - Main component for dynamic 2D plant rendering
 *
 * Renders procedurally generated plants based on growth stage and genetics.
 * Uses HTML5 Canvas for performant animations.
 */

import { useRef, useEffect, useCallback, useMemo } from 'react';
import type {
  PlantCanvasProps,
  PlantState,
  PlantVisualTraits,
  AnimationState,
  RenderContext,
  PlantCondition,
} from './types';
import { PlantRenderer } from './PlantRenderer';
import { generatePlantColors } from './utils/colors';

// Default traits for plants without seed genetics
const DEFAULT_TRAITS: PlantVisualTraits = {
  strainType: 'hybrid',
  dominantTerpene: 'myrcene',
  thcPotential: 50,
  growthModifier: 1.0,
  rarity: 'common',
};

/**
 * Determine plant condition based on game state
 */
function determineCondition(
  waterCount: number,
  nutrientCount: number,
  stage: number
): PlantCondition {
  if (stage === 0 || stage === 6) return 'healthy';

  // Calculate care ratio
  const expectedWaters = stage * 2;
  const waterRatio = waterCount / Math.max(expectedWaters, 1);
  const nutrientRatio = nutrientCount / Math.max(stage, 1);

  if (waterRatio >= 0.9 && nutrientRatio >= 0.8) return 'thriving';
  if (waterRatio < 0.5) return 'needs_water';
  if (nutrientRatio < 0.3 && stage > 2) return 'nutrient_deficiency';

  return 'healthy';
}

/**
 * Calculate stage progress (0-1) based on water count
 */
function calculateStageProgress(waterCount: number, stage: number): number {
  if (stage === 0 || stage >= 5) return 1;

  // Each stage needs ~2 waters to progress
  const watersInStage = waterCount - (stage - 1) * 2;
  return Math.min(1, Math.max(0, watersInStage / 2));
}

export function PlantCanvas({
  stage,
  waterCount,
  nutrientCount,
  traits: traitOverrides,
  condition: conditionOverride,
  width = 300,
  height = 400,
  className = '',
}: PlantCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const rendererRef = useRef<PlantRenderer | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Merge traits with defaults
  const traits = useMemo<PlantVisualTraits>(
    () => ({ ...DEFAULT_TRAITS, ...traitOverrides }),
    [traitOverrides]
  );

  // Generate colors from traits
  const colors = useMemo(() => generatePlantColors(traits), [traits]);

  // Determine condition
  const condition = conditionOverride || determineCondition(waterCount, nutrientCount, stage);

  // Build plant state
  const plantState = useMemo<PlantState>(
    () => ({
      stage: stage as PlantState['stage'],
      waterCount,
      nutrientCount,
      condition,
      traits,
      stageProgress: calculateStageProgress(waterCount, stage),
    }),
    [stage, waterCount, nutrientCount, condition, traits]
  );

  // Animation state
  const animState = useRef<AnimationState>({
    time: 0,
    deltaTime: 0,
    swayOffset: 0,
    pulseScale: 1,
    particles: [],
  });

  // Initialize renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle retina displays
    const scale = window.devicePixelRatio || 1;
    canvas.width = width * scale;
    canvas.height = height * scale;
    // Reset transform before scaling to prevent compounding on re-renders
    ctx.setTransform(scale, 0, 0, scale, 0, 0);

    // Create renderer
    rendererRef.current = new PlantRenderer(colors);

    return () => {
      rendererRef.current = null;
    };
  }, [width, height, colors]);

  // Animation loop
  const animate = useCallback(
    (timestamp: number) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      const renderer = rendererRef.current;

      if (!canvas || !ctx || !renderer) return;

      // Calculate delta time
      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      // Update animation state
      animState.current.time = timestamp / 1000;
      animState.current.deltaTime = deltaTime / 1000;
      animState.current.swayOffset = Math.sin(timestamp / 1000) * 0.5;

      // Create render context
      const renderContext: RenderContext = {
        canvas,
        ctx,
        width,
        height,
        scale: window.devicePixelRatio || 1,
        plantState,
        animState: animState.current,
      };

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Render plant
      renderer.render(renderContext);

      // Continue animation loop
      animationRef.current = requestAnimationFrame(animate);
    },
    [width, height, plantState]
  );

  // Start/stop animation
  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
      style={{
        width: `${width}px`,
        height: `${height}px`,
      }}
    />
  );
}

export default PlantCanvas;
