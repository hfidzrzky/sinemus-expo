import React, { useState, useRef, KeyboardEvent, ChangeEvent } from 'react';
import { X } from 'lucide-react';

export interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const TagInput: React.FC<TagInputProps> = ({
  value = [],
  onChange,
  placeholder = 'Ketik nama lalu tekan Enter atau koma (,)...',
  className = '',
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = (tagToAdd: string) => {
    const trimmed = tagToAdd.trim();
    if (!trimmed) return;
    if (!value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
  };

  const removeTag = (indexToRemove: number) => {
    if (disabled) return;
    onChange(value.filter((_, idx) => idx !== indexToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
        setInputValue('');
      }
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      e.preventDefault();
      removeTag(value.length - 1);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;

    // Handle paste or rapid comma typing
    if (val.includes(',')) {
      const parts = val.split(',');
      const newTags: string[] = [];

      parts.forEach((part, idx) => {
        const trimmed = part.trim();
        // If it's the last item and the string didn't end with comma, keep in buffer
        if (idx === parts.length - 1 && !val.endsWith(',')) {
          setInputValue(part);
        } else if (trimmed && !value.includes(trimmed) && !newTags.includes(trimmed)) {
          newTags.push(trimmed);
        }
      });

      if (newTags.length > 0) {
        onChange([...value, ...newTags]);
      }
      if (val.endsWith(',')) {
        setInputValue('');
      }
    } else {
      setInputValue(val);
    }
  };

  const handleBlur = () => {
    if (inputValue.trim()) {
      addTag(inputValue);
      setInputValue('');
    }
  };

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      className={`flex min-h-[42px] cursor-text flex-wrap items-center gap-1.5 rounded-xl border border-neutral-800 bg-[#0D111A] px-3 py-2 text-xs transition-colors focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 ${
        disabled ? 'cursor-not-allowed opacity-60' : ''
      } ${className}`}
    >
      {value.map((tag, index) => (
        <span
          key={`${tag}-${index}`}
          className="inline-flex items-center gap-1 rounded-md border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-300 transition-colors"
        >
          {tag}
          {!disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(index);
              }}
              className="rounded p-0.5 text-blue-400 hover:bg-blue-500/20 hover:text-white focus:outline-none"
              title={`Hapus ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        disabled={disabled}
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={value.length === 0 ? placeholder : 'Tambah lagi...'}
        className="min-w-[140px] flex-1 bg-transparent text-xs text-white placeholder-neutral-500 outline-none"
      />
    </div>
  );
};
