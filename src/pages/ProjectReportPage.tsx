import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import { formatReportAsHTML, generateAIReport, generatePDF } from '../services/reportService';

// Project report page that renders when user navigates to /projects/:projectId/report
export default function ProjectReportPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { projects, projectMetrics } = useProject();
  const [reportHTML, setReportHTML] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [generatingPDF, setGeneratingPDF] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Find the project based on the route parameter
  const project = projects.find(p => p.id === projectId);

  useEffect(() => {
    const generateReport = async () => {
      if (!project || !projectMetrics) {
        setError('Project data not found');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Get metrics for this specific project
        const metrics = projectMetrics[project.id];
        if (!metrics) {
          setError('Project metrics not found');
          setLoading(false);
          return;
        }

        // Generate AI report
        const reportText = await generateAIReport({
          id: project.id,
          name: project.name,
          status: project.status,
          metrics: metrics
        });
        
        if (reportText) {
          // Format the report as HTML
          const html = formatReportAsHTML(reportText, {
            id: project.id,
            name: project.name,
            status: project.status,
            metrics: metrics
          });
          setReportHTML(html);
        }
      } catch (error) {
        console.error('Error generating project report:', error);
        setError('Failed to generate report. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      generateReport();
    }
  }, [projectId, project, projectMetrics]);

  const handleDownloadPDF = async () => {
    if (!reportHTML) return;

    setGeneratingPDF(true);
    try {
      await generatePDF('report-iframe-content', `Project_Report_${project?.name.replace(/\s+/g, '_')}`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setGeneratingPDF(false);
    }
  };

  return (
    <div className="project-report-page">
      <div className="report-header flex justify-between items-center mb-6">
        <Link to="/projects">
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Projects
          </button>
        </Link>
        {reportHTML && (
          <button 
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${loading || generatingPDF ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={handleDownloadPDF}
            disabled={loading || generatingPDF}
          >
            {generatingPDF ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating PDF...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download PDF
              </>
            )}
          </button>
        )}
      </div>

      <div className="bg-white shadow overflow-hidden rounded-lg p-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center">
              <svg className="animate-spin h-10 w-10 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="mt-2 text-sm text-gray-600">Generating project report...</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-500">{error}</div>
        ) : reportHTML ? (
          <div className="report-iframe-container">
            <iframe
              title="Project Report"
              srcDoc={reportHTML}
              className="report-iframe"
              style={{ width: '100%', height: '800px', border: 'none' }}
            />
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">No report data available.</div>
        )}
      </div>
    </div>
  );
} 