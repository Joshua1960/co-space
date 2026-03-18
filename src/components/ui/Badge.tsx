import React from 'react';
import { classNames } from '../../lib/utils';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
export type BadgeSize    = 'sm' | 'md';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-[var(--bg-muted)] text-[var(--text-secondary)]',
  success: 'bg-[var(--success-subtle)] text-[var(--success-text)]',
  warning: 'bg-[var(--warning-subtle)] text-[var(--warning-text)]',
  danger:  'bg-[var(--danger-subtle)]  text-[var(--danger-text)]',
  info:    'bg-[var(--info-subtle)]    text-[var(--info-text)]',
  outline: 'bg-transparent border border-[var(--border-strong)] text-[var(--text-secondary)]',
};

const dotStyles: Record<BadgeVariant, string> = {
  default: 'bg-[var(--text-muted)]',
  success: 'bg-[var(--success)]',
  warning: 'bg-[var(--warning)]',
  danger:  'bg-[var(--danger)]',
  info:    'bg-[var(--info)]',
  outline: 'bg-[var(--text-muted)]',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0.5 text-xs gap-1',
  md: 'px-2.5 py-1   text-xs gap-1.5',
};

export const Badge: React.FC<BadgeProps> = ({
  children, variant = 'default', size = 'sm', dot = false, className,
}) => (
  <span className={classNames(
    'inline-flex items-center font-medium rounded-full',
    variantStyles[variant],
    sizeStyles[size],
    className,
  )}>
    {dot && (
      <span className={classNames('w-1.5 h-1.5 rounded-full shrink-0', dotStyles[variant])} />
    )}
    {children}
  </span>
);
