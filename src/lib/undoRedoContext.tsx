/**
 * UndoRedoContext — wraps AppContext and intercepts undoable actions.
 *
 * Instead of embedding undo/redo state inside the main AppState (which would
 * couple it to persistence and sync), we keep it in a *separate* React context.
 * This means:
 *   - Undo history is session-only (never persisted or synced — undoing your
 *     own action shouldn't undo a collaborator's action)
 *   - The main reducer stays pure and unaware of history
 *   - History entries are garbage-collected when the context unmounts
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import {
  initialUndoRedoState,
  pushToHistory,
  undo,
  redo,
  inverseOfCreateCard,
  inverseOfDeleteCard,
  inverseOfMoveCard,
  inverseOfUpdateCard,
  type UndoRedoState,
  type HistoryEntry,
} from './undoRedo';
import { useAppState } from '../context/AppContext';
import type { AppAction, Card } from '../types';
import { generateId } from './utils';

// ─── History reducer ──────────────────────────────────────────────────────────

type HistoryAction =
  | { type: 'PUSH'; entry: HistoryEntry }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'CLEAR' };

function historyReducer(state: UndoRedoState, action: HistoryAction): UndoRedoState {
  switch (action.type) {
    case 'PUSH': return pushToHistory(state, action.entry);
    case 'UNDO': return undo(state).next;
    case 'REDO': return redo(state).next;
    case 'CLEAR': return initialUndoRedoState;
    default: return state;
  }
}

// ─── Context value ────────────────────────────────────────────────────────────

interface UndoRedoContextValue {
  /** Dispatch an undoable card action. Wraps AppContext dispatch + records history. */
  dispatchUndoable: (action: AppAction) => void;
  canUndo: boolean;
  canRedo: boolean;
  undoLabel: string | null;
  redoLabel: string | null;
  handleUndo: () => void;
  handleRedo: () => void;
  history: UndoRedoState;
}

const UndoRedoContext = createContext<UndoRedoContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const UndoRedoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { dispatch, state } = useAppState();
  const [history, historyDispatch] = useReducer(historyReducer, initialUndoRedoState);

  /**
   * dispatchUndoable — the main entry point.
   *
   * For each undoable action type, we:
   *   1. Capture the minimal inverse data from *current* state (before dispatch)
   *   2. Dispatch the forward action to AppContext
   *   3. Push a HistoryEntry with both forward + inverse actions
   *
   * Non-undoable actions (UI, sync, collab) fall through to plain dispatch.
   */
  const dispatchUndoable = useCallback(
    (action: AppAction) => {
      switch (action.type) {
        case 'CREATE_CARD': {
          // We need to know the cardId before it's created so the inverse
          // DELETE_CARD knows what to delete. We pre-generate the ID here
          // and inject it into the action payload.
          const cardId = generateId();
          const actionWithId: AppAction = {
            ...action,
            payload: { ...action.payload, _cardId: cardId },
          } as AppAction;

          // Forward: create the card
          dispatch(actionWithId);

          // Record: inverse is delete that specific card
          historyDispatch({
            type: 'PUSH',
            entry: {
              label: `Create card "${action.payload.title}"`,
              doAction: actionWithId,
              undoAction: inverseOfCreateCard(cardId),
            },
          });
          break;
        }

        case 'DELETE_CARD': {
          const card = state.cards.byId[action.payload.cardId];
          if (!card) { dispatch(action); break; }

          // Capture position before deletion
          const column = state.columns.byId[card.columnId];
          const indexInColumn = column ? column.cardIds.indexOf(card.id) : 0;

          dispatch(action);

          historyDispatch({
            type: 'PUSH',
            entry: {
              label: `Delete card "${card.title}"`,
              doAction: action,
              undoAction: inverseOfDeleteCard(card, indexInColumn),
            },
          });
          break;
        }

        case 'MOVE_CARD': {
          const card = state.cards.byId[action.payload.cardId];
          if (!card) { dispatch(action); break; }

          const sourceColumn = state.columns.byId[card.columnId];
          const currentIndex = sourceColumn
            ? sourceColumn.cardIds.indexOf(card.id)
            : 0;

          dispatch(action);

          historyDispatch({
            type: 'PUSH',
            entry: {
              label: `Move card "${card.title}"`,
              doAction: action,
              undoAction: inverseOfMoveCard(
                action.payload.cardId,
                action.payload.sourceColumnId,
                currentIndex,
                action.payload.destinationColumnId,
                action.payload.newIndex,
              ),
            },
          });
          break;
        }

        case 'UPDATE_CARD': {
          const card = state.cards.byId[action.payload.cardId];
          if (!card) { dispatch(action); break; }

          // Capture only the fields that are being overwritten
          const updates = action.payload.updates;
          const previousValues: Partial<Omit<Card, 'id' | 'columnId' | 'createdAt'>> = {};
          (Object.keys(updates) as Array<keyof typeof updates>).forEach((key) => {
            if (key in card) {
              (previousValues as Record<string, unknown>)[key] =
                card[key as keyof Card];
            }
          });

          dispatch(action);

          historyDispatch({
            type: 'PUSH',
            entry: {
              label: `Edit card "${card.title}"`,
              doAction: action,
              undoAction: inverseOfUpdateCard(card.id, previousValues),
            },
          });
          break;
        }

        default:
          // Non-undoable — pass straight through
          dispatch(action);
      }
    },
    [dispatch, state],
  );

  const handleUndo = useCallback(() => {
    const { entry } = undo(history);
    if (!entry) return;
    historyDispatch({ type: 'UNDO' });
    dispatch(entry.undoAction);
  }, [history, dispatch]);

  const handleRedo = useCallback(() => {
    const { entry } = redo(history);
    if (!entry) return;
    historyDispatch({ type: 'REDO' });
    dispatch(entry.doAction);
  }, [history, dispatch]);

  const value = useMemo(
    () => ({
      dispatchUndoable,
      canUndo: history.past.length > 0,
      canRedo: history.future.length > 0,
      undoLabel: history.past.length > 0 ? history.past[history.past.length - 1].label : null,
      redoLabel: history.future.length > 0 ? history.future[0].label : null,
      handleUndo,
      handleRedo,
      history,
    }),
    [dispatchUndoable, history, handleUndo, handleRedo],
  );

  return <UndoRedoContext.Provider value={value}>{children}</UndoRedoContext.Provider>;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

// eslint-disable-next-line react-refresh/only-export-components
export const useUndoRedo = () => {
  const ctx = useContext(UndoRedoContext);
  if (!ctx) throw new Error('useUndoRedo must be used within UndoRedoProvider');
  return ctx;
};
