/**
 * Bezier curve utilities for stem and branch generation
 */

import type { Point, BezierCurve } from '../types';

/**
 * Evaluate a cubic bezier curve at parameter t
 */
export function evaluateBezier(curve: BezierCurve, t: number): Point {
  const t2 = t * t;
  const t3 = t2 * t;
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;

  return {
    x:
      mt3 * curve.start.x +
      3 * mt2 * t * curve.control1.x +
      3 * mt * t2 * curve.control2.x +
      t3 * curve.end.x,
    y:
      mt3 * curve.start.y +
      3 * mt2 * t * curve.control1.y +
      3 * mt * t2 * curve.control2.y +
      t3 * curve.end.y,
  };
}

/**
 * Get tangent angle at point t on bezier curve
 */
export function getBezierTangent(curve: BezierCurve, t: number): number {
  const t2 = t * t;
  const mt = 1 - t;
  const mt2 = mt * mt;

  // First derivative
  const dx =
    3 * mt2 * (curve.control1.x - curve.start.x) +
    6 * mt * t * (curve.control2.x - curve.control1.x) +
    3 * t2 * (curve.end.x - curve.control2.x);

  const dy =
    3 * mt2 * (curve.control1.y - curve.start.y) +
    6 * mt * t * (curve.control2.y - curve.control1.y) +
    3 * t2 * (curve.end.y - curve.control2.y);

  return Math.atan2(dy, dx);
}

/**
 * Generate a stem curve with natural wobble
 */
export function generateStemCurve(
  start: Point,
  height: number,
  wobbleAmount: number = 0.1,
  seed: number = 0
): BezierCurve {
  // Seeded random for consistent variation
  const rand = (n: number) => {
    const x = Math.sin(seed * 12.9898 + n * 78.233) * 43758.5453;
    return (x - Math.floor(x)) * 2 - 1; // -1 to 1
  };

  const wobbleX1 = rand(1) * wobbleAmount * height;
  const wobbleX2 = rand(2) * wobbleAmount * height;

  return {
    start,
    control1: {
      x: start.x + wobbleX1,
      y: start.y - height * 0.33,
    },
    control2: {
      x: start.x + wobbleX2,
      y: start.y - height * 0.66,
    },
    end: {
      x: start.x + (wobbleX1 + wobbleX2) * 0.3,
      y: start.y - height,
    },
  };
}

/**
 * Generate a branch curve from a stem point
 */
export function generateBranchCurve(
  startPoint: Point,
  angle: number, // in radians
  length: number,
  curvature: number = 0.3
): BezierCurve {
  const endX = startPoint.x + Math.cos(angle) * length;
  const endY = startPoint.y + Math.sin(angle) * length;

  // Control points create a natural curve
  const midX = startPoint.x + Math.cos(angle) * length * 0.5;
  const midY = startPoint.y + Math.sin(angle) * length * 0.5;

  // Add upward curve (branches tend to reach up)
  const liftAmount = length * curvature;

  return {
    start: startPoint,
    control1: {
      x: midX,
      y: midY - liftAmount * 0.5,
    },
    control2: {
      x: midX + Math.cos(angle) * length * 0.25,
      y: midY - liftAmount,
    },
    end: {
      x: endX,
      y: endY - liftAmount * 0.8,
    },
  };
}

/**
 * Draw a bezier curve with variable thickness (tapered stem)
 */
export function drawTaperedBezier(
  ctx: CanvasRenderingContext2D,
  curve: BezierCurve,
  startThickness: number,
  endThickness: number,
  color: string,
  segments: number = 20
): void {
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';

  for (let i = 0; i < segments; i++) {
    const t1 = i / segments;
    const t2 = (i + 1) / segments;

    const p1 = evaluateBezier(curve, t1);
    const p2 = evaluateBezier(curve, t2);

    // Interpolate thickness
    const thickness = startThickness + (endThickness - startThickness) * t1;

    ctx.lineWidth = thickness;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }
}

/**
 * Get points along a bezier curve at regular intervals
 */
export function getBezierPoints(curve: BezierCurve, count: number): Point[] {
  const points: Point[] = [];
  for (let i = 0; i <= count; i++) {
    points.push(evaluateBezier(curve, i / count));
  }
  return points;
}

/**
 * Calculate the approximate length of a bezier curve
 */
export function getBezierLength(curve: BezierCurve, segments: number = 20): number {
  let length = 0;
  let prevPoint = curve.start;

  for (let i = 1; i <= segments; i++) {
    const point = evaluateBezier(curve, i / segments);
    const dx = point.x - prevPoint.x;
    const dy = point.y - prevPoint.y;
    length += Math.sqrt(dx * dx + dy * dy);
    prevPoint = point;
  }

  return length;
}

/**
 * Linear interpolation between two points
 */
export function lerpPoint(a: Point, b: Point, t: number): Point {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  };
}

/**
 * Distance between two points
 */
export function distance(a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Rotate a point around origin
 */
export function rotatePoint(point: Point, angle: number, origin: Point = { x: 0, y: 0 }): Point {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = point.x - origin.x;
  const dy = point.y - origin.y;

  return {
    x: origin.x + dx * cos - dy * sin,
    y: origin.y + dx * sin + dy * cos,
  };
}
