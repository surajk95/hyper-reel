import { create } from 'zustand';
import { Settings } from '@/types';
import * as storage from '@/hooks/useStorage';

interface SettingsState {
  settings: Settings;
  loadSettings: () => void;
  saveSettings: (settings: Settings) => void;
  setApiKey: (apiKey: string) => void;
  getApiKey: () => string | undefined;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: {},
  
  loadSettings: () => {
    const settings = storage.getSettings();
    set({ settings });
  },
  
  saveSettings: (settings: Settings) => {
    storage.saveSettings(settings);
    set({ settings });
  },
  
  setApiKey: (apiKey: string) => {
    storage.setApiKey(apiKey);
    set(state => ({ settings: { ...state.settings, wavespeedApiKey: apiKey } }));
  },
  
  getApiKey: () => {
    return get().settings.wavespeedApiKey;
  },
}));

