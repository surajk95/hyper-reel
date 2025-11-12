import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
} from './ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight, Download, Trash2, ImagePlus, RotateCcw, Copy, Check } from 'lucide-react';
import { MediaItem, getModelDisplayName } from '@/types';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useMediaStore } from '@/stores/useMediaStore';
import { useToast } from '@/hooks/use-toast';
import { TagsSection } from './TagsSection';

interface FullscreenViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mediaItem: MediaItem;
  allMedia?: MediaItem[]; // List of all filtered media for navigation
  onUse?: (mediaItem: MediaItem) => void;
  onRetry?: (mediaItem: MediaItem) => void;
  onSearchById?: (id: string) => void;
  onNavigate?: (mediaItem: MediaItem) => void; // Called when navigating to a different item
}

export function FullscreenViewer({ open, onOpenChange, mediaItem, allMedia = [], onUse, onRetry, onSearchById, onNavigate }: FullscreenViewerProps) {
  const { getSidebarCollapsed, setSidebarCollapsed } = useSettingsStore();
  const { deleteMedia, getMediaById, updateMedia } = useMediaStore();
  const { toast } = useToast();
  
  const [sidebarCollapsed, setSidebarCollapsedLocal] = useState(getSidebarCollapsed());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Get the latest version of the media item from the store to reflect updates
  const currentMediaItem = getMediaById(mediaItem.id) || mediaItem;

  // Find current index in the filtered media list
  const currentIndex = allMedia.findIndex(item => item.id === currentMediaItem.id);
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < allMedia.length - 1;

  useEffect(() => {
    setSidebarCollapsedLocal(getSidebarCollapsed());
  }, [getSidebarCollapsed]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && hasPrevious) {
        handlePrevious();
      } else if (e.key === 'ArrowRight' && hasNext) {
        handleNext();
      } else if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, hasPrevious, hasNext, currentIndex, allMedia]);

  const handlePrevious = () => {
    if (hasPrevious && currentIndex > 0) {
      const previousItem = allMedia[currentIndex - 1];
      if (onNavigate) {
        onNavigate(previousItem);
      }
    }
  };

  const handleNext = () => {
    if (hasNext && currentIndex < allMedia.length - 1) {
      const nextItem = allMedia[currentIndex + 1];
      if (onNavigate) {
        onNavigate(nextItem);
      }
    }
  };

  const toggleSidebar = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsedLocal(newState);
    setSidebarCollapsed(newState);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = currentMediaItem.imageData;
    link.download = `${currentMediaItem.id}.${currentMediaItem.outputFormat || 'jpeg'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: 'Download Started',
      description: 'Image is being downloaded',
    });
  };

  const handleDelete = async () => {
    const success = await deleteMedia(currentMediaItem.id);
    if (success) {
      toast({
        title: 'Media Deleted',
        description: 'The media item has been removed',
      });
      onOpenChange(false);
    }
  };

  const handleUse = () => {
    if (onUse) {
      onUse(currentMediaItem);
      onOpenChange(false);
    }
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry(currentMediaItem);
      onOpenChange(false);
    }
  };

  const handleCopyPrompt = async () => {
    if (currentMediaItem.prompt) {
      try {
        await navigator.clipboard.writeText(currentMediaItem.prompt);
        setCopiedPrompt(true);
        toast({
          title: 'Copied',
          description: 'Prompt copied to clipboard',
        });
        setTimeout(() => setCopiedPrompt(false), 2000);
      } catch (error) {
        toast({
          title: 'Failed to copy',
          description: 'Could not copy prompt to clipboard',
          variant: 'destructive',
        });
      }
    }
  };

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(currentMediaItem.id);
      setCopiedId(true);
      toast({
        title: 'Copied',
        description: 'ID copied to clipboard',
      });
      setTimeout(() => setCopiedId(false), 2000);
    } catch (error) {
      toast({
        title: 'Failed to copy',
        description: 'Could not copy ID to clipboard',
        variant: 'destructive',
      });
    }
  };

  const handleInputImageClick = (id: string) => {
    if (onSearchById) {
      onSearchById(id);
    }
  };

  const handleTagsChange = async (newTags: string[]) => {
    await updateMedia(currentMediaItem.id, { tags: newTags });
    toast({
      title: 'Tags Updated',
      description: 'Tags have been saved',
    });
  };

  // Get input images if available
  const inputMediaItems = currentMediaItem.inputImageIds
    ?.map((id) => getMediaById(id))
    .filter((item): item is MediaItem => item !== undefined) || [];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] h-[95vh] p-0 bg-black">
          <div className="flex h-full w-full max-h-[90vh]">
            {/* Left: Image Display */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
              <div className="relative max-h-full">
                <img
                  src={currentMediaItem.imageData}
                  alt={currentMediaItem.prompt || 'Media item'}
                  className="max-w-[70vw] max-h-full object-contain"
                />
                
                {/* Tags Overlay - Show for uploads or when sidebar is collapsed */}
                {(currentMediaItem.type === 'upload' || (currentMediaItem.type === 'generation' && sidebarCollapsed)) && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-4 pt-8">
                    <TagsSection
                      tags={currentMediaItem.tags || []}
                      onTagsChange={handleTagsChange}
                    />
                  </div>
                )}
              </div>
              
              {/* Action Buttons Row - Show for all media types when sidebar is collapsed or for uploads */}
              {(currentMediaItem.type === 'upload' || (currentMediaItem.type === 'generation' && sidebarCollapsed)) && (
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={handleUse}
                    variant="secondary"
                    size="sm"
                  >
                    <ImagePlus className="h-4 w-4 mr-2" />
                    Use as Input
                  </Button>
                  
                  {currentMediaItem.type === 'generation' && (
                    <Button
                      onClick={handleRetry}
                      variant="secondary"
                      size="sm"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Retry
                    </Button>
                  )}
                  
                  <Button
                    onClick={handleDownload}
                    variant="secondary"
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  
                  <Button
                    onClick={() => setShowDeleteConfirm(true)}
                    variant="destructive"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              )}
              
              {/* Navigation Arrows */}
              {hasPrevious && (
                <button
                  onClick={handlePrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                  title="Previous (←)"
                >
                  <ChevronLeft className="h-6 w-6 text-white" />
                </button>
              )}
              
              {hasNext && (
                <button
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                  title="Next (→)"
                >
                  <ChevronRight className="h-6 w-6 text-white" />
                </button>
              )}

              {/* Counter Badge */}
              {allMedia.length > 0 && currentIndex >= 0 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/50 text-white text-sm">
                  {currentIndex + 1} / {allMedia.length}
                </div>
              )}
              
              {/* Sidebar toggle - Only show for generations */}
              {currentMediaItem.type === 'generation' && (
                <button
                  onClick={toggleSidebar}
                  className={`absolute top-4 ${sidebarCollapsed ? 'right-16' : 'right-4'} p-2 rounded-full bg-white/30 hover:bg-white/50 transition-colors`}
                >
                  {sidebarCollapsed ? (
                    <ChevronLeft className="h-5 w-5 text-white" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-white" />
                  )}
                </button>
              )}
            </div>

            {/* Right: Info Sidebar - Only show for generations */}
            {currentMediaItem.type === 'generation' && !sidebarCollapsed && (
              <div className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col max-h-full overflow-y-auto mb-[50px]">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Type Badge */}
                  <div>
                    <span className="inline-block px-2 py-1 rounded text-xs bg-blue-600 text-white">
                      {currentMediaItem.type === 'generation' ? 'Generation' : 'Upload'}
                    </span>
                  </div>

                  {/* Tags Section */}
                  <TagsSection
                    tags={currentMediaItem.tags || []}
                    onTagsChange={handleTagsChange}
                  />

                  {/* Prompt */}
                  {currentMediaItem.prompt && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-400">Prompt</h3>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleCopyPrompt}
                          className="h-6 w-6"
                          title="Copy prompt"
                        >
                          {copiedPrompt ? (
                            <Check className="h-3 w-3 text-green-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                      <div className="max-h-[100px] overflow-y-auto text-sm text-white">
                        {currentMediaItem.prompt}
                      </div>
                    </div>
                  )}

                  {/* Model */}
                  {currentMediaItem.modelId && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-400 mb-2">Model</h3>
                      <p className="text-sm text-white">{getModelDisplayName(currentMediaItem.modelId)}</p>
                    </div>
                  )}

                  {/* Input Images */}
                  {inputMediaItems.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-400 mb-2">Input Images</h3>
                      <div className="grid grid-cols-3 gap-2">
                        {inputMediaItems.map((item) => (
                          <img
                            key={item.id}
                            src={item.imageData}
                            alt={item.prompt || 'Input'}
                            onClick={() => handleInputImageClick(item.id)}
                            className="w-full aspect-square object-cover rounded border border-gray-700 cursor-pointer hover:border-blue-500 transition-colors"
                            title="Click to search for this image"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Settings */}
                  {currentMediaItem.type === 'generation' && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-400 mb-2">Settings</h3>
                      <div className="space-y-1 text-sm text-gray-300">
                        {currentMediaItem.size && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Size:</span>
                            <span>{currentMediaItem.size}</span>
                          </div>
                        )}
                        {currentMediaItem.seed !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Seed:</span>
                            <span>{currentMediaItem.seed}</span>
                          </div>
                        )}
                        {currentMediaItem.outputFormat && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Format:</span>
                            <span>{currentMediaItem.outputFormat.toUpperCase()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Metadata */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-2">Metadata</h3>
                    <div className="space-y-1 text-sm text-gray-300">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">ID:</span>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-mono">{currentMediaItem.id.slice(0, 12)}...</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleCopyId}
                            className="h-5 w-5"
                            title="Copy full ID"
                          >
                            {copiedId ? (
                              <Check className="h-3 w-3 text-green-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Created:</span>
                        <span>{new Date(currentMediaItem.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="p-4 border-t border-gray-800 space-y-2">
                  <Button
                    onClick={handleUse}
                    className="w-full"
                    variant="secondary"
                  >
                    <ImagePlus className="h-4 w-4 mr-2" />
                    Use as Input
                  </Button>
                  
                  {currentMediaItem.type === 'generation' && (
                    <Button
                      onClick={handleRetry}
                      className="w-full"
                      variant="secondary"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Retry Generation
                    </Button>
                  )}
                  
                  <Button
                    onClick={handleDownload}
                    className="w-full"
                    variant="secondary"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  
                  <Button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full"
                    variant="destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Media?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this media item? This action cannot be undone.
              {currentMediaItem.inputImageIds && currentMediaItem.inputImageIds.length > 0 && (
                <span className="block mt-2 text-yellow-500">
                  Note: References to this image in other media will be removed.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

