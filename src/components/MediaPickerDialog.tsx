import { useState, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Search, Upload } from 'lucide-react';
import { MediaItem, MediaType } from '@/types';
import { useMediaStore } from '@/stores/useMediaStore';
import * as wavespeed from '@/services/wavespeed';
import { useToast } from '@/hooks/use-toast';

interface MediaPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (mediaItem: MediaItem) => void;
  projectId: string;
}

export function MediaPickerDialog({ open, onOpenChange, onSelect, projectId }: MediaPickerDialogProps) {
  const { mediaItems, createUpload } = useMediaStore();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | MediaType>('all');
  const [isDragging, setIsDragging] = useState(false);

  // Filter media items
  const filteredMedia = useMemo(() => {
    let filtered = mediaItems;

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter((item) => item.type === filterType);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.prompt?.toLowerCase().includes(query) ||
          item.id.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [mediaItems, filterType, searchQuery]);

  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      if (!wavespeed.isValidImageFile(file)) {
        toast({
          title: 'Invalid file',
          description: `${file.name} is not a valid image file`,
          variant: 'destructive',
        });
        continue;
      }

      try {
        const base64 = await wavespeed.convertFileToBase64(file);
        await createUpload(projectId, base64);
        toast({
          title: 'Upload successful',
          description: `${file.name} has been uploaded`,
        });
        
        // Optionally auto-select the uploaded image
        // const newMedia = await createUpload(projectId, base64);
        // onSelect(newMedia);
        // onOpenChange(false);
      } catch (error) {
        toast({
          title: 'Upload failed',
          description: `Failed to upload ${file.name}`,
          variant: 'destructive',
        });
      }
    }
  }, [projectId, createUpload, toast]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const handleMediaClick = (item: MediaItem) => {
    onSelect(item);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] sm:max-w-5xl max-h-[95vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select or Upload Media</DialogTitle>
        </DialogHeader>

        <div className="flex gap-4 flex-1 min-h-0 overflow-hidden">
          {/* Left: Media Browser */}
          <div className="flex-1 flex flex-col border-r border-gray-700 pr-4 min-w-0">
            <div className="flex gap-2 mb-2">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Search media..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              
              {/* Filter */}
              <Select value={filterType} onValueChange={(v) => setFilterType(v as typeof filterType)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Media</SelectItem>
                  <SelectItem value="generation">Generations</SelectItem>
                  <SelectItem value="upload">Uploads</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Media Grid */}
            <div className="flex-1 overflow-y-auto">
              {filteredMedia.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                  {searchQuery ? 'No media found' : 'No media yet'}
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {filteredMedia.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleMediaClick(item)}
                      className="relative aspect-square cursor-pointer group"
                    >
                      <img
                        src={item.imageData}
                        alt={item.prompt || 'Media item'}
                        className="w-full h-full object-cover rounded border border-gray-700 group-hover:border-blue-500 transition-colors"
                      />
                      {/* Type badge */}
                      <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded text-xs bg-black/70 text-white">
                        {item.type === 'generation' ? 'Gen' : 'Upload'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Upload Zone */}
          <div className="w-80 flex flex-col flex-shrink-0">
            <h3 className="text-sm font-medium mb-2">Upload New Media</h3>
            
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`flex-1 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors ${
                isDragging
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <Upload className="h-12 w-12 text-gray-500 mb-4" />
              <p className="text-sm text-gray-400 mb-2">Drag and drop images here</p>
              <p className="text-xs text-gray-500 mb-4">or</p>
              <label className="cursor-pointer px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm transition-colors">
                Choose Files
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files)}
                />
              </label>
              <p className="text-xs text-gray-500 mt-4">Supports: JPEG, PNG, WebP</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

