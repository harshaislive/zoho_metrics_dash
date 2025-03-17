import { useState, useEffect } from 'react';
import { User, getAllUsers, getAllUserMetrics, UtilizationRate, TaskTimeliness, AvgCompletionTime, TaskAging } from '@/services/metricsService';
import DashboardLayout from '@/components/DashboardLayout';
import MetricsGrid from '@/components/MetricsGrid';
import { MetricCard } from '@/components/MetricCard';
import EnhancedCombobox from '@/components/search/EnhancedCombobox';
import { Metric, MetricStatus } from '@/types/zoho';
import InfoPanel from '@/components/InfoPanel';
import { TaskAccordion } from '@/components/tasks/TaskAccordion';

// Extend User to satisfy ComboboxItem constraint
interface UserWithIndex extends User {
  [key: string]: string | number | boolean | null | undefined;
}

interface UserMetrics {
  utilization: UtilizationRate;
  timeliness: TaskTimeliness;
  completion: AvgCompletionTime;
  aging: TaskAging;
}

const userMetricsInfo = {
  title: "Understanding User Metrics",
  description: "These metrics analyze individual task management and productivity patterns, helping identify workload imbalances and potential bottlenecks while maintaining sustainable work practices.",
  metrics: [
    {
      metric: "Utilization Rate",
      description: "Measures active engagement by comparing recently updated tasks to total assigned open tasks.",
      interpretation: "Calculated as ((total_open_tasks - stale_tasks) / total_open_tasks) × 100. Stale tasks are those not updated in the last 24 hours.",
      actionableInsights: [
        "Review tasks that haven't been updated in the last 24 hours",
        "Check for blocked tasks preventing progress",
        "Ensure task assignments match current priorities",
        "Consider workload redistribution if utilization is consistently high or low"
      ]
    },
    {
      metric: "Task Timeliness",
      description: "Evaluates the percentage of tasks completed before or on their due dates.",
      interpretation: "Calculated as (tasks completed before due date / total completed tasks) × 100. Based on completion_time vs end_date comparison.",
      actionableInsights: [
        "Analyze patterns in tasks completed after due dates",
        "Review estimation accuracy for different task types",
        "Identify common factors in delayed task completion",
        "Consider task complexity when assigning deadlines"
      ]
    },
    {
      metric: "Average Completion Time",
      description: "Measures the average duration between task creation and completion dates.",
      interpretation: "Calculated as average days between created_time and completed_time for all completed tasks.",
      actionableInsights: [
        "Compare completion times across different task types",
        "Identify tasks with unusually long completion times",
        "Look for patterns in quick vs slow completions",
        "Consider task complexity and dependencies in planning"
      ]
    },
    {
      metric: "Task Aging",
      description: "Tracks currently overdue tasks and their average days past due date.",
      interpretation: "Calculated as average days between current date and end_date for open tasks that are past their due date.",
      actionableInsights: [
        "Focus on tasks with highest overdue days first",
        "Identify common characteristics of overdue tasks",
        "Review resource availability for aging tasks",
        "Consider adjusting due dates if original estimates were unrealistic"
      ]
    }
  ]
};

