import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';

export interface RoomSummary {
  id: string;
  title: string;
  description: string;
  hasPassword: boolean;
  usersCount: number;
  elementsCount: number;
  createdAt: number;
  updatedAt: number;
}

interface LobbyPageProps {
  onSelectRoom: (roomId: string, password?: string, inviteToken?: string) => void;
  initialError?: string | null;
  teamToken?: string;
  onLogout?: () => void;
}

export const LobbyPage: React.FC<LobbyPageProps> = ({
  onSelectRoom,
  initialError,
  teamToken,
  onLogout,
}) => {
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'public' | 'protected'>('all');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [passwordModalRoom, setPasswordModalRoom] = useState<RoomSummary | null>(null);

  // Password Prompt Modal
  const [inputPassword, setInputPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(initialError || null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Create Room Form
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCustomId, setNewCustomId] = useState('');
  const [newIsProtected, setNewIsProtected] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Fetch rooms list from API
  const fetchRooms = async () => {
    try {
      setIsLoading(true);
      const headers: Record<string, string> = {};
      if (teamToken) {
        headers['Authorization'] = `Bearer ${teamToken}`;
      }

      const res = await fetch('/api/rooms', { headers });
      if (res.status === 401 && onLogout) {
        onLogout();
        return;
      }

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.rooms)) {
          setRooms(data.rooms);
        }
      }
    } catch (err) {
      console.warn('Could not fetch rooms from server, using local fallback:', err);
      // Fallback local rooms if backend is offline
      setRooms([
        {
          id: 'main',
          title: 'Общая доска команды',
          description: 'Главное открытое пространство для заметок и брейнштормов',
          hasPassword: false,
          usersCount: 1,
          elementsCount: 0,
          createdAt: Date.now() - 3600000,
          updatedAt: Date.now(),
        },
        {
          id: 'sprint-planning',
          title: 'Командный спринт (Приватная)',
          description: 'Закрытая доска для спринтов и планов команды (Пароль: 1234)',
          hasPassword: true,
          usersCount: 0,
          elementsCount: 0,
          createdAt: Date.now() - 7200000,
          updatedAt: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  // Filtered rooms
  const filteredRooms = rooms.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterType === 'public') return !r.hasPassword;
    if (filterType === 'protected') return r.hasPassword;
    return true;
  });

  const handleRoomClick = (room: RoomSummary) => {
    if (!room.hasPassword) {
      // Public room, join immediately
      onSelectRoom(room.id);
    } else {
      // Check if password was already remembered in this session
      const savedPass = sessionStorage.getItem(`deskovery_pass_${room.id}`);
      if (savedPass) {
        onSelectRoom(room.id, savedPass);
      } else {
        // Open password prompt
        setPasswordModalRoom(room);
        setInputPassword('');
        setPasswordError(null);
        setShowPassword(false);
      }
    }
  };

  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalRoom) return;

    if (!inputPassword.trim()) {
      setPasswordError('Пожалуйста, введите пароль или PIN-код');
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
        // Remember password in session
        try {
          sessionStorage.setItem(`deskovery_pass_${passwordModalRoom.id}`, inputPassword.trim());
        } catch (e) {}

        const targetRoomId = passwordModalRoom.id;
        const pass = inputPassword.trim();
        setPasswordModalRoom(null);
        onSelectRoom(targetRoomId, pass, data.inviteToken);
      } else {
        setPasswordError(data.error || 'Неверный пароль. Попробуйте еще раз.');
      }
    } catch (err) {
      setPasswordError('Ошибка соединения с сервером при проверке пароля');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setCreateError('Введите название комнаты');
      return;
    }

    if (newIsProtected && !newPassword.trim()) {
      setCreateError('Укажите пароль или PIN-код для защиты');
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
          password: newIsProtected ? newPassword.trim() : '',
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

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 flex flex-col font-sans select-none antialiased">
      {/* Top Bar */}
      <header className="h-16 border-b border-neutral-800 bg-neutral-900/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white font-extrabold text-lg shadow-md border border-indigo-400/20">
            D
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-white tracking-tight">Deskovery</span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Team Workspace
              </span>
            </div>
            <span className="text-xs text-neutral-400">Каталог командных досок</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchRooms}
            className="p-2 rounded-lg bg-neutral-800/80 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors border border-neutral-700/60"
            title="Обновить список"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

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
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700/80 text-neutral-300 hover:text-rose-400 text-xs font-medium border border-neutral-700/60 transition-colors cursor-pointer"
              title="Выйти из пространства команды"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Выйти</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-8 flex flex-col gap-8">
        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950/40 via-neutral-900 to-neutral-900 border border-indigo-500/20 p-6 md:p-8 shadow-xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-3">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Приватность и совместная работа
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-2">
              Выберите доску или создайте защищенную комнату
            </h1>
            <p className="text-sm md:text-base text-neutral-400 leading-relaxed">
              Открытые доски доступны для всех пользователей по ссылке, а закрытые комнаты надежно защищены
              паролем или PIN-кодом на стороне сервера.
            </p>
          </div>
        </div>

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
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-800/80 border border-neutral-700 text-neutral-100 placeholder-neutral-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-neutral-800/60 p-1 rounded-xl border border-neutral-700/60 self-start sm:self-auto">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterType === 'all'
                  ? 'bg-neutral-700 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Все ({rooms.length})
            </button>
            <button
              onClick={() => setFilterType('public')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterType === 'public'
                  ? 'bg-neutral-700 text-emerald-400 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Globe className="w-3 h-3" />
              Открытые
            </button>
            <button
              onClick={() => setFilterType('protected')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterType === 'protected'
                  ? 'bg-neutral-700 text-indigo-400 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
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
          <div className="py-20 flex flex-col items-center justify-center text-center bg-neutral-800/20 border border-neutral-800 rounded-2xl p-8">
            <FolderLock className="w-12 h-12 text-neutral-600 mb-3" />
            <h3 className="text-base font-semibold text-neutral-300 mb-1">Комнаты не найдены</h3>
            <p className="text-sm text-neutral-500 max-w-sm mb-4">
              По вашему запросу ничего не нашлось. Попробуйте изменить фильтр или создайте новую комнату.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterType('all');
                setIsCreateModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
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
                  className="group relative flex flex-col justify-between p-5 rounded-2xl bg-neutral-800/50 hover:bg-neutral-800/90 border border-neutral-700/50 hover:border-indigo-500/50 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-xl hover:shadow-indigo-950/30"
                >
                  <div>
                    {/* Header: Status Badge & Online */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      {room.hasPassword ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          <Lock className="w-3 h-3 text-indigo-400" />
                          Защищена паролем
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <Globe className="w-3 h-3 text-emerald-400" />
                          Открытая доска
                        </span>
                      )}

                      <div className="flex items-center gap-1.5 text-xs text-neutral-400 bg-neutral-900/60 px-2 py-0.5 rounded-full border border-neutral-700/40">
                        <Users className="w-3 h-3 text-neutral-400" />
                        <span>{room.usersCount || 0}</span>
                      </div>
                    </div>

                    {/* Room Title */}
                    <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1 mb-1.5">
                      {room.title}
                    </h3>

                    {/* Room Description */}
                    <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed mb-4 min-h-[32px]">
                      {room.description || 'Интерактивная доска для заметок, диаграмм и совместного планирования.'}
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="pt-3 border-t border-neutral-700/40 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[11px] text-neutral-500">
                      <Clock className="w-3 h-3" />
                      <span>ID: {room.id}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 group-hover:translate-x-1 transition-transform">
                      <span>{room.hasPassword ? 'Ввести пароль' : 'Войти'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* MODAL 1: Password Prompt */}
      {passwordModalRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-neutral-900 border border-neutral-700 shadow-2xl p-6 relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Доступ к закрытой комнате</h3>
                <p className="text-xs text-neutral-400">{passwordModalRoom.title}</p>
              </div>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed mb-4">
              Эта комната защищена паролем или PIN-кодом. Введите секретный код для входа и синхронизации доски.
            </p>

            <form onSubmit={handleVerifyPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Пароль или PIN-код
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={inputPassword}
                    onChange={(e) => {
                      setInputPassword(e.target.value);
                      setPasswordError(null);
                    }}
                    placeholder="Введите секретный код..."
                    autoFocus
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-xs text-rose-400 mt-1.5 flex items-center gap-1">
                    <span>⚠️</span> {passwordError}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPasswordModalRoom(null)}
                  className="px-4 py-2 rounded-xl text-neutral-400 hover:text-neutral-200 text-xs font-medium hover:bg-neutral-800 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md transition-all"
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Проверка...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Открыть доску</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-neutral-900 border border-neutral-700 shadow-2xl p-6 relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Создание новой комнаты</h3>
                  <p className="text-xs text-neutral-400">Настройте параметры пространства</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-neutral-500 hover:text-neutral-300 text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Название комнаты <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Например: Архитектура проекта или Семейные заметки"
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Описание (опционально)
                </label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Краткое описание, о чем эта доска..."
                  className="w-full px-3.5 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Пользовательский ID комнаты в URL (опционально)
                </label>
                <input
                  type="text"
                  value={newCustomId}
                  onChange={(e) => setNewCustomId(e.target.value)}
                  placeholder="Например: my-secret-sprint"
                  className="w-full px-3.5 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-xs font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
                <p className="text-[11px] text-neutral-500 mt-1">
                  Ссылка будет: deskovery.duckdns.org/?room=
                  {newCustomId.trim() || 'my-board'}
                </p>
              </div>

              {/* Password Protection Toggle */}
              <div className="p-3.5 rounded-xl bg-neutral-800/80 border border-neutral-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className={`w-4 h-4 ${newIsProtected ? 'text-indigo-400' : 'text-neutral-500'}`} />
                    <div>
                      <span className="text-xs font-semibold text-white block">
                        Защитить комнату паролем или PIN-кодом
                      </span>
                      <span className="text-[11px] text-neutral-400">
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
                  <div className="pt-2 border-t border-neutral-700/60">
                    <label className="block text-xs font-medium text-neutral-300 mb-1">
                      Секретный пароль или PIN
                    </label>
                    <input
                      type="text"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Например: 1234 или секретное-слово"
                      className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                )}
              </div>

              {createError && (
                <p className="text-xs text-rose-400 flex items-center gap-1">
                  <span>⚠️</span> {createError}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-neutral-400 hover:text-neutral-200 text-xs font-medium hover:bg-neutral-800 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md transition-all"
                >
                  {isCreating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Создание...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Создать и открыть доску</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
