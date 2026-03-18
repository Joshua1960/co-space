let counter = 0;
export const generateId = (): string => {
  counter += 1;
  return `${Date.now()}-${counter}-${Math.random().toString(36).substr(2, 9)}`;
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

export const formatRelativeDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return formatDate(dateString);
};

export const isOverdue = (dateString: string | null): boolean => {
  if (!dateString) return false;
  const date = new Date(dateString);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return date < now;
};

export const classNames = (
  ...classes: (string | boolean | undefined | null)[]
): string => {
  return classes.filter(Boolean).join(' ');
};

// User color palette for simulated users
const USER_COLORS = [
  '#6366f1', // indigo
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#10b981', // emerald
];

export const getUserColor = (userId: string): string => {
  const hash = userId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return USER_COLORS[hash % USER_COLORS.length];
};

/** Safe initial — returns '?' for empty/undefined names instead of crashing */
export const nameInitial = (name: string | undefined | null): string =>
  name && name.length > 0 ? name[0].toUpperCase() : '?';

export const SIMULATED_USERS = [
  { id: 'user-alice', name: 'Alice Chen' },
  { id: 'user-bob', name: 'Bob Martinez' },
  { id: 'user-carol', name: 'Carol Singh' },
  { id: 'user-dave', name: 'Dave Kim' },
];
