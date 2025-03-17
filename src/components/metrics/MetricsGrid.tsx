import { useEffect, useState } from 'react'
import MetricCard from './MetricCard'
import TaskList from './TaskList'
import { fetchProjectMetrics } from '@/services/zohoService'
import { Metric } from '@/types/zoho'
import { supabase } from '@/lib/supabase'

interface Project {
  id: string
  name: string
}

interface ProjectMetrics {
  taskCompletionRate: Metric
  timelinessRate: Metric
  openTasksAging: Metric
  backlogRate: Metric
}

interface Task {
  id: string
  title: string
  status: string
  dueDate: string | null
  createdTime: string | null
  completed: boolean
}

export default function MetricsGrid() {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState<Project[]>([])
  const [projectMetrics, setProjectMetrics] = useState<ProjectMetrics | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])

  // Load projects list
  useEffect(() => {
    const projectsList = [
      { id: 'all', name: 'All Projects' },
      { id: '134658000000783005', name: 'Hapup & Bewild- Ops' },
      { id: '134658000000471084', name: 'Collective Ops - Hyderabad Functional' },
      { id: '134658000000512239', name: 'BI' },
      { id: '134658000000482517', name: 'Project Management' },
      { id: '134658000001186005', name: 'Mumbai Collective Set up' },
      { id: '134658000000482237', name: 'Collective Ops - Poomale1.0 Functional' },
      { id: '134658000000471064', name: 'Ecological Design - Hyderabad Functional' },
      { id: '134658000001191777', name: 'Poomale 2.0 Collective Setup' },
      { id: '134658000000783049', name: 'Bewild Produce Preparedness plan -2024' },
      { id: '134658000001116009', name: 'Bhopal Collective Setup' },
      { id: '134658000000769741', name: 'Hammiyala Hospitality' },
      { id: '134658000000512069', name: 'Ecological Design - Poomale1.0 Functional' },
      { id: '134658000000609120', name: 'Infrastructure Setup - Hyderabad Functional' },
      { id: '134658000001191535', name: 'Hammiyala Collective Set up' },
      { id: '134658000000840155', name: 'Bewild Business Operations' },
      { id: '134658000000600498', name: 'Poomale Hospitality' },
      { id: '134658000000767850', name: 'Bodakonda Hospitality' },
      { id: '134658000000769931', name: 'Human Resource' },
      { id: '134658000000951273', name: 'BeWild Farm Produce Operations' },
      { id: '134658000001218005', name: 'Ecological Design HO' },
      { id: '134658000001605029', name: 'New Product Launch' },
      { id: '134658000000541327', name: 'Admin - Beforest' },
      { id: '134658000001354512', name: 'Bewild Veggie Bag Process Flow' },
      { id: '134658000000645405', name: 'CRM Mumbai' },
      { id: '134658000001726017', name: 'Bewild Packaging & Labelling' },
      { id: '134658000000874035', name: 'Legal & Liasioning - Hyd' },
      { id: '134658000000653210', name: 'Finance - Beforest' },
      { id: '134658000001352440', name: 'Bewild Marketing' },
      { id: '134658000001502099', name: 'Test Project' },
      { id: '134658000001495153', name: 'Regolith Coorg Works Planning' }
    ]
    setProjects(projectsList)
  }, [])

  // Fetch metrics and tasks when project selection changes
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const metrics = await fetchProjectMetrics(selectedProjectId === 'all' ? undefined : selectedProjectId)
        setProjectMetrics(metrics)
        
        // Get tasks from the raw data
        const { data: tasksData, error } = await supabase
          .from('raw_zoho_data')
          .select('data')
          .eq('entity_type', 'tasks')
          .order('data->created_time', { ascending: false });

        if (error) {
          console.error('Error fetching tasks:', error);
          return;
        }

        const processedTasks = tasksData
          ?.map(row => {
            const task = row.data;
            const taskUrl = task?.link?.self?.url;
            if (!taskUrl) return null;

            const projectIdMatch = taskUrl.match(/\/projects\/(\d+)\/tasks\//);
            if (!projectIdMatch) return null;

            const projectId = projectIdMatch[1];
            if (selectedProjectId !== 'all' && projectId !== selectedProjectId) return null;

            return {
              id: task.id,
              title: task.name || 'Untitled Task',
              status: task.status || 'unknown',
              dueDate: task.end_date,
              createdTime: task.created_time,
              completed: task.completed === 'true' || task.completed === true || task.status === 'completed'
            };
          })
          .filter((task): task is Task => task !== null);

        setTasks(processedTasks || []);
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [selectedProjectId])

  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId)
  }

  if (loading) {
    return (
      <div>
        <div className="mb-6">
          <label htmlFor="project" className="block text-sm font-medium text-gray-700">
            Select Project
          </label>
          <select
            id="project"
            name="project"
            className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            value={selectedProjectId}
            onChange={(e) => handleProjectChange(e.target.value)}
            disabled={loading}
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!projectMetrics) {
    return (
      <div className="text-center py-8 text-gray-500">
        No metrics available for this project
      </div>
    )
  }

  const metricsData = [
    {
      title: projectMetrics.taskCompletionRate.label,
      value: `${projectMetrics.taskCompletionRate.value}${projectMetrics.taskCompletionRate.unit}`,
      change: projectMetrics.taskCompletionRate.description,
      color: projectMetrics.taskCompletionRate.status === 'success' ? 'text-emerald-600' : 
             projectMetrics.taskCompletionRate.status === 'warning' ? 'text-amber-500' : 'text-red-600'
    },
    {
      title: projectMetrics.timelinessRate.label,
      value: `${projectMetrics.timelinessRate.value}${projectMetrics.timelinessRate.unit}`,
      change: projectMetrics.timelinessRate.description,
      color: projectMetrics.timelinessRate.status === 'success' ? 'text-emerald-600' : 
             projectMetrics.timelinessRate.status === 'warning' ? 'text-amber-500' : 'text-red-600'
    },
    {
      title: projectMetrics.openTasksAging.label,
      value: `${projectMetrics.openTasksAging.value}${projectMetrics.openTasksAging.unit}`,
      change: projectMetrics.openTasksAging.description,
      color: projectMetrics.openTasksAging.status === 'success' ? 'text-emerald-600' : 
             projectMetrics.openTasksAging.status === 'warning' ? 'text-amber-500' : 'text-red-600'
    },
    {
      title: projectMetrics.backlogRate.label,
      value: `${projectMetrics.backlogRate.value}${projectMetrics.backlogRate.unit}`,
      change: projectMetrics.backlogRate.description,
      color: projectMetrics.backlogRate.status === 'success' ? 'text-emerald-600' : 
             projectMetrics.backlogRate.status === 'warning' ? 'text-amber-500' : 'text-red-600'
    }
  ]

  return (
    <div>
      <div className="mb-6">
        <label htmlFor="project" className="block text-sm font-medium text-gray-700">
          Select Project
        </label>
        <select
          id="project"
          name="project"
          className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          value={selectedProjectId}
          onChange={(e) => handleProjectChange(e.target.value)}
        >
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {metricsData.map((metric) => (
          <MetricCard
            key={metric.title}
            title={metric.title}
            value={metric.value}
            change={metric.change}
            color={metric.color}
          />
        ))}
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Tasks</h3>
        <TaskList tasks={tasks} loading={loading} />
      </div>
    </div>
  )
} 