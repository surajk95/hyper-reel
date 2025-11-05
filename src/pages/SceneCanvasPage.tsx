import { useEffect, useState, useCallback, memo } from 'react';
import { useParams } from 'react-router-dom';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  NodeTypes,
  EdgeTypes,
  NodeProps,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Header } from '@/components/Header';
import { ImageNode, ImageNodeData } from '@/components/ImageNode';
import { InsertEdge } from '@/components/InsertEdge';
import { useSceneImagesStore } from '@/stores/useSceneImagesStore';
import { useScenesStore } from '@/stores/useScenesStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useGenerationStore } from '@/stores/useGenerationStore';
import { SettingsDialog } from '@/components/SettingsDialog';
import { ImageDialog } from '@/components/ImageDialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as storage from '@/hooks/useStorage';

// Custom Start/End nodes with hover effect
const StartNode = memo(({ data }: NodeProps<{ label: string }>) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div className="relative">
      <div
        className="bg-green-500 text-white border-2 border-green-600 rounded-full w-[60px] h-[60px] text-xs flex items-center justify-center cursor-pointer hover:bg-green-600 transition-colors"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {isHovered ? 'Add' : data.label}
      </div>
      <Handle type="source" position={Position.Right} className="!bg-gray-500" />
    </div>
  );
});
StartNode.displayName = 'StartNode';

const EndNode = memo(({ data }: NodeProps<{ label: string }>) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div className="relative">
      <Handle type="target" position={Position.Left} className="!bg-gray-500" />
      <div
        className="bg-red-500 text-white border-2 border-red-600 rounded-full w-[60px] h-[60px] text-xs flex items-center justify-center cursor-pointer hover:bg-red-600 transition-colors"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {isHovered ? 'Add' : data.label}
      </div>
    </div>
  );
});
EndNode.displayName = 'EndNode';

const nodeTypes: NodeTypes = {
  imageNode: ImageNode,
  startNode: StartNode,
  endNode: EndNode,
};

const edgeTypes: EdgeTypes = {
  insertEdge: InsertEdge,
};

