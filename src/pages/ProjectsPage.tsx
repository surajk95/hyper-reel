import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { ProjectCard } from '@/components/ProjectCard';
import { useProjectsStore } from '@/stores/useProjectsStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SettingsDialog } from '@/components/SettingsDialog';

export function ProjectsPage() {
  const navigate = useNavigate();
  const { projects, loadProjects, createProject } = useProjectsStore();
  const { loadSettings } = useSettingsStore();
  
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');

  useEffect(() => {
    loadProjects();
    loadSettings();
  }, [loadProjects, loadSettings]);

  const handleCreateProject = () => {
    if (newProjectTitle.trim()) {
      const project = createProject(newProjectTitle.trim());
      setNewProjectTitle('');
      setShowNewProjectDialog(false);
      navigate(`/project/${project.id}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header onSettingsClick={() => setShowSettingsDialog(true)} />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          <ProjectCard
            isNew
            onClick={() => setShowNewProjectDialog(true)}
          />
          
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => navigate(`/project/${project.id}`)}
            />
          ))}
        </div>
      </main>

      <Dialog open={showNewProjectDialog} onOpenChange={setShowNewProjectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <Input
              placeholder="Project title"
              value={newProjectTitle}
              onChange={(e) => setNewProjectTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
              autoFocus
            />
          </div>
          
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowNewProjectDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateProject} disabled={!newProjectTitle.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SettingsDialog
        open={showSettingsDialog}
        onOpenChange={setShowSettingsDialog}
      />
    </div>
  );
}

