import React, { useState, useRef, useCallback } from "react";
import { X } from "lucide-react";
import { classNames } from "../../lib/utils";

interface TagInputProps {
  label?: string;
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  helperText?: string;
  suggestedTags?: string[];
}

const TAG_COLORS = [
  { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
  { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200" },
];

const getTagColor = (tag: string) => {
  const index = tag
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return TAG_COLORS[index % TAG_COLORS.length];
};

export const TagInput: React.FC<TagInputProps> = ({
  label,
  value,
  onChange,
  placeholder = "Add a tag...",
  helperText,
  suggestedTags = [],
}) => {
  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = useCallback(
    (tag: string) => {
      const trimmed = tag.trim();
      if (trimmed && !value.includes(trimmed)) {
        onChange([...value, trimmed]);
      }
      setInputValue("");
    },
    [value, onChange],
  );

  const removeTag = useCallback(
    (tagToRemove: string) => {
      onChange(value.filter((tag) => tag !== tagToRemove));
    },
    [value, onChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        addTag(inputValue);
      } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
        removeTag(value[value.length - 1]);
      }
    },
    [inputValue, value, addTag, removeTag],
  );

  const filteredSuggestions = suggestedTags.filter(
    (tag) =>
      !value.includes(tag) &&
      tag.toLowerCase().includes(inputValue.toLowerCase()),
  );

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          {label}
        </label>
      )}
      <div
        className={classNames(
          "w-full min-h-10.5 px-3 py-2 rounded-xl border bg-white transition-all duration-200",
          "flex flex-wrap gap-2 items-center cursor-text",
          isFocused
            ? "border-slate-900 ring-2 ring-slate-900 ring-opacity-20"
            : "border-slate-200 hover:border-slate-300",
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag) => {
          const colors = getTagColor(tag);
          return (
            <span
              key={tag}
              className={classNames(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium border",
                colors.bg,
                colors.text,
                colors.border,
              )}
            >
              {tag}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(tag);
                }}
                className="hover:opacity-70 transition-opacity"
                aria-label={`Remove tag ${tag}`}
              >
                <X size={12} />
              </button>
            </span>
          );
        })}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            if (inputValue) addTag(inputValue);
          }}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 min-w-30 outline-none text-sm text-slate-900 placeholder-slate-400 bg-transparent"
        />
      </div>

      {/* Suggestions */}
      {isFocused && filteredSuggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          <span className="text-xs text-slate-500 mr-1">Suggested:</span>
          {filteredSuggestions.slice(0, 5).map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => addTag(tag)}
              className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
            >
              + {tag}
            </button>
          ))}
        </div>
      )}

      {helperText && (
        <p className="mt-1.5 text-sm text-slate-500">{helperText}</p>
      )}
    </div>
  );
};

// Tag display component (read-only)
export const Tag: React.FC<{ label: string; onRemove?: () => void }> = ({
  label,
  onRemove,
}) => {
  const colors = getTagColor(label);
  return (
    <span
      className={classNames(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium border",
        colors.bg,
        colors.text,
        colors.border,
      )}
    >
      {label}
      {onRemove && (
        <button
          onClick={onRemove}
          className="hover:opacity-70 transition-opacity"
          aria-label={`Remove tag ${label}`}
        >
          <X size={12} />
        </button>
      )}
    </span>
  );
};
