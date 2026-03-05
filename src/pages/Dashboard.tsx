import React, { useState, useCallback, useMemo } from "react";
import { Plus, LayoutGrid, Search } from "lucide-react";
import { Button } from "../components/ui/Button";
import { BoardCard, CreateBoardModal } from "../components/board";
import { useAppState, useBoards } from "../context/AppContext";

export const Dashboard: React.FC = () => {
  const { dispatch, state } = useAppState();
  const boards = useBoards();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter boards based on search
  const filteredBoards = useMemo(() => {
    if (!searchQuery.trim()) return boards;
    const query = searchQuery.toLowerCase();
    return boards.filter(
      (board) =>
        board.title.toLowerCase().includes(query) ||
        board.description.toLowerCase().includes(query),
    );
  }, [boards, searchQuery]);

  // Get stats for each board
  const getBoardStats = useCallback(
    (boardId: string) => {
      const board = state.boards.byId[boardId];
      if (!board) return { columnCount: 0, cardCount: 0 };

      const columnCount = board.columnIds.length;
      const cardCount = board.columnIds.reduce((acc, colId) => {
        const column = state.columns.byId[colId];
        return acc + (column?.cardIds.length || 0);
      }, 0);

      return { columnCount, cardCount };
    },
    [state.boards.byId, state.columns.byId],
  );

  const handleSelectBoard = useCallback(
    (boardId: string) => {
      dispatch({ type: "SET_ACTIVE_BOARD", payload: { boardId } });
    },
    [dispatch],
  );

  const handleDeleteBoard = useCallback(
    (boardId: string) => {
      if (
        window.confirm(
          "Are you sure you want to delete this board? This action cannot be undone.",
        )
      ) {
        dispatch({ type: "DELETE_BOARD", payload: { boardId } });
      }
    },
    [dispatch],
  );

  return (
    <main className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
                <LayoutGrid size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  CoSpace <span className="text-slate-500">by Josh</span>
                </h1>
                <p className="text-xs text-slate-500">
                  Collaborative workspace
                </p>
              </div>
            </div>

            <Button
              onClick={() => setIsCreateModalOpen(true)}
              leftIcon={<Plus size={16} />}
            >
              New Board
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search boards..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>
        </div>

        {/* Boards Grid */}
        {filteredBoards.length > 0 ? (
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
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <LayoutGrid size={32} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {searchQuery ? "No boards found" : "No boards yet"}
            </h3>
            <p className="text-slate-500 mb-6">
              {searchQuery
                ? "Try a different search term"
                : "Create your first board to get started"}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                leftIcon={<Plus size={16} />}
              >
                Create Board
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <CreateBoardModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </main>
  );
};
