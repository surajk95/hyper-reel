import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
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

export function GenerationDialog({
  open,
  onOpenChange,
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
  const [seed, setSeed] = useState(initialSeed);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>(initialOutputFormat);
  const [selectedModelId, setSelectedModelId] = useState(initialModelId);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);

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
      setSeed(-1);
      setOutputFormat('jpeg');
      setSelectedModelId('gemini-2.5-flash-image');
      setShowAdvanced(false);
    }
  }, [open]);

  // Set initial values when dialog opens
  useEffect(() => {
    if (open) {
      setPrompt(initialPrompt);
      setInputImageIds(initialInputImages);
      setSelectedModelId(initialModelId);
      setSelectedSize(initialSize);
      setSeed(initialSeed);
      setOutputFormat(initialOutputFormat);
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
      const size = selectedSize === 'custom' ? customSize : selectedSize;
      
      // Get actual image data from media items
      const inputImagesData: string[] = [];
      for (const id of inputImageIds) {
        const media = getMediaById(id);
        if (media) {
          inputImagesData.push(media.imageData);
        }
      }

      let response;
      
      // Route to the correct provider
      if (model?.provider === 'gemini') {
        // Gemini models
        const aspectRatio = gemini.sizeToAspectRatio(size);
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

        // Close dialog on success
        onOpenChange(false);
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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[90vw] sm:max-w-3xl max-h-[95vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Generate Image</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto min-h-0">
            {/* Main Input Container */}
            <div className="border border-gray-700 rounded-lg p-2 bg-gray-900/30 hover:border-gray-600 transition-colors">
              <div className="flex gap-2 items-center">
                {/* Left: Input Images - Only show for image editing models */}
                {selectedModel?.supportsImageInput && (
                  <div className="flex gap-1 flex-shrink-0">
                    {inputMediaItems.map((media) => (
                      <div key={media.id} className="relative group w-10 h-10">
                        <img
                          src={media.imageData}
                          alt={media.prompt || 'Input'}
                          className="w-full h-full object-cover rounded border border-gray-700"
                        />
                        <Button
                          size="icon"
                          variant="destructive"
                          className="absolute -top-1 -right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity p-0"
                          onClick={() => handleRemoveImage(media.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    {inputImageIds.length < 3 && (
                      <button
                        onClick={() => setShowMediaPicker(true)}
                        className="w-10 h-10 border-2 border-dashed border-gray-700 rounded flex items-center justify-center cursor-pointer hover:border-gray-500 transition-colors flex-shrink-0"
                      >
                        <Plus className="h-4 w-4 text-gray-500" />
                      </button>
                    )}
                  </div>
                )}

                {/* Center: Prompt */}
                <div className="flex-1">
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe what you want to generate..."
                    rows={2}
                    className="focus-visible:ring-0 bg-transparent resize-none text-sm placeholder:text-gray-500 px-2 py-1.5 border-0 rounded-md"
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
                    <PopoverContent className="w-80" align="end">
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
                        </div>

                        {/* Size */}
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

                        {/* Seed */}
                        <div className="space-y-2">
                          <label className="text-sm">Seed (-1 for random)</label>
                          <Input
                            type="number"
                            value={seed}
                            onChange={(e) => setSeed(parseInt(e.target.value))}
                          />
                        </div>

                        {/* Output Format */}
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
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <MediaPickerDialog
        open={showMediaPicker}
        onOpenChange={setShowMediaPicker}
        onSelect={handleMediaSelect}
        projectId={projectId}
      />
    </>
  );
}

