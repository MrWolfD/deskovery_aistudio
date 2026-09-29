import React, { useState } from 'react';
import { Collaborator } from '../../types/board';
import { ConnectionStatus } from '../../services/multiplayer';
import {
  Users,
  Copy,
  Check,
  Radio,
  Wifi,
  WifiOff,
  UserCheck,
  X,
  Share2,
  Palette,
  ExternalLink,
} from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  currentUser: Collaborator;
  collaborators: Collaborator[];
  connectionStatus: ConnectionStatus;
  onUpdateCurrentUser: (updates: Partial<Collaborator>) => void;
  onSwitchRoom: (newRoomId: string) => void;
}

const COLOR_OPTIONS = [
  { name: 'Индиго', hex: '#6366f1' },
  { name: 'Розовый', hex: '#ec4899' },
  { name: 'Изумрудный', hex: '#10b981' },
  { name: 'Янтарный', hex: '#f59e0b' },
  { name: 'Фиолетовый', hex: '#8b5cf6' },
  { name: 'Лазурный', hex: '#06b6d4' },
  { name: 'Коралловый', hex: '#f43f5e' },
  { name: 'Синий', hex: '#3b82f6' },
];

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  roomId,
  currentUser,
  collaborators,
  connectionStatus,
  onUpdateCurrentUser,
  onSwitchRoom,
}) => {
  const [copied, setCopied] = useState(false);
  const [userNameInput, setUserNameInput] = useState(currentUser.name);
  const [newRoomInput, setNewRoomInput] = useState('');

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(roomId)}`
    : `?room=${roomId}`;

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (userNameInput.trim()) {
      onUpdateCurrentUser({ name: userNameInput.trim() });
    }
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (newRoomInput.trim()) {
      onSwitchRoom(newRoomInput.trim());
      setNewRoomInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-neutral-200/90 dark:border-slate-800 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-200/80 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-neutral-800 dark:text-slate-100">
                Совместная работа в реальном времени
              </h2>
              <p className="text-xs text-neutral-500 dark:text-slate-400">
                Комната: <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">{roomId}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-slate-200 hover:bg-neutral-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 text-sm">
          {/* Connection Status Banner */}
          <div className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-xs ${
            connectionStatus === 'connected'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : connectionStatus === 'local_sync'
              ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
              : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
          }`}>
            {connectionStatus === 'connected' ? (
              <>
                <Radio className="w-4 h-4 text-emerald-500 animate-pulse shrink-0" />
                <span className="font-medium">
                  <strong>В сети (WebSocket подключен)</strong>: Изменения и курсоры синхронизируются в реальном времени со всеми участниками.
                </span>
              </>
            ) : connectionStatus === 'local_sync' ? (
              <>
                <Wifi className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="font-medium">
                  <strong>Локальная синхронизация (BroadcastChannel)</strong>: Работает между открытыми вкладками браузера.
                </span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-rose-500 shrink-0" />
                <span className="font-medium">
                  <strong>Переподключение к серверу...</strong> (данные сохраняются локально)
                </span>
              </>
            )}
          </div>

          {/* Share Link Box */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-slate-300 mb-1.5">
              Ссылка на эту доску для коллег
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={currentUrl}
                className="flex-1 bg-neutral-50 dark:bg-slate-800 border border-neutral-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-neutral-600 dark:text-slate-300 outline-none select-all"
              />
              <button
                onClick={handleCopyLink}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium text-white transition-all shadow-xs cursor-pointer ${
                  copied
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Скопировано!' : 'Копировать'}</span>
              </button>
            </div>
          </div>

          {/* User Settings: Name & Cursor Color */}
          <div className="p-3.5 bg-neutral-50 dark:bg-slate-800/60 rounded-xl border border-neutral-200/80 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-700 dark:text-slate-300 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-indigo-500" />
                Ваш профиль на доске
              </span>
            </div>

            <form onSubmit={handleSaveName} className="flex gap-2">
              <input
                type="text"
                value={userNameInput}
                onChange={(e) => setUserNameInput(e.target.value)}
                placeholder="Ваше имя"
                className="flex-1 bg-white dark:bg-slate-900 border border-neutral-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-neutral-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-neutral-200 dark:bg-slate-700 hover:bg-neutral-300 dark:hover:bg-slate-600 rounded-lg text-xs font-medium text-neutral-800 dark:text-slate-200 transition-colors"
              >
                Сохранить
              </button>
            </form>

            <div>
              <span className="text-[11px] text-neutral-500 dark:text-slate-400 block mb-1.5">
                Цвет вашего курсора:
              </span>
              <div className="flex items-center gap-2">
                {COLOR_OPTIONS.map((col) => (
                  <button
                    key={col.hex}
                    type="button"
                    onClick={() => onUpdateCurrentUser({ color: col.hex })}
                    className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                      currentUser.color === col.hex ? 'ring-2 ring-indigo-500 scale-125' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: col.hex }}
                    title={col.name}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Active Collaborators List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-neutral-700 dark:text-slate-300">
                Участники в комнате ({collaborators.length + 1})
              </span>
            </div>
            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
              {/* You */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/50 dark:border-indigo-800/40">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: currentUser.color }}
                  />
                  <span className="text-xs font-medium text-neutral-800 dark:text-slate-200">
                    {currentUser.name} <span className="text-neutral-400 text-[10px]">(Вы)</span>
                  </span>
                </div>
                <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                  Онлайн
                </span>
              </div>

              {/* Other collaborators */}
              {collaborators.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: c.color }}
                    />
                    <span className="text-xs font-medium text-neutral-700 dark:text-slate-300 truncate">
                      {c.name}
                    </span>
                    {c.role && (
                      <span className="text-[10px] text-neutral-400 truncate">
                        • {c.role}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full shrink-0">
                    Онлайн
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Switch / New Room */}
          <form onSubmit={handleCreateRoom} className="pt-2 border-t border-neutral-200/80 dark:border-slate-800 flex gap-2">
            <input
              type="text"
              value={newRoomInput}
              onChange={(e) => setNewRoomInput(e.target.value)}
              placeholder="Создать или перейти в комнату..."
              className="flex-1 bg-white dark:bg-slate-900 border border-neutral-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-neutral-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-lg text-xs font-medium transition-colors"
            >
              Перейти
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
