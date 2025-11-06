import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ProjectsPage } from './pages/ProjectsPage'
import { ProjectPage } from './pages/ProjectPage'
import { AppLayout } from './components/AppLayout'
import { Toaster } from './components/ui/toaster'

function App() {
  return (
    <Router>
      <div className="h-screen bg-black text-white overflow-hidden">
        <AppLayout>
          <Routes>
            <Route path="/" element={<ProjectsPage />} />
            <Route path="/project/:projectId" element={<ProjectPage />} />
          </Routes>
        </AppLayout>
        <Toaster />
      </div>
    </Router>
  )
}

export default App

