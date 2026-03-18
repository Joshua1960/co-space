import React, { memo } from 'react';
import { Calendar, MoreVertical, Trash2, Columns, CreditCard } from 'lucide-react';
import type { Board } from '../../types';
import { formatRelativeDate } from '../../lib/utils';
import { Badge } from '../ui/Badge';

interface BoardCardProps {
  board: Board;
  onSelect: (boardId: string) => void;
  onDelete: (boardId: string) => void;
  columnCount: number;
  cardCount: number;
  index?: number;
  onDragStart?: (e: React.DragEvent, index: number) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}

export const BoardCard: React.FC<BoardCardProps> = memo(({
  board, onSelect, onDelete, columnCount, cardCount, index, onDragStart, onDragEnd,
}) => {
  const [showMenu, setShowMenu] = React.useState(false);

  return (
    <article
      draggable={!!onDragStart}
      onDragStart={(e) => { if (onDragStart && index !== undefined) onDragStart(e, index); }}
      onDragEnd={(e) => onDragEnd?.(e)}
      className="group relative rounded-2xl p-5 cursor-pointer"
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
      onClick={() => onSelect(board.id)}
      role="button" tabIndex={0}
      aria-label={`Open board ${board.title}`}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(board.id); } }}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-base font-semibold line-clamp-1 pr-8" style={{ color: 'var(--text-primary)' }}>
          {board.title}
        </h3>
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-subtle)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            aria-label="Board options"
          >
            <MoreVertical size={15} />
          </button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setShowMenu(false); }} />
              <div
                className="absolute right-0 top-full mt-1 z-20 w-36 rounded-xl py-1 overflow-hidden"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); setShowMenu(false); onDelete(board.id); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors"
                  style={{ color: 'var(--danger-text)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--danger-subtle)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <Trash2 size={13} /> Delete board
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <p className="text-sm line-clamp-2 mb-4 min-h-10" style={{ color: 'var(--text-muted)' }}>
        {board.description || 'No description'}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="default" size="sm">
            <Columns size={10} className="mr-1" />{columnCount}
          </Badge>
          <Badge variant="default" size="sm">
            <CreditCard size={10} className="mr-1" />{cardCount}
          </Badge>
        </div>
        <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
          <Calendar size={11} />
          <span>{formatRelativeDate(board.createdAt)}</span>
        </div>
      </div>
    </article>
  );
});

BoardCard.displayName = 'BoardCard';
