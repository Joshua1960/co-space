import React, { useState, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { classNames } from '../../lib/utils';

interface TagInputProps {
  label?: string;
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  helperText?: string;
  suggestedTags?: string[];
}

const TAG_COLORS = [
  { bg: 'bg-blue-50 dark:bg-blue-950',     text: 'text-blue-700 dark:text-blue-300',     border: 'border-blue-200 dark:border-blue-800' },
  { bg: 'bg-emerald-50 dark:bg-emerald-950', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' },
  { bg: 'bg-amber-50 dark:bg-amber-950',   text: 'text-amber-700 dark:text-amber-300',   border: 'border-amber-200 dark:border-amber-800' },
  { bg: 'bg-purple-50 dark:bg-purple-950', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800' },
  { bg: 'bg-rose-50 dark:bg-rose-950',     text: 'text-rose-700 dark:text-rose-300',     border: 'border-rose-200 dark:border-rose-800' },
  { bg: 'bg-cyan-50 dark:bg-cyan-950',     text: 'text-cyan-700 dark:text-cyan-300',     border: 'border-cyan-200 dark:border-cyan-800' },
];

const getTagColor = (tag: string) => {
  const index = tag.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return TAG_COLORS[index % TAG_COLORS.length];
};

export const TagInput: React.FC<TagInputProps> = ({
  label, value, onChange, placeholder = 'Add a tag...', helperText, suggestedTags = [],
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = useCallback((tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !value.includes(trimmed)) onChange([...value, trimmed]);
    setInputValue('');
  }, [value, onChange]);

  const removeTag = useCallback((tagToRemove: string) => {
    onChange(value.filter((t) => t !== tagToRemove));
  }, [value, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(inputValue); }
    else if (e.key === 'Backspace' && !inputValue && value.length > 0) removeTag(value[value.length - 1]);
  }, [inputValue, value, addTag, removeTag]);

  const filteredSuggestions = suggestedTags.filter(
    (t) => !value.includes(t) && t.toLowerCase().includes(inputValue.toLowerCase()),
  );

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </label>
      )}
      <div
        className={classNames(
          'w-full min-h-10 px-3 py-2 rounded-xl border flex flex-wrap gap-2 items-center cursor-text transition-all',
          isFocused ? 'ring-2 ring-[var(--brand)]' : '',
        )}
        style={{
          background: 'var(--bg-surface)',
          borderColor: isFocused ? 'var(--brand)' : 'var(--border)',
        }}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag) => {
          const colors = getTagColor(tag);
          return (
            <span key={tag} className={classNames(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium border',
              colors.bg, colors.text, colors.border,
            )}>
              {tag}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
                className="hover:opacity-70"
                aria-label={`Remove ${tag}`}
              ><X size={11} /></button>
            </span>
          );
        })}
        <input
          ref={inputRef} type="text" value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => { setIsFocused(false); if (inputValue) addTag(inputValue); }}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 min-w-20 outline-none text-sm bg-transparent"
          style={{ color: 'var(--text-primary)' }}
        />
      </div>
      {isFocused && filteredSuggestions.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          <span className="text-xs mr-1" style={{ color: 'var(--text-muted)' }}>Suggested:</span>
          {filteredSuggestions.slice(0, 6).map((tag) => (
            <button
              key={tag} type="button" onClick={() => addTag(tag)}
              className="text-xs px-2 py-0.5 rounded-md transition-colors"
              style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}
            >+ {tag}</button>
          ))}
        </div>
      )}
      {helperText && <p className="mt-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>{helperText}</p>}
    </div>
  );
};

export const Tag: React.FC<{ label: string; onRemove?: () => void }> = ({ label, onRemove }) => {
  const colors = getTagColor(label);
  return (
    <span className={classNames(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium border',
      colors.bg, colors.text, colors.border,
    )}>
      {label}
      {onRemove && (
        <button onClick={onRemove} className="hover:opacity-70" aria-label={`Remove ${label}`}>
          <X size={11} />
        </button>
      )}
    </span>
  );
};
