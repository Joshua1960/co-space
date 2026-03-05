import React, {
  createContext,
  useContext,
  useReducer,
  useMemo,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type { AppState, AppAction, Board, Column, Card } from "../types";
import { generateId } from "../lib/utils";

const STORAGE_KEY = "co space-state";

// Function to load state from localStorage
const loadFromStorage = (): AppState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Ensure the structure is valid, fallback to initial if not
      return {
        ...initialState,
        ...parsed,
        // Optionally, reset UI state on load if needed
        ui: {
          ...initialState.ui,
          activeBoardId: parsed.ui?.activeBoardId || null, // Keep active board
        },
      };
    }
  } catch (error) {
    console.error("Failed to load state from localStorage:", error);
  }
  return initialState;
};

// Initial State
const initialState: AppState = {
  boards: {
    byId: {},
    allIds: [],
  },
  columns: {
    byId: {},
    allIds: [],
  },
  cards: {
    byId: {},
    allIds: [],
  },
  ui: {
    activeBoardId: null,
    editingCardId: null,
    editingColumnId: null,
    modalType: null,
    modalData: {},
  },
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "CREATE_BOARD": {
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

    case "DELETE_BOARD": {
      const { boardId } = action.payload;
      const board = state.boards.byId[boardId];
      if (!board) return state;

      // Get all column and card IDs to delete
      const columnIds = board.columnIds;
      const cardIds = columnIds.flatMap(
        (colId) => state.columns.byId[colId]?.cardIds || [],
      );

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [boardId]: _, ...remainingBoards } = state.boards.byId;
      const newColumnsById = { ...state.columns.byId };
      const newCardsById = { ...state.cards.byId };

      columnIds.forEach((colId) => delete newColumnsById[colId]);
      cardIds.forEach((cardId) => delete newCardsById[cardId]);

      return {
        ...state,
        boards: {
          byId: remainingBoards,
          allIds: state.boards.allIds.filter((id) => id !== boardId),
        },
        columns: {
          byId: newColumnsById,
          allIds: state.columns.allIds.filter((id) => !columnIds.includes(id)),
        },
        cards: {
          byId: newCardsById,
          allIds: state.cards.allIds.filter((id) => !cardIds.includes(id)),
        },
        ui:
          state.ui.activeBoardId === boardId
            ? { ...state.ui, activeBoardId: null }
            : state.ui,
      };
    }

    case "SET_ACTIVE_BOARD": {
      return {
        ...state,
        ui: { ...state.ui, activeBoardId: action.payload.boardId },
      };
    }

    case "CREATE_COLUMN": {
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
        columns: {
          byId: { ...state.columns.byId, [columnId]: newColumn },
          allIds: [...state.columns.allIds, columnId],
        },
        boards: {
          ...state.boards,
          byId: {
            ...state.boards.byId,
            [action.payload.boardId]: {
              ...board,
              columnIds: [...board.columnIds, columnId],
            },
          },
        },
      };
    }

    case "UPDATE_COLUMN": {
      const column = state.columns.byId[action.payload.columnId];
      if (!column) return state;

      return {
        ...state,
        columns: {
          ...state.columns,
          byId: {
            ...state.columns.byId,
            [action.payload.columnId]: {
              ...column,
              title: action.payload.title,
            },
          },
        },
      };
    }

    case "DELETE_COLUMN": {
      const { columnId } = action.payload;
      const column = state.columns.byId[columnId];
      if (!column) return state;

      const board = state.boards.byId[column.boardId];
      const cardIds = column.cardIds;

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [columnId]: deletedColumn, ...remainingColumns } =
        state.columns.byId;
      const newCardsById = { ...state.cards.byId };
      cardIds.forEach((cardId) => delete newCardsById[cardId]);

      return {
        ...state,
        columns: {
          byId: remainingColumns,
          allIds: state.columns.allIds.filter((id) => id !== columnId),
        },
        cards: {
          byId: newCardsById,
          allIds: state.cards.allIds.filter((id) => !cardIds.includes(id)),
        },
        boards: board
          ? {
              ...state.boards,
              byId: {
                ...state.boards.byId,
                [board.id]: {
                  ...board,
                  columnIds: board.columnIds.filter((id) => id !== columnId),
                },
              },
            }
          : state.boards,
      };
    }

    case "CREATE_CARD": {
      const cardId = generateId();
      const column = state.columns.byId[action.payload.columnId];
      if (!column) return state;

      const newCard: Card = {
        id: cardId,
        columnId: action.payload.columnId,
        title: action.payload.title,
        description: action.payload.description,
        tags: action.payload.tags,
        dueDate: action.payload.dueDate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return {
        ...state,
        cards: {
          byId: { ...state.cards.byId, [cardId]: newCard },
          allIds: [...state.cards.allIds, cardId],
        },
        columns: {
          ...state.columns,
          byId: {
            ...state.columns.byId,
            [action.payload.columnId]: {
              ...column,
              cardIds: [...column.cardIds, cardId],
            },
          },
        },
      };
    }

    case "UPDATE_CARD": {
      const card = state.cards.byId[action.payload.cardId];
      if (!card) return state;

      return {
        ...state,
        cards: {
          ...state.cards,
          byId: {
            ...state.cards.byId,
            [action.payload.cardId]: {
              ...card,
              ...action.payload.updates,
              updatedAt: new Date().toISOString(),
            },
          },
        },
      };
    }

    case "DELETE_CARD": {
      const { cardId } = action.payload;
      const card = state.cards.byId[cardId];
      if (!card) return state;

      const column = state.columns.byId[card.columnId];
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [cardId]: deletedCard, ...remainingCards } = state.cards.byId;

      return {
        ...state,
        cards: {
          byId: remainingCards,
          allIds: state.cards.allIds.filter((id) => id !== cardId),
        },
        columns: column
          ? {
              ...state.columns,
              byId: {
                ...state.columns.byId,
                [column.id]: {
                  ...column,
                  cardIds: column.cardIds.filter((id) => id !== cardId),
                },
              },
            }
          : state.columns,
      };
    }

    case "SET_MODAL": {
      return {
        ...state,
        ui: {
          ...state.ui,
          modalType: action.payload.modalType,
          modalData: action.payload.modalData || {},
        },
      };
    }

    case "SET_EDITING_CARD": {
      return {
        ...state,
        ui: { ...state.ui, editingCardId: action.payload.cardId },
      };
    }

    case "SET_EDITING_COLUMN": {
      return {
        ...state,
        ui: { ...state.ui, editingColumnId: action.payload.columnId },
      };
    }

    default:
      return state;
  }
}

