import { create } from 'zustand';
import { SceneImage } from '@/types';
import * as storage from '@/hooks/useStorage';

interface SceneImagesState {
  images: SceneImage[];
  loadImagesByScene: (sceneId: string) => void;
  createImage: (sceneId: string, title: string, position?: number) => SceneImage;
  insertImage: (sceneId: string, title: string, afterPosition: number) => SceneImage;
  updateImage: (id: string, updates: Partial<Omit<SceneImage, 'id' | 'sceneId' | 'createdAt'>>) => void;
  deleteImage: (id: string) => void;
}

export const useSceneImagesStore = create<SceneImagesState>((set) => ({
  images: [],
  
  loadImagesByScene: (sceneId: string) => {
    const images = storage.getImagesByScene(sceneId);
    set({ images });
  },
  
  createImage: (sceneId: string, title: string, position?: number) => {
    const image = storage.createSceneImage(sceneId, title, position);
    set(state => ({ images: [...state.images, image].sort((a, b) => a.position - b.position) }));
    return image;
  },
  
  insertImage: (sceneId: string, title: string, afterPosition: number) => {
    const image = storage.insertSceneImage(sceneId, title, afterPosition);
    // Reload to get updated positions
    const images = storage.getImagesByScene(sceneId);
    set({ images });
    return image;
  },
  
  updateImage: (id: string, updates: Partial<Omit<SceneImage, 'id' | 'sceneId' | 'createdAt'>>) => {
    const updatedImage = storage.updateSceneImage(id, updates);
    if (updatedImage) {
      set(state => ({
        images: state.images.map(i => i.id === id ? updatedImage : i).sort((a, b) => a.position - b.position)
      }));
    }
  },
  
  deleteImage: (id: string) => {
    storage.deleteSceneImage(id);
    set(state => ({ images: state.images.filter(i => i.id !== id) }));
  },
}));

