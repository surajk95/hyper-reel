import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Upload } from 'lucide-react';
import { useMediaStore } from '@/stores/useMediaStore';
import * as wavespeed from '@/services/wavespeed';
import { useToast } from '@/hooks/use-toast';

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export function UploadDialog({ open, onOpenChange, projectId }: UploadDialogProps) {
  const { createUpload } = useMediaStore();
  const { toast } = useToast();
  
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    let successCount = 0;
    let failCount = 0;

    for (const file of Array.from(files)) {
      if (!wavespeed.isValidImageFile(file)) {
        toast({
          title: 'Invalid file',
          description: `${file.name} is not a valid image file`,
          variant: 'destructive',
        });
        failCount++;
        continue;
      }

      try {
        const base64 = await wavespeed.convertFileToBase64(file);
        await createUpload(projectId, base64);
        successCount++;
      } catch (error) {
        toast({
          title: 'Upload failed',
          description: `Failed to upload ${file.name}`,
          variant: 'destructive',
        });
        failCount++;
      }
    }

    setIsUploading(false);

    if (successCount > 0) {
      toast({
        title: 'Upload successful',
        description: `${successCount} image${successCount > 1 ? 's' : ''} uploaded successfully`,
      });
    }

    // Close dialog after upload if all succeeded
    if (successCount > 0 && failCount === 0) {
      setTimeout(() => onOpenChange(false), 500);
    }
  }, [projectId, createUpload, toast, onOpenChange]);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Images</DialogTitle>
        </DialogHeader>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center transition-colors min-h-[300px] ${
            isDragging
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-gray-700 hover:border-gray-600'
          }`}
        >
          <Upload className={`h-16 w-16 mb-4 transition-colors ${isDragging ? 'text-blue-500' : 'text-gray-500'}`} />
          <p className="text-base text-gray-300 mb-2 font-medium">Drag and drop images here</p>
          <p className="text-sm text-gray-500 mb-6">or</p>
          <label className={`cursor-pointer px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-md text-sm transition-colors ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
            {isUploading ? 'Uploading...' : 'Choose Files'}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files)}
              disabled={isUploading}
            />
          </label>
          <p className="text-xs text-gray-500 mt-6">Supports: JPEG, PNG, WebP</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

