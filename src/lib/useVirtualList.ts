/**
 * Lightweight virtual list hook — no external dependency.
 *
 * Renders only the cards visible in the column’s scroll viewport plus an
 * overscan buffer. For columns with few cards (< THRESHOLD) it falls back
 * to rendering everything so there’s zero overhead in the common case.
 *
 * HOW IT WORKS:
 *   1. An IntersectionObserver watches a sentinel div at the top of the list.
 *   2. A ResizeObserver tracks the column container height.
 *   3. We track scrollTop via a scroll listener on the container.
 *   4. Given itemHeight (fixed per card) we compute startIndex/endIndex.
 *   5. A top spacer and bottom spacer div preserve scroll position.
 *
 * TRADE-OFF: Cards must have a roughly uniform height for the spacer math
 * to be accurate. Cards with very long descriptions may cause minor
 * positional jitter, which is acceptable for a Kanban board.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

const ITEM_HEIGHT = 130;   // px — approximate card height including gap
const OVERSCAN = 3;        // extra items to render above/below viewport
const VIRTUAL_THRESHOLD = 30; // only virtualise columns with > this many cards

interface VirtualListResult {
  containerRef: React.RefObject<HTMLDivElement | null>;
  visibleRange: { start: number; end: number };
  topSpacerHeight: number;
  bottomSpacerHeight: number;
  shouldVirtualise: boolean;
}

export function useVirtualList(totalItems: number): VirtualListResult {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);
  const shouldVirtualise = totalItems > VIRTUAL_THRESHOLD;

  // Track scroll position
  const onScroll = useCallback(() => {
    if (containerRef.current) setScrollTop(containerRef.current.scrollTop);
  }, []);

  // Track container height via ResizeObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !shouldVirtualise) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerHeight(entry.contentRect.height);
    });
    ro.observe(el);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener('scroll', onScroll);
    };
  }, [onScroll, shouldVirtualise]);

  if (!shouldVirtualise) {
    return {
      containerRef,
      visibleRange: { start: 0, end: totalItems },
      topSpacerHeight: 0,
      bottomSpacerHeight: 0,
      shouldVirtualise: false,
    };
  }

  const start = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN);
  const end = Math.min(
    totalItems,
    Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + OVERSCAN,
  );

  const topSpacerHeight = start * ITEM_HEIGHT;
  const bottomSpacerHeight = Math.max(0, (totalItems - end) * ITEM_HEIGHT);

  return { containerRef, visibleRange: { start, end }, topSpacerHeight, bottomSpacerHeight, shouldVirtualise };
}
