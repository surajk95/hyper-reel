import { useState, useEffect } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import {
  Dialog,
  DialogContent,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { MediaPickerDialog } from './MediaPickerDialog';
import { Plus, X, Loader2, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useMediaStore } from '@/stores/useMediaStore';
import * as wavespeed from '@/services/wavespeed';
import * as gemini from '@/services/gemini';
import { OutputFormat, MODEL_REGISTRY, MediaItem, getModelById } from '@/types';

interface GenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  initialPrompt?: string;
  initialInputImages?: string[]; // MediaItem IDs
  initialModelId?: string;
  initialSize?: string;
  initialSeed?: number;
  initialOutputFormat?: OutputFormat;
}

const SIZE_OPTIONS = ['512*512', '1024*1024', '1536*1536', 'custom'];

const ASPECT_RATIO_OPTIONS = [
  { value: '1:1', label: '1:1 (1024×1024)', resolution: '1024*1024' },
  { value: '2:3', label: '2:3 (832×1248)', resolution: '832*1248' },
  { value: '3:2', label: '3:2 (1248×832)', resolution: '1248*832' },
  { value: '3:4', label: '3:4 (864×1184)', resolution: '864*1184' },
  { value: '4:3', label: '4:3 (1184×864)', resolution: '1184*864' },
  { value: '4:5', label: '4:5 (896×1152)', resolution: '896*1152' },
  { value: '5:4', label: '5:4 (1152×896)', resolution: '1152*896' },
  { value: '9:16', label: '9:16 (768×1344)', resolution: '768*1344' },
  { value: '16:9', label: '16:9 (1344×768)', resolution: '1344*768' },
  { value: '21:9', label: '21:9 (1536×672)', resolution: '1536*672' },
];

