import React, {
  createContext,
  useContext,
  useReducer,
  useMemo,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import type {
  AppState,
  AppAction,
  Board,
  Column,
  Card,
  Comment,
  SyncEvent,
  ActiveUser,
} from '../types';
import { generateId } from '../lib/utils';
import { SyncEngine, STATE_KEY } from '../lib/syncEngine';
import { loadIdentity, saveIdentity, identityToActiveUser } from '../lib/userRegistry';

// ─── Identity ─────────────────────────────────────────────────────────────────
// Loaded from localStorage so it persists across tab opens.
// Returns null when the user hasn't registered a name yet.

const loadCurrentUser = (): ActiveUser | null => {
  const identity = loadIdentity();
  if (!identity) return null;
  return identityToActiveUser(identity);
};

// ─── Shared board state ───────────────────────────────────────────────────────

interface PersistedState {
  boards: AppState['boards'];
  columns: AppState['columns'];
  cards: AppState['cards'];
  comments: AppState['comments'];
  ui: AppState['ui'];
}

function buildInitialCollab(user: ActiveUser | null): AppState['collab'] {
  const guest: ActiveUser = {
    id: `guest-${Date.now()}`,
    name: '',
    color: '#94a3b8',
    lastSeen: new Date().toISOString(),
    currentBoardId: null,
  };
  const currentUser = user ?? guest;
  return {
    currentUser,
    activeUsers: user ? [currentUser] : [],
    lastSyncedAt: null,
    pendingEvents: [],
    conflictLog: [],
    isConnected: false,
  };
}

const emptyBoardState: PersistedState = {
  boards:   { byId: {}, allIds: [] },
  columns:  { byId: {}, allIds: [] },
  cards:    { byId: {}, allIds: [] },
  comments: { byId: {}, byCardId: {}, byParentId: {} },
  ui: {
    activeBoardId: null,
    editingCardId: null,
    editingColumnId: null,
    modalType: null,
    modalData: {},
  },
};

function loadBoardState(): PersistedState {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return emptyBoardState;
    const parsed = JSON.parse(raw);
    return {
      boards:   parsed.boards   || emptyBoardState.boards,
      columns:  parsed.columns  || emptyBoardState.columns,
      cards:    parsed.cards    || emptyBoardState.cards,
      comments: parsed.comments || emptyBoardState.comments,
      ui: {
        ...emptyBoardState.ui,
        activeBoardId: parsed.ui?.activeBoardId ?? null,
      },
    };
  } catch {
    return emptyBoardState;
  }
}

