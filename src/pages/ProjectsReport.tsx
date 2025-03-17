import { useEffect, useState } from 'react';
import { getAllProjectMetrics, getAllProjects, type Project } from '../services/metricsService';
import DashboardLayout from '@/components/DashboardLayout';
import MetricsGrid from '@/components/MetricsGrid';
import EnhancedCombobox from '@/components/search/EnhancedCombobox';
import { formatNumber } from '@/utils/formatters';
import { Metric, MetricStatus } from '@/types/zoho';
import InfoPanel from '@/components/InfoPanel';
import { ProjectTaskAccordion } from '@/components/projects/ProjectTaskAccordion';

interface ProjectMetrics {
  unplanned: {
    project_id: string;
    project_name: string;
    project_start_date: string;
    project_end_date: string;
    last_milestone_date: string;
    milestone_names: string[];
    milestone_end_dates: string[];
    total_project_days: number;
    unplanned_days: number;
    unplanned_percentage: number;
  };
  timeliness: {
    total_tasks: number;
    on_time_tasks: number;
    timeliness_rate: string;
  };
  aging: {
    total_overdue_tasks: number;
    total_overdue_days: number;
    average_aging: string;
  };
  backlog: {
    total_open_tasks: number;
    rotten_tasks: number;
    rotten_percentage: string;
  };
}

// Extend Project to satisfy ComboboxItem constraint
interface ProjectWithIndex extends Project {
  [key: string]: string | number | boolean | null | undefined;
}

const projectMetricsInfo = {
  title: "Understanding Project Metrics",
  description: "These metrics provide insights into project health by analyzing milestone completion, task timeliness, aging tasks, and backlog management. Use these metrics to identify potential issues and maintain sustainable project progress.",
  metrics: [
    {
      metric: "Unplanned Percentage",
      description: "Calculates the percentage of project time between the last milestone and project end date, indicating potential scope changes or unplanned work.",
      interpretation: "Based on milestone tracking: measures days between last milestone and project end date as a percentage of total project duration. High percentages (>20%) indicate significant post-milestone work.",
      actionableInsights: [
        "Review milestone planning and ensure comprehensive coverage of project scope",
        "Investigate causes of work occurring after the last milestone",
        "Consider adding buffer milestones for known uncertainty areas",
        "Analyze if milestones effectively capture all major project phases"
      ]
    },
    {
      metric: "Task Timeliness",
      description: "Analyzes completed tasks against their original due dates, focusing on tasks marked as 'Closed' within their estimated timeframe.",
      interpretation: "Calculated as (on-time completed tasks / total completed tasks) × 100. Tasks are considered on-time when completion date ≤ due date.",
      actionableInsights: [
        "Review tasks completed after their due dates to identify common delay patterns",
        "Adjust estimation practices based on historical completion data",
        "Consider task dependencies and their impact on timelines",
        "Implement early warning system for tasks approaching their due dates"
      ]
    },
    {
      metric: "Open Tasks Aging",
      description: "Tracks overdue open and in-progress tasks, measuring average days past their due dates.",
      interpretation: "Calculated as average days overdue for tasks with status 'Open' or 'In Progress' that have passed their end date.",
      actionableInsights: [
        "Prioritize tasks based on overdue duration",
        "Analyze patterns in task aging to identify systemic bottlenecks",
        "Consider breaking down long-overdue tasks into smaller units",
        "Review resource allocation for aging tasks"
      ]
    },
    {
      metric: "Backlog Rate",
      description: "Identifies 'rotten' tasks - open or in-progress tasks that haven't been updated in the last 7 days.",
      interpretation: "Calculated as (tasks without updates for 7+ days / total open tasks) × 100. High rates indicate stale work items.",
      actionableInsights: [
        "Review tasks without recent updates to determine if they're still relevant",
        "Implement regular backlog refinement sessions",
        "Set up automated notifications for stale tasks",
        "Consider archiving or reprioritizing tasks without recent activity"
      ]
    }
  ]
};

