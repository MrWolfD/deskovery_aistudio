import React, { useEffect, useState } from 'react';
import { Collaborator, Point } from '../../types/board';
import { MousePointer2 } from 'lucide-react';

interface CollaboratorCursorsProps {
  collaborators: Collaborator[];
  zoom: number;
  viewportX: number;
  viewportY: number;
}

export const CollaboratorCursors: React.FC<CollaboratorCursorsProps> = ({
  collaborators,
  zoom,
  viewportX,
  viewportY,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
      {collaborators.map((c) => {
        if (!c.isOnline) return null;
        const screenX = c.cursor.x * zoom + viewportX;
        const screenY = c.cursor.y * zoom + viewportY;

        return (
          <div
            key={c.id}
            className="absolute transition-all duration-300 ease-out flex flex-col items-start select-none"
            style={{
              transform: `translate(${screenX}px, ${screenY}px)`,
            }}
          >
            <div className="relative">
              <MousePointer2
                className="w-5 h-5 -rotate-90 filter drop-shadow-sm"
                style={{
                  color: c.color,
                  fill: c.color,
                }}
              />
              <span
                className="absolute left-4 top-2 text-[11px] font-medium text-white px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap"
                style={{ backgroundColor: c.color }}
              >
                {c.name}
              </span>
            </div>

            {c.statusMessage && (
              <div className="mt-1 ml-4 bg-white/95 text-neutral-800 border border-neutral-200 text-xs px-2.5 py-1 rounded-xl shadow-md backdrop-blur-xs max-w-[200px] leading-tight animate-fade-in">
                {c.statusMessage}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
