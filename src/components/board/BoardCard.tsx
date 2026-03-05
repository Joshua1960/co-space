import React, { memo } from "react";
import { Calendar, MoreVertical, Trash2 } from "lucide-react";
import type { Board } from "../../types";
import { formatRelativeDate } from "../../lib/utils";

interface BoardCardProps {
  board: Board;
  onSelect: (boardId: string) => void;
  onDelete: (boardId: string) => void;
  columnCount: number;
  cardCount: number;
}

export const BoardCard: React.FC<BoardCardProps> = memo(
  ({ board, onSelect, onDelete, columnCount, cardCount }) => {
    const [showMenu, setShowMenu] = React.useState(false);

    return (
      <article
        className="group relative bg-white rounded-2xl border border-slate-200 p-5 hover:border-slate-300 hover:shadow-lg transition-all duration-200 cursor-pointer"
        onClick={() => onSelect(board.id)}
        role="button"
        tabIndex={0}
        aria-label={`Open board ${board.title}`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect(board.id);
          }
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-slate-900 line-clamp-1 pr-8">
            {board.title}
          </h3>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-all"
              aria-label="Board options"
              aria-expanded={showMenu}
            >
              <MoreVertical size={16} />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                  }}
                />
                <div className="absolute right-0 top-full mt-1 z-20 w-36 bg-white rounded-xl shadow-lg border border-slate-200 py-1 overflow-hidden">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      onDelete(board.id);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={14} />
                    Delete board
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-slate-500 line-clamp-2 mb-4 min-h-10">
          {board.description || "No description"}
        </p>

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span>{columnCount} columns</span>
            <span>•</span>
            <span>{cardCount} cards</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar size={12} />
            <span>{formatRelativeDate(board.createdAt)}</span>
          </div>
        </div>
      </article>
    );
  },
);

BoardCard.displayName = "BoardCard";
