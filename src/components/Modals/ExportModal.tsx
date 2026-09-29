import React, { useRef } from 'react';
import { X, Download, FileCode, Upload, Trash2 } from 'lucide-react';
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

  if (!isOpen) return null;

  // Export to JSON
  const handleExportJson = () => {
    const data = {
      title: boardTitle,
      version: '1.0',
      exportedAt: new Date().toISOString(),
      elements,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${boardTitle.toLowerCase().replace(/\s+/g, '-')}.polydesk.json`;
    link.click();
    URL.revokeObjectURL(url);
    onClose();
  };

  // Import from JSON
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
          alert('Неверный формат файла Polydesk');
        }
      } catch (err) {
        alert('Ошибка при чтении файла');
      }
    };
    reader.readAsText(file);
  };

  // Export as PNG
  const handleExportPng = () => {
    const bounds = getBoardBounds(elements);
    const padding = 60;
    const canvasWidth = bounds.width + padding * 2;
    const canvasHeight = bounds.height + padding * 2;

    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth * 2; // retina 2x
    canvas.height = canvasHeight * 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(2, 2);

    // Background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Subtle grid dots
    ctx.fillStyle = '#cbd5e1';
    for (let gx = 0; gx < canvasWidth; gx += 24) {
      for (let gy = 0; gy < canvasHeight; gy += 24) {
        ctx.beginPath();
        ctx.arc(gx, gy, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const offsetX = padding - bounds.minX;
    const offsetY = padding - bounds.minY;

    // Draw elements
    for (const el of elements) {
      const ex = el.x + offsetX;
      const ey = el.y + offsetY;

      if (el.type === 'frame') {
        ctx.fillStyle = el.fill || 'rgba(255,255,255,0.7)';
        ctx.strokeStyle = el.stroke || '#cbd5e1';
        ctx.lineWidth = el.strokeWidth || 2;
        ctx.strokeRect(ex, ey, el.width, el.height);
        ctx.fillRect(ex, ey, el.width, el.height);

        // Frame title
        ctx.fillStyle = '#1e293b';
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
        ctx.strokeStyle = el.stroke || 'rgba(0,0,0,0.06)';
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.roundRect(ex, ey, el.width, el.height, 8);
        ctx.fill();
        ctx.stroke();

        // Sticky text
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
        ctx.fillStyle = el.fill || '#ffffff';
        ctx.strokeStyle = el.stroke || '#0f172a';
        ctx.lineWidth = el.strokeWidth || 2;

        if (el.shapeType === 'circle') {
          ctx.beginPath();
          ctx.ellipse(ex + el.width / 2, ey + el.height / 2, el.width / 2, el.height / 2, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.roundRect(ex, ey, el.width, el.height, el.shapeType === 'rounded' ? 12 : 4);
          ctx.fill();
          ctx.stroke();
        }

        if (el.text) {
          ctx.fillStyle = el.fontColor || '#0f172a';
          ctx.font = `${el.isBold ? 'bold' : 'normal'} ${el.fontSize || 14}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(el.text, ex + el.width / 2, ey + el.height / 2, el.width - 20);
        }
      } else if (el.type === 'card') {
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(ex, ey, el.width, el.height, 8);
        ctx.fill();
        ctx.stroke();

        // Card title
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(el.cardTitle || el.text || '', ex + 12, ey + 12, el.width - 24);

        if (el.cardDescription) {
          ctx.fillStyle = '#64748b';
          ctx.font = '11px sans-serif';
          ctx.fillText(el.cardDescription, ex + 12, ey + 32, el.width - 24);
        }
      } else if (el.type === 'connector') {
        const p1 = el.startPoint || { x: el.x, y: el.y };
        const p2 = el.endPoint || { x: el.x + el.width, y: el.y + el.height };
        ctx.strokeStyle = el.stroke || '#475569';
        ctx.lineWidth = el.strokeWidth || 2;
        ctx.beginPath();
        ctx.moveTo(p1.x + offsetX, p1.y + offsetY);
        ctx.lineTo(p2.x + offsetX, p2.y + offsetY);
        ctx.stroke();
      } else if (el.type === 'drawing' && el.points && el.points.length > 1) {
        ctx.strokeStyle = el.stroke || '#0f172a';
        ctx.lineWidth = el.strokeWidth || 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(el.points[0].x + offsetX, el.points[0].y + offsetY);
        for (let i = 1; i < el.points.length; i++) {
          ctx.lineTo(el.points[i].x + offsetX, el.points[i].y + offsetY);
        }
        ctx.stroke();
      }
    }

    // Trigger download
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${boardTitle.toLowerCase().replace(/\s+/g, '-')}.png`;
    link.click();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none">
      <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200 w-full max-w-md overflow-hidden flex flex-col animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-neutral-900">
              Экспорт и управление доской
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Options */}
        <div className="p-6 flex flex-col gap-3">
          {/* Export PNG */}
          <button
            onClick={handleExportPng}
            className="flex items-center justify-between p-3.5 rounded-xl border border-neutral-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <span className="font-semibold text-xs text-neutral-900 block">
                  Экспорт в PNG изображение
                </span>
                <span className="text-[11px] text-neutral-500">
                  Высокое разрешение со всеми фигурами и текстом
                </span>
              </div>
            </div>
          </button>

          {/* Export JSON */}
          <button
            onClick={handleExportJson}
            className="flex items-center justify-between p-3.5 rounded-xl border border-neutral-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <FileCode className="w-5 h-5" />
              </div>
              <div>
                <span className="font-semibold text-xs text-neutral-900 block">
                  Сохранить доску (.json)
                </span>
                <span className="text-[11px] text-neutral-500">
                  Резервная копия проекта со всеми свойствами
                </span>
              </div>
            </div>
          </button>

          {/* Import JSON */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-between p-3.5 rounded-xl border border-neutral-200 hover:border-indigo-500 hover:bg-indigo-50/50 transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <span className="font-semibold text-xs text-neutral-900 block">
                  Загрузить доску из файла
                </span>
                <span className="text-[11px] text-neutral-500">
                  Открыть ранее сохраненный .json файл
                </span>
              </div>
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="hidden"
          />

          <div className="h-px bg-neutral-100 my-1" />

          {/* Clear board */}
          <button
            onClick={() => {
              if (window.confirm('Вы уверены, что хотите полностью очистить доску?')) {
                onClearBoard();
                onClose();
              }
            }}
            className="flex items-center gap-2 p-2.5 rounded-xl text-xs text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Очистить холст</span>
          </button>
        </div>
      </div>
    </div>
  );
};
