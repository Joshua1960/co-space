// Domain Types
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
}

// State Types
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
  modalType: 'create-board' | 'create-column' | 'create-card' | 'edit-card' | 'delete-confirm' | null;
  modalData: Record<string, unknown>;
}

export interface AppState {
  boards: BoardsState;
  columns: ColumnsState;
  cards: CardsState;
  ui: UIState;
}

// Action Types
export type AppAction =
  | { type: 'CREATE_BOARD'; payload: { title: string; description: string } }
  | { type: 'DELETE_BOARD'; payload: { boardId: string } }
  | { type: 'SET_ACTIVE_BOARD'; payload: { boardId: string | null } }
  | { type: 'CREATE_COLUMN'; payload: { boardId: string; title: string } }
  | { type: 'UPDATE_COLUMN'; payload: { columnId: string; title: string } }
  | { type: 'DELETE_COLUMN'; payload: { columnId: string } }
  | { type: 'CREATE_CARD'; payload: { columnId: string; title: string; description: string; tags: string[]; dueDate: string | null } }
  | { type: 'UPDATE_CARD'; payload: { cardId: string; updates: Partial<Omit<Card, 'id' | 'columnId' | 'createdAt'>> } }
  | { type: 'DELETE_CARD'; payload: { cardId: string } }
  | { type: 'SET_MODAL'; payload: { modalType: UIState['modalType']; modalData?: Record<string, unknown> } }
  | { type: 'SET_EDITING_CARD'; payload: { cardId: string | null } }
  | { type: 'SET_EDITING_COLUMN'; payload: { columnId: string | null } };
