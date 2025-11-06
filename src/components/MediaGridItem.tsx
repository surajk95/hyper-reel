import { useState } from 'react';
import { Eye, ImagePlus, RotateCcw, Download, Trash2, MoreVertical } from 'lucide-react';
import { MediaItem } from '@/types';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';

interface MediaGridItemProps {
  mediaItem: MediaItem;
  onView: (item: MediaItem) => void;
  onUse: (item: MediaItem) => void;
  onRetry: (item: MediaItem) => void;
  onDownload: (item: MediaItem) => void;
  onDelete: (item: MediaItem) => void;
}

export function MediaGridItem({
  mediaItem,
  onView,
  onUse,
  onRetry,
  onDownload,
  onDelete,
}: MediaGridItemProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative aspect-square group">
      {/* Image */}
      <img
        src={mediaItem.imageData}
        alt={mediaItem.prompt || 'Media item'}
        onClick={() => onView(mediaItem)}
        className="w-full h-full object-cover rounded border border-gray-700 group-hover:border-gray-500 transition-colors cursor-pointer"
      />

      {/* Type Badge - Top Left - Always visible */}
      <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-xs bg-black/70 text-white">
        {mediaItem.type === 'generation' ? 'Gen' : 'Upload'}
      </div>

      {/* Actions Menu - Top Right */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              className="p-1.5 rounded-full bg-black/70 hover:bg-black/90 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4 text-white" />
            </button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-48 p-1 bg-gray-900/95 border-gray-700" 
            align="end"
            side="bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-1">
              {/* View */}
              <button
                onClick={() => {
                  onView(mediaItem);
                  setOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-800 rounded transition-colors text-left w-full"
              >
                <Eye className="h-4 w-4 text-white flex-shrink-0" />
                <span className="text-sm text-white">View</span>
              </button>

              {/* Use */}
              <button
                onClick={() => {
                  onUse(mediaItem);
                  setOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-800 rounded transition-colors text-left w-full"
              >
                <ImagePlus className="h-4 w-4 text-white flex-shrink-0" />
                <span className="text-sm text-white">Use as Input</span>
              </button>

              {/* Retry - Only for generations */}
              {mediaItem.type === 'generation' && (
                <button
                  onClick={() => {
                    onRetry(mediaItem);
                    setOpen(false);
                  }}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-gray-800 rounded transition-colors text-left w-full"
                >
                  <RotateCcw className="h-4 w-4 text-white flex-shrink-0" />
                  <span className="text-sm text-white">Retry</span>
                </button>
              )}

              {/* Download */}
              <button
                onClick={() => {
                  onDownload(mediaItem);
                  setOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-800 rounded transition-colors text-left w-full"
              >
                <Download className="h-4 w-4 text-white flex-shrink-0" />
                <span className="text-sm text-white">Download</span>
              </button>

              {/* Delete */}
              <button
                onClick={() => {
                  onDelete(mediaItem);
                  setOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-800 rounded transition-colors text-left w-full"
              >
                <Trash2 className="h-4 w-4 text-white flex-shrink-0" />
                <span className="text-sm text-white">Delete</span>
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

