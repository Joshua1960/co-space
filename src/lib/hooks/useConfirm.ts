import { useState, useCallback } from 'react';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning';
}

interface ConfirmState extends ConfirmOptions {
  isOpen: boolean;
  resolve: ((value: boolean) => void) | null;
}

export function useConfirm() {
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    isOpen: false,
    title: '',
    message: '',
    resolve: null,
  });

  // Returns a promise that resolves to true (confirmed) or false (cancelled).
  // Usage: const ok = await confirm({ title: '...', message: '...' });
  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({ ...options, isOpen: true, resolve });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    confirmState.resolve?.(true);
    setConfirmState((s) => ({ ...s, isOpen: false, resolve: null }));
  }, [confirmState]);

  const handleCancel = useCallback(() => {
    confirmState.resolve?.(false);
    setConfirmState((s) => ({ ...s, isOpen: false, resolve: null }));
  }, [confirmState]);

  return {
    confirm,
    confirmModalProps: {
      isOpen: confirmState.isOpen,
      title: confirmState.title,
      message: confirmState.message,
      confirmLabel: confirmState.confirmLabel,
      cancelLabel: confirmState.cancelLabel,
      variant: confirmState.variant,
      onConfirm: handleConfirm,
      onCancel: handleCancel,
    },
  };
}
