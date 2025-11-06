import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useToast } from '@/hooks/use-toast';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { settings, setApiKey, setGeminiApiKey } = useSettingsStore();
  const { toast } = useToast();
  const [wavespeedApiKey, setWavespeedApiKeyLocal] = useState('');
  const [geminiApiKey, setGeminiApiKeyLocal] = useState('');

  useEffect(() => {
    if (open) {
      setWavespeedApiKeyLocal(settings.wavespeedApiKey || '');
      setGeminiApiKeyLocal(settings.geminiApiKey || '');
    }
  }, [open, settings]);

  const handleSave = () => {
    setApiKey(wavespeedApiKey);
    setGeminiApiKey(geminiApiKey);
    toast({
      title: 'Settings saved',
      description: 'Your API keys have been saved successfully.',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="wavespeedApiKey" className="text-sm font-medium">
              Wavespeed API Key
            </label>
            <Input
              id="wavespeedApiKey"
              type="password"
              placeholder="Enter your Wavespeed API key"
              value={wavespeedApiKey}
              onChange={(e) => setWavespeedApiKeyLocal(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              For Qwen Edit and Wan 2.2 models.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="geminiApiKey" className="text-sm font-medium">
              Gemini API Key
            </label>
            <Input
              id="geminiApiKey"
              type="password"
              placeholder="Enter your Gemini API key"
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKeyLocal(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              For Gemini image generation models. Get your key at{' '}
              <a 
                href="https://ai.google.dev/gemini-api/docs" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                ai.google.dev
              </a>
            </p>
          </div>

          <p className="text-xs text-gray-500 pt-2">
            Your API keys are stored locally and never sent to our servers.
          </p>
        </div>
        
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

