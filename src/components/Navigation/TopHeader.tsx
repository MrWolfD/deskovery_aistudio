import React, { useState } from 'react';
import {
  Undo2,
  Redo2,
  Download,
  Share2,
  Play,
  Users,
  Check,
  Radio,
  Wifi,
  WifiOff,
  LayoutGrid,
  Lock,
  Globe,
  Sun,
  Moon,
} from 'lucide-react';
import { Collaborator } from '../../types/board';
import { ConnectionStatus } from '../../services/multiplayer';

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
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(boardTitle);
  const [isCopied, setIsCopied] = useState(false);

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

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const isDark = theme === 'dark';

  return (
    <header className="absolute top-0 left-0 right-0 h-14 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border-b border-neutral-200/80 dark:border-neutral-800 px-4 flex items-center justify-between z-30 select-none transition-colors">
      {/* Zone 1: Brand wordmark & Board title */}
      <div className="flex items-center gap-3 min-w-[280px]">
        {onNavigateToLobby && (
          <button
            onClick={onNavigateToLobby}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white bg-neutral-100/80 dark:bg-neutral-800/80 hover:bg-neutral-200/80 dark:hover:bg-neutral-700/80 transition-all border border-neutral-200 dark:border-neutral-700/60 cursor-pointer"
            title="Вернуться к каталогу комнат"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Комнаты</span>
          </button>
        )}

        <div
          onClick={onNavigateToLobby}
          className="flex items-center gap-2 cursor-pointer group"
          title="На главную страницу комнат"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white font-extrabold text-base shadow-sm tracking-tight border border-indigo-400/20 group-hover:scale-105 transition-transform">
            D
          </div>
          <span className="text-base font-bold text-neutral-900 dark:text-white tracking-tight flex items-center gap-1.5">
            Deskovery
          </span>
        </div>

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

        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Сохранено
        </span>
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
      <div className="flex items-center gap-2.5">
        {/* Real-time sync badge */}
        <button
          onClick={onOpenShareModal}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-colors cursor-pointer border ${
            connectionStatus === 'connected'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
              : connectionStatus === 'local_sync'
              ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
              : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60'
          }`}
          title="Настройки совместной работы и статус подключения"
        >
          <span className="relative flex h-2 w-2">
            {connectionStatus === 'connected' && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                connectionStatus === 'connected'
                  ? 'bg-emerald-500'
                  : connectionStatus === 'local_sync'
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
            />
          </span>

          <span className="font-semibold">
            {connectionStatus === 'connected'
              ? 'Онлайн'
              : connectionStatus === 'local_sync'
              ? 'Вкладки'
              : 'Офлайн'}
          </span>
          <span className="text-neutral-400 dark:text-neutral-500">•</span>
          <span>{collaborators.length + 1} уч.</span>
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
