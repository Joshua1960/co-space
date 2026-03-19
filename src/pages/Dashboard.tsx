import React, { useState, useCallback, useMemo, useRef } from 'react';
import { Plus, LayoutGrid, Search } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { BoardCard, CreateBoardModal } from '../components/board';
import { useAppState, useBoards } from '../context/AppContext';
import { CollabBar } from '../components/collab/CollabBar';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

export const Dashboard: React.FC = () => {
  const { dispatch, state } = useAppState();
  const boards = useBoards();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const pendingBoardTitle = useRef<string>('');

  const filteredBoards = useMemo(() => {
    if (!searchQuery.trim()) return boards;
    const q = searchQuery.toLowerCase();
    return boards.filter(
      (b) => b.title.toLowerCase().includes(q) || b.description.toLowerCase().includes(q),
    );
  }, [boards, searchQuery]);

  const getBoardStats = useCallback((boardId: string) => {
    const board = state.boards.byId[boardId];
    if (!board) return { columnCount: 0, cardCount: 0 };
    return {
      columnCount: board.columnIds.length,
      cardCount: board.columnIds.reduce((acc, colId) => acc + (state.columns.byId[colId]?.cardIds.length || 0), 0),
    };
  }, [state.boards.byId, state.columns.byId]);

  const handleSelectBoard = useCallback(
    (boardId: string) => dispatch({ type: 'SET_ACTIVE_BOARD', payload: { boardId } }),
    [dispatch],
  );

  const handleDeleteBoard = useCallback((boardId: string) => {
    pendingBoardTitle.current = state.boards.byId[boardId]?.title ?? 'this board';
    setPendingDeleteId(boardId);
    setConfirmOpen(true);
  }, [state.boards.byId]);

  const handleConfirmDelete = useCallback(() => {
    if (pendingDeleteId) dispatch({ type: 'DELETE_BOARD', payload: { boardId: pendingDeleteId } });
    setConfirmOpen(false);
    setPendingDeleteId(null);
  }, [pendingDeleteId, dispatch]);

  const handleCancelDelete = useCallback(() => {
    setConfirmOpen(false);
    setPendingDeleteId(null);
  }, []);

  return (
    <main className="min-h-screen bg-stone-50">
      {/* ── Header ── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          {/* Top row: logo + actions */}
          <div className="flex items-center justify-between gap-2">
            {/* Logo */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-900 rounded-xl flex items-center justify-center shrink-0">
                <LayoutGrid size={16} className="text-white sm:hidden" />
                <LayoutGrid size={20} className="text-white hidden sm:block" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-bold text-slate-900 leading-tight truncate">
                  CoSpace <span className="text-slate-400 font-normal hidden sm:inline">by Josh</span>
                </h1>
                <p className="text-xs text-slate-400 hidden sm:block">Collaborative workspace</p>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2 shrink-0">
              <CollabBar />
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                leftIcon={<Plus size={15} />}
                size="sm"
              >
                <span className="hidden sm:inline">New Board</span>
                <span className="sm:hidden">New</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Search */}
        <div className="mb-5">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search boards…"
              className="w-full sm:max-w-md pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-slate-900 placeholder-slate-400"
            />
          </div>
        </div>

        {/* Boards grid */}
        {filteredBoards.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredBoards.map((board) => {
              const stats = getBoardStats(board.id);
              return (
                <BoardCard
                  key={board.id}
                  board={board}
                  onSelect={handleSelectBoard}
                  onDelete={handleDeleteBoard}
                  columnCount={stats.columnCount}
                  cardCount={stats.cardCount}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 sm:py-24">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <LayoutGrid size={28} className="text-slate-400" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">
              {searchQuery ? 'No boards found' : 'No boards yet'}
            </h3>
            <p className="text-sm text-slate-500 mb-6 px-4">
              {searchQuery
                ? 'Try a different search term'
                : 'Create your first board to get started'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsCreateModalOpen(true)} leftIcon={<Plus size={15} />}>
                Create Board
              </Button>
            )}
          </div>
        )}
      </div>

      <CreateBoardModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />

      <ConfirmDialog
        isOpen={confirmOpen}
        title={`Delete "${pendingBoardTitle.current}"?`}
        message="This will permanently delete the board, all its columns, and all cards. This cannot be undone."
        confirmLabel="Delete board"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </main>
  );
};
