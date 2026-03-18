import React, { useState, useCallback, useMemo } from 'react';
import { Plus, LayoutGrid, Search } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { BoardCard, CreateBoardModal } from '../components/board';
import { BoardCardSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { useAppState, useBoards } from '../context/AppContext';
import { useConfirm } from '../lib/hooks/useConfirm';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { CollabBar } from '../components/collab/CollabBar';
import { useToast } from '../context/ToastContext';

export const Dashboard: React.FC = () => {
  const { dispatch, state } = useAppState();
  const { toast } = useToast();
  const { confirm, confirmModalProps } = useConfirm();
  const boards = useBoards();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading] = useState(false); // would be true during async load

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
    const columnCount = board.columnIds.length;
    const cardCount = board.columnIds.reduce((acc, colId) => {
      return acc + (state.columns.byId[colId]?.cardIds.length || 0);
    }, 0);
    return { columnCount, cardCount };
  }, [state.boards.byId, state.columns.byId]);

  const handleSelectBoard = useCallback(
    (boardId: string) => dispatch({ type: 'SET_ACTIVE_BOARD', payload: { boardId } }),
    [dispatch],
  );

  const handleDeleteBoard = useCallback(async (boardId: string) => {
    const board = state.boards.byId[boardId];
    if (!board) return;
    const ok = await confirm({
      title: 'Delete board?',
      message: `"${board.title}" and all its columns and cards will be permanently removed. This cannot be undone.`,
      confirmLabel: 'Delete board',
    });
    if (!ok) return;
    dispatch({ type: 'DELETE_BOARD', payload: { boardId } });
    toast(`Board "${board.title}" deleted`, 'info');
  }, [confirm, dispatch, state.boards.byId, toast]);

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-40"
        style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'var(--brand)' }}
              >
                <LayoutGrid size={20} style={{ color: 'var(--text-inverse)' }} />
              </div>
              <div>
                <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  CoSpace <span style={{ color: 'var(--text-muted)' }}>by Josh</span>
                </h1>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Collaborative workspace</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CollabBar />
              <ThemeToggle />
              <Button onClick={() => setIsCreateModalOpen(true)} leftIcon={<Plus size={16} />} size="sm">
                New Board
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text" value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search boards…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent"
              style={{
                background: 'var(--bg-surface)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
        </div>

        {/* Skeletons while loading */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => <BoardCardSkeleton key={i} />)}
          </div>
        )}

        {/* Boards grid */}
        {!isLoading && filteredBoards.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
        )}

        {/* Empty states */}
        {!isLoading && filteredBoards.length === 0 && searchQuery && (
          <EmptyState
            icon={<Search size={28} />}
            title="No boards found"
            description={`No boards match "${searchQuery}". Try a different search term.`}
            action={{ label: 'Clear search', onClick: () => setSearchQuery('') }}
          />
        )}

        {!isLoading && boards.length === 0 && !searchQuery && (
          <EmptyState
            icon={<LayoutGrid size={28} />}
            title="No boards yet"
            description="Create your first board to start organising work with your team."
            action={{
              label: 'Create board',
              onClick: () => setIsCreateModalOpen(true),
              icon: <Plus size={15} />,
            }}
          />
        )}
      </div>

      <CreateBoardModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
      <ConfirmModal {...confirmModalProps} />
    </main>
  );
};
