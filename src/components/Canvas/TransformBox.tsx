import React from 'react';

interface TransformBoxProps {
  x: number;
  y: number;
  width: number;
  height: number;
  elementType?: string;
  borderRadius?: number;
  zoom?: number;
  isResizing?: boolean;
  onResizeStart: (handle: string, e: React.MouseEvent) => void;
  onRotateStart?: (e: React.MouseEvent) => void;
}

export const TransformBox: React.FC<TransformBoxProps> = ({
  x,
  y,
  width,
  height,
  elementType,
  borderRadius,
  zoom = 1,
  isResizing = false,
  onResizeStart,
}) => {
  const isSticky = elementType === 'sticky';

  // For sticky notes, render only 4 corner handles (leaves edges free for connectors)
  // For shapes (rectangle, circle, etc.), render all 8 handles (corners + edges)
  const handles = isSticky
    ? [
        { name: 'nw', cursor: 'nwse-resize', cx: x, cy: y },
        { name: 'ne', cursor: 'nesw-resize', cx: x + width, cy: y },
        { name: 'se', cursor: 'nwse-resize', cx: x + width, cy: y + height },
        { name: 'sw', cursor: 'nesw-resize', cx: x, cy: y + height },
      ]
    : [
        { name: 'nw', cursor: 'nwse-resize', cx: x, cy: y },
        { name: 'n', cursor: 'ns-resize', cx: x + width / 2, cy: y },
        { name: 'ne', cursor: 'nesw-resize', cx: x + width, cy: y },
        { name: 'e', cursor: 'ew-resize', cx: x + width, cy: y + height / 2 },
        { name: 'se', cursor: 'nwse-resize', cx: x + width, cy: y + height },
        { name: 's', cursor: 'ns-resize', cx: x + width / 2, cy: y + height },
        { name: 'sw', cursor: 'nesw-resize', cx: x, cy: y + height },
        { name: 'w', cursor: 'ew-resize', cx: x, cy: y + height / 2 },
      ];

  const cornerRadius = borderRadius ?? (isSticky ? 8 : 4);
  const handleSize = 10;
  const hitAreaSize = 22;

  return (
    <g className="pointer-events-none select-none">
      {/* Crisp Solid Selection Bounding Box */}
      <rect
        x={x - 1}
        y={y - 1}
        width={width + 2}
        height={height + 2}
        fill="none"
        stroke="#2563eb"
        strokeWidth={1.5}
        rx={cornerRadius}
        ry={cornerRadius}
      />

      {/* Resize handles */}
      {handles.map((h) => (
        <g key={h.name} className="pointer-events-auto" style={{ cursor: h.cursor }}>
          {/* Extended invisible touch/hit target for effortless clicking */}
          <rect
            x={h.cx - hitAreaSize / 2}
            y={h.cy - hitAreaSize / 2}
            width={hitAreaSize}
            height={hitAreaSize}
            fill="transparent"
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onResizeStart(h.name, e);
            }}
          />

          {/* Visible handle rectangle */}
          <rect
            x={h.cx - handleSize / 2}
            y={h.cy - handleSize / 2}
            width={handleSize}
            height={handleSize}
            rx={2.5}
            ry={2.5}
            fill="#ffffff"
            stroke="#2563eb"
            strokeWidth={1.5}
            className="transition-transform hover:scale-125"
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onResizeStart(h.name, e);
            }}
          />
        </g>
      ))}

      {/* Live Dimension Badge while resizing */}
      {isResizing && (
        <g transform={`translate(${x + width / 2}, ${y + height + 16})`}>
          <rect
            x={-42}
            y={-12}
            width={84}
            height={22}
            rx={6}
            fill="#0f172a"
            opacity={0.88}
          />
          <text
            x={0}
            y={3}
            textAnchor="middle"
            fill="#ffffff"
            fontSize={11}
            fontWeight="600"
            fontFamily="sans-serif"
          >
            {Math.round(width)} × {Math.round(height)}
          </text>
        </g>
      )}
    </g>
  );
};

