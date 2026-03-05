import React, { memo, useState } from 'react';
import { Calendar, Edit, Trash2, MoreVertical } from 'lucide-react';
import type { Card } from '../../types';
import { Tag } from '../ui/TagInput';
import { formatDate, isOverdue, classNames } from '../../lib/utils';
import { MarkdownRenderer } from '../../lib/markdown';

interface CardComponentProps {
  card: Card;
  onEdit: (card: Card) => void;
  onDelete: (cardId: string) => void;
}

export const CardComponent: React.FC<CardComponentProps> = memo(({
  card,
  onEdit,
  onDelete,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const overdue = isOverdue(card.dueDate);
  
  return (
    <article
      className="group bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 hover:shadow-md transition-all duration-200"
      role="article"
      aria-label={`Card: ${card.title}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-slate-900 text-sm line-clamp-2 flex-1 pr-2">
          {card.title}
        </h4>
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-all"
            aria-label="Card options"
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
                    onEdit(card);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Edit size={12} />
                  Edit
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDelete(card.id);
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
      </div>
      
      {/* Description (collapsible) */}
      {card.description && (
        <div
          className={classNames(
            'text-xs text-slate-600 mb-3 cursor-pointer',
            !isExpanded && 'line-clamp-2'
          )}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <MarkdownRenderer content={card.description} />
          ) : (
            <div className="line-clamp-2">
              {card.description.replace(/[#*`]/g, '').substring(0, 100)}
              {card.description.length > 100 && '...'}
            </div>
          )}
        </div>
      )}
      
      {/* Tags */}
      {card.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {card.tags.slice(0, 3).map(tag => (
            <Tag key={tag} label={tag} />
          ))}
          {card.tags.length > 3 && (
            <span className="text-xs text-slate-400 px-1.5 py-0.5">
              +{card.tags.length - 3}
            </span>
          )}
        </div>
      )}
      
      {/* Footer */}
      {card.dueDate && (
        <div
          className={classNames(
            'flex items-center gap-1.5 text-xs',
            overdue ? 'text-red-600' : 'text-slate-400'
          )}
        >
          <Calendar size={12} />
          <span>{formatDate(card.dueDate)}</span>
          {overdue && <span className="font-medium">(Overdue)</span>}
        </div>
      )}
    </article>
  );
});

CardComponent.displayName = 'CardComponent';
