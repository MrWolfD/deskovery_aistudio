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
  KeyRound,
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

  // Build secret invitation link
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  
  const inviteUrl = isProtected && inviteToken
    ? `${origin}${pathname}?room=${encodeURIComponent(roomId)}&invite=${encodeURIComponent(inviteToken)}`
    : `${origin}${pathname}?room=${encodeURIComponent(roomId)}`;

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(inviteUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
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
      <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-neutral-900">
                  Совместная работа
                </h2>
                {isProtected ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    <Lock className="w-3 h-3 text-indigo-500" />
                    Защищена
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <Globe className="w-3 h-3 text-emerald-500" />
                    Открытая
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500">
                Комната: <span className="font-mono font-semibold text-indigo-600">{roomId}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-sm">
          {/* Connection Status Banner */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs ${
            connectionStatus === 'connected'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : connectionStatus === 'local_sync'
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
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
          <div className="p-3.5 rounded-xl bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/50 border border-indigo-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>
                  {isProtected ? 'Секретная ссылка-приглашение для друзей' : 'Ссылка для приглашения друзей'}
                </span>
              </div>
              {isProtected && onRotateInvite && (
                <button
                  type="button"
                  onClick={handleRotate}
                  disabled={isRotating}
                  className="flex items-center gap-1 text-[11px] text-neutral-500 hover:text-indigo-600 transition-colors"
                  title="Отозвать старую ссылку и создать новый секретный ключ"
                >
                  <RefreshCw className={`w-3 h-3 ${isRotating ? 'animate-spin' : ''}`} />
                  <span>Обновить ссылку</span>
                </button>
              )}
            </div>

            <p className="text-[11px] text-neutral-600 leading-relaxed">
              {isProtected
                ? 'Отправьте эту ссылку друзьям — они сразу получат доступ к доске в 1 клик без необходимости ввода пароля.'
                : 'Отправьте ссылку коллегам, чтобы они подключились к этой доске.'}
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={inviteUrl}
                className="flex-1 bg-white border border-neutral-300 rounded-xl px-3 py-2 text-xs font-mono text-neutral-700 outline-none select-all"
              />
              <button
                onClick={handleCopyLink}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all shadow-sm cursor-pointer ${
                  copiedLink
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Скопировано!' : 'Копировать'}</span>
              </button>
            </div>
          </div>

          {/* User Profile: Name & Cursor Color */}
          <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-800 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-indigo-600" />
                Ваш профиль (как вас видят друзья)
              </span>
            </div>

            <form onSubmit={handleSaveName} className="flex gap-2">
              <input
                type="text"
                value={userNameInput}
                onChange={(e) => setUserNameInput(e.target.value)}
                placeholder="Ваше имя"
                className="flex-1 bg-white border border-neutral-300 rounded-xl px-3 py-1.5 text-xs text-neutral-900 outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-neutral-200 hover:bg-neutral-300 rounded-xl text-xs font-semibold text-neutral-800 transition-colors"
              >
                Сохранить
              </button>
            </form>

            <div>
              <span className="text-[11px] text-neutral-500 block mb-1.5">
                Цвет вашего маркера и курсора:
              </span>
              <div className="flex items-center gap-2">
                {COLOR_OPTIONS.map((col) => (
                  <button
                    key={col.hex}
                    type="button"
                    onClick={() => onUpdateCurrentUser({ color: col.hex })}
                    className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                      currentUser.color === col.hex ? 'ring-2 ring-indigo-600 scale-125' : 'hover:scale-110'
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
              <span className="text-xs font-semibold text-neutral-800">
                Участники на доске сейчас ({collaborators.length + 1})
              </span>
            </div>
            <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1">
              {/* Current User */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-indigo-50/60 border border-indigo-200/60">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: currentUser.color }}
                  />
                  <span className="text-xs font-semibold text-neutral-900">
                    {currentUser.name} <span className="text-neutral-500 font-normal text-[11px]">(Вы)</span>
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Онлайн
                </span>
              </div>

              {/* Other collaborators */}
              {collaborators.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-neutral-100 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: c.color }}
                    />
                    <span className="text-xs font-medium text-neutral-800 truncate">
                      {c.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                    Онлайн
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
