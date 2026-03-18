import React from 'react';
import { classNames } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children, variant = 'primary', size = 'md',
  isLoading = false, leftIcon, rightIcon, fullWidth,
  className, disabled, ...props
}) => {
  const base = [
    'inline-flex items-center justify-center font-medium rounded-xl',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'select-none',
    fullWidth ? 'w-full' : '',
  ].join(' ');

  const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary:   'bg-[var(--brand)] text-[var(--text-inverse)] hover:bg-[var(--brand-hover)] focus:ring-[var(--brand)] shadow-[var(--shadow-sm)]',
    secondary: 'bg-[var(--bg-subtle)] text-[var(--text-primary)] hover:bg-[var(--bg-muted)] focus:ring-[var(--border-strong)]',
    ghost:     'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)] focus:ring-[var(--border-strong)]',
    danger:    'bg-[var(--danger)] text-white hover:opacity-90 focus:ring-[var(--danger)] shadow-[var(--shadow-sm)]',
    outline:   'bg-transparent border border-[var(--border-strong)] text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] focus:ring-[var(--border-strong)]',
  };

  const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
    xs: 'px-2.5 py-1   text-xs  gap-1',
    sm: 'px-3   py-1.5 text-sm  gap-1.5',
    md: 'px-4   py-2   text-sm  gap-2',
    lg: 'px-6   py-3   text-base gap-2',
  };

  return (
    <button
      className={classNames(base, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : (
        <>{leftIcon}{children}{rightIcon}</>
      )}
    </button>
  );
};
