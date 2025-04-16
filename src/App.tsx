import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import ProjectsReport from './pages/ProjectsReport'
import UsersReport from './pages/UsersReport'
import ProjectReportPage from './pages/ProjectReportPage'
import { ProjectProvider } from './context/ProjectContext'
import { UserProvider } from './context/UserContext'

function App() {
  return (
    <ProjectProvider>
      <UserProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Navigate to="/projects" replace />} />
              <Route path="/projects" element={<ProjectsReport />} />
              <Route path="/users" element={<UsersReport />} />
              <Route path="/projects/:projectId/report" element={<ProjectReportPage />} />
            </Routes>
          </Layout>
        </Router>
      </UserProvider>
    </ProjectProvider>
  )
}

export default App
