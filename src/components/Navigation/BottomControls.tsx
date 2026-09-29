import React from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Map,
  Grid,
  HelpCircle,
  Magnet,
} from 'lucide-react';
import { BoardElement, Viewport } from '../../types/board';
import { getBoardBounds } from '../../utils/math';

interface BottomControlsProps {
  viewport: Viewport;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFitToContent: () => void;
  elements: BoardElement[];
  showMinimap: boolean;
  onToggleMinimap: () => void;
  onNavigateToPoint: (canvasX: number, canvasY: number) => void;
  gridType: 'dots' | 'lines' | 'none';
  onChangeGridType: (type: 'dots' | 'lines' | 'none') => void;
  snapToGrid: boolean;
  onToggleSnapToGrid: () => void;
  onOpenShortcuts: () => void;
}

export const BottomControls: React.FC<BottomControlsProps> = ({
  viewport,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitToContent,
  elements,
  showMinimap,
  onToggleMinimap,
  onNavigateToPoint,
  gridType,
  onChangeGridType,
  snapToGrid,
  onToggleSnapToGrid,
  onOpenShortcuts,
}) => {
  const zoomPercent = Math.round(viewport.zoom * 100);

  // Minimap calculations
  const bounds = getBoardBounds(elements);
  const minimapWidth = 200;
  const minimapHeight = 130;
  const padding = 100;

  const paddedBounds = {
    minX: bounds.minX - padding,
    minY: bounds.minY - padding,
    width: bounds.width + padding * 2,
    height: bounds.height + padding * 2,
  };

  const scale = Math.min(
    minimapWidth / Math.max(paddedBounds.width, 1),
    minimapHeight / Math.max(paddedBounds.height, 1)
  );

  // Screen camera rect in canvas coords
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  const cameraInCanvas = {
    x: -viewport.x / viewport.zoom,
    y: -viewport.y / viewport.zoom,
    width: screenWidth / viewport.zoom,
    height: screenHeight / viewport.zoom,
  };

  const handleMinimapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const targetCanvasX = paddedBounds.minX + clickX / scale;
    const targetCanvasY = paddedBounds.minY + clickY / scale;

    onNavigateToPoint(targetCanvasX, targetCanvasY);
  };

  return (
    <>
      {/* Interactive Minimap floating window */}
      {showMinimap && (
        <div className="absolute right-5 bottom-16 bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-neutral-200/90 p-2 z-30 select-none">
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-neutral-100 text-[11px] font-semibold text-neutral-600">
            <span>Мини-карта</span>
            <span className="font-mono text-neutral-400">{elements.length} эл.</span>
          </div>

          <svg
            width={minimapWidth}
            height={minimapHeight}
            className="bg-neutral-50 rounded-lg border border-neutral-200 cursor-pointer overflow-hidden"
            onClick={handleMinimapClick}
          >
            {/* Elements render */}
            {elements.map((el) => {
              const mx = (el.x - paddedBounds.minX) * scale;
              const my = (el.y - paddedBounds.minY) * scale;
              const mw = Math.max(el.width * scale, 3);
              const mh = Math.max(el.height * scale, 3);

              return (
                <rect
                  key={el.id}
                  x={mx}
                  y={my}
                  width={mw}
                  height={mh}
                  fill={el.type === 'frame' ? 'rgba(203, 213, 225, 0.4)' : '#3b82f6'}
                  stroke={el.type === 'frame' ? '#94a3b8' : 'none'}
                  strokeWidth={0.5}
                  rx={1}
                />
              );
            })}

            {/* Current Camera Viewport Rectangle */}
            <rect
              x={(cameraInCanvas.x - paddedBounds.minX) * scale}
              y={(cameraInCanvas.y - paddedBounds.minY) * scale}
              width={cameraInCanvas.width * scale}
              height={cameraInCanvas.height * scale}
              fill="rgba(59, 130, 246, 0.15)"
              stroke="#2563eb"
              strokeWidth={1.5}
              rx={1}
            />
          </svg>
        </div>
      )}

      {/* Main bottom floating controls bar */}
      <div className="absolute right-5 bottom-4 z-30 flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-xl shadow-lg border border-neutral-200/80 text-neutral-700 select-none">
        {/* Zoom percentage button (click resets to 100%) */}
        <button
          onClick={onResetZoom}
          className="px-2 py-1 rounded-lg text-xs font-mono font-medium hover:bg-neutral-100 transition-colors w-12 text-center"
          title="Сбросить масштаб на 100%"
        >
          {zoomPercent}%
        </button>

        {/* Zoom Out */}
        <button
          onClick={onZoomOut}
          className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
          title="Уменьшить (Ctrl -)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        {/* Zoom In */}
        <button
          onClick={onZoomIn}
          className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
          title="Увеличить (Ctrl +)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        {/* Fit to content */}
        <button
          onClick={onFitToContent}
          className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
          title="Масштаб по контенту (Shift + 1)"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-neutral-200 mx-0.5" />

        {/* Minimap toggle */}
        <button
          onClick={onToggleMinimap}
          className={`p-1.5 rounded-lg transition-colors ${
            showMinimap ? 'bg-blue-50 text-blue-600' : 'hover:bg-neutral-100 text-neutral-700'
          }`}
          title="Мини-карта обзора доски"
        >
          <Map className="w-4 h-4" />
        </button>

        {/* Grid toggle */}
        <button
          onClick={() => {
            const next = gridType === 'dots' ? 'lines' : gridType === 'lines' ? 'none' : 'dots';
            onChangeGridType(next);
          }}
          className={`p-1.5 rounded-lg transition-colors ${
            gridType !== 'none' ? 'text-blue-600' : 'text-neutral-400 hover:bg-neutral-100'
          }`}
          title={`Сетка: ${gridType === 'dots' ? 'Точки' : gridType === 'lines' ? 'Линии' : 'Отключена'}`}
        >
          <Grid className="w-4 h-4" />
        </button>

        {/* Snap to grid */}
        <button
          onClick={onToggleSnapToGrid}
          className={`p-1.5 rounded-lg transition-colors ${
            snapToGrid ? 'bg-blue-50 text-blue-600' : 'text-neutral-400 hover:bg-neutral-100'
          }`}
          title={`Привязка к сетке: ${snapToGrid ? 'ВКЛ' : 'ВЫКЛ'}`}
        >
          <Magnet className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-neutral-200 mx-0.5" />

        {/* Shortcuts */}
        <button
          onClick={onOpenShortcuts}
          className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 transition-colors"
          title="Горячие клавиши (?)"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </>
  );
};
