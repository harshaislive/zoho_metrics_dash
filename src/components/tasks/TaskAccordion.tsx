import React, { useState, useEffect } from 'react';
import { TaskList } from './TaskList';
import { supabase } from '@/lib/supabaseClient';
import LoadingSpinner from '../LoadingSpinner';
import { FilterSection } from './FilterSection';
import { Task, isIsoDateFormat, convertDateToIsoFormat } from '@/types/task';
import { useTaskFilters } from '@/hooks/useTaskFilters';

interface TaskAccordionProps {
  userId: string;
}

export function TaskAccordion({ userId }: TaskAccordionProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedTask, setExpandedTask] = useState<number | null>(null);
  
  // Use our new task filters hook
  const {
    filters,
    handleFilterChange,
    availableStatuses,
    availablePriorities,
    tasksByStatus
  } = useTaskFilters(tasks);
  
  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: tasksData, error: queryError } = await supabase
        .from('raw_zoho_data')
        .select('data')
        .eq('entity_type', 'tasks')
        .contains('data', {
          'details': {
            'owners': [{
              'zpuid': userId
            }]
          }
        });

      if (queryError) {
        throw queryError;
      }

      // Log sample data for debugging
      if (tasksData && tasksData.length > 0) {
        console.log('Sample User Task Data Format:', JSON.stringify(tasksData[0], null, 2));
      }

      // Transform the data to match our Task interface
      const transformedTasks = tasksData?.map(item => {
        // Log date formats for debugging
        if (item.data.start_date || item.data.end_date) {
          console.log('User Task Date Formats:', {
            taskId: item.data.id,
            rawStartDate: item.data.start_date,
            rawEndDate: item.data.end_date,
            startDateType: typeof item.data.start_date,
            endDateType: typeof item.data.end_date
          });
        }

        // Extract and normalize status
        let status = 'Unknown';
        if (item.data.status && typeof item.data.status === 'object' && 'name' in item.data.status) {
          status = item.data.status.name || 'Unknown';
        } else if (typeof item.data.status === 'string') {
          status = item.data.status;
        }
        
        // Extract and normalize priority
        let priority = 'Normal';
        if (item.data.priority && typeof item.data.priority === 'string') {
          priority = item.data.priority;
        }
        
        // Log status and priority for debugging
        console.log('User Task Status and Priority:', {
          taskId: item.data.id,
          rawStatus: item.data.status,
          normalizedStatus: status,
          rawPriority: item.data.priority,
          normalizedPriority: priority
        });

        const task = {
          id: parseInt(String(item.data.id)),
          name: item.data.name || 'Unnamed Task',
          status: status,
          priority: priority,
          start_date: item.data.start_date || '',
          end_date: item.data.end_date || '',
          percent_complete: parseInt(String(item.data.percent_complete || '0')),
          description: item.data.description || '',
          custom_status_name: status,
          custom_status_color: (item.data.status && typeof item.data.status === 'object' && 'color_code' in item.data.status) 
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
    if (userId) {
      fetchTasks();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-sm p-4 bg-red-50 rounded-lg border border-red-100">
        {error}
      </div>
    );
  }

  if (!tasks.length) {
    return (
      <div className="text-neutral-600 text-sm p-4 bg-neutral-50 rounded-lg border border-neutral-100">
        No tasks found for this user.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <FilterSection
        filters={filters}
        availableStatuses={availableStatuses}
        availablePriorities={availablePriorities}
        onFilterChange={handleFilterChange}
      />
      
      {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
        <TaskList
          key={status}
          status={status}
          tasks={statusTasks}
          expandedTask={expandedTask}
          onExpand={setExpandedTask}
        />
      ))}
    </div>
  );
} 