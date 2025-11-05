import { useState, useMemo } from 'react';
import { Input } from './ui/input';
import { FullscreenImage } from './FullscreenImage';
import { Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { GenerationResult, Scene, SceneImage } from '@/types';

interface MediaBrowserProps {
  allResults: GenerationResult[];
  scenes: Scene[];
  sceneImages: SceneImage[];
  onDragStart?: (result: GenerationResult, outputIndex: number) => void;
}

export function MediaBrowser({ allResults, scenes, sceneImages, onDragStart }: MediaBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSceneId, setSelectedSceneId] = useState<string>('all');

  // Flatten all results to individual images with their prompts
  const allImages = useMemo(() => {
    const images: Array<{ src: string; prompt: string; result: GenerationResult; outputIndex: number }> = [];
    allResults.forEach(result => {
      result.outputs.forEach((output, index) => {
        images.push({
          src: output,
          prompt: result.prompt,
          result,
          outputIndex: index,
        });
      });
    });
    return images;
  }, [allResults]);

  // Filter images based on scene selection and search query
  const filteredImages = useMemo(() => {
    let filtered = allImages;

    // Filter by scene if a specific scene is selected
    if (selectedSceneId !== 'all') {
      // Get all image IDs that belong to this scene
      const sceneImageIds = sceneImages
        .filter(img => img.sceneId === selectedSceneId)
        .map(img => img.id);
      
      filtered = filtered.filter(img => 
        sceneImageIds.includes(img.result.imageId)
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(img => 
        img.prompt.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [allImages, searchQuery, selectedSceneId, sceneImages]);

  const handleDragStart = (img: typeof allImages[0]) => {
    if (onDragStart) {
      onDragStart(img.result, img.outputIndex);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 border-t border-gray-700">
      {/* Header with filters and search - all in one row */}
      <div className="px-3 py-2 border-b border-gray-700">
        <div className="flex items-center gap-2">
          {/* Search bar - left aligned, max 200px */}
          <div className="relative w-[200px]">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-500" />
            <Input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-7 h-8 text-sm"
            />
          </div>
          
          {/* Spacer */}
          <div className="flex-1" />
          
          {/* Scene filter - right aligned */}
          <Select value={selectedSceneId} onValueChange={setSelectedSceneId}>
            <SelectTrigger className="w-40 h-8 text-sm">
              <SelectValue placeholder="All Scenes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Scenes</SelectItem>
              {scenes.map(scene => (
                <SelectItem key={scene.id} value={scene.id}>
                  {scene.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Image count - right aligned */}
          <div className="text-xs text-gray-400 whitespace-nowrap">
            {filteredImages.length} image{filteredImages.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Image grid */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredImages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            {searchQuery ? 'No images found' : 'No images yet'}
          </div>
        ) : (
          <div className="grid grid-cols-8 gap-1.5">
            {filteredImages.map((img, idx) => (
              <div
                key={`${img.result.timestamp}-${img.outputIndex}-${idx}`}
                className="group relative"
                draggable
                onDragStart={() => handleDragStart(img)}
                title={img.prompt}
              >
                <div className="cursor-move">
                  <FullscreenImage
                    src={img.src}
                    alt={img.prompt}
                    prompt={img.prompt}
                    result={img.result}
                    className="w-full aspect-square object-cover rounded border border-gray-700 hover:border-gray-500 transition-colors"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

