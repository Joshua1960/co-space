import React, { useEffect, useCallback } from 'react';
import { Undo2, Redo2 } from 'lucide-react';
import { useUndoRedo } from '../../lib/undoRedoContext';

export const UndoRedoBar: React.FC<{ compact?: boolean }> = ({ compact: _compact }) => {
  const { canUndo, canRedo, undoLabel, redoLabel, handleUndo, handleRedo } = useUndoRedo();

  const onKeyDown = useCallback((e: KeyboardEvent) => {
    const ctrl = e.ctrlKey || e.metaKey;
    if (!ctrl) return;
    if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); if (canUndo) handleUndo(); }
    else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') { e.preventDefault(); if (canRedo) handleRedo(); }
  }, [canUndo, canRedo, handleUndo, handleRedo]);

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onKeyDown]);

  const btnStyle = (active: boolean) => ({
    color: active ? 'var(--text-secondary)' : 'var(--text-muted)',
    opacity: active ? 1 : 0.4,
    cursor: active ? 'pointer' : 'not-allowed',
  });

  return (
    <div className="flex items-center gap-0.5">
      <button
        onClick={handleUndo} disabled={!canUndo}
        title={undoLabel ? `Undo: ${undoLabel} (Ctrl+Z)` : 'Nothing to undo'}
        aria-label="Undo"
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors"
        style={btnStyle(canUndo)}
        onMouseEnter={(e) => { if (canUndo) e.currentTarget.style.background = 'var(--bg-subtle)'; }}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        <Undo2 size={14} />
        <span className="hidden sm:inline">Undo</span>
      </button>
      <button
        onClick={handleRedo} disabled={!canRedo}
        title={redoLabel ? `Redo: ${redoLabel} (Ctrl+Shift+Z)` : 'Nothing to redo'}
        aria-label="Redo"
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors"
        style={btnStyle(canRedo)}
        onMouseEnter={(e) => { if (canRedo) e.currentTarget.style.background = 'var(--bg-subtle)'; }}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        <Redo2 size={14} />
        <span className="hidden sm:inline">Redo</span>
      </button>
    </div>
  );
};
