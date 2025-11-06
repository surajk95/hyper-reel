import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Project, MediaItem } from '@/types';

interface HyperReelDB extends DBSchema {
  projects: {
    key: string;
    value: Project;
    indexes: { 'by-updated': number };
  };
  media: {
    key: string;
    value: MediaItem;
    indexes: { 'by-project': string; 'by-created': number };
  };
}

const DB_NAME = 'hyper-reel-db';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<HyperReelDB> | null = null;

async function getDB(): Promise<IDBPDatabase<HyperReelDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<HyperReelDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Projects store
      if (!db.objectStoreNames.contains('projects')) {
        const projectStore = db.createObjectStore('projects', { keyPath: 'id' });
        projectStore.createIndex('by-updated', 'updatedAt');
      }

      // Media store
      if (!db.objectStoreNames.contains('media')) {
        const mediaStore = db.createObjectStore('media', { keyPath: 'id' });
        mediaStore.createIndex('by-project', 'projectId');
        mediaStore.createIndex('by-created', 'createdAt');
      }
    },
  });

  return dbInstance;
}

// Project Operations
export async function getProjects(): Promise<Project[]> {
  const db = await getDB();
  const projects = await db.getAllFromIndex('projects', 'by-updated');
  return projects.reverse(); // Most recently updated first
}

export async function getProject(id: string): Promise<Project | undefined> {
  const db = await getDB();
  return await db.get('projects', id);
}

export async function createProject(title: string, thumbnail?: string): Promise<Project> {
  const db = await getDB();
  const newProject: Project = {
    id: generateId(),
    title,
    thumbnail,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await db.add('projects', newProject);
  return newProject;
}

export async function updateProject(
  id: string,
  updates: Partial<Omit<Project, 'id' | 'createdAt'>>
): Promise<Project | undefined> {
  const db = await getDB();
  const project = await db.get('projects', id);
  if (!project) return undefined;

  const updatedProject = {
    ...project,
    ...updates,
    updatedAt: Date.now(),
  };
  await db.put('projects', updatedProject);
  return updatedProject;
}

export async function deleteProject(id: string): Promise<boolean> {
  const db = await getDB();
  const project = await db.get('projects', id);
  if (!project) return false;

  await db.delete('projects', id);

  // Delete all media for this project
  const mediaItems = await getMediaByProject(id);
  for (const item of mediaItems) {
    await db.delete('media', item.id);
  }

  return true;
}

// Media Operations
export async function getMediaByProject(projectId: string): Promise<MediaItem[]> {
  const db = await getDB();
  const items = await db.getAllFromIndex('media', 'by-project', projectId);
  return items.sort((a, b) => b.createdAt - a.createdAt); // Most recent first
}

export async function getMediaItem(id: string): Promise<MediaItem | undefined> {
  const db = await getDB();
  return await db.get('media', id);
}

export async function createMediaItem(
  projectId: string,
  data: Omit<MediaItem, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>
): Promise<MediaItem> {
  const db = await getDB();
  const newItem: MediaItem = {
    id: generateId(),
    projectId,
    ...data,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await db.add('media', newItem);
  return newItem;
}

export async function updateMediaItem(
  id: string,
  updates: Partial<Omit<MediaItem, 'id' | 'projectId' | 'createdAt'>>
): Promise<MediaItem | undefined> {
  const db = await getDB();
  const item = await db.get('media', id);
  if (!item) return undefined;

  const updatedItem = {
    ...item,
    ...updates,
    updatedAt: Date.now(),
  };
  await db.put('media', updatedItem);
  return updatedItem;
}

export async function deleteMediaItem(id: string): Promise<boolean> {
  const db = await getDB();
  const item = await db.get('media', id);
  if (!item) return false;

  await db.delete('media', id);

  // Clean up references in other media items' inputImageIds
  const allMedia = await getMediaByProject(item.projectId);
  for (const mediaItem of allMedia) {
    if (mediaItem.inputImageIds && mediaItem.inputImageIds.includes(id)) {
      const updatedInputIds = mediaItem.inputImageIds.filter((imgId) => imgId !== id);
      await updateMediaItem(mediaItem.id, { inputImageIds: updatedInputIds });
    }
  }

  return true;
}

// Settings (using localStorage for simplicity)
const SETTINGS_KEY = 'hyper-reel-settings';

export interface Settings {
  wavespeedApiKey?: string;
  mediaViewerSidebarCollapsed?: boolean;
}

export function getSettings(): Settings {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Error reading settings from localStorage:', error);
    return {};
  }
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
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

// Utility function to generate unique IDs
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

