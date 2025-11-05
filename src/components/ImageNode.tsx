import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Image, X } from 'lucide-react';
import { SceneImage } from '@/types';

export interface ImageNodeData extends SceneImage {
  thumbnail?: string;
  onDelete?: (id: string) => void;
}

export const ImageNode = memo(({ data }: NodeProps<ImageNodeData>) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.onDelete) {
      data.onDelete(data.id);
    }
  };

  return (
    <div 
      className="bg-gray-800 rounded-lg border border-gray-700 p-3 min-w-[200px] hover:border-gray-600 transition-colors relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Handle type="target" position={Position.Left} className="!bg-gray-500" />
      
      {/* Delete button - appears on hover */}
      {isHovered && (
        <button
          onClick={handleDelete}
          className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors z-10 shadow-lg"
          title="Delete node"
        >
          <X className="w-4 h-4" />
        </button>
      )}
      
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded bg-gray-900 flex items-center justify-center flex-shrink-0">
          {data.thumbnail ? (
            <img src={data.thumbnail} alt={data.title} className="w-full h-full object-cover rounded" />
          ) : (
            <Image className="w-6 h-6 text-gray-600" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{data.title}</p>
        </div>
      </div>
      
      <Handle type="source" position={Position.Right} className="!bg-gray-500" />
    </div>
  );
});

ImageNode.displayName = 'ImageNode';

