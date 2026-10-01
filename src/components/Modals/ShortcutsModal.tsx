import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: '3 / V', desc: 'Выделение и перемещение (Select)' },
    { key: '2 / H / Пробел', desc: 'Панорамирование холста (Pan / Hand)' },
    { key: '4 / R', desc: 'Прямоугольник (Rectangle)' },
    { key: '5', desc: 'Ромб (Diamond)' },
    { key: '6 / O', desc: 'Круг / Овал (Ellipse)' },
    { key: '7 / C / A', desc: 'Стрелка / Связь (Connector / Arrow)' },
    { key: '8 / P', desc: 'Карандаш (Draw / Pen)' },
    { key: '9 / T', desc: 'Текстовый блок (Text)' },
    { key: '0 / E', desc: 'Ластик для стирания (Eraser)' },
    { key: 'L', desc: 'Лазерная указка для демонстрации (Laser)' },
    { key: 'Ctrl + K', desc: 'Командная панель (Command Palette)' },
    { key: 'Ctrl + E', desc: 'Экспорт доски (PNG / SVG / JSON)' },
    { key: '1', desc: 'Заблокировать / Разблокировать элемент' },
    { key: 'S', desc: 'Стикер (Sticky note)' },
    { key: 'F', desc: 'Фрейм / Слайд (Frame)' },
    { key: 'Ctrl + Z', desc: 'Отменить действие (Undo)' },
    { key: 'Ctrl + Y', desc: 'Повторить действие (Redo)' },
    { key: 'Ctrl + D', desc: 'Дублировать выделенный элемент' },
    { key: 'Ctrl + G', desc: 'Сгруппировать элементы' },
    { key: 'Ctrl + Shift + G', desc: 'Разгруппировать элементы' },
    { key: 'Del / Backspace', desc: 'Удалить выделенное' },
    { key: 'Колесико мыши', desc: 'Масштабирование (Zoom in / out)' },
    { key: 'Двойной клик', desc: 'Редактировать текст элемента' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 w-full max-w-lg overflow-hidden flex flex-col animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Keyboard className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
              Горячие клавиши
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 gap-2 max-h-[60vh] overflow-y-auto">
          {shortcuts.map((s, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors"
            >
              <span className="text-xs text-neutral-600 dark:text-neutral-300">{s.desc}</span>
              <kbd className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded font-mono text-[11px] font-semibold text-neutral-800 dark:text-neutral-200 shadow-2xs">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
