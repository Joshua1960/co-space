import React, {
  createContext, useContext, useCallback, useReducer, useRef, type ReactNode,
} from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number;   // ms, 0 = sticky
  exiting?: boolean;
}

type ToastAction =
  | { type: 'ADD';    toast: Toast }
  | { type: 'REMOVE'; id: string }
  | { type: 'EXIT';   id: string };

function toastReducer(state: Toast[], action: ToastAction): Toast[] {
  switch (action.type) {
    case 'ADD':    return [...state, action.toast];
    case 'EXIT':   return state.map((t) => t.id === action.id ? { ...t, exiting: true } : t);
    case 'REMOVE': return state.filter((t) => t.id !== action.id);
    default:       return state;
  }
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant, duration?: number) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle2 size={16} />,
  error:   <XCircle     size={16} />,
  warning: <AlertTriangle size={16} />,
  info:    <Info        size={16} />,
};

const STYLES: Record<ToastVariant, string> = {
  success: 'bg-[var(--success-subtle)] text-[var(--success-text)] border-[var(--success)]',
  error:   'bg-[var(--danger-subtle)]  text-[var(--danger-text)]  border-[var(--danger)]',
  warning: 'bg-[var(--warning-subtle)] text-[var(--warning-text)] border-[var(--warning)]',
  info:    'bg-[var(--info-subtle)]    text-[var(--info-text)]    border-[var(--info)]',
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, dispatch] = useReducer(toastReducer, []);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    dispatch({ type: 'EXIT', id });
    const t = setTimeout(() => dispatch({ type: 'REMOVE', id }), 200);
    timers.current.set(id, t);
  }, []);

  const toast = useCallback((message: string, variant: ToastVariant = 'info', duration = 3500) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    dispatch({ type: 'ADD', toast: { id, message, variant, duration } });
    if (duration > 0) {
      const t = setTimeout(() => dismiss(id), duration);
      timers.current.set(id, t);
    }
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      {/* Toast viewport */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed bottom-5 right-5 z-[200] flex flex-col gap-2 items-end pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="alert"
            className={[
              'flex items-start gap-2.5 px-4 py-3 rounded-xl border shadow-lg',
              'text-sm font-medium max-w-sm w-full pointer-events-auto',
              STYLES[t.variant],
              t.exiting ? 'toast-exit' : 'toast-enter',
            ].join(' ')}
          >
            <span className="shrink-0 mt-0.5">{ICONS[t.variant]}</span>
            <span className="flex-1 leading-snug">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
