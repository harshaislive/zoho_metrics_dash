import { ReactNode, useState } from 'react';
import Header from './Header';
import { useProject } from '../../context/ProjectContext';
import { useUser } from '../../context/UserContext';
import ProjectReport from '../reports/ProjectReport';
import UserReport from '../reports/UserReport';
import { useLocation } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { selectedProjectId, selectedProject, projectMetrics } = useProject();
  const { selectedUserId, selectedUser, userMetrics } = useUser();
  const [showProjectReportModal, setShowProjectReportModal] = useState(false);
  const [showUserReportModal, setShowUserReportModal] = useState(false);
  const location = useLocation();
  
  const handleGenerateProjectReport = () => {
    if (selectedProject && projectMetrics) {
      setShowProjectReportModal(true);
    }
  };

  const handleGenerateUserReport = () => {
    if (selectedUser && userMetrics) {
      // Show the user report modal instead of navigating
      setShowUserReportModal(true);
    }
  };
  
  // Check if we're on the projects page
  const isProjectsPage = location.pathname.startsWith('/projects');
  
  // Check if we're on the users page
  const isUsersPage = location.pathname.startsWith('/users');
  
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header />
      
      {/* Floating Generate Report Button for Projects - Only shown when project is selected */}
      {isProjectsPage && selectedProjectId && (
        <div className="fixed bottom-20 right-8 z-50">
          <button
            onClick={handleGenerateProjectReport}
            className="bg-neutral-800 hover:bg-neutral-700 text-white font-medium py-2 px-5 rounded-full shadow-lg flex items-center space-x-2 transition-all hover:scale-105"
          >
            <span>⚡</span>
            <span>Generate Report</span>
          </button>
        </div>
      )}
      
      {/* Floating Generate Report Button for Users - Only shown when user is selected */}
      {isUsersPage && selectedUserId && (
        <div className="fixed bottom-20 right-8 z-50">
          <button
            onClick={handleGenerateUserReport}
            className="bg-neutral-800 hover:bg-neutral-700 text-white font-medium py-2 px-5 rounded-full shadow-lg flex items-center space-x-2 transition-all hover:scale-105"
          >
            <span>⚡</span>
            <span>Generate Report</span>
          </button>
        </div>
      )}
      
      <main className="flex-1 overflow-auto p-4 md:p-6">
        {children}
      </main>
      
      {/* Project Report Modal */}
      {showProjectReportModal && selectedProject && projectMetrics && (
        <ProjectReport 
          project={selectedProject} 
          projectMetrics={projectMetrics} 
          onClose={() => setShowProjectReportModal(false)} 
        />
      )}
      
      {/* User Report Modal */}
      {showUserReportModal && selectedUser && userMetrics && (
        <UserReport 
          user={selectedUser} 
          userMetrics={userMetrics} 
          onClose={() => setShowUserReportModal(false)} 
        />
      )}
      
      <footer className="bg-white border-t border-gray-200 py-4 text-center text-sm text-gray-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          Beforest Project Metrics Dashboard © {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
} 