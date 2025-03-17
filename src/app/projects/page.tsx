'use client';

import { useProjectMetrics } from '@/hooks/useProjectMetrics';
import { MetricCard } from '@/components/MetricCard';
import { ZohoProject } from '@/types/zoho';
import MetricsChat from '@/components/MetricsChat';

export default function ProjectsPage() {
  const {
    metrics,
    projects,
    selectedProjectId,
    setSelectedProjectId,
    isLoading,
    error
  } = useProjectMetrics();

  console.log('ProjectsPage render:', {
    hasMetrics: !!metrics,
    projectCount: projects.length,
    selectedProjectId,
    isLoading
  });

  if (error) {
    console.error('ProjectsPage error:', error);
    return (
      <div className="p-6">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading metrics</h3>
              <div className="mt-2 text-sm text-red-700">{error.message}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleProjectChange = (value: string) => {
    console.log('Project selection changed:', { from: selectedProjectId, to: value || null });
    setSelectedProjectId(value || null);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex flex-col space-y-2">
          <label htmlFor="project-select" className="text-lg font-medium text-gray-900">
            Select Project
          </label>
          <div className="relative">
            <select
              id="project-select"
              value={selectedProjectId || ''}
              onChange={(e) => handleProjectChange(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 pr-8 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Projects ({projects.length} total)</option>
              {projects.map((project: ZohoProject) => (
                <option key={project.entity_id} value={project.entity_id}>
                  {project.data.name} ({project.data.status})
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          {selectedProjectId && (
            <p className="text-sm text-gray-500">
              Showing metrics for selected project
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          // Loading skeleton
          [...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-100 rounded-lg p-6 h-32"></div>
          ))
        ) : metrics ? (
          // Metrics display
          <>
            <MetricCard metric={metrics.taskCompletionRate} />
            <MetricCard metric={metrics.timelinessRate} />
            <MetricCard metric={metrics.openTasksAging} />
            <MetricCard metric={metrics.backlogRate} />
          </>
        ) : (
          // No metrics state
          <div className="col-span-4 text-center py-8 text-gray-500">
            No metrics available
          </div>
        )}
      </div>

      {/* Add chat interface */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Ask About Metrics</h2>
        <MetricsChat />
      </div>
    </div>
  );
} 