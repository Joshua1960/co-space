import React from 'react';
import { X, Edit, Trash2, Calendar, Clock, User } from 'lucide-react';
import { useAppState } from '../../context/AppContext';
import { CommentThread } from '../comments/CommentThread';
import { Tag } from '../ui/TagInput';
import { MarkdownRenderer } from '../../lib/markdown';
import { formatDate, isOverdue, formatRelativeDate } from '../../lib/utils';
import type { Card } from '../../types';

interface CardDetailModalProps {
  card: Card | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (card: Card) => void;
  onDelete: (cardId: string) => void;
}

export const CardDetailModal: React.FC<CardDetailModalProps> = ({ card, isOpen, onClose, onEdit, onDelete }) => {
  const { state } = useAppState();
  if (!isOpen || !card) return null;

  const overdue = isOverdue(card.dueDate);
  const column = state.columns.byId[card.columnId];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Sheet on mobile (slides from bottom), modal on desktop */}
      <div className="w-full sm:max-w-2xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh]">

        {/* ── Header ── */}
        <div className="flex items-start justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 shrink-0">
          <div className="flex-1 pr-3 min-w-0">
            {/* Column badge + version */}
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {column && (
                <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full font-medium">
                  {column.title}
                </span>
              )}
              <span className="text-xs text-slate-400">v{card.version}</span>
              {overdue && (
                <span className="text-xs px-2 py-0.5 bg-red-50 text-red-600 rounded-full font-medium">
                  Overdue
                </span>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">{card.title}</h2>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={() => onEdit(card)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
              aria-label="Edit card"
            >
              <Edit size={15} />
            </button>
            <button
              onClick={() => { onDelete(card.id); onClose(); }}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
              aria-label="Delete card"
            >
              <Trash2 size={15} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
              aria-label="Close"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5">
          {/* Meta row */}
          <div className="flex flex-wrap gap-3 mb-4 text-xs text-slate-500">
            {card.dueDate && (
              <div className={`flex items-center gap-1.5 ${overdue ? 'text-red-600' : ''}`}>
                <Calendar size={12} />
                <span>Due {formatDate(card.dueDate)}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Clock size={12} />
              <span>Updated {formatRelativeDate(card.updatedAt)}</span>
            </div>
            {card.lastEditedBy && (
              <div className="flex items-center gap-1.5">
                <User size={12} />
                <span>{card.lastEditedBy}</span>
              </div>
            )}
          </div>

          {/* Tags */}
          {card.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {card.tags.map((tag) => <Tag key={tag} label={tag} />)}
            </div>
          )}

          {/* Description */}
          {card.description ? (
            <div className="mb-5 p-3 sm:p-4 bg-slate-50 rounded-xl border border-slate-100">
              <MarkdownRenderer content={card.description} />
            </div>
          ) : (
            <p className="text-sm italic text-slate-400 mb-5">No description added.</p>
          )}

          {/* Comments */}
          <div className="border-t border-slate-100 pt-4">
            <CommentThread cardId={card.id} />
          </div>
        </div>
      </div>
    </div>
  );
};