export default function ProjectsReport() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<ProjectWithIndex[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectWithIndex | null>(null);
  const [projectMetrics, setProjectMetrics] = useState<ProjectMetrics | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);
        const projectsData = await getAllProjects();
        // Convert Project to ProjectWithIndex
        const projectsWithIndex = projectsData.map(project => ({
          ...project,
          // Add any additional properties needed for indexing
        }));
        setProjects(projectsWithIndex);
        setLoading(false);
      } catch (err) {
        setError('Failed to load projects');
        setLoading(false);
        console.error(err);
      }
    };

    loadProjects();
  }, []);

  useEffect(() => {
    const loadProjectMetrics = async () => {
      if (!selectedProject) {
        setProjectMetrics(null);
        return;
      }

      try {
        setLoading(true);
        const metrics = await getAllProjectMetrics(selectedProject.id);
        setProjectMetrics(metrics);
        setLoading(false);
      } catch (err) {
        setError('Failed to load project metrics');
        setLoading(false);
        console.error(err);
      }
    };

    loadProjectMetrics();
  }, [selectedProject]);

  // Create metrics array for the MetricsGrid component
  const getMetrics = (): Metric[] => {
    if (!projectMetrics) return [];

    const getMetricStatus = (value: number, thresholds: { warning: number; danger: number }, isHigherBetter = false): MetricStatus => {
      if (isHigherBetter) {
        if (value >= thresholds.warning) return 'success';
        if (value >= thresholds.danger) return 'warning';
        return 'danger';
      } else {
        if (value <= thresholds.warning) return 'success';
        if (value <= thresholds.danger) return 'warning';
        return 'danger';
      }
    };

    return [
      {
        label: 'Unplanned Percentage',
        value: parseFloat(formatNumber(projectMetrics.unplanned?.unplanned_percentage || 0)),
        unit: '%',
        description: `${projectMetrics.unplanned?.unplanned_days || 0} days out of ${projectMetrics.unplanned?.total_project_days || 0} total days`,
        status: getMetricStatus(
          projectMetrics.unplanned?.unplanned_percentage || 0,
          { warning: 10, danger: 20 }
        )
      },
      {
        label: 'Task Timeliness',
        value: parseFloat(formatNumber(parseFloat(projectMetrics.timeliness?.timeliness_rate || '0'))),
        unit: '%',
        description: `${projectMetrics.timeliness?.on_time_tasks || 0} on-time tasks out of ${projectMetrics.timeliness?.total_tasks || 0} total tasks`,
        status: getMetricStatus(
          parseFloat(projectMetrics.timeliness?.timeliness_rate || '0'),
          { warning: 70, danger: 50 },
          true
        )
      },
      {
        label: 'Open Tasks Aging',
        value: parseFloat(projectMetrics.aging?.average_aging || '0'),
        unit: ' days',
        description: `${projectMetrics.aging?.total_overdue_tasks || 0} overdue tasks with ${projectMetrics.aging?.total_overdue_days || 0} total overdue days`,
        status: getMetricStatus(
          parseFloat(projectMetrics.aging?.average_aging || '0'),
          { warning: 5, danger: 10 }
        )
      },
      {
        label: 'Backlog Rate',
        value: parseFloat(formatNumber(parseFloat(projectMetrics.backlog?.rotten_percentage || '0'))),
        unit: '%',
        description: `${projectMetrics.backlog?.rotten_tasks || 0} rotten tasks out of ${projectMetrics.backlog?.total_open_tasks || 0} open tasks`,
        status: getMetricStatus(
          parseFloat(projectMetrics.backlog?.rotten_percentage || '0'),
          { warning: 10, danger: 20 }
        )
      }
    ];
  };

  // Project selector component
  const ProjectSelector = (
    <EnhancedCombobox<ProjectWithIndex>
      items={projects as ProjectWithIndex[]}
      selectedItem={selectedProject as ProjectWithIndex | null}
      onChange={(project) => setSelectedProject(project)}
      onQueryChange={setQuery}
      displayValue={(project: ProjectWithIndex) => project?.name || ''}
      placeholder="Select a project"
      label="Project"
      query={query}
      noResultsText="No projects found"
    />
  );

  return (
    <DashboardLayout
      title="Project Metrics Dashboard"
      subtitle={selectedProject ? `Viewing metrics for ${selectedProject.name}` : 'Select a project to view metrics'}
      selector={ProjectSelector}
      loading={loading}
      error={error}
    >
      {selectedProject && projectMetrics ? (
        <>
          <div className="mb-6">
            <div className="bg-white rounded-lg shadow-card border border-gray-100 p-6 transition-all duration-300 hover:shadow-card-hover">
              <h2 className="text-xl font-semibold mb-4 text-primary-700">Project Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-3 rounded-md bg-gray-50 border border-gray-100">
                  <p className="text-sm text-gray-500">Project Name</p>
                  <p className="font-medium">{projectMetrics.unplanned?.project_name || selectedProject.name}</p>
                </div>
                <div className="p-3 rounded-md bg-gray-50 border border-gray-100">
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-medium">{selectedProject.status}</p>
                </div>
                <div className="p-3 rounded-md bg-gray-50 border border-gray-100">
                  <p className="text-sm text-gray-500">Start Date</p>
                  <p className="font-medium">{projectMetrics.unplanned?.project_start_date || 'N/A'}</p>
                </div>
                <div className="p-3 rounded-md bg-gray-50 border border-gray-100">
                  <p className="text-sm text-gray-500">End Date</p>
                  <p className="font-medium">{projectMetrics.unplanned?.project_end_date || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          <MetricsGrid columns={2}>
            {getMetrics().map((metric, index) => (
              <div key={index} className="bg-white rounded-lg shadow-card border border-gray-100 p-6">
                <h3 className="text-lg font-semibold mb-2">{metric.label}</h3>
                <div className="flex items-baseline space-x-1">
                  <span className="text-2xl font-bold">{metric.value}</span>
                  <span className="text-gray-500">{metric.unit}</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">{metric.description}</p>
                <div className={`mt-2 text-sm ${
                  metric.status === 'success' ? 'text-green-600' :
                  metric.status === 'warning' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  Status: {metric.status}
                </div>
              </div>
            ))}
          </MetricsGrid>
          
          <InfoPanel {...projectMetricsInfo} />
          
          <div className="mt-6">
            <div className="bg-white rounded-lg shadow-card border border-gray-100 p-6 transition-all duration-300 hover:shadow-card-hover">
              <h2 className="text-xl font-semibold mb-4 text-primary-700">Project Tasks</h2>
              <ProjectTaskAccordion projectId={selectedProject.id} />
            </div>
          </div>
        </>
      ) : (
        <div className="text-center text-gray-500 mt-8">
          Select a project to view metrics and tasks
        </div>
      )}
    </DashboardLayout>
  );
} 