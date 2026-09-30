import React, { useState, useRef, useEffect } from 'react';
import { ShapeType, StickyColor, ToolType } from '../../types/board';
import {
  MousePointer2,
  Hand,
  StickyNote as StickyIcon,
  Square,
  Circle,
  Diamond,
  Triangle,
  Star,
  Database,
  Cloud,
  Type,
  ArrowUpRight,
  PenTool,
  Highlighter,
  Film,
} from 'lucide-react';

interface PrimaryToolbarProps {
  activeTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  selectedStickyColor: StickyColor;
  onSelectStickyColor: (color: StickyColor) => void;
  selectedShapeType: ShapeType;
  onSelectShapeType: (shape: ShapeType) => void;
  selectedStamp: string;
  onSelectStamp: (emoji: string) => void;
  onUploadImageFile?: (file: File) => void;
  onOpenMediaUpload?: () => void;
}

const STICKY_COLORS: { name: StickyColor; hex: string }[] = [
  { name: 'yellow', hex: '#fef08a' },
  { name: 'green', hex: '#bbf7d0' },
  { name: 'blue', hex: '#bae6fd' },
  { name: 'pink', hex: '#fbcfe8' },
  { name: 'purple', hex: '#e9d5ff' },
  { name: 'orange', hex: '#fed7aa' },
  { name: 'gray', hex: '#f1f5f9' },
  { name: 'dark', hex: '#1e293b' },
];

const SHAPES: { type: ShapeType; label: string; icon: React.ReactNode }[] = [
  { type: 'rectangle', label: 'Прямоугольник', icon: <Square className="w-4 h-4" /> },
  { type: 'rounded', label: 'Скругленный', icon: <Square className="w-4 h-4 rounded-md" /> },
  { type: 'circle', label: 'Круг', icon: <Circle className="w-4 h-4" /> },
  { type: 'diamond', label: 'Ромб', icon: <Diamond className="w-4 h-4" /> },
  { type: 'triangle', label: 'Треугольник', icon: <Triangle className="w-4 h-4" /> },
  { type: 'star', label: 'Звезда', icon: <Star className="w-4 h-4" /> },
  { type: 'cylinder', label: 'База данных', icon: <Database className="w-4 h-4" /> },
  { type: 'cloud', label: 'Облако', icon: <Cloud className="w-4 h-4" /> },
];

const STAMPS = [
  '👍', '👎', '❤️', '🔥', '👏',
  '🎉', '⭐', '🚀', '💡', '⚠️',
  '❌', '✅', '🎯', '💬', '💯'
];