export function GenerationDialog({
  open,
  onOpenChange: _onOpenChange,
  projectId,
  initialPrompt = '',
  initialInputImages = [],
  initialModelId = 'gemini-2.5-flash-image',
  initialSize = '1536*1536',
  initialSeed = -1,
  initialOutputFormat = 'jpeg',
}: GenerationDialogProps) {
  const { toast } = useToast();
  const { getApiKey, getGeminiApiKey } = useSettingsStore();
  const { createGeneration, getMediaById } = useMediaStore();

  const [prompt, setPrompt] = useState(initialPrompt);
  const [inputImageIds, setInputImageIds] = useState<string[]>(initialInputImages);
  const [selectedSize, setSelectedSize] = useState(initialSize);
  const [customSize, setCustomSize] = useState('');
  const [selectedAspectRatio, setSelectedAspectRatio] = useState('1:1');
  const [seed, setSeed] = useState(initialSeed);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>(initialOutputFormat);
  const [selectedModelId, setSelectedModelId] = useState(initialModelId);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [isExpanded, setIsExpanded] = useState(() => {
    const saved = localStorage.getItem('hyper-reel-generation-expanded');
    return saved !== 'false'; // Default to true (expanded)
  });
  const [viewingImage, setViewingImage] = useState<MediaItem | null>(null);

  // Save expanded state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('hyper-reel-generation-expanded', isExpanded.toString());
  }, [isExpanded]);

  // Validate input images on mount and when they change
  useEffect(() => {
    if (open && inputImageIds.length > 0) {
      const validIds: string[] = [];
      const invalidCount = inputImageIds.filter((id) => {
        const media = getMediaById(id);
        if (media) {
          validIds.push(id);
          return false;
        }
        return true;
      }).length;

      if (invalidCount > 0) {
        toast({
          title: 'Invalid Input Images',
          description: `${invalidCount} input image(s) no longer exist and have been removed`,
          variant: 'destructive',
        });
        setInputImageIds(validIds);
      }
    }
  }, [open, inputImageIds, getMediaById, toast]);

  // Reset form on close
  useEffect(() => {
    if (!open) {
      setPrompt('');
      setInputImageIds([]);
      setSelectedSize('1536*1536');
      setCustomSize('');
      setSelectedAspectRatio('1:1');
      setSeed(-1);
      setOutputFormat('jpeg');
      setSelectedModelId('gemini-2.5-flash-image');
      setShowAdvanced(false);
    }
  }, [open]);

  // Set initial values when dialog opens and expand if there's a prompt or input images
  useEffect(() => {
    if (open) {
      setPrompt(initialPrompt);
      setInputImageIds(initialInputImages);
      setSelectedModelId(initialModelId);
      setSelectedSize(initialSize);
      setSeed(initialSeed);
      setOutputFormat(initialOutputFormat);
      
      // Expand the dialog if there's a prompt or input images (from retry/use actions)
      if (initialPrompt || initialInputImages.length > 0) {
        setIsExpanded(true);
      }
    }
  }, [open, initialPrompt, initialInputImages, initialModelId, initialSize, initialSeed, initialOutputFormat]);

  const selectedModel = MODEL_REGISTRY.find((m) => m.id === selectedModelId);

  const handleMediaSelect = (mediaItem: MediaItem) => {
    if (inputImageIds.length < 3 && !inputImageIds.includes(mediaItem.id)) {
      setInputImageIds([...inputImageIds, mediaItem.id]);
    }
  };

  const handleRemoveImage = (id: string) => {
    setInputImageIds(inputImageIds.filter((imgId) => imgId !== id));
  };

  const handleGenerate = async () => {
    const model = getModelById(selectedModelId);
    
    // Get the appropriate API key based on provider
    const apiKey = model?.provider === 'gemini' ? getGeminiApiKey() : getApiKey();
    const providerName = model?.provider === 'gemini' ? 'Gemini' : 'Wavespeed';
    
    console.log(`Using ${providerName} API key:`, apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT SET');
    
    if (!apiKey) {
      toast({
        title: 'API Key Required',
        description: `Please set your ${providerName} API key in settings`,
        variant: 'destructive',
      });
      return;
    }

    if (!prompt.trim()) {
      toast({
        title: 'Prompt Required',
        description: 'Please enter a prompt',
        variant: 'destructive',
      });
      return;
    }

    // Check if model requires images
    if (selectedModel?.supportsImageInput && inputImageIds.length === 0) {
      toast({
        title: 'Images Required',
        description: `${selectedModel.displayName} requires at least one input image`,
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Get actual image data from media items
      const inputImagesData: string[] = [];
      for (const id of inputImageIds) {
        const media = getMediaById(id);
        if (media) {
          inputImagesData.push(media.imageData);
        }
      }

      // Determine size based on model type
      let size: string;
      let aspectRatio: string;
      
      if (model?.provider === 'gemini') {
        // For all Gemini models, use aspect ratio
        const selectedOption = ASPECT_RATIO_OPTIONS.find(opt => opt.value === selectedAspectRatio);
        aspectRatio = selectedAspectRatio;
        size = selectedOption?.resolution || '1024*1024';
      } else {
        // For Wavespeed models, use size
        size = selectedSize === 'custom' ? customSize : selectedSize;
        aspectRatio = gemini.sizeToAspectRatio(size);
      }

      let response;
      
      // Route to the correct provider
      if (model?.provider === 'gemini') {
        // Gemini models
        response = await gemini.generateImageGemini({
          prompt: prompt.trim(),
          apiKey,
          images: inputImagesData.length > 0 ? inputImagesData : undefined,
          aspectRatio,
          outputFormat,
        });
      } else {
        // Wavespeed models
        if (selectedModelId === 'wan-2.2') {
          // Text-to-image
          response = await wavespeed.generateImageWan22({
            prompt: prompt.trim(),
            apiKey,
            size,
            seed,
            outputFormat,
          });
        } else {
          // Image-to-image (Qwen Edit)
          response = await wavespeed.generateImage({
            prompt: prompt.trim(),
            images: inputImagesData,
            apiKey,
            size,
            seed,
            outputFormat,
          });
        }
      }

      if (response.outputs && response.outputs.length > 0) {
        // Save each output as a separate media item
        for (const output of response.outputs) {
          await createGeneration(projectId, {
            imageData: output,
            prompt: prompt.trim(),
            modelId: selectedModelId,
            size,
            seed,
            outputFormat,
            inputImageIds: inputImageIds.length > 0 ? inputImageIds : undefined,
          });
        }

        toast({
          title: 'Generation Complete',
          description: `Generated ${response.outputs.length} image(s)`,
        });

        // Clear prompt and input images on success (keep dialog expanded)
        setPrompt('');
        setInputImageIds([]);
      } else {
        throw new Error('No outputs received from API');
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Get media items for input images
  const inputMediaItems = inputImageIds
    .map((id) => getMediaById(id))
    .filter((item): item is MediaItem => item !== undefined);

  // Build settings summary text
  const getSettingsSummary = () => {
    const parts: string[] = [];
    
    // Model
    parts.push(`Model: ${selectedModel?.displayName || 'Unknown'}`);
    
    // Size/Aspect Ratio
    if (selectedModel?.provider === 'gemini') {
      const aspectOption = ASPECT_RATIO_OPTIONS.find(opt => opt.value === selectedAspectRatio);
      parts.push(`Aspect: ${aspectOption?.label || selectedAspectRatio}`);
    } else {
      const sizeValue = selectedSize === 'custom' ? customSize : selectedSize;
      parts.push(`Size: ${sizeValue}`);
    }
    
    // Seed (only for Wavespeed)
    if (selectedModel?.provider !== 'gemini') {
      parts.push(`Seed: ${seed === -1 ? 'random' : seed}`);
    }
    
    // Output Format (only for Wavespeed)
    if (selectedModel?.provider === 'wavespeed') {
      parts.push(`Format: ${outputFormat.toUpperCase()}`);
    }
    
    // Input images count
    if (inputImageIds.length > 0) {
      parts.push(`Input Images: ${inputImageIds.length}`);
    }
    
    return parts.join(' • ');
  };

  if (!open) return null;

  return (
    <>
      {/* Floating Generation Dialog */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center p-4 pointer-events-none">
        <div className="w-full max-w-[1600px] pointer-events-auto">
          {isExpanded ? (
            <div className="relative border border-gray-700 rounded-lg p-3 bg-gray-900/95 backdrop-blur-sm shadow-2xl group">
              {/* Close Button - Top Right - Only show on hover */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-gray-800 hover:bg-gray-700 border border-gray-600 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Collapse"
                onClick={() => setIsExpanded(false)}
              >
                <X className="h-3 w-3 text-gray-400" />
              </Button>

              {/* Main Input Container */}
              <div className="flex gap-2 items-center mb-2">
                {/* Left: Input Images - Always show, but disable for non-image models */}
                <TooltipProvider>
                  <div className="flex gap-1 flex-shrink-0">
                    {inputMediaItems.map((media) => (
                      <div key={media.id} className="relative group w-10 h-10">
                        <img
                          src={media.imageData}
                          alt={media.prompt || 'Input'}
                          className="w-full h-full object-cover rounded border border-gray-700 cursor-pointer hover:border-blue-500 transition-colors"
                          onClick={() => setViewingImage(media)}
                        />
                        <Button
                          size="icon"
                          variant="destructive"
                          className="absolute -top-1 -right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity p-0 z-10"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveImage(media.id);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    {inputImageIds.length < 3 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => selectedModel?.supportsImageInput && setShowMediaPicker(true)}
                            disabled={!selectedModel?.supportsImageInput}
                            className={`w-10 h-10 border-2 border-dashed rounded flex items-center justify-center flex-shrink-0 transition-colors ${
                              selectedModel?.supportsImageInput
                                ? 'border-gray-700 hover:border-gray-500 cursor-pointer'
                                : 'border-gray-800 cursor-not-allowed opacity-50'
                            }`}
                          >
                            <Plus className="h-4 w-4 text-gray-500" />
                          </button>
                        </TooltipTrigger>
                        {!selectedModel?.supportsImageInput && (
                          <TooltipContent>
                            <p>Select an image-to-image model to add input images</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    )}
                  </div>
                </TooltipProvider>

              {/* Center: Prompt */}
              <div className="flex-1">
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe what you want to generate..."
                  rows={2}
                  className="focus-visible:ring-0 bg-transparent resize-none text-sm placeholder:text-gray-500 px-2 py-1.5 border-0 rounded-md"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !isGenerating && prompt.trim()) {
                      handleGenerate();
                    }
                  }}
                />
              </div>

              {/* Right: Controls */}
              <div className="flex gap-1.5 items-start flex-shrink-0">
                {/* Advanced Settings Popover */}
                <Popover open={showAdvanced} onOpenChange={setShowAdvanced}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Advanced Settings"
                    >
                      <Settings className="h-4 w-4 text-gray-400" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="end" side="top">
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm">Advanced Settings</h4>
                      
                      {/* Model Selector */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Model</label>
                        <Select value={selectedModelId} onValueChange={setSelectedModelId}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {MODEL_REGISTRY.map((model) => (
                              <SelectItem key={model.id} value={model.id}>
                                {model.displayName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {selectedModel?.provider === 'gemini' && (
                          <p className="text-xs text-gray-500">
                            Note: Output format is determined by Gemini
                          </p>
                        )}
                      </div>

                      {/* Aspect Ratio for all Gemini models */}
                      {selectedModel?.provider === 'gemini' && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Aspect Ratio</label>
                          <Select value={selectedAspectRatio} onValueChange={setSelectedAspectRatio}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ASPECT_RATIO_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Size for Wavespeed models */}
                      {selectedModel?.provider === 'wavespeed' && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Size</label>
                          <div className="flex gap-2">
                            <Select value={selectedSize} onValueChange={setSelectedSize}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {SIZE_OPTIONS.map((size) => (
                                  <SelectItem key={size} value={size}>
                                    {size === 'custom' ? 'Custom' : size}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {selectedSize === 'custom' && (
                              <Input
                                placeholder="1024*1024"
                                value={customSize}
                                onChange={(e) => setCustomSize(e.target.value)}
                              />
                            )}
                          </div>
                        </div>
                      )}

                      {/* Seed - Disabled for Gemini models */}
                      {selectedModel?.provider !== 'gemini' && (
                        <div className="space-y-2">
                          <label className="text-sm">Seed (-1 for random)</label>
                          <Input
                            type="number"
                            value={seed}
                            onChange={(e) => setSeed(parseInt(e.target.value))}
                          />
                        </div>
                      )}

                      {/* Output Format - Only for Wavespeed models */}
                      {selectedModel?.provider === 'wavespeed' && (
                        <div className="space-y-2">
                          <label className="text-sm">Output Format</label>
                          <Select value={outputFormat} onValueChange={(v) => setOutputFormat(v as OutputFormat)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="jpeg">JPEG</SelectItem>
                              <SelectItem value="png">PNG</SelectItem>
                              <SelectItem value="webp">WebP</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Generate Button */}
                <Button
                  onClick={handleGenerate}
                  disabled={
                    isGenerating ||
                    !prompt.trim() ||
                    (selectedModel?.supportsImageInput && inputImageIds.length === 0)
                  }
                  className="px-4 h-8 text-sm"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating
                    </>
                  ) : (
                    'Generate'
                  )}
                </Button>
              </div>
            </div>

              {/* Settings Summary */}
              <div className="text-xs text-gray-500 px-2">
                {getSettingsSummary()}
              </div>
            </div>
          ) : (
            /* Collapsed state - Plus button */
            <div className="flex justify-end">
              <Button
                size="lg"
                onClick={() => setIsExpanded(true)}
                className="shadow-lg rounded-full h-14 w-14 p-0"
                title="Open generation dialog"
              >
                <Plus className="h-6 w-6" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <MediaPickerDialog
        open={showMediaPicker}
        onOpenChange={setShowMediaPicker}
        onSelect={handleMediaSelect}
        projectId={projectId}
      />

      {/* Fullscreen Image Viewer - Simple, no actions */}
      {viewingImage && (
        <Dialog open={!!viewingImage} onOpenChange={(open) => !open && setViewingImage(null)}>
          <DialogContent className="max-w-[95vw] h-[95vh] p-0 bg-black">
            <div className="flex h-full w-full items-center justify-center">
              <img
                src={viewingImage.imageData}
                alt={viewingImage.prompt || 'Input image'}
                className="max-w-[90vw] max-h-[95vh] object-contain"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

