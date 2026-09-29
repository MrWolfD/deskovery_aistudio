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
const port = 3000;

app.use(express.json({ limit: '50mb' }));

// In-memory room state for real-time collaboration
interface RoomClient {
  ws: WebSocket;
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
  elements: any[];
  title: string;
  clients: Map<string, RoomClient>;
}

const rooms = new Map<string, RoomState>();

function getOrCreateRoom(roomId: string): RoomState {
  let room = rooms.get(roomId);
  if (!room) {
    room = {
      elements: [],
      title: 'Новая доска',
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
    if (client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(data);
      } catch (err) {
        console.error('Error broadcasting to client:', err);
      }
    }
  }
}

// REST health check and board state endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: Date.now(), activeRooms: rooms.size });
});

app.get('/api/rooms/:roomId', (req, res) => {
  const room = rooms.get(req.params.roomId);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  res.json({
    title: room.title,
    elementsCount: room.elements.length,
    usersCount: room.clients.size,
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
    let currentRoomId = 'default';
    let currentUserId: string | null = null;

    ws.on('message', (rawData: string) => {
      try {
        const msg = JSON.parse(rawData.toString());
        const { type, roomId = 'default' } = msg;

        switch (type) {
          case 'join': {
            currentRoomId = roomId;
            const uid: string = msg.user.id;
            currentUserId = uid;
            const room = getOrCreateRoom(roomId);

            // Store client
            room.clients.set(uid, {
              ws,
              user: msg.user,
            });

            // Send initial state to the newcomer
            const currentUsers = Array.from(room.clients.values()).map((c) => ({
              ...c.user,
              isOnline: true,
            }));

            ws.send(
              JSON.stringify({
                type: 'init',
                roomId,
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
            if (!currentUserId) return;
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
            const room = getOrCreateRoom(roomId);
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
            const room = getOrCreateRoom(roomId);
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
            const room = getOrCreateRoom(roomId);
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
            const room = getOrCreateRoom(roomId);
            const updatedMap = new Map(msg.elements.map((e: any) => [e.id, e]));
            room.elements = room.elements.map((e) => (updatedMap.has(e.id) ? updatedMap.get(e.id) : e));
            // Add any newly created elements that weren't present
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
            const room = getOrCreateRoom(roomId);
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
    console.log(`Polydesk server with WebSockets running on http://0.0.0.0:${port}`);
  });
}

startServer();