export const PrimaryToolbar: React.FC<PrimaryToolbarProps> = ({
  activeTool,
  onSelectTool,
  selectedStickyColor,
  onSelectStickyColor,
  selectedShapeType,
  onSelectShapeType,
  selectedStamp,
  onSelectStamp,
  onUploadImageFile,
  onOpenMediaUpload,
}) => {
  const [showStickyFlyout, setShowStickyFlyout] = useState(false);
  const [showShapeFlyout, setShowShapeFlyout] = useState(false);
  const [showPenFlyout, setShowPenFlyout] = useState(false);
  const [showStampFlyout, setShowStampFlyout] = useState(false);

  const toolbarRef = useRef<HTMLElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setShowStickyFlyout(false);
        setShowShapeFlyout(false);
        setShowPenFlyout(false);
        setShowStampFlyout(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadImageFile) {
      onUploadImageFile(file);
    }
    // reset value so same file can be uploaded again
    e.target.value = '';
  };

  return (
    <aside
      ref={toolbarRef}
      aria-label="Панель инструментов"
      className="absolute left-4 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-1 p-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-xl border border-neutral-200/80 dark:border-slate-800 select-none"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Select Tool */}
      <button
        onClick={() => {
          onSelectTool('select');
          setShowStickyFlyout(false);
          setShowShapeFlyout(false);
          setShowPenFlyout(false);
          setShowStampFlyout(false);
        }}
        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${
          activeTool === 'select'
            ? 'bg-indigo-600 text-white shadow-xs'
            : 'text-neutral-700 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-slate-800'
        }`}
        title="Выделение и перемещение (V)"
      >
        <MousePointer2 className="w-5 h-5 -rotate-45" />
      </button>

      {/* Hand / Pan Tool */}
      <button
        onClick={() => {
          onSelectTool('hand');
          setShowStickyFlyout(false);
          setShowShapeFlyout(false);
        }}
        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${
          activeTool === 'hand'
            ? 'bg-indigo-600 text-white shadow-xs'
            : 'text-neutral-700 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-slate-800'
        }`}
        title="Панорамирование (H или зажатый Пробел)"
      >
        <Hand className="w-5 h-5" />
      </button>

      <div className="h-px bg-neutral-200 dark:bg-slate-800 my-1 mx-1.5" />

      {/* Sticky Note Tool with flyout */}
      <div className="relative">
        <button
          onClick={() => {
            onSelectTool('sticky');
            setShowStickyFlyout(!showStickyFlyout);
            setShowShapeFlyout(false);
            setShowPenFlyout(false);
            setShowStampFlyout(false);
          }}
          className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${
            activeTool === 'sticky'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-neutral-700 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-slate-800'
          }`}
          title="Стикер (S)"
        >
          <StickyIcon className="w-5 h-5" />
        </button>

        {showStickyFlyout && (
          <div className="absolute left-full top-0 ml-3 p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-neutral-200/90 dark:border-slate-800 flex flex-col gap-2 z-50 w-44">
            <div className="text-[11px] font-semibold tracking-wider text-neutral-400 dark:text-slate-400 uppercase px-0.5">
              Цвет стикера
            </div>
            <div className="grid grid-cols-4 gap-2">
              {STICKY_COLORS.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => {
                    onSelectStickyColor(c.name);
                    onSelectTool('sticky');
                    setShowStickyFlyout(false);
                  }}
                  className={`w-8 h-8 rounded-xl border border-black/10 dark:border-white/10 hover:scale-110 active:scale-95 transition-all shadow-xs cursor-pointer ${
                    selectedStickyColor === c.name ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-900' : ''
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={`Стикер: ${c.name}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Shapes with flyout */}
      <div className="relative">
        <button
          onClick={() => {
            onSelectTool('shape');
            setShowShapeFlyout(!showShapeFlyout);
            setShowStickyFlyout(false);
            setShowPenFlyout(false);
            setShowStampFlyout(false);
          }}
          className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${
            activeTool === 'shape'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-neutral-700 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-slate-800'
          }`}
          title="Фигуры (R)"
        >
          <Square className="w-5 h-5" />
        </button>

        {showShapeFlyout && (
          <div className="absolute left-full top-0 ml-3 p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-neutral-200/90 dark:border-slate-800 z-50 w-48 flex flex-col gap-2">
            <div className="text-[11px] font-semibold tracking-wider text-neutral-400 dark:text-slate-400 uppercase px-0.5">
              Фигуры
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {SHAPES.map((s) => (
                <button
                  key={s.type}
                  type="button"
                  onClick={() => {
                    onSelectShapeType(s.type);
                    onSelectTool('shape');
                    setShowShapeFlyout(false);
                  }}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs transition-colors cursor-pointer ${
                    selectedShapeType === s.type
                      ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-medium'
                      : 'text-neutral-700 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {s.icon}
                  <span className="truncate">{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Connectors / Arrows */}
      <button
        onClick={() => {
          onSelectTool('connector');
          setShowStickyFlyout(false);
          setShowShapeFlyout(false);
          setShowPenFlyout(false);
          setShowStampFlyout(false);
        }}
        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${
          activeTool === 'connector'
            ? 'bg-indigo-600 text-white shadow-xs'
            : 'text-neutral-700 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-slate-800'
        }`}
        title="Стрелка и связь (C)"
      >
        <ArrowUpRight className="w-5 h-5" />
      </button>

      {/* Text block */}
      <button
        onClick={() => {
          onSelectTool('text');
          setShowStickyFlyout(false);
          setShowShapeFlyout(false);
          setShowPenFlyout(false);
          setShowStampFlyout(false);
        }}
        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${
          activeTool === 'text'
            ? 'bg-indigo-600 text-white shadow-xs'
            : 'text-neutral-700 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-slate-800'
        }`}
        title="Текст (T)"
      >
        <Type className="w-5 h-5" />
      </button>

      {/* Pen / Highlighter with flyout */}
      <div className="relative">
        <button
          onClick={() => {
            onSelectTool(activeTool === 'highlighter' ? 'highlighter' : 'pen');
            setShowPenFlyout(!showPenFlyout);
            setShowStickyFlyout(false);
            setShowShapeFlyout(false);
            setShowStampFlyout(false);
          }}
          className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${
            activeTool === 'pen' || activeTool === 'highlighter'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-neutral-700 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-slate-800'
          }`}
          title="Рисование (P)"
        >
          {activeTool === 'highlighter' ? (
            <Highlighter className="w-5 h-5" />
          ) : (
            <PenTool className="w-5 h-5" />
          )}
        </button>

        {showPenFlyout && (
          <div className="absolute left-full top-0 ml-3 p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-neutral-200/90 dark:border-slate-800 z-50 w-40 flex flex-col gap-2">
            <div className="text-[11px] font-semibold tracking-wider text-neutral-400 dark:text-slate-400 uppercase px-0.5">
              Рисование
            </div>
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => {
                  onSelectTool('pen');
                  setShowPenFlyout(false);
                }}
                className={`flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                  activeTool === 'pen'
                    ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-medium'
                    : 'text-neutral-700 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-slate-800'
                }`}
              >
                <PenTool className="w-4 h-4" />
                <span>Карандаш</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onSelectTool('highlighter');
                  setShowPenFlyout(false);
                }}
                className={`flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                  activeTool === 'highlighter'
                    ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-medium'
                    : 'text-neutral-700 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-slate-800'
                }`}
              >
                <Highlighter className="w-4 h-4" />
                <span>Маркер</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="h-px bg-neutral-200 dark:bg-slate-800 my-1 mx-1" />

      {/* Main Media Upload & Insert Tool */}
      <button
        onClick={() => {
          if (onOpenMediaUpload) {
            onOpenMediaUpload();
          } else {
            fileInputRef.current?.click();
          }
        }}
        className="w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 hover:text-indigo-700 transition-all group shadow-xs cursor-pointer"
        title="Добавить мультимедиа (Изображение, Видео, Аудио, YouTube) или нажмите Ctrl+V"
      >
        <Film className="w-5 h-5 group-hover:scale-110 transition-transform" />
      </button>
    </aside>
  );
};
