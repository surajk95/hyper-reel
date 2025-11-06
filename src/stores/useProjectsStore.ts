import { create } from 'zustand';
import { Project } from '@/types';
import * as storage from '@/services/storage';

interface ProjectsState {
  projects: Project[];
  loadProjects: () => Promise<void>;
  createProject: (title: string, thumbnail?: string) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Omit<Project, 'id' | 'createdAt'>>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
}

export const useProjectsStore = create<ProjectsState>((set) => ({
  projects: [],
  
  loadProjects: async () => {
    const projects = await storage.getProjects();
    set({ projects });
  },
  
  createProject: async (title: string, thumbnail?: string) => {
    const project = await storage.createProject(title, thumbnail);
    set(state => ({ projects: [project, ...state.projects] }));
    return project;
  },
  
  updateProject: async (id: string, updates: Partial<Omit<Project, 'id' | 'createdAt'>>) => {
    const updatedProject = await storage.updateProject(id, updates);
    if (updatedProject) {
      set(state => ({
        projects: state.projects.map(p => p.id === id ? updatedProject : p)
      }));
    }
  },
  
  deleteProject: async (id: string) => {
    await storage.deleteProject(id);
    set(state => ({ projects: state.projects.filter(p => p.id !== id) }));
  },
}));