// Context
interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  // Memoized selectors
  getBoard: (id: string) => Board | undefined;
  getColumn: (id: string) => Column | undefined;
  getCard: (id: string) => Card | undefined;
  getBoardsList: () => Board[];
  getBoardColumns: (boardId: string) => Column[];
  getColumnCards: (columnId: string) => Card[];
}

const AppContext = createContext<AppContextValue | null>(null);

// Provider
export const AppProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(appReducer, loadFromStorage());

  // Save state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error("Failed to save state to localStorage:", error);
    }
  }, [state]);

  // Memoized selectors to prevent unnecessary re-renders
  const getBoard = useCallback(
    (id: string) => state.boards.byId[id],
    [state.boards.byId],
  );
  const getColumn = useCallback(
    (id: string) => state.columns.byId[id],
    [state.columns.byId],
  );
  const getCard = useCallback(
    (id: string) => state.cards.byId[id],
    [state.cards.byId],
  );

  const getBoardsList = useCallback(
    () => state.boards.allIds.map((id) => state.boards.byId[id]),
    [state.boards.allIds, state.boards.byId],
  );

  const getBoardColumns = useCallback(
    (boardId: string) => {
      const board = state.boards.byId[boardId];
      if (!board) return [];
      return board.columnIds
        .map((colId) => state.columns.byId[colId])
        .filter(Boolean);
    },
    [state.boards.byId, state.columns.byId],
  );

  const getColumnCards = useCallback(
    (columnId: string) => {
      const column = state.columns.byId[columnId];
      if (!column) return [];
      return column.cardIds
        .map((cardId) => state.cards.byId[cardId])
        .filter(Boolean);
    },
    [state.columns.byId, state.cards.byId],
  );

  const value = useMemo(
    () => ({
      state,
      dispatch,
      getBoard,
      getColumn,
      getCard,
      getBoardsList,
      getBoardColumns,
      getColumnCards,
    }),
    [
      state,
      getBoard,
      getColumn,
      getCard,
      getBoardsList,
      getBoardColumns,
      getColumnCards,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Hooks
// eslint-disable-next-line react-refresh/only-export-components
export const useAppState = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppState must be used within AppProvider");
  return context;
};

// Selector hooks for optimized component updates
// eslint-disable-next-line react-refresh/only-export-components
export const useBoards = () => {
  const { state, getBoardsList } = useAppState();
  return useMemo(
    () => getBoardsList(),
    [state.boards.allIds, state.boards.byId, getBoardsList],
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useActiveBoard = () => {
  const { state, getBoard } = useAppState();
  return state.ui.activeBoardId ? getBoard(state.ui.activeBoardId) : null;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useBoardColumns = (boardId: string) => {
  const { state, getBoardColumns } = useAppState();
  return useMemo(
    () => getBoardColumns(boardId),
    [state.boards.byId, state.columns.byId, boardId, getBoardColumns],
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useUI = () => {
  const { state } = useAppState();
  return state.ui;
};
