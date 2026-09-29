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
  onOpenShareModal: () => void;
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
  onOpenShareModal,
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

  return (
    <header className="absolute top-0 left-0 right-0 h-14 bg-white/90 backdrop-blur-md border-b border-neutral-200/80 px-4 flex items-center justify-between z-30 select-none">
      {/* Zone 1: Brand wordmark & Board title */}
      <div className="flex items-center gap-3 min-w-[280px]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white font-extrabold text-base shadow-sm tracking-tight border border-indigo-400/20">
            D
          </div>
          <span className="text-base font-bold text-neutral-900 tracking-tight flex items-center gap-1.5">
            Deskovery
            <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
              Board
            </span>
          </span>
        </div>

        <div className="h-4 w-px bg-neutral-200" />

        {/* Editable Board Title */}
        {isEditingTitle ? (
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            autoFocus
            className="text-sm font-medium text-neutral-900 border-b border-blue-500 outline-none px-1 bg-transparent max-w-[220px]"
          />
        ) : (
          <button
            onClick={() => setIsEditingTitle(true)}
            className="text-sm font-medium text-neutral-800 hover:text-blue-600 hover:bg-neutral-100 px-2 py-1 rounded-md transition-colors truncate max-w-[220px]"
            title="Переименовать доску"
          >
            {boardTitle}
          </button>
        )}

        <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Сохранено
        </span>
      </div>

      {/* Zone 2: Navigation (Undo/Redo) */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="p-2 rounded-lg text-neutral-700 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
          title="Отменить действие (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="p-2 rounded-lg text-neutral-700 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
          title="Повторить действие (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </button>
      </div>

      {/* Zone 3: Actions & Multiplayer */}
      <div className="flex items-center gap-2">
        {/* Collaborators & Room Status button */}
        <button
          onClick={onOpenShareModal}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
            connectionStatus === 'connected'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : connectionStatus === 'local_sync'
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
              : 'border-neutral-200 dark:border-slate-800 text-neutral-600 dark:text-slate-400 hover:bg-neutral-50'
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
            {connectionStatus === 'connected' ? 'Онлайн' : connectionStatus === 'local_sync' ? 'Вкладки' : 'Офлайн'}
          </span>
          <span className="text-neutral-400 dark:text-slate-500">•</span>
          <span>{collaborators.length + 1} уч.</span>
        </button>

        {collaborators.length > 0 && (
          <div className="flex -space-x-1.5 cursor-pointer" onClick={onOpenShareModal} title="Список участников">
            {collaborators.slice(0, 4).map((c) => (
              <div
                key={c.id}
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-white dark:border-slate-900 shadow-xs"
                style={{ backgroundColor: c.color }}
                title={`${c.name} (${c.role || 'Коллаборатор'})`}
              >
                {c.name[0]}
              </div>
            ))}
            {collaborators.length > 4 && (
              <div className="w-7 h-7 rounded-full bg-neutral-200 dark:bg-slate-700 text-[10px] font-bold text-neutral-700 dark:text-slate-300 border-2 border-white dark:border-slate-900 flex items-center justify-center">
                +{collaborators.length - 4}
              </div>
            )}
          </div>
        )}

        <div className="h-4 w-px bg-neutral-200 dark:bg-slate-800 mx-1" />

        {/* Export Button */}
        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-slate-800 text-xs font-medium text-neutral-700 dark:text-slate-300 hover:bg-neutral-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Экспортировать доску в PNG или сохранить файл"
        >
          <Download className="w-3.5 h-3.5 text-neutral-500" />
          <span>Экспорт</span>
        </button>

        {/* Share Button */}
        <button
          onClick={onOpenShareModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-colors shadow-xs cursor-pointer"
          title="Поделиться доской и скопировать ссылку"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Поделиться</span>
        </button>
      </div>
    </header>
  );
};
