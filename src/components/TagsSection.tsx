import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { TagInput } from './TagInput';

interface TagsSectionProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
}

export function TagsSection({ tags, onTagsChange }: TagsSectionProps) {
  const [isAdding, setIsAdding] = useState(false);

  const handleRemoveTag = (tagToRemove: string) => {
    onTagsChange(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleAddTags = (newTags: string[]) => {
    onTagsChange(newTags);
    setIsAdding(false);
  };

  return (
    <div>
      <h3 className="text-sm font-medium text-gray-400 mb-2">Tags</h3>
      <div className="space-y-2">
        {/* ADD TAG button or Tag input - always first */}
        <div className="flex flex-wrap gap-2">
          {!isAdding ? (
            <button
              onClick={() => setIsAdding(true)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 transition-colors text-xs text-white"
            >
              <Plus className="h-3 w-3" />
              ADD TAG
            </button>
          ) : (
            <div className="w-full">
              <TagInput
                tags={tags}
                onTagsChange={handleAddTags}
                onCancel={() => setIsAdding(false)}
              />
            </div>
          )}
        </div>

        {/* Existing tags - always show */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <div
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-700 text-xs text-white group"
              >
                <span>{tag}</span>
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400"
                  title="Remove tag"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Empty state message */}
        {!isAdding && tags.length === 0 && (
          <span className="text-xs text-gray-500 italic">No tags added yet</span>
        )}
      </div>
    </div>
  );
}

