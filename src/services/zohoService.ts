import { supabase } from '@/lib/supabaseClient';
import { ZohoProject, Metric, MetricStatus } from '@/types/zoho';

// Simplified metric thresholds
const METRIC_THRESHOLDS = {
  taskCompletionRate: { success: 80, warning: 60 },
  timelinessRate: { success: 90, warning: 70 },
  openTasksAging: { success: 7, warning: 14 },
  backlogRate: { success: 10, warning: 20 }
};

// Simple helper to determine metric status
const getMetricStatus = (value: number, { success, warning }: { success: number; warning: number }, isInverse = false): MetricStatus => {
  if (isInverse) {
    return value <= success ? 'success' : value <= warning ? 'warning' : 'danger';
  }
  return value >= success ? 'success' : value >= warning ? 'warning' : 'danger';
};

interface ProjectMetricsResult {
  taskCompletionRate: Metric;
  timelinessRate: Metric;
  openTasksAging: Metric;
  backlogRate: Metric;
}

interface TaskOwner {
  id: string;
  name: string;
  email: string;
  zpuid: string;
  full_name: string;
  last_name: string;
  first_name: string;
}

interface TaskData {
  id: string;
  projectId: string;
  completed: boolean;
  status: string;
  dueDate: string | null;
  completedTime: string | null;
  createdTime: string | null;
}

export interface UserMetrics {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastActive: string | null;
  joinedDate: string | null;
  taskCount: number;
  completedTaskCount: number;
  overdueTaskCount: number;
}

