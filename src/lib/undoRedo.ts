/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Undo / Redo System — Inverse-Command Pattern
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * APPROACH: Inverse-Command (not full-state cloning)
 *
 * Each undoable user action is recorded as a pair:
 *   { do: AppAction, undo: AppAction }
 *
 * The `undo` action is the *minimal inverse* computed at the moment the
 * original action is dispatched — before state changes. Only the data
 * required to reverse the operation is stored, not a snapshot of the
 * entire application state.
 *
 * WHY NOT FULL-STATE CLONING?
 * ───────────────────────────
 * Full-state cloning (memento pattern) is simple but expensive:
 *   - Every action copies the entire boards/columns/cards/comments tree
 *   - Memory grows linearly with history depth × state size
 *   - Serialisation cost on every action
 *
 * The inverse-command approach stores only the delta:
 *   - CREATE_CARD  undo → DELETE_CARD   (stores 1 ID)
 *   - DELETE_CARD  undo → CREATE_CARD   (stores 1 Card object + position)
 *   - MOVE_CARD    undo → MOVE_CARD     (stores previous columnId + index)
 *   - UPDATE_CARD  undo → UPDATE_CARD   (stores only the fields that changed)
 *
 * REDO:
 * ─────
 * When the user undoes an action, the original `do` action is pushed onto
 * a redo stack. Redo simply replays it. Any new user action clears the
 * redo stack (standard linear history).
 *
 * SCOPE:
 * ──────
 * Only card-level mutations are tracked (CREATE, DELETE, MOVE, UPDATE).
 * UI-only actions (SET_MODAL, SET_ACTIVE_BOARD, etc.) and collab/sync
 * actions are intentionally excluded — they are either ephemeral or
 * managed by the sync engine.
 *
 * HISTORY LIMIT: 50 entries (configurable via MAX_HISTORY).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { AppAction, Card } from '../types';

export const MAX_HISTORY = 50;

/** A single entry in the undo stack. */
export interface HistoryEntry {
  /** Human-readable label shown in the UI (e.g. "Create card \"Fix bug\"") */
  label: string;
  /** The action to replay on redo (the original forward action) */
  doAction: AppAction;
  /** The inverse action to dispatch on undo */
  undoAction: AppAction;
}

export interface UndoRedoState {
  past: HistoryEntry[];   // index 0 = oldest, last = most recent
  future: HistoryEntry[]; // index 0 = next redo, last = furthest
}

export const initialUndoRedoState: UndoRedoState = {
  past: [],
  future: [],
};

// ─── Inverse-action builders ──────────────────────────────────────────────────
// Called BEFORE the action is applied so we can capture current state.

/**
 * Given a CREATE_CARD action and the card ID that will be generated,
 * returns the inverse DELETE_CARD action.
 */
export function inverseOfCreateCard(cardId: string): AppAction {
  return { type: 'DELETE_CARD', payload: { cardId } };
}

/**
 * Given a card that is about to be deleted, returns the inverse CREATE_CARD
 * action that would restore it, plus the index it occupied in its column.
 */
export function inverseOfDeleteCard(
  card: Card,
  indexInColumn: number,
): AppAction {
  return {
    type: 'RESTORE_CARD',
    payload: { card, indexInColumn },
  };
}

/**
 * Given a MOVE_CARD action and the card's current position,
 * returns the inverse MOVE_CARD that moves it back.
 */
export function inverseOfMoveCard(
  cardId: string,
  currentColumnId: string,
  currentIndex: number,
  destinationColumnId: string,
  _destinationIndex: number,
): AppAction {
  return {
    type: 'MOVE_CARD',
    payload: {
      cardId,
      sourceColumnId: destinationColumnId,
      destinationColumnId: currentColumnId,
      newIndex: currentIndex,
    },
  };
}

/**
 * Given an UPDATE_CARD action and the card's current (pre-update) values,
 * returns the inverse UPDATE_CARD that restores those fields.
 */
export function inverseOfUpdateCard(
  cardId: string,
  previousValues: Partial<Omit<Card, 'id' | 'columnId' | 'createdAt'>>,
): AppAction {
  return {
    type: 'UPDATE_CARD',
    payload: { cardId, updates: previousValues },
  };
}

// ─── Stack operations ─────────────────────────────────────────────────────────

export function pushToHistory(
  state: UndoRedoState,
  entry: HistoryEntry,
): UndoRedoState {
  const past = [...state.past, entry].slice(-MAX_HISTORY);
  return { past, future: [] }; // new action clears redo stack
}

export function undo(state: UndoRedoState): {
  next: UndoRedoState;
  entry: HistoryEntry | null;
} {
  if (state.past.length === 0) return { next: state, entry: null };
  const past = [...state.past];
  const entry = past.pop()!;
  const future = [entry, ...state.future];
  return { next: { past, future }, entry };
}

export function redo(state: UndoRedoState): {
  next: UndoRedoState;
  entry: HistoryEntry | null;
} {
  if (state.future.length === 0) return { next: state, entry: null };
  const future = [...state.future];
  const entry = future.shift()!;
  const past = [...state.past, entry].slice(-MAX_HISTORY);
  return { next: { past, future }, entry };
}
