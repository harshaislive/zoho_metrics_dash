import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import ProjectsReport from './pages/ProjectsReport'
import UsersReport from './pages/UsersReport'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/projects" replace />} />
          <Route path="/projects" element={<ProjectsReport />} />
          <Route path="/users" element={<UsersReport />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
