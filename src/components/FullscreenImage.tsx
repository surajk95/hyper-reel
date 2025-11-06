import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, Copy, Check } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';

interface FullscreenImageProps {
  src: string;
  alt?: string;
  className?: string;
  prompt?: string;
  children?: React.ReactNode;
}

export function FullscreenImage({ src, alt = '', className = '', prompt }: FullscreenImageProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = src;
    link.download = alt || 'image';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyPrompt = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (prompt) {
      try {
        await navigator.clipboard.writeText(prompt);
        setCopied(true);
        toast({
          title: 'Copied',
          description: 'Prompt copied to clipboard',
        });
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        toast({
          title: 'Failed to copy',
          description: 'Could not copy prompt to clipboard',
          variant: 'destructive',
        });
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullscreen(false);
      }
    };

    if (isFullscreen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isFullscreen]);

  const fullscreenContent = isFullscreen && (
    <div
      className="fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center"
      onClick={() => setIsFullscreen(false)}
    >
      <div className="absolute top-4 right-4 flex gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDownload}
          className="text-white hover:bg-white/10"
        >
          <Download className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsFullscreen(false)}
          className="text-white hover:bg-white/10"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
      
      <img
        src={src}
        alt={alt}
        className="max-w-[90vw] max-h-[75vh] object-contain"
        onClick={(e) => e.stopPropagation()}
      />
      
      {prompt && (
        <div 
          className="mt-4 max-w-2xl bg-gray-900/80 backdrop-blur-sm rounded-lg p-4 border border-gray-700"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-300 mb-1">Prompt</p>
              <p className="text-sm text-gray-100">{prompt}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopyPrompt}
                className="text-white hover:bg-white/10"
                title="Copy prompt"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <img
        src={src}
        alt={alt}
        className={`cursor-pointer ${className}`}
        onClick={() => setIsFullscreen(true)}
      />

      {fullscreenContent && createPortal(fullscreenContent, document.body)}
    </>
  );
}

