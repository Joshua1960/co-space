import React, { memo, useState, useCallback } from 'react';
import { Plus, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { CardComponent } from '../card/CardComponent';
import { EmptyState } from '../ui/EmptyState';
import { useColumnCards } from '../../lib/selectors';
import { useVirtualList } from '../../lib/useVirtualList';
import type { Card } from '../../types';

interface ColumnComponentProps {
  columnId: string;
  columnTitle: string;
  onCreateCard: (columnId: string) => void;
  onEditCard: (card: Card) => void;
  onDeleteCard: (cardId: string) => void;
  onOpenCardDetail: (card: Card) => void;
  onEditColumn: (columnId: string, title: string) => void;
  onDeleteColumn: (columnId: string) => void;
  onDragStart: (e: React.DragEvent, taskId: string, columnId: string, index: number) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent, columnId: string, index?: number) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, columnId: string, index: number) => void;
}

export const ColumnComponent: React.FC<ColumnComponentProps> = memo((
  { columnId, columnTitle, onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop,
    onCreateCard, onEditCard, onDeleteCard, onOpenCardDetail, onEditColumn, onDeleteColumn }
) => {
  const cards = useColumnCards(columnId);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(columnTitle);

  const { containerRef, visibleRange, topSpacerHeight, bottomSpacerHeight, shouldVirtualise } =
    useVirtualList(cards.length);

  const visibleCards = shouldVirtualise ? cards.slice(visibleRange.start, visibleRange.end) : cards;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
    onDragOver(e, columnId);
  };
  const handleDragLeave = (e: React.DragEvent) => { setIsDragOver(false); onDragLeave(e); };
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false); onDrop(e, columnId, cards.length); };
  const handleSaveEdit = useCallback(() => {
    if (editTitle.trim()) onEditColumn(columnId, editTitle.trim());
    setIsEditing(false);
  }, [editTitle, columnId, onEditColumn]);

  return (
    <section
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="w-full sm:shrink-0 sm:w-72 rounded-2xl p-3 flex flex-col"
      style={{
        background: isDragOver ? 'var(--bg-muted)' : 'var(--bg-subtle)',
        outline: isDragOver ? '2px solid var(--border-strong)' : 'none',
        transition: 'background 150ms',
      }}
    >
      {/* Header */}
      <header className="flex items-center justify-between mb-3 px-1 shrink-0">
        {isEditing ? (
          <input
            type="text" value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSaveEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveEdit();
              if (e.key === 'Escape') { setEditTitle(columnTitle); setIsEditing(false); }
            }}
            className="flex-1 px-2 py-1 text-sm font-semibold rounded-lg border focus:outline-none focus:ring-2"
            style={{
              background: 'var(--bg-surface)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
            }}
            autoFocus
          />
        ) : (
          <>
            <h3 className="font-semibold text-sm flex-1 truncate" style={{ color: 'var(--text-primary)' }}>
              {columnTitle}
            </h3>
            <span className="text-xs ml-2 tabular-nums px-1.5 py-0.5 rounded-md" style={{ color: 'var(--text-muted)', background: 'var(--bg-muted)' }}>
              {cards.length}
            </span>
          </>
        )}

        <div className="relative ml-2">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 rounded-md transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-muted)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            aria-label="Column options"
          >
            <MoreVertical size={14} />
          </button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div
                className="absolute right-0 top-full mt-1 z-20 w-32 rounded-xl py-1 overflow-hidden"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}
              >
                <button
                  onClick={() => { setShowMenu(false); setIsEditing(true); }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-subtle)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <Edit2 size={12} /> Rename
                </button>
                <button
                  onClick={() => { setShowMenu(false); onDeleteColumn(columnId); }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-colors"
                  style={{ color: 'var(--danger-text)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--danger-subtle)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Card list */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto min-h-[80px] sm:max-h-[calc(100vh-220px)] scrollbar-thin"
      >
        {shouldVirtualise && topSpacerHeight > 0 && (
          <div style={{ height: topSpacerHeight }} aria-hidden="true" />
        )}

        <div className="space-y-2 py-0.5">
          {cards.length === 0 && (
            <EmptyState
              icon={<Plus size={20} />}
              title="No cards yet"
              description="Add your first card to this column."
              action={{ label: 'Add card', onClick: () => onCreateCard(columnId) }}
            />
          )}
          {visibleCards.map((card, relIdx) => (
            <CardComponent
              key={card.id}
              cardId={card.id}
              index={shouldVirtualise ? visibleRange.start + relIdx : relIdx}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onEdit={onEditCard}
              onDelete={onDeleteCard}
              onOpenDetail={onOpenCardDetail}
            />
          ))}
        </div>

        {shouldVirtualise && bottomSpacerHeight > 0 && (
          <div style={{ height: bottomSpacerHeight }} aria-hidden="true" />
        )}
      </div>

      {/* Add card */}
      <button
        onClick={() => onCreateCard(columnId)}
        className="w-full flex items-center justify-center gap-1.5 py-2 mt-2 text-sm rounded-lg shrink-0 transition-colors"
        style={{ color: 'var(--text-muted)' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--bg-muted)';
          e.currentTarget.style.color = 'var(--text-primary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'var(--text-muted)';
        }}
        aria-label={`Add card to ${columnTitle}`}
      >
        <Plus size={14} />
        <span>Add card</span>
      </button>
    </section>
  );
});

ColumnComponent.displayName = 'ColumnComponent';
