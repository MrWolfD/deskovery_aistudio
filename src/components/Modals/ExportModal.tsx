import React, { useRef, useState } from 'react';
import {
  X,
  Download,
  FileCode,
  Upload,
  Trash2,
  Copy,
  Check,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';
import { BoardElement } from '../../types/board';
import { getBoardBounds } from '../../utils/math';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  elements: BoardElement[];
  boardTitle: string;
  onImportData: (elements: BoardElement[], title?: string) => void;
  onClearBoard: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  elements,
  boardTitle,
  onImportData,
  onClearBoard,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isTransparent, setIsTransparent] = useState(false);
  const [exportTheme, setExportTheme] = useState<'light' | 'dark'>(() => {
    return typeof document !== 'undefined' &&
      document.documentElement.classList.contains('dark')
      ? 'dark'
      : 'light';
  });
  const [scale, setScale] = useState<number>(2);
  const [embedScene, setEmbedScene] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  // Generate Canvas for PNG export & clipboard
  const generateCanvas = () => {
    const bounds = getBoardBounds(elements);
    const padding = 60;
    const canvasWidth = bounds.width + padding * 2;
    const canvasHeight = bounds.height + padding * 2;

    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth * scale;
    canvas.height = canvasHeight * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.scale(scale, scale);

    const isDark = exportTheme === 'dark';

    // Background
    if (!isTransparent) {
      ctx.fillStyle = isDark ? '#09090b' : '#f8fafc';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Subtle grid dots
      ctx.fillStyle = isDark ? '#27272a' : '#cbd5e1';
      for (let gx = 0; gx < canvasWidth; gx += 24) {
        for (let gy = 0; gy < canvasHeight; gy += 24) {
          ctx.beginPath();
          ctx.arc(gx, gy, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    const offsetX = padding - bounds.minX;
    const offsetY = padding - bounds.minY;

    // Draw elements
    for (const el of elements) {
      const ex = el.x + offsetX;
      const ey = el.y + offsetY;

      if (el.type === 'frame') {
        ctx.fillStyle =
          el.fill || (isDark ? 'rgba(30,41,59,0.7)' : 'rgba(255,255,255,0.7)');
        ctx.strokeStyle = el.stroke || (isDark ? '#475569' : '#cbd5e1');
        ctx.lineWidth = el.strokeWidth || 2;
        ctx.strokeRect(ex, ey, el.width, el.height);
        ctx.fillRect(ex, ey, el.width, el.height);

        // Frame title
        ctx.fillStyle = isDark ? '#f1f5f9' : '#1e293b';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText(el.frameTitle || 'Фрейм', ex + 8, ey - 8);
      } else if (el.type === 'sticky') {
        const colorHexes: Record<string, string> = {
          yellow: '#fef08a',
          green: '#bbf7d0',
          blue: '#bae6fd',
          pink: '#fbcfe8',
          purple: '#e9d5ff',
          orange: '#fed7aa',
          gray: '#f1f5f9',
          dark: '#1e293b',
        };
        ctx.fillStyle = colorHexes[el.stickyColor || 'yellow'] || '#fef08a';
        ctx.strokeStyle = el.stroke || 'rgba(0,0,0,0.08)';
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.roundRect(ex, ey, el.width, el.height, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = el.stickyColor === 'dark' ? '#f8fafc' : '#1e293b';
        ctx.font = `${el.isBold ? 'bold' : 'normal'} ${el.fontSize || 14}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const lines = (el.text || '').split('\n');
        const lineHeight = 18;
        const startY = ey + el.height / 2 - ((lines.length - 1) * lineHeight) / 2;
        lines.forEach((line, i) => {
          ctx.fillText(line, ex + el.width / 2, startY + i * lineHeight, el.width - 20);
        });
      } else if (el.type === 'shape') {
        ctx.fillStyle = el.fill || (isDark ? 'transparent' : '#ffffff');
        ctx.strokeStyle = el.stroke || (isDark ? '#f8fafc' : '#0f172a');
        ctx.lineWidth = el.strokeWidth || 2;

        if (el.shapeType === 'circle') {
          ctx.beginPath();
          ctx.ellipse(
            ex + el.width / 2,
            ey + el.height / 2,
            el.width / 2,
            el.height / 2,
            0,
            0,
            Math.PI * 2
          );
          ctx.fill();
          ctx.stroke();
        } else if (el.shapeType === 'diamond') {
          ctx.beginPath();
          ctx.moveTo(ex + el.width / 2, ey);
          ctx.lineTo(ex + el.width, ey + el.height / 2);
          ctx.lineTo(ex + el.width / 2, ey + el.height);
          ctx.lineTo(ex, ey + el.height / 2);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.roundRect(
            ex,
            ey,
            el.width,
            el.height,
            el.shapeType === 'rounded' ? 12 : 4
          );
          ctx.fill();
          ctx.stroke();
        }

        if (el.text) {
          ctx.fillStyle = el.fontColor || (isDark ? '#f8fafc' : '#0f172a');
          ctx.font = `${el.isBold ? 'bold' : 'normal'} ${el.fontSize || 15}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(el.text, ex + el.width / 2, ey + el.height / 2, el.width - 20);
        }
      } else if (el.type === 'connector') {
        const p1 = el.startPoint || { x: el.x, y: el.y };
        const p2 = el.endPoint || { x: el.x + el.width, y: el.y + el.height };
        ctx.strokeStyle = el.stroke || (isDark ? '#cbd5e1' : '#475569');
        ctx.lineWidth = el.strokeWidth || 2;
        ctx.beginPath();
        ctx.moveTo(p1.x + offsetX, p1.y + offsetY);
        ctx.lineTo(p2.x + offsetX, p2.y + offsetY);
        ctx.stroke();

        // Arrowhead
        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        const headlen = 10;
        ctx.beginPath();
        ctx.moveTo(p2.x + offsetX, p2.y + offsetY);
        ctx.lineTo(
          p2.x + offsetX - headlen * Math.cos(angle - Math.PI / 6),
          p2.y + offsetY - headlen * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          p2.x + offsetX - headlen * Math.cos(angle + Math.PI / 6),
          p2.y + offsetY - headlen * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fillStyle = el.stroke || (isDark ? '#cbd5e1' : '#475569');
        ctx.fill();

        if (el.connectorLabel) {
          const mx = (p1.x + p2.x) / 2 + offsetX;
          const my = (p1.y + p2.y) / 2 + offsetY;
          ctx.fillStyle = isDark ? '#1e293b' : '#ffffff';
          ctx.fillRect(mx - 30, my - 10, 60, 20);
          ctx.fillStyle = isDark ? '#f8fafc' : '#0f172a';
          ctx.font = '11px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(el.connectorLabel, mx, my);
        }
      } else if (el.type === 'drawing' && el.points && el.points.length > 1) {
        ctx.strokeStyle = el.stroke || (isDark ? '#f8fafc' : '#0f172a');
        ctx.lineWidth = el.strokeWidth || 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(el.points[0].x + offsetX, el.points[0].y + offsetY);
        for (let i = 1; i < el.points.length; i++) {
          ctx.lineTo(el.points[i].x + offsetX, el.points[i].y + offsetY);
        }
        ctx.stroke();
      } else if (el.type === 'text') {
        ctx.fillStyle = el.fontColor || (isDark ? '#f8fafc' : '#0f172a');
        ctx.font = `${el.isBold ? 'bold' : 'normal'} ${el.fontSize || 18}px sans-serif`;
        ctx.textAlign = el.textAlign || 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(el.text || '', ex, ey, el.width);
      }
    }

    return canvas;
  };

  // Export to PNG
  const handleExportPng = () => {
    const canvas = generateCanvas();
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `${boardTitle.toLowerCase().replace(/\s+/g, '-')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    onClose();
  };

  // Copy PNG to Clipboard
  const handleCopyPng = () => {
    const canvas = generateCanvas();
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (blob && navigator.clipboard && window.ClipboardItem) {
        navigator.clipboard
          .write([new ClipboardItem({ 'image/png': blob })])
          .then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2200);
          })
          .catch(() => {
            alert('Не удалось скопировать в буфер обмена');
          });
      }
    });
  };

  // Export to SVG with embedded scene data
  const handleExportSvg = () => {
    const bounds = getBoardBounds(elements);
    const padding = 60;
    const w = bounds.width + padding * 2;
    const h = bounds.height + padding * 2;
    const isDark = exportTheme === 'dark';

    const bgRect = !isTransparent
      ? `<rect width="${w}" height="${h}" fill="${isDark ? '#09090b' : '#f8fafc'}"/>`
      : '';

    // Encode scene data if enabled
    const sceneDataString = embedScene
      ? `<!-- deskovery-scene:${btoa(unescape(encodeURIComponent(JSON.stringify(elements))))} -->`
      : '';

    let content = '';
    const offsetX = padding - bounds.minX;
    const offsetY = padding - bounds.minY;

    for (const el of elements) {
      const ex = el.x + offsetX;
      const ey = el.y + offsetY;
      if (el.type === 'shape') {
        const fill = el.fill || (isDark ? 'transparent' : '#ffffff');
        const stroke = el.stroke || (isDark ? '#f8fafc' : '#0f172a');
        if (el.shapeType === 'circle') {
          content += `<ellipse cx="${ex + el.width / 2}" cy="${ey + el.height / 2}" rx="${el.width / 2}" ry="${el.height / 2}" fill="${fill}" stroke="${stroke}" stroke-width="${el.strokeWidth || 2}"/>`;
        } else {
          content += `<rect x="${ex}" y="${ey}" width="${el.width}" height="${el.height}" rx="8" fill="${fill}" stroke="${stroke}" stroke-width="${el.strokeWidth || 2}"/>`;
        }
        if (el.text) {
          content += `<text x="${ex + el.width / 2}" y="${ey + el.height / 2}" fill="${el.fontColor || stroke}" font-size="${el.fontSize || 14}" text-anchor="middle" dominant-baseline="middle">${el.text}</text>`;
        }
      }
    }

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  ${sceneDataString}
  ${bgRect}
  ${content}
</svg>`;

    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${boardTitle.toLowerCase().replace(/\s+/g, '-')}.svg`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    onClose();
  };

  // Export to JSON
  const handleExportJson = () => {
    const data = {
      title: boardTitle,
      version: '2.0',
      exportedAt: new Date().toISOString(),
      elements,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${boardTitle.toLowerCase().replace(/\s+/g, '-')}.deskovery.json`;
    link.click();
    URL.revokeObjectURL(url);
    onClose();
  };

  // Import JSON
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed.elements)) {
          onImportData(parsed.elements, parsed.title);
          onClose();
        } else {
          alert('Неверный формат файла Deskovery');
        }
      } catch (err) {
        alert('Ошибка при чтении файла');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 w-full max-w-lg overflow-hidden flex flex-col animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                Экспорт доски
              </h3>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Сохранение изображения и резервной копии проекта
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Excalidraw-style Settings Bar */}
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-900/50 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
              Цветовая тема:
            </span>
            <div className="flex items-center gap-1 bg-white dark:bg-neutral-800 p-0.5 rounded-lg border border-neutral-200 dark:border-neutral-700">
              <button
                onClick={() => setExportTheme('light')}
                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                  exportTheme === 'light'
                    ? 'bg-indigo-600 text-white font-medium'
                    : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                Светлая
              </button>
              <button
                onClick={() => setExportTheme('dark')}
                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                  exportTheme === 'dark'
                    ? 'bg-indigo-600 text-white font-medium'
                    : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                Темная
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
              Разрешение:
            </span>
            <div className="flex items-center gap-1 bg-white dark:bg-neutral-800 p-0.5 rounded-lg border border-neutral-200 dark:border-neutral-700">
              {[1, 2, 3].map((s) => (
                <button
                  key={s}
                  onClick={() => setScale(s)}
                  className={`px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                    scale === s
                      ? 'bg-indigo-600 text-white font-medium'
                      : 'text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-1">
            <label className="flex items-center gap-2 text-xs text-neutral-700 dark:text-neutral-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isTransparent}
                onChange={(e) => setIsTransparent(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>Прозрачный фон (для вставки в презентации и Notion)</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-neutral-700 dark:text-neutral-300 cursor-pointer">
              <input
                type="checkbox"
                checked={embedScene}
                onChange={(e) => setEmbedScene(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>Вшить данные проекта в файл (для повторного редактирования)</span>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 flex flex-col gap-2.5">
          {/* Copy to Clipboard */}
          <button
            onClick={handleCopyPng}
            className="flex items-center justify-between p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/30 hover:bg-indigo-100/60 dark:hover:bg-indigo-900/40 transition-all text-left cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </div>
              <div>
                <span className="font-semibold text-xs text-indigo-950 dark:text-indigo-200 block">
                  {copied ? 'Скопировано в буфер обмена!' : 'Скопировать PNG в буфер'}
                </span>
                <span className="text-[11px] text-indigo-700/80 dark:text-indigo-400">
                  Готово для мгновенной вставки (Ctrl+V) в Telegram, Notion, Slack
                </span>
              </div>
            </div>
          </button>

          {/* Download PNG */}
          <button
            onClick={handleExportPng}
            className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 dark:border-neutral-700/80 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-all text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center justify-center">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-xs text-neutral-900 dark:text-white block">
                  Скачать как PNG изображение
                </span>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Высокое разрешение {scale}x
                </span>
              </div>
            </div>
            <Download className="w-4 h-4 text-neutral-400 group-hover:text-indigo-600 transition-colors" />
          </button>

          {/* Download SVG */}
          <button
            onClick={handleExportSvg}
            className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 dark:border-neutral-700/80 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-all text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-xs text-neutral-900 dark:text-white block">
                  Скачать векторный SVG
                </span>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Масштабируемый вектор для печати и веба
                </span>
              </div>
            </div>
            <Download className="w-4 h-4 text-neutral-400 group-hover:text-indigo-600 transition-colors" />
          </button>

          {/* Export JSON */}
          <button
            onClick={handleExportJson}
            className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 dark:border-neutral-700/80 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-all text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <FileCode className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-xs text-neutral-900 dark:text-white block">
                  Сохранить проект (.json)
                </span>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Резервная копия проекта со всеми свойствами
                </span>
              </div>
            </div>
            <Download className="w-4 h-4 text-neutral-400 group-hover:text-emerald-600 transition-colors" />
          </button>

          {/* Import JSON */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 dark:border-neutral-700/80 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-all text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Upload className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-xs text-neutral-900 dark:text-white block">
                  Загрузить проект из файла
                </span>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Открыть сохраненный .json или перетащите файл на холст
                </span>
              </div>
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.svg"
            onChange={handleFileUpload}
            className="hidden"
          />

          <div className="h-px bg-neutral-200 dark:bg-neutral-800 my-1" />

          {/* Clear board */}
          <button
            onClick={() => {
              if (window.confirm('Вы уверены, что хотите полностью очистить доску?')) {
                onClearBoard();
                onClose();
              }
            }}
            className="flex items-center gap-2 p-2 rounded-xl text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Очистить холст</span>
          </button>
        </div>
      </div>
    </div>
  );
};
