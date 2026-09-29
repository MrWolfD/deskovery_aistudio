import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Respect reverse proxy headers (e.g. Caddy X-Forwarded-For)
app.set('trust proxy', 1);

app.use(express.json({ limit: '50mb' }));

// Security: Password Hashing & Timing-safe verification
const SALT = process.env.PASSWORD_SALT || 'deskovery_production_salt_v1';
const TEAM_PASSWORD = process.env.TEAM_PASSWORD || 'deskovery2026';

function hashPassword(password: string): string {
  if (!password) return '';
  return crypto.createHash('sha256').update(password.trim() + ':' + SALT).digest('hex');
}

function verifyPasswordSafe(inputPassword: string, storedHash: string): boolean {
  if (!storedHash) return true;
  const inputHash = hashPassword(inputPassword);
  if (inputHash.length !== storedHash.length) return false;
  return crypto.timingSafeEqual(Buffer.from(inputHash), Buffer.from(storedHash));
}

function generateInviteToken(): string {
  return crypto.randomBytes(12).toString('hex');
}

// In-Memory Team Session Tokens
const validTeamTokens = new Set<string>();

function createTeamToken(): string {
  const token = 'team_' + crypto.randomBytes(24).toString('hex');
  validTeamTokens.add(token);
  return token;
}

function isTeamAuthenticated(req: express.Request): boolean {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    if (validTeamTokens.has(token)) return true;
  }
  const customHeader = req.headers['x-team-token'] as string;
  if (customHeader && validTeamTokens.has(customHeader.trim())) {
    return true;
  }
  return false;
}

// Security: In-Memory Rate Limiting for Login & Verification (Brute-force protection)
interface RateLimitRecord {
  attempts: number;
  blockedUntil: number;
}

const loginRateLimits = new Map<string, RateLimitRecord>();

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const record = loginRateLimits.get(ip);
  if (!record) return { allowed: true };

  const now = Date.now();
  if (record.blockedUntil > now) {
    return {
      allowed: false,
      retryAfter: Math.ceil((record.blockedUntil - now) / 1000),
    };
  }

  if (record.blockedUntil > 0 && record.blockedUntil <= now) {
    loginRateLimits.delete(ip);
    return { allowed: true };
  }

  return { allowed: true };
}

function recordFailedAttempt(ip: string) {
  const now = Date.now();
  const record = loginRateLimits.get(ip) || { attempts: 0, blockedUntil: 0 };
  record.attempts += 1;

  if (record.attempts >= 5) {
    record.blockedUntil = now + 120 * 1000;
  }
  loginRateLimits.set(ip, record);
}

function recordSuccessfulAttempt(ip: string) {
  loginRateLimits.delete(ip);
}

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
  passwordHash?: string;
  inviteToken: string; // Secret invitation link token
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
      title: 'Общая доска команды',
      description: 'Главное открытое пространство для быстрых заметок и брейнштормов',
      passwordHash: '',
      inviteToken: 'public-main-invite',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      elements: [],
      clients: new Map(),
    });
  }

  if (!rooms.has('sprint-planning')) {
    rooms.set('sprint-planning', {
      id: 'sprint-planning',
      title: 'Командный спринт (Приватная)',
      description: 'Закрытая доска для спринтов и планов команды (Пароль по умолчанию: 1234)',
      passwordHash: hashPassword('1234'),
      inviteToken: 'sprint-secret-invite-token',
      createdAt: Date.now() - 3600000,
      updatedAt: Date.now(),
      elements: [],
      clients: new Map(),
    });
  }
}

initializeDefaultRooms();

