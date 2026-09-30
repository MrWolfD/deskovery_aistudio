import React, { useState, useRef, useEffect } from 'react';
import {
  FileVideo,
  FileAudio,
  Image as ImageIcon,
  Upload,
  Link,
  X,
  Play,
  Music,
  Check,
  AlertCircle,
  HardDrive,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { BoardElement } from '../../types/board';
import { ServerStorageStats } from '../../types/storage';

interface MediaUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMediaElement: (element: Partial<BoardElement>) => void;
}

export const MediaUploadModal: React.FC<MediaUploadModalProps> = ({
  isOpen,
  onClose,
  onAddMediaElement,
}) => {
  const [activeTab, setActiveTab] = useState<'video' | 'audio' | 'image'>('video');
  const [urlInput, setUrlInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Server Storage Stats
  const [storageStats, setStorageStats] = useState<ServerStorageStats | null>(null);
  const [isLoadingStorage, setIsLoadingStorage] = useState(false);
  const [isUploadingToServer, setIsUploadingToServer] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchStorageStats = async () => {
    try {
      setIsLoadingStorage(true);
      const res = await fetch('/api/server/storage');
      if (res.ok) {
        const data = await res.json();
        setStorageStats(data);
      }
    } catch (e) {
      console.warn('Could not fetch server storage status:', e);
    } finally {
      setIsLoadingStorage(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStorageStats();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const resetState = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUrlInput('');
    setNameInput('');
    setErrorMsg(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFile = (file: File) => {
    setErrorMsg(null);
    let type: 'video' | 'audio' | 'image' = activeTab;

    if (file.type.startsWith('video/')) {
      type = 'video';
      setActiveTab('video');
    } else if (file.type.startsWith('audio/')) {
      type = 'audio';
      setActiveTab('audio');
    } else if (file.type.startsWith('image/')) {
      type = 'image';
      setActiveTab('image');
    }

    setSelectedFile(file);
    setNameInput(file.name);

    // Read as DataURL for immediate embedding
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreviewUrl(result);
    };
    reader.onerror = () => {
      setErrorMsg('Не удалось прочитать файл');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalUrl = previewUrl || urlInput.trim();
    if (!finalUrl) {
      setErrorMsg('Пожалуйста, выберите файл или укажите прямую ссылку');
      return;
    }

    const title =
      nameInput.trim() ||
      (activeTab === 'video'
        ? 'Видео'
        : activeTab === 'audio'
        ? 'Аудиозапись'
        : 'Изображение');

    // If local file was selected, upload to server disk
    if (selectedFile && previewUrl && previewUrl.startsWith('data:')) {
      try {
        setIsUploadingToServer(true);
        setErrorMsg(null);
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: selectedFile.name,
            dataUrl: previewUrl,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.url) {
            finalUrl = data.url;
          }
          if (data.storage) {
            setStorageStats(data.storage);
          }
        } else {
          const errData = await res.json().catch(() => null);
          if (errData && errData.error) {
            setErrorMsg(errData.error);
            setIsUploadingToServer(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Direct server upload fallback to DataURL:', err);
      } finally {
        setIsUploadingToServer(false);
      }
    }

    if (activeTab === 'video') {
      onAddMediaElement({
        type: 'video',
        mediaType: 'video',
        mediaUrl: finalUrl,
        mediaName: title,
        width: 480,
        height: 320,
        borderRadius: 12,
        loop: false,
        isMuted: false,
      });
    } else if (activeTab === 'audio') {
      onAddMediaElement({
        type: 'audio',
        mediaType: 'audio',
        mediaUrl: finalUrl,
        mediaName: title,
        width: 360,
        height: 120,
        borderRadius: 16,
        loop: false,
        isMuted: false,
      });
    } else {
      onAddMediaElement({
        type: 'image',
        imageUrl: finalUrl,
        imageAlt: title,
        width: 400,
        height: 300,
        borderRadius: 8,
      });
    }

    handleClose();
  };

  const getAcceptTypes = () => {
    if (activeTab === 'video') return 'video/mp4,video/webm,video/ogg,video/quicktime';
    if (activeTab === 'audio') return 'audio/mp3,audio/wav,audio/ogg,audio/aac,audio/mpeg,audio/m4a';
    return 'image/png,image/jpeg,image/svg+xml,image/webp,image/gif';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-neutral-200/90 dark:border-slate-800 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-200/80 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-neutral-800 dark:text-slate-100">
                Загрузка медиа-файла на доску
              </h2>
              <p className="text-xs text-neutral-500 dark:text-slate-400">
                Видео, аудио или изображение с быстрым предпросмотром
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-slate-200 hover:bg-neutral-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-neutral-200/80 dark:border-slate-800 px-5 pt-3 gap-2 bg-neutral-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={() => {
              setActiveTab('video');
              resetState();
            }}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-colors cursor-pointer ${
              activeTab === 'video'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-neutral-500 dark:text-slate-400 hover:text-neutral-800 dark:hover:text-slate-200'
            }`}
          >
            <FileVideo className="w-4 h-4" />
            <span>Видео</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('audio');
              resetState();
            }}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-colors cursor-pointer ${
              activeTab === 'audio'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-neutral-500 dark:text-slate-400 hover:text-neutral-800 dark:hover:text-slate-200'
            }`}
          >
            <FileAudio className="w-4 h-4" />
            <span>Аудио</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('image');
              resetState();
            }}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-colors cursor-pointer ${
              activeTab === 'image'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-neutral-500 dark:text-slate-400 hover:text-neutral-800 dark:hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Изображение</span>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-sm">
          {/* Server Storage Capacity Card */}
          {storageStats && (
            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-slate-800/60 border border-neutral-200 dark:border-slate-700/80 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-neutral-800 dark:text-slate-200">
                  <HardDrive className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Память на сервере</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-neutral-500 dark:text-slate-400 text-[11px]">
                    Доступно:{' '}
                    <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                      {storageStats.freeFormatted}
                    </strong>
                  </span>
                  <button
                    type="button"
                    onClick={fetchStorageStats}
                    disabled={isLoadingStorage}
                    className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-slate-700 text-neutral-400 hover:text-neutral-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    title="Обновить информацию о хранилище"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStorage ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Storage progress bar */}
              <div className="space-y-1">
                <div className="w-full h-2 rounded-full bg-neutral-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      storageStats.usagePercent >= 90
                        ? 'bg-rose-500'
                        : storageStats.usagePercent >= 70
                        ? 'bg-amber-500'
                        : 'bg-indigo-600 dark:bg-indigo-500'
                    }`}
                    style={{ width: `${Math.max(1, storageStats.usagePercent)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-slate-400">
                  <span>
                    Занято: {storageStats.usedFormatted} ({storageStats.usagePercent}%)
                  </span>
                  <span>Лимит: {storageStats.totalLimitFormatted}</span>
                </div>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept={getAcceptTypes()}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />

          {/* Drag & Drop Box */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) handleFile(file);
            }}
            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30'
                : selectedFile
                ? 'border-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20'
                : 'border-neutral-300 dark:border-slate-700 hover:border-neutral-400 dark:hover:border-slate-600 bg-neutral-50 dark:bg-slate-800/40'
            }`}
          >
            {selectedFile ? (
              <div className="flex flex-col items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <Check className="w-8 h-8" />
                <div className="text-xs font-semibold text-neutral-800 dark:text-slate-200">
                  {selectedFile.name}
                </div>
                <div className="text-[11px] text-neutral-500 dark:text-slate-400">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Нажмите, чтобы выбрать другой файл
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  {activeTab === 'video' ? (
                    <FileVideo className="w-5 h-5" />
                  ) : activeTab === 'audio' ? (
                    <FileAudio className="w-5 h-5" />
                  ) : (
                    <ImageIcon className="w-5 h-5" />
                  )}
                </div>
                <div className="text-xs font-medium text-neutral-700 dark:text-slate-300">
                  Нажмите для выбора файла или перетащите сюда
                </div>
                <div className="text-[11px] text-neutral-400 dark:text-slate-500">
                  {activeTab === 'video' && 'Поддерживаются MP4, WebM, QuickTime (MOV)'}
                  {activeTab === 'audio' && 'Поддерживаются MP3, WAV, OGG, AAC'}
                  {activeTab === 'image' && 'Поддерживаются PNG, JPG, SVG, WebP, GIF'}
                </div>
              </div>
            )}
          </div>

          {/* Quick Preview if available */}
          {previewUrl && (
            <div className="p-3 bg-neutral-100 dark:bg-slate-800 rounded-xl flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-black flex items-center justify-center overflow-hidden shrink-0">
                {activeTab === 'video' ? (
                  <video src={previewUrl} className="w-full h-full object-cover" muted />
                ) : activeTab === 'audio' ? (
                  <Music className="w-6 h-6 text-indigo-400" />
                ) : (
                  <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-medium text-neutral-800 dark:text-slate-200 block truncate">
                  Предпросмотр готов
                </span>
                <span className="text-[11px] text-neutral-500 dark:text-slate-400">
                  Будет добавлен прямо на доску с интерактивным плеером
                </span>
              </div>
            </div>
          )}

          {/* Or Direct URL Input */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-semibold text-neutral-700 dark:text-slate-300 flex items-center gap-1">
                <Link className="w-3.5 h-3.5 text-neutral-400" />
                Или вставьте прямую ссылку (URL):
              </span>
            </div>
            <input
              type="url"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                if (e.target.value.trim()) setSelectedFile(null);
              }}
              placeholder={
                activeTab === 'video'
                  ? 'https://youtube.com/watch?v=... или ссылка на .mp4'
                  : activeTab === 'audio'
                  ? 'https://example.com/audio.mp3 или ссылка на аудио'
                  : 'https://example.com/image.png'
              }
              className="w-full bg-white dark:bg-slate-900 border border-neutral-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-neutral-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-1.5 flex items-center gap-1 font-medium">
              <span>💡</span>
              <span>Можно также просто нажать Ctrl+V на доске для вставки любого медиа или ссылки!</span>
            </p>
          </div>

          {/* Title / Name */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-slate-300 mb-1">
              Название (отображается в карточке)
            </label>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Название файла..."
              className="w-full bg-white dark:bg-slate-900 border border-neutral-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-neutral-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 p-2.5 rounded-lg border border-rose-200 dark:border-rose-900">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-600 dark:text-slate-400 hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isUploadingToServer}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              {isUploadingToServer && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isUploadingToServer ? 'Сохранение...' : 'Добавить на доску'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
