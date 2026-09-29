import React, { useState } from 'react';
import {
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Users,
  Sparkles,
  Zap,
  Globe,
  Layers,
  KeyRound,
} from 'lucide-react';

interface LandingGateProps {
  onSuccessLogin: (token: string, remember: boolean) => void;
  onEnterDirectRoom?: (roomId: string) => void;
}

export const LandingGate: React.FC<LandingGateProps> = ({
  onSuccessLogin,
  onEnterDirectRoom,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quick guest room entry toggle
  const [showGuestDirect, setShowGuestDirect] = useState(false);
  const [guestRoomInput, setGuestRoomInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Введите пароль команды для входа');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const res = await fetch('/api/auth/team-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.ok && data.token) {
        onSuccessLogin(data.token, rememberMe);
      } else {
        setError(data.error || 'Неверный командный пароль. Попробуйте еще раз.');
      }
    } catch (err) {
      setError('Ошибка сети при проверке пароля команды');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (guestRoomInput.trim() && onEnterDirectRoom) {
      onEnterDirectRoom(guestRoomInput.trim());
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl" />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-neutral-800/80 bg-neutral-900/60 backdrop-blur-md px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-white">Deskovery</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Team Workspace
                </span>
              </div>
              <p className="text-xs text-neutral-400">Командная виртуальная доска</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Закрытый защищенный контур</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 py-12 flex-1 flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-16">
        {/* Left Side: Product presentation */}
        <div className="flex-1 max-w-xl text-center lg:text-left space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-800/90 border border-neutral-700/80 text-xs font-medium text-neutral-300 shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span>Приватное пространство для проектов вашей команды</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Свобода идей.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400">
              Полный контроль
            </span>{' '}
            для вашей команды.
          </h1>

          <p className="text-sm sm:text-base text-neutral-400 leading-relaxed">
            Архитектурные схемы, канбан-спринты, брейнштормы и интерактивные заметки. Только участники с командным ключом имеют доступ к общему каталогу и созданию новых пространств.
          </p>

          {/* 3 Value Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-neutral-800/50 border border-neutral-700/50 backdrop-blur-xs text-left">
              <Zap className="w-4 h-4 text-amber-400 mb-2" />
              <div className="text-xs font-semibold text-neutral-200">Real-Time</div>
              <div className="text-[11px] text-neutral-400 mt-0.5">Синхронные курсоры и стикеры без лагов</div>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-800/50 border border-neutral-700/50 backdrop-blur-xs text-left">
              <Lock className="w-4 h-4 text-indigo-400 mb-2" />
              <div className="text-xs font-semibold text-neutral-200">Приватность</div>
              <div className="text-[11px] text-neutral-400 mt-0.5">Каталог закрыт от посторонних гостей</div>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-800/50 border border-neutral-700/50 backdrop-blur-xs text-left">
              <Globe className="w-4 h-4 text-emerald-400 mb-2" />
              <div className="text-xs font-semibold text-neutral-200">Ссылки-гости</div>
              <div className="text-[11px] text-neutral-400 mt-0.5">1-click доступ для друзей без пароля</div>
            </div>
          </div>
        </div>

        {/* Right Side: Login Card */}
        <div className="w-full max-w-md">
          <div className="bg-neutral-800/90 backdrop-blur-xl border border-neutral-700/80 rounded-2xl p-7 shadow-2xl shadow-black/50 ring-1 ring-white/10">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-neutral-700/60">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Вход в пространство команды</h2>
                <p className="text-xs text-neutral-400">Введите общий пароль для доступа</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2 animate-shake">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Пароль команды (Team Access Key)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Введите пароль команды..."
                    autoFocus
                    className="w-full bg-neutral-900/80 border border-neutral-700 rounded-xl pl-9 pr-10 py-2.5 text-sm text-white placeholder-neutral-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-neutral-300 select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-neutral-700 text-indigo-600 focus:ring-indigo-500 bg-neutral-900"
                  />
                  <span>Запомнить на этом устройстве</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Проверка ключа...</span>
                  </>
                ) : (
                  <>
                    <span>Войти в рабочее пространство</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Direct room jump for guests */}
            <div className="mt-6 pt-4 border-t border-neutral-700/60 text-center">
              {!showGuestDirect ? (
                <button
                  type="button"
                  onClick={() => setShowGuestDirect(true)}
                  className="text-xs text-neutral-400 hover:text-indigo-300 transition-colors underline decoration-dotted underline-offset-4"
                >
                  Вам прислали ссылку на отдельную доску?
                </button>
              ) : (
                <form onSubmit={handleGuestSubmit} className="space-y-2 text-left animate-fade-in">
                  <div className="text-xs text-neutral-300 font-medium">
                    Прямой переход к комнате (для гостей):
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={guestRoomInput}
                      onChange={(e) => setGuestRoomInput(e.target.value)}
                      placeholder="Имя или ID комнаты..."
                      className="flex-1 bg-neutral-900/90 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-neutral-500 outline-none focus:border-indigo-500 font-mono"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-neutral-700 hover:bg-neutral-600 rounded-lg text-xs font-medium text-white transition-colors"
                    >
                      Перейти
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-neutral-800/80 bg-neutral-900/60 backdrop-blur-md px-6 py-4 text-center text-xs text-neutral-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Deskovery &copy; 2026. Приватное командное пространство.</span>
          <span className="text-neutral-400">Шифрование данных и безопасный WebSocket протокол</span>
        </div>
      </footer>
    </div>
  );
};
