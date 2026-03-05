import React, { useState, useCallback } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "../components/ui/Button";
import { ColumnComponent } from "../components/column";
import { CardModal } from "../components/card/CardModal";
import {
  useAppState,
  useActiveBoard,
  useBoardColumns,
} from "../context/AppContext";
import type { Card } from "../types";
import { formatDate } from "../lib/utils";

export const BoardView: React.FC = () => {
  const { dispatch, getColumnCards } = useAppState();
  const board = useActiveBoard();
  const columns = useBoardColumns(board?.id || "");

  // Modal states
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [isCreateColumnModalOpen, setIsCreateColumnModalOpen] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");

  // Handle back navigation
  const handleBack = useCallback(() => {
    dispatch({ type: "SET_ACTIVE_BOARD", payload: { boardId: null } });
  }, [dispatch]);

  // Column actions
  const handleCreateColumn = useCallback(() => {
    if (!board || !newColumnTitle.trim()) return;
    dispatch({
      type: "CREATE_COLUMN",
      payload: { boardId: board.id, title: newColumnTitle.trim() },
    });
    setNewColumnTitle("");
    setIsCreateColumnModalOpen(false);
  }, [board, newColumnTitle, dispatch]);

  const handleEditColumn = useCallback(
    (columnId: string, title: string) => {
      dispatch({ type: "UPDATE_COLUMN", payload: { columnId, title } });
    },
    [dispatch],
  );

  const handleDeleteColumn = useCallback(
    (columnId: string) => {
      if (window.confirm("Delete this column and all its cards?")) {
        dispatch({ type: "DELETE_COLUMN", payload: { columnId } });
      }
    },
    [dispatch],
  );

  // Card actions
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

  const handleDeleteCard = useCallback(
    (cardId: string) => {
      if (window.confirm("Delete this card?")) {
        dispatch({ type: "DELETE_CARD", payload: { cardId } });
      }
    },
    [dispatch],
  );

  // Get cards for each column (memoized)
  const getColumnCardsMemo = useCallback(
    (columnId: string) => getColumnCards(columnId),
    [getColumnCards],
  );

  if (!board) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <p className="text-slate-500">Board not found</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Go back to dashboard"
            >
              <ArrowLeft size={20} />
            </button>

            <div className="flex-1">
              <h1 className="text-xl font-bold text-slate-900">
                {board.title}
              </h1>
              <p className="text-sm text-slate-500">
                Created {formatDate(board.createdAt)}
              </p>
            </div>

            <Button
              onClick={() => setIsCreateColumnModalOpen(true)}
              leftIcon={<Plus size={16} />}
              variant="secondary"
            >
              Add Column
            </Button>
          </div>
        </div>
      </header>

      {/* Board content */}
      <div className="p-6 overflow-x-auto">
        <div className="flex gap-4 min-h-[calc(100vh-140px)]">
          {/* Columns */}
          {columns.map((column) => (
            <ColumnComponent
              key={column.id}
              column={column}
              cards={getColumnCardsMemo(column.id)}
              onCreateCard={handleCreateCard}
              onEditCard={handleEditCard}
              onDeleteCard={handleDeleteCard}
              onEditColumn={handleEditColumn}
              onDeleteColumn={handleDeleteColumn}
            />
          ))}

          {/* Add column button */}
          <button
            onClick={() => setIsCreateColumnModalOpen(true)}
            className="shrink-0 w-72 bg-slate-100/50 border-2 border-dashed border-slate-200 rounded-2xl p-4 text-slate-500 hover:text-slate-700 hover:border-slate-300 hover:bg-slate-100 transition-all flex flex-col items-center justify-center gap-2"
            aria-label="Add new column"
          >
            <Plus size={24} />
            <span className="font-medium">Add Column</span>
          </button>
        </div>
      </div>

      {/* Card Modal */}
      <CardModal
        isOpen={isCardModalOpen}
        onClose={() => {
          setIsCardModalOpen(false);
          setEditingCard(null);
          setActiveColumnId(null);
        }}
        columnId={activeColumnId}
        editingCard={editingCard}
      />

      {/* Create Column Modal (inline) */}
      {isCreateColumnModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsCreateColumnModalOpen(false);
              setNewColumnTitle("");
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="column-modal-title"
        >
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2
                id="column-modal-title"
                className="text-lg font-semibold text-slate-900"
              >
                Add Column
              </h2>
              <button
                onClick={() => {
                  setIsCreateColumnModalOpen(false);
                  setNewColumnTitle("");
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            <div className="px-6 py-4">
              <input
                type="text"
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateColumn();
                  if (e.key === "Escape") {
                    setIsCreateColumnModalOpen(false);
                    setNewColumnTitle("");
                  }
                }}
                placeholder="Column name"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                autoFocus
              />
            </div>
            <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => {
                  setIsCreateColumnModalOpen(false);
                  setNewColumnTitle("");
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateColumn}>Create</Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
