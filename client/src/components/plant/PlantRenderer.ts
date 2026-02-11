/**
 * PlantRenderer - Core rendering logic for dynamic plants
 *
 * Handles all canvas drawing operations for plants at various growth stages.
 * Uses procedural generation based on plant genetics and state.
 */

import type {
  RenderContext,
  PlantColors,
  GrowthStage,
  LeafConfig,
  BudConfig,
  Point,
} from './types';
import {
  generateStemCurve,
  generateBranchCurve,
  drawTaperedBezier,
  evaluateBezier,
} from './utils/bezier';
import { perlin2, smoothSway, seededRandom } from './utils/noise';
import { adjustBrightness } from './utils/colors';

export class PlantRenderer {
  private colors: PlantColors;
  private seed: number;

  constructor(colors: PlantColors) {
    this.colors = colors;
    this.seed = Math.random() * 10000;
  }

  /**
   * Main render method - dispatches to stage-specific rendering
   */
  render(context: RenderContext): void {
    const { plantState } = context;

    // Draw pot/container first (always visible)
    this.renderPod(context);

    // Dispatch to stage-specific renderer
    switch (plantState.stage) {
      case 0:
        this.renderEmpty(context);
        break;
      case 1:
        this.renderSeedling(context);
        break;
      case 2:
        this.renderYoung(context);
        break;
      case 3:
        this.renderVegetative(context);
        break;
      case 4:
        this.renderFlowering(context);
        break;
      case 5:
        this.renderHarvestReady(context);
        break;
      case 6:
        this.renderCleanup(context);
        break;
    }
  }

  /**
   * Render the hydroponic pod container
   */
  private renderPod(context: RenderContext): void {
    const { ctx, width, height } = context;
    const podHeight = height * 0.2;
    const podY = height - podHeight;

    // Pod body gradient
    const gradient = ctx.createLinearGradient(0, podY, 0, height);
    gradient.addColorStop(0, '#2a2a2a');
    gradient.addColorStop(0.5, '#1a1a1a');
    gradient.addColorStop(1, '#0a0a0a');

    // Draw pod shape
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(width * 0.1, podY, width * 0.8, podHeight, [0, 0, 10, 10]);
    ctx.fill();

    // Pod rim
    ctx.fillStyle = '#3a3a3a';
    ctx.beginPath();
    ctx.roundRect(width * 0.08, podY - 5, width * 0.84, 15, 5);
    ctx.fill();

    // Growing medium (rockwool/clay pebbles)
    this.renderGrowingMedium(context, podY);

    // LED strip glow
    this.renderLEDGlow(context, podY);
  }

