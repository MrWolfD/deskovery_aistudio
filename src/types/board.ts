export type ToolType =
  | 'select'
  | 'hand'
  | 'sticky'
  | 'shape'
  | 'text'
  | 'connector'
  | 'pen'
  | 'highlighter'
  | 'eraser'
  | 'frame'
  | 'card'
  | 'stamp'
  | 'image'
  | 'comment';

export type ShapeType =
  | 'rectangle'
  | 'rounded'
  | 'circle'
  | 'diamond'
  | 'triangle'
  | 'star'
  | 'cylinder'
  | 'cloud';

export type ConnectorLineType = 'curved' | 'orthogonal' | 'straight';

export type StickyColor =
  | 'yellow'
  | 'blue'
  | 'green'
  | 'pink'
  | 'purple'
  | 'orange'
  | 'gray'
  | 'dark';

export type AnchorPosition = 'top' | 'right' | 'bottom' | 'left';

export interface Point {
  x: number;
  y: number;
}

export interface BoardElement {
  id: string;
  type:
    | 'sticky'
    | 'shape'
    | 'text'
    | 'connector'
    | 'drawing'
    | 'frame'
    | 'card'
    | 'stamp'
    | 'image'
    | 'video'
    | 'audio';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  zIndex: number;
  locked?: boolean;
  frameId?: string;
  groupId?: string;

  // Image specific
  imageUrl?: string;
  imageAlt?: string;

  // Media (Video / Audio) specific
  mediaUrl?: string;
  mediaType?: 'video' | 'audio';
  mediaName?: string;
  mediaDuration?: number;
  loop?: boolean;
  isMuted?: boolean;

  // Visual styling
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  strokeStyle?: 'solid' | 'dashed' | 'dotted';
  opacity?: number;
  borderRadius?: number;

  // Text content
  text?: string;
  fontSize?: number;
  fontColor?: string;
  textAlign?: 'left' | 'center' | 'right';
  isBold?: boolean;
  isItalic?: boolean;

  // Specific properties
  shapeType?: ShapeType;
  stickyColor?: StickyColor;

  // Connector specific
  fromId?: string;
  toId?: string;
  fromAnchor?: AnchorPosition;
  toAnchor?: AnchorPosition;
  startPoint?: Point;
  endPoint?: Point;
  lineType?: ConnectorLineType;
  arrowEnd?: boolean;
  arrowStart?: boolean;
  connectorLabel?: string;

  // Freehand drawing specific
  points?: Point[];
  isHighlighter?: boolean;

  // Frame specific
  frameTitle?: string;
  framePreset?: '16:9' | '4:3' | 'A4' | 'Mobile' | 'Custom';

  // Card specific
  cardTitle?: string;
  cardDescription?: string;
  cardTag?: string;
  cardTagColor?: string;
  cardAssignee?: {
    name: string;
    avatarColor: string;
  };
  cardStatus?: 'todo' | 'in_progress' | 'done';

  // Stamp specific
  stampEmoji?: string;
}

export interface BoardComment {
  id: string;
  x: number;
  y: number;
  author: string;
  avatarColor: string;
  text: string;
  timestamp: number;
  resolved: boolean;
  replies?: Array<{
    id: string;
    author: string;
    text: string;
    timestamp: number;
  }>;
}

export interface Collaborator {
  id: string;
  name: string;
  color: string;
  role: string;
  cursor: Point;
  activeTargetId?: string;
  statusMessage?: string;
  isOnline: boolean;
}

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

export interface BoardTemplate {
  id: string;
  title: string;
  category: string;
  description: string;
  badge?: string;
  elements: BoardElement[];
}
