import React from 'react';
import { X, Edit, Trash2, Calendar, Clock, User } from 'lucide-react';
import { useAppState } from '../../context/AppContext';
import { CommentThread } from '../comments/CommentThread';
import { Tag } from '../ui/TagInput';
import { Badge } from '../ui/Badge';
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
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 overflow-y-auto bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-2xl rounded-2xl overflow-hidden mb-8"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              {column && (
                <Badge variant="default" size="sm">{column.title}</Badge>
              )}
              <Badge variant="outline" size="sm">v{card.version}</Badge>
              {overdue && <Badge variant="danger" size="sm" dot>Overdue</Badge>}
            </div>
            <h2 className="text-lg font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>{card.title}</h2>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onEdit(card)}
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-subtle)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              aria-label="Edit card"
            ><Edit size={15} /></button>
            <button
              onClick={() => { onDelete(card.id); onClose(); }}
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--danger-subtle)'; e.currentTarget.style.color = 'var(--danger-text)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
              aria-label="Delete card"
            ><Trash2 size={15} /></button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-subtle)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              aria-label="Close"
            ><X size={15} /></button>
          </div>
        </div>

        <div className="px-6 py-5">
          {/* Meta */}
          <div className="flex flex-wrap gap-4 mb-4 text-xs" style={{ color: 'var(--text-muted)' }}>
            {card.dueDate && (
              <div className="flex items-center gap-1.5" style={{ color: overdue ? 'var(--danger-text)' : undefined }}>
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
                <span>Last edited by {card.lastEditedBy}</span>
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
            <div
              className="mb-5 p-4 rounded-xl"
              style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}
            >
              <MarkdownRenderer content={card.description} />
            </div>
          ) : (
            <p className="text-sm italic mb-5" style={{ color: 'var(--text-muted)' }}>No description added.</p>
          )}

          {/* Comments */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
            <CommentThread cardId={card.id} />
          </div>
        </div>
      </div>
    </div>
  );
};
