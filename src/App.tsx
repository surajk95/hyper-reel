import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ProjectsPage } from './pages/ProjectsPage'
import { ProjectCanvasPage } from './pages/ProjectCanvasPage'
import { SceneCanvasPage } from './pages/SceneCanvasPage'
import { Toaster } from './components/ui/toaster'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-black text-white">
        <Routes>
          <Route path="/" element={<ProjectsPage />} />
          <Route path="/project/:projectId" element={<ProjectCanvasPage />} />
          <Route path="/project/:projectId/scene/:sceneId" element={<SceneCanvasPage />} />
        </Routes>
        <Toaster />
      </div>
    </Router>
  )
}

export default App

