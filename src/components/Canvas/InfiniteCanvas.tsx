import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  AnchorPosition,
  BoardElement,
  Point,
  ShapeType,
  StickyColor,
  ToolType,
  Viewport,
} from '../../types/board';
import {
  getClosestAnchor,
  getElementAnchorPoint,
  isElementInMarquee,
  screenToCanvas,
} from '../../utils/math';
import { StickyNote } from './StickyNote';
import { ShapeItem } from './ShapeItem';
import { CardItem } from './CardItem';
import { TextItem } from './TextItem';
import { FrameItem } from './FrameItem';
import { StampItem } from './StampItem';
import { ConnectorItem } from './ConnectorItem';
import { DrawingItem } from './DrawingItem';
import { TransformBox } from './TransformBox';
import { ImageItem } from './ImageItem';
import { MediaItem } from './MediaItem';

interface InfiniteCanvasProps {
  elements: BoardElement[];
  selectedIds: string[];
  activeTool: ToolType;
  selectedStickyColor: StickyColor;
  selectedShapeType: ShapeType;
  selectedStamp: string;
  viewport: Viewport;
  gridType: 'dots' | 'lines' | 'none';
  snapToGrid: boolean;
  onUpdateViewport: (viewport: Viewport) => void;
  onSelectElements: (ids: string[]) => void;
  onAddElement: (element: BoardElement) => void;
  onUpdateElement: (id: string, updates: Partial<BoardElement>, saveToHistory?: boolean) => void;
  onUpdateMultipleElements: (updates: { id: string; changes: Partial<BoardElement> }[], saveToHistory?: boolean) => void;
  onDeleteSelected: () => void;
  onStartPresentationFrame?: (frameId: string) => void;
  onUploadImageFile?: (file: File, position?: Point) => void;
  onUploadMediaFile?: (file: File, position?: Point) => void;
  onCursorMove?: (canvasPoint: Point) => void;
  onSelectTool?: (tool: ToolType) => void;
}

