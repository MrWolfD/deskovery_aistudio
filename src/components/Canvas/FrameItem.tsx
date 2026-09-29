import React, { useState } from 'react';
import { BoardElement } from '../../types/board';
import { Play } from 'lucide-react';

interface FrameItemProps {
  element: BoardElement;
  isSelected: boolean;
  onUpdateTitle: (id: string, title: string) => void;
  onStartPresentation?: (frameId: string) => void;
}

export const FrameItem: React.FC<FrameItemProps> = ({
  element,
  isSelected,
  onUpdateTitle,
  onStartPresentation,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(element.frameTitle || 'Фрейм');

  const handleBlur = () => {
    setIsEditing(false);
    onUpdateTitle(element.id, title);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      setIsEditing(false);
      onUpdateTitle(element.id, title);
    }
  };

  return (
    <div
      className="w-full h-full rounded-xl transition-all relative pointer-events-none select-none"
      style={{
        backgroundColor: element.fill || 'rgba(248, 250, 252, 0.65)',
        border: `2px ${element.strokeStyle || 'solid'} ${
          isSelected ? '#3b82f6' : element.stroke || '#cbd5e1'
        }`,
        boxShadow: isSelected ? '0 0 0 3px rgba(59, 130, 246, 0.2)' : 'none',
      }}
    >
      {/* Frame Header Bar */}
      <div
        className="absolute -top-9 left-0 flex items-center gap-2 pointer-events-auto bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-md shadow-xs border border-neutral-200"
        onDoubleClick={(e) => {
          e.stopPropagation();
          setIsEditing(true);
        }}
      >
        {isEditing ? (
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            autoFocus
            className="text-xs font-semibold text-neutral-800 outline-none border-b border-blue-500 bg-transparent min-w-[120px]"
          />
        ) : (
          <span className="text-xs font-semibold text-neutral-800 tracking-tight cursor-pointer hover:text-blue-600 transition-colors">
            {title}
          </span>
        )}

        {element.framePreset && (
          <span className="text-[10px] text-neutral-400 font-mono">
            {element.framePreset}
          </span>
        )}

        {onStartPresentation && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStartPresentation(element.id);
            }}
            className="p-0.5 rounded text-neutral-400 hover:text-blue-600 hover:bg-neutral-100 transition-colors"
            title="Запустить презентацию с этого фрейма"
          >
            <Play className="w-3 h-3 fill-current" />
          </button>
        )}
      </div>
    </div>
  );
};
