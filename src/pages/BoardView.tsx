import React, { useState, useCallback, useMemo, useRef } from 'react';
import { ArrowLeft, Plus, Columns } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { UndoRedoBar } from '../components/ui/UndoRedoBar';
import { ColumnComponent } from '../components/column';
import { CardModal, CardDetailModal } from '../components/card';
import { CollabBar } from '../components/collab/CollabBar';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { UndoRedoProvider, useUndoRedo } from '../lib/undoRedoContext';
import { useAppState, useActiveBoard, useBoardColumns } from '../context/AppContext';
import type { Card } from '../types';
import { formatDate } from '../lib/utils';
import { useDragAndDrop } from '../lib/hooks/useDragAndDrop';

const BoardViewInner: React.FC = () => {
  const { state, dispatch, publishEvent } = useAppState();
  const { dispatchUndoable } = useUndoRedo();
  const board = useActiveBoard();
  const columns = useBoardColumns(board?.id || '');

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

  // Confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const confirmCallbackRef = useRef<(() => void) | null>(null);

  const openConfirm = useCallback((title: string, message: string, onConfirm: () => void) => {
    confirmCallbackRef.current = onConfirm;
    setConfirmConfig({ title, message, onConfirm });
    setConfirmOpen(true);
  }, []);

  const handleConfirm = useCallback(() => {
    confirmCallbackRef.current?.();
    setConfirmOpen(false);
    setConfirmConfig(null);
  }, []);

  const handleCancelConfirm = useCallback(() => {
    setConfirmOpen(false);
    setConfirmConfig(null);
  }, []);

  const handleBack = useCallback(() => {
    dispatch({ type: 'SET_ACTIVE_BOARD', payload: { boardId: null } });
  }, [dispatch]);

  const handleCreateColumn = useCallback(() => {
    if (!board || !newColumnTitle.trim()) return;
    dispatch({ type: 'CREATE_COLUMN', payload: { boardId: board.id, title: newColumnTitle.trim() } });
    publishEvent('COLUMN_CREATED', { boardId: board.id, columnId: 'pending', title: newColumnTitle.trim() });
    setNewColumnTitle('');
    setIsCreateColumnModalOpen(false);
  }, [board, newColumnTitle, dispatch, publishEvent]);

  const handleEditColumn = useCallback((columnId: string, title: string) => {
    dispatch({ type: 'UPDATE_COLUMN', payload: { columnId, title } });
    publishEvent('COLUMN_UPDATED', { columnId, title });
  }, [dispatch, publishEvent]);

  const handleDeleteColumn = useCallback((columnId: string) => {
    openConfirm(
      'Delete column',
      'This will permanently delete the column and all its cards. This cannot be undone.',
      () => {
        dispatch({ type: 'DELETE_COLUMN', payload: { columnId } });
        publishEvent('COLUMN_DELETED', { columnId });
      },
    );
  }, [dispatch, publishEvent, openConfirm]);

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

  const handleDeleteCard = useCallback((cardId: string) => {
    openConfirm(
      'Delete card',
      'This card and all its comments will be permanently deleted.',
      () => {
        dispatchUndoable({ type: 'DELETE_CARD', payload: { cardId } });
        publishEvent('CARD_DELETED', { cardId });
      },
    );
  }, [dispatchUndoable, publishEvent, openConfirm]);

  if (!board) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <p className="text-slate-500">Board not found</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-stone-50 flex flex-col">
      {/* ── Header ── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shrink-0">
        <div className="px-3 sm:px-5 py-2.5 sm:py-3">
          {/* Single row — collapses gracefully */}
          <div className="flex items-center gap-2">
            {/* Back */}
            <button
              onClick={handleBack}
              className="p-1.5 sm:p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 shrink-0"
              aria-label="Back to dashboard"
            >
              <ArrowLeft size={18} />
            </button>

            {/* Title — truncates on small screens */}
            <div className="flex-1 min-w-0">
              <h1 className="text-sm sm:text-lg font-bold text-slate-900 truncate leading-tight">
                {board.title}
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">
                Created {formatDate(board.createdAt)}
              </p>
            </div>

            {/* Controls — undo/redo hidden on very small screens via title attr */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {/* Undo/Redo — icon-only on mobile */}
              <UndoRedoBar compact />

              <div className="w-px h-4 bg-slate-200 hidden sm:block" />

              {/* Collab — avatars only on mobile */}
              <CollabBar compact />

              {/* Add column */}
              <button
                onClick={() => setIsCreateColumnModalOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium"
                aria-label="Add column"
              >
                <Plus size={14} />
                <span className="hidden sm:inline">Add Column</span>
                <Columns size={14} className="sm:hidden" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Board canvas ── */}
      {/* On mobile: vertical stack of full-width columns with scroll
          On desktop: horizontal scroll of fixed-width columns */}
      <div className="flex-1 overflow-x-auto overflow-y-auto">
        <div
          className="
            flex flex-col gap-3 p-3
            sm:flex-row sm:items-start sm:gap-4 sm:p-5
            min-h-full
          "
        >
          {columns.length === 0 && (
            <div className="flex-1 flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Columns size={22} className="text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-700 mb-1">No columns yet</p>
                <p className="text-xs text-slate-400 mb-4">Add a column to start organising cards</p>
                <button
                  onClick={() => setIsCreateColumnModalOpen(true)}
                  className="text-xs bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800"
                >
                  Add Column
                </button>
              </div>
            </div>
          )}

          {columns.map((column) => (
            <ColumnComponent
              key={column.id}
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
          ))}

          {/* Add column button — desktop only (mobile uses header button) */}
          {columns.length > 0 && (
            <button
              onClick={() => setIsCreateColumnModalOpen(true)}
              className="hidden sm:flex shrink-0 w-72 rounded-2xl p-4 flex-col items-center justify-center gap-2 self-start border-2 border-dashed border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600 hover:bg-slate-50"
              style={{ minHeight: '100px' }}
              aria-label="Add new column"
            >
              <Plus size={20} />
              <span className="text-sm font-medium">Add Column</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      <CardModal
        isOpen={isCardModalOpen}
        onClose={() => { setIsCardModalOpen(false); setEditingCard(null); setActiveColumnId(null); }}
        columnId={activeColumnId}
        editingCard={editingCard}
      />

      <ConfirmDialog
        isOpen={confirmOpen}
        title={confirmConfig?.title ?? ''}
        message={confirmConfig?.message ?? ''}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleConfirm}
        onCancel={handleCancelConfirm}
      />

      <CardDetailModal
        card={detailCard}
        isOpen={isDetailOpen}
        onClose={() => { setIsDetailOpen(false); setDetailCard(null); }}
        onEdit={(card) => { setIsDetailOpen(false); handleEditCard(card); }}
        onDelete={handleDeleteCard}
      />

      {/* Create Column modal */}
      {isCreateColumnModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) { setIsCreateColumnModalOpen(false); setNewColumnTitle(''); }
          }}
          role="dialog"
          aria-modal="true"
        >
          {/* Sheet on mobile, centered modal on desktop */}
          <div className="w-full sm:max-w-sm bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900">Add Column</h2>
              <button
                onClick={() => { setIsCreateColumnModalOpen(false); setNewColumnTitle(''); }}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                ×
              </button>
            </div>
            <div className="px-5 py-4">
              <input
                type="text"
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateColumn();
                  if (e.key === 'Escape') { setIsCreateColumnModalOpen(false); setNewColumnTitle(''); }
                }}
                placeholder="Column name"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-slate-900"
                autoFocus
              />
            </div>
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setIsCreateColumnModalOpen(false); setNewColumnTitle(''); }}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleCreateColumn} disabled={!newColumnTitle.trim()}>
                Create
              </Button>
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