export function SceneCanvasPage() {
  const { sceneId } = useParams<{ projectId: string; sceneId: string }>();
  const { scenes, loadScenes } = useScenesStore();
  const { images, loadImagesByScene, createImage, insertImage, updateImage, deleteImage } = useSceneImagesStore();
  const { loadSettings } = useSettingsStore();
  const { loadResultsByImage, results } = useGenerationStore();
  const { toast } = useToast();
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [isNewImage, setIsNewImage] = useState(false);

  const scene = scenes.find(s => s.id === sceneId);

  useEffect(() => {
    loadScenes();
    if (sceneId) {
      loadImagesByScene(sceneId);
      loadSettings();
    }
  }, [sceneId, loadScenes, loadImagesByScene, loadSettings]);

  // Reload results when images change to update thumbnails
  useEffect(() => {
    images.forEach(image => {
      const results = storage.getGenerationResultsByImage(image.id);
      if (results.length > 0) {
        loadResultsByImage(image.id);
      }
    });
  }, [images, loadResultsByImage]);

  // Define handleDeleteNode before it's used in useEffect
  const handleDeleteNode = useCallback((imageId: string) => {
    // Check if the node has any generated images
    const results = storage.getGenerationResultsByImage(imageId);
    const hasGeneratedImages = results.length > 0;
    
    // Skip confirmation if no generated images
    if (!hasGeneratedImages) {
      deleteImage(imageId);
      toast({
        title: 'Node Deleted',
        description: 'The image node has been removed',
      });
      return;
    }
    
    // Show confirmation if has generated images
    const confirmed = window.confirm(
      'Are you sure you want to delete this image node? This action cannot be undone.'
    );
    
    if (confirmed) {
      deleteImage(imageId);
      toast({
        title: 'Node Deleted',
        description: 'The image node has been removed',
      });
    }
  }, [deleteImage, toast]);

  useEffect(() => {
    const newNodes: Node<ImageNodeData>[] = [];
    const newEdges: Edge[] = [];
    
    const spacing = 300;
    
    // Start node - small green circle
    newNodes.push({
      id: 'start',
      type: 'startNode',
      data: { label: 'Start' },
      position: { x: 0, y: 200 },
      draggable: false,
    });

    // Image nodes
    images.forEach((image, index) => {
      const nodeId = `image-${image.id}`;
      
      // Get thumbnail from generation results
      const results = storage.getGenerationResultsByImage(image.id);
      let thumbnail: string | undefined;
      if (results.length > 0) {
        const selectedResult = results[image.selectedOutputIndex];
        if (selectedResult && selectedResult.outputs.length > 0) {
          thumbnail = selectedResult.outputs[0];
        }
      }
      
      newNodes.push({
        id: nodeId,
        type: 'imageNode',
        data: { ...image, thumbnail, onDelete: handleDeleteNode },
        position: { x: spacing * (index + 1), y: 200 },
      });

      // Connect from previous node with insert functionality
      const sourceId = index === 0 ? 'start' : `image-${images[index - 1].id}`;
      newEdges.push({
        id: `edge-${sourceId}-${nodeId}`,
        source: sourceId,
        target: nodeId,
        type: 'insertEdge',
        data: {
          onInsert: () => {
            if (sceneId) {
              const position = index === 0 ? -1 : images[index - 1].position;
              const newImage = insertImage(sceneId, 'New Image', position);
              setSelectedImageId(newImage.id);
              setIsNewImage(true);
              loadResultsByImage(newImage.id);
              setShowImageDialog(true);
            }
          }
        },
      });
    });

    // End node - small red circle
    const endId = 'end';
    newNodes.push({
      id: endId,
      type: 'endNode',
      data: { label: 'End' },
      position: { x: spacing * (images.length + 1), y: 200 },
      draggable: false,
    });

    // Connect last image to end with insert functionality
    const lastImageId = images.length > 0 ? `image-${images[images.length - 1].id}` : 'start';
    const lastPosition = images.length > 0 ? images[images.length - 1].position : -1;
    newEdges.push({
      id: `edge-${lastImageId}-${endId}`,
      source: lastImageId,
      target: endId,
      type: 'insertEdge',
      data: {
        onInsert: () => {
          if (sceneId) {
            const newImage = insertImage(sceneId, 'New Image', lastPosition);
            setSelectedImageId(newImage.id);
            setIsNewImage(true);
            loadResultsByImage(newImage.id);
            setShowImageDialog(true);
          }
        }
      },
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [images, results, handleDeleteNode, sceneId, insertImage, loadResultsByImage, setIsNewImage, setSelectedImageId, setShowImageDialog]);

  const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    if (node.id.startsWith('image-')) {
      const imageId = node.id.replace('image-', '');
      setSelectedImageId(imageId);
      setIsNewImage(false);
      loadResultsByImage(imageId);
      setShowImageDialog(true);
    } else if (node.id === 'start' && sceneId) {
      // Insert at start
      const newImage = createImage(sceneId, 'New Image', 0);
      setSelectedImageId(newImage.id);
      setIsNewImage(true);
      loadResultsByImage(newImage.id);
      setShowImageDialog(true);
    } else if (node.id === 'end' && sceneId) {
      // Insert at end
      const newImage = createImage(sceneId, 'New Image');
      setSelectedImageId(newImage.id);
      setIsNewImage(true);
      loadResultsByImage(newImage.id);
      setShowImageDialog(true);
    }
  }, [loadResultsByImage, sceneId, createImage]);

  const handleAddImage = () => {
    if (sceneId) {
      const newImage = createImage(sceneId, 'New Image');
      setSelectedImageId(newImage.id);
      setIsNewImage(true);
      loadResultsByImage(newImage.id);
      setShowImageDialog(true);
    }
  };

  const handleCancelNewImage = () => {
    // This will be called if a new image is cancelled
    loadImagesByScene(sceneId!);
  };

  if (!scene) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Scene not found</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <Header
        title={scene.title}
        showBack
        onSettingsClick={() => setShowSettingsDialog(true)}
      />
      
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          minZoom={0.1}
          maxZoom={2}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#333" />
          <Controls />
        </ReactFlow>

        {/* Add image button */}
        <div className="absolute bottom-8 right-8">
          <Button
            size="lg"
            onClick={handleAddImage}
            className="shadow-lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Image
          </Button>
        </div>
      </div>

      <SettingsDialog
        open={showSettingsDialog}
        onOpenChange={setShowSettingsDialog}
      />

      {selectedImageId && (
        <ImageDialog
          open={showImageDialog}
          onOpenChange={setShowImageDialog}
          imageId={selectedImageId}
          isNewImage={isNewImage}
          onCancelNew={handleCancelNewImage}
        />
      )}
    </div>
  );
}

