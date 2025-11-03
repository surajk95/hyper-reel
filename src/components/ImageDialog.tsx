import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { useSceneImagesStore } from '@/stores/useSceneImagesStore';
import { useGenerationStore } from '@/stores/useGenerationStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { FullscreenImage } from './FullscreenImage';
import { Plus, X, Loader2, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as wavespeed from '@/services/wavespeed';
import { OutputFormat } from '@/types';

interface ImageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageId: string;
}

const SIZE_OPTIONS = ['512*512', '1024*1024', '1536*1536', 'custom'];

export function ImageDialog({ open, onOpenChange, imageId }: ImageDialogProps) {
  const { images, updateImage } = useSceneImagesStore();
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
  const [newResults, setNewResults] = useState<string[]>([]);

  useEffect(() => {
    if (open && image) {
      setTitle(image.title);
      loadResultsByImage(imageId);
    }
  }, [open, image, imageId, loadResultsByImage]);

  useEffect(() => {
    if (!open) {
      // Reset generation form when closed
      setPrompt('');
      setInputImages([]);
      setSelectedSize('1024*1024');
      setCustomSize('');
      setSeed(-1);
      setOutputFormat('jpeg');
      setNewResults([]);
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
    setNewResults([]);

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
        addResult({
          imageId,
          outputs: response.outputs,
          prompt: prompt.trim(),
          inputImages,
          seed,
          size,
          outputFormat,
          timestamp: Date.now(),
        });

        setNewResults(response.outputs);

        toast({
          title: 'Generation Complete',
          description: `Generated ${response.outputs.length} image(s)`,
        });
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
    updateImage(imageId, { selectedOutputIndex: resultIndex });
    toast({
      title: 'Image Selected',
      description: 'This image will be used for the scene',
    });
  };

  const handleTitleChange = () => {
    if (title.trim() && title !== image?.title) {
      updateImage(imageId, { title: title.trim() });
      toast({
        title: 'Title Updated',
      });
    }
  };

  if (!image) return null;

  const hasResults = results.length > 0 || newResults.length > 0;
  const allResults = [...results];
  
  // Get selected image
  const selectedResult = results[image.selectedOutputIndex];
  const selectedOutput = selectedResult?.outputs[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Image Generation</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <div className="flex gap-2">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleChange}
                placeholder="Image title"
              />
            </div>
          </div>

          {/* Preview Section - Only if has results */}
          {hasResults && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Preview</h3>
              
              {/* Current selected image */}
              {selectedOutput && (
                <div className="rounded-lg border border-gray-800 p-4">
                  <p className="text-xs text-gray-500 mb-2">Currently Selected</p>
                  <FullscreenImage
                    src={selectedOutput}
                    alt={image.title}
                    className="w-full rounded-lg"
                  />
                </div>
              )}

              {/* All generation results */}
              <div className="space-y-4">
                <p className="text-sm text-gray-400">All Generated Images</p>
                {allResults.map((result, resultIdx) => (
                  <div key={result.timestamp} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        {new Date(result.timestamp).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">{result.prompt.slice(0, 50)}...</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {result.outputs.map((output, outputIdx) => (
                        <div key={outputIdx} className="relative group">
                          <FullscreenImage
                            src={output}
                            alt={`Generation ${resultIdx}-${outputIdx}`}
                            className="w-full aspect-square object-cover rounded-lg"
                          />
                          <Button
                            size="sm"
                            className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleSelectOutput(resultIdx)}
                          >
                            {image.selectedOutputIndex === resultIdx ? (
                              <><Check className="h-4 w-4 mr-1" /> Selected</>
                            ) : (
                              'Select'
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Show new results */}
              {newResults.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500">New Generation</p>
                  <div className="grid grid-cols-3 gap-2">
                    {newResults.map((output, outputIdx) => (
                      <div key={outputIdx} className="relative group">
                        <FullscreenImage
                          src={output}
                          alt={`New generation ${outputIdx}`}
                          className="w-full aspect-square object-cover rounded-lg"
                        />
                        <Button
                          size="sm"
                          className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleSelectOutput(0)}
                        >
                          Select
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Generation Section */}
          <div className="space-y-4 border-t border-gray-800 pt-4">
            <h3 className="text-sm font-medium">
              {hasResults ? 'Generate New' : 'Generate'}
            </h3>

            {/* Prompt */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Prompt</label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe what you want to generate..."
                rows={4}
              />
            </div>

            {/* Input Images */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Input Images (Max 3)</label>
              <div className="grid grid-cols-4 gap-2">
                {inputImages.map((img, idx) => (
                  <div key={idx} className="relative group aspect-square">
                    <img
                      src={img}
                      alt={`Input ${idx + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveImage(idx)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {inputImages.length < 3 && (
                  <label className="aspect-square border-2 border-dashed border-gray-700 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-600 transition-colors">
                    <Plus className="h-8 w-8 text-gray-600" />
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
            </div>

            {/* Model (locked) */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Model</label>
              <Input value="Qwen Edit" disabled />
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

            {/* Advanced */}
            <details className="space-y-2">
              <summary className="text-sm font-medium cursor-pointer">Advanced Options</summary>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <label className="text-sm">Seed (-1 for random)</label>
                  <Input
                    type="number"
                    value={seed}
                    onChange={(e) => setSeed(parseInt(e.target.value))}
                  />
                </div>
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
            </details>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim() || inputImages.length === 0}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

