import { supabase } from '@/lib/supabaseClient';

// User Metrics Interfaces
export interface UtilizationRate {
  total_open_tasks: number;
  stale_tasks: number;
  utilization_rate: number;
}

export interface TaskTimeliness {
  total_tasks: number;
  on_time_tasks: number;
  timeliness_rate: string;
}

export interface AvgCompletionTime {
  total_completed_tasks: number;
  avg_completion_time: number;
}

export interface TaskAging {
  total_overdue_tasks: number;
  avg_days_overdue: number;
}

// Project Metrics Interfaces
export interface UnplannedPercentage {
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
}

export interface ProjectTaskTimeliness {
  total_tasks: number;
  on_time_tasks: number;
  timeliness_rate: string;
}

export interface OpenTasksAging {
  total_overdue_tasks: number;
  total_overdue_days: number;
  average_aging: string;
}

export interface BacklogRate {
  total_open_tasks: number;
  rotten_tasks: number;
  rotten_percentage: string;
}

// Project interface
export interface Project {
  id: string;
  name: string;
  status: string;
}

// User interface
export interface User {
  id: string;
  full_name: string;
  email: string;
}

// Task Owner interface
interface TaskOwner {
  id: string;
  name: string;
  email?: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  zpuid: string;
  work?: string;
}

// User Metrics Functions
export const getUserUtilizationRate = async (fullName: string): Promise<UtilizationRate> => {
  const { data, error } = await supabase
    .rpc('calculate_utilization_rate', { input_full_name: fullName });
  
  if (error) {
    console.error('Error fetching utilization rate:', error);
    throw error;
  }
  if (!data || data.length === 0) {
    return { total_open_tasks: 0, stale_tasks: 0, utilization_rate: 0 };
  }
  return {
    total_open_tasks: data[0].total_open_tasks,
    stale_tasks: data[0].stale_tasks,
    utilization_rate: parseFloat((data[0].utilization_rate * 100).toFixed(2))
  };
};

export const getUserTaskTimeliness = async (fullName: string): Promise<TaskTimeliness> => {
  const { data, error } = await supabase
    .rpc('calculate_task_timeliness_users', { input_full_name: fullName });
  
  if (error) {
    console.error('Error fetching task timeliness:', error);
    throw error;
  }
  if (!data || data.length === 0) {
    return { total_tasks: 0, on_time_tasks: 0, timeliness_rate: '0%' };
  }
  return {
    total_tasks: data[0].total_tasks,
    on_time_tasks: data[0].on_time_tasks,
    timeliness_rate: data[0].timeliness_rate
  };
};

export const getUserAvgCompletionTime = async (fullName: string): Promise<AvgCompletionTime> => {
  const { data, error } = await supabase
    .rpc('calculate_avg_completion_time', { input_full_name: fullName });
  
  if (error) {
    console.error('Error fetching avg completion time:', error);
    throw error;
  }
  if (!data || data.length === 0) {
    return { total_completed_tasks: 0, avg_completion_time: 0 };
  }
  return {
    total_completed_tasks: data[0].total_completed_tasks,
    avg_completion_time: parseFloat(data[0].avg_completion_time.toFixed(2))
  };
};

export const getUserTaskAging = async (fullName: string): Promise<TaskAging> => {
  const { data, error } = await supabase
    .rpc('calculate_pending_tasks_aging', { input_full_name: fullName });
  
  if (error) {
    console.error('Error fetching task aging:', error);
    throw error;
  }
  if (!data || data.length === 0) {
    return { total_overdue_tasks: 0, avg_days_overdue: 0 };
  }
  return {
    total_overdue_tasks: data[0].total_overdue_tasks,
    avg_days_overdue: parseFloat(data[0].avg_days_overdue.toFixed(2))
  };
};

// Function to fetch all users
export const getAllUsers = async (): Promise<User[]> => {
  const { data: tasks, error } = await supabase
    .from('raw_zoho_data')
    .select('data')
    .eq('entity_type', 'tasks')
    .not('data->details->owners', 'is', null);

  if (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
  if (!tasks) return [];

  // Extract unique users from task owners
  const userMap = new Map<string, User>();
  
  tasks.forEach(task => {
    if (task.data?.details?.owners && Array.isArray(task.data.details.owners)) {
      task.data.details.owners.forEach((owner: TaskOwner) => {
        if (owner.zpuid && owner.full_name) {
          userMap.set(owner.zpuid, {
            id: owner.zpuid,
            full_name: owner.full_name,
            email: owner.email || ''
          });
        }
      });
    }
  });

  const users = Array.from(userMap.values());
  console.log('Found users:', users); // Debug log
  return users;
};

// Aggregated Metrics Functions
export const getAllUserMetrics = async (fullName: string) => {
  const [utilization, timeliness, completion, aging] = await Promise.all([
    getUserUtilizationRate(fullName),
    getUserTaskTimeliness(fullName),
    getUserAvgCompletionTime(fullName),
    getUserTaskAging(fullName)
  ]);

  return {
    utilization,
    timeliness,
    completion,
    aging
  };
};

// Project Metrics Functions
export const getProjectUnplannedPercentage = async (projectId: string): Promise<UnplannedPercentage> => {
  const { data, error } = await supabase
    .rpc('calculate_project_unplanned_percentage', { p_project_id: projectId });
  
  if (error) throw error;
  return data[0];
};

export const getProjectTaskTimeliness = async (projectId: string): Promise<ProjectTaskTimeliness> => {
  const { data, error } = await supabase
    .rpc('calculate_task_timeliness', { project_id: projectId });
  
  if (error) throw error;
  return data[0];
};

export const getProjectOpenTasksAging = async (projectId: string): Promise<OpenTasksAging> => {
  const { data, error } = await supabase
    .rpc('calculate_open_tasks_aging', { p_project_id: projectId });
  
  if (error) throw error;
  return data[0];
};

export const getProjectBacklogRate = async (projectId: string): Promise<BacklogRate> => {
  const { data, error } = await supabase
    .rpc('calculate_rotten_tasks', { p_project_id: projectId });
  
  if (error) throw error;
  return data[0];
};

// Function to fetch all projects
export const getAllProjects = async (): Promise<Project[]> => {
  const { data, error } = await supabase
    .from('raw_zoho_data')
    .select('data')
    .eq('entity_type', 'projects')
    .order('data->name');

  if (error) throw error;

  return data.map(row => ({
    id: row.data.id_string,
    name: row.data.name || 'Unnamed Project',
    status: row.data.status?.name || 'Unknown'
  }));
};

export const getAllProjectMetrics = async (projectId: string) => {
  const [unplanned, timeliness, aging, backlog] = await Promise.all([
    getProjectUnplannedPercentage(projectId),
    getProjectTaskTimeliness(projectId),
    getProjectOpenTasksAging(projectId),
    getProjectBacklogRate(projectId)
  ]);

  return {
    unplanned,
    timeliness,
    aging,
    backlog
  };
}; 