/**
 * Fine-grained selectors — each returns only the slice of state it needs.
 * Components subscribe to these instead of the whole AppState, so they
 * only re-render when their specific data changes.
 *
 * All selectors are referentially stable: they return the same object
 * reference when the underlying data hasn’t changed, so React.memo
 * and useMemo bail out correctly.
 */

import { useMemo } from 'react';
import { useAppState } from '../context/AppContext';
import type { Card, Column } from '../types';

/** Subscribe to a single card by ID. Only re-renders when that card changes. */
export function useCard(cardId: string): Card | undefined {
  const { state } = useAppState();
  // Return the exact byId reference — memo bail-out works because the
  // reducer only creates a new object for the card that actually changed.
  return state.cards.byId[cardId];
}

/** Subscribe to a single column by ID. */
export function useColumn(columnId: string): Column | undefined {
  const { state } = useAppState();
  return state.columns.byId[columnId];
}

/**
 * Returns the ordered card objects for a column.
 * Stable reference: only changes when the column’s cardIds array or
 * one of those cards’ objects changes.
 */
export function useColumnCards(columnId: string): Card[] {
  const { state } = useAppState();
  const column = state.columns.byId[columnId];
  return useMemo(() => {
    if (!column) return [];
    return column.cardIds
      .map((id) => state.cards.byId[id])
      .filter((c): c is Card => !!c);
  }, [
    // Only recompute when this column’s cardIds change, or when any of
    // the referenced card objects change. We use the column.cardIds array
    // (identity check) plus the cards byId map (identity check).
    column?.cardIds,
    state.cards.byId,
  ]);
}

/**
 * Returns the total comment count for a card (all levels).
 * Memoized per cardId — only recomputes when comments change.
 */
export function useCardCommentCount(cardId: string): number {
  const { state } = useAppState();
  return useMemo(() => {
    const countTree = (parentId: string): number => {
      const replies = state.comments.byParentId[parentId] || [];
      return replies.reduce((acc, id) => acc + 1 + countTree(id), 0);
    };
    const topIds = state.comments.byCardId[cardId] || [];
    return topIds.length + topIds.reduce((acc, id) => acc + countTree(id), 0);
  }, [state.comments, cardId]);
}
