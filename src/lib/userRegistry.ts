/**
 * User Registry
 *
 * Stores the current user's identity in localStorage (not sessionStorage),
 * so the name persists across tab opens, browser restarts, and is visible
 * to all other tabs on the same origin immediately via the storage event.
 *
 * Key: 'cospace-my-identity'
 * Format: { id, name, color }
 *
 * On first visit: no entry → WelcomeModal prompts for a name → saved here.
 * On return visit: entry found → skip modal, use stored identity.
 * On rename: overwrite entry → broadcast USER_RENAMED event.
 */

import { getUserColor } from './utils';
import type { ActiveUser } from '../types';

const IDENTITY_KEY = 'cospace-my-identity';

export interface StoredIdentity {
  id: string;
  name: string;
  color: string;
}

/** Load identity from localStorage. Returns null if first visit. */
export function loadIdentity(): StoredIdentity | null {
  try {
    const raw = localStorage.getItem(IDENTITY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredIdentity;
    // Validate shape
    if (parsed.id && parsed.name && parsed.color) return parsed;
    return null;
  } catch {
    return null;
  }
}

/** Save identity to localStorage. */
export function saveIdentity(identity: StoredIdentity): void {
  try {
    localStorage.setItem(IDENTITY_KEY, JSON.stringify(identity));
  } catch {}
}

/** Create a brand-new identity with a generated ID. Name is set later. */
export function createIdentity(name: string): StoredIdentity {
  const id = `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const color = getUserColor(id);
  const identity: StoredIdentity = { id, name, color };
  saveIdentity(identity);
  return identity;
}

/** Convert a StoredIdentity to an ActiveUser (adds runtime fields). */
export function identityToActiveUser(identity: StoredIdentity): ActiveUser {
  return {
    id: identity.id,
    name: identity.name,
    color: identity.color,
    lastSeen: new Date().toISOString(),
    currentBoardId: null,
  };
}
