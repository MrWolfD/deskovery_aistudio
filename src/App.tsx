/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  BoardElement,
  Collaborator,
  Point,
  ShapeType,
  StickyColor,
  ToolType,
  Viewport,
} from './types/board';
import { BOARD_TEMPLATES } from './constants/templates';
import { getBoardBounds } from './utils/math';
import { InfiniteCanvas } from './components/Canvas/InfiniteCanvas';
import { PrimaryToolbar } from './components/Toolbar/PrimaryToolbar';
import { ContextToolbar } from './components/Toolbar/ContextToolbar';
import { TopHeader } from './components/Navigation/TopHeader';
import { BottomControls } from './components/Navigation/BottomControls';
import { CollaboratorCursors } from './components/Canvas/CollaboratorCursors';
import { ExportModal } from './components/Modals/ExportModal';
import { ShortcutsModal } from './components/Modals/ShortcutsModal';
import { PresentationModal } from './components/Modals/PresentationModal';
import { ShareModal } from './components/Modals/ShareModal';
import { MediaUploadModal } from './components/Modals/MediaUploadModal';
import { MultiplayerService, ConnectionStatus } from './services/multiplayer';
import { LobbyPage } from './components/Lobby/LobbyPage';
import { LandingGate } from './components/Auth/LandingGate';

const STORAGE_KEY = 'deskovery_board_data_v1';
const LEGACY_STORAGE_KEY = 'polydesk_board_data_v3';

