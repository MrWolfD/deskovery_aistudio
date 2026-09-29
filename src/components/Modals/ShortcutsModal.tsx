import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'V', desc: 'Инструмент выделения (Select)' },
    { key: 'H / Пробел + Drag', desc: 'Панорамирование холста (Pan / Hand)' },
    { key: 'S', desc: 'Стикер (Sticky note)' },
    { key: 'R', desc: 'Фигуры (Shapes)' },
    { key: 'C', desc: 'Стрелка / Связь (Connector)' },
    { key: 'T', desc: 'Текстовый блок (Text)' },
    { key: 'P', desc: 'Карандаш / Маркер (Pen)' },
    { key: 'F', desc: 'Фрейм / Слайд (Frame)' },
    { key: 'Ctrl + Z', desc: 'Отменить действие (Undo)' },
    { key: 'Ctrl + Y', desc: 'Повторить действие (Redo)' },
    { key: 'Ctrl + D', desc: 'Дублировать выделенный элемент' },
    { key: 'Del / Backspace', desc: 'Удалить выделенное' },
    { key: 'Колесико мыши', desc: 'Масштабирование (Zoom in / out)' },
    { key: 'Двойной клик', desc: 'Редактировать текст элемента' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none">
      <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200 w-full max-w-lg overflow-hidden flex flex-col animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-100 text-neutral-800 flex items-center justify-center">
              <Keyboard className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-neutral-900">
              Горячие клавиши
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 gap-2 max-h-[60vh] overflow-y-auto">
          {shortcuts.map((s, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-neutral-50"
            >
              <span className="text-xs text-neutral-600">{s.desc}</span>
              <kbd className="px-2 py-1 bg-neutral-100 border border-neutral-300 rounded font-mono text-[11px] font-semibold text-neutral-800 shadow-2xs">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="px-6 py-3 bg-neutral-50 border-t border-neutral-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-200 rounded-lg transition-colors"
          >
            Понятно
          </button>
        </div>
      </div>
    </div>
  );
};
