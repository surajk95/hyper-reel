import { create } from 'zustand';
import { MediaItem } from '@/types';
import * as storage from '@/services/storage';

interface MediaState {
  mediaItems: MediaItem[];
  isLoading: boolean;
  loadMediaByProject: (projectId: string) => Promise<void>;
  createGeneration: (projectId: string, data: Omit<MediaItem, 'id' | 'projectId' | 'createdAt' | 'updatedAt' | 'type'>) => Promise<MediaItem>;
  createUpload: (projectId: string, imageData: string) => Promise<MediaItem>;
  updateMedia: (id: string, updates: Partial<Omit<MediaItem, 'id' | 'projectId' | 'createdAt'>>) => Promise<void>;
  deleteMedia: (id: string) => Promise<boolean>;
  getMediaById: (id: string) => MediaItem | undefined;
}

export const useMediaStore = create<MediaState>((set, get) => ({
  mediaItems: [],
  isLoading: false,

  loadMediaByProject: async (projectId: string) => {
    set({ isLoading: true });
    try {
      const items = await storage.getMediaByProject(projectId);
      set({ mediaItems: items, isLoading: false });
    } catch (error) {
      console.error('Failed to load media:', error);
      set({ isLoading: false });
    }
  },

  createGeneration: async (projectId: string, data) => {
    const newItem = await storage.createMediaItem(projectId, {
      ...data,
      type: 'generation',
    });
    set((state) => ({ mediaItems: [newItem, ...state.mediaItems] }));
    return newItem;
  },

  createUpload: async (projectId: string, imageData: string) => {
    const newItem = await storage.createMediaItem(projectId, {
      type: 'upload',
      imageData,
    });
    set((state) => ({ mediaItems: [newItem, ...state.mediaItems] }));
    return newItem;
  },

  updateMedia: async (id: string, updates) => {
    const updatedItem = await storage.updateMediaItem(id, updates);
    if (updatedItem) {
      set((state) => ({
        mediaItems: state.mediaItems.map((item) => 
          item.id === id ? updatedItem : item
        ),
      }));
    }
  },

  deleteMedia: async (id: string) => {
    const success = await storage.deleteMediaItem(id);
    if (success) {
      set((state) => ({
        mediaItems: state.mediaItems.filter((item) => item.id !== id),
      }));
    }
    return success;
  },

  getMediaById: (id: string) => {
    return get().mediaItems.find((item) => item.id === id);
  },
}));

