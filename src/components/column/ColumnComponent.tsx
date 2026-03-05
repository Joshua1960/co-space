import React, { memo, useState, useCallback } from "react";
import { Plus, MoreVertical, Edit2, Trash2 } from "lucide-react";
import type { Column, Card } from "../../types";
import { CardComponent } from "../card/CardComponent";

interface ColumnComponentProps {
  column: Column;
  cards: Card[];
  onCreateCard: (columnId: string) => void;
  onEditCard: (card: Card) => void;
  onDeleteCard: (cardId: string) => void;
  onEditColumn: (columnId: string, title: string) => void;
  onDeleteColumn: (columnId: string) => void;
}

export const ColumnComponent: React.FC<ColumnComponentProps> = memo(
  ({
    column,
    cards,
    onCreateCard,
    onEditCard,
    onDeleteCard,
    onEditColumn,
    onDeleteColumn,
  }) => {
    const [showMenu, setShowMenu] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(column.title);

    const handleSaveEdit = useCallback(() => {
      if (editTitle.trim()) {
        onEditColumn(column.id, editTitle.trim());
      }
      setIsEditing(false);
    }, [editTitle, column.id, onEditColumn]);

    return (
      <section
        className="shrink-0 w-72 bg-slate-50 rounded-2xl p-3"
        aria-label={`Column: ${column.title}`}
      >
        {/* Header */}
        <header className="flex items-center justify-between mb-3 px-1">
          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveEdit();
                if (e.key === "Escape") {
                  setEditTitle(column.title);
                  setIsEditing(false);
                }
              }}
              className="flex-1 px-2 py-1 text-sm font-semibold bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              autoFocus
            />
          ) : (
            <>
              <h3 className="font-semibold text-slate-900 text-sm flex-1 truncate">
                {column.title}
              </h3>
              <span className="text-xs text-slate-400 ml-2 tabular-nums">
                {cards.length}
              </span>
            </>
          )}

          <div className="relative ml-2">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
              aria-label="Column options"
              aria-expanded={showMenu}
            >
              <MoreVertical size={14} />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 z-20 w-32 bg-white rounded-lg shadow-lg border border-slate-200 py-1 overflow-hidden">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setIsEditing(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Edit2 size={12} />
                    Rename
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onDeleteColumn(column.id);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={12} />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Cards */}
        <div className="space-y-2 mb-3 max-h-[calc(100vh-280px)] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
          {cards.map((card) => (
            <CardComponent
              key={card.id}
              card={card}
              onEdit={onEditCard}
              onDelete={onDeleteCard}
            />
          ))}

          {cards.length === 0 && (
            <div className="text-center py-6 text-sm text-slate-400">
              No cards yet
            </div>
          )}
        </div>

        {/* Add card button */}
        <button
          onClick={() => onCreateCard(column.id)}
          className="w-full flex items-center justify-center gap-1.5 py-2 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label={`Add card to ${column.title}`}
        >
          <Plus size={14} />
          <span>Add card</span>
        </button>
      </section>
    );
  },
);

ColumnComponent.displayName = "ColumnComponent";