  /**
   * Render growing medium (rockwool cubes)
   */
  private renderGrowingMedium(context: RenderContext, podY: number): void {
    const { ctx, width } = context;

    // Rockwool cube
    ctx.fillStyle = '#4a4a3a';
    ctx.beginPath();
    ctx.roundRect(width * 0.35, podY - 20, width * 0.3, 25, 3);
    ctx.fill();

    // Rockwool texture
    ctx.strokeStyle = '#5a5a4a';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(width * 0.37, podY - 18 + i * 5);
      ctx.lineTo(width * 0.63, podY - 18 + i * 5);
      ctx.stroke();
    }
  }

  /**
   * Render LED strip glow effect
   */
  private renderLEDGlow(context: RenderContext, podY: number): void {
    const { ctx, width, animState } = context;

    // Pulsing glow
    const glowIntensity = 0.3 + Math.sin(animState.time * 2) * 0.1;

    const gradient = ctx.createRadialGradient(
      width / 2,
      podY - 30,
      0,
      width / 2,
      podY - 30,
      width * 0.4
    );
    gradient.addColorStop(0, `rgba(138, 43, 226, ${glowIntensity})`);
    gradient.addColorStop(0.5, `rgba(138, 43, 226, ${glowIntensity * 0.3})`);
    gradient.addColorStop(1, 'rgba(138, 43, 226, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, podY);
  }

  /**
   * Stage 0: Empty pod
   */
  private renderEmpty(context: RenderContext): void {
    const { ctx, width, height, animState } = context;

    // "Ready to plant" indicator
    const pulseAlpha = 0.3 + Math.sin(animState.time * 3) * 0.2;

    ctx.fillStyle = `rgba(76, 175, 80, ${pulseAlpha})`;
    ctx.beginPath();
    ctx.arc(width / 2, height * 0.5, 20, 0, Math.PI * 2);
    ctx.fill();

    // Plus sign
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 10, height * 0.5);
    ctx.lineTo(width / 2 + 10, height * 0.5);
    ctx.moveTo(width / 2, height * 0.5 - 10);
    ctx.lineTo(width / 2, height * 0.5 + 10);
    ctx.stroke();
  }

  /**
   * Stage 1: Seedling with cotyledons
   */
  private renderSeedling(context: RenderContext): void {
    const { ctx, width, height, animState, plantState } = context;

    const baseY = height * 0.78;
    const stemHeight = height * 0.12 * plantState.stageProgress;

    // Tiny stem
    const sway = smoothSway(animState.time, 0, 0.5) * 3;

    ctx.strokeStyle = this.colors.stem;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(width / 2, baseY);
    ctx.quadraticCurveTo(width / 2 + sway, baseY - stemHeight / 2, width / 2 + sway * 0.5, baseY - stemHeight);
    ctx.stroke();

    // Cotyledon leaves (round seed leaves)
    if (plantState.stageProgress > 0.3) {
      const leafY = baseY - stemHeight;
      const leafSize = 15 * Math.min(1, (plantState.stageProgress - 0.3) / 0.7);

      this.renderCotyledon(ctx, width / 2 - 5 + sway * 0.5, leafY, -30, leafSize);
      this.renderCotyledon(ctx, width / 2 + 5 + sway * 0.5, leafY, 30, leafSize);
    }
  }

  /**
   * Render a round cotyledon leaf
   */
  private renderCotyledon(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    angle: number,
    size: number
  ): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((angle * Math.PI) / 180);

    ctx.fillStyle = this.colors.leafPrimary;
    ctx.beginPath();
    ctx.ellipse(size / 2, 0, size, size / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Leaf vein
    ctx.strokeStyle = this.colors.leafVein;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(size, 0);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Stage 2: Young plant with first true leaves
   */
  private renderYoung(context: RenderContext): void {
    const { ctx, width, height, animState, plantState } = context;

    const baseY = height * 0.78;
    const stemHeight = height * 0.2;

    // Generate stem curve
    const stemCurve = generateStemCurve(
      { x: width / 2, y: baseY },
      stemHeight,
      0.05,
      this.seed
    );

    // Apply sway animation
    const sway = smoothSway(animState.time, 0, 0.8) * 5;
    stemCurve.end.x += sway;
    stemCurve.control2.x += sway * 0.7;

    // Draw stem
    drawTaperedBezier(ctx, stemCurve, 5, 3, this.colors.stem);

    // First pair of true leaves
    const topPoint = evaluateBezier(stemCurve, 0.9);
    const traits = plantState.traits;
    const isIndica = traits.strainType === 'indica';

    this.renderFanLeaf(ctx, topPoint.x - 10, topPoint.y, -45, 0.4, isIndica, animState.time);
    this.renderFanLeaf(ctx, topPoint.x + 10, topPoint.y, 45, 0.4, isIndica, animState.time);

    // Small leaves at lower node
    const midPoint = evaluateBezier(stemCurve, 0.5);
    this.renderFanLeaf(ctx, midPoint.x - 8, midPoint.y, -60, 0.25, isIndica, animState.time);
    this.renderFanLeaf(ctx, midPoint.x + 8, midPoint.y, 60, 0.25, isIndica, animState.time);
  }

  /**
   * Stage 3: Vegetative growth with multiple branches
   */
  private renderVegetative(context: RenderContext): void {
    const { ctx, width, height, animState, plantState } = context;

    const baseY = height * 0.78;
    const stemHeight = height * 0.35;
    const traits = plantState.traits;
    const isIndica = traits.strainType === 'indica';
    const isSativa = traits.strainType === 'sativa';

    // Adjust height based on strain
    const adjustedHeight = isSativa ? stemHeight * 1.2 : isIndica ? stemHeight * 0.85 : stemHeight;

    // Main stem
    const stemCurve = generateStemCurve(
      { x: width / 2, y: baseY },
      adjustedHeight,
      0.08,
      this.seed
    );

    const sway = smoothSway(animState.time, 0, 0.6) * 8;
    stemCurve.end.x += sway;
    stemCurve.control2.x += sway * 0.7;
    stemCurve.control1.x += sway * 0.3;

    drawTaperedBezier(ctx, stemCurve, 8, 4, this.colors.stem);

    // Multiple leaf nodes
    const nodePositions = [0.3, 0.5, 0.7, 0.9];
    nodePositions.forEach((t, i) => {
      const point = evaluateBezier(stemCurve, t);
      const leafScale = 0.3 + (1 - t) * 0.1 + t * 0.3;
      const angleBase = isIndica ? 50 : 70;

      this.renderFanLeaf(ctx, point.x - 10, point.y, -angleBase + i * 5, leafScale, isIndica, animState.time + i);
      this.renderFanLeaf(ctx, point.x + 10, point.y, angleBase - i * 5, leafScale, isIndica, animState.time + i);
    });

    // Small branches
    const branchPoints = [0.4, 0.6];
    branchPoints.forEach((t, i) => {
      const startPoint = evaluateBezier(stemCurve, t);
      const side = i % 2 === 0 ? -1 : 1;

      const branch = generateBranchCurve(
        startPoint,
        (side * Math.PI) / 3,
        width * 0.15,
        0.2
      );

      drawTaperedBezier(ctx, branch, 4, 2, this.colors.stem);

      // Leaf at branch end
      const branchEnd = evaluateBezier(branch, 1);
      this.renderFanLeaf(ctx, branchEnd.x, branchEnd.y, side * 30, 0.35, isIndica, animState.time + i);
    });
  }

  /**
   * Stage 4: Flowering with pre-buds
   */
  private renderFlowering(context: RenderContext): void {
    const { ctx, width, height, animState } = context;

    // Build on vegetative structure
    this.renderVegetative(context);

    const baseY = height * 0.78;
    const stemHeight = height * 0.35;

    // Add pre-flowers/buds at nodes
    const stemCurve = generateStemCurve(
      { x: width / 2, y: baseY },
      stemHeight,
      0.08,
      this.seed
    );

    const sway = smoothSway(animState.time, 0, 0.6) * 8;
    stemCurve.end.x += sway;

    // Bud sites
    const budPositions = [0.7, 0.85, 0.95];
    budPositions.forEach((t, i) => {
      const point = evaluateBezier(stemCurve, t);
      const budSize = 8 + i * 4;

      this.renderBud(ctx, point.x, point.y - 5, budSize, 0.3 + i * 0.2, animState.time);
    });

    // Pistil hairs at top
    const topPoint = evaluateBezier(stemCurve, 0.98);
    this.renderPistils(ctx, topPoint.x + sway, topPoint.y - 10, 12, animState.time);
  }

  /**
   * Stage 5: Harvest ready with full buds
   */
  private renderHarvestReady(context: RenderContext): void {
    const { ctx, width, height, animState, plantState } = context;

    const baseY = height * 0.78;
    const stemHeight = height * 0.4;
    const traits = plantState.traits;
    const isIndica = traits.strainType === 'indica';

    // Thick main stem
    const stemCurve = generateStemCurve(
      { x: width / 2, y: baseY },
      stemHeight,
      0.06,
      this.seed
    );

    const sway = smoothSway(animState.time, 0, 0.4) * 6;
    stemCurve.end.x += sway;
    stemCurve.control2.x += sway * 0.7;

    drawTaperedBezier(ctx, stemCurve, 10, 5, this.colors.stem);

    // Large cola at top
    const topPoint = evaluateBezier(stemCurve, 0.95);
    this.renderCola(ctx, topPoint.x + sway, topPoint.y - 20, 35, traits.thcPotential, animState.time);

    // Side buds
    const budNodes = [0.5, 0.65, 0.8];
    budNodes.forEach((t, i) => {
      const point = evaluateBezier(stemCurve, t);
      const side = i % 2 === 0 ? -1 : 1;

      // Branch to bud
      const branch = generateBranchCurve(
        point,
        (side * Math.PI) / 4,
        width * 0.12,
        0.15
      );
      drawTaperedBezier(ctx, branch, 5, 3, this.colors.stem);

      // Bud at end
      const branchEnd = evaluateBezier(branch, 1);
      this.renderCola(ctx, branchEnd.x, branchEnd.y, 18 + i * 3, traits.thcPotential, animState.time + i);
    });

    // Fan leaves (some yellowing at bottom)
    const leafNodes = [0.25, 0.4, 0.55];
    leafNodes.forEach((t, i) => {
      const point = evaluateBezier(stemCurve, t);
      const health = 0.5 + t * 0.5; // Lower leaves more yellow

      this.renderFanLeaf(ctx, point.x - 15, point.y, -55, 0.45, isIndica, animState.time + i, health);
      this.renderFanLeaf(ctx, point.x + 15, point.y, 55, 0.45, isIndica, animState.time + i, health);
    });

    // Golden harvest glow
    this.renderHarvestGlow(ctx, width / 2, height * 0.5, animState.time);

    // Trichome sparkles
    this.renderTrichomeSparkles(ctx, width, height, animState.time, traits.thcPotential);
  }

  /**
   * Stage 6: Needs cleanup (dead plant)
   */
  private renderCleanup(context: RenderContext): void {
    const { ctx, width, height, animState } = context;

    const baseY = height * 0.78;

    // Wilted, brown stem
    ctx.strokeStyle = '#5D4037';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(width / 2, baseY);
    ctx.quadraticCurveTo(width / 2 - 20, baseY - 40, width / 2 - 30, baseY - 20);
    ctx.stroke();

    // Dead leaves
    ctx.fillStyle = '#795548';
    for (let i = 0; i < 4; i++) {
      const x = width / 2 - 20 + seededRandom(this.seed + i) * 40;
      const y = baseY - 30 + seededRandom(this.seed + i + 10) * 20;

      ctx.beginPath();
      ctx.ellipse(x, y, 12, 6, seededRandom(this.seed + i) * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }

    // Debris particles
    ctx.fillStyle = '#4E342E';
    for (let i = 0; i < 8; i++) {
      const x = width * 0.3 + seededRandom(this.seed + i + 20) * width * 0.4;
      const y = baseY - 5 + seededRandom(this.seed + i + 30) * 10;
      ctx.beginPath();
      ctx.arc(x, y, 2 + seededRandom(this.seed + i) * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * Render a cannabis fan leaf
   */
  private renderFanLeaf(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    angle: number,
    scale: number,
    isIndica: boolean,
    time: number,
    health: number = 1
  ): void {
    ctx.save();
    ctx.translate(x, y);

    // Add sway animation
    const sway = smoothSway(time, x + y, 0.5) * 5;
    ctx.rotate(((angle + sway) * Math.PI) / 180);

    const fingerCount = isIndica ? 5 : 7;
    const fingerWidth = isIndica ? 0.35 : 0.2;
    const baseSize = 40 * scale;

    // Adjust color for health
    const leafColor = health < 1
      ? this.blendWithYellow(this.colors.leafPrimary, 1 - health)
      : this.colors.leafPrimary;

    ctx.fillStyle = leafColor;

    // Draw each finger
    for (let i = 0; i < fingerCount; i++) {
      const fingerAngle = ((i - (fingerCount - 1) / 2) / (fingerCount - 1)) * 70;
      const fingerLength = i === Math.floor(fingerCount / 2)
        ? baseSize
        : baseSize * (0.7 - Math.abs(i - (fingerCount - 1) / 2) * 0.08);

      ctx.save();
      ctx.rotate((fingerAngle * Math.PI) / 180);

      // Finger shape
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(
        fingerLength * fingerWidth,
        -fingerLength * 0.3,
        fingerLength * fingerWidth * 0.5,
        -fingerLength
      );
      ctx.quadraticCurveTo(
        0,
        -fingerLength * 1.05,
        -fingerLength * fingerWidth * 0.5,
        -fingerLength
      );
      ctx.quadraticCurveTo(
        -fingerLength * fingerWidth,
        -fingerLength * 0.3,
        0,
        0
      );
      ctx.fill();

      // Finger vein
      ctx.strokeStyle = this.colors.leafVein;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -fingerLength * 0.9);
      ctx.stroke();

      ctx.restore();
    }

    ctx.restore();
  }

  /**
   * Render a bud/flower
   */
  private renderBud(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    maturity: number,
    time: number
  ): void {
    // Calyx clusters
    const clusterCount = 3 + Math.floor(maturity * 4);
    ctx.fillStyle = this.colors.budPrimary;

    for (let i = 0; i < clusterCount; i++) {
      const angle = (i / clusterCount) * Math.PI * 2 + time * 0.1;
      const dist = size * 0.3 * seededRandom(this.seed + i);
      const cx = x + Math.cos(angle) * dist;
      const cy = y + Math.sin(angle) * dist * 0.5;
      const cSize = size * (0.3 + seededRandom(this.seed + i + 100) * 0.2);

      ctx.beginPath();
      ctx.ellipse(cx, cy, cSize, cSize * 1.3, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Pistils
    if (maturity > 0.3) {
      this.renderPistils(ctx, x, y - size * 0.3, size * 0.5, time);
    }
  }

  /**
   * Render a main cola (large bud cluster)
   */
  private renderCola(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    thcPotential: number,
    time: number
  ): void {
    // Build up layers of calyxes
    const layers = 5;
    for (let layer = 0; layer < layers; layer++) {
      const layerY = y + layer * (size / layers) * 0.8;
      const layerSize = size * (1 - layer * 0.15);

      ctx.fillStyle = adjustBrightness(this.colors.budPrimary, 1 - layer * 0.08);

      const calyxCount = 4 + layer;
      for (let i = 0; i < calyxCount; i++) {
        const angle = (i / calyxCount) * Math.PI * 2 + layer * 0.3;
        const dist = layerSize * 0.25;
        const cx = x + Math.cos(angle) * dist;
        const cy = layerY + Math.sin(angle) * dist * 0.4;

        ctx.beginPath();
        ctx.ellipse(cx, cy, layerSize * 0.25, layerSize * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Pistils at top
    this.renderPistils(ctx, x, y - size * 0.2, size * 0.4, time);

    // Trichome frost overlay
    if (thcPotential > 50) {
      const frostAlpha = (thcPotential - 50) / 100;
      ctx.fillStyle = `rgba(255, 255, 255, ${frostAlpha * 0.3})`;
      ctx.beginPath();
      ctx.ellipse(x, y + size * 0.3, size * 0.4, size * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * Render pistil hairs
   */
  private renderPistils(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    time: number
  ): void {
    ctx.strokeStyle = this.colors.pistil;
    ctx.lineWidth = 1.5;

    const count = 8;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI - Math.PI / 2;
      const length = size * (0.6 + seededRandom(this.seed + i + 200) * 0.4);
      const sway = smoothSway(time, i, 2) * 3;

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(
        x + Math.cos(angle + sway * 0.1) * length * 0.5,
        y + Math.sin(angle + sway * 0.1) * length * 0.5 - 5,
        x + Math.cos(angle) * length + sway,
        y + Math.sin(angle) * length - 3
      );
      ctx.stroke();
    }
  }

  /**
   * Render harvest-ready golden glow
   */
  private renderHarvestGlow(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    time: number
  ): void {
    const pulse = 0.3 + Math.sin(time * 2) * 0.1;

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, 150);
    gradient.addColorStop(0, `rgba(255, 215, 0, ${pulse})`);
    gradient.addColorStop(0.5, `rgba(255, 215, 0, ${pulse * 0.3})`);
    gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(x - 150, y - 150, 300, 300);
  }

  /**
   * Render trichome sparkle effect
   */
  private renderTrichomeSparkles(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number,
    thcPotential: number
  ): void {
    const sparkleCount = Math.floor(thcPotential / 10);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';

    for (let i = 0; i < sparkleCount; i++) {
      const phase = seededRandom(this.seed + i + 300);
      const sparkle = Math.sin(time * 5 + phase * Math.PI * 2);

      if (sparkle > 0.7) {
        const x = width * 0.3 + seededRandom(this.seed + i + 400) * width * 0.4;
        const y = height * 0.3 + seededRandom(this.seed + i + 500) * height * 0.4;
        const size = 2 + sparkle * 2;

        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  /**
   * Blend a color with yellow for wilting effect
   */
  private blendWithYellow(color: string, amount: number): string {
    const yellow = '#B8A800';
    const r1 = parseInt(color.slice(1, 3), 16);
    const g1 = parseInt(color.slice(3, 5), 16);
    const b1 = parseInt(color.slice(5, 7), 16);

    const r2 = parseInt(yellow.slice(1, 3), 16);
    const g2 = parseInt(yellow.slice(3, 5), 16);
    const b2 = parseInt(yellow.slice(5, 7), 16);

    const r = Math.round(r1 + (r2 - r1) * amount);
    const g = Math.round(g1 + (g2 - g1) * amount);
    const b = Math.round(b1 + (b2 - b1) * amount);

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
}
