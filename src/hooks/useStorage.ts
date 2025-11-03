import { Project, Scene, SceneImage, GenerationResult, Settings } from '@/types';
import { generateId } from '@/lib/utils';

const STORAGE_KEYS = {
  PROJECTS: 'hyper-reel-projects',
  SCENES: 'hyper-reel-scenes',
  SCENE_IMAGES: 'hyper-reel-scene-images',
  GENERATION_RESULTS: 'hyper-reel-generation-results',
  SETTINGS: 'hyper-reel-settings',
};

// Helper functions for localStorage
function getFromStorage<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error reading from localStorage key ${key}:`, error);
    return [];
  }
}

function setInStorage<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error writing to localStorage key ${key}:`, error);
  }
}

// Projects
export function getProjects(): Project[] {
  return getFromStorage<Project>(STORAGE_KEYS.PROJECTS);
}

export function getProject(id: string): Project | undefined {
  const projects = getProjects();
  return projects.find(p => p.id === id);
}

export function createProject(title: string, thumbnail?: string): Project {
  const projects = getProjects();
  const newProject: Project = {
    id: generateId(),
    title,
    thumbnail,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  projects.push(newProject);
  setInStorage(STORAGE_KEYS.PROJECTS, projects);
  return newProject;
}

export function updateProject(id: string, updates: Partial<Omit<Project, 'id' | 'createdAt'>>): Project | undefined {
  const projects = getProjects();
  const index = projects.findIndex(p => p.id === id);
  if (index === -1) return undefined;
  
  projects[index] = {
    ...projects[index],
    ...updates,
    updatedAt: Date.now(),
  };
  setInStorage(STORAGE_KEYS.PROJECTS, projects);
  return projects[index];
}

export function deleteProject(id: string): boolean {
  const projects = getProjects();
  const filtered = projects.filter(p => p.id !== id);
  if (filtered.length === projects.length) return false;
  
  setInStorage(STORAGE_KEYS.PROJECTS, filtered);
  
  // Also delete related scenes and images
  const scenes = getScenesByProject(id);
  scenes.forEach(scene => deleteScene(scene.id));
  
  return true;
}

// Scenes
export function getScenes(): Scene[] {
  return getFromStorage<Scene>(STORAGE_KEYS.SCENES);
}

export function getScene(id: string): Scene | undefined {
  const scenes = getScenes();
  return scenes.find(s => s.id === id);
}

export function getScenesByProject(projectId: string): Scene[] {
  const scenes = getScenes();
  return scenes.filter(s => s.projectId === projectId).sort((a, b) => a.position - b.position);
}

export function createScene(projectId: string, title: string, position?: number): Scene {
  const scenes = getScenes();
  const projectScenes = getScenesByProject(projectId);
  
  const newScene: Scene = {
    id: generateId(),
    projectId,
    title,
    position: position ?? projectScenes.length,
    createdAt: Date.now(),
  };
  
  scenes.push(newScene);
  setInStorage(STORAGE_KEYS.SCENES, scenes);
  return newScene;
}

export function updateScene(id: string, updates: Partial<Omit<Scene, 'id' | 'projectId' | 'createdAt'>>): Scene | undefined {
  const scenes = getScenes();
  const index = scenes.findIndex(s => s.id === id);
  if (index === -1) return undefined;
  
  scenes[index] = {
    ...scenes[index],
    ...updates,
  };
  setInStorage(STORAGE_KEYS.SCENES, scenes);
  return scenes[index];
}

export function deleteScene(id: string): boolean {
  const scenes = getScenes();
  const filtered = scenes.filter(s => s.id !== id);
  if (filtered.length === scenes.length) return false;
  
  setInStorage(STORAGE_KEYS.SCENES, filtered);
  
  // Also delete related images
  const images = getImagesByScene(id);
  images.forEach(image => deleteSceneImage(image.id));
  
  return true;
}

export function insertScene(projectId: string, title: string, afterPosition: number): Scene {
  const projectScenes = getScenesByProject(projectId);
  
  // Shift positions of scenes after the insert position
  projectScenes.forEach(scene => {
    if (scene.position > afterPosition) {
      updateScene(scene.id, { position: scene.position + 1 });
    }
  });
  
  return createScene(projectId, title, afterPosition + 1);
}

// Scene Images
export function getSceneImages(): SceneImage[] {
  return getFromStorage<SceneImage>(STORAGE_KEYS.SCENE_IMAGES);
}

export function getSceneImage(id: string): SceneImage | undefined {
  const images = getSceneImages();
  return images.find(i => i.id === id);
}

export function getImagesByScene(sceneId: string): SceneImage[] {
  const images = getSceneImages();
  return images.filter(i => i.sceneId === sceneId).sort((a, b) => a.position - b.position);
}

export function createSceneImage(sceneId: string, title: string, position?: number): SceneImage {
  const images = getSceneImages();
  const sceneImages = getImagesByScene(sceneId);
  
  const newImage: SceneImage = {
    id: generateId(),
    sceneId,
    title,
    position: position ?? sceneImages.length,
    selectedOutputIndex: 0,
    createdAt: Date.now(),
  };
  
  images.push(newImage);
  setInStorage(STORAGE_KEYS.SCENE_IMAGES, images);
  return newImage;
}

export function updateSceneImage(id: string, updates: Partial<Omit<SceneImage, 'id' | 'sceneId' | 'createdAt'>>): SceneImage | undefined {
  const images = getSceneImages();
  const index = images.findIndex(i => i.id === id);
  if (index === -1) return undefined;
  
  images[index] = {
    ...images[index],
    ...updates,
  };
  setInStorage(STORAGE_KEYS.SCENE_IMAGES, images);
  return images[index];
}

export function deleteSceneImage(id: string): boolean {
  const images = getSceneImages();
  const filtered = images.filter(i => i.id !== id);
  if (filtered.length === images.length) return false;
  
  setInStorage(STORAGE_KEYS.SCENE_IMAGES, filtered);
  
  // Also delete related generation results
  const results = getGenerationResultsByImage(id);
  results.forEach(result => deleteGenerationResult(result.imageId, result.timestamp));
  
  return true;
}

export function insertSceneImage(sceneId: string, title: string, afterPosition: number): SceneImage {
  const sceneImages = getImagesByScene(sceneId);
  
  // Shift positions of images after the insert position
  sceneImages.forEach(image => {
    if (image.position > afterPosition) {
      updateSceneImage(image.id, { position: image.position + 1 });
    }
  });
  
  return createSceneImage(sceneId, title, afterPosition + 1);
}

// Generation Results
export function getGenerationResults(): GenerationResult[] {
  return getFromStorage<GenerationResult>(STORAGE_KEYS.GENERATION_RESULTS);
}

export function getGenerationResultsByImage(imageId: string): GenerationResult[] {
  const results = getGenerationResults();
  return results.filter(r => r.imageId === imageId).sort((a, b) => b.timestamp - a.timestamp);
}

export function addGenerationResult(result: GenerationResult): void {
  const results = getGenerationResults();
  results.push(result);
  setInStorage(STORAGE_KEYS.GENERATION_RESULTS, results);
}

export function deleteGenerationResult(imageId: string, timestamp: number): boolean {
  const results = getGenerationResults();
  const filtered = results.filter(r => !(r.imageId === imageId && r.timestamp === timestamp));
  if (filtered.length === results.length) return false;
  
  setInStorage(STORAGE_KEYS.GENERATION_RESULTS, filtered);
  return true;
}

export function clearGenerationResults(imageId: string): void {
  const results = getGenerationResults();
  const filtered = results.filter(r => r.imageId !== imageId);
  setInStorage(STORAGE_KEYS.GENERATION_RESULTS, filtered);
}

// Settings
export function getSettings(): Settings {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Error reading settings from localStorage:', error);
    return {};
  }
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving settings to localStorage:', error);
  }
}

export function getApiKey(): string | undefined {
  const settings = getSettings();
  return settings.wavespeedApiKey;
}

export function setApiKey(apiKey: string): void {
  const settings = getSettings();
  settings.wavespeedApiKey = apiKey;
  saveSettings(settings);
}

