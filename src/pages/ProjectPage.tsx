import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { Header } from '@/components/Header';
import { MediaGridItem } from '@/components/MediaGridItem';
import { GenerationDialog } from '@/components/GenerationDialog';
import { FullscreenViewer } from '@/components/FullscreenViewer';
import { SettingsDialog } from '@/components/SettingsDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Plus } from 'lucide-react';
import { useProjectsStore } from '@/stores/useProjectsStore';
import { useMediaStore } from '@/stores/useMediaStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useToast } from '@/hooks/use-toast';
import { MediaItem, MediaType } from '@/types';

export function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { projects, loadProjects, updateProject } = useProjectsStore();
  const { mediaItems, loadMediaByProject, deleteMedia } = useMediaStore();
  const { loadSettings } = useSettingsStore();
  const { toast } = useToast();

  const [showGenerationDialog, setShowGenerationDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showViewerDialog, setShowViewerDialog] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [filterType, setFilterType] = useState<'all' | MediaType>(() => {
    const saved = localStorage.getItem('hyper-reel-filter-type');
    return (saved as 'all' | MediaType) || 'generation';
  });
  const [gridColumns, setGridColumns] = useState(() => {
    const saved = localStorage.getItem('hyper-reel-grid-columns');
    return saved ? parseInt(saved) : 4;
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [mediaToDelete, setMediaToDelete] = useState<MediaItem | null>(null);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Generation dialog state
  const [genDialogPrompt, setGenDialogPrompt] = useState('');
  const [genDialogInputImages, setGenDialogInputImages] = useState<string[]>([]);
  const [genDialogModelId, setGenDialogModelId] = useState('wan-2.2');
  const [genDialogSize, setGenDialogSize] = useState('1536*1536');
  const [genDialogSeed, setGenDialogSeed] = useState(-1);
  const [genDialogOutputFormat, setGenDialogOutputFormat] = useState<'jpeg' | 'png' | 'webp'>('jpeg');

  const project = projects.find((p) => p.id === projectId);

  useEffect(() => {
    loadProjects();
    loadSettings();
    if (projectId) {
      loadMediaByProject(projectId);
    }
  }, [projectId, loadProjects, loadMediaByProject, loadSettings]);

  // Save filter type to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('hyper-reel-filter-type', filterType);
  }, [filterType]);

  // Save grid columns to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('hyper-reel-grid-columns', gridColumns.toString());
  }, [gridColumns]);

  // Filter media items
  const filteredMedia = useMemo(() => {
    let filtered = mediaItems;

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter((item) => item.type === filterType);
    }

    // Filter by search query (prompt or ID)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((item) => 
        item.prompt?.toLowerCase().includes(query) || 
        item.id.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [mediaItems, filterType, searchQuery]);

  const handleView = (item: MediaItem) => {
    setSelectedMedia(item);
    setShowViewerDialog(true);
  };

  const handleSearchById = (id: string) => {
    setSearchQuery(id);
    setShowViewerDialog(false);
  };

  const handleUse = (item: MediaItem) => {
    // Open generation dialog with this image as input
    setGenDialogPrompt('');
    setGenDialogInputImages([item.id]);
    setGenDialogModelId('qwen-edit'); // Switch to image-to-image model
    setGenDialogSize('1536*1536');
    setGenDialogSeed(-1);
    setGenDialogOutputFormat('jpeg');
    setShowGenerationDialog(true);
  };

  const handleRetry = (item: MediaItem) => {
    // Open generation dialog with all settings from this generation
    setGenDialogPrompt(item.prompt || '');
    setGenDialogInputImages(item.inputImageIds || []);
    setGenDialogModelId(item.modelId || 'wan-2.2');
    setGenDialogSize(item.size || '1536*1536');
    setGenDialogSeed(item.seed || -1);
    setGenDialogOutputFormat(item.outputFormat || 'jpeg');
    setShowGenerationDialog(true);
  };

  const handleDownload = (item: MediaItem) => {
    const link = document.createElement('a');
    link.href = item.imageData;
    link.download = `${item.id}.${item.outputFormat || 'jpeg'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: 'Download Started',
      description: 'Image is being downloaded',
    });
  };

  const handleDeleteRequest = (item: MediaItem) => {
    setMediaToDelete(item);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!mediaToDelete) return;
    
    const success = await deleteMedia(mediaToDelete.id);
    if (success) {
      toast({
        title: 'Media Deleted',
        description: 'The media item has been removed',
      });
    }
    setShowDeleteConfirm(false);
    setMediaToDelete(null);
  };

  const handleNewGeneration = () => {
    // Reset generation dialog to defaults
    setGenDialogPrompt('');
    setGenDialogInputImages([]);
    setGenDialogModelId('wan-2.2');
    setGenDialogSize('1536*1536');
    setGenDialogSeed(-1);
    setGenDialogOutputFormat('jpeg');
    setShowGenerationDialog(true);
  };

  const handleGenerationDialogClose = () => {
    setShowGenerationDialog(false);
    // Reload media after generation
    if (projectId) {
      loadMediaByProject(projectId);
    }
  };

  const handleRenameProject = () => {
    setNewProjectTitle(project?.title || '');
    setShowRenameDialog(true);
  };

  const handleSaveRename = async () => {
    if (newProjectTitle.trim() && projectId) {
      await updateProject(projectId, { title: newProjectTitle.trim() });
      setShowRenameDialog(false);
      await loadProjects();
    }
  };

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Project not found</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <Header
        title={project.title}
        showBack
        showEditTitle
        onEditTitle={handleRenameProject}
        onSettingsClick={() => setShowSettingsDialog(true)}
      />

      {/* Filter Bar */}
      <div className="border-b border-gray-800 px-6 py-3 flex items-center gap-4">
        {/* Search - Left aligned */}
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            type="text"
            placeholder="Search by prompt or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              title="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Spacer to push everything else to the right */}
        <div className="flex-1" />

        {/* Grid Size Slider - Right aligned */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Columns:</span>
          <div className="w-24">
            <Slider
              value={[gridColumns]}
              onValueChange={(values) => setGridColumns(values[0])}
              min={4}
              max={12}
              step={1}
            />
          </div>
          <span className="text-xs text-gray-500 w-6">{gridColumns}</span>
        </div>

        {/* Filter - Right aligned */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Filter:</span>
          <Select value={filterType} onValueChange={(v) => setFilterType(v as typeof filterType)}>
            <SelectTrigger className="w-32 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Media</SelectItem>
              <SelectItem value="generation">Generations</SelectItem>
              <SelectItem value="upload">Uploads</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Count - Right aligned */}
        <div className="text-xs text-gray-400">
          {filteredMedia.length} item{filteredMedia.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Media Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredMedia.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <p className="text-lg mb-2">No media yet</p>
            <p className="text-sm">Click the + button to generate your first image</p>
          </div>
        ) : (
          <div
            className="grid gap-3"
            style={{
              gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,
            }}
          >
            {filteredMedia.map((item) => (
              <MediaGridItem
                key={item.id}
                mediaItem={item}
                onView={handleView}
                onUse={handleUse}
                onRetry={handleRetry}
                onDownload={handleDownload}
                onDelete={handleDeleteRequest}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <div className="absolute bottom-8 right-8">
        <Button
          size="lg"
          onClick={handleNewGeneration}
          className="shadow-lg rounded-full h-14 w-14 p-0"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      {/* Dialogs */}
      <GenerationDialog
        open={showGenerationDialog}
        onOpenChange={handleGenerationDialogClose}
        projectId={projectId!}
        initialPrompt={genDialogPrompt}
        initialInputImages={genDialogInputImages}
        initialModelId={genDialogModelId}
        initialSize={genDialogSize}
        initialSeed={genDialogSeed}
        initialOutputFormat={genDialogOutputFormat}
      />

      {selectedMedia && (
        <FullscreenViewer
          open={showViewerDialog}
          onOpenChange={setShowViewerDialog}
          mediaItem={selectedMedia}
          onUse={handleUse}
          onRetry={handleRetry}
          onSearchById={handleSearchById}
        />
      )}

      <SettingsDialog
        open={showSettingsDialog}
        onOpenChange={setShowSettingsDialog}
      />

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Media?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this media item? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Project</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <Input
              placeholder="Project title"
              value={newProjectTitle}
              onChange={(e) => setNewProjectTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveRename()}
              autoFocus
            />
          </div>
          
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowRenameDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRename} disabled={!newProjectTitle.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

