import React, { forwardRef, useId } from "react";
import { classNames } from "../../lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || `input-${generatedId}`;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={classNames(
            "w-full px-4 py-2.5 rounded-xl border bg-white transition-all duration-200",
            "text-slate-900 placeholder-slate-400",
            "focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent",
            error
              ? "border-red-300 focus:ring-red-500"
              : "border-slate-200 hover:border-slate-300",
            className,
          )}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={
            error
              ? `${inputId}-error`
              : helperText
                ? `${inputId}-helper`
                : undefined
          }
          {...props}
        />
        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-1.5 text-sm text-red-600"
            role="alert"
          >
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="mt-1.5 text-sm text-slate-500">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

// Textarea component
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const generatedId = useId();
    const textareaId = id || `textarea-${generatedId}`;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={classNames(
            "w-full px-4 py-2.5 rounded-xl border bg-white transition-all duration-200 resize-none",
            "text-slate-900 placeholder-slate-400",
            "focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent",
            error
              ? "border-red-300 focus:ring-red-500"
              : "border-slate-200 hover:border-slate-300",
            className,
          )}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={
            error
              ? `${textareaId}-error`
              : helperText
                ? `${textareaId}-helper`
                : undefined
          }
          {...props}
        />
        {error && (
          <p
            id={`${textareaId}-error`}
            className="mt-1.5 text-sm text-red-600"
            role="alert"
          >
            {error}
          </p>
        )}
        {helperText && !error && (
          <p
            id={`${textareaId}-helper`}
            className="mt-1.5 text-sm text-slate-500"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";

// Date Input
interface DateInputProps extends Omit<InputProps, "type"> {
  type?: "date";
}

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  (props, ref) => {
    return <Input ref={ref} type="date" {...props} />;
  },
);

DateInput.displayName = "DateInput";
