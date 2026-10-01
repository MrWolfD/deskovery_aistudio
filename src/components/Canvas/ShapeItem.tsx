import React, { useState, useRef, useEffect } from 'react';
import rough from 'roughjs';
import { BoardElement, AnchorPosition, ShapeType } from '../../types/board';

interface ShapeItemProps {
  element: BoardElement;
  isSelected: boolean;
  isConnecting: boolean;
  theme?: 'light' | 'dark';
  onUpdateText: (id: string, text: string) => void;
  onStartConnect: (elementId: string, anchor: AnchorPosition, e: React.MouseEvent) => void;
}

export const ShapeItem: React.FC<ShapeItemProps> = ({
  element,
  isSelected,
  isConnecting,
  theme,
  onUpdateText,
  onStartConnect,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(element.text || '');
  const [isHovered, setIsHovered] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const roughSvgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    setText(element.text || '');
  }, [element.text]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    onUpdateText(element.id, text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
      onUpdateText(element.id, text);
    }
  };

  const { width, height } = element;
  const shapeType: ShapeType = element.shapeType || 'rectangle';
  const fill = element.fill || '#ffffff';
  const stroke = element.stroke || '#0f172a';
  const strokeWidth = element.strokeWidth || 2;
  const strokeDash = element.strokeStyle === 'dashed' ? '6 4' : element.strokeStyle === 'dotted' ? '2 3' : undefined;

  const isRough = element.drawStyle !== 'clean';

  useEffect(() => {
    if (!isRough || !roughSvgRef.current) return;
    const svg = roughSvgRef.current;
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }
    const rc = rough.svg(svg);
    const isTransparent = !fill || fill === 'transparent' || fill === 'none';
    const options: any = {
      fill: isTransparent ? undefined : fill,
      stroke: stroke,
      strokeWidth: strokeWidth,
      roughness: element.roughness ?? 1.2,
      bowing: element.bowing ?? 1,
      fillStyle: isTransparent ? undefined : (element.fillStyle || 'hachure'),
      strokeLineDash: strokeDash ? (element.strokeStyle === 'dashed' ? [6, 4] : [2, 3]) : undefined,
    };

    let node: SVGElement | null = null;
    const pad = Math.max(strokeWidth, 2);
    const innerW = Math.max(width - pad * 2, 4);
    const innerH = Math.max(height - pad * 2, 4);

    if (shapeType === 'rectangle' || shapeType === 'rounded') {
      node = rc.rectangle(pad, pad, innerW, innerH, options);
    } else if (shapeType === 'circle') {
      node = rc.ellipse(width / 2, height / 2, innerW, innerH, options);
    } else if (shapeType === 'diamond') {
      node = rc.polygon([
        [width / 2, pad],
        [width - pad, height / 2],
        [width / 2, height - pad],
        [pad, height / 2],
      ], options);
    } else if (shapeType === 'triangle') {
      node = rc.polygon([
        [width / 2, pad],
        [width - pad, height - pad],
        [pad, height - pad],
      ], options);
    } else if (shapeType === 'star') {
      const cx = width / 2;
      const cy = height / 2;
      const outerR = Math.min(width, height) / 2 - pad;
      const innerR = outerR * 0.45;
      const pointsArr: [number, number][] = [];
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const angle = (i * Math.PI) / 5 - Math.PI / 2;
        pointsArr.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
      }
      node = rc.polygon(pointsArr, options);
    } else {
      node = rc.rectangle(pad, pad, innerW, innerH, options);
    }

    if (node) {
      svg.appendChild(node);
    }
  }, [
    isRough,
    shapeType,
    width,
    height,
    fill,
    stroke,
    strokeWidth,
    strokeDash,
    element.fillStyle,
    element.roughness,
    element.bowing,
    element.strokeStyle,
  ]);

  const renderShapePath = () => {
    switch (shapeType) {
      case 'circle':
        return (
          <ellipse
            cx={width / 2}
            cy={height / 2}
            rx={width / 2 - strokeWidth}
            ry={height / 2 - strokeWidth}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
          />
        );

      case 'rounded':
        return (
          <rect
            x={strokeWidth / 2}
            y={strokeWidth / 2}
            width={width - strokeWidth}
            height={height - strokeWidth}
            rx={element.borderRadius || 16}
            ry={element.borderRadius || 16}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
          />
        );

      case 'diamond':
        return (
          <polygon
            points={`${width / 2},${strokeWidth} ${width - strokeWidth},${height / 2} ${width / 2},${height - strokeWidth} ${strokeWidth},${height / 2}`}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
          />
        );

      case 'triangle':
        return (
          <polygon
            points={`${width / 2},${strokeWidth} ${width - strokeWidth},${height - strokeWidth} ${strokeWidth},${height - strokeWidth}`}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
          />
        );

      case 'cylinder': {
        const topH = Math.min(height * 0.25, 24);
        return (
          <g>
            <path
              d={`M ${strokeWidth},${topH} L ${strokeWidth},${height - topH} A ${width / 2 - strokeWidth} ${topH} 0 0 0 ${width - strokeWidth},${height - topH} L ${width - strokeWidth},${topH} Z`}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDash}
            />
            <ellipse
              cx={width / 2}
              cy={height - topH}
              rx={width / 2 - strokeWidth}
              ry={topH}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDash}
            />
            <ellipse
              cx={width / 2}
              cy={topH}
              rx={width / 2 - strokeWidth}
              ry={topH}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDash}
            />
          </g>
        );
      }

      case 'star': {
        const cx = width / 2;
        const cy = height / 2;
        const outerR = Math.min(width, height) / 2 - strokeWidth;
        const innerR = outerR * 0.45;
        const pointsArr: string[] = [];
        for (let i = 0; i < 10; i++) {
          const r = i % 2 === 0 ? outerR : innerR;
          const angle = (i * Math.PI) / 5 - Math.PI / 2;
          pointsArr.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
        }
        return (
          <polygon
            points={pointsArr.join(' ')}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
          />
        );
      }

      case 'cloud': {
        return (
          <path
            d={`M ${width * 0.25} ${height * 0.75} 
               A ${width * 0.15} ${height * 0.2} 0 0 1 ${width * 0.2} ${height * 0.45} 
               A ${width * 0.2} ${height * 0.25} 0 0 1 ${width * 0.5} ${height * 0.3} 
               A ${width * 0.25} ${height * 0.28} 0 0 1 ${width * 0.8} ${height * 0.48} 
               A ${width * 0.18} ${height * 0.22} 0 0 1 ${width * 0.75} ${height * 0.75} Z`}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
          />
        );
      }

      case 'rectangle':
      default:
        return (
          <rect
            x={strokeWidth / 2}
            y={strokeWidth / 2}
            width={width - strokeWidth}
            height={height - strokeWidth}
            rx={4}
            ry={4}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDash}
          />
        );
    }
  };

  const anchors: { position: AnchorPosition; style: React.CSSProperties }[] = [
    { position: 'top', style: { top: -6, left: '50%', transform: 'translateX(-50%)' } },
    { position: 'right', style: { right: -6, top: '50%', transform: 'translateY(-50%)' } },
    { position: 'bottom', style: { bottom: -6, left: '50%', transform: 'translateX(-50%)' } },
    { position: 'left', style: { left: -6, top: '50%', transform: 'translateY(-50%)' } },
  ];

  return (
    <div
      className="w-full h-full relative select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDoubleClick={handleDoubleClick}
    >
      {isRough ? (
        <svg
          ref={roughSvgRef}
          className="w-full h-full absolute inset-0 overflow-visible pointer-events-none"
          viewBox={`0 0 ${width} ${height}`}
        />
      ) : (
        <svg
          className="w-full h-full absolute inset-0 overflow-visible pointer-events-none"
          viewBox={`0 0 ${width} ${height}`}
        >
          {renderShapePath()}
        </svg>
      )}

      {/* Text layer */}
      {(() => {
        const isDark =
          theme === 'dark' ||
          (typeof document !== 'undefined' && document.documentElement.classList.contains('dark'));

        const isFillDark =
          fill === 'transparent' ||
          fill === 'none' ||
          fill === '#1e293b' ||
          fill === '#0f172a' ||
          fill === '#18181b' ||
          fill === '#09090b';

        const defaultFontColor = isFillDark || (isDark && fill === 'transparent') ? '#f8fafc' : '#0f172a';
        const textColor = element.fontColor
          ? (isFillDark && (element.fontColor === '#0f172a' || element.fontColor === '#000000') ? '#f8fafc' : element.fontColor)
          : defaultFontColor;

        const fontFamily =
          element.fontFamily === 'mono'
            ? '"JetBrains Mono", monospace'
            : element.fontFamily === 'sans'
            ? '"Plus Jakarta Sans", sans-serif'
            : '"Kalam", "Caveat", cursive';

        return (
          <div className="absolute inset-0 flex items-center justify-center p-3 z-10 pointer-events-auto">
            {isEditing ? (
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className="w-full h-full bg-transparent resize-none outline-none text-center leading-snug"
                style={{
                  fontFamily,
                  fontSize: `${element.fontSize || 16}px`,
                  color: textColor,
                }}
                placeholder="Текст..."
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-center leading-snug break-words overflow-hidden whitespace-pre-wrap select-none"
                style={{
                  fontFamily,
                  fontSize: `${element.fontSize || 16}px`,
                  color: textColor,
                  fontWeight: element.isBold ? 700 : 500,
                  fontStyle: element.isItalic ? 'italic' : 'normal',
                  textAlign: element.textAlign || 'center',
                }}
              >
                {text}
              </div>
            )}
          </div>
        );
      })()}

      {/* Anchor connection dots - show on hover or when connecting */}
      {((isHovered && !isEditing) || isConnecting) && (
        <>
          {anchors.map(({ position, style }) => (
            <button
              key={position}
              style={style}
              className="absolute w-4 h-4 rounded-full bg-blue-600 hover:bg-blue-700 border-2 border-white shadow-md flex items-center justify-center text-white hover:scale-125 transition-transform z-30 cursor-crosshair group/btn"
              title={`Создать связь отсюда`}
              onMouseDown={(e) => {
                e.stopPropagation();
                onStartConnect(element.id, position, e);
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white group-hover/btn:scale-110 transition-transform pointer-events-none" />
            </button>
          ))}
        </>
      )}
    </div>
  );
};