function getOrCreateRoom(roomId: string, title?: string, rawPassword?: string, description?: string): RoomState {
  let room = rooms.get(roomId);
  if (!room) {
    room = {
      id: roomId,
      elements: [],
      title: title || (roomId === 'main' ? 'Общая доска команды' : `Доска ${roomId}`),
      description: description || '',
      passwordHash: rawPassword ? hashPassword(rawPassword) : '',
      inviteToken: generateInviteToken(),
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

// Team Authentication Endpoints
app.post('/api/auth/team-login', (req, res) => {
  const clientIp = (req.ip || req.socket.remoteAddress || 'unknown') as string;
  const rateLimitStatus = checkRateLimit(clientIp);

  if (!rateLimitStatus.allowed) {
    return res.status(429).json({
      ok: false,
      error: `Слишком много попыток. Подождите ${rateLimitStatus.retryAfter} сек. перед повторной попыткой.`,
    });
  }

  const { password } = req.body;
  const inputPassword = password ? String(password).trim() : '';

  if (verifyPasswordSafe(inputPassword, hashPassword(TEAM_PASSWORD))) {
    recordSuccessfulAttempt(clientIp);
    const token = createTeamToken();
    return res.json({ ok: true, token });
  } else {
    recordFailedAttempt(clientIp);
    return res.status(401).json({ ok: false, error: 'Неверный командный пароль' });
  }
});

app.get('/api/auth/team-verify', (req, res) => {
  const authenticated = isTeamAuthenticated(req);
  res.json({ ok: authenticated });
});

app.post('/api/auth/team-logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    validTeamTokens.delete(token);
  }
  res.json({ ok: true });
});

function calculateRoomSize(r: RoomState): number {
  try {
    return Buffer.byteLength(JSON.stringify(r.elements), 'utf8');
  } catch (e) {
    return 0;
  }
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 Б';
  const k = 1024;
  const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = parseFloat((bytes / Math.pow(k, i)).toFixed(1));
  return `${val} ${sizes[i]}`;
}

// List all rooms for Lobby — Protected for Team Members only!
app.get('/api/rooms', (req, res) => {
  if (!isTeamAuthenticated(req)) {
    return res.status(401).json({
      error: 'Требуется авторизация в командном пространстве',
      needsTeamAuth: true,
    });
  }

  const list = Array.from(rooms.values()).map((r) => {
    const sizeBytes = calculateRoomSize(r);
    return {
      id: r.id,
      title: r.title,
      description: r.description || '',
      hasPassword: Boolean(r.passwordHash && r.passwordHash.length > 0),
      usersCount: r.clients.size,
      elementsCount: r.elements.length,
      sizeBytes,
      sizeFormatted: formatBytes(sizeBytes),
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  });
  res.json({ rooms: list });
});

// Delete room (Team only, cannot delete 'main')
app.delete('/api/rooms/:roomId', (req, res) => {
  if (!isTeamAuthenticated(req)) {
    return res.status(401).json({ error: 'Требуется авторизация в команде' });
  }

  const { roomId } = req.params;
  if (roomId === 'main') {
    return res.status(400).json({ error: 'Главную доску нельзя удалить' });
  }

  const room = rooms.get(roomId);
  if (!room) {
    return res.status(404).json({ error: 'Комната не найдена' });
  }

  for (const client of room.clients.values()) {
    try {
      client.ws.send(JSON.stringify({ type: 'error', message: 'Комната была удалена' }));
      client.ws.close();
    } catch (e) {}
  }

  rooms.delete(roomId);
  res.json({ ok: true, deletedRoomId: roomId });
});

// Duplicate room as template (Team only)
app.post('/api/rooms/:roomId/duplicate', (req, res) => {
  if (!isTeamAuthenticated(req)) {
    return res.status(401).json({ error: 'Требуется авторизация в команде' });
  }

  const source = rooms.get(req.params.roomId);
  if (!source) {
    return res.status(404).json({ error: 'Исходная комната не найдена' });
  }

  const newId = `room-${Date.now().toString(36)}`;
  const clonedRoom: RoomState = {
    id: newId,
    title: `${source.title} (Копия)`,
    description: source.description,
    passwordHash: source.passwordHash,
    inviteToken: generateInviteToken(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    elements: JSON.parse(JSON.stringify(source.elements)),
    clients: new Map(),
  };

  rooms.set(newId, clonedRoom);
  res.status(201).json({
    id: clonedRoom.id,
    title: clonedRoom.title,
    inviteToken: clonedRoom.inviteToken,
  });
});

// Create new room — Protected for Team Members only!
app.post('/api/rooms', (req, res) => {
  if (!isTeamAuthenticated(req)) {
    return res.status(401).json({
      error: 'Создание новых досок доступно только авторизованным участникам команды',
      needsTeamAuth: true,
    });
  }

  const { title, description, password, customId } = req.body;
  if (!title || typeof title !== 'string' || !title.trim()) {
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
    title: title.trim().slice(0, 80),
    description: description ? String(description).trim().slice(0, 300) : '',
    passwordHash: password && String(password).trim().length > 0 ? hashPassword(String(password).trim()) : '',
    inviteToken: generateInviteToken(),
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
    hasPassword: Boolean(newRoom.passwordHash && newRoom.passwordHash.length > 0),
    inviteToken: newRoom.inviteToken,
    createdAt: newRoom.createdAt,
  });
});

// Verify room password or secret invite link
app.post('/api/rooms/:roomId/verify', (req, res) => {
  const clientIp = (req.ip || req.socket.remoteAddress || 'unknown') as string;
  const rateLimitStatus = checkRateLimit(clientIp);

  if (!rateLimitStatus.allowed) {
    return res.status(429).json({
      ok: false,
      error: `Слишком много попыток. Подождите ${rateLimitStatus.retryAfter} сек. перед повторной попыткой.`,
    });
  }

  const room = rooms.get(req.params.roomId);
  if (!room) {
    return res.status(404).json({ ok: false, error: 'Комната не найдена' });
  }

  const hasPassword = Boolean(room.passwordHash && room.passwordHash.length > 0);
  if (!hasPassword) {
    return res.json({ ok: true, isProtected: false, inviteToken: room.inviteToken });
  }

  // 1. Check Secret Invite Token (for friends / guests)
  const inputInvite = req.body.invite ? String(req.body.invite).trim() : '';
  if (inputInvite && inputInvite === room.inviteToken) {
    recordSuccessfulAttempt(clientIp);
    return res.json({
      ok: true,
      isProtected: true,
      authenticatedByInvite: true,
      inviteToken: room.inviteToken,
    });
  }

  // 2. Check Room Password
  const inputPassword = req.body.password ? String(req.body.password).trim() : '';
  const isMatch = verifyPasswordSafe(inputPassword, room.passwordHash || '');

  if (isMatch) {
    recordSuccessfulAttempt(clientIp);
    return res.json({
      ok: true,
      isProtected: true,
      inviteToken: room.inviteToken,
    });
  } else {
    recordFailedAttempt(clientIp);
    return res.status(401).json({ ok: false, error: 'Неверный пароль или недействительная ссылка-приглашение' });
  }
});

// Rotate secret invite link (revoke old invite and create a fresh one)
app.post('/api/rooms/:roomId/rotate-invite', (req, res) => {
  if (!isTeamAuthenticated(req)) {
    return res.status(401).json({ error: 'Только участники команды могут обновлять ссылки-приглашения' });
  }

  const room = rooms.get(req.params.roomId);
  if (!room) {
    return res.status(404).json({ error: 'Комната не найдена' });
  }

  room.inviteToken = generateInviteToken();
  res.json({ ok: true, inviteToken: room.inviteToken });
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
    hasPassword: Boolean(room.passwordHash && room.passwordHash.length > 0),
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

  // Initialize WebSocket server with 10MB maxPayload protection against DoS
  const wss = new WebSocketServer({
    server,
    maxPayload: 10 * 1024 * 1024, // 10MB maximum message size
  });

  wss.on('connection', (ws: WebSocket, req) => {
    let currentRoomId = 'main';
    let currentUserId: string | null = null;
    let isAuthenticated = false;
    const clientIp = (req.socket.remoteAddress || 'unknown') as string;

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

            // Check security if room is protected
            const isProtected = Boolean(room.passwordHash && room.passwordHash.length > 0);
            if (isProtected) {
              const providedInvite = msg.invite ? String(msg.invite).trim() : '';
              const providedPassword = msg.password ? String(msg.password).trim() : '';
              const providedTeamToken = msg.teamToken ? String(msg.teamToken).trim() : '';

              const isTeamMember = providedTeamToken && validTeamTokens.has(providedTeamToken);
              const isInviteValid = providedInvite && providedInvite === room.inviteToken;
              const isPasswordValid = verifyPasswordSafe(providedPassword, room.passwordHash || '');

              if (!isTeamMember && !isInviteValid && !isPasswordValid) {
                recordFailedAttempt(clientIp);
                ws.send(
                  JSON.stringify({
                    type: 'auth_error',
                    roomId,
                    message: 'Для доступа к этой комнате требуется верный пароль или ссылка-приглашение',
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
                inviteToken: room.inviteToken,
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
