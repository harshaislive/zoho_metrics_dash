import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { generateReport } from '../services/openRouter';

interface ReportGeneratorProps {
  type: 'user' | 'project';
  data: any; // Replace with proper type
}

export function ReportGenerator({ type, data }: ReportGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState('');

  const generateReportPrompt = () => {
    if (type === 'user') {
      return `Generate a user performance report in the following format:
        ${userReportTemplate}
        Using this data: ${JSON.stringify(data)}`;
    }
    return `Generate a project metrics report in the following format:
      ${projectReportTemplate}
      Using this data: ${JSON.stringify(data)}`;
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      const generatedReport = await generateReport(generateReportPrompt());
      setReport(generatedReport);
      setIsOpen(true);
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleGenerateReport}
        disabled={loading}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        {loading ? 'Generating...' : 'Generate AI Report'}
      </button>

      <Dialog open={isOpen} onClose={() => setIsOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-3xl rounded bg-white p-6">
            <Dialog.Title className="text-lg font-medium leading-6 text-gray-900 mb-4">
              Generated Report
            </Dialog.Title>
            <div 
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: report }}
            />
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  );
} 