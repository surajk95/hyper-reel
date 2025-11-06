import { create } from 'zustand';
import { Settings } from '@/types';
import * as storage from '@/services/storage';

interface SettingsState {
  settings: Settings;
  loadSettings: () => void;
  saveSettings: (settings: Settings) => void;
  setApiKey: (apiKey: string) => void;
  getApiKey: () => string | undefined;
  setSidebarCollapsed: (collapsed: boolean) => void;
  getSidebarCollapsed: () => boolean;
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
  
  setSidebarCollapsed: (collapsed: boolean) => {
    const currentSettings = get().settings;
    const newSettings = { ...currentSettings, mediaViewerSidebarCollapsed: collapsed };
    storage.saveSettings(newSettings);
    set({ settings: newSettings });
  },
  
  getSidebarCollapsed: () => {
    return get().settings.mediaViewerSidebarCollapsed ?? false;
  },
}));

