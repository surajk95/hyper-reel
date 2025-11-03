import { create } from 'zustand';
import { Scene } from '@/types';
import * as storage from '@/hooks/useStorage';

interface ScenesState {
  scenes: Scene[];
  loadScenesByProject: (projectId: string) => void;
  createScene: (projectId: string, title: string, position?: number) => Scene;
  insertScene: (projectId: string, title: string, afterPosition: number) => Scene;
  updateScene: (id: string, updates: Partial<Omit<Scene, 'id' | 'projectId' | 'createdAt'>>) => void;
  deleteScene: (id: string) => void;
}

export const useScenesStore = create<ScenesState>((set) => ({
  scenes: [],
  
  loadScenesByProject: (projectId: string) => {
    const scenes = storage.getScenesByProject(projectId);
    set({ scenes });
  },
  
  createScene: (projectId: string, title: string, position?: number) => {
    const scene = storage.createScene(projectId, title, position);
    set(state => ({ scenes: [...state.scenes, scene].sort((a, b) => a.position - b.position) }));
    return scene;
  },
  
  insertScene: (projectId: string, title: string, afterPosition: number) => {
    const scene = storage.insertScene(projectId, title, afterPosition);
    // Reload to get updated positions
    const scenes = storage.getScenesByProject(projectId);
    set({ scenes });
    return scene;
  },
  
  updateScene: (id: string, updates: Partial<Omit<Scene, 'id' | 'projectId' | 'createdAt'>>) => {
    const updatedScene = storage.updateScene(id, updates);
    if (updatedScene) {
      set(state => ({
        scenes: state.scenes.map(s => s.id === id ? updatedScene : s).sort((a, b) => a.position - b.position)
      }));
    }
  },
  
  deleteScene: (id: string) => {
    storage.deleteScene(id);
    set(state => ({ scenes: state.scenes.filter(s => s.id !== id) }));
  },
}));

