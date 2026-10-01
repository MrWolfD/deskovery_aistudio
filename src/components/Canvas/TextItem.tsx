import React, { useState, useRef, useEffect } from 'react';
import { BoardElement } from '../../types/board';

interface TextItemProps {
  element: BoardElement;
  isSelected: boolean;
  theme?: 'light' | 'dark';
  onUpdateText: (id: string, text: string) => void;
}

export const TextItem: React.FC<TextItemProps> = ({ element, isSelected, theme, onUpdateText }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(element.text || 'Текст');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isDark =
    theme === 'dark' ||
    (typeof document !== 'undefined' && document.documentElement.classList.contains('dark'));

  // In dark mode: ensure text is white (#f8fafc) if not set or set to dark/black shades
  const textColor = isDark
    ? (!element.fontColor ||
       element.fontColor === '#0f172a' ||
       element.fontColor === '#000000' ||
       element.fontColor === '#1e293b' ||
       element.fontColor === '#18181b'
        ? '#f8fafc'
        : element.fontColor)
    : (element.fontColor || '#0f172a');

  useEffect(() => {
    setText(element.text || '');
  }, [element.text]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

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

  const fontFamily =
    element.fontFamily === 'mono'
      ? '"JetBrains Mono", monospace'
      : element.fontFamily === 'sans'
      ? '"Plus Jakarta Sans", sans-serif'
      : '"Kalam", "Caveat", cursive';

  return (
    <div
      className="w-full h-full relative p-1 rounded select-none"
      style={{
        outline: isEditing ? '1.5px solid #6366f1' : 'none',
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
    >
      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full h-full bg-transparent resize-none outline-none leading-snug"
          style={{
            fontFamily,
            fontSize: `${element.fontSize || 20}px`,
            color: textColor,
            fontWeight: element.isBold ? 700 : 400,
            fontStyle: element.isItalic ? 'italic' : 'normal',
            textAlign: element.textAlign || 'left',
          }}
          placeholder="Введите текст..."
        />
      ) : (
        <div
          className="w-full h-full leading-snug break-words whitespace-pre-wrap select-none"
          style={{
            fontFamily,
            fontSize: `${element.fontSize || 20}px`,
            color: textColor,
            fontWeight: element.isBold ? 700 : 400,
            fontStyle: element.isItalic ? 'italic' : 'normal',
            textAlign: element.textAlign || 'left',
          }}
        >
          {text || (
            <span className={isDark ? 'text-neutral-500 italic' : 'text-neutral-400 italic'}>
              Нажмите дважды для ввода
            </span>
          )}
        </div>
      )}
    </div>
  );
};