function buildInitialState(): AppState {
  const user = loadCurrentUser();
  return {
    ...loadBoardState(),
    collab: buildInitialCollab(user),
  };
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {

    // ── BOARDS ────────────────────────────────────────────────────────────────
    case 'CREATE_BOARD': {
      const boardId = generateId();
      const newBoard: Board = {
        id: boardId,
        title: action.payload.title,
        description: action.payload.description,
        createdAt: new Date().toISOString(),
        columnIds: [],
      };
      return {
        ...state,
        boards: {
          byId: { ...state.boards.byId, [boardId]: newBoard },
          allIds: [...state.boards.allIds, boardId],
        },
      };
    }

    case 'DELETE_BOARD': {
      const { boardId } = action.payload;
      const board = state.boards.byId[boardId];
      if (!board) return state;
      const columnIds = board.columnIds;
      const cardIds = columnIds.flatMap((id) => state.columns.byId[id]?.cardIds || []);
      const { [boardId]: _b, ...remainingBoards } = state.boards.byId;
      const newCols = { ...state.columns.byId };
      const newCards = { ...state.cards.byId };
      columnIds.forEach((id) => delete newCols[id]);
      cardIds.forEach((id) => delete newCards[id]);
      return {
        ...state,
        boards:  { byId: remainingBoards, allIds: state.boards.allIds.filter((id) => id !== boardId) },
        columns: { byId: newCols, allIds: state.columns.allIds.filter((id) => !columnIds.includes(id)) },
        cards:   { byId: newCards, allIds: state.cards.allIds.filter((id) => !cardIds.includes(id)) },
        ui: state.ui.activeBoardId === boardId ? { ...state.ui, activeBoardId: null } : state.ui,
      };
    }

    case 'SET_ACTIVE_BOARD':
      return { ...state, ui: { ...state.ui, activeBoardId: action.payload.boardId } };

    // ── COLUMNS ───────────────────────────────────────────────────────────────
    case 'CREATE_COLUMN': {
      const columnId = generateId();
      const board = state.boards.byId[action.payload.boardId];
      if (!board) return state;
      const newColumn: Column = {
        id: columnId,
        boardId: action.payload.boardId,
        title: action.payload.title,
        cardIds: [],
        order: board.columnIds.length,
      };
      return {
        ...state,
        columns: { byId: { ...state.columns.byId, [columnId]: newColumn }, allIds: [...state.columns.allIds, columnId] },
        boards: { ...state.boards, byId: { ...state.boards.byId, [action.payload.boardId]: { ...board, columnIds: [...board.columnIds, columnId] } } },
      };
    }

    case 'UPDATE_COLUMN': {
      const col = state.columns.byId[action.payload.columnId];
      if (!col) return state;
      return { ...state, columns: { ...state.columns, byId: { ...state.columns.byId, [action.payload.columnId]: { ...col, title: action.payload.title } } } };
    }

    case 'DELETE_COLUMN': {
      const { columnId } = action.payload;
      const col = state.columns.byId[columnId];
      if (!col) return state;
      const board = state.boards.byId[col.boardId];
      const cardIds = col.cardIds;
      const { [columnId]: _dc, ...remainingCols } = state.columns.byId;
      const newCards = { ...state.cards.byId };
      cardIds.forEach((id) => delete newCards[id]);
      return {
        ...state,
        columns: { byId: remainingCols, allIds: state.columns.allIds.filter((id) => id !== columnId) },
        cards:   { byId: newCards, allIds: state.cards.allIds.filter((id) => !cardIds.includes(id)) },
        boards: board
          ? { ...state.boards, byId: { ...state.boards.byId, [board.id]: { ...board, columnIds: board.columnIds.filter((id) => id !== columnId) } } }
          : state.boards,
      };
    }

    // ── CARDS ─────────────────────────────────────────────────────────────────
    case 'CREATE_CARD': {
      const cardId = action.payload._cardId || generateId();
      const col = state.columns.byId[action.payload.columnId];
      if (!col) return state;
      const newCard: Card = {
        id: cardId,
        columnId: action.payload.columnId,
        title: action.payload.title,
        description: action.payload.description,
        tags: action.payload.tags,
        dueDate: action.payload.dueDate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
        lastEditedBy: state.collab.currentUser.name,
      };
      return {
        ...state,
        cards:   { byId: { ...state.cards.byId, [cardId]: newCard }, allIds: [...state.cards.allIds, cardId] },
        columns: { ...state.columns, byId: { ...state.columns.byId, [action.payload.columnId]: { ...col, cardIds: [...col.cardIds, cardId] } } },
      };
    }

    case 'UPDATE_CARD': {
      const card = state.cards.byId[action.payload.cardId];
      if (!card) return state;
      const incoming = action.payload.updates;
      const incomingVersion = (incoming.version as number) ?? card.version;
      if (action.payload.fromSync && incomingVersion < card.version) return state;
      return {
        ...state,
        cards: {
          ...state.cards,
          byId: {
            ...state.cards.byId,
            [action.payload.cardId]: {
              ...card,
              ...incoming,
              version: Math.max(card.version, incomingVersion) + (action.payload.fromSync ? 0 : 1),
              updatedAt: new Date().toISOString(),
            },
          },
        },
      };
    }

    case 'DELETE_CARD': {
      const { cardId } = action.payload;
      const card = state.cards.byId[cardId];
      if (!card) return state;
      const col = state.columns.byId[card.columnId];
      const { [cardId]: _dc2, ...remainingCards } = state.cards.byId;
      return {
        ...state,
        cards:   { byId: remainingCards, allIds: state.cards.allIds.filter((id) => id !== cardId) },
        columns: col
          ? { ...state.columns, byId: { ...state.columns.byId, [col.id]: { ...col, cardIds: col.cardIds.filter((id) => id !== cardId) } } }
          : state.columns,
      };
    }

    case 'RESTORE_CARD': {
      const { card, indexInColumn } = action.payload;
      const col = state.columns.byId[card.columnId];
      if (!col || state.cards.byId[card.id]) return state;
      const newCardIds = [...col.cardIds];
      newCardIds.splice(Math.min(indexInColumn, newCardIds.length), 0, card.id);
      return {
        ...state,
        cards:   { byId: { ...state.cards.byId, [card.id]: card }, allIds: [...state.cards.allIds, card.id] },
        columns: { ...state.columns, byId: { ...state.columns.byId, [col.id]: { ...col, cardIds: newCardIds } } },
      };
    }

    case 'MOVE_CARD': {
      const { cardId, sourceColumnId, destinationColumnId, newIndex } = action.payload;
      const srcCol = state.columns.byId[sourceColumnId];
      const dstCol = state.columns.byId[destinationColumnId];
      const card   = state.cards.byId[cardId];
      if (!srcCol || !dstCol || !card) return state;
      const srcIds = srcCol.cardIds.filter((id) => id !== cardId);
      const dstIds = sourceColumnId === destinationColumnId
        ? [...srcIds]
        : dstCol.cardIds.filter((id) => id !== cardId);
      dstIds.splice(newIndex, 0, cardId);
      return {
        ...state,
        cards:   { ...state.cards, byId: { ...state.cards.byId, [cardId]: { ...card, columnId: destinationColumnId } } },
        columns: {
          ...state.columns,
          byId: {
            ...state.columns.byId,
            [sourceColumnId]:      { ...srcCol, cardIds: srcIds },
            [destinationColumnId]: { ...dstCol, cardIds: dstIds },
          },
        },
      };
    }

    // ── COMMENTS ──────────────────────────────────────────────────────────────
    case 'ADD_COMMENT': {
      const commentId = action.payload.commentId || generateId();
      if (state.comments.byId[commentId]) return state; // idempotent
      const comment: Comment = {
        id: commentId,
        cardId: action.payload.cardId,
        parentId: action.payload.parentId,
        text: action.payload.text,
        author: action.payload.author,
        authorColor: action.payload.authorColor,
        createdAt: new Date().toISOString(),
        editedAt: null,
        isDeleted: false,
      };
      const newByCardId   = { ...state.comments.byCardId };
      const newByParentId = { ...state.comments.byParentId };
      if (action.payload.parentId === null) {
        newByCardId[action.payload.cardId] = [...(newByCardId[action.payload.cardId] || []), commentId];
      } else {
        newByParentId[action.payload.parentId] = [...(newByParentId[action.payload.parentId] || []), commentId];
      }
      return { ...state, comments: { byId: { ...state.comments.byId, [commentId]: comment }, byCardId: newByCardId, byParentId: newByParentId } };
    }

    case 'EDIT_COMMENT': {
      const comment = state.comments.byId[action.payload.commentId];
      if (!comment) return state;
      return { ...state, comments: { ...state.comments, byId: { ...state.comments.byId, [action.payload.commentId]: { ...comment, text: action.payload.text, editedAt: new Date().toISOString() } } } };
    }

    case 'DELETE_COMMENT': {
      const comment = state.comments.byId[action.payload.commentId];
      if (!comment) return state;
      return { ...state, comments: { ...state.comments, byId: { ...state.comments.byId, [action.payload.commentId]: { ...comment, isDeleted: true, text: '[deleted]' } } } };
    }

    // ── COLLAB ────────────────────────────────────────────────────────────────
    case 'SET_ACTIVE_USERS':
      return { ...state, collab: { ...state.collab, activeUsers: action.payload.users } };

    case 'SET_CONNECTED':
      return { ...state, collab: { ...state.collab, isConnected: action.payload.connected } };

    case 'LOG_CONFLICT':
      return { ...state, collab: { ...state.collab, conflictLog: [action.payload.entry, ...state.collab.conflictLog].slice(0, 20) } };

    case 'RELOAD_BOARD_STATE': {
      // Called when another tab writes to STATE_KEY — merge their board state
      // into ours while keeping our collab/UI state intact.
      const fresh = loadBoardState();
      return {
        ...state,
        boards:   fresh.boards,
        columns:  fresh.columns,
        cards:    fresh.cards,
        comments: fresh.comments,
        // Preserve active board selection
        ui: { ...state.ui, activeBoardId: fresh.ui.activeBoardId ?? state.ui.activeBoardId },
      };
    }

    case 'APPLY_SYNC_EVENT': {
      const { event } = action.payload;
      const p = event.payload;

      switch (event.type) {
        case 'CARD_CREATED': {
          if (state.cards.byId[p.cardId as string]) return state;
          const col = state.columns.byId[p.columnId as string];
          if (!col) return state;
          const card: Card = {
            id: p.cardId as string, columnId: p.columnId as string,
            title: p.title as string, description: p.description as string,
            tags: (p.tags as string[]) || [], dueDate: (p.dueDate as string | null) || null,
            createdAt: p.createdAt as string, updatedAt: p.updatedAt as string,
            version: (p.version as number) || 1, lastEditedBy: event.userName,
          };
          return {
            ...state,
            cards:   { byId: { ...state.cards.byId, [card.id]: card }, allIds: [...state.cards.allIds, card.id] },
            columns: { ...state.columns, byId: { ...state.columns.byId, [col.id]: { ...col, cardIds: [...col.cardIds, card.id] } } },
          };
        }
        case 'CARD_UPDATED': {
          const existing = state.cards.byId[p.cardId as string];
          if (!existing) return state;
          const remoteV = (p.version as number) || 0;
          if (remoteV >= existing.version) {
            return { ...state, cards: { ...state.cards, byId: { ...state.cards.byId, [p.cardId as string]: { ...existing, ...(p.updates as Partial<Card>), version: remoteV, lastEditedBy: event.userName, updatedAt: new Date().toISOString() } } } };
          }
          return state;
        }
        case 'CARD_MOVED':
          return appReducer(state, { type: 'MOVE_CARD', payload: { ...(p as { cardId: string; sourceColumnId: string; destinationColumnId: string; newIndex: number }), fromSync: true } });
        case 'CARD_DELETED':
          return appReducer(state, { type: 'DELETE_CARD', payload: { cardId: p.cardId as string } });
        case 'COLUMN_CREATED': {
          if (state.columns.byId[p.columnId as string]) return state;
          const board = state.boards.byId[p.boardId as string];
          if (!board) return state;
          const col: Column = { id: p.columnId as string, boardId: p.boardId as string, title: p.title as string, cardIds: [], order: board.columnIds.length };
          return {
            ...state,
            columns: { byId: { ...state.columns.byId, [col.id]: col }, allIds: [...state.columns.allIds, col.id] },
            boards:  { ...state.boards, byId: { ...state.boards.byId, [board.id]: { ...board, columnIds: [...board.columnIds, col.id] } } },
          };
        }
        case 'COLUMN_UPDATED':
          return appReducer(state, { type: 'UPDATE_COLUMN', payload: { columnId: p.columnId as string, title: p.title as string } });
        case 'COLUMN_DELETED':
          return appReducer(state, { type: 'DELETE_COLUMN', payload: { columnId: p.columnId as string } });
        case 'COMMENT_ADDED':
          return appReducer(state, { type: 'ADD_COMMENT', payload: { cardId: p.cardId as string, parentId: (p.parentId as string | null) ?? null, text: p.text as string, author: p.author as string, authorColor: p.authorColor as string, commentId: p.commentId as string } });
        case 'COMMENT_EDITED':
          return appReducer(state, { type: 'EDIT_COMMENT', payload: { commentId: p.commentId as string, text: p.text as string } });
        case 'COMMENT_DELETED':
          return appReducer(state, { type: 'DELETE_COMMENT', payload: { commentId: p.commentId as string } });
        default:
          return state;
      }
    }

    // ── UI ────────────────────────────────────────────────────────────────────
    case 'SET_MODAL':
      return { ...state, ui: { ...state.ui, modalType: action.payload.modalType, modalData: action.payload.modalData || {} } };
    case 'SET_EDITING_CARD':
      return { ...state, ui: { ...state.ui, editingCardId: action.payload.cardId } };
    case 'SET_EDITING_COLUMN':
      return { ...state, ui: { ...state.ui, editingColumnId: action.payload.columnId } };

    case 'RENAME_USER': {
      const updatedUser = { ...state.collab.currentUser, name: action.payload.name };
      // Persist to localStorage so the name survives page refreshes
      saveIdentity({ id: updatedUser.id, name: updatedUser.name, color: updatedUser.color });
      return {
        ...state,
        collab: {
          ...state.collab,
          currentUser: updatedUser,
          activeUsers: state.collab.activeUsers.map((u) =>
            u.id === updatedUser.id ? updatedUser : u,
          ),
        },
      };
    }

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  getBoard: (id: string) => Board | undefined;
  getColumn: (id: string) => Column | undefined;
  getCard: (id: string) => Card | undefined;
  getBoardsList: () => Board[];
  getBoardColumns: (boardId: string) => Column[];
  getColumnCards: (columnId: string) => Card[];
  publishEvent: (type: SyncEvent['type'], payload: Record<string, unknown>) => void;
  renameUser: (name: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, undefined, buildInitialState);
  const syncEngineRef = useRef<SyncEngine | null>(null);

  // ── Persist board state to localStorage immediately on every change ─────────
  // No debounce — we want other tabs to get the storage event right away.
  const prevBoardStateRef = useRef<string>('');
  useEffect(() => {
    try {
      const { collab: _c, ...persistable } = state;
      const serialized = JSON.stringify(persistable);
      if (serialized === prevBoardStateRef.current) return; // nothing changed
      prevBoardStateRef.current = serialized;
      localStorage.setItem(STATE_KEY, serialized);
    } catch {}
  }, [state]);

  // ── Sync engine ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const engine = new SyncEngine(
      state.collab.currentUser,
      (event: SyncEvent) => {
        dispatch({ type: 'APPLY_SYNC_EVENT', payload: { event } });
        dispatch({ type: 'SET_CONNECTED', payload: { connected: true } });
      },
      (users: ActiveUser[]) => {
        dispatch({ type: 'SET_ACTIVE_USERS', payload: { users } });
      },
      () => {
        // Another tab wrote STATE_KEY — reload board state into React
        dispatch({ type: 'RELOAD_BOARD_STATE' });
      },
    );
    engine.connect();
    syncEngineRef.current = engine;
    dispatch({ type: 'SET_CONNECTED', payload: { connected: true } });
    dispatch({ type: 'SET_ACTIVE_USERS', payload: { users: engine.getActiveUsers() } });
    return () => { engine.disconnect(); syncEngineRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Keep sync engine's user reference fresh after rename ───────────────────
  const prevUserRef = useRef(state.collab.currentUser);
  useEffect(() => {
    if (state.collab.currentUser !== prevUserRef.current) {
      prevUserRef.current = state.collab.currentUser;
      syncEngineRef.current?.updateCurrentUser(state.collab.currentUser);
    }
  }, [state.collab.currentUser]);

  const publishEvent = useCallback((type: SyncEvent['type'], payload: Record<string, unknown>) => {
    syncEngineRef.current?.publish(type, payload);
  }, []);

  const renameUser = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    dispatch({ type: 'RENAME_USER', payload: { name: trimmed } });
  }, []);

  const getBoard   = useCallback((id: string) => state.boards.byId[id],  [state.boards.byId]);
  const getColumn  = useCallback((id: string) => state.columns.byId[id], [state.columns.byId]);
  const getCard    = useCallback((id: string) => state.cards.byId[id],   [state.cards.byId]);

  const getBoardsList = useCallback(
    () => state.boards.allIds.map((id) => state.boards.byId[id]).filter(Boolean),
    [state.boards.allIds, state.boards.byId],
  );

  const getBoardColumns = useCallback(
    (boardId: string) => {
      const board = state.boards.byId[boardId];
      if (!board) return [];
      return board.columnIds.map((id) => state.columns.byId[id]).filter(Boolean);
    },
    [state.boards.byId, state.columns.byId],
  );

  const getColumnCards = useCallback(
    (columnId: string) => {
      const col = state.columns.byId[columnId];
      if (!col) return [];
      return col.cardIds.map((id) => state.cards.byId[id]).filter(Boolean);
    },
    [state.columns.byId, state.cards.byId],
  );

  const value = useMemo(
    () => ({ state, dispatch, getBoard, getColumn, getCard, getBoardsList, getBoardColumns, getColumnCards, publishEvent, renameUser }),
    [state, getBoard, getColumn, getCard, getBoardsList, getBoardColumns, getColumnCards, publishEvent, renameUser],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

// eslint-disable-next-line react-refresh/only-export-components
export const useAppState = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppState must be used within AppProvider');
  return ctx;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useBoards = () => {
  const { getBoardsList, state } = useAppState();
  return useMemo(() => getBoardsList(), [state.boards.allIds, state.boards.byId, getBoardsList]);
};

// eslint-disable-next-line react-refresh/only-export-components
export const useActiveBoard = () => {
  const { state, getBoard } = useAppState();
  return state.ui.activeBoardId ? getBoard(state.ui.activeBoardId) : null;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useBoardColumns = (boardId: string) => {
  const { state, getBoardColumns } = useAppState();
  return useMemo(() => getBoardColumns(boardId), [state.boards.byId, state.columns.byId, boardId, getBoardColumns]);
};

// eslint-disable-next-line react-refresh/only-export-components
export const useUI = () => {
  const { state } = useAppState();
  return state.ui;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCollab = () => {
  const { state } = useAppState();
  return state.collab;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCardComments = (cardId: string) => {
  const { state } = useAppState();
  return useMemo(() => {
    const topIds = state.comments.byCardId[cardId] || [];
    return topIds.map((id) => state.comments.byId[id]).filter(Boolean);
  }, [state.comments, cardId]);
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCommentReplies = (commentId: string) => {
  const { state } = useAppState();
  return useMemo(() => {
    const replyIds = state.comments.byParentId[commentId] || [];
    return replyIds.map((id) => state.comments.byId[id]).filter(Boolean);
  }, [state.comments, commentId]);
};
