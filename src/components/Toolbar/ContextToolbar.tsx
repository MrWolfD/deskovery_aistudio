import React, { useState } from 'react';
import { BoardElement, ConnectorLineType, ShapeType, StickyColor } from '../../types/board';
import {
  Trash2,
  Copy,
  Lock,
  Unlock,
  BringToFront,
  SendToBack,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  CornerDownRight,
  Spline,
  Minus,
  ArrowRight,
  Palette,
  AlignHorizontalJustifyStart,
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  Layers,
  LayoutGrid,
} from 'lucide-react';

interface ContextToolbarProps {
  selectedElements: BoardElement[];
  onUpdateElement: (id: string, updates: Partial<BoardElement>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onToggleLock: () => void;
  onAlign?: (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
  onDistribute?: (axis: 'horizontal' | 'vertical') => void;
  onGroup?: () => void;
  onUngroup?: () => void;
  onTidyUp?: () => void;
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

const STROKE_PALETTE = [
  '#0f172a',
  '#f8fafc',
  '#e03131',
  '#2f9e44',
  '#1971c2',
  '#f59e0b',
  '#9c36b5',
  '#d9480f',
  '#475569',
];

const SHAPE_PALETTE = [
  'transparent',
  '#ffffff',
  '#f8fafc',
  '#ffc9c9',
  '#fcc2d7',
  '#eebefa',
  '#d0bfff',
  '#dbe4ff',
  '#a5d8ff',
  '#c3fae8',
  '#d3f9d8',
  '#fff3bf',
  '#ffe8cc',
  '#1e293b',
];

const TEXT_PALETTE = [
  '#ffffff',
  '#0f172a',
  '#6366f1',
  '#3b82f6',
  '#10b981',
  '#ef4444',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
];

export const ContextToolbar: React.FC<ContextToolbarProps> = ({
  selectedElements,
  onUpdateElement,
  onDuplicate,
  onDelete,
  onBringForward,
  onSendBackward,
  onToggleLock,
  onAlign,
  onGroup,
  onUngroup,
  onTidyUp,
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showStrokePicker, setShowStrokePicker] = useState(false);
  const [showFillMenu, setShowFillMenu] = useState(false);

  if (selectedElements.length === 0) return null;

  const first = selectedElements[0];
  const isMulti = selectedElements.length > 1;
  const isSticky = first.type === 'sticky';
  const isShape = first.type === 'shape';
  const isPureText = first.type === 'text';
  const isConnector = first.type === 'connector';
  const isText = first.type === 'text' || first.type === 'sticky' || first.type === 'shape';
  const isLocked = selectedElements.every((el) => el.locked);
  const isGrouped = selectedElements.length > 1 && selectedElements.every((el) => el.groupId && el.groupId === first.groupId);

  const applyToAll = (updates: Partial<BoardElement>) => {
    for (const el of selectedElements) {
      onUpdateElement(el.id, updates);
    }
  };

  return (
    <div
      className="flex items-center gap-1 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md px-2 py-1.5 rounded-xl shadow-lg border border-neutral-200/90 dark:border-neutral-800 text-neutral-700 dark:text-neutral-200 text-xs select-none transition-all z-50 pointer-events-auto"
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Color Picker for Sticky / Shape / Fill */}
      {(isSticky || isShape) && (
        <div className="relative">
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors border border-neutral-200 dark:border-neutral-700 cursor-pointer"
            title="Цвет"
          >
            <div
              className="w-4 h-4 rounded-full border border-neutral-300 dark:border-neutral-600 shadow-2xs"
              style={{
                backgroundColor: isSticky
                  ? STICKY_COLORS.find((c) => c.name === first.stickyColor)?.hex || '#fef08a'
                  : first.fill || '#ffffff',
              }}
            />
            <Palette className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
          </button>

          {showColorPicker && (
            <div className="absolute top-full left-0 mt-2 p-2 bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-800 flex gap-1.5 z-50">
              {isSticky
                ? STICKY_COLORS.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => {
                        applyToAll({ stickyColor: c.name });
                        setShowColorPicker(false);
                      }}
                      className="w-6 h-6 rounded-full border border-neutral-300 dark:border-neutral-700 hover:scale-110 transition-transform cursor-pointer"
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))
                : SHAPE_PALETTE.map((hex) => (
                    <button
                      key={hex}
                      onClick={() => {
                        applyToAll({ fill: hex });
                        setShowColorPicker(false);
                      }}
                      className="w-6 h-6 rounded-full border border-neutral-300 dark:border-neutral-700 hover:scale-110 transition-transform cursor-pointer"
                      style={{ backgroundColor: hex }}
                    />
                  ))}
            </div>
          )}
        </div>
      )}