export default function App() {
  // Board State
  const [boardTitle, setBoardTitle] = useState('Deskovery Доска');
  const [elements, setElements] = useState<BoardElement[]>(() => {
    try {
      const saved =
        localStorage.getItem(STORAGE_KEY) ||
        localStorage.getItem(LEGACY_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.elements) && parsed.elements.length > 0) {
          return parsed.elements;
        }
      }
    } catch (e) {
      // fallback to initial template
    }
    return BOARD_TEMPLATES[0].elements;
  });

  // Undo / Redo Stacks
  const [undoStack, setUndoStack] = useState<BoardElement[][]>([]);
  const [redoStack, setRedoStack] = useState<BoardElement[][]>([]);

  // Selection & Tools
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [selectedStickyColor, setSelectedStickyColor] =
    useState<StickyColor>('yellow');
  const [selectedShapeType, setSelectedShapeType] =
    useState<ShapeType>('rectangle');
  const [selectedStamp, setSelectedStamp] = useState<string>('👍');

  // Viewport (Pan & Zoom)
  const [viewport, setViewport] = useState<Viewport>({
    x: 40,
    y: 30,
    zoom: 0.85,
  });

  // Grid & Snap
  const [gridType, setGridType] = useState<'dots' | 'lines' | 'none'>('dots');
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [showMinimap, setShowMinimap] = useState(true);

  // Modals & Panels
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isPresentationOpen, setIsPresentationOpen] = useState(false);
  const [presentationFrameId, setPresentationFrameId] = useState<
    string | undefined
  >();
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isMediaUploadOpen, setIsMediaUploadOpen] = useState(false);

  // Theme State: 'light' | 'dark'
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('deskovery_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('deskovery_theme', theme);
    }
  }, [theme]);

  // Team Token & Access Gate
  const [teamToken, setTeamToken] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return (
        localStorage.getItem('deskovery_team_token') ||
        sessionStorage.getItem('deskovery_team_token') ||
        ''
      );
    }
    return '';
  });

  // View Mode: 'gate' (Landing/Login) | 'lobby' (Team Rooms Catalog) | 'board' (Active Board)
  const [currentView, setCurrentView] = useState<'gate' | 'lobby' | 'board'>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      // Direct room link (e.g. ?room=xyz) opens board directly
      if (p.get('room')) return 'board';
      // Otherwise: if team is logged in -> lobby, else -> gate
      const saved =
        localStorage.getItem('deskovery_team_token') ||
        sessionStorage.getItem('deskovery_team_token');
      return saved ? 'lobby' : 'gate';
    }
    return 'gate';
  });

  // Real-time Multiplayer & Room State
  const multiplayerServiceRef = useRef<MultiplayerService | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [roomId, setRoomId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      return p.get('room') || 'main';
    }
    return 'main';
  });
  const [roomPassword, setRoomPassword] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      const r = p.get('room') || 'main';
      return sessionStorage.getItem(`deskovery_pass_${r}`) || '';
    }
    return '';
  });
  const [isCurrentRoomProtected, setIsCurrentRoomProtected] = useState<boolean>(false);
  const [inviteToken, setInviteToken] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      return p.get('invite') || '';
    }
    return '';
  });
  const [lobbyError, setLobbyError] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<Collaborator>(() => ({
    id: `user-${Date.now()}`,
    name: 'Вы',
    color: '#6366f1',
    role: 'Коллаборатор',
    cursor: { x: 0, y: 0 },
    isOnline: true,
  }));
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);

  // Team Login & Logout handlers
  const handleSuccessLogin = useCallback((token: string, remember: boolean) => {
    setTeamToken(token);
    if (remember) {
      localStorage.setItem('deskovery_team_token', token);
    } else {
      sessionStorage.setItem('deskovery_team_token', token);
    }
    if (multiplayerServiceRef.current) {
      multiplayerServiceRef.current.setTeamToken(token);
    }
    setCurrentView('lobby');
  }, []);

  const handleLogout = useCallback(() => {
    try {
      if (teamToken) {
        fetch('/api/auth/team-logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${teamToken}` },
        }).catch(() => {});
      }
    } catch (e) {}

    localStorage.removeItem('deskovery_team_token');
    sessionStorage.removeItem('deskovery_team_token');
    setTeamToken('');
    if (multiplayerServiceRef.current) {
      multiplayerServiceRef.current.setTeamToken('');
    }
    setCurrentView('gate');
  }, [teamToken]);

  // Rotate secret invite token for room
  const handleRotateInvite = useCallback(async () => {
    try {
      const headers: Record<string, string> = {};
      if (teamToken) headers['Authorization'] = `Bearer ${teamToken}`;

      const res = await fetch(`/api/rooms/${roomId}/rotate-invite`, {
        method: 'POST',
        headers,
      });
      if (res.ok) {
        const data = await res.json();
        if (data.inviteToken) {
          setInviteToken(data.inviteToken);
          multiplayerServiceRef.current?.setInviteToken(data.inviteToken);
          return data.inviteToken;
        }
      }
    } catch (e) {
      console.error('Failed to rotate invite token:', e);
    }
  }, [roomId, teamToken]);

  // Navigation handlers
  const handleSelectRoom = useCallback(
    (targetRoomId: string, password?: string, initialInvite?: string) => {
      setRoomId(targetRoomId);
      setRoomPassword(password || '');
      setInviteToken(initialInvite || '');
      setLobbyError(null);
      setCurrentView('board');

      // Update browser URL
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set('room', targetRoomId);
        if (initialInvite) {
          url.searchParams.set('invite', initialInvite);
        } else {
          url.searchParams.delete('invite');
        }
        window.history.pushState({}, '', url.toString());
      }

      if (multiplayerServiceRef.current) {
        multiplayerServiceRef.current.switchRoom(
          targetRoomId,
          password || '',
          initialInvite || '',
          teamToken
        );
      }
    },
    [teamToken]
  );

  const handleEnterDirectRoom = useCallback(
    (targetRoomId: string) => {
      handleSelectRoom(targetRoomId);
    },
    [handleSelectRoom]
  );

  const handleNavigateToLobby = useCallback(() => {
    if (!teamToken) {
      setCurrentView('gate');
    } else {
      setCurrentView('lobby');
    }
    setLobbyError(null);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('room');
      url.searchParams.delete('invite');
      window.history.pushState({}, '', url.pathname);
    }
  }, [teamToken]);

  // Connect to Multiplayer Room
  useEffect(() => {
    if (currentView !== 'board') return;

    const service = new MultiplayerService(
      {
        onConnectionChange: (status) => {
          setConnectionStatus(status);
        },
        onUsersUpdate: (users) => {
          setCollaborators(users);
        },
        onCursorMove: (userId, cursor, activeTargetId, statusMessage) => {
          setCollaborators((prev) => {
            const idx = prev.findIndex((u) => u.id === userId);
            if (idx >= 0) {
              const next = [...prev];
              next[idx] = {
                ...next[idx],
                cursor,
                activeTargetId,
                statusMessage:
                  statusMessage !== undefined
                    ? statusMessage
                    : next[idx].statusMessage,
              };
              return next;
            }
            return prev;
          });
        },
        onElementCreate: (element) => {
          setElements((prev) => {
            if (prev.some((e) => e.id === element.id)) return prev;
            return [...prev, element];
          });
        },
        onElementUpdate: (id, updates) => {
          setElements((prev) =>
            prev.map((el) => (el.id === id ? { ...el, ...updates } : el))
          );
        },
        onElementDelete: (ids) => {
          setElements((prev) => prev.filter((el) => !ids.includes(el.id)));
        },
        onElementsBatchUpdate: (updatedElements) => {
          const map = new Map(updatedElements.map((e) => [e.id, e]));
          setElements((prev) => {
            const res = prev.map((el) => (map.has(el.id) ? map.get(el.id)! : el));
            for (const el of updatedElements) {
              if (!res.some((e) => e.id === el.id)) {
                res.push(el);
              }
            }
            return res;
          });
        },
        onBoardSyncedAll: (syncedElements, title) => {
          if (Array.isArray(syncedElements) && syncedElements.length > 0) {
            setElements(syncedElements);
          }
          if (title) setBoardTitle(title);
        },
        onAuthError: (errMsg) => {
          setLobbyError(errMsg);
          setCurrentView('lobby');
        },
        onAuthSuccess: (_rId, isProtected, invToken) => {
          setIsCurrentRoomProtected(isProtected);
          if (invToken) {
            setInviteToken(invToken);
          }
        },
      },
      roomId,
      roomPassword,
      inviteToken,
      teamToken
    );

    multiplayerServiceRef.current = service;
    setCurrentUser(service.getCurrentUser());

    return () => {
      service.destroy();
    };
  }, [roomId, roomPassword, inviteToken, teamToken, currentView]);

  // Auto-save to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          title: boardTitle,
          elements,
        })
      );
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [elements, boardTitle]);

  // Push state to Undo History
  const pushHistory = useCallback((currentElements: BoardElement[]) => {
    setUndoStack((prev) => [...prev.slice(-30), currentElements]);
    setRedoStack([]);
  }, []);

  // Undo Handler
  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, prev.length - 1));
    setRedoStack((prev) => [...prev, elements]);
    setElements(previous);
    setSelectedIds([]);
  }, [undoStack, elements]);

  // Redo Handler
  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, prev.length - 1));
    setUndoStack((prev) => [...prev, elements]);
    setElements(next);
    setSelectedIds([]);
  }, [redoStack, elements]);

  // Add Element
  const handleAddElement = useCallback(
    (newEl: BoardElement) => {
      pushHistory(elements);
      setElements((prev) => [...prev, newEl]);
      multiplayerServiceRef.current?.broadcastElementCreate(newEl);
      if (activeTool !== 'pen' && activeTool !== 'highlighter') {
        setActiveTool('select');
      }
    },
    [elements, pushHistory, activeTool]
  );

  // Update Single Element
  const handleUpdateElement = useCallback(
    (id: string, updates: Partial<BoardElement>, saveToHistory = false) => {
      if (saveToHistory) {
        pushHistory(elements);
      }
      setElements((prev) =>
        prev.map((el) => (el.id === id ? { ...el, ...updates } : el))
      );
      multiplayerServiceRef.current?.broadcastElementUpdate(id, updates);
    },
    [elements, pushHistory]
  );

  // Update Multiple Elements
  const handleUpdateMultipleElements = useCallback(
    (
      updates: { id: string; changes: Partial<BoardElement> }[],
      saveToHistory = false
    ) => {
      if (saveToHistory) {
        pushHistory(elements);
      }
      const updateMap = new Map(updates.map((u) => [u.id, u.changes]));
      const updatedElements: BoardElement[] = [];
      setElements((prev) =>
        prev.map((el) => {
          const ch = updateMap.get(el.id);
          if (ch) {
            const next = { ...el, ...ch };
            updatedElements.push(next);
            return next;
          }
          return el;
        })
      );
      if (updatedElements.length > 0) {
        multiplayerServiceRef.current?.broadcastElementsBatchUpdate(updatedElements);
      }
    },
    [elements, pushHistory]
  );

  // Delete Selected Elements
  const handleDeleteSelected = useCallback(() => {
    if (selectedIds.length === 0) return;
    pushHistory(elements);
    const idsToDelete = elements
      .filter(
        (el) =>
          selectedIds.includes(el.id) ||
          (el.fromId && selectedIds.includes(el.fromId)) ||
          (el.toId && selectedIds.includes(el.toId))
      )
      .map((el) => el.id);

    multiplayerServiceRef.current?.broadcastElementDelete(idsToDelete);

    setElements((prev) =>
      prev.filter((el) => !idsToDelete.includes(el.id))
    );
    setSelectedIds([]);
  }, [elements, selectedIds, pushHistory]);

  // Duplicate Selected Elements
  const handleDuplicate = useCallback(() => {
    if (selectedIds.length === 0) return;
    pushHistory(elements);

    const newElements: BoardElement[] = [];
    const newSelectedIds: string[] = [];

    elements.forEach((el) => {
      if (selectedIds.includes(el.id)) {
        const newId = `${el.type}-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 6)}`;
        const duplicated: BoardElement = {
          ...el,
          id: newId,
          x: el.x + 30,
          y: el.y + 30,
          zIndex: (el.zIndex || 10) + 1,
        };
        newElements.push(duplicated);
        newSelectedIds.push(newId);
      }
    });

    setElements((prev) => [...prev, ...newElements]);
    setSelectedIds(newSelectedIds);
  }, [elements, selectedIds, pushHistory]);

  // Layering
  const handleBringForward = useCallback(() => {
    if (selectedIds.length === 0) return;
    pushHistory(elements);
    const maxZ = Math.max(...elements.map((el) => el.zIndex || 1), 10);
    setElements((prev) =>
      prev.map((el) =>
        selectedIds.includes(el.id) ? { ...el, zIndex: maxZ + 1 } : el
      )
    );
  }, [elements, selectedIds, pushHistory]);

  const handleSendBackward = useCallback(() => {
    if (selectedIds.length === 0) return;
    pushHistory(elements);
    const minZ = Math.min(...elements.map((el) => el.zIndex || 1), 1);
    setElements((prev) =>
      prev.map((el) =>
        selectedIds.includes(el.id)
          ? { ...el, zIndex: Math.max(minZ - 1, 1) }
          : el
      )
    );
  }, [elements, selectedIds, pushHistory]);

  const handleToggleLock = useCallback(() => {
    if (selectedIds.length === 0) return;
    pushHistory(elements);
    const anyUnlocked = elements.some(
      (el) => selectedIds.includes(el.id) && !el.locked
    );
    setElements((prev) =>
      prev.map((el) =>
        selectedIds.includes(el.id) ? { ...el, locked: anyUnlocked } : el
      )
    );
  }, [elements, selectedIds, pushHistory]);

  // Alignment
  const handleAlign = useCallback(
    (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
      if (selectedIds.length <= 1) return;
      pushHistory(elements);

      const selected = elements.filter((el) => selectedIds.includes(el.id));
      if (selected.length === 0) return;

      const minX = Math.min(...selected.map((el) => el.x));
      const maxX = Math.max(...selected.map((el) => el.x + el.width));
      const minY = Math.min(...selected.map((el) => el.y));
      const maxY = Math.max(...selected.map((el) => el.y + el.height));

      const midX = (minX + maxX) / 2;
      const midY = (minY + maxY) / 2;

      setElements((prev) =>
        prev.map((el) => {
          if (!selectedIds.includes(el.id)) return el;
          switch (type) {
            case 'left':
              return { ...el, x: minX };
            case 'center':
              return { ...el, x: midX - el.width / 2 };
            case 'right':
              return { ...el, x: maxX - el.width };
            case 'top':
              return { ...el, y: minY };
            case 'middle':
              return { ...el, y: midY - el.height / 2 };
            case 'bottom':
              return { ...el, y: maxY - el.height };
            default:
              return el;
          }
        })
      );
    },
    [elements, selectedIds, pushHistory]
  );

  // Distribution
  const handleDistribute = useCallback(
    (axis: 'horizontal' | 'vertical') => {
      if (selectedIds.length <= 2) return;
      pushHistory(elements);

      const selected = elements
        .filter((el) => selectedIds.includes(el.id))
        .sort((a, b) => (axis === 'horizontal' ? a.x - b.x : a.y - b.y));

      if (axis === 'horizontal') {
        const minX = selected[0].x;
        const lastEl = selected[selected.length - 1];
        const maxX = lastEl.x;
        const availableSpace = maxX - minX - selected[0].width;
        const gap = availableSpace / (selected.length - 1);

        let currentX = minX;
        const newPositions = new Map<string, number>();
        selected.forEach((el, index) => {
          if (index === 0) {
            newPositions.set(el.id, el.x);
            currentX += el.width + gap;
          } else if (index === selected.length - 1) {
            newPositions.set(el.id, el.x);
          } else {
            newPositions.set(el.id, currentX);
            currentX += el.width + gap;
          }
        });

        setElements((prev) =>
          prev.map((el) =>
            newPositions.has(el.id)
              ? { ...el, x: newPositions.get(el.id)! }
              : el
          )
        );
      } else {
        const minY = selected[0].y;
        const lastEl = selected[selected.length - 1];
        const maxY = lastEl.y;
        const availableSpace = maxY - minY - selected[0].height;
        const gap = availableSpace / (selected.length - 1);

        let currentY = minY;
        const newPositions = new Map<string, number>();
        selected.forEach((el, index) => {
          if (index === 0) {
            newPositions.set(el.id, el.y);
            currentY += el.height + gap;
          } else if (index === selected.length - 1) {
            newPositions.set(el.id, el.y);
          } else {
            newPositions.set(el.id, currentY);
            currentY += el.height + gap;
          }
        });

        setElements((prev) =>
          prev.map((el) =>
            newPositions.has(el.id)
              ? { ...el, y: newPositions.get(el.id)! }
              : el
          )
        );
      }
    },
    [elements, selectedIds, pushHistory]
  );

  // Grouping
  const handleGroup = useCallback(() => {
    if (selectedIds.length <= 1) return;
    pushHistory(elements);
    const newGroupId = `group-${Date.now()}`;
    setElements((prev) =>
      prev.map((el) =>
        selectedIds.includes(el.id) ? { ...el, groupId: newGroupId } : el
      )
    );
  }, [elements, selectedIds, pushHistory]);

  const handleUngroup = useCallback(() => {
    if (selectedIds.length === 0) return;
    pushHistory(elements);
    setElements((prev) =>
      prev.map((el) =>
        selectedIds.includes(el.id) ? { ...el, groupId: undefined } : el
      )
    );
  }, [elements, selectedIds, pushHistory]);

  // Selection with Group Awareness
  const handleSelectElements = useCallback(
    (ids: string[]) => {
      const groupIds = new Set<string>();
      elements.forEach((el) => {
        if (ids.includes(el.id) && el.groupId) {
          groupIds.add(el.groupId);
        }
      });

      if (groupIds.size > 0) {
        const expandedIds = new Set(ids);
        elements.forEach((el) => {
          if (el.groupId && groupIds.has(el.groupId)) {
            expandedIds.add(el.id);
          }
        });
        setSelectedIds(Array.from(expandedIds));
      } else {
        setSelectedIds(ids);
      }
    },
    [elements]
  );

  // Image Upload File Handler
  const handleUploadImageFile = useCallback(
    (file: File, position?: Point) => {
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

          const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
          const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
          const pos = position || {
            x: (screenWidth / 2 - viewport.x) / viewport.zoom,
            y: (screenHeight / 2 - viewport.y) / viewport.zoom,
          };

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

          handleAddElement(newImageElement);
          setSelectedIds([newImageElement.id]);
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    },
    [viewport, elements.length, handleAddElement]
  );

  // General Media Upload File Handler (Video, Audio, Image)
  const handleUploadMediaFile = useCallback(
    (file: File, position?: Point) => {
      const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
      const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
      const pos =
        position || {
          x: (screenWidth / 2 - viewport.x) / viewport.zoom,
          y: (screenHeight / 2 - viewport.y) / viewport.zoom,
        };

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

          handleAddElement(newVideoElement);
          setSelectedIds([newVideoElement.id]);
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

          handleAddElement(newAudioElement);
          setSelectedIds([newAudioElement.id]);
        };
        reader.readAsDataURL(file);
        return;
      }

      // Default to image
      handleUploadImageFile(file, position);
    },
    [viewport, elements.length, handleAddElement, handleUploadImageFile]
  );

  // Add media directly from modal
  const handleAddMediaElement = useCallback(
    (mediaData: Partial<BoardElement>) => {
      const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
      const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
      const centerPos = {
        x: (screenWidth / 2 - viewport.x) / viewport.zoom,
        y: (screenHeight / 2 - viewport.y) / viewport.zoom,
      };

      const w =
        mediaData.width ||
        (mediaData.type === 'video' ? 480 : mediaData.type === 'audio' ? 360 : 400);
      const h =
        mediaData.height ||
        (mediaData.type === 'video' ? 320 : mediaData.type === 'audio' ? 120 : 300);

      const newEl: BoardElement = {
        id: `${mediaData.type || 'media'}-${Date.now()}`,
        type: mediaData.type || 'video',
        x: centerPos.x - w / 2,
        y: centerPos.y - h / 2,
        width: w,
        height: h,
        zIndex: elements.length + 10,
        ...mediaData,
      } as BoardElement;

      handleAddElement(newEl);
      setSelectedIds([newEl.id]);
    },
    [viewport, elements.length, handleAddElement]
  );

  // Cursor Move for Real-time Multiplayer
  const handleCursorMove = useCallback(
    (canvasPoint: Point) => {
      multiplayerServiceRef.current?.sendCursorMove(canvasPoint, selectedIds[0]);
    },
    [selectedIds]
  );

  // Update Current User in Room
  const handleUpdateCurrentUser = useCallback(
    (updates: Partial<Collaborator>) => {
      multiplayerServiceRef.current?.updateCurrentUser(updates);
      setCurrentUser((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  // Switch / Join Room
  const handleSwitchRoom = useCallback((newRoomId: string) => {
    const cleanId = newRoomId.trim();
    if (!cleanId) return;
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('room', cleanId);
      window.history.pushState({}, '', url.toString());
    }
    setRoomId(cleanId);
  }, []);

  // Import Data
  const handleImportData = (newElements: BoardElement[], title?: string) => {
    pushHistory(elements);
    if (title) setBoardTitle(title);
    setElements(newElements);
    setSelectedIds([]);
    multiplayerServiceRef.current?.broadcastBoardSyncAll(newElements, title);
  };

  // Clear Board
  const handleClearBoard = () => {
    pushHistory(elements);
    setElements([]);
    setSelectedIds([]);
    multiplayerServiceRef.current?.broadcastBoardSyncAll([], boardTitle);
  };

  // Zoom Helpers
  const handleZoomIn = () => {
    setViewport((prev) => ({
      ...prev,
      zoom: Math.min(prev.zoom * 1.2, 4.0),
    }));
  };

  const handleZoomOut = () => {
    setViewport((prev) => ({
      ...prev,
      zoom: Math.max(prev.zoom * 0.8, 0.1),
    }));
  };

  const handleResetZoom = () => {
    setViewport((prev) => ({
      ...prev,
      zoom: 1.0,
    }));
  };

  const handleFitToContent = () => {
    if (elements.length === 0) {
      setViewport({ x: 0, y: 0, zoom: 1.0 });
      return;
    }
    const bounds = getBoardBounds(elements);
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    const zoom = Math.min(
      Math.max(
        Math.min(
          (screenWidth - 120) / (bounds.width + 100),
          (screenHeight - 140) / (bounds.height + 100)
        ),
        0.15
      ),
      1.5
    );

    setViewport({
      x: (screenWidth - bounds.width * zoom) / 2 - bounds.minX * zoom,
      y: (screenHeight - bounds.height * zoom) / 2 - bounds.minY * zoom,
      zoom,
    });
  };

  // Minimap Navigation
  const handleNavigateToPoint = (canvasX: number, canvasY: number) => {
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
    setViewport((prev) => ({
      ...prev,
      x: screenWidth / 2 - canvasX * prev.zoom,
      y: screenHeight / 2 - canvasY * prev.zoom,
    }));
  };

  // Frames for Presentation
  const frames = useMemo(
    () => elements.filter((el) => el.type === 'frame'),
    [elements]
  );

  const handleStartPresentation = (frameId?: string) => {
    if (frames.length === 0) return;
    setPresentationFrameId(frameId || frames[0].id);
    setIsPresentationOpen(true);
  };

  const handleFocusFrame = (frame: BoardElement) => {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const padding = 60;
    const zoom = Math.min(
      Math.max(
        Math.min(
          (screenWidth - padding * 2) / frame.width,
          (screenHeight - padding * 2) / frame.height
        ),
        0.3
      ),
      1.5
    );

    setViewport({
      x: (screenWidth - frame.width * zoom) / 2 - frame.x * zoom,
      y: (screenHeight - frame.height * zoom) / 2 - frame.y * zoom,
      zoom,
    });
  };

  // Auto-Grid / Tidy Up for sticky notes and elements
  const handleTidyUp = useCallback(() => {
    if (selectedIds.length <= 1) return;
    pushHistory(elements);

    const selected = elements.filter((el) => selectedIds.includes(el.id));
    if (selected.length <= 1) return;

    // Sort primarily by Y, then by X to preserve intuitive reading order
    const sorted = [...selected].sort((a, b) => {
      const rowDiff = Math.floor(a.y / 60) - Math.floor(b.y / 60);
      return rowDiff !== 0 ? rowDiff : a.x - b.x;
    });

    const minX = Math.min(...selected.map((el) => el.x));
    const minY = Math.min(...selected.map((el) => el.y));

    // Determine columns: 2 for 2-4 items, 3 for 5-6 items, 4 for 7-8 items, etc.
    const count = sorted.length;
    let cols = 2;
    if (count <= 3) cols = count;
    else if (count === 4) cols = 2;
    else if (count <= 6) cols = 3;
    else if (count <= 8) cols = 4;
    else cols = Math.ceil(Math.sqrt(count));

    // Determine typical/uniform cell width and height (max of selected elements)
    const cellWidth = Math.max(...selected.map((el) => el.width));
    const cellHeight = Math.max(...selected.map((el) => el.height));
    const gap = 20;

    // Build mapping of id -> new (x, y)
    const newPositions = new Map<string, { x: number; y: number }>();
    sorted.forEach((el, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      newPositions.set(el.id, {
        x: minX + col * (cellWidth + gap),
        y: minY + row * (cellHeight + gap),
      });
    });

    setElements((prev) =>
      prev.map((el) => {
        const pos = newPositions.get(el.id);
        return pos ? { ...el, x: pos.x, y: pos.y } : el;
      })
    );
  }, [elements, selectedIds, pushHistory]);

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      // Undo / Redo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Duplicate (Ctrl+D)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handleDuplicate();
        return;
      }

      // Group (Ctrl+G) / Ungroup (Ctrl+Shift+G)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        if (e.shiftKey) {
          handleUngroup();
        } else {
          handleGroup();
        }
        return;
      }

      // Delete (Del or Backspace)
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleDeleteSelected();
        return;
      }

      // Tool hotkeys
      switch (e.key.toLowerCase()) {
        case 'v':
          setActiveTool('select');
          break;
        case 'h':
          setActiveTool('hand');
          break;
        case 's':
          setActiveTool('sticky');
          break;
        case 'r':
          setActiveTool('shape');
          break;
        case 'c':
          setActiveTool('connector');
          break;
        case 't':
          setActiveTool('text');
          break;
        case 'p':
          setActiveTool('pen');
          break;
        case 'f':
          setActiveTool('frame');
          break;
        case '?':
          setIsShortcutsModalOpen((prev) => !prev);
          break;
        case 'escape':
          setSelectedIds([]);
          setActiveTool('select');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleUndo,
    handleRedo,
    handleDuplicate,
    handleDeleteSelected,
    handleGroup,
    handleUngroup,
  ]);

  // Selected Elements Object List for ContextToolbar
  const selectedElements = useMemo(
    () => elements.filter((el) => selectedIds.includes(el.id)),
    [elements, selectedIds]
  );

  // Position for ContextToolbar
  const contextToolbarPosition = useMemo(() => {
    if (selectedElements.length === 0) return null;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;

    selectedElements.forEach((el) => {
      if (el.type === 'connector') {
        const p1 = el.startPoint || { x: el.x, y: el.y };
        const p2 = el.endPoint || { x: el.x, y: el.y };
        minX = Math.min(minX, p1.x, p2.x);
        minY = Math.min(minY, p1.y, p2.y);
        maxX = Math.max(maxX, p1.x, p2.x);
      } else if (el.type === 'drawing' && el.points && el.points.length > 0) {
        el.points.forEach((pt) => {
          minX = Math.min(minX, pt.x);
          minY = Math.min(minY, pt.y);
          maxX = Math.max(maxX, pt.x);
        });
      } else {
        minX = Math.min(minX, el.x);
        minY = Math.min(minY, el.y);
        maxX = Math.max(maxX, el.x + el.width);
      }
    });

    if (minX === Infinity) return null;

    const screenX = ((minX + maxX) / 2) * viewport.zoom + viewport.x;
    const screenY = minY * viewport.zoom + viewport.y - 50;

    return {
      left: Math.max(120, Math.min(window.innerWidth - 300, screenX)),
      top: Math.max(70, screenY),
    };
  }, [selectedElements, viewport]);

  if (currentView === 'gate') {
    return (
      <LandingGate
        onSuccessLogin={handleSuccessLogin}
        onEnterDirectRoom={handleEnterDirectRoom}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  if (currentView === 'lobby') {
    return (
      <LobbyPage
        onSelectRoom={handleSelectRoom}
        initialError={lobbyError}
        teamToken={teamToken}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  return (
    <div
      className={`w-screen h-screen relative overflow-hidden flex flex-col font-sans select-none transition-colors ${
        theme === 'dark' ? 'bg-neutral-950 text-neutral-100' : 'bg-neutral-50 text-neutral-900'
      }`}
    >
      {/* Top Header */}
      <TopHeader
        boardTitle={boardTitle}
        onUpdateTitle={setBoardTitle}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onOpenExport={() => setIsExportModalOpen(true)}
        onStartPresentation={() => handleStartPresentation()}
        hasFrames={frames.length > 0}
        collaborators={collaborators}
        isMultiplayerActive={true}
        connectionStatus={connectionStatus}
        roomId={roomId}
        isProtected={isCurrentRoomProtected}
        theme={theme}
        onToggleTheme={toggleTheme}
        onNavigateToLobby={handleNavigateToLobby}
        onOpenShareModal={() => setIsShareModalOpen(true)}
      />

      {/* Main Infinite Canvas */}
      <main className="flex-1 w-full h-full relative">
        <InfiniteCanvas
          elements={elements}
          selectedIds={selectedIds}
          activeTool={activeTool}
          selectedStickyColor={selectedStickyColor}
          selectedShapeType={selectedShapeType}
          selectedStamp={selectedStamp}
          viewport={viewport}
          gridType={gridType}
          snapToGrid={snapToGrid}
          theme={theme}
          onUpdateViewport={setViewport}
          onSelectElements={handleSelectElements}
          onAddElement={handleAddElement}
          onUpdateElement={handleUpdateElement}
          onUpdateMultipleElements={handleUpdateMultipleElements}
          onDeleteSelected={handleDeleteSelected}
          onStartPresentationFrame={handleStartPresentation}
          onUploadImageFile={handleUploadImageFile}
          onUploadMediaFile={handleUploadMediaFile}
          onCursorMove={handleCursorMove}
          onSelectTool={setActiveTool}
        />

        {/* Live Multiplayer Real Cursors */}
        <CollaboratorCursors
          collaborators={collaborators}
          zoom={viewport.zoom}
          viewportX={viewport.x}
          viewportY={viewport.y}
        />

        {/* Primary Left Vertical Toolbar */}
        <PrimaryToolbar
          activeTool={activeTool}
          onSelectTool={setActiveTool}
          selectedStickyColor={selectedStickyColor}
          onSelectStickyColor={setSelectedStickyColor}
          selectedShapeType={selectedShapeType}
          onSelectShapeType={setSelectedShapeType}
          selectedStamp={selectedStamp}
          onSelectStamp={setSelectedStamp}
          onUploadImageFile={handleUploadImageFile}
          onOpenMediaUpload={() => setIsMediaUploadOpen(true)}
        />

        {/* Floating Context Toolbar above selection */}
        {contextToolbarPosition && selectedElements.length > 0 && (
          <div
            className="absolute transition-all duration-75 z-40"
            style={{
              left: `${contextToolbarPosition.left}px`,
              top: `${contextToolbarPosition.top}px`,
              transform: 'translateX(-50%)',
            }}
          >
            <ContextToolbar
              selectedElements={selectedElements}
              onUpdateElement={(id, updates) =>
                handleUpdateElement(id, updates, true)
              }
              onDuplicate={handleDuplicate}
              onDelete={handleDeleteSelected}
              onBringForward={handleBringForward}
              onSendBackward={handleSendBackward}
              onToggleLock={handleToggleLock}
              onAlign={handleAlign}
              onDistribute={handleDistribute}
              onGroup={handleGroup}
              onUngroup={handleUngroup}
              onTidyUp={handleTidyUp}
            />
          </div>
        )}

        {/* Bottom Floating Controls: Zoom, Minimap, Grid, Hotkeys */}
        <BottomControls
          viewport={viewport}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetZoom={handleResetZoom}
          onFitToContent={handleFitToContent}
          elements={elements}
          showMinimap={showMinimap}
          onToggleMinimap={() => setShowMinimap(!showMinimap)}
          onNavigateToPoint={handleNavigateToPoint}
          gridType={gridType}
          onChangeGridType={setGridType}
          snapToGrid={snapToGrid}
          onToggleSnapToGrid={() => setSnapToGrid(!snapToGrid)}
          onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
        />
      </main>

      {/* Export & Import Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        elements={elements}
        boardTitle={boardTitle}
        onImportData={handleImportData}
        onClearBoard={handleClearBoard}
      />

      {/* Keyboard Shortcuts Cheat Sheet */}
      <ShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />

      {/* Fullscreen Presentation Mode */}
      <PresentationModal
        isOpen={isPresentationOpen}
        onClose={() => setIsPresentationOpen(false)}
        frames={frames}
        initialFrameId={presentationFrameId}
        onFocusFrame={handleFocusFrame}
      />

      {/* Real-time Multiplayer & Room Sharing Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        roomId={roomId}
        isProtected={isCurrentRoomProtected}
        inviteToken={inviteToken}
        onRotateInvite={handleRotateInvite}
        currentUser={currentUser}
        collaborators={collaborators}
        connectionStatus={connectionStatus}
        onUpdateCurrentUser={handleUpdateCurrentUser}
        onSwitchRoom={handleSwitchRoom}
      />

      {/* Media Upload Modal (Video, Audio, Image) */}
      <MediaUploadModal
        isOpen={isMediaUploadOpen}
        onClose={() => setIsMediaUploadOpen(false)}
        onAddMediaElement={handleAddMediaElement}
      />
    </div>
  );
}
