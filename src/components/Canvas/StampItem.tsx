import React from 'react';
import { BoardElement } from '../../types/board';

interface StampItemProps {
  element: BoardElement;
  isSelected: boolean;
}

export const StampItem: React.FC<StampItemProps> = ({ element }) => {
  const fontSize = Math.max(20, Math.round(Math.min(element.width, element.height) * 0.65));

  return (
    <div className="w-full h-full flex items-center justify-center select-none overflow-hidden">
      <span
        style={{ fontSize: `${fontSize}px`, lineHeight: 1 }}
        className="filter drop-shadow-sm select-none pointer-events-none transform transition-transform"
      >
        {element.stampEmoji || '👍'}
      </span>
    </div>
  );
};

