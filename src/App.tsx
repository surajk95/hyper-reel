import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ProjectsPage } from './pages/ProjectsPage'
import { ProjectPage } from './pages/ProjectPage'
import { AppLayout } from './components/AppLayout'
import { Toaster } from './components/ui/toaster'
import { useSettingsStore } from './stores/useSettingsStore'

function App() {
  const { loadSettings } = useSettingsStore()

  // Load settings from localStorage on app start
  useEffect(() => {
    loadSettings()
  }, [loadSettings])

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

