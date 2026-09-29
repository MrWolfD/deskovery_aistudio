import { BoardElement, Point, Collaborator } from '../types/board';

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'local_sync';

export interface MultiplayerMessage {
  type: string;
  roomId?: string;
  userId?: string;
  user?: any;
  users?: any[];
  cursor?: Point;
  activeTargetId?: string;
  statusMessage?: string;
  element?: BoardElement;
  elements?: BoardElement[];
  id?: string;
  ids?: string[];
  updates?: Partial<BoardElement>;
  title?: string;
  senderId?: string;
  password?: string;
  invite?: string;
  inviteToken?: string;
  teamToken?: string;
  message?: string;
  isProtected?: boolean;
}

export interface MultiplayerCallbacks {
  onConnectionChange: (status: ConnectionStatus) => void;
  onUsersUpdate: (users: Collaborator[]) => void;
  onCursorMove: (userId: string, cursor: Point, activeTargetId?: string, statusMessage?: string) => void;
  onElementCreate: (element: BoardElement, senderId?: string) => void;
  onElementUpdate: (id: string, updates: Partial<BoardElement>, senderId?: string) => void;
  onElementDelete: (ids: string[], senderId?: string) => void;
  onElementsBatchUpdate: (elements: BoardElement[], senderId?: string) => void;
  onBoardSyncedAll: (elements: BoardElement[], title?: string, senderId?: string) => void;
  onAuthError?: (message: string) => void;
  onAuthSuccess?: (roomId: string, isProtected: boolean, inviteToken?: string) => void;
}

const COLORS = [
  '#6366f1', // Indigo
  '#ec4899', // Pink
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#f43f5e', // Rose
  '#3b82f6', // Blue
];

const NAMES = [
  'Алексей', 'Мария', 'Дмитрий', 'Анна',
  'Иван', 'Елена', 'Михаил', 'София',
  'Артем', 'Полина', 'Кирилл', 'Виктория'
];

export class MultiplayerService {
  private ws: WebSocket | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private roomId: string = 'main';
  private roomPassword: string = '';
  private inviteToken: string = '';
  private teamToken: string = '';
  private callbacks: MultiplayerCallbacks;
  private currentUser: Collaborator;
  private users: Map<string, Collaborator> = new Map();
  private reconnectTimer: any = null;
  private isDestroyed: boolean = false;
  private lastCursorSentTime: number = 0;
  private connectionStatus: ConnectionStatus = 'disconnected';

  constructor(
    callbacks: MultiplayerCallbacks,
    initialRoomId?: string,
    initialPassword?: string,
    initialInviteToken?: string,
    initialTeamToken?: string
  ) {
    this.callbacks = callbacks;
    this.roomId = initialRoomId || this.extractRoomIdFromUrl();
    this.roomPassword = initialPassword || '';
    this.inviteToken = initialInviteToken || this.extractInviteTokenFromUrl();
    this.teamToken = initialTeamToken || this.loadTeamToken();
    this.currentUser = this.loadOrInitUser();

    // Setup cross-tab BroadcastChannel fallback
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        this.broadcastChannel = new BroadcastChannel(`deskovery_room_${this.roomId}`);
        this.broadcastChannel.onmessage = (event) => {
          this.handleIncomingMessage(event.data);
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel not supported:', e);
    }

    this.connect();
  }

  private extractRoomIdFromUrl(): string {
    if (typeof window === 'undefined') return 'main';
    const params = new URLSearchParams(window.location.search);
    return params.get('room') || 'main';
  }

  private extractInviteTokenFromUrl(): string {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    return params.get('invite') || '';
  }

  private loadTeamToken(): string {
    if (typeof window === 'undefined') return '';
    try {
      return (
        localStorage.getItem('deskovery_team_token') ||
        sessionStorage.getItem('deskovery_team_token') ||
        ''
      );
    } catch (e) {
      return '';
    }
  }

