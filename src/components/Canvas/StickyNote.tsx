import React, { useState, useRef, useEffect } from 'react';
import { BoardElement, AnchorPosition } from '../../types/board';

interface StickyNoteProps {
  element: BoardElement;
  isSelected: boolean;
  isConnecting: boolean;
  onUpdateText: (id: string, text: string) => void;
  onStartConnect: (elementId: string, anchor: AnchorPosition, e: React.MouseEvent) => void;
}

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; fold: string }> = {
  yellow: { bg: '#fef9c3', border: '#fde047', text: '#713f12', fold: '#fef08a' },
  green: { bg: '#dcfce7', border: '#86efac', text: '#14532d', fold: '#bbf7d0' },
  blue: { bg: '#e0f2fe', border: '#7dd3fc', text: '#0c4a6e', fold: '#bae6fd' },
  pink: { bg: '#fce7f3', border: '#f472b6', text: '#831843', fold: '#fbcfe8' },
  purple: { bg: '#f3e8ff', border: '#c084fc', text: '#581c87', fold: '#e9d5ff' },
  orange: { bg: '#ffedd5', border: '#fb923c', text: '#7c2d12', fold: '#fed7aa' },
  gray: { bg: '#f1f5f9', border: '#cbd5e1', text: '#1e293b', fold: '#e2e8f0' },
  dark: { bg: '#1e293b', border: '#334155', text: '#f8fafc', fold: '#0f172a' },
};

export const StickyNote: React.FC<StickyNoteProps> = ({
  element,
  isSelected,
  isConnecting,
  onUpdateText,
  onStartConnect,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(element.text || '');
  const [isHovered, setIsHovered] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const colors = COLOR_MAP[element.stickyColor || 'yellow'] || COLOR_MAP.yellow;

  useEffect(() => {
    setText(element.text || '');
  }, [element.text]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    onUpdateText(element.id, text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
      onUpdateText(element.id, text);
    }
  };

  const anchors: { position: AnchorPosition; style: React.CSSProperties }[] = [
    { position: 'top', style: { top: -7, left: '50%', transform: 'translateX(-50%)' } },
    { position: 'right', style: { right: -7, top: '50%', transform: 'translateY(-50%)' } },
    { position: 'bottom', style: { bottom: -7, left: '50%', transform: 'translateX(-50%)' } },
    { position: 'left', style: { left: -7, top: '50%', transform: 'translateY(-50%)' } },
  ];

  // Show anchors ONLY when hovered (and not editing), OR when actively connecting
  const showAnchors = (isHovered && !isEditing) || isConnecting;

  return (
    <div
      className="w-full h-full relative flex flex-col p-3 rounded-lg group select-none transition-shadow"
      style={{
        backgroundColor: element.fill || colors.bg,
        borderWidth: 1,
        borderColor: colors.border,
        color: element.fontColor || colors.text,
        boxShadow: isSelected
          ? '0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08)'
          : '0 2px 6px rgba(0, 0, 0, 0.05)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDoubleClick={handleDoubleClick}
    >
      {/* Decorative corner fold */}
      <div
        className="absolute top-0 right-0 w-4 h-4 rounded-tr-lg pointer-events-none opacity-60"
        style={{
          background: `linear-gradient(135deg, transparent 50%, ${colors.fold} 50%)`,
        }}
      />

      {/* Main Text Content */}
      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full h-full bg-transparent resize-none outline-none font-sans font-medium leading-relaxed"
          style={{
            fontSize: `${element.fontSize || 14}px`,
            color: element.fontColor || colors.text,
            textAlign: element.textAlign || 'center',
          }}
          placeholder="Напишите заметку..."
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center text-center font-sans font-medium leading-relaxed break-words overflow-hidden whitespace-pre-wrap select-none"
          style={{
            fontSize: `${element.fontSize || 14}px`,
            textAlign: element.textAlign || 'center',
            fontWeight: element.isBold ? 700 : 500,
            fontStyle: element.isItalic ? 'italic' : 'normal',
          }}
        >
          {text || <span className="opacity-40 italic">Пустая заметка</span>}
        </div>
      )}

      {/* Anchor connection dots - only visible on hover or when connecting */}
      {showAnchors && (
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
