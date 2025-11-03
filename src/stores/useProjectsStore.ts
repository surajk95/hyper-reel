import { create } from 'zustand';
import { Project } from '@/types';
import * as storage from '@/hooks/useStorage';

interface ProjectsState {
  projects: Project[];
  loadProjects: () => void;
  createProject: (title: string, thumbnail?: string) => Project;
  updateProject: (id: string, updates: Partial<Omit<Project, 'id' | 'createdAt'>>) => void;
  deleteProject: (id: string) => void;
}

export const useProjectsStore = create<ProjectsState>((set) => ({
  projects: [],
  
  loadProjects: () => {
    const projects = storage.getProjects();
    set({ projects });
  },
  
  createProject: (title: string, thumbnail?: string) => {
    const project = storage.createProject(title, thumbnail);
    set(state => ({ projects: [...state.projects, project] }));
    return project;
  },
  
  updateProject: (id: string, updates: Partial<Omit<Project, 'id' | 'createdAt'>>) => {
    const updatedProject = storage.updateProject(id, updates);
    if (updatedProject) {
      set(state => ({
        projects: state.projects.map(p => p.id === id ? updatedProject : p)
      }));
    }
  },
  
  deleteProject: (id: string) => {
    storage.deleteProject(id);
    set(state => ({ projects: state.projects.filter(p => p.id !== id) }));
  },
}));

