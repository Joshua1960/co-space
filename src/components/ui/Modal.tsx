import React, { useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { useKeyboard, useFocusTrap } from '../../lib/hooks/useKeyboard';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen, onClose, title, description, children, size = 'md', footer,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const prevFocus = useRef<HTMLElement | null>(null);

  useKeyboard('Escape', onClose, { enabled: isOpen });
  useFocusTrap(modalRef as React.RefObject<HTMLElement>, isOpen);

  useEffect(() => {
    if (isOpen) prevFocus.current = document.activeElement as HTMLElement;
    else prevFocus.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleBackdrop = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  if (!isOpen) return null;

  const sizeMap = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl', '2xl': 'max-w-2xl' };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={handleBackdrop}
      role="dialog" aria-modal="true" aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className={[
          'w-full flex flex-col max-h-[90vh] rounded-2xl overflow-hidden',
          'bg-[var(--bg-surface)] shadow-[var(--shadow-xl)]',
          sizeMap[size],
        ].join(' ')}
        style={{ border: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 id="modal-title" className="text-base font-semibold text-[var(--text-primary)]">{title}</h2>
            {description && <p className="text-sm text-[var(--text-muted)] mt-0.5">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto flex-1 scrollbar-thin">{children}</div>

        {/* Optional footer */}
        {footer && (
          <div className="px-6 py-4 shrink-0 flex justify-end gap-3" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
