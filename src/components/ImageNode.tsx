import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Image } from 'lucide-react';
import { SceneImage } from '@/types';

export interface ImageNodeData extends SceneImage {
  thumbnail?: string;
}

export const ImageNode = memo(({ data }: NodeProps<ImageNodeData>) => {
  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-3 min-w-[200px] hover:border-gray-600 transition-colors">
      <Handle type="target" position={Position.Left} className="!bg-gray-500" />
      
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

