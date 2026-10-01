import React, { useState, useRef, useEffect } from 'react';
import rough from 'roughjs';
import { BoardElement, Point } from '../../types/board';
import { generateConnectorPath } from '../../utils/math';

interface ConnectorItemProps {
  element: BoardElement;
  isSelected: boolean;
  startPoint: Point;
  endPoint: Point;
  onUpdateLabel?: (id: string, label: string) => void;
  onSelect?: (id: string, e: React.MouseEvent) => void;
}

export const ConnectorItem: React.FC<ConnectorItemProps> = ({
  element,
  isSelected,
  startPoint,
  endPoint,
  onUpdateLabel,
  onSelect,
}) => {
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [label, setLabel] = useState(element.connectorLabel || '');
  const roughRef = useRef<SVGGElement>(null);

  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const defaultStroke = isDark ? '#94a3b8' : '#475569';
  const strokeColor = isSelected ? '#3b82f6' : (element.stroke || defaultStroke);
  const strokeWidth = isSelected ? Math.max(element.strokeWidth || 2, 2.5) : (element.strokeWidth || 2);
  const strokeDash = element.strokeStyle === 'dashed' ? '6 4' : element.strokeStyle === 'dotted' ? '2 3' : undefined;

  const pathD = generateConnectorPath(
    startPoint,
    endPoint,
    element.lineType || 'curved',
    element.fromAnchor,
    element.toAnchor
  );

  const isRough = element.drawStyle !== 'clean';

  useEffect(() => {
    if (!isRough || !roughRef.current) return;
    const g = roughRef.current;
    while (g.firstChild) {
      g.removeChild(g.firstChild);
    }
    const rc = rough.svg(g as any);

    const options: any = {
      stroke: strokeColor,
      strokeWidth,
      roughness: element.roughness ?? 1.2,
      bowing: element.bowing ?? 1,
      strokeLineDash: strokeDash ? (element.strokeStyle === 'dashed' ? [6, 4] : [2, 3]) : undefined,
    };

    const pathNode = rc.path(pathD, options);
    g.appendChild(pathNode);

    if (element.arrowEnd !== false) {
      const dx = endPoint.x - startPoint.x;
      const dy = endPoint.y - startPoint.y;
      const angle = Math.atan2(dy, dx);
      const arrowLength = 12;
      const arrowAngle = Math.PI / 6;

      const p1 = [
        endPoint.x - arrowLength * Math.cos(angle - arrowAngle),
        endPoint.y - arrowLength * Math.sin(angle - arrowAngle),
      ];
      const p2 = [
        endPoint.x - arrowLength * Math.cos(angle + arrowAngle),
        endPoint.y - arrowLength * Math.sin(angle + arrowAngle),
      ];

      const arrowHead = rc.polygon(
        [
          [endPoint.x, endPoint.y],
          [p1[0], p1[1]],
          [p2[0], p2[1]],
        ],
        {
          stroke: strokeColor,
          strokeWidth: 1.5,
          fill: strokeColor,
          fillStyle: 'solid',
          roughness: element.roughness ?? 1.2,
        }
      );
      g.appendChild(arrowHead);
    }

    if (element.arrowStart) {
      const dx = startPoint.x - endPoint.x;
      const dy = startPoint.y - endPoint.y;
      const angle = Math.atan2(dy, dx);
      const arrowLength = 12;
      const arrowAngle = Math.PI / 6;

      const p1 = [
        startPoint.x - arrowLength * Math.cos(angle - arrowAngle),
        startPoint.y - arrowLength * Math.sin(angle - arrowAngle),
      ];
      const p2 = [
        startPoint.x - arrowLength * Math.cos(angle + arrowAngle),
        startPoint.y - arrowLength * Math.sin(angle + arrowAngle),
      ];

      const arrowHead = rc.polygon(
        [
          [startPoint.x, startPoint.y],
          [p1[0], p1[1]],
          [p2[0], p2[1]],
        ],
        {
          stroke: strokeColor,
          strokeWidth: 1.5,
          fill: strokeColor,
          fillStyle: 'solid',
          roughness: element.roughness ?? 1.2,
        }
      );
      g.appendChild(arrowHead);
    }
  }, [
    isRough,
    pathD,
    strokeColor,
    strokeWidth,
    strokeDash,
    element.roughness,
    element.bowing,
    element.strokeStyle,
    element.arrowEnd,
    element.arrowStart,
    startPoint.x,
    startPoint.y,
    endPoint.x,
    endPoint.y,
  ]);

  // Calculate approximate midpoint for label placement
  const midX = (startPoint.x + endPoint.x) / 2;
  const midY = (startPoint.y + endPoint.y) / 2;

  const handleBlur = () => {
    setIsEditingLabel(false);
    if (onUpdateLabel) {
      onUpdateLabel(element.id, label);
    }
  };

  const markerEndId = `arrow-end-${element.id}`;
  const markerStartId = `arrow-start-${element.id}`;

  const fontFamily =
    element.fontFamily === 'mono'
      ? '"JetBrains Mono", monospace'
      : element.fontFamily === 'sans'
      ? '"Plus Jakarta Sans", sans-serif'
      : '"Kalam", "Caveat", cursive';

  return (
    <g className="cursor-pointer group" onClick={(e) => onSelect && onSelect(element.id, e)}>
      <defs>
        <marker
          id={markerEndId}
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill={strokeColor} />
        </marker>
        <marker
          id={markerStartId}
          viewBox="0 0 10 10"
          refX="2"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto"
        >
          <path d="M 10 1.5 L 0 5 L 10 8.5 z" fill={strokeColor} />
        </marker>
      </defs>

      {/* Invisible thick path for easy clicking / hovering */}
      <path
        d={pathD}
        fill="none"
        stroke="transparent"
        strokeWidth={16}
        className="pointer-events-stroke"
      />

      {/* Main connector line */}
      {isRough ? (
        <g ref={roughRef} className="pointer-events-none" />
      ) : (
        <path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDash}
          markerEnd={element.arrowEnd !== false ? `url(#${markerEndId})` : undefined}
          markerStart={element.arrowStart ? `url(#${markerStartId})` : undefined}
          className="transition-colors pointer-events-none"
        />
      )}

      {/* Endpoint handles when selected */}
      {isSelected && (
        <>
          <circle
            cx={startPoint.x}
            cy={startPoint.y}
            r={5}
            fill="#3b82f6"
            stroke="#ffffff"
            strokeWidth={2}
          />
          <circle
            cx={endPoint.x}
            cy={endPoint.y}
            r={5}
            fill="#3b82f6"
            stroke="#ffffff"
            strokeWidth={2}
          />
        </>
      )}

      {/* Connector Label */}
      {(element.connectorLabel || isEditingLabel || isSelected) && (
        <foreignObject
          x={midX - 75}
          y={midY - 14}
          width={150}
          height={28}
          className="overflow-visible pointer-events-auto"
        >
          <div
            className="flex items-center justify-center h-full"
            onDoubleClick={(e) => {
              e.stopPropagation();
              setIsEditingLabel(true);
            }}
          >
            {isEditingLabel ? (
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
                autoFocus
                style={{ fontFamily }}
                className="bg-white dark:bg-neutral-900 border border-indigo-500 rounded px-2 py-0.5 text-xs text-neutral-800 dark:text-white shadow-sm outline-none text-center max-w-[130px]"
                placeholder="Подпись связи..."
              />
            ) : element.connectorLabel ? (
              <span
                style={{ fontFamily }}
                className="bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xs text-neutral-700 dark:text-neutral-100 border border-neutral-200/80 dark:border-neutral-700 px-2 py-0.5 rounded text-[12px] font-medium shadow-2xs whitespace-nowrap cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                {element.connectorLabel}
              </span>
            ) : isSelected ? (
              <span
                style={{ fontFamily }}
                className="opacity-0 group-hover:opacity-100 bg-white/90 dark:bg-neutral-900/90 text-neutral-400 dark:text-neutral-300 border border-dashed border-neutral-300 dark:border-neutral-600 px-1.5 py-0.5 rounded text-[11px] cursor-pointer"
              >
                + текст
              </span>
            ) : null}
          </div>
        </foreignObject>
      )}
    </g>
  );
};
