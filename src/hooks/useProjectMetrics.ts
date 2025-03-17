import { useState, useEffect, useCallback } from 'react';
import { ProjectMetrics, ZohoProject } from '@/types/zoho';
import { fetchProjectMetrics, fetchProjects } from '@/services/zohoService';

interface UseProjectMetricsResult {
  metrics: ProjectMetrics | null;
  projects: ZohoProject[];
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  isLoading: boolean;
  error: Error | null;
}

export const useProjectMetrics = (): UseProjectMetricsResult => {
  const [metrics, setMetrics] = useState<ProjectMetrics | null>(null);
  const [projects, setProjects] = useState<ZohoProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load projects on mount
  useEffect(() => {
    const loadProjects = async () => {
      try {
        console.log('Loading projects...');
        const projectData = await fetchProjects();
        console.log('Projects loaded:', projectData.length);
        setProjects(projectData);
      } catch (err) {
        console.error('Error loading projects:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch projects'));
      }
    };

    loadProjects();
  }, []);

  // Load metrics when project selection changes
  useEffect(() => {
    let isMounted = true;

    const loadMetrics = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('Loading metrics for project:', selectedProjectId || 'ALL');
        const calculatedMetrics = await fetchProjectMetrics(selectedProjectId || undefined);
        
        if (isMounted) {
          console.log('Setting metrics:', calculatedMetrics);
          setMetrics(calculatedMetrics);
        }
      } catch (err) {
        console.error('Error loading metrics:', err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch metrics'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadMetrics();

    return () => {
      isMounted = false;
    };
  }, [selectedProjectId]);

  const handleProjectSelection = useCallback((id: string | null) => {
    console.log('Setting selected project:', id);
    setSelectedProjectId(id);
  }, []);

  return {
    metrics,
    projects,
    selectedProjectId,
    setSelectedProjectId: handleProjectSelection,
    isLoading,
    error
  };
}; 