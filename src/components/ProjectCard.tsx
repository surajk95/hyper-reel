import { useState } from 'react';
import { Film, Plus, Trash2 } from 'lucide-react';
import { Project } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

interface ProjectCardProps {
  project?: Project;
  isNew?: boolean;
  onClick: () => void;
  onDelete?: (e: React.MouseEvent) => void;
}

export function ProjectCard({ project, isNew, onClick, onDelete }: ProjectCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "group relative aspect-square rounded-lg border transition-all",
        "hover:border-gray-600 hover:shadow-lg hover:scale-105",
        isNew
          ? "border-dashed border-gray-700 bg-gray-900/50"
          : "border-gray-800 bg-gray-900"
      )}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
        {isNew ? (
          <>
            <Plus className="h-12 w-12 text-gray-600 group-hover:text-gray-400 transition-colors mb-2" />
            <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
              New Project
            </span>
          </>
        ) : (
          <>
            {project?.thumbnail ? (
              <img
                src={project.thumbnail}
                alt={project.title}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <Film className="h-12 w-12 text-gray-700 group-hover:text-gray-500 transition-colors mb-2" />
            )}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black to-transparent">
              <p className="text-sm text-white font-medium truncate">
                {project?.title || 'Untitled'}
              </p>
            </div>
            
            {/* Delete button on hover */}
            {isHovered && onDelete && (
              <div className="absolute top-2 right-2">
                <Button
                  size="icon"
                  variant="destructive"
                  className="h-8 w-8 opacity-90 hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(e);
                  }}
                  title="Delete project"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </button>
  );
}

