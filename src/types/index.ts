// ─── Domain Types ────────────────────────────────────────────────────────────

export interface Board {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  columnIds: string[];
}

export interface Column {
  id: string;
  boardId: string;
  title: string;
  cardIds: string[];
  order: number;
}

export interface Card {
  id: string;
  columnId: string;
  title: string;
  description: string;
  tags: string[];
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  // version vector for conflict resolution
  version: number;
  lastEditedBy: string | null;
}

// ─── Normalized Comment System ────────────────────────────────────────────────
// Comments are stored flat (normalized) — no deeply nested state.
// parentId = null means top-level; parentId = someId means it's a reply.
export interface Comment {
  id: string;
  cardId: string;
  parentId: string | null; // null = top-level, string = reply
  text: string;
  author: string;
  authorColor: string;
  createdAt: string;
  editedAt: string | null;
  isDeleted: boolean; // soft delete — preserves thread structure
}

export interface CommentsState {
  byId: Record<string, Comment>;
  // cardId → ordered list of top-level comment IDs
  byCardId: Record<string, string[]>;
  // parentId → ordered list of child comment IDs
  byParentId: Record<string, string[]>;
}

// ─── State Types ──────────────────────────────────────────────────────────────

export interface BoardsState {
  byId: Record<string, Board>;
  allIds: string[];
}

export interface ColumnsState {
  byId: Record<string, Column>;
  allIds: string[];
}

export interface CardsState {
  byId: Record<string, Card>;
  allIds: string[];
}

export interface UIState {
  activeBoardId: string | null;
  editingCardId: string | null;
  editingColumnId: string | null;
  modalType:
    | 'create-board'
    | 'create-column'
    | 'create-card'
    | 'edit-card'
    | 'delete-confirm'
    | 'card-detail'
    | null;
  modalData: Record<string, unknown>;
}

// ─── Collaboration / Sync Types ───────────────────────────────────────────────

export type SyncEventType =
  | 'CARD_CREATED'
  | 'CARD_UPDATED'
  | 'CARD_MOVED'
  | 'CARD_DELETED'
  | 'COLUMN_CREATED'
  | 'COLUMN_UPDATED'
  | 'COLUMN_DELETED'
  | 'COMMENT_ADDED'
  | 'COMMENT_EDITED'
  | 'COMMENT_DELETED'
  | 'BOARD_CREATED'
  | 'BOARD_DELETED'
  | 'USER_JOINED'
  | 'USER_RENAMED';

export interface SyncEvent {
  id: string;
  type: SyncEventType;
  payload: Record<string, unknown>;
  timestamp: string;
  userId: string;
  userName: string;
}

export interface ActiveUser {
  id: string;
  name: string;
  color: string;
  lastSeen: string;
  currentBoardId: string | null;
}

export interface CollabState {
  currentUser: ActiveUser;
  activeUsers: ActiveUser[];
  lastSyncedAt: string | null;
  pendingEvents: SyncEvent[];
  conflictLog: ConflictEntry[];
  isConnected: boolean;
}

export interface ConflictEntry {
  id: string;
  timestamp: string;
  cardId: string;
  cardTitle: string;
  localVersion: number;
  remoteVersion: number;
  resolution: 'last-write-wins' | 'merge';
  winner: string;
  description: string;
}

export interface AppState {
  boards: BoardsState;
  columns: ColumnsState;
  cards: CardsState;
  comments: CommentsState;
  collab: CollabState;
  ui: UIState;
}

// ─── Drop / Drag Types ────────────────────────────────────────────────────────

export interface DropResult {
  source: { columnId: string; index: number };
  destination: { columnId: string; index: number };
}

// ─── Action Types ─────────────────────────────────────────────────────────────

export type AppAction =
  // Boards
  | { type: 'CREATE_BOARD'; payload: { title: string; description: string } }
  | { type: 'DELETE_BOARD'; payload: { boardId: string } }
  | { type: 'SET_ACTIVE_BOARD'; payload: { boardId: string | null } }
  // Columns
  | { type: 'CREATE_COLUMN'; payload: { boardId: string; title: string } }
  | { type: 'UPDATE_COLUMN'; payload: { columnId: string; title: string } }
  | { type: 'DELETE_COLUMN'; payload: { columnId: string } }
  // Cards
  | {
      type: 'CREATE_CARD';
      payload: {
        columnId: string;
        title: string;
        description: string;
        tags: string[];
        dueDate: string | null;
        _cardId?: string; // optional pre-generated ID (used by undo/redo)
      };
    }
  | {
      // Restores a previously deleted card at its original position.
      // Used exclusively as an undo action for DELETE_CARD.
      type: 'RESTORE_CARD';
      payload: { card: Card; indexInColumn: number };
    }
  | {
      type: 'UPDATE_CARD';
      payload: {
        cardId: string;
        updates: Partial<Omit<Card, 'id' | 'columnId' | 'createdAt'>>;
        fromSync?: boolean;
      };
    }
  | { type: 'DELETE_CARD'; payload: { cardId: string } }
  | {
      type: 'MOVE_CARD';
      payload: {
        cardId: string;
        sourceColumnId: string;
        destinationColumnId: string;
        newIndex: number;
        fromSync?: boolean;
      };
    }
  // Comments (normalized)
  | {
      type: 'ADD_COMMENT';
      payload: {
        cardId: string;
        parentId: string | null;
        text: string;
        author: string;
        authorColor: string;
        commentId?: string; // for sync replay
      };
    }
  | { type: 'EDIT_COMMENT'; payload: { commentId: string; text: string } }
  | { type: 'DELETE_COMMENT'; payload: { commentId: string } }
  // Collab
  | { type: 'SET_ACTIVE_USERS'; payload: { users: ActiveUser[] } }
  | { type: 'APPLY_SYNC_EVENT'; payload: { event: SyncEvent } }
  | { type: 'SET_CONNECTED'; payload: { connected: boolean } }
  | { type: 'LOG_CONFLICT'; payload: { entry: ConflictEntry } }
  // UI
  | {
      type: 'SET_MODAL';
      payload: {
        modalType: UIState['modalType'];
        modalData?: Record<string, unknown>;
      };
    }
  | { type: 'SET_EDITING_CARD'; payload: { cardId: string | null } }
  | { type: 'SET_EDITING_COLUMN'; payload: { columnId: string | null } }
  | { type: 'RENAME_USER'; payload: { name: string } }
  | { type: 'RELOAD_BOARD_STATE' };
