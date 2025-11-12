import { useState, useRef, useEffect } from 'react';
import { X, Check } from 'lucide-react';

interface TagInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  onCancel: () => void;
}

const SUGGESTED_TAGS = ['prop', 'background', 'scene', 'style', 'mood'];

export function TagInput({ tags, onTagsChange, onCancel }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus input on mount
    inputRef.current?.focus();
  }, []);

  // Filter suggestions based on input and exclude already added tags
  const filteredSuggestions = SUGGESTED_TAGS.filter(
    (tag) =>
      tag.toLowerCase().includes(inputValue.toLowerCase()) &&
      !tags.includes(tag)
  );

  const handleAddTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      onTagsChange([...tags, trimmedTag]);
      setInputValue('');
      setShowSuggestions(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.trim()) {
        handleAddTag(inputValue);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  const handleSuggestionClick = (tag: string) => {
    handleAddTag(tag);
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => {
              // Delay to allow clicking on suggestions
              setTimeout(() => setShowSuggestions(false), 200);
            }}
            placeholder="Type a tag..."
            className="w-full px-3 py-1.5 bg-gray-800 border border-gray-600 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          
          {/* Suggestions dropdown */}
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded shadow-lg z-10 max-h-40 overflow-y-auto">
              {filteredSuggestions.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleSuggestionClick(tag)}
                  className="w-full text-left px-3 py-2 text-sm text-white hover:bg-gray-700 transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <button
          onClick={() => inputValue.trim() && handleAddTag(inputValue)}
          className="p-1.5 rounded bg-green-600 hover:bg-green-700 transition-colors"
          title="Add tag (Enter)"
          type="button"
        >
          <Check className="h-4 w-4 text-white" />
        </button>
        
        <button
          onClick={onCancel}
          className="p-1.5 rounded bg-gray-700 hover:bg-gray-600 transition-colors"
          title="Cancel (Esc)"
          type="button"
        >
          <X className="h-4 w-4 text-white" />
        </button>
      </div>
    </div>
  );
}

