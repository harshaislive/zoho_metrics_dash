import React, { useEffect, useState } from 'react';
import LoadingSpinner from '../LoadingSpinner';
import { TaskList } from '../tasks/TaskList';
import { FilterSection } from '../tasks/FilterSection';
import { DateRangeType } from '../tasks/DateRangeSelector';
import { supabase } from '@/lib/supabaseClient';

export interface Task {
  id: number;
  name: string;
  status: string;
  priority: string;
  start_date: string;
  end_date: string;
  percent_complete: number;
  description: string;
  custom_status_name: string;
  custom_status_color: string;
}

// Define interface for raw task data from Supabase
// This interface is used for documentation purposes
interface TaskData {
  id: string;
  name: string;
  status?: {
    name: string;
    color_code: string;
  };
  priority?: string;
  start_date?: string;
  end_date?: string;
  percent_complete?: string;
  description?: string;
  tasklist?: {
    id: string;
  };
  link?: {
    self?: {
      url: string;
    };
  };
}

interface ProjectTaskAccordionProps {
  projectId: string;
}

export const ProjectTaskAccordion: React.FC<ProjectTaskAccordionProps> = ({ projectId }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedTask, setExpandedTask] = useState<number | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    selectedStatuses: [] as string[],
    dateRangeType: null as DateRangeType,
    dateRange: {
      start: null as string | null,
      end: null as string | null
    }
  });

  const fetchProjectTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching tasks for project:', projectId);

      // Use raw SQL query to find tasks for this project
      const { data: tasksData, error: tasksError } = await supabase
        .rpc('get_tasks_by_project_id', { project_id: projectId });

      if (tasksError) {
        console.error('Error fetching tasks:', tasksError);
        
        // Fallback approach if RPC fails
        console.log('Trying fallback approach...');
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('raw_zoho_data')
          .select('data')
          .eq('entity_type', 'tasks');
          
        if (fallbackError) {
          console.error('Fallback query failed:', fallbackError);
          setError('Failed to fetch tasks. Please try again later.');
          setTasks([]);
          return;
        }
        
        // Filter tasks client-side by project ID in URL
        const filteredTasks = fallbackData?.filter(task => {
          const url = task.data?.link?.self?.url || '';
          return url.includes(`/projects/${projectId}/`);
        }) || [];
        
        console.log(`Found ${filteredTasks.length} tasks for project ${projectId} using fallback`);
        const transformedTasks = transformTasksData(filteredTasks);
        setTasks(transformedTasks);
      } else if (tasksData && tasksData.length > 0) {
        console.log(`Found ${tasksData.length} tasks for project ${projectId}`);
        const transformedTasks = transformTasksData(tasksData);
        setTasks(transformedTasks);
      } else {
        console.log(`No tasks found for project ${projectId}`);
        setTasks([]);
      }
    } catch (err) {
      console.error('Error in fetchProjectTasks:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching tasks');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to transform task data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transformTasksData = (tasksData: unknown[]): Task[] => {
    return tasksData.map(rawTask => {
      // Handle different data structures with type assertions
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const taskData = (rawTask as any).data || 
                       (rawTask as any).get_tasks_by_project_id || 
                       rawTask;
      
      if (!taskData || typeof taskData !== 'object' || !('id' in taskData)) {
        console.warn('Invalid task data structure:', rawTask);
        return null;
      }
      
      return {
        id: parseInt(String(taskData.id)),
        name: taskData.name || 'Unnamed Task',
        status: taskData.status?.name || 'Unknown',
        priority: taskData.priority || 'Normal',
        start_date: taskData.start_date || '',
        end_date: taskData.end_date || '',
        percent_complete: parseInt(String(taskData.percent_complete || '0')),
        description: taskData.description || '',
        custom_status_name: taskData.status?.name || 'Unknown',
        custom_status_color: taskData.status?.color_code || '#cccccc'
      };
    }).filter(Boolean) as Task[]; // Filter out any null values
  };

  useEffect(() => {
    if (projectId) {
      fetchProjectTasks();
    }
  }, [projectId]);

  const handleFilterChange = (
    type: 'search' | 'status' | 'dateRangeType' | 'dateRange',
    value: string | string[] | DateRangeType | { start: string | null; end: string | null }
  ) => {
    setFilters(prev => ({
      ...prev,
      [type === 'status' ? 'selectedStatuses' : type]: value
    }));
  };

  // Filter tasks based on filters
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.name.toLowerCase().includes(filters.search.toLowerCase());
    const matchesStatus = filters.selectedStatuses.length === 0 || filters.selectedStatuses.includes(task.status);
    const matchesDateRange = !filters.dateRange.start || !filters.dateRange.end || 
      (new Date(task.start_date) >= new Date(filters.dateRange.start) && 
       new Date(task.end_date) <= new Date(filters.dateRange.end));
    
    return matchesSearch && matchesStatus && matchesDateRange;
  });

  // Group tasks by status
  const tasksByStatus = filteredTasks.reduce((acc, task) => {
    if (!acc[task.status]) {
      acc[task.status] = [];
    }
    acc[task.status].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="space-y-4">
      <FilterSection
        filters={filters}
        availableStatuses={Array.from(new Set(tasks.map(task => task.status)))}
        onFilterChange={handleFilterChange}
      />
      
      {loading ? (
        <div className="flex justify-center">
          <LoadingSpinner />
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-4 text-gray-500">
          No tasks found for this project
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(tasksByStatus).map(([status, tasks]) => (
            <TaskList
              key={status}
              status={status}
              tasks={tasks}
              expandedTask={expandedTask}
              onExpand={setExpandedTask}
            />
          ))}
        </div>
      )}
    </div>
  );
}; 