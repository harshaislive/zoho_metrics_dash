import { Link } from 'react-router-dom';

interface ProjectReportButtonProps {
  projectId: string;
  disabled?: boolean;
}

// Button to generate project reports - to be displayed on Projects page
export const ProjectReportButton: React.FC<ProjectReportButtonProps> = ({ 
  projectId, 
  disabled = false 
}) => {
  return (
    <Link to={`/projects/${projectId}/report`}>
      <button 
        className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        disabled={disabled}
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Generate Report
      </button>
    </Link>
  );
}; 