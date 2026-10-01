import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  MousePointer,
  Hand,
  Square,
  Diamond,
  Circle,
  ArrowRight,
  PenTool,
  Type,
  Eraser,
  Wand2,
  StickyNote,
  Maximize2,
  ZoomIn,
  SunMoon,
  Grid,
  Download,
  Share2,
  Trash2,
  Sparkles,
  Command,
} from 'lucide-react';
import { ToolType } from '../../types/board';

export interface CommandItem {
  id: string;
  category: 'tools' | 'templates' | 'canvas' | 'export';
  title: string;
  subtitle?: string;
  shortcut?: string;
  icon: React.ReactNode;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTool: (tool: ToolType) => void;
  onOpenTemplates: () => void;
  onOpenExport: () => void;
  onOpenShare: () => void;
  onToggleTheme: () => void;
  onResetZoom: () => void;
  onZoomToFit: () => void;
  onToggleGrid: () => void;
  onClearBoard: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectTool,
  onOpenTemplates,
  onOpenExport,
  onOpenShare,
  onToggleTheme,
  onResetZoom,
  onZoomToFit,
  onToggleGrid,
  onClearBoard,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const commands: CommandItem[] = [
    // Templates
    {
      id: 'cmd-templates',
      category: 'templates',
      title: 'Библиотека шаблонов диаграмм',
      subtitle: 'Блок-схемы, Архитектура, Mind Map, Kanban',
      shortcut: 'TPL',
      icon: <Sparkles className="w-4 h-4 text-amber-500" />,
      action: () => {
        onClose();
        onOpenTemplates();
      },
    },
    // Tools
    {
      id: 'tool-select',
      category: 'tools',
      title: 'Выделение и трансформация (Select)',
      shortcut: '3 / V',
      icon: <MousePointer className="w-4 h-4 text-indigo-500" />,
      action: () => {
        onSelectTool('select');
        onClose();
      },
    },
    {
      id: 'tool-hand',
      category: 'tools',
      title: 'Панорамирование холста (Hand)',
      shortcut: '2 / H',
      icon: <Hand className="w-4 h-4 text-neutral-500" />,
      action: () => {
        onSelectTool('hand');
        onClose();
      },
    },
    {
      id: 'tool-rect',
      category: 'tools',
      title: 'Прямоугольник (Rough Rectangle)',
      shortcut: '4 / R',
      icon: <Square className="w-4 h-4 text-blue-500" />,
      action: () => {
        onSelectTool('shape');
        onClose();
      },
    },
    {
      id: 'tool-diamond',
      category: 'tools',
      title: 'Ромб решения (Diamond)',
      shortcut: '5',
      icon: <Diamond className="w-4 h-4 text-amber-500" />,
      action: () => {
        onSelectTool('shape');
        onClose();
      },
    },
    {
      id: 'tool-circle',
      category: 'tools',
      title: 'Круг / Эллипс (Circle)',
      shortcut: '6 / O',
      icon: <Circle className="w-4 h-4 text-emerald-500" />,
      action: () => {
        onSelectTool('shape');
        onClose();
      },
    },
    {
      id: 'tool-connector',
      category: 'tools',
      title: 'Стрелка / Связь (Connector)',
      shortcut: '7 / C',
      icon: <ArrowRight className="w-4 h-4 text-indigo-500" />,
      action: () => {
        onSelectTool('connector');
        onClose();
      },
    },
    {
      id: 'tool-pen',
      category: 'tools',
      title: 'Карандаш для набросков (Pen)',
      shortcut: '8 / P',
      icon: <PenTool className="w-4 h-4 text-neutral-600" />,
      action: () => {
        onSelectTool('pen');
        onClose();
      },
    },
    {
      id: 'tool-text',
      category: 'tools',
      title: 'Рукописный текст (Text)',
      shortcut: '9 / T',
      icon: <Type className="w-4 h-4 text-neutral-600" />,
      action: () => {
        onSelectTool('text');
        onClose();
      },
    },
    {
      id: 'tool-eraser',
      category: 'tools',
      title: 'Интерактивный ластик (Eraser)',
      shortcut: '0 / E',
      icon: <Eraser className="w-4 h-4 text-rose-500" />,
      action: () => {
        onSelectTool('eraser');
        onClose();
      },
    },
    {
      id: 'tool-laser',
      category: 'tools',
      title: 'Лазерная указка для демонстрации',
      shortcut: 'L',
      icon: <Wand2 className="w-4 h-4 text-red-500" />,
      action: () => {
        onSelectTool('laser');
        onClose();
      },
    },
    {
      id: 'tool-sticky',
      category: 'tools',
      title: 'Стикер заметки (Sticky Note)',
      shortcut: 'S',
      icon: <StickyNote className="w-4 h-4 text-yellow-500" />,
      action: () => {
        onSelectTool('sticky');
        onClose();
      },
    },
    // Canvas & View
    {
      id: 'canvas-zoom-fit',
      category: 'canvas',
      title: 'Показать все элементы (Zoom to Fit)',
      shortcut: 'Shift + 1',
      icon: <Maximize2 className="w-4 h-4 text-neutral-500" />,
      action: () => {
        onZoomToFit();
        onClose();
      },
    },
    {
      id: 'canvas-reset-zoom',
      category: 'canvas',
      title: 'Сбросить масштаб к 100%',
      shortcut: 'Ctrl + 0',
      icon: <ZoomIn className="w-4 h-4 text-neutral-500" />,
      action: () => {
        onResetZoom();
        onClose();
      },
    },
    {
      id: 'canvas-toggle-theme',
      category: 'canvas',
      title: 'Переключить тему (Светлая / Темная)',
      icon: <SunMoon className="w-4 h-4 text-neutral-500" />,
      action: () => {
        onToggleTheme();
        onClose();
      },
    },
    {
      id: 'canvas-toggle-grid',
      category: 'canvas',
      title: 'Переключить режим сетки',
      icon: <Grid className="w-4 h-4 text-neutral-500" />,
      action: () => {
        onToggleGrid();
        onClose();
      },
    },
    // Export & Share
    {
      id: 'export-dialog',
      category: 'export',
      title: 'Экспорт доски (PNG, SVG, JSON)',
      shortcut: 'Ctrl + E',
      icon: <Download className="w-4 h-4 text-emerald-500" />,
      action: () => {
        onClose();
        onOpenExport();
      },
    },
    {
      id: 'share-dialog',
      category: 'export',
      title: 'Поделиться доской и ссылкой доступа',
      icon: <Share2 className="w-4 h-4 text-blue-500" />,
      action: () => {
        onClose();
        onOpenShare();
      },
    },
    {
      id: 'clear-board',
      category: 'export',
      title: 'Очистить холст',
      icon: <Trash2 className="w-4 h-4 text-rose-500" />,
      action: () => {
        if (confirm('Очистить всю доску? Это действие удалит все элементы.')) {
          onClearBoard();
        }
        onClose();
      },
    },
  ];

