import { BoardElement, Point, ShapeType } from '../types/board';

export interface RecognizedShape {
  type: 'shape' | 'connector';
  shapeType?: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  startPoint?: Point;
  endPoint?: Point;
  confidence: number;
}

/**
 * Analyzes a sequence of freehand drawn points and detects whether
 * they represent a geometric shape (circle, rectangle, diamond, triangle, or straight arrow).
 */
export function recognizeDrawnShape(points: Point[]): RecognizedShape | null {
  if (!points || points.length < 8) return null;

  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let totalLength = 0;

  for (let i = 0; i < points.length; i++) {
    const pt = points[i];
    minX = Math.min(minX, pt.x);
    maxX = Math.max(maxX, pt.x);
    minY = Math.min(minY, pt.y);
    maxY = Math.max(maxY, pt.y);

    if (i > 0) {
      totalLength += Math.hypot(pt.x - points[i - 1].x, pt.y - points[i - 1].y);
    }
  }

  const width = maxX - minX;
  const height = maxY - minY;
  if (width < 25 || height < 25) return null;

  const first = points[0];
  const last = points[points.length - 1];
  const startEndDist = Math.hypot(first.x - last.x, first.y - last.y);
  const perimeter = (width + height) * 2;
  const isClosed = startEndDist < Math.max(width, height) * 0.35 || startEndDist < 45;

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;

  // 1. Check for Circle / Ellipse
  if (isClosed) {
    const rx = width / 2;
    const ry = height / 2;

    let radialErrorSum = 0;
    for (const pt of points) {
      const dx = (pt.x - cx) / rx;
      const dy = (pt.y - cy) / ry;
      const normalizedDist = Math.hypot(dx, dy);
      radialErrorSum += Math.abs(normalizedDist - 1);
    }
    const avgRadialError = radialErrorSum / points.length;

    if (avgRadialError < 0.22) {
      return {
        type: 'shape',
        shapeType: 'circle',
        x: minX,
        y: minY,
        width,
        height,
        confidence: Math.max(0.7, 1 - avgRadialError),
      };
    }

    // 2. Check for Diamond (points near 4 edge midpoints)
    const midTop = { x: cx, y: minY };
    const midRight = { x: maxX, y: cy };
    const midBottom = { x: cx, y: maxY };
    const midLeft = { x: minX, y: cy };

    let diamondDistSum = 0;
    for (const pt of points) {
      const d1 = Math.abs(pt.x - cx) / rx + Math.abs(pt.y - cy) / ry;
      diamondDistSum += Math.abs(d1 - 1);
    }
    const avgDiamondError = diamondDistSum / points.length;
    if (avgDiamondError < 0.22) {
      return {
        type: 'shape',
        shapeType: 'diamond',
        x: minX,
        y: minY,
        width,
        height,
        confidence: Math.max(0.7, 1 - avgDiamondError),
      };
    }

    // 3. Check for Rectangle
    let cornerCount = 0;
    for (const pt of points) {
      const nearLeft = Math.abs(pt.x - minX) < width * 0.18;
      const nearRight = Math.abs(pt.x - maxX) < width * 0.18;
      const nearTop = Math.abs(pt.y - minY) < height * 0.18;
      const nearBottom = Math.abs(pt.y - maxY) < height * 0.18;
      if ((nearLeft || nearRight) && (nearTop || nearBottom)) {
        cornerCount++;
      }
    }

    if (cornerCount > points.length * 0.12) {
      return {
        type: 'shape',
        shapeType: 'rectangle',
        x: minX,
        y: minY,
        width,
        height,
        confidence: 0.8,
      };
    }

    // Fallback closed shape: rounded rectangle
    return {
      type: 'shape',
      shapeType: 'rounded',
      x: minX,
      y: minY,
      width,
      height,
      confidence: 0.7,
    };
  }

  // 4. Open path: Check for straight line or arrow
  const directDist = Math.hypot(last.x - first.x, last.y - first.y);
  if (directDist > 60 && totalLength / directDist < 1.35) {
    return {
      type: 'connector',
      x: Math.min(first.x, last.x),
      y: Math.min(first.y, last.y),
      width: Math.abs(first.x - last.x) || 10,
      height: Math.abs(first.y - last.y) || 10,
      startPoint: first,
      endPoint: last,
      confidence: 0.85,
    };
  }

  return null;
}
