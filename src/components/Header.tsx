import { Settings, Pencil, Upload } from 'lucide-react';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onSettingsClick?: () => void;
  onEditTitle?: () => void;
  showEditTitle?: boolean;
  onUploadClick?: () => void;
  showUpload?: boolean;
}

export function Header({ title = 'Hyper Reel', showBack = false, onSettingsClick, onEditTitle, showEditTitle = false, onUploadClick, showUpload = false }: HeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="border-b border-gray-800 bg-black">
      <div className="container w-full max-w-full px-2 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {showBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
            >
              ← Back
            </Button>
          )}
          <h1 className="text-xl font-semibold">{title}</h1>
          {showEditTitle && onEditTitle && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onEditTitle}
              title="Rename project"
              className="h-8 w-8"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {showUpload && onUploadClick && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onUploadClick}
              title="Upload images"
            >
              <Upload className="h-5 w-5" />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onSettingsClick}
            title="Settings"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}

