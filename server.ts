import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '50mb' }));

// In-memory room state for real-time collaboration
interface RoomClient {
  ws: WebSocket;
  authenticated: boolean;
  user: {
    id: string;
    name: string;
    color: string;
    role?: string;
    cursor?: { x: number; y: number };
    statusMessage?: string;
  };
}

interface RoomState {
  id: string;
  title: string;
  description?: string;
  password?: string;
  createdAt: number;
  updatedAt: number;
  elements: any[];
  clients: Map<string, RoomClient>;
}

const rooms = new Map<string, RoomState>();

// Pre-seed default starter rooms
function initializeDefaultRooms() {
  if (!rooms.has('main')) {
    rooms.set('main', {
      id: 'main',
      title: 'Общая доска (Открытая)',
      description: 'Главное открытое пространство для быстрых заметок и брейнштормов',
      password: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      elements: [],
      clients: new Map(),
    });
  }

  if (!rooms.has('team-secret')) {
    rooms.set('team-secret', {
      id: 'team-secret',
      title: 'Командный спринт (Приватная)',
      description: 'Закрытая доска для спринтов и планов команды (Пароль по умолчанию: 1234)',
      password: '1234',
      createdAt: Date.now() - 3600000,
      updatedAt: Date.now(),
      elements: [],
      clients: new Map(),
    });
  }
}

initializeDefaultRooms();

function getOrCreateRoom(roomId: string, title?: string, password?: string, description?: string): RoomState {
  let room = rooms.get(roomId);
  if (!room) {
    room = {
      id: roomId,
      elements: [],
      title: title || (roomId === 'main' ? 'Общая доска' : `Доска ${roomId}`),
      description: description || '',
      password: password || '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      clients: new Map(),
    };
    rooms.set(roomId, room);
  }
  return room;
}

function broadcastToRoom(roomId: string, message: any, excludeUserId?: string | null) {
  const room = rooms.get(roomId);
  if (!room) return;
  const data = JSON.stringify(message);
  for (const [userId, client] of room.clients.entries()) {
    if (excludeUserId && userId === excludeUserId) continue;
    if (client.authenticated && client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(data);
      } catch (err) {
        console.error('Error broadcasting to client:', err);
      }
    }
  }
}

// REST Endpoints
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: Date.now(), activeRooms: rooms.size });
});

// List all rooms for Lobby (public info, passwords are NEVER exposed)
app.get('/api/rooms', (_req, res) => {
  const list = Array.from(rooms.values()).map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description || '',
    hasPassword: Boolean(r.password && r.password.trim().length > 0),
    usersCount: r.clients.size,
    elementsCount: r.elements.length,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
  res.json({ rooms: list });
});

// Create new room
app.post('/api/rooms', (req, res) => {
  const { title, description, password, customId } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Название комнаты обязательно' });
  }

  const rawId = (customId || title)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9а-яё_-]/gi, '-')
    .replace(/-+/g, '-')
    .slice(0, 30);
  
  const id = rawId && !rooms.has(rawId) ? rawId : `room-${Date.now().toString(36)}`;

  const newRoom: RoomState = {
    id,
    title: title.trim(),
    description: description ? description.trim() : '',
    password: password ? String(password).trim() : '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    elements: [],
    clients: new Map(),
  };

  rooms.set(id, newRoom);

  res.status(201).json({
    id: newRoom.id,
    title: newRoom.title,
    description: newRoom.description,
    hasPassword: Boolean(newRoom.password && newRoom.password.length > 0),
    createdAt: newRoom.createdAt,
  });
});

// Verify room password
app.post('/api/rooms/:roomId/verify', (req, res) => {
  const room = rooms.get(req.params.roomId);
  if (!room) {
    return res.status(404).json({ ok: false, error: 'Комната не найдена' });
  }

  const hasPassword = Boolean(room.password && room.password.trim().length > 0);
  if (!hasPassword) {
    return res.json({ ok: true, isProtected: false });
  }

  const inputPassword = req.body.password ? String(req.body.password).trim() : '';
  if (inputPassword === room.password?.trim()) {
    return res.json({ ok: true, isProtected: true });
  } else {
    return res.status(401).json({ ok: false, error: 'Неверный пароль или PIN-код' });
  }
});

