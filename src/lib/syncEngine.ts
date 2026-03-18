/**
 * Real-time Sync Engine
 *
 * Delivers instant updates across all tabs using two complementary channels:
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │  Channel 1 — BroadcastChannel  (primary, same browser process)      │
 * │  Posts a SyncEvent message the moment an action is dispatched.      │
 * │  Other tabs receive it in the same event-loop tick. Zero latency.   │
 * ├─────────────────────────────────────────────────────────────────────┤
 * │  Channel 2 — localStorage "storage" event  (push, no polling)       │
 * │  The browser fires this natively on every OTHER tab the instant     │
 * │  localStorage is written to. Event-driven, not polled.              │
 * │  Watches two keys:                                                  │
 * │    • EVENTS_KEY  — individual action events (card created, etc.)    │
 * │    • STATE_KEY   — full board state snapshot written after each     │
 * │                    mutation, so a freshly-opened tab gets current   │
 * │                    state immediately without a reload.              │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * User presence:
 *   Each tab writes its ActiveUser to USERS_KEY every 5s (heartbeat).
 *   Stale entries (>15s old) are pruned. The storage event on USERS_KEY
 *   triggers an instant presence refresh on all other tabs.
 *
 * Deduplication:
 *   A Set<string> of processed event IDs prevents double-applying an
 *   event that arrives via both BroadcastChannel and storage event.
 */

import type { SyncEvent, ActiveUser } from '../types';
import { generateId } from './utils';

export const SYNC_CHANNEL  = 'cospace-sync';
export const EVENTS_KEY    = 'cospace-events';
export const USERS_KEY     = 'cospace-active-users';
export const STATE_KEY     = 'co-space-state-v2';   // shared with AppContext
const MAX_EVENTS_AGE_MS    = 60_000;                // keep events 60s

type SyncEventHandler    = (event: SyncEvent) => void;
type UsersChangedHandler = (users: ActiveUser[]) => void;
type StateChangedHandler = () => void;

export class SyncEngine {
  private channel: BroadcastChannel | null = null;
  private processedIds = new Set<string>();
  private onEvent: SyncEventHandler;
  private onUsersChanged: UsersChangedHandler;
  private onStateChanged: StateChangedHandler;
  private currentUser: ActiveUser;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private storageListener: ((e: StorageEvent) => void) | null = null;

  constructor(
    currentUser: ActiveUser,
    onEvent: SyncEventHandler,
    onUsersChanged: UsersChangedHandler,
    onStateChanged: StateChangedHandler,
  ) {
    this.currentUser = currentUser;
    this.onEvent = onEvent;
    this.onUsersChanged = onUsersChanged;
    this.onStateChanged = onStateChanged;
  }

  connect() {
    // ── 1. BroadcastChannel ─────────────────────────────────────────────────
    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel(SYNC_CHANNEL);
      this.channel.onmessage = (e: MessageEvent) => {
        const event = e.data as SyncEvent;
        if (event.userId !== this.currentUser.id) {
          this.receiveEvent(event);
        }
      };
    }

    // ── 2. storage event ────────────────────────────────────────────────────
    this.storageListener = (e: StorageEvent) => {
      if (!e.newValue) return;

      if (e.key === EVENTS_KEY) {
        // A new action event was appended — apply it
        try {
          const events: SyncEvent[] = JSON.parse(e.newValue);
          const latest = events[events.length - 1];
          if (latest && latest.userId !== this.currentUser.id) {
            this.receiveEvent(latest);
          }
        } catch {}
      }

      if (e.key === STATE_KEY) {
        // Board state was updated by another tab — reload it into React state
        this.onStateChanged();
      }

      if (e.key === USERS_KEY) {
        // Presence list changed — refresh active users
        try {
          this.onUsersChanged(this.getActiveUsers());
        } catch {}
      }
    };
    window.addEventListener('storage', this.storageListener);

    // ── 3. Heartbeat ────────────────────────────────────────────────────────
    this.heartbeat();
    this.heartbeatInterval = setInterval(() => {
      this.heartbeat();
      this.onUsersChanged(this.getActiveUsers());
    }, 5_000);

    // Announce presence immediately
    this.onUsersChanged(this.getActiveUsers());
  }

  disconnect() {
    this.channel?.close();
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    if (this.storageListener) window.removeEventListener('storage', this.storageListener);
    this.removeUser();
  }

  /** Update identity after a rename — immediately re-heartbeats. */
  updateCurrentUser(user: ActiveUser) {
    this.currentUser = user;
    this.heartbeat();
    this.onUsersChanged(this.getActiveUsers());
  }

  /** Publish an action event to all other tabs instantly. */
  publish(type: SyncEvent['type'], payload: Record<string, unknown>): SyncEvent {
    const event: SyncEvent = {
      id: generateId(),
      type,
      payload,
      timestamp: new Date().toISOString(),
      userId: this.currentUser.id,
      userName: this.currentUser.name,
    };

    // Pre-mark so we don't re-apply our own event
    this.processedIds.add(event.id);

    // Send via BroadcastChannel (instant, same browser)
    this.channel?.postMessage(event);

    // Persist to localStorage (triggers storage event on other tabs)
    this.appendEvent(event);

    return event;
  }

  // ── Private ─────────────────────────────────────────────────────────────────

  private receiveEvent(event: SyncEvent) {
    if (this.processedIds.has(event.id)) return;
    this.processedIds.add(event.id);
    if (this.processedIds.size > 500) {
      const first = this.processedIds.values().next().value;
      if (first) this.processedIds.delete(first);
    }
    this.onEvent(event);
  }

  private heartbeat() {
    try {
      const users = this.getActiveUsers();
      const now = new Date().toISOString();
      const others = users.filter((u) => u.id !== this.currentUser.id);
      const cutoff = new Date(Date.now() - 15_000).toISOString();
      const alive = others.filter((u) => u.lastSeen > cutoff);
      // Only add self if we have a name (pre-welcome users are invisible)
      if (this.currentUser.name) {
        alive.push({ ...this.currentUser, lastSeen: now });
      }
      localStorage.setItem(USERS_KEY, JSON.stringify(alive));
    } catch {}
  }

  private removeUser() {
    try {
      const users = this.getActiveUsers().filter((u) => u.id !== this.currentUser.id);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    } catch {}
  }

  getActiveUsers(): ActiveUser[] {
    try {
      const raw = localStorage.getItem(USERS_KEY);
      if (!raw) return [];
      const users: ActiveUser[] = JSON.parse(raw);
      const cutoff = new Date(Date.now() - 15_000).toISOString();
      return users.filter((u) => u.name && u.lastSeen > cutoff);
    } catch { return []; }
  }

  private getStoredEvents(): SyncEvent[] {
    try {
      const raw = localStorage.getItem(EVENTS_KEY);
      const events: SyncEvent[] = raw ? JSON.parse(raw) : [];
      const cutoff = new Date(Date.now() - MAX_EVENTS_AGE_MS).toISOString();
      return events.filter((e) => e.timestamp > cutoff);
    } catch { return []; }
  }

  private appendEvent(event: SyncEvent) {
    try {
      const events = this.getStoredEvents();
      events.push(event);
      localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
    } catch {}
  }
}
