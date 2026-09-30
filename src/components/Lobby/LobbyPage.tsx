import React, { useState, useEffect } from 'react';
import { ServerStorageStats } from '../../types/storage';
import {
  Lock,
  Globe,
  Users,
  Plus,
  Search,
  ArrowRight,
  Shield,
  KeyRound,
  Eye,
  EyeOff,
  Clock,
  Sparkles,
  RefreshCw,
  FolderLock,
  LogOut,
  Sun,
  Moon,
  HardDrive,
  Layers,
  Copy,
  Trash2,
} from 'lucide-react';

export interface PreviewElement {
  id: string;
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  color?: string;
  strokeColor?: string;
  text?: string;
}

export interface RoomSummary {
  id: string;
  title: string;
  description: string;
  hasPassword: boolean;
  usersCount: number;
  elementsCount: number;
  sizeBytes?: number;
  sizeFormatted?: string;
  previewElements?: PreviewElement[];
  createdAt: number;
  updatedAt: number;
}

const RoomHoverPreview: React.FC<{
  elements?: PreviewElement[];
  isDark?: boolean;
}> = ({ elements = [], isDark = true }) => {
  if (!elements || elements.length === 0) {
    return (
      <div
        className={`w-72 h-40 rounded-xl border p-4 flex flex-col items-center justify-center text-center backdrop-blur-md shadow-2xl transition-colors ${
          isDark
            ? 'bg-neutral-900/95 border-neutral-700 text-neutral-300'
            : 'bg-white/95 border-neutral-300 text-neutral-700'
        }`}
      >
        <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2 shadow-2xs">
          <Layers className="w-5 h-5" />
        </div>
        <span className="text-xs font-bold block mb-0.5">Пустой холст</span>
        <span className="text-[11px] text-neutral-400">Нажмите на карточку, чтобы добавить заметки</span>
      </div>
    );
  }

  // Calculate bounding box for SVG viewport
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const el of elements) {
    const x = el.x || 0;
    const y = el.y || 0;
    const w = el.width || 100;
    const h = el.height || 100;

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + w);
    maxY = Math.max(maxY, y + h);
  }

  if (minX === Infinity || !isFinite(minX)) {
    minX = 0;
    minY = 0;
    maxX = 800;
    maxY = 600;
  }

  const pad = 60;
  const vbX = minX - pad;
  const vbY = minY - pad;
  const vbW = Math.max(240, maxX - minX + pad * 2);
  const vbH = Math.max(160, maxY - minY + pad * 2);

  return (
    <div
      className={`w-80 h-48 rounded-2xl border shadow-2xl p-2.5 overflow-hidden flex flex-col backdrop-blur-md transition-colors ${
        isDark
          ? 'bg-neutral-900/95 border-neutral-700 text-neutral-200'
          : 'bg-white/95 border-neutral-300 text-neutral-800'
      }`}
    >
      <div className="flex items-center justify-between px-2 pb-1.5 border-b border-neutral-200 dark:border-neutral-800 text-[11px] text-neutral-400">
        <span className="font-semibold flex items-center gap-1.5 text-indigo-500 dark:text-indigo-400">
          <Sparkles className="w-3.5 h-3.5" />
          Мини-карта содержимого
        </span>
        <span className="font-mono text-[10px] bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
          {elements.length} эл.
        </span>
      </div>

      <div className="flex-1 w-full h-full relative overflow-hidden rounded-xl mt-1.5 bg-neutral-100/60 dark:bg-neutral-950/80 border border-neutral-200/50 dark:border-neutral-850">
        <svg
          viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {elements.map((el) => {
            const w = el.width || 100;
            const h = el.height || 100;
            const color = el.color || '#fef08a';

            if (el.type === 'circle') {
              return (
                <circle
                  key={el.id}
                  cx={el.x + w / 2}
                  cy={el.y + h / 2}
                  r={Math.min(w, h) / 2}
                  fill={color}
                  stroke={el.strokeColor || (isDark ? '#4b5563' : '#94a3b8')}
                  strokeWidth="2"
                  opacity="0.9"
                />
              );
            }

            return (
              <g key={el.id}>
                <rect
                  x={el.x}
                  y={el.y}
                  width={w}
                  height={h}
                  rx={el.type === 'sticky' ? 8 : 4}
                  fill={color}
                  stroke={el.strokeColor || (isDark ? '#374151' : '#cbd5e1')}
                  strokeWidth="1.5"
                  opacity="0.92"
                />
                {el.text && (
                  <text
                    x={el.x + 8}
                    y={el.y + 18}
                    fontSize="11"
                    fontFamily="sans-serif"
                    fontWeight="500"
                    fill={isDark ? '#111827' : '#1f2937'}
                    opacity="0.75"
                  >
                    {el.text.slice(0, 16)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

interface LobbyPageProps {
  onSelectRoom: (roomId: string, password?: string, inviteToken?: string) => void;
  initialError?: string | null;
  teamToken?: string;
  onLogout?: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export const LobbyPage: React.FC<LobbyPageProps> = ({
  onSelectRoom,
  initialError,
  teamToken,
  onLogout,
  theme = 'dark',
  onToggleTheme,
}) => {
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'public' | 'protected'>('all');

  // Password Prompt Modal state
  const [passwordModalRoom, setPasswordModalRoom] = useState<RoomSummary | null>(null);
  const [inputPassword, setInputPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(initialError || null);

  // Create Room Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCustomId, setNewCustomId] = useState('');
  const [newIsProtected, setNewIsProtected] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const isDark = theme === 'dark';

  // Fetch list of rooms from server
  const fetchRooms = async () => {
    try {
      setIsLoading(true);
      const headers: Record<string, string> = {};
      if (teamToken) {
        headers['Authorization'] = `Bearer ${teamToken}`;
      }

      const res = await fetch('/api/rooms', { headers });
      if (res.ok) {
        const data = await res.json();
        setRooms(data.rooms || []);
      } else if (res.status === 401 && onLogout) {
        onLogout();
      }
    } catch (e) {
      console.error('Failed to load rooms list:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const [storageStats, setStorageStats] = useState<ServerStorageStats | null>(null);

  const fetchStorageStats = async () => {
    try {
      const res = await fetch('/api/server/storage');
      if (res.ok) {
        const data = await res.json();
        setStorageStats(data);
      }
    } catch (e) {
      console.warn('Failed to load storage stats:', e);
    }
  };

  useEffect(() => {
    fetchRooms();
    fetchStorageStats();
    const interval = setInterval(() => {
      fetchRooms();
      fetchStorageStats();
    }, 10000);
    return () => clearInterval(interval);
  }, [teamToken]);

  // Filter and search logic
  const filteredRooms = rooms.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterType === 'public') return !r.hasPassword;
    if (filterType === 'protected') return r.hasPassword;
    return true;
  });

  const handleRoomClick = (room: RoomSummary) => {
    if (room.hasPassword) {
      const savedPass = sessionStorage.getItem(`deskovery_pass_${room.id}`);
      if (savedPass) {
        onSelectRoom(room.id, savedPass);
        return;
      }
      setPasswordModalRoom(room);
      setInputPassword('');
      setPasswordError(null);
    } else {
      onSelectRoom(room.id);
    }
  };

  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalRoom) return;

    if (!inputPassword.trim()) {
      setPasswordError('Введите пароль от комнаты');
      return;
    }

    try {
      setIsVerifying(true);
      setPasswordError(null);

      const res = await fetch(`/api/rooms/${passwordModalRoom.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: inputPassword.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        try {
          sessionStorage.setItem(`deskovery_pass_${passwordModalRoom.id}`, inputPassword.trim());
        } catch (e) {}

        const targetRoomId = passwordModalRoom.id;
        const secretInvite = data.inviteToken;
        setPasswordModalRoom(null);
        onSelectRoom(targetRoomId, inputPassword.trim(), secretInvite);
      } else {
        setPasswordError(data.error || 'Неверный пароль от комнаты');
      }
    } catch (err) {
      setPasswordError('Ошибка проверки пароля. Попробуйте еще раз.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setCreateError('Укажите название комнаты');
      return;
    }

    if (newIsProtected && !newPassword.trim()) {
      setCreateError('Укажите пароль для защищенной комнаты');
      return;
    }

    try {
      setIsCreating(true);
      setCreateError(null);

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (teamToken) {
        headers['Authorization'] = `Bearer ${teamToken}`;
      }

      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDescription.trim(),
          customId: newCustomId.trim() || undefined,
          password: newIsProtected ? newPassword.trim() : undefined,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        if (newIsProtected && newPassword.trim()) {
          try {
            sessionStorage.setItem(`deskovery_pass_${created.id}`, newPassword.trim());
          } catch (e) {}
        }
        setIsCreateModalOpen(false);
        onSelectRoom(
          created.id,
          newIsProtected ? newPassword.trim() : undefined,
          created.inviteToken
        );
      } else {
        const errData = await res.json();
        setCreateError(errData.error || 'Не удалось создать комнату');
      }
    } catch (err) {
      setCreateError('Ошибка сети при создании комнаты');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteRoom = async (room: RoomSummary) => {
    if (room.id === 'main') {
      alert('Главную доску нельзя удалить.');
      return;
    }

    if (!window.confirm(`Вы уверены, что хотите безвозвратно удалить доску "${room.title}"?`)) {
      return;
    }

    try {
      const headers: Record<string, string> = {};
      if (teamToken) headers['Authorization'] = `Bearer ${teamToken}`;

      const res = await fetch(`/api/rooms/${room.id}`, {
        method: 'DELETE',
        headers,
      });

      if (res.ok) {
        setRooms((prev) => prev.filter((r) => r.id !== room.id));
      } else {
        const data = await res.json();
        alert(data.error || 'Не удалось удалить доску');
      }
    } catch (e) {
      alert('Ошибка сети при удалении доски');
    }
  };

  const handleDuplicateRoom = async (roomId: string) => {
    try {
      const headers: Record<string, string> = {};
      if (teamToken) headers['Authorization'] = `Bearer ${teamToken}`;

      const res = await fetch(`/api/rooms/${roomId}/duplicate`, {
        method: 'POST',
        headers,
      });

      if (res.ok) {
        fetchRooms();
      } else {
        const data = await res.json();
        alert(data.error || 'Не удалось клонировать доску');
      }
    } catch (e) {
      alert('Ошибка сети при клонировании доски');
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-sans select-none antialiased transition-colors duration-200 ${
        isDark ? 'bg-neutral-950 text-neutral-100' : 'bg-neutral-50 text-neutral-900'
      }`}
    >
      {/* Top Bar */}
      <header
        className={`h-16 border-b backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20 transition-colors ${
          isDark
            ? 'border-neutral-800 bg-neutral-900/90'
            : 'border-neutral-200 bg-white/90 shadow-2xs'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white font-extrabold text-lg shadow-md border border-indigo-400/20">
            D
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className={`text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                Deskovery
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                Team Workspace
              </span>
            </div>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">Каталог командных досок</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {storageStats && (
            <div
              className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
                isDark
                  ? 'bg-neutral-800/80 border-neutral-700/60 text-neutral-300'
                  : 'bg-neutral-100 border-neutral-200 text-neutral-700'
              }`}
              title={`Занято: ${storageStats.usedFormatted} из ${storageStats.totalLimitFormatted} (${storageStats.usagePercent}%). Файлов медиа: ${storageStats.mediaCount + storageStats.uploadFilesCount}`}
            >
              <HardDrive className="w-3.5 h-3.5 text-indigo-500" />
              <span>
                Свободно:{' '}
                <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {storageStats.freeFormatted}
                </strong>
              </span>
              <div className="w-12 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-700 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    storageStats.usagePercent >= 90
                      ? 'bg-rose-500'
                      : storageStats.usagePercent >= 70
                      ? 'bg-amber-500'
                      : 'bg-indigo-600 dark:bg-indigo-500'
                  }`}
                  style={{ width: `${Math.max(3, storageStats.usagePercent)}%` }}
                />
              </div>
            </div>
          )}

          <button
            onClick={() => {
              fetchRooms();
              fetchStorageStats();
            }}
            className={`p-2 rounded-lg transition-colors border cursor-pointer ${
              isDark
                ? 'bg-neutral-800/80 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 border-neutral-700/60'
                : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-neutral-900 border-neutral-200'
            }`}
            title="Обновить список"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className={`p-2 rounded-lg transition-colors border cursor-pointer ${
                isDark
                  ? 'bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border-neutral-700/60'
                  : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 hover:text-neutral-900 border-neutral-200'
              }`}
              title={isDark ? 'Включить светлую тему' : 'Включить темную тему'}
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400 transition-transform hover:rotate-45" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600 transition-transform hover:-rotate-12" />
              )}
            </button>
          )}

          <button
            onClick={() => {
              setIsCreateModalOpen(true);
              setCreateError(null);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm shadow-md hover:shadow-indigo-500/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Создать комнату</span>
          </button>

          {onLogout && (
            <button
              onClick={onLogout}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                isDark
                  ? 'bg-neutral-800 hover:bg-neutral-700/80 text-neutral-300 hover:text-rose-400 border-neutral-700/60'
                  : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 hover:text-rose-600 border-neutral-200'
              }`}
              title="Выйти из пространства команды"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Выйти</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-8 flex flex-col gap-6">
        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по названию или ID..."
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                isDark
                  ? 'bg-neutral-800/80 border-neutral-700 text-neutral-100 placeholder-neutral-500'
                  : 'bg-white border-neutral-300 text-neutral-900 placeholder-neutral-400'
              }`}
            />
          </div>

          {/* Filter Pills */}
          <div
            className={`flex items-center gap-1.5 p-1 rounded-xl border self-start sm:self-auto ${
              isDark
                ? 'bg-neutral-800/60 border-neutral-700/60'
                : 'bg-neutral-100 border-neutral-200'
            }`}
          >
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                filterType === 'all'
                  ? isDark
                    ? 'bg-neutral-700 text-white shadow-2xs'
                    : 'bg-white text-neutral-900 shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              Все ({rooms.length})
            </button>
            <button
              onClick={() => setFilterType('public')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                filterType === 'public'
                  ? isDark
                    ? 'bg-neutral-700 text-emerald-400 shadow-2xs'
                    : 'bg-white text-emerald-600 shadow-2xs font-semibold'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              <Globe className="w-3 h-3" />
              Открытые
            </button>
            <button
              onClick={() => setFilterType('protected')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                filterType === 'protected'
                  ? isDark
                    ? 'bg-neutral-700 text-indigo-400 shadow-2xs'
                    : 'bg-white text-indigo-600 shadow-2xs font-semibold'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              <Lock className="w-3 h-3" />
              С паролем
            </button>
          </div>
        </div>

        {/* Rooms Grid */}
        {isLoading && rooms.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-neutral-500 gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
            <span className="text-sm">Загрузка комнат...</span>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div
            className={`py-20 flex flex-col items-center justify-center text-center border rounded-2xl p-8 ${
              isDark
                ? 'bg-neutral-800/20 border-neutral-800'
                : 'bg-white border-neutral-200 shadow-xs'
            }`}
          >
            <FolderLock className="w-12 h-12 text-neutral-400 dark:text-neutral-600 mb-3" />
            <h3 className={`text-base font-semibold mb-1 ${isDark ? 'text-neutral-300' : 'text-neutral-800'}`}>Комнаты не найдены</h3>
            <p className="text-sm text-neutral-500 max-w-sm mb-4">
              По вашему запросу ничего не нашлось. Попробуйте изменить фильтр или создайте новую комнату.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterType('all');
                setIsCreateModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors cursor-pointer"
            >
              Создать комнату
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredRooms.map((room) => {
              return (
                <div
                  key={room.id}
                  onClick={() => handleRoomClick(room)}
                  className={`group relative flex flex-col justify-between p-5 rounded-2xl border transition-all duration-200 cursor-pointer shadow-xs hover:shadow-xl ${
                    isDark
                      ? 'bg-neutral-800/50 hover:bg-neutral-800/90 border-neutral-700/50 hover:border-indigo-500/50 hover:shadow-indigo-950/30'
                      : 'bg-white hover:bg-neutral-50 border-neutral-200/90 hover:border-indigo-400 hover:shadow-indigo-500/10'
                  }`}
                >
                  {/* Hover Preview Popover (Appears ONLY on hover) */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-50 transform translate-y-2 group-hover:translate-y-0">
                    <RoomHoverPreview elements={room.previewElements} isDark={isDark} />
                    <div
                      className={`w-3 h-3 transform rotate-45 mx-auto -mt-1.5 border-r border-b ${
                        isDark ? 'bg-neutral-900 border-neutral-750' : 'bg-white border-neutral-300'
                      }`}
                    />
                  </div>

                  <div>
                    {/* Header: Status Badge & Online */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      {room.hasPassword ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
                          <Lock className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
                          Защищена паролем
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                          <Globe className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                          Открытая доска
                        </span>
                      )}

                      <div
                        className={`flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border ${
                          isDark
                            ? 'text-neutral-400 bg-neutral-900/60 border-neutral-700/40'
                            : 'text-neutral-600 bg-neutral-100 border-neutral-200'
                        }`}
                      >
                        <Users className="w-3 h-3 text-neutral-400" />
                        <span>{room.usersCount || 0}</span>
                      </div>
                    </div>

                    {/* Room Title */}
                    <h3
                      className={`text-base font-bold transition-colors line-clamp-1 mb-1.5 ${
                        isDark
                          ? 'text-white group-hover:text-indigo-300'
                          : 'text-neutral-900 group-hover:text-indigo-600'
                      }`}
                    >
                      {room.title}
                    </h3>

                    {/* Room Description */}
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed mb-4 min-h-[32px]">
                      {room.description || 'Интерактивная доска для заметок, диаграмм и совместного планирования.'}
                    </p>
                  </div>

                  {/* Footer */}
                  <div
                    className={`pt-3 border-t flex items-center justify-between ${
                      isDark ? 'border-neutral-700/40' : 'border-neutral-100'
                    }`}
                  >
                    <div className="flex items-center gap-3 text-[11px] text-neutral-500 dark:text-neutral-400">
                      {/* Size Badge */}
                      <div
                        className="flex items-center gap-1 font-mono text-indigo-600 dark:text-indigo-400 font-semibold"
                        title="Размер данных доски на сервере"
                      >
                        <HardDrive className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                        <span>{room.sizeFormatted || '0 Б'}</span>
                      </div>

                      {/* Elements count */}
                      <div className="flex items-center gap-1" title="Количество элементов на доске">
                        <Layers className="w-3 h-3 text-neutral-400 dark:text-neutral-500" />
                        <span>{room.elementsCount || 0}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Duplicate Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateRoom(room.id);
                        }}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          isDark
                            ? 'text-neutral-400 hover:text-white hover:bg-neutral-700/80'
                            : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
                        }`}
                        title="Создать копию доски (шаблон)"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button */}
                      {room.id !== 'main' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRoom(room);
                          }}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Удалить доску"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <div className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform ml-1">
                        <span>{room.hasPassword ? 'Пароль' : 'Войти'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Server Storage Summary Bar */}
        {storageStats && (
          <div
            className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all mt-2 ${
              isDark
                ? 'bg-neutral-900/60 border-neutral-800'
                : 'bg-white border-neutral-200 shadow-2xs'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-neutral-900 dark:text-white">
                    Память сервера для медиа
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                    Свободно {storageStats.freeFormatted}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Использовано {storageStats.usedFormatted} из {storageStats.totalLimitFormatted} • Загружено файлов: {storageStats.uploadFilesCount + storageStats.mediaCount}
                </p>
              </div>
            </div>

            <div className="w-full sm:w-56 flex flex-col gap-1.5 shrink-0">
              <div className="flex items-center justify-between text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                <span>Заполнение диска</span>
                <span>{storageStats.usagePercent}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    storageStats.usagePercent >= 90
                      ? 'bg-rose-500'
                      : storageStats.usagePercent >= 70
                      ? 'bg-amber-500'
                      : 'bg-indigo-600 dark:bg-indigo-500'
                  }`}
                  style={{ width: `${Math.max(2, storageStats.usagePercent)}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL 1: Password Prompt */}
      {passwordModalRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none animate-fade-in">
          <div
            className={`w-full max-w-md rounded-2xl border shadow-2xl p-6 relative transition-colors ${
              isDark
                ? 'bg-neutral-900 border-neutral-700'
                : 'bg-white border-neutral-200'
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>Доступ к закрытой комнате</h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{passwordModalRoom.title}</p>
              </div>
            </div>

            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed mb-4">
              Эта комната защищена паролем или PIN-кодом. Введите секретный код для входа и синхронизации доски.
            </p>

            <form onSubmit={handleVerifyPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Пароль или PIN-код
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={inputPassword}
                    onChange={(e) => {
                      setInputPassword(e.target.value);
                      setPasswordError(null);
                    }}
                    placeholder="Введите секретный код..."
                    autoFocus
                    className={`w-full pl-9 pr-10 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                      isDark
                        ? 'bg-neutral-800 border-neutral-700 text-white'
                        : 'bg-neutral-50 border-neutral-300 text-neutral-900'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 cursor-pointer p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1">
                    <span>⚠️</span> {passwordError}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPasswordModalRoom(null)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    isDark
                      ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isVerifying ? (
                    <span>Проверка...</span>
                  ) : (
                    <>
                      <span>Войти в комнату</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Create Room */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none animate-fade-in">
          <div
            className={`w-full max-w-lg rounded-2xl border shadow-2xl p-6 relative transition-colors ${
              isDark
                ? 'bg-neutral-900 border-neutral-700'
                : 'bg-white border-neutral-200'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-600/10 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>Создание новой комнаты</h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Настройте параметры пространства</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 text-xl font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Название комнаты <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Например: Архитектура проекта или Семейные заметки"
                  autoFocus
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                    isDark
                      ? 'bg-neutral-800 border-neutral-700 text-white'
                      : 'bg-neutral-50 border-neutral-300 text-neutral-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Описание (опционально)
                </label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Краткое описание, о чем эта доска..."
                  className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-all ${
                    isDark
                      ? 'bg-neutral-800 border-neutral-700 text-white'
                      : 'bg-neutral-50 border-neutral-300 text-neutral-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Пользовательский ID комнаты в URL (опционально)
                </label>
                <input
                  type="text"
                  value={newCustomId}
                  onChange={(e) => setNewCustomId(e.target.value)}
                  placeholder="Например: my-secret-sprint"
                  className={`w-full px-3.5 py-2 rounded-xl border text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                    isDark
                      ? 'bg-neutral-800 border-neutral-700 text-white'
                      : 'bg-neutral-50 border-neutral-300 text-neutral-900'
                  }`}
                />
                <p className="text-[11px] text-neutral-500 mt-1">
                  Ссылка будет: deskovery.duckdns.org/?room=
                  {newCustomId.trim() || 'my-board'}
                </p>
              </div>

              {/* Password Protection Toggle */}
              <div
                className={`p-3.5 rounded-xl border space-y-3 ${
                  isDark
                    ? 'bg-neutral-800/80 border-neutral-700/80'
                    : 'bg-neutral-50 border-neutral-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className={`w-4 h-4 ${newIsProtected ? 'text-indigo-600 dark:text-indigo-400' : 'text-neutral-400'}`} />
                    <div>
                      <span className={`text-xs font-semibold block ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                        Защитить комнату паролем или PIN-кодом
                      </span>
                      <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        Только пользователи со знанием пароля смогут войти
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={newIsProtected}
                    onChange={(e) => setNewIsProtected(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                  />
                </div>

                {newIsProtected && (
                  <div className={`pt-2 border-t ${isDark ? 'border-neutral-700/60' : 'border-neutral-200'}`}>
                    <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Секретный пароль или PIN
                    </label>
                    <input
                      type="text"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Придумайте пароль для входа..."
                      className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        isDark
                          ? 'bg-neutral-900 border-neutral-700 text-white'
                          : 'bg-white border-neutral-300 text-neutral-900'
                      }`}
                    />
                  </div>
                )}
              </div>

              {createError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs">
                  {createError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    isDark
                      ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isCreating ? 'Создание...' : 'Создать комнату'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
