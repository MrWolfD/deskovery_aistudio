import React from 'react';
import { BoardElement } from '../../types/board';
import { generateSmoothSvgPath } from '../../utils/math';

interface DrawingItemProps {
  element: BoardElement;
  isSelected: boolean;
}

export const DrawingItem: React.FC<DrawingItemProps> = ({ element, isSelected }) => {
  if (!element.points || element.points.length === 0) return null;

  const d = generateSmoothSvgPath(element.points);
  const strokeColor = isSelected ? '#3b82f6' : (element.stroke || '#0f172a');
  const strokeWidth = element.strokeWidth || (element.isHighlighter ? 24 : 3);
  const opacity = element.isHighlighter ? 0.35 : (element.opacity || 1);

  return (
    <g className="cursor-pointer">
      {/* Hitbox */}
      <path
        d={d}
        fill="none"
        stroke="transparent"
        strokeWidth={Math.max(strokeWidth, 14)}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="pointer-events-stroke"
      />
      {/* Visible Path */}
      <path
        d={d}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={opacity}
        className="pointer-events-none"
      />
      {isSelected && (
        <path
          d={d}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={strokeWidth + 4}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.3}
          className="pointer-events-none"
        />
      )}
    </g>
  );
};
