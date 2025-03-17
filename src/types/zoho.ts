export interface TaskOwner {
  id: string;
  name: string;
  email: string;
  full_name: string;
  work: string;
}

export interface TaskStatus {
  id: string;
  name: string;
  type: string;
  color_code: string;
}

export interface TaskProject {
  id: string;
  name: string;
}

export interface TaskData {
  id: number;
  name: string;
  completed: boolean;
  completed_time_format?: string;
  end_date_format: string;
  created_time_format: string;
  status: TaskStatus;
  project: TaskProject;
  details: {
    owners: TaskOwner[];
  };
  percent_complete: string;
}

export interface ZohoTask {
  id: string;
  entity_type: 'tasks';
  entity_id: string;
  data: TaskData;
  created_at: string;
  updated_at: string;
}

export interface ProjectData {
  id: string;
  name: string;
  status: string;
  task_count: {
    open: number;
    closed: number;
  };
  start_date: string;
  end_date: string;
  created_date: string;
  owner_name: string;
  group_name: string;
  project_percent: string;
}

export interface ZohoProject {
  id: string;
  entity_type: 'projects';
  entity_id: string;
  data: ZohoProjectData;
  created_at: string;
  updated_at: string;
}

export interface MetricThresholds {
  success: number;
  warning: number;
}

export type MetricStatus = 'success' | 'warning' | 'danger';

export interface Metric {
  label: string;
  value: number;
  unit: string;
  description: string;
  status: MetricStatus;
}

export interface ProjectMetrics {
  taskCompletionRate: Metric;
  timelinessRate: Metric;
  openTasksAging: Metric;
  backlogRate: Metric;
}

export interface ZohoProjectData {
  id: string;
  name: string;
  status: string;
  task_count: {
    open: number;
    closed: number;
  };
  start_date: string;
  end_date: string;
  created_date: string;
  owner_name: string;
  group_name: string;
  project_percent: string;
} 