export const InfiniteCanvas: React.FC<InfiniteCanvasProps> = ({
  elements,
  selectedIds,
  activeTool,
  selectedStickyColor,
  selectedShapeType,
  selectedStamp,
  viewport,
  gridType,
  snapToGrid,
  onUpdateViewport,
  onSelectElements,
  onAddElement,
  onUpdateElement,
  onUpdateMultipleElements,
  onStartPresentationFrame,
  onUploadImageFile,
  onUploadMediaFile,
  onCursorMove,
  onSelectTool,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Interaction States
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Point>({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // Process dropped or pasted media file (Image, Video, Audio)
  const handleProcessFile = useCallback(
    (file: File, position?: Point) => {
      const rect = containerRef.current?.getBoundingClientRect();
      const pos =
        position ||
        (rect
          ? screenToCanvas(
              rect.left + rect.width / 2,
              rect.top + rect.height / 2,
              viewport,
              rect
            )
          : { x: 0, y: 0 });

      if (file.type.startsWith('video/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          if (!dataUrl) return;

          const newVideoElement: BoardElement = {
            id: `vid-${Date.now()}`,
            type: 'video',
            mediaType: 'video',
            x: pos.x - 240,
            y: pos.y - 160,
            width: 480,
            height: 320,
            mediaUrl: dataUrl,
            mediaName: file.name,
            zIndex: elements.length + 10,
            borderRadius: 12,
            loop: false,
            isMuted: false,
          };

          onAddElement(newVideoElement);
          onSelectElements([newVideoElement.id]);
        };
        reader.readAsDataURL(file);
        return;
      }

      if (file.type.startsWith('audio/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          if (!dataUrl) return;

          const newAudioElement: BoardElement = {
            id: `aud-${Date.now()}`,
            type: 'audio',
            mediaType: 'audio',
            x: pos.x - 180,
            y: pos.y - 60,
            width: 360,
            height: 120,
            mediaUrl: dataUrl,
            mediaName: file.name,
            zIndex: elements.length + 10,
            borderRadius: 16,
            loop: false,
            isMuted: false,
          };

          onAddElement(newAudioElement);
          onSelectElements([newAudioElement.id]);
        };
        reader.readAsDataURL(file);
        return;
      }

      if (onUploadImageFile) {
        onUploadImageFile(file, position);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (!dataUrl) return;

        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          const maxDim = 380;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const newImageElement: BoardElement = {
            id: `img-${Date.now()}`,
            type: 'image',
            x: pos.x - width / 2,
            y: pos.y - height / 2,
            width,
            height,
            imageUrl: dataUrl,
            imageAlt: file.name,
            zIndex: elements.length + 10,
            borderRadius: 8,
          };

          onAddElement(newImageElement);
          onSelectElements([newImageElement.id]);
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    },
    [onUploadImageFile, viewport, elements.length, onAddElement, onSelectElements]
  );

  // Window paste listener for images, video, audio and text
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // Don't intercept if user is typing into input or textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      // Check for media files in clipboard
      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (
            item.type.startsWith('image/') ||
            item.type.startsWith('video/') ||
            item.type.startsWith('audio/')
          ) {
            const file = item.getAsFile();
            if (file) {
              e.preventDefault();
              handleProcessFile(file);
              return;
            }
          }
        }
      }

      // Check for plain text or URLs
      const pastedText = e.clipboardData?.getData('text');
      if (pastedText && pastedText.trim().length > 0) {
        const text = pastedText.trim();
        e.preventDefault();
        const rect = containerRef.current?.getBoundingClientRect();
        const center = rect
          ? screenToCanvas(
              rect.left + rect.width / 2,
              rect.top + rect.height / 2,
              viewport,
              rect
            )
          : { x: 0, y: 0 };

        // Check if text is a YouTube URL
        const isYouTube = /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+/i.test(text);
        if (isYouTube) {
          const ytElement: BoardElement = {
            id: `yt-${Date.now()}`,
            type: 'video',
            mediaType: 'video',
            x: center.x - 240,
            y: center.y - 160,
            width: 480,
            height: 320,
            mediaUrl: text,
            mediaName: 'YouTube видео',
            zIndex: elements.length + 10,
            borderRadius: 12,
            loop: false,
            isMuted: false,
          };
          onAddElement(ytElement);
          onSelectElements([ytElement.id]);
          return;
        }

        // Check if text is direct video link
        if (/^https?:\/\/.*\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(text)) {
          const vidElement: BoardElement = {
            id: `vid-${Date.now()}`,
            type: 'video',
            mediaType: 'video',
            x: center.x - 240,
            y: center.y - 160,
            width: 480,
            height: 320,
            mediaUrl: text,
            mediaName: 'Видеоролик',
            zIndex: elements.length + 10,
            borderRadius: 12,
            loop: false,
            isMuted: false,
          };
          onAddElement(vidElement);
          onSelectElements([vidElement.id]);
          return;
        }

        // Check if text is direct audio link
        if (/^https?:\/\/.*\.(mp3|wav|ogg|m4a|aac)(\?.*)?$/i.test(text)) {
          const audElement: BoardElement = {
            id: `aud-${Date.now()}`,
            type: 'audio',
            mediaType: 'audio',
            x: center.x - 180,
            y: center.y - 60,
            width: 360,
            height: 120,
            mediaUrl: text,
            mediaName: 'Аудиозапись',
            zIndex: elements.length + 10,
            borderRadius: 16,
            loop: false,
            isMuted: false,
          };
          onAddElement(audElement);
          onSelectElements([audElement.id]);
          return;
        }

        // Check if text is direct image link
        if (/^https?:\/\/.*\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(text)) {
          const imgElement: BoardElement = {
            id: `img-${Date.now()}`,
            type: 'image',
            x: center.x - 200,
            y: center.y - 150,
            width: 400,
            height: 300,
            imageUrl: text,
            imageAlt: 'Изображение по ссылке',
            zIndex: elements.length + 10,
            borderRadius: 8,
          };
          onAddElement(imgElement);
          onSelectElements([imgElement.id]);
          return;
        }

        // Default: paste as clean Sticky Note
        const newSticky: BoardElement = {
          id: `sticky-pasted-${Date.now()}`,
          type: 'sticky',
          x: center.x - 85,
          y: center.y - 80,
          width: 170,
          height: 160,
          stickyColor: 'yellow',
          text: text,
          fontSize: 14,
          zIndex: elements.length + 10,
        };
        onAddElement(newSticky);
        onSelectElements([newSticky.id]);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handleProcessFile, viewport, elements.length, onAddElement, onSelectElements]);

  // Dragging / Moving Elements
  const [isDraggingElements, setIsDraggingElements] = useState(false);
  const [dragStartCanvas, setDragStartCanvas] = useState<Point>({ x: 0, y: 0 });
  const [initialElementPositions, setInitialElementPositions] = useState<
    Record<string, { x: number; y: number }>
  >({});

  // Resizing
  const [activeResizeHandle, setActiveResizeHandle] = useState<string | null>(null);
  const [resizeStartElement, setResizeStartElement] = useState<BoardElement | null>(null);
  const [resizeStartMouse, setResizeStartMouse] = useState<Point>({ x: 0, y: 0 });

  // Marquee Selection Box
  const [marquee, setMarquee] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);

  // Freehand Drawing
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDrawPoints, setCurrentDrawPoints] = useState<Point[]>([]);

  // Connector drawing
  const [connectingFrom, setConnectingFrom] = useState<{
    elementId: string;
    anchor: AnchorPosition;
    startPoint: Point;
  } | null>(null);
  const [connectorPreviewPoint, setConnectorPreviewPoint] = useState<Point | null>(null);

  // Spacebar tracking
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Global window listeners during active resizing for silky smooth tracking
  useEffect(() => {
    if (!activeResizeHandle || !resizeStartElement) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const canvasPt = screenToCanvas(e.clientX, e.clientY, viewport, rect);

      const dx = canvasPt.x - resizeStartMouse.x;
      const dy = canvasPt.y - resizeStartMouse.y;
      const orig = resizeStartElement;

      const minW = orig.type === 'sticky' ? 80 : 30;
      const minH = orig.type === 'sticky' ? 80 : 30;

      let newX = orig.x;
      let newY = orig.y;
      let newWidth = orig.width;
      let newHeight = orig.height;

      const hasE = activeResizeHandle.includes('e');
      const hasW = activeResizeHandle.includes('w');
      const hasS = activeResizeHandle.includes('s');
      const hasN = activeResizeHandle.includes('n');

      if (hasE) {
        newWidth = Math.max(minW, orig.width + dx);
      }
      if (hasS) {
        newHeight = Math.max(minH, orig.height + dy);
      }
      if (hasW) {
        const rawW = orig.width - dx;
        if (rawW < minW) {
          newWidth = minW;
          newX = orig.x + (orig.width - minW);
        } else {
          newWidth = rawW;
          newX = orig.x + dx;
        }
      }
      if (hasN) {
        const rawH = orig.height - dy;
        if (rawH < minH) {
          newHeight = minH;
          newY = orig.y + (orig.height - minH);
        } else {
          newHeight = rawH;
          newY = orig.y + dy;
        }
      }

      const isProportional =
        e.shiftKey ||
        orig.type === 'stamp' ||
        (orig.type === 'shape' && (orig.shapeType === 'circle' || orig.shapeType === 'star'));

      if (isProportional && (hasE || hasW) && (hasS || hasN)) {
        const ratio = orig.width / orig.height;
        const currentScale = Math.max(newWidth / orig.width, newHeight / orig.height);
        const propW = Math.max(minW, Math.round(orig.width * currentScale));
        const propH = Math.max(minH, Math.round(propW / ratio));

        if (hasW) {
          newX = orig.x + (orig.width - propW);
        }
        if (hasN) {
          newY = orig.y + (orig.height - propH);
        }
        newWidth = propW;
        newHeight = propH;
      }

      if (snapToGrid) {
        const snap = 20;
        if (hasE) {
          newWidth = Math.max(minW, Math.round(newWidth / snap) * snap);
        }
        if (hasS) {
          newHeight = Math.max(minH, Math.round(newHeight / snap) * snap);
        }
        if (hasW) {
          const rightEdge = orig.x + orig.width;
          const snappedX = Math.round(newX / snap) * snap;
          const snappedW = rightEdge - snappedX;
          if (snappedW >= minW) {
            newX = snappedX;
            newWidth = snappedW;
          }
        }
        if (hasN) {
          const bottomEdge = orig.y + orig.height;
          const snappedY = Math.round(newY / snap) * snap;
          const snappedH = bottomEdge - snappedY;
          if (snappedH >= minH) {
            newY = snappedY;
            newHeight = snappedH;
          }
        }
      }

      onUpdateElement(orig.id, { x: newX, y: newY, width: newWidth, height: newHeight }, false);
    };

    const handleWindowMouseUp = () => {
      setActiveResizeHandle(null);
      setResizeStartElement(null);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [activeResizeHandle, resizeStartElement, resizeStartMouse, viewport, snapToGrid, onUpdateElement]);

  // Wheel handling for zoom & pan
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();

      if (e.ctrlKey || e.metaKey) {
        // Zoom into cursor
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
        const newZoom = Math.min(Math.max(viewport.zoom * zoomFactor, 0.1), 4.0);

        const newX = mouseX - (mouseX - viewport.x) * (newZoom / viewport.zoom);
        const newY = mouseY - (mouseY - viewport.y) * (newZoom / viewport.zoom);

        onUpdateViewport({ x: newX, y: newY, zoom: newZoom });
      } else {
        // Standard 2-finger or wheel pan
        onUpdateViewport({
          x: viewport.x - e.deltaX,
          y: viewport.y - e.deltaY,
          zoom: viewport.zoom,
        });
      }
    },
    [viewport, onUpdateViewport]
  );

  // Mouse Down handler on Canvas
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const canvasPt = screenToCanvas(e.clientX, e.clientY, viewport, rect);

    // Pan mode (hand tool, spacebar, or middle click)
    if (activeTool === 'hand' || isSpacePressed || e.button === 1) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
      return;
    }

    // Left click handling
    if (e.button !== 0) return;

    // Creation Tools
    if (activeTool === 'sticky') {
      const snapX = snapToGrid ? Math.round(canvasPt.x / 20) * 20 : canvasPt.x;
      const snapY = snapToGrid ? Math.round(canvasPt.y / 20) * 20 : canvasPt.y;

      const newSticky: BoardElement = {
        id: `sticky-${Date.now()}`,
        type: 'sticky',
        x: snapX - 80,
        y: snapY - 80,
        width: 160,
        height: 160,
        zIndex: elements.length + 10,
        stickyColor: selectedStickyColor,
        text: '',
        fontSize: 14,
        textAlign: 'center',
      };
      onAddElement(newSticky);
      onSelectElements([newSticky.id]);
      if (onSelectTool && !e.shiftKey) {
        onSelectTool('select');
      }
      return;
    }

    if (activeTool === 'shape') {
      const snapX = snapToGrid ? Math.round(canvasPt.x / 20) * 20 : canvasPt.x;
      const snapY = snapToGrid ? Math.round(canvasPt.y / 20) * 20 : canvasPt.y;
      const isCircle = selectedShapeType === 'circle';

      const newShape: BoardElement = {
        id: `shape-${Date.now()}`,
        type: 'shape',
        shapeType: selectedShapeType,
        x: snapX - 75,
        y: snapY - (isCircle ? 75 : 50),
        width: isCircle ? 140 : 160,
        height: isCircle ? 140 : 100,
        zIndex: elements.length + 10,
        fill: '#ffffff',
        stroke: '#0f172a',
        strokeWidth: 2,
        text: '',
        fontSize: 14,
      };
      onAddElement(newShape);
      onSelectElements([newShape.id]);
      if (onSelectTool && !e.shiftKey) {
        onSelectTool('select');
      }
      return;
    }

    if (activeTool === 'card') {
      const snapX = snapToGrid ? Math.round(canvasPt.x / 20) * 20 : canvasPt.x;
      const snapY = snapToGrid ? Math.round(canvasPt.y / 20) * 20 : canvasPt.y;

      const newCard: BoardElement = {
        id: `card-${Date.now()}`,
        type: 'card',
        x: snapX - 140,
        y: snapY - 60,
        width: 280,
        height: 130,
        zIndex: elements.length + 10,
        cardTitle: 'Новая задача',
        cardDescription: '',
        cardTag: 'Задача',
        cardTagColor: '#3b82f6',
        cardStatus: 'todo',
        cardAssignee: { name: 'Вы', avatarColor: '#3b82f6' },
      };
      onAddElement(newCard);
      onSelectElements([newCard.id]);
      if (onSelectTool && !e.shiftKey) {
        onSelectTool('select');
      }
      return;
    }

    if (activeTool === 'text') {
      const snapX = snapToGrid ? Math.round(canvasPt.x / 20) * 20 : canvasPt.x;
      const snapY = snapToGrid ? Math.round(canvasPt.y / 20) * 20 : canvasPt.y;

      const newText: BoardElement = {
        id: `text-${Date.now()}`,
        type: 'text',
        x: snapX,
        y: snapY - 15,
        width: 200,
        height: 40,
        zIndex: elements.length + 10,
        text: 'Введите текст',
        fontSize: 18,
        fontColor: '#0f172a',
      };
      onAddElement(newText);
      onSelectElements([newText.id]);
      if (onSelectTool && !e.shiftKey) {
        onSelectTool('select');
      }
      return;
    }

    if (activeTool === 'stamp') {
      const newStamp: BoardElement = {
        id: `stamp-${Date.now()}`,
        type: 'stamp',
        x: canvasPt.x - 30,
        y: canvasPt.y - 30,
        width: 60,
        height: 60,
        zIndex: elements.length + 10,
        stampEmoji: selectedStamp,
      };
      onAddElement(newStamp);
      onSelectElements([newStamp.id]);
      if (onSelectTool && !e.shiftKey) {
        onSelectTool('select');
      }
      return;
    }

    if (activeTool === 'frame') {
      const snapX = snapToGrid ? Math.round(canvasPt.x / 20) * 20 : canvasPt.x;
      const snapY = snapToGrid ? Math.round(canvasPt.y / 20) * 20 : canvasPt.y;

      const newFrame: BoardElement = {
        id: `frame-${Date.now()}`,
        type: 'frame',
        x: snapX,
        y: snapY,
        width: 440,
        height: 380,
        zIndex: 1,
        frameTitle: `Фрейм ${elements.filter((el) => el.type === 'frame').length + 1}`,
        fill: 'rgba(248, 250, 252, 0.65)',
        stroke: '#cbd5e1',
        strokeWidth: 2,
      };
      onAddElement(newFrame);
      onSelectElements([newFrame.id]);
      if (onSelectTool && !e.shiftKey) {
        onSelectTool('select');
      }
      return;
    }

    if (activeTool === 'pen' || activeTool === 'highlighter') {
      setIsDrawing(true);
      setCurrentDrawPoints([canvasPt]);
      return;
    }

    // Default select tool on empty canvas: Start Marquee selection
    if (activeTool === 'select') {
      setMarquee({ x1: canvasPt.x, y1: canvasPt.y, x2: canvasPt.x, y2: canvasPt.y });
      onSelectElements([]);
    }
  };

  // Double click on canvas to quickly create a sticky note
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (e.target !== containerRef.current && (e.target as HTMLElement).tagName !== 'svg') {
      return;
    }
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const canvasPt = screenToCanvas(e.clientX, e.clientY, viewport, rect);
    const snapX = snapToGrid ? Math.round(canvasPt.x / 20) * 20 : canvasPt.x;
    const snapY = snapToGrid ? Math.round(canvasPt.y / 20) * 20 : canvasPt.y;

    const newSticky: BoardElement = {
      id: `sticky-${Date.now()}`,
      type: 'sticky',
      x: snapX - 80,
      y: snapY - 80,
      width: 160,
      height: 160,
      zIndex: elements.length + 10,
      stickyColor: selectedStickyColor,
      text: '',
      fontSize: 14,
      textAlign: 'center',
    };
    onAddElement(newSticky);
    onSelectElements([newSticky.id]);
    if (onSelectTool) {
      onSelectTool('select');
    }
  };

  // Mouse Move
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const canvasPt = screenToCanvas(e.clientX, e.clientY, viewport, rect);

    // Report cursor position for real-time multiplayer
    if (onCursorMove) {
      onCursorMove(canvasPt);
    }

    // Panning
    if (isPanning) {
      onUpdateViewport({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
        zoom: viewport.zoom,
      });
      return;
    }

    // Drawing
    if (isDrawing) {
      setCurrentDrawPoints((prev) => [...prev, canvasPt]);
      return;
    }

    // Connector drag
    if (connectingFrom) {
      setConnectorPreviewPoint(canvasPt);
      return;
    }

    // Marquee Selection
    if (marquee) {
      const updatedMarquee = { ...marquee, x2: canvasPt.x, y2: canvasPt.y };
      setMarquee(updatedMarquee);

      const matchingIds = elements
        .filter((el) => isElementInMarquee(el, updatedMarquee))
        .map((el) => el.id);
      onSelectElements(matchingIds);
      return;
    }

    // Resizing
    if (activeResizeHandle && resizeStartElement) {
      const dx = canvasPt.x - resizeStartMouse.x;
      const dy = canvasPt.y - resizeStartMouse.y;
      const orig = resizeStartElement;

      const minW = orig.type === 'sticky' ? 80 : 30;
      const minH = orig.type === 'sticky' ? 80 : 30;

      let newX = orig.x;
      let newY = orig.y;
      let newWidth = orig.width;
      let newHeight = orig.height;

      const hasE = activeResizeHandle.includes('e');
      const hasW = activeResizeHandle.includes('w');
      const hasS = activeResizeHandle.includes('s');
      const hasN = activeResizeHandle.includes('n');

      if (hasE) {
        newWidth = Math.max(minW, orig.width + dx);
      }
      if (hasS) {
        newHeight = Math.max(minH, orig.height + dy);
      }
      if (hasW) {
        const rawW = orig.width - dx;
        if (rawW < minW) {
          newWidth = minW;
          newX = orig.x + (orig.width - minW);
        } else {
          newWidth = rawW;
          newX = orig.x + dx;
        }
      }
      if (hasN) {
        const rawH = orig.height - dy;
        if (rawH < minH) {
          newHeight = minH;
          newY = orig.y + (orig.height - minH);
        } else {
          newHeight = rawH;
          newY = orig.y + dy;
        }
      }

      // Proportional scaling if Shift is held or circle/star/stamp
      const isProportional =
        e.shiftKey ||
        orig.type === 'stamp' ||
        (orig.type === 'shape' && (orig.shapeType === 'circle' || orig.shapeType === 'star'));

      if (isProportional && (hasE || hasW) && (hasS || hasN)) {
        const ratio = orig.width / orig.height;
        const currentScale = Math.max(newWidth / orig.width, newHeight / orig.height);
        const propW = Math.max(minW, Math.round(orig.width * currentScale));
        const propH = Math.max(minH, Math.round(propW / ratio));

        if (hasW) {
          newX = orig.x + (orig.width - propW);
        }
        if (hasN) {
          newY = orig.y + (orig.height - propH);
        }
        newWidth = propW;
        newHeight = propH;
      }

      // Snap to grid if enabled
      if (snapToGrid) {
        const snap = 20;
        if (hasE) {
          newWidth = Math.max(minW, Math.round(newWidth / snap) * snap);
        }
        if (hasS) {
          newHeight = Math.max(minH, Math.round(newHeight / snap) * snap);
        }
        if (hasW) {
          const rightEdge = orig.x + orig.width;
          const snappedX = Math.round(newX / snap) * snap;
          const snappedW = rightEdge - snappedX;
          if (snappedW >= minW) {
            newX = snappedX;
            newWidth = snappedW;
          }
        }
        if (hasN) {
          const bottomEdge = orig.y + orig.height;
          const snappedY = Math.round(newY / snap) * snap;
          const snappedH = bottomEdge - snappedY;
          if (snappedH >= minH) {
            newY = snappedY;
            newHeight = snappedH;
          }
        }
      }

      onUpdateElement(orig.id, { x: newX, y: newY, width: newWidth, height: newHeight }, false);
      return;
    }

    // Dragging / Moving Elements
    if (isDraggingElements && selectedIds.length > 0) {
      const dx = canvasPt.x - dragStartCanvas.x;
      const dy = canvasPt.y - dragStartCanvas.y;

      const updates = selectedIds.map((id) => {
        const initial = initialElementPositions[id] || { x: 0, y: 0 };
        let nx = initial.x + dx;
        let ny = initial.y + dy;

        if (snapToGrid) {
          nx = Math.round(nx / 20) * 20;
          ny = Math.round(ny / 20) * 20;
        }

        return {
          id,
          changes: { x: nx, y: ny },
        };
      });

      onUpdateMultipleElements(updates, false);
      return;
    }
  };

  // Mouse Up
  const handleMouseUp = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const canvasPt = screenToCanvas(e.clientX, e.clientY, viewport, rect);

    if (isPanning) {
      setIsPanning(false);
    }

    if (isDrawing && currentDrawPoints.length > 1) {
      const isHighlighter = activeTool === 'highlighter';
      const newDrawing: BoardElement = {
        id: `drawing-${Date.now()}`,
        type: 'drawing',
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        zIndex: elements.length + 5,
        points: currentDrawPoints,
        isHighlighter,
        stroke: isHighlighter ? '#fef08a' : '#0f172a',
        strokeWidth: isHighlighter ? 24 : 3,
        opacity: isHighlighter ? 0.35 : 1,
      };
      onAddElement(newDrawing);
      setIsDrawing(false);
      setCurrentDrawPoints([]);
    } else {
      setIsDrawing(false);
      setCurrentDrawPoints([]);
    }

    // Complete Connector creation
    if (connectingFrom && connectorPreviewPoint) {
      // Check if dropped on another element
      let targetElementId: string | undefined;
      let targetAnchor: AnchorPosition = 'left';

      for (const el of elements) {
        if (el.id !== connectingFrom.elementId && el.type !== 'connector' && el.type !== 'drawing') {
          const closest = getClosestAnchor(el, connectorPreviewPoint);
          if (closest.distance < 36) {
            targetElementId = el.id;
            targetAnchor = closest.anchor;
            break;
          }
        }
      }

      const newConnector: BoardElement = {
        id: `conn-${Date.now()}`,
        type: 'connector',
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        zIndex: 5,
        fromId: connectingFrom.elementId,
        fromAnchor: connectingFrom.anchor,
        toId: targetElementId,
        toAnchor: targetElementId ? targetAnchor : undefined,
        startPoint: connectingFrom.startPoint,
        endPoint: targetElementId ? undefined : connectorPreviewPoint,
        lineType: 'curved',
        arrowEnd: true,
        stroke: '#475569',
        strokeWidth: 2,
      };

      onAddElement(newConnector);
      onSelectElements([newConnector.id]);
      setConnectingFrom(null);
      setConnectorPreviewPoint(null);
    }

    if (marquee) {
      setMarquee(null);
    }

    if (activeResizeHandle) {
      if (resizeStartElement) {
        onUpdateElement(resizeStartElement.id, {}, true);
      }
      setActiveResizeHandle(null);
      setResizeStartElement(null);
    }

    if (isDraggingElements) {
      if (selectedIds.length > 0) {
        onUpdateMultipleElements([], true);
      }
      setIsDraggingElements(false);
      setInitialElementPositions({});
    }
  };

  // Start element drag
  const handleElementMouseDown = (elementId: string, e: React.MouseEvent) => {
    if (activeTool === 'hand' || isSpacePressed || e.button !== 0) return;
    e.stopPropagation();

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const canvasPt = screenToCanvas(e.clientX, e.clientY, viewport, rect);

    let nextSelected = selectedIds;
    if (e.shiftKey) {
      nextSelected = selectedIds.includes(elementId)
        ? selectedIds.filter((id) => id !== elementId)
        : [...selectedIds, elementId];
      onSelectElements(nextSelected);
    } else if (!selectedIds.includes(elementId)) {
      nextSelected = [elementId];
      onSelectElements(nextSelected);
    }

    // Save starting positions for all selected elements
    const positions: Record<string, { x: number; y: number }> = {};
    elements.forEach((el) => {
      if (nextSelected.includes(el.id)) {
        positions[el.id] = { x: el.x, y: el.y };
      }
    });

    setIsDraggingElements(true);
    setDragStartCanvas(canvasPt);
    setInitialElementPositions(positions);
  };

  // Start connector drag from an element's anchor
  const handleStartConnect = (elementId: string, anchor: AnchorPosition, e: React.MouseEvent) => {
    e.stopPropagation();
    const el = elements.find((item) => item.id === elementId);
    if (!el) return;

    const startPt = getElementAnchorPoint(el, anchor);
    setConnectingFrom({
      elementId,
      anchor,
      startPoint: startPt,
    });
    setConnectorPreviewPoint(startPt);
  };

  // Resize Start
  const handleResizeStart = (handle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIds.length !== 1 || !containerRef.current) return;
    const el = elements.find((item) => item.id === selectedIds[0]);
    if (!el) return;

    // Save initial state to history BEFORE resizing starts so Ctrl+Z can restore!
    onUpdateElement(el.id, {}, true);

    const rect = containerRef.current.getBoundingClientRect();
    const canvasPt = screenToCanvas(e.clientX, e.clientY, viewport, rect);

    setActiveResizeHandle(handle);
    setResizeStartElement(el);
    setResizeStartMouse(canvasPt);
  };

  // Sort elements: frames in background, connectors in middle, cards/shapes/stickies on top
  const sortedElements = [...elements].sort((a, b) => {
    if (a.type === 'frame' && b.type !== 'frame') return -1;
    if (a.type !== 'frame' && b.type === 'frame') return 1;
    return (a.zIndex || 0) - (b.zIndex || 0);
  });

  // Calculate points for connectors dynamically
  const getConnectorPoints = (conn: BoardElement): { p1: Point; p2: Point } => {
    let p1 = conn.startPoint || { x: conn.x, y: conn.y };
    let p2 = conn.endPoint || { x: conn.x + conn.width, y: conn.y + conn.height };

    if (conn.fromId) {
      const fromEl = elements.find((e) => e.id === conn.fromId);
      if (fromEl) {
        p1 = getElementAnchorPoint(fromEl, conn.fromAnchor || 'right');
      }
    }

    if (conn.toId) {
      const toEl = elements.find((e) => e.id === conn.toId);
      if (toEl) {
        p2 = getElementAnchorPoint(toEl, conn.toAnchor || 'left');
      }
    }

    return { p1, p2 };
  };

  // Single selected element for transform box
  const singleSelectedElement =
    selectedIds.length === 1 ? elements.find((el) => el.id === selectedIds[0]) : null;

  const cursorStyle = isPanning
    ? 'grabbing'
    : isSpacePressed || activeTool === 'hand'
    ? 'grab'
    : activeTool === 'pen' || activeTool === 'highlighter'
    ? 'crosshair'
    : activeTool === 'sticky' || activeTool === 'shape' || activeTool === 'card' || activeTool === 'text' || activeTool === 'stamp'
    ? 'copy'
    : 'default';

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden select-none bg-neutral-50"
      style={{ cursor: cursorStyle }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
      }}
      onDrop={(e) => {
        e.preventDefault();
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const pt = screenToCanvas(e.clientX, e.clientY, viewport, rect);
        const file = e.dataTransfer.files?.[0];
        if (file) {
          handleProcessFile(file, pt);
        }
      }}
    >
      {/* SVG Canvas for Grid, Connectors, Drawings and Transform Bounds */}
      <svg
        className="w-full h-full absolute inset-0 pointer-events-none"
        style={{
          width: '100%',
          height: '100%',
        }}
      >
        <defs>
          {/* Dot Grid Pattern */}
          <pattern
            id="dot-pattern"
            width={24 * viewport.zoom}
            height={24 * viewport.zoom}
            patternUnits="userSpaceOnUse"
            patternTransform={`translate(${viewport.x % (24 * viewport.zoom)}, ${
              viewport.y % (24 * viewport.zoom)
            })`}
          >
            <circle
              cx={2}
              cy={2}
              r={Math.max(1 * viewport.zoom, 0.8)}
              fill="#cbd5e1"
              opacity={0.6}
            />
          </pattern>

          {/* Line Grid Pattern */}
          <pattern
            id="line-pattern"
            width={24 * viewport.zoom}
            height={24 * viewport.zoom}
            patternUnits="userSpaceOnUse"
            patternTransform={`translate(${viewport.x % (24 * viewport.zoom)}, ${
              viewport.y % (24 * viewport.zoom)
            })`}
          >
            <path
              d={`M ${24 * viewport.zoom} 0 L 0 0 0 ${24 * viewport.zoom}`}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth={1}
            />
          </pattern>
        </defs>

        {/* Grid Background */}
        {gridType === 'dots' && (
          <rect width="100%" height="100%" fill="url(#dot-pattern)" />
        )}
        {gridType === 'lines' && (
          <rect width="100%" height="100%" fill="url(#line-pattern)" />
        )}

        {/* Scaled/Panned Scene Container for SVG items (Connectors, Drawings, TransformBox) */}
        <g
          transform={`translate(${viewport.x}, ${viewport.y}) scale(${viewport.zoom})`}
          className="pointer-events-auto"
        >
          {/* Connectors */}
          {sortedElements
            .filter((el) => el.type === 'connector')
            .map((conn) => {
              const { p1, p2 } = getConnectorPoints(conn);
              return (
                <ConnectorItem
                  key={conn.id}
                  element={conn}
                  isSelected={selectedIds.includes(conn.id)}
                  startPoint={p1}
                  endPoint={p2}
                  onUpdateLabel={(id, label) =>
                    onUpdateElement(id, { connectorLabel: label }, true)
                  }
                  onSelect={(id, e) => {
                    e.stopPropagation();
                    onSelectElements([id]);
                  }}
                />
              );
            })}

          {/* Active Connector Rubber-Band Preview */}
          {connectingFrom && connectorPreviewPoint && (
            <line
              x1={connectingFrom.startPoint.x}
              y1={connectingFrom.startPoint.y}
              x2={connectorPreviewPoint.x}
              y2={connectorPreviewPoint.y}
              stroke="#3b82f6"
              strokeWidth={2}
              strokeDasharray="6 4"
            />
          )}

          {/* Freehand Drawings */}
          {sortedElements
            .filter((el) => el.type === 'drawing')
            .map((drawing) => (
              <g
                key={drawing.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectElements([drawing.id]);
                }}
              >
                <DrawingItem
                  element={drawing}
                  isSelected={selectedIds.includes(drawing.id)}
                />
              </g>
            ))}

          {/* Live drawing stroke preview */}
          {isDrawing && currentDrawPoints.length > 1 && (
            <path
              d={currentDrawPoints
                .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`)
                .join(' ')}
              fill="none"
              stroke={activeTool === 'highlighter' ? '#fef08a' : '#0f172a'}
              strokeWidth={activeTool === 'highlighter' ? 24 : 3}
              opacity={activeTool === 'highlighter' ? 0.4 : 1}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </g>
      </svg>

      {/* HTML Elements Container (Stickies, Shapes, Cards, Frames, Text, Stamps) */}
      <div
        className="w-full h-full absolute inset-0 pointer-events-none"
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {sortedElements
          .filter((el) => el.type !== 'connector' && el.type !== 'drawing')
          .map((element) => {
            const isSelected = selectedIds.includes(element.id);
            const isConnecting = Boolean(connectingFrom);

            return (
              <div
                key={element.id}
                className="absolute pointer-events-auto"
                style={{
                  transform: `translate(${element.x}px, ${element.y}px)`,
                  width: `${element.width}px`,
                  height: `${element.height}px`,
                  zIndex: element.type === 'frame' ? 1 : element.zIndex || 10,
                }}
                onMouseDown={(e) => handleElementMouseDown(element.id, e)}
              >
                {element.type === 'sticky' && (
                  <StickyNote
                    element={element}
                    isSelected={isSelected}
                    isConnecting={isConnecting}
                    onUpdateText={(id, text) =>
                      onUpdateElement(id, { text }, true)
                    }
                    onStartConnect={handleStartConnect}
                  />
                )}

                {element.type === 'shape' && (
                  <ShapeItem
                    element={element}
                    isSelected={isSelected}
                    isConnecting={isConnecting}
                    onUpdateText={(id, text) =>
                      onUpdateElement(id, { text }, true)
                    }
                    onStartConnect={handleStartConnect}
                  />
                )}

                {element.type === 'card' && (
                  <CardItem
                    element={element}
                    isSelected={isSelected}
                    isConnecting={isConnecting}
                    onUpdateCard={(id, updates) =>
                      onUpdateElement(id, updates, true)
                    }
                    onStartConnect={handleStartConnect}
                  />
                )}

                {element.type === 'text' && (
                  <TextItem
                    element={element}
                    isSelected={isSelected}
                    onUpdateText={(id, text) =>
                      onUpdateElement(id, { text }, true)
                    }
                  />
                )}

                {element.type === 'frame' && (
                  <FrameItem
                    element={element}
                    isSelected={isSelected}
                    onUpdateTitle={(id, title) =>
                      onUpdateElement(id, { frameTitle: title }, true)
                    }
                    onStartPresentation={onStartPresentationFrame}
                  />
                )}

                {element.type === 'stamp' && (
                  <StampItem element={element} isSelected={isSelected} />
                )}

                {element.type === 'image' && (
                  <ImageItem
                    element={element}
                    isSelected={isSelected}
                    onUpdate={(updates) =>
                      onUpdateElement(element.id, updates, true)
                    }
                  />
                )}

                {(element.type === 'video' || element.type === 'audio') && (
                  <MediaItem
                    element={element}
                    isSelected={isSelected}
                    onUpdate={(updates) =>
                      onUpdateElement(element.id, updates, true)
                    }
                  />
                )}
              </div>
            );
          })}
      </div>

      {/* 3. Top Interactive Overlay Layer (Transform handles & Marquee) */}
      <svg
        className="w-full h-full absolute inset-0 pointer-events-none z-30"
        style={{
          width: '100%',
          height: '100%',
          overflow: 'visible',
        }}
      >
        <g
          transform={`translate(${viewport.x}, ${viewport.y}) scale(${viewport.zoom})`}
          style={{ transformOrigin: '0 0' }}
        >
          {/* Transform handles around single selection (except connectors & drawings) */}
          {singleSelectedElement &&
            singleSelectedElement.type !== 'connector' &&
            singleSelectedElement.type !== 'drawing' &&
            !singleSelectedElement.locked && (
              <TransformBox
                x={singleSelectedElement.x}
                y={singleSelectedElement.y}
                width={singleSelectedElement.width}
                height={singleSelectedElement.height}
                elementType={singleSelectedElement.type}
                borderRadius={
                  singleSelectedElement.type === 'sticky'
                    ? 8
                    : singleSelectedElement.borderRadius
                }
                zoom={viewport.zoom}
                isResizing={Boolean(activeResizeHandle)}
                onResizeStart={handleResizeStart}
              />
            )}

          {/* Marquee Selection Rectangle */}
          {marquee && (
            <rect
              x={Math.min(marquee.x1, marquee.x2)}
              y={Math.min(marquee.y1, marquee.y2)}
              width={Math.abs(marquee.x2 - marquee.x1)}
              height={Math.abs(marquee.y2 - marquee.y1)}
              fill="rgba(59, 130, 246, 0.12)"
              stroke="#3b82f6"
              strokeWidth={1}
              strokeDasharray="4 2"
            />
          )}
        </g>
      </svg>
    </div>
  );
};