  private loadOrInitUser(): Collaborator {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('deskovery_current_user') || localStorage.getItem('polydesk_current_user');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.id && parsed.name) {
            return parsed;
          }
        }
      } catch (e) {
        // ignore
      }
    }

    const randomName = NAMES[Math.floor(Math.random() * NAMES.length)];
    const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    const newUser: Collaborator = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: randomName,
      color: randomColor,
      role: 'Коллаборатор',
      cursor: { x: 0, y: 0 },
      isOnline: true,
    };

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('deskovery_current_user', JSON.stringify(newUser));
      } catch (e) {}
    }

    return newUser;
  }

  public getCurrentUser(): Collaborator {
    return this.currentUser;
  }

  public getRoomId(): string {
    return this.roomId;
  }

  public getInviteToken(): string {
    return this.inviteToken;
  }

  public setInviteToken(token: string) {
    this.inviteToken = token;
  }

  public setTeamToken(token: string) {
    this.teamToken = token;
  }

  public updateCurrentUser(updates: Partial<Collaborator>) {
    this.currentUser = { ...this.currentUser, ...updates };
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('deskovery_current_user', JSON.stringify(this.currentUser));
      } catch (e) {}
    }
    // Broadcast user update
    this.send({
      type: 'cursor_move',
      roomId: this.roomId,
      userId: this.currentUser.id,
      cursor: this.currentUser.cursor,
      statusMessage: this.currentUser.statusMessage,
    });
  }

  public authenticate(password: string) {
    this.roomPassword = password;
    this.send({
      type: 'join',
      roomId: this.roomId,
      user: this.currentUser,
      password: this.roomPassword,
      invite: this.inviteToken,
      teamToken: this.teamToken,
    });
  }

  public switchRoom(
    newRoomId: string,
    password: string = '',
    inviteToken: string = '',
    teamToken: string = ''
  ) {
    this.roomId = newRoomId;
    this.roomPassword = password;
    this.inviteToken = inviteToken;
    if (teamToken) this.teamToken = teamToken;

    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.close();
      } catch (e) {}
      try {
        this.broadcastChannel = new BroadcastChannel(`deskovery_room_${newRoomId}`);
        this.broadcastChannel.onmessage = (event) => {
          this.handleIncomingMessage(event.data);
        };
      } catch (e) {}
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send({
        type: 'join',
        roomId: this.roomId,
        user: this.currentUser,
        password: this.roomPassword,
        invite: this.inviteToken,
        teamToken: this.teamToken,
      });
    } else {
      this.connect();
    }
  }

  public connect() {
    if (this.isDestroyed) return;
    if (typeof window === 'undefined') return;

    this.setConnectionStatus('connecting');

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        if (this.isDestroyed) return;
        this.setConnectionStatus('connected');
        // Join the room with password, invite, and teamToken
        this.send({
          type: 'join',
          roomId: this.roomId,
          user: this.currentUser,
          password: this.roomPassword,
          invite: this.inviteToken,
          teamToken: this.teamToken,
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.handleIncomingMessage(msg);
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      this.ws.onclose = () => {
        if (this.isDestroyed) return;
        this.setConnectionStatus(this.broadcastChannel ? 'local_sync' : 'disconnected');
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        if (this.isDestroyed) return;
        this.setConnectionStatus(this.broadcastChannel ? 'local_sync' : 'disconnected');
      };
    } catch (err) {
      this.setConnectionStatus(this.broadcastChannel ? 'local_sync' : 'disconnected');
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer || this.isDestroyed) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.isDestroyed && (!this.ws || this.ws.readyState === WebSocket.CLOSED)) {
        this.connect();
      }
    }, 5000);
  }

  private setConnectionStatus(status: ConnectionStatus) {
    if (this.connectionStatus !== status) {
      this.connectionStatus = status;
      this.callbacks.onConnectionChange(status);
    }
  }

  private send(msg: MultiplayerMessage) {
    const enrichedMsg = { ...msg, roomId: this.roomId, senderId: this.currentUser.id };

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(enrichedMsg));
      } catch (err) {
        console.error('Error sending WS message:', err);
      }
    }

    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(enrichedMsg);
      } catch (e) {}
    }
  }

  private handleIncomingMessage(msg: MultiplayerMessage) {
    if (msg.senderId && msg.senderId === this.currentUser.id) {
      return;
    }

    switch (msg.type) {
      case 'auth_error': {
        this.callbacks.onAuthError?.(msg.message || 'Требуется пароль для доступа к комнате');
        break;
      }

      case 'init': {
        if (msg.inviteToken) {
          this.inviteToken = msg.inviteToken;
        }
        if (this.callbacks.onAuthSuccess) {
          this.callbacks.onAuthSuccess(msg.roomId || this.roomId, Boolean(msg.isProtected), msg.inviteToken);
        }
        if (Array.isArray(msg.users)) {
          this.users.clear();
          for (const u of msg.users) {
            if (u.id !== this.currentUser.id) {
              this.users.set(u.id, u);
            }
          }
          this.callbacks.onUsersUpdate(Array.from(this.users.values()));
        }
        if (Array.isArray(msg.elements)) {
          this.callbacks.onBoardSyncedAll(msg.elements, msg.title, msg.senderId);
        }
        break;
      }

      case 'user_joined': {
        if (msg.user && msg.user.id !== this.currentUser.id) {
          this.users.set(msg.user.id, msg.user);
          this.callbacks.onUsersUpdate(Array.from(this.users.values()));
        }
        break;
      }

      case 'user_left': {
        if (msg.userId) {
          this.users.delete(msg.userId);
          this.callbacks.onUsersUpdate(Array.from(this.users.values()));
        }
        break;
      }

      case 'cursor_moved': {
        if (msg.userId && msg.userId !== this.currentUser.id && msg.cursor) {
          const user = this.users.get(msg.userId);
          if (user) {
            user.cursor = msg.cursor;
            user.activeTargetId = msg.activeTargetId;
            if (msg.statusMessage !== undefined) user.statusMessage = msg.statusMessage;
          }
          this.callbacks.onCursorMove(msg.userId, msg.cursor, msg.activeTargetId, msg.statusMessage);
        }
        break;
      }

      case 'element:created': {
        if (msg.element) {
          this.callbacks.onElementCreate(msg.element, msg.senderId);
        }
        break;
      }

      case 'element:updated': {
        if (msg.id && msg.updates) {
          this.callbacks.onElementUpdate(msg.id, msg.updates, msg.senderId);
        }
        break;
      }

      case 'element:deleted': {
        const ids = msg.ids || (msg.id ? [msg.id] : []);
        if (ids.length > 0) {
          this.callbacks.onElementDelete(ids, msg.senderId);
        }
        break;
      }

      case 'elements:batch_updated': {
        if (Array.isArray(msg.elements)) {
          this.callbacks.onElementsBatchUpdate(msg.elements, msg.senderId);
        }
        break;
      }

      case 'board:synced_all': {
        if (Array.isArray(msg.elements)) {
          this.callbacks.onBoardSyncedAll(msg.elements, msg.title, msg.senderId);
        }
        break;
      }
    }
  }

  // Public Action Methods
  public sendCursorMove(cursor: Point, activeTargetId?: string, statusMessage?: string) {
    const now = Date.now();
    // Throttle cursor updates to 50ms for smooth 20 FPS network updates
    if (now - this.lastCursorSentTime < 50) return;
    this.lastCursorSentTime = now;
    this.currentUser.cursor = cursor;

    this.send({
      type: 'cursor_move',
      userId: this.currentUser.id,
      cursor,
      activeTargetId,
      statusMessage,
    });
  }

  public broadcastElementCreate(element: BoardElement) {
    this.send({
      type: 'element:create',
      element,
    });
  }

  public broadcastElementUpdate(id: string, updates: Partial<BoardElement>) {
    this.send({
      type: 'element:update',
      id,
      updates,
    });
  }

  public broadcastElementDelete(ids: string[]) {
    this.send({
      type: 'element:delete',
      ids,
    });
  }

  public broadcastElementsBatchUpdate(elements: BoardElement[]) {
    this.send({
      type: 'elements:batch_update',
      elements,
    });
  }

  public broadcastBoardSyncAll(elements: BoardElement[], title?: string) {
    this.send({
      type: 'board:sync_all',
      elements,
      title,
    });
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {}
      this.ws = null;
    }
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.close();
      } catch (e) {}
      this.broadcastChannel = null;
    }
  }
}
