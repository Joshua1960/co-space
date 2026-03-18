import React, { memo, useState } from 'react';
import { Calendar, Edit, Trash2, MoreVertical, MessageCircle } from 'lucide-react';
import { Tag } from '../ui/TagInput';
import { Badge } from '../ui/Badge';
import { formatDate, isOverdue, classNames } from '../../lib/utils';
import { MarkdownRenderer } from '../../lib/markdown';
import { useCard, useCardCommentCount } from '../../lib/selectors';
import type { Card } from '../../types';

interface CardComponentProps {
  cardId: string;
  index: number;
  onEdit: (card: Card) => void;
  onDelete: (cardId: string) => void;
  onOpenDetail: (card: Card) => void;
  onDragStart: (e: React.DragEvent, id: string, columnId: string, index: number) => void;
  onDragEnd: (e: React.DragEvent) => void;
}

export const CardComponent: React.FC<CardComponentProps> = memo(
  ({ cardId, index, onEdit, onDelete, onOpenDetail, onDragStart, onDragEnd }) => {
    const card = useCard(cardId);
    const totalCommentCount = useCardCommentCount(cardId);
    const [showMenu, setShowMenu] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    if (!card) return null;
    const overdue = isOverdue(card.dueDate);

    return (
      <article
        draggable
        onDragStart={(e) => onDragStart(e, card.id, card.columnId, index)}
        onDragEnd={onDragEnd}
        className="group rounded-xl p-4 cursor-grab active:cursor-grabbing"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
          transition: 'box-shadow 150ms, border-color 150ms',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-strong)';
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border)';
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        }}
        role="article"
        aria-label={`Card: ${card.title}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <h4
            className="font-medium text-sm line-clamp-2 flex-1 pr-2 cursor-pointer"
            style={{ color: 'var(--text-primary)' }}
            onClick={() => onOpenDetail(card)}
          >
            {card.title}
          </h4>
          <div className="relative shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
              className="p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: 'var(--text-muted)' }}
              aria-label="Card options"
            >
              <MoreVertical size={14} />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div
                  className="absolute right-0 top-full mt-1 z-20 w-40 rounded-xl py-1 overflow-hidden"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}
                >
                  {[
                    { label: 'View & Comment', icon: <MessageCircle size={12} />, action: () => { setShowMenu(false); onOpenDetail(card); }, danger: false },
                    { label: 'Edit',           icon: <Edit size={12} />,          action: () => { setShowMenu(false); onEdit(card); },       danger: false },
                    { label: 'Delete',         icon: <Trash2 size={12} />,        action: () => { setShowMenu(false); onDelete(card.id); },  danger: true  },
                  ].map(({ label, icon, action, danger }) => (
                    <button
                      key={label}
                      onClick={action}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-colors"
                      style={{ color: danger ? 'var(--danger-text)' : 'var(--text-primary)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = danger ? 'var(--danger-subtle)' : 'var(--bg-subtle)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {icon} {label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Description */}
        {card.description && (
          <div
            className={classNames('text-xs mb-3 cursor-pointer leading-relaxed', !isExpanded && 'line-clamp-2')}
            style={{ color: 'var(--text-secondary)' }}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded
              ? <MarkdownRenderer content={card.description} />
              : <>{card.description.replace(/[#*`]/g, '').substring(0, 100)}{card.description.length > 100 && '…'}</>
            }
          </div>
        )}

        {/* Tags */}
        {card.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {card.tags.slice(0, 3).map((tag) => <Tag key={tag} label={tag} />)}
            {card.tags.length > 3 && (
              <Badge variant="default" size="sm">+{card.tags.length - 3}</Badge>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          {card.dueDate ? (
            <div className="flex items-center gap-1.5 text-xs" style={{ color: overdue ? 'var(--danger-text)' : 'var(--text-muted)' }}>
              <Calendar size={11} />
              <span>{formatDate(card.dueDate)}</span>
              {overdue && <Badge variant="danger" size="sm">Overdue</Badge>}
            </div>
          ) : <div />}

          {totalCommentCount > 0 && (
            <button
              onClick={() => onOpenDetail(card)}
              className="flex items-center gap-1 text-xs transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              <MessageCircle size={11} />
              <span>{totalCommentCount}</span>
            </button>
          )}
        </div>

        {card.lastEditedBy && (
          <div className="mt-2 text-xs truncate" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
            v{card.version} · {card.lastEditedBy}
          </div>
        )}
      </article>
    );
  },
);

CardComponent.displayName = 'CardComponent';
