import { useEffect, useState, useCallback } from 'react';
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
import * as storage from '@/hooks/useStorage';

const nodeTypes: NodeTypes = {
  imageNode: ImageNode,
};

const edgeTypes: EdgeTypes = {
  insertEdge: InsertEdge,
};

export function SceneCanvasPage() {
  const { sceneId } = useParams<{ projectId: string; sceneId: string }>();
  const { scenes } = useScenesStore();
  const { images, loadImagesByScene, createImage, insertImage } = useSceneImagesStore();
  const { loadSettings } = useSettingsStore();
  const { loadResultsByImage, results } = useGenerationStore();
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

  const scene = scenes.find(s => s.id === sceneId);

  useEffect(() => {
    if (sceneId) {
      loadImagesByScene(sceneId);
      loadSettings();
    }
  }, [sceneId, loadImagesByScene, loadSettings]);

  // Reload results when images change to update thumbnails
  useEffect(() => {
    images.forEach(image => {
      const results = storage.getGenerationResultsByImage(image.id);
      if (results.length > 0) {
        loadResultsByImage(image.id);
      }
    });
  }, [images]);

  useEffect(() => {
    const newNodes: Node<ImageNodeData>[] = [];
    const newEdges: Edge[] = [];
    
    const spacing = 300;
    
    // Start node - small green circle
    newNodes.push({
      id: 'start',
      type: 'input',
      data: { label: 'Start' } as any,
      position: { x: 0, y: 200 },
      draggable: false,
      style: {
        background: '#22c55e',
        color: 'white',
        border: '2px solid #16a34a',
        borderRadius: '50%',
        width: '60px',
        height: '60px',
        fontSize: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
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
        data: { ...image, thumbnail },
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
      type: 'output',
      data: { label: 'End' } as any,
      position: { x: spacing * (images.length + 1), y: 200 },
      draggable: false,
      style: {
        background: '#ef4444',
        color: 'white',
        border: '2px solid #dc2626',
        borderRadius: '50%',
        width: '60px',
        height: '60px',
        fontSize: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
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
            loadResultsByImage(newImage.id);
            setShowImageDialog(true);
          }
        }
      },
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [images, results]);

  const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    if (node.id.startsWith('image-')) {
      const imageId = node.id.replace('image-', '');
      setSelectedImageId(imageId);
      loadResultsByImage(imageId);
      setShowImageDialog(true);
    } else if (node.id === 'start' && sceneId) {
      // Insert at start
      const newImage = createImage(sceneId, 'New Image', 0);
      setSelectedImageId(newImage.id);
      loadResultsByImage(newImage.id);
      setShowImageDialog(true);
    } else if (node.id === 'end' && sceneId) {
      // Insert at end
      const newImage = createImage(sceneId, 'New Image');
      setSelectedImageId(newImage.id);
      loadResultsByImage(newImage.id);
      setShowImageDialog(true);
    }
  }, [loadResultsByImage, sceneId, createImage]);

  const handleAddImage = () => {
    if (sceneId) {
      const newImage = createImage(sceneId, 'New Image');
      setSelectedImageId(newImage.id);
      loadResultsByImage(newImage.id);
      setShowImageDialog(true);
    }
  };

  if (!scene) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Scene not found</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
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
        />
      )}
    </div>
  );
}