// Get single room details
app.get('/api/rooms/:roomId', (req, res) => {
  const room = rooms.get(req.params.roomId);
  if (!room) {
    return res.status(404).json({ error: 'Комната не найдена' });
  }
  res.json({
    id: room.id,
    title: room.title,
    description: room.description || '',
    hasPassword: Boolean(room.password && room.password.trim().length > 0),
    elementsCount: room.elements.length,
    usersCount: room.clients.size,
    updatedAt: room.updatedAt,
  });
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const server = http.createServer(app);

  // Initialize WebSocket server
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws: WebSocket) => {
    let currentRoomId = 'main';
    let currentUserId: string | null = null;
    let isAuthenticated = false;

    ws.on('message', (rawData: string) => {
      try {
        const msg = JSON.parse(rawData.toString());
        const { type, roomId = 'main' } = msg;

        switch (type) {
          case 'join': {
            currentRoomId = roomId;
            const uid: string = msg.user.id;
            currentUserId = uid;
            const room = getOrCreateRoom(roomId);

            // Check password if room is protected
            const isProtected = Boolean(room.password && room.password.trim().length > 0);
            if (isProtected) {
              const providedPassword = msg.password ? String(msg.password).trim() : '';
              if (providedPassword !== room.password?.trim()) {
                ws.send(
                  JSON.stringify({
                    type: 'auth_error',
                    roomId,
                    message: 'Для доступа к этой комнате требуется верный пароль или PIN-код',
                  })
                );
                return;
              }
            }

            isAuthenticated = true;

            // Store authorized client
            room.clients.set(uid, {
              ws,
              authenticated: true,
              user: msg.user,
            });

            // Send initial state to the newcomer
            const currentUsers = Array.from(room.clients.values())
              .filter((c) => c.authenticated)
              .map((c) => ({
                ...c.user,
                isOnline: true,
              }));

            ws.send(
              JSON.stringify({
                type: 'init',
                roomId,
                isProtected,
                elements: room.elements,
                title: room.title,
                users: currentUsers,
              })
            );

            // Notify others
            broadcastToRoom(
              roomId,
              {
                type: 'user_joined',
                user: { ...msg.user, isOnline: true },
              },
              currentUserId
            );
            break;
          }

          case 'cursor_move': {
            if (!isAuthenticated || !currentUserId) return;
            const room = rooms.get(roomId);
            if (room) {
              const client = room.clients.get(currentUserId);
              if (client) {
                client.user.cursor = msg.cursor;
                if (msg.statusMessage !== undefined) {
                  client.user.statusMessage = msg.statusMessage;
                }
              }
            }
            broadcastToRoom(
              roomId,
              {
                type: 'cursor_moved',
                userId: currentUserId,
                cursor: msg.cursor,
                activeTargetId: msg.activeTargetId,
                statusMessage: msg.statusMessage,
              },
              currentUserId
            );
            break;
          }

          case 'element:create': {
            if (!isAuthenticated) return;
            const room = getOrCreateRoom(roomId);
            room.updatedAt = Date.now();
            const el = msg.element;
            const existingIdx = room.elements.findIndex((e) => e.id === el.id);
            if (existingIdx >= 0) {
              room.elements[existingIdx] = el;
            } else {
              room.elements.push(el);
            }
            broadcastToRoom(
              roomId,
              {
                type: 'element:created',
                element: el,
                senderId: currentUserId,
              },
              currentUserId
            );
            break;
          }

          case 'element:update': {
            if (!isAuthenticated) return;
            const room = getOrCreateRoom(roomId);
            room.updatedAt = Date.now();
            const { id, updates } = msg;
            const idx = room.elements.findIndex((e) => e.id === id);
            if (idx >= 0) {
              room.elements[idx] = { ...room.elements[idx], ...updates };
            }
            broadcastToRoom(
              roomId,
              {
                type: 'element:updated',
                id,
                updates,
                senderId: currentUserId,
              },
              currentUserId
            );
            break;
          }

          case 'element:delete': {
            if (!isAuthenticated) return;
            const room = getOrCreateRoom(roomId);
            room.updatedAt = Date.now();
            const idsToDelete: string[] = Array.isArray(msg.ids) ? msg.ids : [msg.id];
            room.elements = room.elements.filter((e) => !idsToDelete.includes(e.id));
            broadcastToRoom(
              roomId,
              {
                type: 'element:deleted',
                ids: idsToDelete,
                senderId: currentUserId,
              },
              currentUserId
            );
            break;
          }

          case 'elements:batch_update': {
            if (!isAuthenticated) return;
            const room = getOrCreateRoom(roomId);
            room.updatedAt = Date.now();
            const updatedMap = new Map(msg.elements.map((e: any) => [e.id, e]));
            room.elements = room.elements.map((e) => (updatedMap.has(e.id) ? updatedMap.get(e.id) : e));
            for (const el of msg.elements) {
              if (!room.elements.some((e) => e.id === el.id)) {
                room.elements.push(el);
              }
            }
            broadcastToRoom(
              roomId,
              {
                type: 'elements:batch_updated',
                elements: msg.elements,
                senderId: currentUserId,
              },
              currentUserId
            );
            break;
          }

          case 'board:sync_all': {
            if (!isAuthenticated) return;
            const room = getOrCreateRoom(roomId);
            room.updatedAt = Date.now();
            room.elements = msg.elements;
            if (msg.title) room.title = msg.title;
            broadcastToRoom(
              roomId,
              {
                type: 'board:synced_all',
                elements: msg.elements,
                title: msg.title,
                senderId: currentUserId,
              },
              currentUserId
            );
            break;
          }
        }
      } catch (err) {
        console.error('Error handling WebSocket message:', err);
      }
    });

    ws.on('close', () => {
      if (currentUserId && currentRoomId) {
        const room = rooms.get(currentRoomId);
        if (room) {
          room.clients.delete(currentUserId);
          broadcastToRoom(currentRoomId, {
            type: 'user_left',
            userId: currentUserId,
          });
        }
      }
    });
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`Deskovery server running with WebSockets on http://0.0.0.0:${port}`);
  });
}

startServer();
