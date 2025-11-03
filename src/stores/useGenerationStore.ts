import { create } from 'zustand';
import { GenerationResult } from '@/types';
import * as storage from '@/hooks/useStorage';

interface GenerationState {
  results: GenerationResult[];
  isGenerating: boolean;
  loadResultsByImage: (imageId: string) => void;
  addResult: (result: GenerationResult) => void;
  setGenerating: (isGenerating: boolean) => void;
  clearResults: (imageId: string) => void;
}

export const useGenerationStore = create<GenerationState>((set) => ({
  results: [],
  isGenerating: false,
  
  loadResultsByImage: (imageId: string) => {
    const results = storage.getGenerationResultsByImage(imageId);
    set({ results });
  },
  
  addResult: (result: GenerationResult) => {
    storage.addGenerationResult(result);
    set(state => ({ results: [result, ...state.results] }));
  },
  
  setGenerating: (isGenerating: boolean) => {
    set({ isGenerating });
  },
  
  clearResults: (imageId: string) => {
    storage.clearGenerationResults(imageId);
    set(state => ({ results: state.results.filter(r => r.imageId !== imageId) }));
  },
}));

