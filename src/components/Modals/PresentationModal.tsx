import React, { useEffect, useState } from 'react';
import { BoardElement, Viewport } from '../../types/board';
import { ChevronLeft, ChevronRight, X, Play } from 'lucide-react';

interface PresentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  frames: BoardElement[];
  initialFrameId?: string;
  onFocusFrame: (frame: BoardElement) => void;
}

export const PresentationModal: React.FC<PresentationModalProps> = ({
  isOpen,
  onClose,
  frames,
  initialFrameId,
  onFocusFrame,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (initialFrameId) {
      const idx = frames.findIndex((f) => f.id === initialFrameId);
      if (idx !== -1) {
        setCurrentIndex(idx);
        onFocusFrame(frames[idx]);
        return;
      }
    }
    if (frames.length > 0) {
      setCurrentIndex(0);
      onFocusFrame(frames[0]);
    }
  }, [isOpen, initialFrameId, frames]);

  const currentFrame = frames[currentIndex];

  const handleNext = () => {
    if (currentIndex < frames.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      onFocusFrame(frames[nextIdx]);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      onFocusFrame(frames[prevIdx]);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, frames]);

  if (!isOpen || frames.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-neutral-900/90 text-white backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-2xl border border-neutral-700 select-none animate-fade-in">
      <div className="flex items-center gap-2 pr-3 border-r border-neutral-700">
        <Play className="w-4 h-4 text-blue-400 fill-current" />
        <span className="text-xs font-semibold max-w-[200px] truncate">
          {currentFrame?.frameTitle || `Слайд ${currentIndex + 1}`}
        </span>
      </div>

      <div className="flex items-center gap-1.5 font-mono text-xs text-neutral-300">
        <span>{currentIndex + 1}</span>
        <span className="text-neutral-500">/</span>
        <span>{frames.length}</span>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="p-1.5 rounded-lg hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          title="Предыдущий слайд (Стрелка влево)"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          onClick={handleNext}
          disabled={currentIndex === frames.length - 1}
          className="p-1.5 rounded-lg hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          title="Следующий слайд (Стрелка вправо)"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="pl-2 border-l border-neutral-700">
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          title="Выйти из презентации (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