export default function UsersReport() {
  const [users, setUsers] = useState<UserWithIndex[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserWithIndex | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<UserMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        const usersData = await getAllUsers();
        // Convert User to UserWithIndex
        const usersWithIndex = usersData.map(user => ({
          ...user,
          // Add any additional properties needed for indexing
        }));
        setUsers(usersWithIndex);
        setLoading(false);
      } catch (err) {
        setError('Failed to load users');
        setLoading(false);
        console.error(err);
      }
    };

    loadUsers();
  }, []);

  useEffect(() => {
    const loadUserMetrics = async () => {
      if (!selectedUser) {
        setMetrics(null);
        return;
      }

      try {
        setLoading(true);
        const userMetrics = await getAllUserMetrics(selectedUser.full_name);
        setMetrics(userMetrics);
        setLoading(false);
      } catch (err) {
        setError('Failed to load user metrics');
        setLoading(false);
        console.error(err);
      }
    };

    loadUserMetrics();
  }, [selectedUser]);

  // Create metrics array for the MetricsGrid component
  const getMetrics = (): Metric[] => {
    if (!metrics) return [];

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
        label: 'Utilization Rate',
        value: metrics.utilization.utilization_rate,
        unit: '%',
        description: `${metrics.utilization.total_open_tasks - metrics.utilization.stale_tasks} active tasks out of ${metrics.utilization.total_open_tasks} open tasks`,
        status: getMetricStatus(
          metrics.utilization.utilization_rate,
          { warning: 70, danger: 50 },
          true
        )
      },
      {
        label: 'Task Timeliness',
        value: parseFloat(metrics.timeliness.timeliness_rate.replace('%', '')),
        unit: '%',
        description: `${metrics.timeliness.on_time_tasks} on-time tasks out of ${metrics.timeliness.total_tasks} total tasks`,
        status: getMetricStatus(
          parseFloat(metrics.timeliness.timeliness_rate.replace('%', '')),
          { warning: 70, danger: 50 },
          true
        )
      },
      {
        label: 'Avg. Completion Time',
        value: metrics.completion.avg_completion_time,
        unit: ' days',
        description: `Average time to complete ${metrics.completion.total_completed_tasks} tasks`,
        status: getMetricStatus(
          metrics.completion.avg_completion_time,
          { warning: 5, danger: 10 }
        )
      },
      {
        label: 'Task Aging',
        value: metrics.aging.avg_days_overdue,
        unit: ' days',
        description: `${metrics.aging.total_overdue_tasks} overdue tasks`,
        status: getMetricStatus(
          metrics.aging.avg_days_overdue,
          { warning: 5, danger: 10 }
        )
      }
    ];
  };

  // User selector component
  const UserSelector = (
    <EnhancedCombobox<UserWithIndex>
      items={users}
      selectedItem={selectedUser}
      onChange={setSelectedUser}
      onQueryChange={setQuery}
      displayValue={(user: UserWithIndex) => user?.full_name || ''}
      placeholder="Select a user"
      label="User"
      query={query}
      noResultsText="No users found"
    />
  );

  return (
    <DashboardLayout
      title="User Metrics Dashboard"
      subtitle={selectedUser ? `Viewing metrics for ${selectedUser.full_name}` : 'Select a user to view metrics'}
      selector={UserSelector}
      loading={loading}
      error={error}
    >
      {selectedUser && metrics ? (
        <>
          <div className="mb-6">
            <div className="bg-white rounded-lg shadow-card border border-gray-100 p-6 transition-all duration-300 hover:shadow-card-hover">
              <h2 className="text-xl font-semibold mb-4 text-primary-700">User Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 rounded-md bg-gray-50 border border-gray-100">
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="font-medium">{selectedUser.full_name}</p>
                </div>
                <div className="p-3 rounded-md bg-gray-50 border border-gray-100">
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{selectedUser.email || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          <MetricsGrid columns={2}>
            {getMetrics().map((metric, index) => (
              <MetricCard key={index} metric={metric} />
            ))}
          </MetricsGrid>

          <div className="mt-8">
            <InfoPanel 
              title={userMetricsInfo.title}
              description={userMetricsInfo.description}
              metrics={userMetricsInfo.metrics}
            />
          </div>

          <div className="mt-8">
            <div className="bg-white rounded-lg shadow-card border border-gray-100 p-6 transition-all duration-300 hover:shadow-card-hover">
              <h2 className="text-xl font-semibold mb-4 text-primary-700">User Tasks</h2>
              <TaskAccordion userId={selectedUser.id} />
            </div>
          </div>
        </>
      ) : !loading && (
        <div className="bg-primary-50 text-primary-700 p-4 rounded-lg border border-primary-200 shadow-sm">
          <p>Please select a user to view metrics.</p>
        </div>
      )}
    </DashboardLayout>
  );
} 