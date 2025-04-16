import { useState, useEffect } from 'react';
import { Button, Card, Spin } from 'antd';
import { 
  generateUserAIReport, 
  formatUserReportAsHTML, 
  generateUserPDF, 
  UserReportData 
} from '../services/userReportService';
import { FileTextOutlined, DownloadOutlined } from '@ant-design/icons';

interface UserReportProps {
  userData: UserReportData;
}

const UserReport: React.FC<UserReportProps> = ({ userData }) => {
  const [reportHTML, setReportHTML] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [generatingPDF, setGeneratingPDF] = useState<boolean>(false);

  useEffect(() => {
    const loadReport = async () => {
      if (userData && userData.id) {
        setLoading(true);
        try {
          // Generate AI report
          const reportText = await generateUserAIReport(userData);
          
          if (reportText) {
            // Format the report as HTML
            const html = formatUserReportAsHTML(reportText, userData);
            setReportHTML(html);
          }
        } catch (error) {
          console.error('Error loading user report:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadReport();
  }, [userData]);

  const handleDownloadPDF = async () => {
    if (!reportHTML) return;

    setGeneratingPDF(true);
    try {
      await generateUserPDF('report-iframe-content', `User_Report_${userData.name.replace(/\s+/g, '_')}`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setGeneratingPDF(false);
    }
  };

  return (
    <Card
      title={<><FileTextOutlined /> User Performance Report</>}
      bordered={false}
      className="report-card"
      extra={
        <Button 
          type="primary" 
          icon={<DownloadOutlined />} 
          onClick={handleDownloadPDF}
          loading={generatingPDF}
          disabled={!reportHTML || loading}
        >
          Download PDF
        </Button>
      }
    >
      {loading ? (
        <div className="center-spinner">
          <Spin tip="Generating user report..." />
        </div>
      ) : reportHTML ? (
        <div className="report-iframe-container">
          <iframe
            title="User Performance Report"
            srcDoc={reportHTML}
            className="report-iframe"
            style={{ width: '100%', height: '800px', border: 'none' }}
          />
        </div>
      ) : (
        <div className="no-report">No report data available.</div>
      )}
    </Card>
  );
};

export default UserReport; 