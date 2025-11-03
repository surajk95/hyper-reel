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
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Header } from '@/components/Header';
import { SceneNode, SceneNodeData } from '@/components/SceneNode';
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

const nodeTypes: NodeTypes = {
  sceneNode: SceneNode,
};

export function ProjectCanvasPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { projects } = useProjectsStore();
  const { scenes, loadScenesByProject, createScene, insertScene } = useScenesStore();
  const { loadSettings } = useSettingsStore();
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showNewSceneDialog, setShowNewSceneDialog] = useState(false);
  const [newSceneTitle, setNewSceneTitle] = useState('');
  const [insertPosition, setInsertPosition] = useState<number>(-1);

  const project = projects.find(p => p.id === projectId);

  useEffect(() => {
    if (projectId) {
      loadScenesByProject(projectId);
      loadSettings();
    }
  }, [projectId, loadScenesByProject, loadSettings]);

  useEffect(() => {
    if (!scenes.length) return;

    const newNodes: Node<SceneNodeData>[] = [];
    const newEdges: Edge[] = [];
    
    const spacing = 300;
    
    // Start node
    newNodes.push({
      id: 'start',
      type: 'input',
      data: { label: 'Start' } as any,
      position: { x: 0, y: 200 },
      draggable: false,
      style: {
        background: '#1f2937',
        color: 'white',
        border: '1px solid #374151',
      },
    });

    // Scene nodes
    scenes.forEach((scene, index) => {
      const nodeId = `scene-${scene.id}`;
      newNodes.push({
        id: nodeId,
        type: 'sceneNode',
        data: scene,
        position: { x: spacing * (index + 1), y: 200 },
      });

      // Connect from previous node
      const sourceId = index === 0 ? 'start' : `scene-${scenes[index - 1].id}`;
      newEdges.push({
        id: `edge-${sourceId}-${nodeId}`,
        source: sourceId,
        target: nodeId,
        type: 'smoothstep',
        style: { stroke: '#4b5563' },
      });
    });

    // End node
    const endId = 'end';
    newNodes.push({
      id: endId,
      type: 'output',
      data: { label: 'End' } as any,
      position: { x: spacing * (scenes.length + 1), y: 200 },
      draggable: false,
      style: {
        background: '#1f2937',
        color: 'white',
        border: '1px solid #374151',
      },
    });

    // Connect last scene to end
    const lastSceneId = scenes.length > 0 ? `scene-${scenes[scenes.length - 1].id}` : 'start';
    newEdges.push({
      id: `edge-${lastSceneId}-${endId}`,
      source: lastSceneId,
      target: endId,
      type: 'smoothstep',
      style: { stroke: '#4b5563' },
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [scenes, setNodes, setEdges]);

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
    <div className="h-screen flex flex-col">
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

