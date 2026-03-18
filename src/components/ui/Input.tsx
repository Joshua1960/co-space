import React, { forwardRef, useId } from 'react';
import { classNames } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftAddon?: React.ReactNode;
}

const inputBase = [
  'w-full px-4 py-2.5 rounded-xl border text-sm',
  'bg-[var(--bg-surface)] text-[var(--text-primary)]',
  'placeholder:text-[var(--text-muted)]',
  'focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent',
].join(' ');

export const Input = forwardRef<HTMLInputElement, InputProps>((
  { label, error, helperText, leftAddon, className, id, ...props }, ref
) => {
  const generatedId = useId();
  const inputId = id || `input-${generatedId}`;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {leftAddon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">{leftAddon}</span>
        )}
        <input
          ref={ref} id={inputId}
          className={classNames(
            inputBase,
            leftAddon ? 'pl-9' : '',
            error
              ? 'border-[var(--danger)] focus:ring-[var(--danger)]'
              : 'border-[var(--border)] hover:border-[var(--border-strong)]',
            className,
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          {...props}
        />
      </div>
      {error && <p id={`${inputId}-error`} className="mt-1.5 text-xs text-[var(--danger-text)]" role="alert">{error}</p>}
      {helperText && !error && <p id={`${inputId}-helper`} className="mt-1.5 text-xs text-[var(--text-muted)]">{helperText}</p>}
    </div>
  );
});
Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>((
  { label, error, helperText, className, id, ...props }, ref
) => {
  const generatedId = useId();
  const textareaId = id || `textarea-${generatedId}`;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={textareaId} className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
          {label}
        </label>
      )}
      <textarea
        ref={ref} id={textareaId}
        className={classNames(
          inputBase, 'resize-none',
          error
            ? 'border-[var(--danger)] focus:ring-[var(--danger)]'
            : 'border-[var(--border)] hover:border-[var(--border-strong)]',
          className,
        )}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-[var(--danger-text)]" role="alert">{error}</p>}
      {helperText && !error && <p className="mt-1.5 text-xs text-[var(--text-muted)]">{helperText}</p>}
    </div>
  );
});
Textarea.displayName = 'Textarea';

export interface DateInputProps extends Omit<InputProps, 'type'> { type?: 'date'; }
export const DateInput = forwardRef<HTMLInputElement, DateInputProps>((props, ref) => (
  <Input ref={ref} type="date" {...props} />
));
DateInput.displayName = 'DateInput';
