import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { ProjectCard } from '@/components/ProjectCard';
import { useProjectsStore } from '@/stores/useProjectsStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { SettingsDialog } from '@/components/SettingsDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Project } from '@/types';

export function ProjectsPage() {
  const navigate = useNavigate();
  const { projects, loadProjects, createProject, deleteProject } = useProjectsStore();
  const { loadSettings } = useSettingsStore();
  const { toast } = useToast();
  
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [hasCheckedProjects, setHasCheckedProjects] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  useEffect(() => {
    const initializeProjects = async () => {
      await loadProjects();
      await loadSettings();
      setHasCheckedProjects(true);
    };
    initializeProjects();
  }, [loadProjects, loadSettings]);

  // Auto-create first project if none exist
  useEffect(() => {
    if (hasCheckedProjects && projects.length === 0) {
      handleCreateProject();
    }
  }, [hasCheckedProjects, projects.length]);

  const handleCreateProject = async () => {
    const project = await createProject('Untitled Project');
    navigate(`/project/${project.id}`);
  };

  const handleDeleteRequest = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setProjectToDelete(project);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;
    
    await deleteProject(projectToDelete.id);
    setShowDeleteConfirm(false);
    setProjectToDelete(null);
    
    toast({
      title: 'Project Deleted',
      description: `"${projectToDelete.title}" has been deleted`,
    });

    // If no projects left, create a new one
    await loadProjects();
  };

  return (
    <div className="h-full flex flex-col">
      <Header onSettingsClick={() => setShowSettingsDialog(true)} />
      
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-1 py-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            <ProjectCard
              isNew
              onClick={handleCreateProject}
            />
            
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => navigate(`/project/${project.id}`)}
                onDelete={(e) => handleDeleteRequest(e, project)}
              />
            ))}
          </div>
        </div>
      </main>

      <SettingsDialog
        open={showSettingsDialog}
        onOpenChange={setShowSettingsDialog}
      />

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{projectToDelete?.title}"? This will also delete all media in the project. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

