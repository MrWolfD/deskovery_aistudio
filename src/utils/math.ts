import { AnchorPosition, BoardElement, ConnectorLineType, Point, Viewport } from '../types/board';

export function screenToCanvas(
  screenX: number,
  screenY: number,
  viewport: Viewport,
  canvasRect: DOMRect
): Point {
  const relX = screenX - canvasRect.left;
  const relY = screenY - canvasRect.top;
  return {
    x: (relX - viewport.x) / viewport.zoom,
    y: (relY - viewport.y) / viewport.zoom,
  };
}

export function canvasToScreen(
  canvasX: number,
  canvasY: number,
  viewport: Viewport,
  canvasRect: DOMRect
): Point {
  return {
    x: canvasX * viewport.zoom + viewport.x + canvasRect.left,
    y: canvasY * viewport.zoom + viewport.y + canvasRect.top,
  };
}

export function getElementAnchorPoint(
  element: BoardElement,
  anchor: AnchorPosition
): Point {
  const { x, y, width, height } = element;
  switch (anchor) {
    case 'top':
      return { x: x + width / 2, y };
    case 'right':
      return { x: x + width, y: y + height / 2 };
    case 'bottom':
      return { x: x + width / 2, y: y + height };
    case 'left':
      return { x, y: y + height / 2 };
  }
}

export function getClosestAnchor(
  element: BoardElement,
  point: Point
): { anchor: AnchorPosition; point: Point; distance: number } {
  const anchors: AnchorPosition[] = ['top', 'right', 'bottom', 'left'];
  let closestAnchor: AnchorPosition = 'top';
  let minDistance = Infinity;
  let closestPoint: Point = { x: 0, y: 0 };

  for (const anchor of anchors) {
    const p = getElementAnchorPoint(element, anchor);
    const dist = Math.hypot(p.x - point.x, p.y - point.y);
    if (dist < minDistance) {
      minDistance = dist;
      closestAnchor = anchor;
      closestPoint = p;
    }
  }

  return { anchor: closestAnchor, point: closestPoint, distance: minDistance };
}

export function generateConnectorPath(
  p1: Point,
  p2: Point,
  lineType: ConnectorLineType = 'curved',
  fromAnchor?: AnchorPosition,
  toAnchor?: AnchorPosition
): string {
  if (lineType === 'straight') {
    return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`;
  }

  if (lineType === 'orthogonal') {
    // Determine intermediate corner points
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;

    if (fromAnchor === 'right' || fromAnchor === 'left') {
      const midX = p1.x + dx / 2;
      return `M ${p1.x} ${p1.y} L ${midX} ${p1.y} L ${midX} ${p2.y} L ${p2.x} ${p2.y}`;
    } else if (fromAnchor === 'top' || fromAnchor === 'bottom') {
      const midY = p1.y + dy / 2;
      return `M ${p1.x} ${p1.y} L ${p1.x} ${midY} L ${p2.x} ${midY} L ${p2.x} ${p2.y}`;
    }

    const midX = p1.x + dx / 2;
    return `M ${p1.x} ${p1.y} L ${midX} ${p1.y} L ${midX} ${p2.y} L ${p2.x} ${p2.y}`;
  }

  // Curved Bezier
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dist = Math.hypot(dx, dy);
  const curvature = Math.min(Math.max(dist * 0.4, 40), 160);

  let cp1 = { x: p1.x, y: p1.y };
  let cp2 = { x: p2.x, y: p2.y };

  if (fromAnchor === 'right') cp1.x += curvature;
  else if (fromAnchor === 'left') cp1.x -= curvature;
  else if (fromAnchor === 'bottom') cp1.y += curvature;
  else if (fromAnchor === 'top') cp1.y -= curvature;
  else cp1.x += curvature;

  if (toAnchor === 'right') cp2.x += curvature;
  else if (toAnchor === 'left') cp2.x -= curvature;
  else if (toAnchor === 'bottom') cp2.y += curvature;
  else if (toAnchor === 'top') cp2.y -= curvature;
  else cp2.x -= curvature;

  return `M ${p1.x} ${p1.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${p2.x} ${p2.y}`;
}

export function generateSmoothSvgPath(points: Point[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y} L ${points[0].x + 0.1} ${points[0].y + 0.1}`;

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const xc = (points[i].x + points[i + 1].x) / 2;
    const yc = (points[i].y + points[i + 1].y) / 2;
    path += ` Q ${points[i].x} ${points[i].y}, ${xc} ${yc}`;
  }
  const last = points[points.length - 1];
  path += ` L ${last.x} ${last.y}`;
  return path;
}

export function isPointInElement(point: Point, element: BoardElement): boolean {
  if (element.type === 'connector' || element.type === 'drawing') {
    return false; // Handled separately if needed
  }
  return (
    point.x >= element.x &&
    point.x <= element.x + element.width &&
    point.y >= element.y &&
    point.y <= element.y + element.height
  );
}

export function isElementInMarquee(
  element: BoardElement,
  marquee: { x1: number; y1: number; x2: number; y2: number }
): boolean {
  const minX = Math.min(marquee.x1, marquee.x2);
  const maxX = Math.max(marquee.x1, marquee.x2);
  const minY = Math.min(marquee.y1, marquee.y2);
  const maxY = Math.max(marquee.y1, marquee.y2);

  return (
    element.x + element.width >= minX &&
    element.x <= maxX &&
    element.y + element.height >= minY &&
    element.y <= maxY
  );
}

export function getBoardBounds(elements: BoardElement[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
} {
  if (elements.length === 0) {
    return { minX: 0, minY: 0, maxX: 1200, maxY: 800, width: 1200, height: 800 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const el of elements) {
    if (el.type === 'connector') {
      const p1 = el.startPoint || { x: el.x, y: el.y };
      const p2 = el.endPoint || { x: el.x + el.width, y: el.y + el.height };
      minX = Math.min(minX, p1.x, p2.x);
      minY = Math.min(minY, p1.y, p2.y);
      maxX = Math.max(maxX, p1.x, p2.x);
      maxY = Math.max(maxY, p1.y, p2.y);
    } else if (el.type === 'drawing' && el.points && el.points.length > 0) {
      for (const pt of el.points) {
        minX = Math.min(minX, pt.x);
        minY = Math.min(minY, pt.y);
        maxX = Math.max(maxX, pt.x);
        maxY = Math.max(maxY, pt.y);
      }
    } else {
      minX = Math.min(minX, el.x);
      minY = Math.min(minY, el.y);
      maxX = Math.max(maxX, el.x + el.width);
      maxY = Math.max(maxY, el.y + el.height);
    }
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: Math.max(maxX - minX, 100),
    height: Math.max(maxY - minY, 100),
  };
}
