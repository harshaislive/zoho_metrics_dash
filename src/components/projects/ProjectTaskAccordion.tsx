import React, { useEffect, useState } from 'react';
import LoadingSpinner from '../LoadingSpinner';
import { TaskList } from '../tasks/TaskList';
import { FilterSection } from '../tasks/FilterSection';
import { supabase } from '@/lib/supabaseClient';
import { Task, isIsoDateFormat, convertDateToIsoFormat } from '@/types/task';
import { useTaskFilters } from '@/hooks/useTaskFilters';

interface ProjectTaskAccordionProps {
  projectId: string;
}

export const ProjectTaskAccordion: React.FC<ProjectTaskAccordionProps> = ({ projectId }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
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
  const transformTasksData = (tasksData: unknown[]): Task[] => {
    // Log sample data for debugging
    if (tasksData.length > 0) {
      console.log('Sample Task Data Format:', JSON.stringify(tasksData[0], null, 2));
    }
    
    return tasksData.map(rawTask => {
      // Handle different data structures with type assertions
      // Create a typed interface for the taskData object
      interface RawTaskData {
        data?: { 
          id: string | number;
          name?: string;
          status?: { name?: string; color_code?: string };
          priority?: string;
          start_date?: string;
          end_date?: string;
          percent_complete?: string | number;
          description?: string;
        };
        get_tasks_by_project_id?: {
          id: string | number;
          name?: string;
          status?: { name?: string; color_code?: string };
          priority?: string;
          start_date?: string;
          end_date?: string;
          percent_complete?: string | number;
          description?: string;
        };
        id?: string | number;
        name?: string;
        status?: { name?: string; color_code?: string };
        priority?: string;
        start_date?: string;
        end_date?: string;
        percent_complete?: string | number;
        description?: string;
      }
      
      const typedRawTask = rawTask as RawTaskData;
      
      // Extract the task data from the appropriate property
      const taskData = typedRawTask.data || 
                       typedRawTask.get_tasks_by_project_id || 
                       typedRawTask;
      
      if (!taskData || typeof taskData !== 'object' || !('id' in taskData)) {
        console.warn('Invalid task data structure:', rawTask);
        return null;
      }
      
      // Log date formats for debugging
      if (taskData.start_date || taskData.end_date) {
        console.log('Task Date Formats:', {
          taskId: taskData.id,
          rawStartDate: taskData.start_date,
          rawEndDate: taskData.end_date,
          startDateType: typeof taskData.start_date,
          endDateType: typeof taskData.end_date
        });
      }
      
      // Extract and normalize status
      let status = 'Unknown';
      if (taskData.status && typeof taskData.status === 'object' && 'name' in taskData.status) {
        status = taskData.status.name || 'Unknown';
      } else if (typeof taskData.status === 'string') {
        status = taskData.status;
      }
      
      // Extract and normalize priority
      let priority = 'Normal';
      if (taskData.priority && typeof taskData.priority === 'string') {
        priority = taskData.priority;
      }
      
      // Log status and priority for debugging
      console.log('Task Status and Priority:', {
        taskId: taskData.id,
        rawStatus: taskData.status,
        normalizedStatus: status,
        rawPriority: taskData.priority,
        normalizedPriority: priority
      });
      
      const task = {
        id: parseInt(String(taskData.id)),
        name: taskData.name || 'Unnamed Task',
        status: status,
        priority: priority,
        start_date: taskData.start_date || '',
        end_date: taskData.end_date || '',
        percent_complete: parseInt(String(taskData.percent_complete || '0')),
        description: taskData.description || '',
        custom_status_name: status,
        custom_status_color: (taskData.status && typeof taskData.status === 'object' && 'color_code' in taskData.status) 
          ? taskData.status.color_code || '#cccccc'
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
    }).filter(Boolean) as Task[]; // Filter out any null values
  };
  
  useEffect(() => {
    if (projectId) {
      fetchProjectTasks();
    }
  }, [projectId]);

  if (error) {
    return (
      <div className="text-red-500 text-sm p-4 bg-red-50 rounded-lg border border-red-100">
        Error: {error}
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
      
      {loading ? (
        <div className="flex justify-center">
          <LoadingSpinner />
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-4 text-gray-500 bg-neutral-50 rounded-lg border border-neutral-100 p-4">
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