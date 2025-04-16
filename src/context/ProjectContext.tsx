import { createContext, useContext, ReactNode, useState } from 'react';
import { Project } from '../services/metricsService';

// Define types for the metrics
export interface ProjectMetrics {
  unplanned?: {
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
  timeliness?: {
    total_tasks: number;
    on_time_tasks: number;
    timeliness_rate: string;
  };
  aging?: {
    total_overdue_tasks: number;
    total_overdue_days: number;
    average_aging: string;
  };
  backlog?: {
    total_open_tasks: number;
    rotten_tasks: number;
    rotten_percentage: string;
  };
}

// Define the context shape
interface ProjectContextType {
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  selectedProject: Project | null;
  setSelectedProject: (project: Project | null) => void;
  projectMetrics: ProjectMetrics | null;
  setProjectMetrics: (metrics: ProjectMetrics | null) => void;
}

// Create the context with default values
const ProjectContext = createContext<ProjectContextType>({
  selectedProjectId: null,
  setSelectedProjectId: () => {},
  selectedProject: null,
  setSelectedProject: () => {},
  projectMetrics: null,
  setProjectMetrics: () => {},
});

// Create a provider component
interface ProjectProviderProps {
  children: ReactNode;
}

export function ProjectProvider({ children }: ProjectProviderProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectMetrics, setProjectMetrics] = useState<ProjectMetrics | null>(null);

  return (
    <ProjectContext.Provider value={{ 
      selectedProjectId, 
      setSelectedProjectId,
      selectedProject,
      setSelectedProject,
      projectMetrics,
      setProjectMetrics
    }}>
      {children}
    </ProjectContext.Provider>
  );
}

// Custom hook to use the context
export function useProject() {
  return useContext(ProjectContext);
} 