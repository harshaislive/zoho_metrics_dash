import React, { useState, useRef } from 'react';
import { generateUserAIReport, formatUserReportAsHTML, generateUserPDF, UserReportData } from '../../services/userReportService';
import { User } from '../../context/UserContext';
import { UserMetrics } from '../../context/UserContext';

interface UserReportProps {
  user: User;
  userMetrics: UserMetrics;
  onClose: () => void;
}

const UserReport: React.FC<UserReportProps> = ({ user, userMetrics, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [reportHtml, setReportHtml] = useState<string | null>(null);
  const reportContainerRef = useRef<HTMLDivElement>(null);

  const generateReport = async () => {
    setIsLoading(true);
    
    try {
      // Prepare user data for the report
      const userData: UserReportData = {
        id: user.id,
        name: user.full_name,
        email: user.email,
        role: user.role,
        status: user.status || 'Active',
        metrics: {
          utilization: {
            rate: userMetrics.utilization.utilization_rate,
            active_tasks: userMetrics.utilization.total_open_tasks - userMetrics.utilization.stale_tasks,
            open_tasks: userMetrics.utilization.total_open_tasks
          },
          timeliness: {
            timeliness_rate: parseFloat(userMetrics.timeliness.timeliness_rate.replace('%', '')),
            on_time_tasks: userMetrics.timeliness.on_time_tasks,
            total_tasks: userMetrics.timeliness.total_tasks
          },
          completion: {
            avg_days: userMetrics.completion.avg_completion_time,
            completed_tasks: userMetrics.completion.total_completed_tasks
          },
          aging: {
            avg_days: userMetrics.aging.avg_days_overdue,
            overdue_tasks: userMetrics.aging.total_overdue_tasks
          }
        }
      };
      
      // Generate AI report
      const reportText = await generateUserAIReport(userData);
      
      if (reportText) {
        // Format as HTML
        const html = formatUserReportAsHTML(reportText, userData);
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
      console.error('Error generating user report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadPdf = () => {
    // The iframe content is already using the id "report-iframe-content"
    generateUserPDF('report-iframe-content', `${user.full_name}_Performance_Report`);
  };

  // Function to create a safe iframe with the report content
  const createReportIframe = (htmlContent: string) => {
    return (
      <iframe
        title="User Performance Report"
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
          <h2 className="text-xl font-semibold text-neutral-800">User Performance Report</h2>
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
        
        {!reportHtml && !isLoading && (
          <div className="text-center py-12">
            <p className="mb-6 text-neutral-600">Generate an AI-powered performance report for {user.full_name}</p>
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
  );
};

export default UserReport; 