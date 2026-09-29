import React, { useState, useRef, useEffect } from 'react';
import { BoardElement } from '../../types/board';

interface TextItemProps {
  element: BoardElement;
  isSelected: boolean;
  onUpdateText: (id: string, text: string) => void;
}

export const TextItem: React.FC<TextItemProps> = ({ element, isSelected, onUpdateText }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(element.text || 'Текст');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  return (
    <div
      className="w-full h-full relative p-1 rounded select-none"
      style={{
        outline: isEditing ? '1.5px solid #2563eb' : 'none',
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
          className="w-full h-full bg-transparent resize-none outline-none font-sans"
          style={{
            fontSize: `${element.fontSize || 18}px`,
            color: element.fontColor || '#0f172a',
            fontWeight: element.isBold ? 700 : 400,
            fontStyle: element.isItalic ? 'italic' : 'normal',
            textAlign: element.textAlign || 'left',
          }}
          placeholder="Введите текст..."
        />
      ) : (
        <div
          className="w-full h-full font-sans leading-normal break-words whitespace-pre-wrap select-none"
          style={{
            fontSize: `${element.fontSize || 18}px`,
            color: element.fontColor || '#0f172a',
            fontWeight: element.isBold ? 700 : 400,
            fontStyle: element.isItalic ? 'italic' : 'normal',
            textAlign: element.textAlign || 'left',
          }}
        >
          {text || <span className="text-neutral-400 italic">Нажмите дважды для ввода</span>}
        </div>
      )}
    </div>
  );
};
