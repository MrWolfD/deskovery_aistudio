import React, { useState, useRef, useEffect } from 'react';
import {
  Undo2,
  Redo2,
  Download,
  Share2,
  Play,
  Users,
  Lock,
  Globe,
  Sun,
  Moon,
  ChevronDown,
  Pencil,
} from 'lucide-react';
import { Collaborator } from '../../types/board';
import { ConnectionStatus } from '../../services/multiplayer';

const USER_COLORS = [
  { name: 'Индиго', hex: '#6366f1' },
  { name: 'Розовый', hex: '#ec4899' },
  { name: 'Изумруд', hex: '#10b981' },
  { name: 'Янтарный', hex: '#f59e0b' },
  { name: 'Фиолетовый', hex: '#8b5cf6' },
  { name: 'Бирюзовый', hex: '#06b6d4' },
  { name: 'Красный', hex: '#f43f5e' },
  { name: 'Синий', hex: '#3b82f6' },
];

interface TopHeaderProps {
  boardTitle: string;
  onUpdateTitle: (title: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onOpenExport: () => void;
  onStartPresentation: () => void;
  hasFrames: boolean;
  collaborators: Collaborator[];
  isMultiplayerActive: boolean;
  connectionStatus: ConnectionStatus;
  roomId: string;
  isProtected?: boolean;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onOpenShareModal: () => void;
  onNavigateToLobby?: () => void;
  currentUser?: Collaborator;
  onUpdateCurrentUser?: (updates: Partial<Collaborator>) => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  boardTitle,
  onUpdateTitle,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onOpenExport,
  onStartPresentation,
  hasFrames,
  collaborators,
  connectionStatus,
  roomId,
  isProtected = false,
  theme = 'light',
  onToggleTheme,
  onOpenShareModal,
  onNavigateToLobby,
  currentUser,
  onUpdateCurrentUser,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(boardTitle);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [editName, setEditName] = useState(currentUser?.name || '');
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentUser?.name) {
      setEditName(currentUser.name);
    }
  }, [currentUser?.name]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSaveUserName = (e: React.FormEvent) => {
    e.preventDefault();
    if (editName.trim() && onUpdateCurrentUser) {
      onUpdateCurrentUser({ name: editName.trim() });
      setIsUserMenuOpen(false);
    }
  };

  const handleBlur = () => {
    setIsEditingTitle(false);
    onUpdateTitle(title);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsEditingTitle(false);
      onUpdateTitle(title);
    }
  };

  const isDark = theme === 'dark';

  return (
    <header className="absolute top-0 left-0 right-0 h-14 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border-b border-neutral-200/80 dark:border-neutral-800 px-4 flex items-center justify-between z-30 select-none transition-colors">
      {/* Zone 1: Brand wordmark & Board title */}
      <div className="flex items-center gap-3">
        {onNavigateToLobby ? (
          <button
            onClick={onNavigateToLobby}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer group"
            title="Вернуться к каталогу комнат"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-extrabold text-sm shadow-xs group-hover:scale-105 transition-transform">
              D
            </div>
            <span className="text-sm font-bold text-neutral-900 dark:text-white tracking-tight hidden sm:inline">
              Deskovery
            </span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-extrabold text-sm shadow-xs">
              D
            </div>
            <span className="text-sm font-bold text-neutral-900 dark:text-white tracking-tight hidden sm:inline">
              Deskovery
            </span>
          </div>
        )}

        <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-800" />

        {/* Room Security Status Badge */}
        <div
          className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${
            isProtected
              ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60'
              : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
          }`}
          title={isProtected ? 'Эта комната защищена паролем' : 'Открытая комната'}
        >
          {isProtected ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
          <span>{isProtected ? 'Защищена' : 'Открытая'}</span>
        </div>

        {/* Editable Board Title */}
        {isEditingTitle ? (
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            autoFocus
            className="text-sm font-medium text-neutral-900 dark:text-white border-b border-indigo-500 outline-none px-1 bg-transparent max-w-[200px]"
          />
        ) : (
          <button
            onClick={() => setIsEditingTitle(true)}
            className="text-sm font-medium text-neutral-800 dark:text-neutral-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 px-2 py-1 rounded-md transition-colors truncate max-w-[200px] cursor-pointer"
            title="Переименовать доску"
          >
            {boardTitle}
          </button>
        )}
      </div>

      {/* Zone 2: Navigation (Undo/Redo) */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="p-1.5 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed"
          title="Отменить действие (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="p-1.5 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed"
          title="Повторить действие (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        {hasFrames && (
          <>
            <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-800 mx-1" />
            <button
              onClick={onStartPresentation}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-xs font-semibold border border-indigo-200 dark:border-indigo-800/60 transition-colors shadow-2xs cursor-pointer"
              title="Запустить полноэкранную презентацию фреймов (Alt + P)"
            >
              <Play className="w-3.5 h-3.5 fill-indigo-600 dark:fill-indigo-400" />
              <span>Презентация</span>
            </button>
          </>
        )}
      </div>

      {/* Zone 3: Collaborators & Actions */}
      <div className="flex items-center gap-2">
        {/* Current User Quick Name / Color Editor */}
        {currentUser && (
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-1.5 py-1 px-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700/80 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer group"
              title="Нажмите, чтобы изменить имя или цвет курсора"
            >
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-2xs group-hover:scale-105 transition-transform"
                style={{ backgroundColor: currentUser.color }}
              >
                {(currentUser.name || 'U')[0].toUpperCase()}
              </div>
              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 max-w-[90px] sm:max-w-[120px] truncate">
                {currentUser.name}
              </span>
              <ChevronDown className="w-3 h-3 text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-200 transition-colors" />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200/90 dark:border-neutral-800 z-50 flex flex-col gap-3 animate-fade-in">
                <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider px-0.5">
                  <span>Ваш профиль</span>
                  <Pencil className="w-3 h-3 text-indigo-500" />
                </div>

                <form onSubmit={handleSaveUserName} className="flex gap-1.5">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Ваше имя..."
                    maxLength={30}
                    autoFocus
                    className="flex-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    OK
                  </button>
                </form>

                <div>
                  <div className="text-[10px] text-neutral-500 dark:text-neutral-400 mb-1.5 font-medium">
                    Цвет курсора:
                  </div>
                  <div className="grid grid-cols-8 gap-1.5">
                    {USER_COLORS.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => {
                          if (onUpdateCurrentUser) {
                            onUpdateCurrentUser({ color: c.hex });
                          }
                        }}
                        className={`w-5 h-5 rounded-md cursor-pointer transition-transform ${
                          currentUser.color === c.hex
                            ? 'ring-2 ring-indigo-500 scale-110 shadow-xs'
                            : 'hover:scale-105 opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Collaborators counter & list */}
        <button
          onClick={onOpenShareModal}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer border border-neutral-200 dark:border-neutral-700/60"
          title="Список участников и настройки совместной работы"
        >
          <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>{collaborators.length + 1}</span>
        </button>

        {collaborators.length > 0 && (
          <div
            className="flex -space-x-1.5 cursor-pointer"
            onClick={onOpenShareModal}
            title="Список участников"
          >
            {collaborators.slice(0, 4).map((c) => (
              <div
                key={c.id}
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-white dark:border-neutral-900 shadow-2xs"
                style={{ backgroundColor: c.color }}
                title={`${c.name} (${c.role || 'Коллаборатор'})`}
              >
                {c.name[0]}
              </div>
            ))}
            {collaborators.length > 4 && (
              <div className="w-7 h-7 rounded-full bg-neutral-200 dark:bg-neutral-700 text-[10px] font-bold text-neutral-700 dark:text-neutral-200 border-2 border-white dark:border-neutral-900 flex items-center justify-center">
                +{collaborators.length - 4}
              </div>
            )}
          </div>
        )}

        <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-800 mx-0.5" />

        {/* Theme Toggle Button */}
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700/80 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            title={isDark ? 'Переключить на светлую тему' : 'Переключить на темную тему'}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400 transition-transform hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600 transition-transform hover:-rotate-12" />
            )}
          </button>
        )}

        {/* Export Button */}
        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700/80 text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          title="Экспортировать доску в PNG или сохранить файл"
        >
          <Download className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
          <span>Экспорт</span>
        </button>

        {/* Share Button */}
        <button
          onClick={onOpenShareModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors shadow-2xs cursor-pointer"
          title="Поделиться доской и скопировать ссылку"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Поделиться</span>
        </button>
      </div>
    </header>
  );
};
