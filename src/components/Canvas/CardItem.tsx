import React, { useState } from 'react';
import { BoardElement, AnchorPosition } from '../../types/board';

interface CardItemProps {
  element: BoardElement;
  isSelected: boolean;
  isConnecting: boolean;
  onUpdateCard: (id: string, updates: Partial<BoardElement>) => void;
  onStartConnect: (elementId: string, anchor: AnchorPosition, e: React.MouseEvent) => void;
}

export const CardItem: React.FC<CardItemProps> = ({
  element,
  isSelected,
  isConnecting,
  onUpdateCard,
  onStartConnect,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(element.cardTitle || element.text || 'Новая задача');
  const [desc, setDesc] = useState(element.cardDescription || '');
  const [isHovered, setIsHovered] = useState(false);

  const statusMap = {
    todo: { label: 'To Do', color: 'bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200' },
    in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' },
    done: { label: 'Done', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' },
  };

  const statusInfo = statusMap[element.cardStatus || 'todo'] || statusMap.todo;

  const handleBlur = () => {
    setIsEditing(false);
    onUpdateCard(element.id, {
      cardTitle: title,
      cardDescription: desc,
      text: title,
    });
  };

  const anchors: { position: AnchorPosition; style: React.CSSProperties }[] = [
    { position: 'top', style: { top: -6, left: '50%', transform: 'translateX(-50%)' } },
    { position: 'right', style: { right: -6, top: '50%', transform: 'translateY(-50%)' } },
    { position: 'bottom', style: { bottom: -6, left: '50%', transform: 'translateX(-50%)' } },
    { position: 'left', style: { left: -6, top: '50%', transform: 'translateY(-50%)' } },
  ];

  return (
    <div
      className="w-full h-full bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-800 p-3 flex flex-col justify-between transition-all relative select-none"
      style={{
        boxShadow: isSelected
          ? '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.1)'
          : '0 1px 3px rgba(0,0,0,0.05)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
    >
      <div>
        {/* Header: Tag & Status */}
        <div className="flex items-center justify-between gap-2 mb-2 text-xs">
          <div className="flex items-center gap-1.5 font-medium text-neutral-600 dark:text-neutral-300">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: element.cardTagColor || '#6366f1' }}
            />
            <span className="truncate max-w-[120px]">{element.cardTag || 'Задача'}</span>
          </div>

          <span className={`px-2 py-0.5 rounded text-[11px] font-medium shrink-0 ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
        </div>

        {/* Title */}
        {isEditing ? (
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleBlur}
            autoFocus
            className="w-full font-semibold text-sm text-neutral-900 dark:text-white border-b border-indigo-500 outline-none pb-0.5 mb-1 bg-transparent"
          />
        ) : (
          <h4 className="font-semibold text-sm text-neutral-900 dark:text-white line-clamp-2 leading-snug mb-1">
            {title}
          </h4>
        )}

        {/* Description */}
        {isEditing ? (
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            onBlur={handleBlur}
            placeholder="Описание задачи..."
            className="w-full text-xs text-neutral-700 dark:text-neutral-200 bg-neutral-50 dark:bg-neutral-800/80 rounded p-1 outline-none resize-none h-14"
          />
        ) : (
          <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
            {desc || <span className="italic opacity-60">Нажмите дважды, чтобы добавить описание</span>}
          </p>
        )}
      </div>

      {/* Footer: Assignee */}
      <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 mt-2">
        <span className="text-[11px]">#{element.id.slice(-4)}</span>
        {element.cardAssignee && (
          <div className="flex items-center gap-1.5" title={element.cardAssignee.name}>
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white uppercase shadow-xs"
              style={{ backgroundColor: element.cardAssignee.avatarColor }}
            >
              {element.cardAssignee.name[0]}
            </div>
            <span className="text-neutral-700 dark:text-neutral-300 text-xs font-medium">{element.cardAssignee.name}</span>
          </div>
        )}
      </div>

      {/* Anchor connection dots - only on hover or when connecting */}
      {((isHovered && !isEditing) || isConnecting) && (
        <>
          {anchors.map(({ position, style }) => (
            <button
              key={position}
              style={style}
              className="absolute w-4 h-4 rounded-full bg-blue-600 hover:bg-blue-700 border-2 border-white shadow-md flex items-center justify-center text-white hover:scale-125 transition-transform z-30 cursor-crosshair group/btn"
              title={`Создать связь отсюда`}
              onMouseDown={(e) => {
                e.stopPropagation();
                onStartConnect(element.id, position, e);
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white group-hover/btn:scale-110 transition-transform pointer-events-none" />
            </button>
          ))}
        </>
      )}
    </div>
  );
};