      {/* Stroke Color Picker for Shapes & Connectors */}
      {(isShape || isConnector) && (
        <div className="relative">
          <button
            onClick={() => setShowStrokePicker(!showStrokePicker)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors border border-neutral-200 dark:border-neutral-700 cursor-pointer"
            title="Цвет контура"
          >
            <div
              className="w-4 h-4 rounded-full border-2 border-neutral-400 dark:border-neutral-500 shadow-2xs"
              style={{
                backgroundColor: first.stroke || '#0f172a',
              }}
            />
            <span className="text-[10px] text-neutral-500 font-medium">Контур</span>
          </button>

          {showStrokePicker && (
            <div className="absolute top-full left-0 mt-2 p-2 bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-800 flex gap-1.5 z-50">
              {STROKE_PALETTE.map((hex) => (
                <button
                  key={hex}
                  onClick={() => {
                    applyToAll({ stroke: hex });
                    setShowStrokePicker(false);
                  }}
                  className="w-6 h-6 rounded-full border border-neutral-300 dark:border-neutral-700 hover:scale-110 transition-transform cursor-pointer"
                  style={{ backgroundColor: hex }}
                  title={hex}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Color Picker for pure Text elements */}
      {isPureText && (
        <div className="relative">
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors border border-neutral-200 dark:border-neutral-700 cursor-pointer"
            title="Цвет текста"
          >
            <div
              className="w-4 h-4 rounded-full border border-neutral-300 dark:border-neutral-600 shadow-2xs"
              style={{
                backgroundColor: first.fontColor || '#ffffff',
              }}
            />
            <Palette className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
          </button>

          {showColorPicker && (
            <div className="absolute top-full left-0 mt-2 p-2 bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-800 flex gap-1.5 z-50">
              {TEXT_PALETTE.map((hex) => (
                <button
                  key={hex}
                  onClick={() => {
                    applyToAll({ fontColor: hex });
                    setShowColorPicker(false);
                  }}
                  className="w-6 h-6 rounded-full border border-neutral-300 dark:border-neutral-700 hover:scale-110 transition-transform cursor-pointer"
                  style={{ backgroundColor: hex }}
                  title={hex === '#ffffff' ? 'Белый' : hex === '#0f172a' ? 'Темный' : hex}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Excalidraw Shape Hand-drawn & Hatching Controls */}
      {isShape && !isMulti && (
        <>
          <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-800 mx-1" />

          {/* Hand-drawn vs Clean Mode */}
          <button
            onClick={() =>
              applyToAll({ drawStyle: first.drawStyle === 'clean' ? 'rough' : 'clean' })
            }
            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              first.drawStyle !== 'clean'
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
            }`}
            title={
              first.drawStyle === 'clean'
                ? 'Переключить на ручной набросок (Excalidraw)'
                : 'Переключить на строгую геометрию'
            }
          >
            {first.drawStyle === 'clean' ? '📐 Геометрия' : '✏️ Набросок'}
          </button>

          {/* Hatching Fill Style */}
          {first.drawStyle !== 'clean' && (
            <div className="relative">
              <button
                onClick={() => setShowFillMenu(!showFillMenu)}
                className="flex items-center gap-1 px-2 py-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors border border-neutral-200 dark:border-neutral-700 cursor-pointer"
                title="Стиль штриховки Excalidraw"
              >
                <span>
                  {first.fillStyle === 'cross-hatch'
                    ? '▦'
                    : first.fillStyle === 'solid'
                    ? '⬛'
                    : first.fillStyle === 'dots'
                    ? '⁖'
                    : '▧'}
                </span>
                <span className="text-[10px]">
                  {first.fillStyle === 'cross-hatch'
                    ? 'Сетка'
                    : first.fillStyle === 'solid'
                    ? 'Сплошная'
                    : first.fillStyle === 'dots'
                    ? 'Точки'
                    : 'Штрих'}
                </span>
              </button>

              {showFillMenu && (
                <div className="absolute top-full left-0 mt-2 p-1.5 bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-800 flex flex-col gap-1 z-50 min-w-[130px]">
                  <button
                    onClick={() => {
                      applyToAll({ fillStyle: 'hachure' });
                      setShowFillMenu(false);
                    }}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs text-left cursor-pointer"
                  >
                    <span>▧</span> <span>Штриховка</span>
                  </button>
                  <button
                    onClick={() => {
                      applyToAll({ fillStyle: 'cross-hatch' });
                      setShowFillMenu(false);
                    }}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs text-left cursor-pointer"
                  >
                    <span>▦</span> <span>Сетка</span>
                  </button>
                  <button
                    onClick={() => {
                      applyToAll({ fillStyle: 'solid' });
                      setShowFillMenu(false);
                    }}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs text-left cursor-pointer"
                  >
                    <span>⬛</span> <span>Сплошная</span>
                  </button>
                  <button
                    onClick={() => {
                      applyToAll({ fillStyle: 'dots' });
                      setShowFillMenu(false);
                    }}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs text-left cursor-pointer"
                  >
                    <span>⁖</span> <span>Точки</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Roughness / Sloppiness */}
          {first.drawStyle !== 'clean' && (
            <div className="flex items-center gap-0.5 bg-neutral-100 dark:bg-neutral-800/80 p-0.5 rounded-lg" title="Степень небрежности наброска (Sloppiness)">
              <button
                onClick={() => applyToAll({ roughness: 0.3 })}
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                  (first.roughness ?? 1.2) <= 0.5
                    ? 'bg-white dark:bg-neutral-700 text-indigo-600 dark:text-indigo-300 shadow-2xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
                title="Строгий (Архитектор)"
              >
                Строгий
              </button>
              <button
                onClick={() => applyToAll({ roughness: 1.2 })}
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                  (first.roughness ?? 1.2) > 0.5 && (first.roughness ?? 1.2) < 1.8
                    ? 'bg-white dark:bg-neutral-700 text-indigo-600 dark:text-indigo-300 shadow-2xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
                title="Эскиз (Художник)"
              >
                Эскиз
              </button>
              <button
                onClick={() => applyToAll({ roughness: 2.2 })}
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                  (first.roughness ?? 1.2) >= 1.8
                    ? 'bg-white dark:bg-neutral-700 text-indigo-600 dark:text-indigo-300 shadow-2xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
                title="Свободный (Мультяшный)"
              >
                Свободный
              </button>
            </div>
          )}
        </>
      )}

      {/* Typography Controls */}
      {isText && !isMulti && (
        <>
          <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-800 mx-1" />

          {/* Excalidraw Font Family Selector */}
          <div className="flex items-center gap-0.5 bg-neutral-100 dark:bg-neutral-800/80 p-0.5 rounded-lg">
            <button
              onClick={() => applyToAll({ fontFamily: 'handwritten' })}
              className={`px-1.5 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
                (first.fontFamily || 'handwritten') === 'handwritten'
                  ? 'bg-white dark:bg-neutral-700 text-indigo-600 dark:text-indigo-300 font-semibold shadow-2xs'
                  : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900'
              }`}
              title="Рукописный шрифт Excalidraw"
            >
              ✏️ Ручной
            </button>
            <button
              onClick={() => applyToAll({ fontFamily: 'sans' })}
              className={`px-1.5 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
                first.fontFamily === 'sans'
                  ? 'bg-white dark:bg-neutral-700 text-indigo-600 dark:text-indigo-300 font-semibold shadow-2xs'
                  : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900'
              }`}
              title="Стандартный шрифт без засечек"
            >
              🔤 Обычный
            </button>
            <button
              onClick={() => applyToAll({ fontFamily: 'mono' })}
              className={`px-1.5 py-0.5 rounded text-[11px] transition-colors cursor-pointer font-mono ${
                first.fontFamily === 'mono'
                  ? 'bg-white dark:bg-neutral-700 text-indigo-600 dark:text-indigo-300 font-semibold shadow-2xs'
                  : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900'
              }`}
              title="Моноширинный шрифт (Код)"
            >
              💻 Код
            </button>
          </div>

          {/* Font Size */}
          <div className="flex items-center gap-1">
            <button
              onClick={() =>
                applyToAll({ fontSize: Math.max((first.fontSize || 14) - 2, 10) })
              }
              className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 font-bold cursor-pointer"
              title="Уменьшить шрифт"
            >
              A-
            </button>
            <span className="w-6 text-center font-mono text-[11px] text-neutral-600 dark:text-neutral-400">
              {first.fontSize || 14}
            </span>
            <button
              onClick={() =>
                applyToAll({ fontSize: Math.min((first.fontSize || 14) + 2, 48) })
              }
              className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 font-bold cursor-pointer"
              title="Увеличить шрифт"
            >
              A+
            </button>
          </div>

          {/* Bold / Italic */}
          <button
            onClick={() => applyToAll({ isBold: !first.isBold })}
            className={`p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer ${
              first.isBold ? 'bg-neutral-200 dark:bg-neutral-700 text-indigo-600 dark:text-indigo-400 font-bold' : ''
            }`}
            title="Жирный"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => applyToAll({ isItalic: !first.isItalic })}
            className={`p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer ${
              first.isItalic ? 'bg-neutral-200 dark:bg-neutral-700 text-indigo-600 dark:text-indigo-400' : ''
            }`}
            title="Курсив"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>

          {/* Alignments */}
          <button
            onClick={() => applyToAll({ textAlign: 'left' })}
            className={`p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer ${
              first.textAlign === 'left' ? 'bg-neutral-200 dark:bg-neutral-700 text-indigo-600 dark:text-indigo-400' : ''
            }`}
            title="По левому краю"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => applyToAll({ textAlign: 'center' })}
            className={`p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer ${
              (first.textAlign || 'center') === 'center' ? 'bg-neutral-200 dark:bg-neutral-700 text-indigo-600 dark:text-indigo-400' : ''
            }`}
            title="По центру"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
        </>
      )}

      {/* Alignment Controls when Multiple Elements are selected */}
      {isMulti && onAlign && (
        <>
          <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-800 mx-1" />
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => onAlign('left')}
              className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Выровнять влево"
            >
              <AlignHorizontalJustifyStart className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onAlign('center')}
              className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Выровнять по центру"
            >
              <AlignHorizontalJustifyCenter className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onAlign('right')}
              className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Выровнять вправо"
            >
              <AlignHorizontalJustifyEnd className="w-3.5 h-3.5" />
            </button>

            <div className="h-3 w-px bg-neutral-200 dark:bg-neutral-800 mx-0.5" />

            <button
              onClick={() => onAlign('top')}
              className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Выровнять по верхнему краю"
            >
              <AlignVerticalJustifyStart className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onAlign('middle')}
              className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Выровнять по середине"
            >
              <AlignVerticalJustifyCenter className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onAlign('bottom')}
              className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Выровнять по нижнему краю"
            >
              <AlignVerticalJustifyEnd className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Group / Ungroup button */}
          {(onGroup || onUngroup) && (
            <>
              <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-800 mx-1" />
              <button
                onClick={isGrouped ? onUngroup : onGroup}
                className={`flex items-center gap-1 px-2 py-1 rounded transition-colors cursor-pointer ${
                  isGrouped ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
                title={isGrouped ? 'Разгруппировать (Ctrl+Shift+G)' : 'Сгруппировать (Ctrl+G)'}
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="text-[11px] font-medium">
                  {isGrouped ? 'Разгруппировать' : 'Группировать'}
                </span>
              </button>
            </>
          )}

          {/* Tidy Up / Auto Grid shortcut */}
          {onTidyUp && (
            <>
              <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-800 mx-1" />
              <button
                onClick={onTidyUp}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200/80 dark:border-indigo-800/60 shadow-2xs transition-all cursor-pointer"
                title="Упорядочить выделенные стикеры и карточки в аккуратную сетку"
              >
                <LayoutGrid className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span className="text-[11px]">Сетка</span>
              </button>
            </>
          )}
        </>
      )}

      {/* Connector Line Controls */}
      {isConnector && (
        <>
          <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-800 mx-1" />
          <button
            onClick={() => applyToAll({ lineType: 'curved' })}
            className={`p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer ${
              (first.lineType || 'curved') === 'curved' ? 'bg-neutral-200 dark:bg-neutral-700 text-indigo-600 dark:text-indigo-400' : ''
            }`}
            title="Плавная дуга"
          >
            <Spline className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => applyToAll({ lineType: 'orthogonal' })}
            className={`p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer ${
              first.lineType === 'orthogonal' ? 'bg-neutral-200 dark:bg-neutral-700 text-indigo-600 dark:text-indigo-400' : ''
            }`}
            title="Прямоугольный угол"
          >
            <CornerDownRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => applyToAll({ lineType: 'straight' })}
            className={`p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer ${
              first.lineType === 'straight' ? 'bg-neutral-200 dark:bg-neutral-700 text-indigo-600 dark:text-indigo-400' : ''
            }`}
            title="Прямая линия"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => applyToAll({ arrowEnd: !first.arrowEnd })}
            className={`p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer ${
              first.arrowEnd !== false ? 'bg-neutral-200 dark:bg-neutral-700 text-indigo-600 dark:text-indigo-400' : ''
            }`}
            title="Стрелка на конце"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </>
      )}

      {/* Common Actions */}
      <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-800 mx-1" />

      {/* Duplicate */}
      <button
        onClick={onDuplicate}
        className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
        title="Дублировать (Ctrl+D)"
      >
        <Copy className="w-3.5 h-3.5" />
      </button>

      {/* Z-Index Layering */}
      <button
        onClick={onBringForward}
        className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
        title="На передний план"
      >
        <BringToFront className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={onSendBackward}
        className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
        title="На задний план"
      >
        <SendToBack className="w-3.5 h-3.5" />
      </button>

      {/* Lock / Unlock */}
      <button
        onClick={onToggleLock}
        className={`p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer ${
          isLocked ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50' : ''
        }`}
        title={isLocked ? 'Разблокировать' : 'Заблокировать'}
      >
        {isLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
      </button>

      {/* Delete */}
      <button
        onClick={onDelete}
        className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/50 text-red-600 dark:text-red-400 transition-colors cursor-pointer"
        title="Удалить (Del)"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
