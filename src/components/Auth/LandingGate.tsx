import React, { useState } from 'react';
import {
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Layers,
  KeyRound,
  Sun,
  Moon,
} from 'lucide-react';

interface LandingGateProps {
  onSuccessLogin: (token: string, remember: boolean) => void;
  onEnterDirectRoom?: (roomId: string) => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export const LandingGate: React.FC<LandingGateProps> = ({
  onSuccessLogin,
  onEnterDirectRoom,
  theme = 'dark',
  onToggleTheme,
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

  const isDark = theme === 'dark';

  return (
    <div
      className={`min-h-screen flex flex-col justify-between selection:bg-indigo-500 selection:text-white transition-colors duration-200 ${
        isDark ? 'bg-neutral-950 text-neutral-100' : 'bg-neutral-50 text-neutral-900'
      }`}
    >
      {/* Background ambient lighting */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl ${isDark ? 'bg-indigo-600/20' : 'bg-indigo-400/20'}`} />
        <div className={`absolute top-1/3 -right-40 w-96 h-96 rounded-full blur-3xl ${isDark ? 'bg-purple-600/15' : 'bg-purple-300/20'}`} />
        <div className={`absolute -bottom-40 left-1/3 w-96 h-96 rounded-full blur-3xl ${isDark ? 'bg-blue-600/15' : 'bg-blue-300/20'}`} />
        {/* Subtle grid pattern */}
        <div
          className={`absolute inset-0 bg-[size:32px_32px] ${
            isDark
              ? 'bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)]'
              : 'bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)]'
          }`}
        />
      </div>

      {/* Header */}
      <header
        className={`relative z-10 border-b backdrop-blur-md px-6 py-4 transition-colors ${
          isDark
            ? 'border-neutral-800/80 bg-neutral-900/60'
            : 'border-neutral-200/80 bg-white/70'
        }`}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20 ring-1 ring-white/20">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                  Deskovery
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20">
                  Team Workspace
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Командная виртуальная доска</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
              <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              <span className="hidden sm:inline">Защищенный контур</span>
            </div>

            {/* Theme Toggle Button */}
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 hover:bg-neutral-200 dark:hover:bg-neutral-700/80 text-neutral-700 dark:text-neutral-200 transition-colors border border-neutral-200 dark:border-neutral-700/60 cursor-pointer"
                title={isDark ? 'Включить светлую тему' : 'Включить темную тему'}
              >
                {isDark ? (
                  <Sun className="w-4 h-4 text-amber-400 transition-transform hover:rotate-45" />
                ) : (
                  <Moon className="w-4 h-4 text-indigo-600 transition-transform hover:-rotate-12" />
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content: Clean Centered Login */}
      <main className="relative z-10 max-w-md w-full mx-auto px-6 py-12 flex-1 flex flex-col items-center justify-center">
        {/* Clean Login Card */}
        <div className="w-full">
          <div
            className={`rounded-2xl border backdrop-blur-xl p-6 sm:p-8 shadow-2xl transition-all duration-200 ${
              isDark
                ? 'bg-neutral-900/90 border-neutral-800'
                : 'bg-white border-neutral-200/90'
            }`}
          >
            <div className="flex items-center gap-3.5 mb-6">
              <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h1 className={`text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                  Вход в пространство
                </h1>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Введите пароль команды для доступа к доскам
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs leading-relaxed flex items-start gap-2">
                <span className="font-bold text-rose-500">•</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Пароль команды
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    placeholder="Введите командный пароль..."
                    autoFocus
                    required
                    className={`w-full pl-10 pr-11 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                      isDark
                        ? 'bg-neutral-950 border-neutral-700 text-white placeholder-neutral-500'
                        : 'bg-neutral-50 border-neutral-300 text-neutral-900 placeholder-neutral-400'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-neutral-600 dark:text-neutral-400">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span>Запомнить на этом устройстве</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-md hover:shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <span>Проверка доступа...</span>
                ) : (
                  <>
                    <span>Войти в пространство</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Guest Room Entry Option */}
            {onEnterDirectRoom && (
              <div className="mt-6 pt-5 border-t border-neutral-200 dark:border-neutral-800/80 text-center">
                {!showGuestDirect ? (
                  <button
                    type="button"
                    onClick={() => setShowGuestDirect(true)}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    У вас есть прямая ссылка или имя комнаты?
                  </button>
                ) : (
                  <form onSubmit={handleGuestSubmit} className="space-y-2 text-left">
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      Прямой вход в комнату:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={guestRoomInput}
                        onChange={(e) => setGuestRoomInput(e.target.value)}
                        placeholder="Например: sprint-9"
                        className={`flex-1 px-3 py-2 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-indigo-500 ${
                          isDark
                            ? 'bg-neutral-950 border-neutral-700 text-white'
                            : 'bg-neutral-50 border-neutral-300 text-neutral-900'
                        }`}
                      />
                      <button
                        type="submit"
                        className="px-3 py-2 bg-neutral-800 dark:bg-neutral-700 hover:bg-neutral-700 dark:hover:bg-neutral-600 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Перейти
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center text-xs text-neutral-400 dark:text-neutral-500">
        <p>Deskovery Workspace</p>
      </footer>
    </div>
  );
};
