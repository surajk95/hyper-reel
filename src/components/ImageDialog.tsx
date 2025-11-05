import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { useSceneImagesStore } from '@/stores/useSceneImagesStore';
import { useGenerationStore } from '@/stores/useGenerationStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { FullscreenImage } from './FullscreenImage';
import { Plus, X, Loader2, Check, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as wavespeed from '@/services/wavespeed';
import { OutputFormat } from '@/types';

interface ImageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageId: string;
  isNewImage?: boolean;
  onCancelNew?: () => void;
}

const SIZE_OPTIONS = ['512*512', '1024*1024', '1536*1536', 'custom'];

export function ImageDialog({ open, onOpenChange, imageId, isNewImage = false, onCancelNew }: ImageDialogProps) {
  const { images, updateImage, deleteImage } = useSceneImagesStore();
  const { results, loadResultsByImage, addResult, isGenerating, setGenerating } = useGenerationStore();
  const { getApiKey } = useSettingsStore();
  const { toast } = useToast();

  const image = images.find(i => i.id === imageId);
  
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [inputImages, setInputImages] = useState<string[]>([]);
  const [selectedSize, setSelectedSize] = useState('1024*1024');
  const [customSize, setCustomSize] = useState('');
  const [seed, setSeed] = useState(-1);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('jpeg');
  const [selectedModel, setSelectedModel] = useState('Qwen Edit');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [hasGeneratedInSession, setHasGeneratedInSession] = useState(false);

  useEffect(() => {
    if (open && image) {
      setTitle(image.title);
      loadResultsByImage(imageId);
    }
  }, [open, image, imageId, loadResultsByImage]);

  // Auto-load settings when results are loaded
  useEffect(() => {
    if (open && image && results.length > 0 && image.selectedOutputIndex !== undefined) {
      const selectedResult = results[image.selectedOutputIndex];
      if (selectedResult) {
        setPrompt(selectedResult.prompt);
        setInputImages(selectedResult.inputImages);
        setSelectedSize(selectedResult.size);
        setSeed(selectedResult.seed);
        setOutputFormat(selectedResult.outputFormat as OutputFormat);
      }
    }
  }, [open, image, results]);

  useEffect(() => {
    if (open) {
      setHasGeneratedInSession(false);
    } else {
      // Reset generation form when closed
      setPrompt('');
      setInputImages([]);
      setSelectedSize('1024*1024');
      setCustomSize('');
      setSeed(-1);
      setOutputFormat('jpeg');
      setSelectedModel('Qwen Edit');
      setShowCloseConfirm(false);
    }
  }, [open]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remainingSlots = 3 - inputImages.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    for (const file of filesToProcess) {
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
        setInputImages(prev => [...prev, base64]);
      } catch (error) {
        toast({
          title: 'Upload failed',
          description: `Failed to upload ${file.name}`,
          variant: 'destructive',
        });
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    setInputImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    const apiKey = getApiKey();
    if (!apiKey) {
      toast({
        title: 'API Key Required',
        description: 'Please set your Wavespeed API key in settings',
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

    if (inputImages.length === 0) {
      toast({
        title: 'Images Required',
        description: 'Please upload at least one image',
        variant: 'destructive',
      });
      return;
    }

    setGenerating(true);

    try {
      const size = selectedSize === 'custom' ? customSize : selectedSize;
      
      const response = await wavespeed.generateImage({
        prompt: prompt.trim(),
        images: inputImages,
        apiKey,
        size,
        seed,
        outputFormat,
      });

      if (response.outputs && response.outputs.length > 0) {
        // Add generation result to store
        const newResult = {
          imageId,
          outputs: response.outputs,
          prompt: prompt.trim(),
          inputImages,
          seed,
          size,
          outputFormat,
          timestamp: Date.now(),
        };
        
        addResult(newResult);

        setHasGeneratedInSession(true);

        toast({
          title: 'Generation Complete',
          description: `Generated ${response.outputs.length} image(s)`,
        });

        // Auto-select the first output if no selection yet
        if (!image?.selectedOutputIndex && image?.selectedOutputIndex !== 0) {
          updateImage(imageId, { selectedOutputIndex: 0, prompt: prompt.trim() });
        }
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
      setGenerating(false);
    }
  };

  const handleSelectOutput = (resultIndex: number) => {
    const selectedResult = results[resultIndex];
    updateImage(imageId, { 
      selectedOutputIndex: resultIndex,
      prompt: selectedResult?.prompt 
    });
    toast({
      title: 'Image Selected',
      description: 'This image will be used for the scene',
    });
  };

  const handleTitleChange = () => {
    if (title.trim() && title !== image?.title) {
      updateImage(imageId, { title: title.trim() });
    }
  };

  const handleCloseRequest = (open: boolean) => {
    // If trying to open, just pass through
    if (open) {
      onOpenChange(open);
      return;
    }
    
    // If trying to close and it's a new image with generated content, ask for confirmation
    if (isNewImage && hasGeneratedInSession) {
      setShowCloseConfirm(true);
      return;
    }
    
    // Otherwise close normally
    // If closing a new image without generation, delete it
    if (isNewImage && !hasGeneratedInSession && onCancelNew) {
      deleteImage(imageId);
    }
    onOpenChange(false);
  };

  const handleConfirmClose = () => {
    setShowCloseConfirm(false);
    // Don't delete the image if it has generated content
    onOpenChange(false);
  };

  const handleCancelClose = () => {
    setShowCloseConfirm(false);
  };

  if (!image) return null;

  const hasResults = results.length > 0;
  const selectedResult = results[image.selectedOutputIndex];
  const selectedOutput = selectedResult?.outputs[0];

  return (
    <>
      <Dialog open={open} onOpenChange={handleCloseRequest}>
        <DialogContent className="w-[90vw] h-[90vh] max-w-none overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="space-y-2">
            <p className="text-sm font-medium text-gray-400">Title</p>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleChange}
              placeholder="Image title"
              className="text-base"
            />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Preview Section - Only if has results */}
          {hasResults && (
            <div className="flex gap-6 h-[calc(90vh-300px)]">
              {/* Left: Current selected image - 50% width */}
              <div className="w-1/2 flex-shrink-0">
                {selectedOutput && selectedResult && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-400">Currently Selected</p>
                    <div className="flex items-center justify-center">
                      <FullscreenImage
                        src={selectedOutput}
                        alt={image.title}
                        className="max-w-full max-h-[50vh] object-contain rounded-lg border border-gray-700"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Right: All generation results - 50% width */}
              <div className="w-1/2 flex-shrink-0 space-y-2 flex flex-col">
                <p className="text-sm font-medium">All Generated Images</p>
                <div className="flex-1 overflow-y-auto pr-2">
                  <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, 200px)' }}>
                    {results.map((result, resultIdx) => (
                      result.outputs.map((output, outputIdx) => (
                        <div key={`${result.timestamp}-${outputIdx}`} className="space-y-1">
                          <FullscreenImage
                            src={output}
                            alt={`Generation ${resultIdx}-${outputIdx}`}
                            className="w-[200px] h-[200px] object-cover rounded border border-gray-700 hover:border-gray-500 transition-colors"
                          />
                          <Button
                            size="sm"
                            variant={image.selectedOutputIndex === resultIdx && outputIdx === 0 ? 'default' : 'secondary'}
                            onClick={() => handleSelectOutput(resultIdx)}
                            className="text-xs px-2 py-1 h-auto w-full"
                          >
                            {image.selectedOutputIndex === resultIdx ? (
                              <><Check className="h-3 w-3 mr-1" /> Selected</>
                            ) : (
                              'Select'
                            )}
                          </Button>
                        </div>
                      ))
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Generation Section */}
          <div className="space-y-3" data-generation-section>
            <p className="text-sm font-medium text-gray-400">
              {hasResults ? 'Generate New' : 'Generate'}
            </p>

            {/* Main Input Container - Grok style with proper vertical centering */}
            <div className="border border-gray-700 rounded-lg p-3 bg-gray-900/30 hover:border-gray-600 transition-colors">
              <div className="flex gap-3 items-center">
                {/* Left: Input Images */}
                <div className="flex gap-1.5 flex-shrink-0">
                  {inputImages.map((img, idx) => (
                    <div key={idx} className="relative group w-12 h-12">
                      <img
                        src={img}
                        alt={`Input ${idx + 1}`}
                        className="w-full h-full object-cover rounded border border-gray-700"
                      />
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute -top-1 -right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity p-0"
                        onClick={() => handleRemoveImage(idx)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  {inputImages.length < 3 && (
                    <label className="w-12 h-12 border-2 border-dashed border-gray-700 rounded flex items-center justify-center cursor-pointer hover:border-gray-500 transition-colors flex-shrink-0">
                      <Plus className="h-5 w-5 text-gray-500" />
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </label>
                  )}
                </div>

                {/* Center: Prompt */}
                <div className="flex-1">
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe what you want to generate..."
                    rows={2}
                    className="focus-visible:ring-0 bg-transparent resize-none text-base placeholder:text-gray-500 px-5 py-2.5 border border-[#651ac4] rounded-md"
                  />
                </div>

                {/* Right: Controls */}
                <div className="flex gap-2 items-center flex-shrink-0">
                  {/* Advanced Settings Popover */}
                  <Popover open={showAdvanced} onOpenChange={setShowAdvanced}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
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
                          <Select value={selectedModel} onValueChange={setSelectedModel}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Qwen Edit">Qwen Edit</SelectItem>
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
                                {SIZE_OPTIONS.map(size => (
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
                    disabled={isGenerating || !prompt.trim() || inputImages.length === 0}
                    className="px-6 h-9"
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
        </div>
      </DialogContent>
    </Dialog>

    <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Discard Changes?</AlertDialogTitle>
          <AlertDialogDescription>
            You have generated images in this session. Closing will keep the node but you'll lose any unsaved work. Are you sure you want to close?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancelClose}>
            Continue Editing
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirmClose}>
            Close Anyway
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
