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
  Lock,
  Globe,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  isProtected?: boolean;
  inviteToken?: string;
  onRotateInvite?: () => Promise<string | undefined>;
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
  isProtected = false,
  inviteToken = '',
  onRotateInvite,
  currentUser,
  collaborators,
  connectionStatus,
  onUpdateCurrentUser,
  onSwitchRoom,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [userNameInput, setUserNameInput] = useState(currentUser.name);
  const [newRoomInput, setNewRoomInput] = useState('');

  if (!isOpen) return null;

  // Build Secret Invite URL
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const inviteUrl =
    isProtected && inviteToken
      ? `${origin}/?room=${encodeURIComponent(roomId)}&invite=${encodeURIComponent(inviteToken)}`
      : `${origin}/?room=${encodeURIComponent(roomId)}`;

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleRotate = async () => {
    if (!onRotateInvite) return;
    try {
      setIsRotating(true);
      await onRotateInvite();
    } catch (e) {
      console.error('Failed to rotate invite token:', e);
    } finally {
      setIsRotating(false);
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
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                  Совместная работа
                </h2>
                {isProtected ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    <Lock className="w-3 h-3 text-indigo-500" />
                    Защищена
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <Globe className="w-3 h-3 text-emerald-500" />
                    Открытая
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Комната: <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">{roomId}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-sm">
          {/* Connection Status Banner */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs ${
            connectionStatus === 'connected'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300'
              : connectionStatus === 'local_sync'
              ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300'
              : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300'
          }`}>
            {connectionStatus === 'connected' ? (
              <>
                <Radio className="w-4 h-4 text-emerald-500 animate-pulse shrink-0" />
                <span className="font-medium">
                  <strong>Онлайн (WebSocket)</strong>: Изменения и курсоры синхронизируются мгновенно.
                </span>
              </>
            ) : connectionStatus === 'local_sync' ? (
              <>
                <Wifi className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="font-medium">
                  <strong>Локальная сеть (BroadcastChannel)</strong>: Синхронизация между открытыми вкладками.
                </span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-rose-500 shrink-0" />
                <span className="font-medium">
                  <strong>Подключение к серверу...</strong> (данные сохраняются)
                </span>
              </>
            )}
          </div>

          {/* Secret Invite Link for Friends */}
          <div className="p-3.5 rounded-xl bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/50 dark:from-neutral-800/90 dark:via-neutral-850 dark:to-neutral-800/90 border border-indigo-100 dark:border-neutral-750 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900 dark:text-white">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>
                  {isProtected ? 'Секретная ссылка-приглашение для друзей' : 'Ссылка для приглашения друзей'}
                </span>
              </div>
              {isProtected && onRotateInvite && (
                <button
                  type="button"
                  onClick={handleRotate}
                  disabled={isRotating}
                  className="flex items-center gap-1 text-[11px] text-neutral-500 dark:text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                  title="Отозвать старую ссылку и создать новый секретный ключ"
                >
                  <RefreshCw className={`w-3 h-3 ${isRotating ? 'animate-spin' : ''}`} />
                  <span>Обновить ссылку</span>
                </button>
              )}
            </div>

            <p className="text-[11px] text-neutral-600 dark:text-neutral-300 leading-relaxed">
              {isProtected
                ? 'Отправьте эту ссылку друзьям — они сразу получат доступ к доске в 1 клик без необходимости ввода пароля.'
                : 'Отправьте ссылку коллегам, чтобы они подключились к этой доске.'}
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={inviteUrl}
                className="flex-1 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs font-mono text-neutral-700 dark:text-neutral-200 outline-none select-all"
              />
              <button
                onClick={handleCopyLink}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all shadow-xs cursor-pointer ${
                  copiedLink
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-indigo-600 hover:bg-indigo-500'
                }`}
              >
                {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Скопировано!' : 'Копировать'}</span>
              </button>
            </div>
          </div>

          {/* User Profile: Name & Cursor Color */}
          <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Ваш профиль (как вас видят друзья)
              </span>
            </div>

            <form onSubmit={handleSaveName} className="flex gap-2">
              <input
                type="text"
                value={userNameInput}
                onChange={(e) => setUserNameInput(e.target.value)}
                placeholder="Ваше имя"
                className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-1.5 text-xs text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 rounded-xl text-xs font-semibold text-neutral-800 dark:text-neutral-100 transition-colors cursor-pointer"
              >
                Сохранить
              </button>
            </form>

            <div>
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block mb-1.5">
                Цвет курсора:
              </span>
              <div className="flex gap-2">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => onUpdateCurrentUser({ color: c.hex })}
                    className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                      currentUser.color === c.hex
                        ? 'border-indigo-600 dark:border-indigo-400 scale-110 shadow-xs'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Active Collaborators list */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Участники на доске ({collaborators.length + 1})
              </span>
            </div>

            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {/* You */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full border border-white dark:border-neutral-900 shadow-2xs"
                    style={{ backgroundColor: currentUser.color }}
                  />
                  <span className="text-xs font-medium text-neutral-900 dark:text-white">
                    {currentUser.name} (Вы)
                  </span>
                </div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60">
                  Онлайн
                </span>
              </div>

              {/* Others */}
              {collaborators.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/40 border border-transparent hover:border-neutral-100 dark:hover:border-neutral-800 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full border border-white dark:border-neutral-900 shadow-2xs"
                      style={{ backgroundColor: c.color }}
                    />
                    <div>
                      <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200 block">
                        {c.name}
                      </span>
                      {c.statusMessage && (
                        <span className="text-[10px] text-neutral-400 block italic">
                          "{c.statusMessage}"
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Онлайн</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Room Switcher */}
          <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <form onSubmit={handleCreateRoom} className="flex gap-2">
              <input
                type="text"
                value={newRoomInput}
                onChange={(e) => setNewRoomInput(e.target.value)}
                placeholder="Перейти в другую комнату..."
                className="flex-1 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-1.5 text-xs text-neutral-900 dark:text-white outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-neutral-800 dark:bg-neutral-700 hover:bg-neutral-700 dark:hover:bg-neutral-600 rounded-xl text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                Перейти
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