  const filtered = commands.filter((cmd) => {
    return (
      cmd.title.toLowerCase().includes(query.toLowerCase()) ||
      (cmd.subtitle && cmd.subtitle.toLowerCase().includes(query.toLowerCase())) ||
      (cmd.shortcut && cmd.shortcut.toLowerCase().includes(query.toLowerCase()))
    );
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + (filtered.length || 1)) % (filtered.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 p-4 bg-black/50 backdrop-blur-xs select-none"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 w-full max-w-xl overflow-hidden flex flex-col animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-neutral-200 dark:border-neutral-800 gap-3">
          <Search className="w-5 h-5 text-neutral-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Введите команду, инструмент или шаблон..."
            className="flex-1 bg-transparent text-sm text-neutral-900 dark:text-white placeholder-neutral-400 outline-none"
          />
          <kbd className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-[10px] font-mono text-neutral-500">
            ESC
          </kbd>
        </div>

        {/* Command list */}
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-400">
              Команда не найдена
            </div>
          ) : (
            filtered.map((cmd, idx) => (
              <div
                key={cmd.id}
                onClick={cmd.action}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                  selectedIndex === idx
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                    : 'text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 shadow-2xs">
                    {cmd.icon}
                  </div>
                  <div>
                    <div className="text-xs font-medium leading-tight">
                      {cmd.title}
                    </div>
                    {cmd.subtitle && (
                      <div className="text-[10px] text-neutral-400 leading-tight mt-0.5">
                        {cmd.subtitle}
                      </div>
                    )}
                  </div>
                </div>

                {cmd.shortcut && (
                  <kbd className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-[10px] font-mono text-neutral-500">
                    {cmd.shortcut}
                  </kbd>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer tip */}
        <div className="px-4 py-2 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center justify-between text-[11px] text-neutral-400">
          <span>Навигация: ↑ ↓ для выбора, Enter для запуска</span>
          <span className="flex items-center gap-1">
            <Command className="w-3 h-3" /> + K
          </span>
        </div>
      </div>
    </div>
  );
};
