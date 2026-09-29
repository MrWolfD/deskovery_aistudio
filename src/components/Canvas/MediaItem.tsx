import React, { useState, useRef, useEffect } from 'react';
import { BoardElement } from '../../types/board';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
  Maximize2,
  Video as VideoIcon,
  Music,
  AlertCircle,
  FileVideo,
  FileAudio,
} from 'lucide-react';

interface MediaItemProps {
  element: BoardElement;
  isSelected: boolean;
  onUpdate: (updates: Partial<BoardElement>) => void;
}

export const MediaItem: React.FC<MediaItemProps> = ({
  element,
  isSelected,
  onUpdate,
}) => {
  const isVideo = element.type === 'video' || element.mediaType === 'video';
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(element.isMuted ?? false);
  const [isLoop, setIsLoop] = useState(element.loop ?? false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(element.mediaDuration ?? 0);
  const [loadError, setLoadError] = useState(false);

  // Sync mute and loop changes to parent element
  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    onUpdate({ isMuted: nextMuted });
    if (isVideo && videoRef.current) videoRef.current.muted = nextMuted;
    if (!isVideo && audioRef.current) audioRef.current.muted = nextMuted;
  };

  const toggleLoop = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextLoop = !isLoop;
    setIsLoop(nextLoop);
    onUpdate({ loop: nextLoop });
    if (isVideo && videoRef.current) videoRef.current.loop = nextLoop;
    if (!isVideo && audioRef.current) audioRef.current.loop = nextLoop;
  };

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isVideo && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
    } else if (!isVideo && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(() => {});
      }
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    const targetTime = pct * duration;
    setCurrentTime(targetTime);

    if (isVideo && videoRef.current) {
      videoRef.current.currentTime = targetTime;
    } else if (!isVideo && audioRef.current) {
      audioRef.current.currentTime = targetTime;
    }
  };

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleFullScreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  // Helper for YouTube embed
  const getYouTubeEmbedUrl = (url?: string): string | null => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube-nocookie.com/embed/${match[2]}?autoplay=0&rel=0`;
    }
    return null;
  };

  const youtubeEmbedUrl = isVideo ? getYouTubeEmbedUrl(element.mediaUrl) : null;

  if (loadError || !element.mediaUrl) {
    return (
      <div
        className={`w-full h-full bg-slate-900/90 text-white rounded-xl border border-slate-700 flex flex-col items-center justify-center p-4 text-center select-none ${
          isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''
        }`}
      >
        <AlertCircle className="w-8 h-8 text-rose-400 mb-2" />
        <div className="text-xs font-semibold text-rose-300">
          {isVideo ? 'Видео недоступно' : 'Аудио недоступно'}
        </div>
        <div className="text-[11px] text-slate-400 mt-1 max-w-[200px] truncate">
          {element.mediaName || 'Медиафайл'}
        </div>
      </div>
    );
  }

  // ================= YOUTUBE EMBED =================
  if (isVideo && youtubeEmbedUrl) {
    return (
      <div
        className={`w-full h-full select-none flex flex-col bg-slate-950 rounded-xl overflow-hidden shadow-xl border border-slate-800 group ${
          isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''
        }`}
        style={{
          borderRadius: `${element.borderRadius ?? 12}px`,
          opacity: element.opacity ?? 1,
        }}
      >
        <div className="h-8 bg-slate-900/95 border-b border-slate-800/80 px-2.5 flex items-center justify-between text-xs text-slate-300 shrink-0 select-none">
          <div className="flex items-center gap-1.5 min-w-0 pr-2">
            <VideoIcon className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span className="truncate font-medium text-[11px] text-slate-200">
              {element.mediaName || 'YouTube видео'}
            </span>
          </div>
          <a
            href={element.mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-[10px] text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1"
          >
            <span>Открыть</span>
          </a>
        </div>
        <div className="relative flex-1 bg-black min-h-0">
          <iframe
            src={youtubeEmbedUrl}
            title={element.mediaName || 'YouTube video player'}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </div>
    );
  }

  // ================= NATIVE VIDEO PLAYER =================
  if (isVideo) {
    return (
      <div
        className={`w-full h-full select-none flex flex-col bg-slate-950 rounded-xl overflow-hidden shadow-xl border border-slate-800 group ${
          isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''
        }`}
        style={{
          borderRadius: `${element.borderRadius ?? 12}px`,
          opacity: element.opacity ?? 1,
        }}
      >
        {/* Video Header Bar */}
        <div className="h-8 bg-slate-900/95 border-b border-slate-800/80 px-2.5 flex items-center justify-between text-xs text-slate-300 shrink-0 select-none">
          <div className="flex items-center gap-1.5 min-w-0 pr-2">
            <FileVideo className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="truncate font-medium text-[11px] text-slate-200">
              {element.mediaName || 'Видеофайл'}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={toggleLoop}
              className={`p-1 rounded-md transition-colors ${
                isLoop ? 'text-indigo-400 bg-indigo-950/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              title={isLoop ? 'Зацикливание включено' : 'Включить зацикливание'}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={toggleMute}
              className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title={isMuted ? 'Включить звук' : 'Выключить звук'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={handleFullScreen}
              className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title="На весь экран"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Video Content & Controls */}
        <div className="relative flex-1 bg-black flex items-center justify-center min-h-0 overflow-hidden">
          <video
            ref={videoRef}
            src={element.mediaUrl}
            loop={isLoop}
            muted={isMuted}
            playsInline
            className="w-full h-full object-contain"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            onTimeUpdate={() => {
              if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
            }}
            onLoadedMetadata={() => {
              if (videoRef.current) {
                const dur = videoRef.current.duration;
                setDuration(dur);
                onUpdate({ mediaDuration: dur });
              }
            }}
            onError={() => setLoadError(true)}
          />

          {/* Central Play/Pause Overlay Button */}
          <div
            onClick={togglePlay}
            className={`absolute inset-0 flex items-center justify-center transition-opacity cursor-pointer ${
              isPlaying ? 'opacity-0 group-hover:opacity-80' : 'opacity-100 bg-black/30'
            }`}
          >
            <button
              className="w-12 h-12 rounded-full bg-indigo-600/90 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95"
              aria-label={isPlaying ? 'Пауза' : 'Воспроизведение'}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>
          </div>
        </div>

        {/* Video Progress Footer Bar */}
        <div className="h-7 bg-slate-900 px-2 flex items-center gap-2 text-[10px] text-slate-400 shrink-0 border-t border-slate-800">
          <button
            onClick={togglePlay}
            className="text-slate-300 hover:text-white transition-colors"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          <span className="w-9 font-mono tabular-nums">{formatTime(currentTime)}</span>

          {/* Scrubber Bar */}
          <div
            onClick={handleSeek}
            className="flex-1 h-2 bg-slate-800 rounded-full cursor-pointer relative overflow-hidden group/bar"
          >
            <div
              className="h-full bg-indigo-500 rounded-full transition-all"
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>

          <span className="w-9 text-right font-mono tabular-nums">{formatTime(duration)}</span>
        </div>
      </div>
    );
  }

  // ================= AUDIO PLAYER =================
  return (
    <div
      className={`w-full h-full select-none flex flex-col justify-between p-3.5 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white rounded-2xl shadow-xl border border-slate-700/80 group ${
        isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''
      }`}
      style={{
        borderRadius: `${element.borderRadius ?? 16}px`,
        opacity: element.opacity ?? 1,
      }}
    >
      <audio
        ref={audioRef}
        src={element.mediaUrl}
        loop={isLoop}
        muted={isMuted}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onTimeUpdate={() => {
          if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            const dur = audioRef.current.duration;
            setDuration(dur);
            onUpdate({ mediaDuration: dur });
          }
        }}
        onError={() => setLoadError(true)}
      />

      {/* Audio Header: Icon + Title + Status */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center shrink-0">
            <Music className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-slate-100 truncate">
              {element.mediaName || 'Аудиозапись'}
            </div>
            <div className="text-[10px] text-indigo-300/80 flex items-center gap-1.5 mt-0.5">
              <span>Аудио дорожка</span>
              <span>•</span>
              <span className="font-mono">{formatTime(duration)}</span>
            </div>
          </div>
        </div>

        {/* Equalizer animation when playing */}
        <div className="flex items-end gap-1 h-5 px-1 shrink-0">
          {[0.4, 0.8, 0.5, 0.9, 0.6].map((height, i) => (
            <div
              key={i}
              className={`w-1 bg-indigo-400 rounded-full transition-all duration-300 ${
                isPlaying ? 'animate-pulse' : 'opacity-30'
              }`}
              style={{
                height: isPlaying ? `${Math.round(height * 20)}px` : '4px',
                animationDelay: `${i * 120}ms`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Progress Scrubber */}
      <div className="my-2">
        <div
          onClick={handleSeek}
          className="h-2 w-full bg-slate-800 rounded-full cursor-pointer relative overflow-hidden"
        >
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-400 rounded-full transition-all"
            style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-1 tabular-nums">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
        <div className="flex items-center gap-2">
          {/* Main Play/Pause */}
          <button
            onClick={togglePlay}
            className="w-8 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-md"
            title={isPlaying ? 'Пауза' : 'Воспроизведение'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
          </button>

          <button
            onClick={toggleLoop}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              isLoop ? 'text-indigo-400 bg-indigo-950/60' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title={isLoop ? 'Зацикливание включено' : 'Включить зацикливание'}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          onClick={toggleMute}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          title={isMuted ? 'Включить звук' : 'Выключить звук'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
