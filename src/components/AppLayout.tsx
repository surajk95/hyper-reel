import { useState, useEffect, ReactNode } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { MediaBrowser } from './MediaBrowser';
import { GenerationResult, Scene, SceneImage } from '@/types';
import * as storage from '@/hooks/useStorage';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [allResults, setAllResults] = useState<GenerationResult[]>([]);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [sceneImages, setSceneImages] = useState<SceneImage[]>([]);

  // Load all data from storage
  useEffect(() => {
    const loadAllData = () => {
      const allGenerationResults: GenerationResult[] = [];
      
      // Get all images from storage
      const allImages = storage.getSceneImages();
      setSceneImages(allImages);
      
      allImages.forEach(image => {
        const results = storage.getGenerationResultsByImage(image.id);
        if (results.length > 0) {
          allGenerationResults.push(...results);
        }
      });
      
      setAllResults(allGenerationResults);
      
      // Get all scenes
      const allScenes = storage.getScenes();
      setScenes(allScenes);
    };

    loadAllData();

    // Set up an interval to refresh the data periodically
    const interval = setInterval(loadAllData, 2000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <PanelGroup direction="vertical" className="h-screen">
      {/* Main Content Panel */}
      <Panel defaultSize={70} minSize={1} collapsible>
        <div className="h-full overflow-hidden">
          {children}
        </div>
      </Panel>

      {/* Resize Handle */}
      <PanelResizeHandle className="h-1 bg-gray-700 hover:bg-gray-600 transition-colors cursor-row-resize" />

      {/* Media Browser Panel */}
      <Panel defaultSize={30} minSize={1} collapsible>
        <MediaBrowser 
          allResults={allResults} 
          scenes={scenes}
          sceneImages={sceneImages}
        />
      </Panel>
    </PanelGroup>
  );
}

