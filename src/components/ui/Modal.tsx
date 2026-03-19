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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={handleBackdrop}
      role="dialog" aria-modal="true" aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className={[
          'w-full flex flex-col overflow-hidden',
          'rounded-t-2xl sm:rounded-2xl',
          'max-h-[92vh] sm:max-h-[90vh]',
          'bg-white shadow-2xl',
          `sm:${sizeMap[size]}`,
        ].join(' ')}
        style={{ border: '1px solid var(--border, #e2e8f0)' }}
      >
        {/* Drag handle on mobile */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1 shrink-0">
          <div className="w-8 h-1 rounded-full bg-slate-200" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-5 sm:px-6 py-3 sm:py-4 shrink-0 border-b border-slate-100">
          <div>
            <h2 id="modal-title" className="text-base font-semibold text-slate-900">{title}</h2>
            {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 sm:px-6 py-4 sm:py-5 overflow-y-auto flex-1 scrollbar-thin">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-5 sm:px-6 py-3 sm:py-4 shrink-0 flex justify-end gap-2 sm:gap-3 border-t border-slate-100 bg-slate-50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