export const fetchProjects = async (): Promise<ZohoProject[]> => {
  try {
    // Query the raw_zoho_data table with correct structure
    const { data: projects, error } = await supabase
      .from('raw_zoho_data')
      .select('*')
      .eq('entity_type', 'projects')
      .order('data->name');

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    if (!projects?.length) {
      console.log('No projects found');
      return [];
    }

    // Transform projects to use the correct ID and filter out invalid ones
    const validProjects = projects
      .filter(project => project.data?.id_string && project.data?.name)
      .map(project => ({
        ...project,
        entity_id: project.data.id_string,
        data: {
          ...project.data,
          id: project.data.id_string,
          name: project.data.name || 'Unnamed Project',
          status: project.data.status || 'unknown'
        }
      }));

    console.log(`Found ${validProjects.length} valid projects`);
    
    return validProjects;
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
};

export const fetchProjectMetrics = async (projectId?: string): Promise<ProjectMetricsResult> => {
  try {
    console.log('Fetching metrics for project:', projectId);
    
    // Fetch tasks
    const { data: tasks, error } = await supabase
      .from('raw_zoho_data')
      .select('data')
      .eq('entity_type', 'tasks')
      .not('data->status', 'is', null);

    if (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }

    if (!tasks || tasks.length === 0) {
      console.log('No tasks found in database');
      return createZeroMetrics();
    }

    console.log(`Found ${tasks.length} total tasks`);

    // Filter and process tasks
    const projectTasks = tasks
      .map(row => {
        const task = row.data;
        const taskUrl = task?.link?.self?.url;
        if (!taskUrl) {
          console.log('Task missing URL:', task?.id);
          return null;
        }

        const projectIdMatch = taskUrl.match(/\/projects\/(\d+)\/tasks\//);
        if (!projectIdMatch) {
          console.log('Could not extract project ID from URL:', taskUrl);
          return null;
        }

        const extractedProjectId = projectIdMatch[1];
        
        // Add detailed logging for task data
        console.log('Processing task:', {
          id: task.id,
          status: task.status?.name,
          statusType: task.status?.type,
          completedTime: task.completed_time,
          dueDate: task.end_date,
        });

        // Check if task is completed based on status
        const isCompleted = task.status?.type === 'closed' || 
                          task.status?.name === 'Closed' ||
                          task.completed === true;

        return {
          id: task.id,
          projectId: extractedProjectId,
          completed: isCompleted,
          status: task.status?.name || 'Unknown',
          dueDate: task.end_date,
          completedTime: task.completed_time,
          createdTime: task.created_time
        } as TaskData;
      })
      .filter((task): task is TaskData => {
        if (!task) {
          return false;
        }
        const matches = !projectId || projectId === 'all' || task.projectId === projectId;
        if (!matches) {
          console.log(`Task ${task.id} filtered out - doesn't match project ${projectId}`);
        }
        return matches;
      });

    console.log(`Filtered to ${projectTasks.length} tasks for project ${projectId || 'all'}`);
    
    // Add detailed logging for completed tasks
    const completedTasks = projectTasks.filter(task => task.completed);
    console.log('Completed tasks:', completedTasks.map(task => ({
      id: task.id,
      completedTime: task.completedTime,
      dueDate: task.dueDate
    })));

    // Calculate metrics with time windows
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Define time windows
    const twoWeeksAgo = new Date(now.getTime() - (14 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];

    // Filter tasks for completion rate calculation
    const tasksForCompletionRate = projectTasks.filter(task => {
      // Only consider tasks that are either:
      // 1. Created more than 2 weeks ago
      // 2. Already completed
      return (task.createdTime && task.createdTime <= twoWeeksAgo) || task.completed;
    });

    const total = tasksForCompletionRate.length;
    const completed = tasksForCompletionRate.filter(task => task.completed).length;
    
    // Calculate completion rate only for tasks older than 2 weeks or completed
    const completionRate = total ? (completed / total) * 100 : 0;

    // Log detailed completion metrics
    console.log('Completion rate calculation:', {
      totalTasks: projectTasks.length,
      tasksConsideredForCompletion: total,
      completedTasks: completed,
      recentTasksExcluded: projectTasks.length - total,
      oldestTask: projectTasks.length > 0 ? 
        new Date(Math.min(...projectTasks
          .filter(t => t.createdTime)
          .map(t => new Date(t.createdTime!).getTime()))) : null,
      newestTask: projectTasks.length > 0 ?
        new Date(Math.max(...projectTasks
          .filter(t => t.createdTime)
          .map(t => new Date(t.createdTime!).getTime()))) : null
    });

    // Calculate timeliness
    const onTime = projectTasks.filter(task => {
      const isOnTime = task.completed && 
        task.completedTime && 
        task.dueDate && 
        task.completedTime <= task.dueDate;
      
      if (task.completed) {
        console.log('Timeliness check for task:', {
          id: task.id,
          isOnTime,
          completedTime: task.completedTime,
          dueDate: task.dueDate
        });
      }
      
      return isOnTime;
    }).length;

    // Calculate overdue tasks
    const overdue = projectTasks.filter(task => 
      !task.completed && 
      task.dueDate && 
      task.dueDate < today
    ).length;

    console.log('Basic metrics:', { total, completed, onTime, overdue });

    // Calculate aging
    const openTaskAges = projectTasks
      .filter(task => !task.completed)
      .map(task => {
        // If task has due date and is overdue
        if (task.dueDate && task.dueDate < today) {
          const dueDate = new Date(task.dueDate);
          return Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        }
        // If no due date, use creation date if available
        else if (task.createdTime) {
          const createdDate = new Date(task.createdTime);
          const daysFromCreation = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
          // Only count as aging if it's been more than 14 days since creation
          return daysFromCreation > 14 ? daysFromCreation : 0;
        }
        return 0;
      })
      .filter(age => age > 0); // Only consider tasks that are actually aging

    const aging = openTaskAges.length > 0 ? openTaskAges.reduce((a, b) => a + b, 0) / openTaskAges.length : 0;

    console.log('Aging calculation:', { 
      openTasksCount: openTaskAges.length, 
      averageAging: aging,
      individualAges: openTaskAges 
    });

    // Calculate rates
    const timelinessRate = completed ? (onTime / completed) * 100 : 0;
    const backlogRate = total ? (overdue / total) * 100 : 0;

    console.log('Final rates:', { completionRate, timelinessRate, backlogRate });

    const result: ProjectMetricsResult = {
      taskCompletionRate: {
        label: 'Task Completion Rate',
        value: Math.round(completionRate),
        unit: '%',
        description: `${completed} of ${total} mature tasks completed (${projectTasks.length - total} recent tasks excluded)`,
        status: getMetricStatus(completionRate, METRIC_THRESHOLDS.taskCompletionRate)
      },
      timelinessRate: {
        label: 'Timeliness Rate',
        value: Math.round(timelinessRate),
        unit: '%',
        description: `${onTime} of ${completed} tasks on time`,
        status: getMetricStatus(timelinessRate, METRIC_THRESHOLDS.timelinessRate)
      },
      openTasksAging: {
        label: 'Open Tasks Aging',
        value: Math.round(aging),
        unit: ' days',
        description: `Average age of open tasks`,
        status: getMetricStatus(aging, METRIC_THRESHOLDS.openTasksAging, true)
      },
      backlogRate: {
        label: 'Backlog Rate',
        value: Math.round(backlogRate),
        unit: '%',
        description: `${overdue} overdue tasks in backlog`,
        status: getMetricStatus(backlogRate, METRIC_THRESHOLDS.backlogRate, true)
      }
    };

    return result;
  } catch (error) {
    console.error('Error calculating metrics:', error);
    return createZeroMetrics();
  }
};

// Helper to create zero-value metrics
const createZeroMetrics = (): ProjectMetricsResult => ({
  taskCompletionRate: {
    label: 'Task Completion Rate',
    value: 0,
    unit: '%',
    description: 'No tasks found',
    status: 'danger'
  },
  timelinessRate: {
    label: 'Timeliness Rate',
    value: 0,
    unit: '%',
    description: 'No completed tasks',
    status: 'danger'
  },
  openTasksAging: {
    label: 'Open Tasks Aging',
    value: 0,
    unit: ' days',
    description: 'No open tasks',
    status: 'success'
  },
  backlogRate: {
    label: 'Backlog Rate',
    value: 0,
    unit: '%',
    description: 'No tasks in backlog',
    status: 'success'
  }
});

export async function fetchUserMetrics(): Promise<UserMetrics[]> {
  try {
    // Fetch users from raw_zoho_data table
    const { data: users, error: usersError } = await supabase
      .from('raw_zoho_data')
      .select('data')
      .eq('entity_type', 'users');

    if (usersError) throw usersError;
    if (!users) return [];

    // Fetch tasks to calculate metrics for each user
    const { data: tasks, error: tasksError } = await supabase
      .from('raw_zoho_data')
      .select('data')
      .eq('entity_type', 'tasks');

    if (tasksError) throw tasksError;
    if (!tasks) return [];

    // Process users and their tasks
    return users.map(userRow => {
      const userData = userRow.data;
      const userTasks = tasks.filter(taskRow => 
        taskRow.data.details?.owners?.some((owner: TaskOwner) => owner.id === userData.id)
      );

      const now = new Date();
      const completedTasks = userTasks.filter(taskRow => 
        taskRow.data.status?.type === 'closed' || 
        taskRow.data.status?.name === 'Closed' ||
        taskRow.data.completed === true
      );
      
      const overdueTasks = userTasks.filter(taskRow => 
        !(taskRow.data.status?.type === 'closed' || taskRow.data.status?.name === 'Closed') && 
        taskRow.data.end_date && 
        new Date(taskRow.data.end_date) < now
      );

      return {
        id: userData.id,
        name: userData.name || 'Unknown User',
        email: userData.email || '',
        role: userData.role || 'member',
        status: userData.status || 'inactive',
        lastActive: userData.last_active_time || null,
        joinedDate: userData.created_time || null,
        taskCount: userTasks.length,
        completedTaskCount: completedTasks.length,
        overdueTaskCount: overdueTasks.length
      };
    });
  } catch (error) {
    console.error('Error fetching user metrics:', error);
    return [];
  }
} 