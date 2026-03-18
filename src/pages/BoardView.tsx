import React, { useState, useCallback, useMemo } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { UndoRedoBar } from '../components/ui/UndoRedoBar';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { ColumnComponent } from '../components/column';
import { CardModal, CardDetailModal } from '../components/card';
import { CollabBar } from '../components/collab/CollabBar';
import { SectionErrorBoundary } from '../components/ui/ErrorBoundary';
import { ColumnSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { UndoRedoProvider, useUndoRedo } from '../lib/undoRedoContext';
import { useConfirm } from '../lib/hooks/useConfirm';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { useAppState, useActiveBoard, useBoardColumns } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import type { Card } from '../types';
import { formatDate } from '../lib/utils';
import { useDragAndDrop } from '../lib/hooks/useDragAndDrop';

const BoardViewInner: React.FC = () => {
  const { state, dispatch, publishEvent } = useAppState();
  const { confirm, confirmModalProps } = useConfirm();
  const { dispatchUndoable } = useUndoRedo();
  const { toast } = useToast();
  const board = useActiveBoard();
  const columns = useBoardColumns(board?.id || '');
  const [isLoadingBoard] = useState(false);

  const allCards = useMemo(() => Object.values(state.cards.byId), [state.cards.byId]);

  const onMoveTask = useCallback((result: {
    taskId: string;
    source: { columnId: string; index: number };
    destination: { columnId: string; index: number };
  }) => {
    dispatchUndoable({
      type: 'MOVE_CARD',
      payload: {
        cardId: result.taskId,
        sourceColumnId: result.source.columnId,
        destinationColumnId: result.destination.columnId,
        newIndex: result.destination.index,
      },
    });
    publishEvent('CARD_MOVED', {
      cardId: result.taskId,
      sourceColumnId: result.source.columnId,
      destinationColumnId: result.destination.columnId,
      newIndex: result.destination.index,
    });
  }, [dispatchUndoable, publishEvent]);

  const { handleDragStart, handleDragEnd, handleDragOver, handleDragLeave, handleDrop } =
    useDragAndDrop({ onMoveTask, tasks: allCards });

  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [detailCard, setDetailCard] = useState<Card | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateColumnModalOpen, setIsCreateColumnModalOpen] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');

  const handleBack = useCallback(() => {
    dispatch({ type: 'SET_ACTIVE_BOARD', payload: { boardId: null } });
  }, [dispatch]);

  const handleCreateColumn = useCallback(() => {
    if (!board || !newColumnTitle.trim()) return;
    dispatch({ type: 'CREATE_COLUMN', payload: { boardId: board.id, title: newColumnTitle.trim() } });
    publishEvent('COLUMN_CREATED', { boardId: board.id, columnId: 'pending', title: newColumnTitle.trim() });
    toast(`Column "${newColumnTitle.trim()}" added`, 'success');
    setNewColumnTitle('');
    setIsCreateColumnModalOpen(false);
  }, [board, newColumnTitle, dispatch, publishEvent, toast]);

  const handleEditColumn = useCallback((columnId: string, title: string) => {
    dispatch({ type: 'UPDATE_COLUMN', payload: { columnId, title } });
    publishEvent('COLUMN_UPDATED', { columnId, title });
    toast('Column renamed', 'info');
  }, [dispatch, publishEvent, toast]);

  const handleDeleteColumn = useCallback(async (columnId: string) => {
    const col = state.columns.byId[columnId];
    if (!col) return;
    const ok = await confirm({
      title: 'Delete column?',
      message: `"${col.title}" and all its cards will be permanently removed. This cannot be undone.`,
      confirmLabel: 'Delete column',
    });
    if (!ok) return;
    dispatch({ type: 'DELETE_COLUMN', payload: { columnId } });
    publishEvent('COLUMN_DELETED', { columnId });
    toast(`Column "${col.title}" deleted`, 'info');
  }, [confirm, dispatch, publishEvent, state.columns.byId, toast]);

  const handleCreateCard = useCallback((columnId: string) => {
    setActiveColumnId(columnId);
    setEditingCard(null);
    setIsCardModalOpen(true);
  }, []);

  const handleEditCard = useCallback((card: Card) => {
    setActiveColumnId(card.columnId);
    setEditingCard(card);
    setIsCardModalOpen(true);
  }, []);

  const handleOpenCardDetail = useCallback((card: Card) => {
    setDetailCard(card);
    setIsDetailOpen(true);
  }, []);

  const handleDeleteCard = useCallback(async (cardId: string) => {
    const card = state.cards.byId[cardId];
    if (!card) return;
    const ok = await confirm({
      title: 'Delete card?',
      message: `"${card.title}" will be permanently removed. You can undo this with Ctrl+Z.`,
      confirmLabel: 'Delete card',
    });
    if (!ok) return;
    dispatchUndoable({ type: 'DELETE_CARD', payload: { cardId } });
    publishEvent('CARD_DELETED', { cardId });
    toast(`Card "${card.title}" deleted — Ctrl+Z to undo`, 'info');
  }, [confirm, dispatchUndoable, publishEvent, state.cards.byId, toast]);

  if (!board) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <p style={{ color: 'var(--text-muted)' }}>Board not found</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-40"
        style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}
      >
        <div className="px-6 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-subtle)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              aria-label="Back to dashboard"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold truncate" style={{ color: 'var(--text-primary)' }}>{board.title}</h1>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Created {formatDate(board.createdAt)}</p>
            </div>
            <div className="flex items-center gap-2">
              <UndoRedoBar />
              <div className="w-px h-5" style={{ background: 'var(--border)' }} />
              <CollabBar />
              <ThemeToggle />
              <Button
                onClick={() => setIsCreateColumnModalOpen(true)}
                leftIcon={<Plus size={15} />}
                variant="secondary"
                size="sm"
              >
                Add Column
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Board */}
      <div className="p-6 overflow-x-auto">
        <div className="flex gap-4 items-start min-h-[calc(100vh-120px)]">

          {/* Loading skeletons */}
          {isLoadingBoard && [1, 2, 3].map((i) => <ColumnSkeleton key={i} />)}

          {/* Empty board state */}
          {!isLoadingBoard && columns.length === 0 && (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState
                icon={<Plus size={28} />}
                title="No columns yet"
                description="Add your first column to start organising cards on this board."
                action={{
                  label: 'Add column',
                  onClick: () => setIsCreateColumnModalOpen(true),
                  icon: <Plus size={15} />,
                }}
              />
            </div>
          )}

          {/* Columns */}
          {!isLoadingBoard && columns.map((column) => (
            <SectionErrorBoundary key={column.id} section={`Column "${column.title}"`}>
              <ColumnComponent
                columnId={column.id}
                columnTitle={column.title}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onCreateCard={handleCreateCard}
                onEditCard={handleEditCard}
                onDeleteCard={handleDeleteCard}
                onOpenCardDetail={handleOpenCardDetail}
                onEditColumn={handleEditColumn}
                onDeleteColumn={handleDeleteColumn}
              />
            </SectionErrorBoundary>
          ))}

          {/* Add column button */}
          {!isLoadingBoard && columns.length > 0 && (
            <button
              onClick={() => setIsCreateColumnModalOpen(true)}
              className="shrink-0 w-72 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 self-start"
              style={{
                background: 'transparent',
                border: '2px dashed var(--border)',
                color: 'var(--text-muted)',
                minHeight: '120px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-strong)';
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.background = 'var(--bg-subtle)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.background = 'transparent';
              }}
              aria-label="Add new column"
            >
              <Plus size={22} />
              <span className="text-sm font-medium">Add Column</span>
            </button>
          )}
        </div>
      </div>

      {/* Modals */}
      <CardModal
        isOpen={isCardModalOpen}
        onClose={() => { setIsCardModalOpen(false); setEditingCard(null); setActiveColumnId(null); }}
        columnId={activeColumnId}
        editingCard={editingCard}
      />

      <CardDetailModal
        card={detailCard}
        isOpen={isDetailOpen}
        onClose={() => { setIsDetailOpen(false); setDetailCard(null); }}
        onEdit={(card) => { setIsDetailOpen(false); handleEditCard(card); }}
        onDelete={handleDeleteCard}
      />

      <ConfirmModal {...confirmModalProps} />

      {/* Create Column inline modal */}
      {isCreateColumnModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) { setIsCreateColumnModalOpen(false); setNewColumnTitle(''); } }}
          role="dialog" aria-modal="true"
        >
          <div
            className="w-full max-w-sm rounded-2xl overflow-hidden shadow-[var(--shadow-xl)]"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Add Column</h2>
              <button
                onClick={() => { setIsCreateColumnModalOpen(false); setNewColumnTitle(''); }}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >×</button>
            </div>
            <div className="px-6 py-4">
              <input
                type="text" value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateColumn();
                  if (e.key === 'Escape') { setIsCreateColumnModalOpen(false); setNewColumnTitle(''); }
                }}
                placeholder="Column name"
                className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                autoFocus
              />
            </div>
            <div className="px-6 py-4 flex justify-end gap-3" style={{ background: 'var(--bg-subtle)', borderTop: '1px solid var(--border)' }}>
              <Button variant="ghost" size="sm" onClick={() => { setIsCreateColumnModalOpen(false); setNewColumnTitle(''); }}>Cancel</Button>
              <Button size="sm" onClick={handleCreateColumn}>Create</Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export const BoardView: React.FC = () => (
  <UndoRedoProvider>
    <BoardViewInner />
  </UndoRedoProvider>
);
