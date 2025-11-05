import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { SceneNode, SceneNodeData } from '@/components/SceneNode';
import { InsertEdge } from '@/components/InsertEdge';
import { useScenesStore } from '@/stores/useScenesStore';
import { useProjectsStore } from '@/stores/useProjectsStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { SettingsDialog } from '@/components/SettingsDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as storage from '@/hooks/useStorage';

const nodeTypes: NodeTypes = {
  sceneNode: SceneNode,
};

const edgeTypes: EdgeTypes = {
  insertEdge: InsertEdge,
};

export function ProjectCanvasPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { projects, loadProjects } = useProjectsStore();
  const { scenes, loadScenesByProject, createScene, insertScene, deleteScene } = useScenesStore();
  const { loadSettings } = useSettingsStore();
  const { toast } = useToast();
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showNewSceneDialog, setShowNewSceneDialog] = useState(false);
  const [newSceneTitle, setNewSceneTitle] = useState('');
  const [insertPosition, setInsertPosition] = useState<number>(-1);

  const project = projects.find(p => p.id === projectId);

  useEffect(() => {
    loadProjects();
    if (projectId) {
      loadScenesByProject(projectId);
      loadSettings();
    }
  }, [projectId, loadProjects, loadScenesByProject, loadSettings]);

  // Delete handler for scene nodes
  const handleDeleteScene = useCallback((sceneId: string) => {
    // Check if the scene has any images
    const sceneImages = storage.getImagesByScene(sceneId);
    const hasImages = sceneImages.length > 0;
    
    // Skip confirmation if no images
    if (!hasImages) {
      deleteScene(sceneId);
      toast({
        title: 'Scene Deleted',
        description: 'The scene has been removed',
      });
      return;
    }
    
    // Show confirmation if has images
    const confirmed = window.confirm(
      'Are you sure you want to delete this scene? This will also delete all images in the scene. This action cannot be undone.'
    );
    
    if (confirmed) {
      deleteScene(sceneId);
      toast({
        title: 'Scene Deleted',
        description: 'The scene and its images have been removed',
      });
    }
  }, [deleteScene, toast]);

  useEffect(() => {
    if (!scenes.length) return;

    const newNodes: Node<SceneNodeData>[] = [];
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

    // Scene nodes
    scenes.forEach((scene, index) => {
      const nodeId = `scene-${scene.id}`;
      newNodes.push({
        id: nodeId,
        type: 'sceneNode',
        data: { ...scene, onDelete: handleDeleteScene },
        position: { x: spacing * (index + 1), y: 200 },
      });

      // Connect from previous node with insert functionality
      const sourceId = index === 0 ? 'start' : `scene-${scenes[index - 1].id}`;
      newEdges.push({
        id: `edge-${sourceId}-${nodeId}`,
        source: sourceId,
        target: nodeId,
        type: 'insertEdge',
        data: {
          onInsert: () => {
            if (projectId) {
              const position = index === 0 ? -1 : scenes[index - 1].position;
              setInsertPosition(position);
              setShowNewSceneDialog(true);
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
      position: { x: spacing * (scenes.length + 1), y: 200 },
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

    // Connect last scene to end with insert functionality
    const lastSceneId = scenes.length > 0 ? `scene-${scenes[scenes.length - 1].id}` : 'start';
    const lastPosition = scenes.length > 0 ? scenes[scenes.length - 1].position : -1;
    newEdges.push({
      id: `edge-${lastSceneId}-${endId}`,
      source: lastSceneId,
      target: endId,
      type: 'insertEdge',
      data: {
        onInsert: () => {
          if (projectId) {
            setInsertPosition(lastPosition);
            setShowNewSceneDialog(true);
          }
        }
      },
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [scenes, handleDeleteScene, projectId, insertScene, setShowNewSceneDialog, setInsertPosition, setNodes, setEdges]);

  const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    if (node.id.startsWith('scene-')) {
      const sceneId = node.id.replace('scene-', '');
      navigate(`/project/${projectId}/scene/${sceneId}`);
    }
  }, [navigate, projectId]);

  const handleAddScene = (position: number) => {
    setInsertPosition(position);
    setShowNewSceneDialog(true);
  };

  const handleCreateScene = () => {
    if (newSceneTitle.trim() && projectId) {
      if (insertPosition === -1 || insertPosition >= scenes.length) {
        // Add at end
        createScene(projectId, newSceneTitle.trim());
      } else {
        // Insert at position
        insertScene(projectId, newSceneTitle.trim(), insertPosition);
      }
      setNewSceneTitle('');
      setShowNewSceneDialog(false);
      setInsertPosition(-1);
    }
  };

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Project not found</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <Header
        title={project.title}
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

        {/* Add scene button */}
        <div className="absolute bottom-8 right-8">
          <Button
            size="lg"
            onClick={() => handleAddScene(-1)}
            className="shadow-lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Scene
          </Button>
        </div>
      </div>

      <Dialog open={showNewSceneDialog} onOpenChange={setShowNewSceneDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {insertPosition === -1 ? 'Add New Scene' : `Insert Scene`}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <Input
              placeholder="Scene title"
              value={newSceneTitle}
              onChange={(e) => setNewSceneTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateScene()}
              autoFocus
            />
          </div>
          
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowNewSceneDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateScene} disabled={!newSceneTitle.trim()}>
              {insertPosition === -1 ? 'Add' : 'Insert'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SettingsDialog
        open={showSettingsDialog}
        onOpenChange={setShowSettingsDialog}
      />
    </div>
  );
}

