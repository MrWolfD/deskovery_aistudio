import React, { useState } from 'react';
import { BoardElement } from '../../types/board';
import { ImageIcon, AlertCircle } from 'lucide-react';

interface ImageItemProps {
  element: BoardElement;
  isSelected: boolean;
  onUpdate: (updates: Partial<BoardElement>) => void;
}

export const ImageItem: React.FC<ImageItemProps> = ({
  element,
  isSelected,
}) => {
  const [loadError, setLoadError] = useState(false);

  return (
    <div
      className={`w-full h-full select-none overflow-hidden transition-shadow ${
        isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''
      }`}
      style={{
        borderRadius: `${element.borderRadius ?? 8}px`,
        opacity: element.opacity ?? 1,
        boxShadow: isSelected
          ? '0 10px 25px -5px rgba(99, 102, 241, 0.4)'
          : '0 4px 12px -2px rgba(0, 0, 0, 0.1)',
      }}
    >
      {loadError || !element.imageUrl ? (
        <div className="w-full h-full bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center p-4 text-slate-500 text-center">
          {loadError ? (
            <>
              <AlertCircle className="w-8 h-8 text-rose-400 mb-1" />
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Не удалось загрузить изображение
              </span>
            </>
          ) : (
            <>
              <ImageIcon className="w-8 h-8 text-slate-400 mb-1" />
              <span className="text-xs font-medium">Нет источника изображения</span>
            </>
          )}
        </div>
      ) : (
        <img
          src={element.imageUrl}
          alt={element.imageAlt || 'Polydesk item'}
          className="w-full h-full object-cover pointer-events-none"
          onError={() => setLoadError(true)}
          draggable={false}
        />
      )}
    </div>
  );
};
