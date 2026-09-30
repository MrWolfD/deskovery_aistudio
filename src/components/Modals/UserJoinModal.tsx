import React, { useState, useEffect, useRef } from 'react';
import { UserCheck, X, ArrowRight, Sparkles } from 'lucide-react';
import { Collaborator } from '../../types/board';

interface UserJoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Collaborator;
  onSaveUser: (name: string, color: string, rememberAlways: boolean) => void;
  boardTitle?: string;
  theme?: 'light' | 'dark';
}

const COLOR_PALETTE = [
  { name: 'Индиго', hex: '#6366f1' },
  { name: 'Розовый', hex: '#ec4899' },
  { name: 'Изумруд', hex: '#10b981' },
  { name: 'Янтарный', hex: '#f59e0b' },
  { name: 'Фиолетовый', hex: '#8b5cf6' },
  { name: 'Бирюзовый', hex: '#06b6d4' },
  { name: 'Красный', hex: '#f43f5e' },
  { name: 'Синий', hex: '#3b82f6' },
];

export const UserJoinModal: React.FC<UserJoinModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSaveUser,
  boardTitle,
  theme = 'light',
}) => {
  const [name, setName] = useState(currentUser.name || '');
  const [selectedColor, setSelectedColor] = useState(currentUser.color || '#6366f1');
  const [rememberAlways, setRememberAlways] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(currentUser.name || '');
      setSelectedColor(currentUser.color || '#6366f1');
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || currentUser.name || 'Участник';
    onSaveUser(finalName, selectedColor, rememberAlways);
    onClose();
  };

  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none animate-fade-in">
      <div
        className={`w-full max-w-sm rounded-2xl border shadow-2xl overflow-hidden transition-all duration-200 ${
          isDark
            ? 'bg-neutral-900 border-neutral-800 text-neutral-100'
            : 'bg-white border-neutral-200 text-neutral-900'
        }`}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-sm ring-2 ring-white/10"
              style={{ backgroundColor: selectedColor }}
            >
              {(name.trim() || 'U')[0].toUpperCase()}
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Ваше имя на доске</h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {boardTitle ? `Комната «${boardTitle}»` : 'Как вас будут видеть другие участники'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Закрыть"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="px-5 pb-5 pt-2 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
              Имя или псевдоним
            </label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Алексей или Анна (Дизайн)"
              maxLength={30}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                isDark
                  ? 'bg-neutral-950 border-neutral-700 text-white placeholder-neutral-500'
                  : 'bg-neutral-50 border-neutral-300 text-neutral-900 placeholder-neutral-400'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
              Цвет вашего курсора и аватара
            </label>
            <div className="grid grid-cols-8 gap-1.5 pt-0.5">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setSelectedColor(c.hex)}
                  className={`w-8 h-8 rounded-xl transition-all cursor-pointer flex items-center justify-center relative ${
                    selectedColor === c.hex
                      ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-white dark:ring-offset-neutral-900 scale-110 shadow-sm'
                      : 'hover:scale-105 opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                >
                  {selectedColor === c.hex && (
                    <div className="w-2 h-2 rounded-full bg-white shadow-xs" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="rememberName"
              checked={rememberAlways}
              onChange={(e) => setRememberAlways(e.target.checked)}
              className="w-4 h-4 rounded border-neutral-300 dark:border-neutral-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <label
              htmlFor="rememberName"
              className="text-xs text-neutral-600 dark:text-neutral-400 cursor-pointer select-none"
            >
              Запомнить это имя для всех досок
            </label>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-md hover:shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Войти на доску</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className={`py-2.5 px-3.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                isDark
                  ? 'border-neutral-700 text-neutral-300 hover:bg-neutral-800'
                  : 'border-neutral-300 text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              Пропустить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
