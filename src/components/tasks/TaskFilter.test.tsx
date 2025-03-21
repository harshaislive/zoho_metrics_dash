import React, { useState, useEffect } from 'react';
import { Task } from '@/types/task';
import { FilterSection } from './FilterSection';
import { useTaskFilters } from '@/hooks/useTaskFilters';
import { supabase } from '@/lib/supabaseClient';
import LoadingSpinner from '../LoadingSpinner';
import { isIsoDateFormat, convertDateToIsoFormat } from '@/types/task';

export const TaskFilterTest: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const {
    filters,
    handleFilterChange,
    availableStatuses,
    availablePriorities,
    filteredTasks,
    tasksByStatus
  } = useTaskFilters(tasks);

  // Fetch real tasks data
  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get recent tasks
      const { data: tasksData, error: queryError } = await supabase
        .from('raw_zoho_data')
        .select('data')
        .eq('entity_type', 'tasks')
        .limit(50);  // Limit to 50 tasks for better performance

      if (queryError) {
        throw queryError;
      }

      // Transform the data to match our Task interface
      const transformedTasks = tasksData?.map(item => {
        // Extract and normalize status
        let status = 'Unknown';
        if (item.data?.status && typeof item.data.status === 'object' && 'name' in item.data.status) {
          status = item.data.status.name || 'Unknown';
        } else if (typeof item.data?.status === 'string') {
          status = item.data.status;
        }
        
        // Extract and normalize priority
        let priority = 'Normal';
        if (item.data?.priority && typeof item.data.priority === 'string') {
          priority = item.data.priority;
        }

        const task = {
          id: parseInt(String(item.data?.id || Math.random() * 10000)),
          name: item.data?.name || 'Unnamed Task',
          status: status,
          priority: priority,
          start_date: item.data?.start_date || '',
          end_date: item.data?.end_date || '',
          percent_complete: parseInt(String(item.data?.percent_complete || '0')),
          description: item.data?.description || '',
          custom_status_name: status,
          custom_status_color: (item.data?.status && typeof item.data.status === 'object' && 'color_code' in item.data.status) 
            ? item.data.status.color_code || '#cccccc'
            : '#cccccc'
        };

        // Make sure date strings are in ISO format for proper comparison
        if (task.start_date && !isIsoDateFormat(task.start_date)) {
          task.start_date = convertDateToIsoFormat(task.start_date);
        }
        
        if (task.end_date && !isIsoDateFormat(task.end_date)) {
          task.end_date = convertDateToIsoFormat(task.end_date);
        }

        return task;
      }) || [];

      setTasks(transformedTasks);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Failed to load tasks. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Task Filter Testing</h1>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Task Filter Testing</h1>
        <div className="bg-red-50 text-red-500 p-4 rounded-lg border border-red-200">
          {error}
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Task Filter Testing</h1>
        <div className="bg-neutral-50 text-neutral-500 p-4 rounded-lg border border-neutral-200">
          No tasks found. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Advanced Filter Testing</h1>
      
      <div className="mb-6">
        <FilterSection
          filters={filters}
          availableStatuses={availableStatuses}
          availablePriorities={availablePriorities}
          onFilterChange={handleFilterChange}
        />
      </div>
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Filter Results</h2>
        <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
          <p>Active Filters:</p>
          <ul className="list-disc list-inside ml-2 text-sm">
            {filters.search && <li>Search: "{filters.search}"</li>}
            {filters.selectedStatuses.length > 0 && (
              <li>Statuses: {filters.selectedStatuses.join(', ')}</li>
            )}
            {filters.selectedPriorities.length > 0 && (
              <li>Priorities: {filters.selectedPriorities.join(', ')}</li>
            )}
            {filters.dateRangeType && (
              <li>Date Range: {filters.dateRangeType}</li>
            )}
          </ul>
          <p className="mt-2">
            Found {filteredTasks.length} of {tasks.length} tasks
          </p>
        </div>
      </div>
      
      <div>
        <h2 className="text-lg font-semibold mb-2">Tasks</h2>
        {Object.entries(tasksByStatus).map(([status, tasks]) => (
          <div key={status} className="mb-4">
            <h3 className="font-medium mb-2">{status} ({tasks.length})</h3>
            <div className="bg-white rounded-lg border border-neutral-200 divide-y divide-neutral-100">
              {tasks.map(task => (
                <div key={task.id} className="p-4">
                  <div className="flex justify-between mb-2">
                    <h4 className="font-medium">{task.name}</h4>
                    <span className="px-2 py-1 text-xs rounded-full" style={{ 
                      backgroundColor: `${task.custom_status_color}20`,
                      color: task.custom_status_color
                    }}>
                      {task.status}
                    </span>
                  </div>
                  <div className="text-sm text-neutral-600 mb-2">{task.description}</div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-neutral-500">
                    <div>Priority: <span className="font-medium">{task.priority}</span></div>
                    <div>Completion: <span className="font-medium">{task.percent_complete}%</span></div>
                    <div>Start: <span className="font-medium">{task.start_date}</span></div>
                    <div>End: <span className="font-medium">{task.end_date}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 