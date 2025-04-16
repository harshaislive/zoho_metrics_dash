import React, { useState, useRef } from 'react';
import { generateAIReport, generatePDF, formatReportAsHTML } from '../../services/reportService';
import { Project } from '../../services/metricsService';
import { ProjectMetrics } from '../../context/ProjectContext';

interface ProjectReportProps {
  project: Project;
  projectMetrics: ProjectMetrics;
  onClose: () => void;
}

const ProjectReport: React.FC<ProjectReportProps> = ({ project, projectMetrics, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [reportHtml, setReportHtml] = useState<string | null>(null);
  const reportContainerRef = useRef<HTMLDivElement>(null);

  const generateReport = async () => {
    setIsLoading(true);
    
    try {
      // Combine project data with metrics
      const projectData = {
        ...project,
        metrics: projectMetrics
      };
      
      // Generate AI report
      const reportText = await generateAIReport(projectData);
      
      if (reportText) {
        // Format as HTML
        const html = formatReportAsHTML(reportText, projectData);
        setReportHtml(html);
        
        // Wait for the content to be rendered, then add event listener to fix height
        setTimeout(() => {
          if (reportContainerRef.current) {
            const iframe = reportContainerRef.current.querySelector('iframe');
            if (iframe) {
              const resizeIframe = () => {
                if (iframe.contentWindow) {
                  iframe.style.height = `${iframe.contentWindow.document.body.scrollHeight + 20}px`;
                }
              };
              
              iframe.addEventListener('load', resizeIframe);
              // Backup timeout to ensure correct height
              setTimeout(resizeIframe, 500);
            }
          }
        }, 100);
      }
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadPdf = () => {
    // The iframe content is already using the id "report-iframe-content"
    generatePDF('report-iframe-content', `${project.name}_Report`);
  };

  // Function to create a safe iframe with the report content
  const createReportIframe = (htmlContent: string) => {
    return (
      <iframe
        title="Project Report"
        srcDoc={htmlContent}
        style={{ border: 'none', width: '100%', height: '800px' }}
        className="w-full min-h-[800px]"
        onLoad={(e) => {
          const iframe = e.currentTarget;
          if (iframe && iframe.contentWindow) {
            // Dynamically adjust iframe height to fit content
            iframe.style.height = `${iframe.contentWindow.document.body.scrollHeight + 40}px`;
            
            // Check if fonts are loaded
            if ('fonts' in document) {
              try {
                const iframeDocument = iframe.contentWindow?.document as Document;
                if (iframeDocument && 'fonts' in iframeDocument) {
                  const fontsReady = iframeDocument.fonts.ready;
                  fontsReady.then(() => {
                    // Adjust height again after fonts are loaded
                    setTimeout(() => {
                      iframe.style.height = `${iframe.contentWindow!.document.body.scrollHeight + 40}px`;
                    }, 100);
                  });
                }
              } catch (e) {
                console.error('Error accessing iframe fonts:', e);
              }
            }
          }
        }}
      />
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-11/12 max-w-4xl max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center z-10">
          <h2 className="text-xl font-semibold text-neutral-800">Project Report</h2>
          <div className="flex space-x-2">
            {reportHtml && (
              <button
                onClick={downloadPdf}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                Download PDF
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-neutral-200 text-neutral-800 rounded-md hover:bg-neutral-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {!reportHtml && !isLoading && (
            <div className="text-center py-12">
              <p className="mb-6 text-neutral-600">Generate an AI-powered report based on your project metrics</p>
              <button
                onClick={generateReport}
                className="px-6 py-3 bg-accent-earth text-white rounded-md hover:bg-accent-earth/90 transition-colors flex items-center mx-auto"
              >
                <span className="mr-2">⚡</span>
                <span>Generate AI Report</span>
              </button>
            </div>
          )}
          
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-earth mb-4"></div>
              <p className="text-neutral-600">Generating your report...</p>
            </div>
          )}
          
          {reportHtml && (
            <div ref={reportContainerRef} className="report-iframe-container">
              {createReportIframe(reportHtml)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectReport; 