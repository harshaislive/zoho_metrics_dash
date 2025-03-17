import React, { useState, useMemo } from 'react';
import { TaskList } from './TaskList';
import { createClient } from '@supabase/supabase-js';
import LoadingSpinner from '../LoadingSpinner';
import { FilterSection } from './FilterSection';
import { DateRangeType } from './DateRangeSelector';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export interface Task {
  id: number;
  name: string;
  status: string;
  priority: string;
  start_date: string;
  end_date: string;
  percent_complete: number;
  description?: string;
  custom_status_name?: string;
  custom_status_color?: string;
}

type FilterValue = 
  | string  // for search
  | string[] // for status
  | DateRangeType // for dateRangeType
  | { start: string | null; end: string | null }; // for custom dateRange

interface TaskAccordionProps {
  userId: string;
}

const getDateRangeFromType = (type: DateRangeType | null): { start: string | null; end: string | null } => {
  if (!type) return { start: null, end: null };

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  
  const startOfLastWeek = new Date(startOfWeek);
  startOfLastWeek.setDate(startOfWeek.getDate() - 7);
  
  const endOfLastWeek = new Date(startOfWeek);
  endOfLastWeek.setDate(endOfLastWeek.getDate() - 1);

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

  const startOfYear = new Date(today.getFullYear(), 0, 1);
  const startOfLastYear = new Date(today.getFullYear() - 1, 0, 1);
  const endOfLastYear = new Date(today.getFullYear() - 1, 11, 31);

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  switch (type) {
    case 'today':
      return { start: formatDate(today), end: formatDate(today) };
    case 'yesterday':
      return { start: formatDate(yesterday), end: formatDate(yesterday) };
    case 'this_week':
      return { start: formatDate(startOfWeek), end: formatDate(today) };
    case 'last_week':
      return { start: formatDate(startOfLastWeek), end: formatDate(endOfLastWeek) };
    case 'this_month':
      return { start: formatDate(startOfMonth), end: formatDate(today) };
    case 'last_month':
      return { start: formatDate(startOfLastMonth), end: formatDate(endOfLastMonth) };
    case 'this_year':
      return { start: formatDate(startOfYear), end: formatDate(today) };
    case 'last_year':
      return { start: formatDate(startOfLastYear), end: formatDate(endOfLastYear) };
    case 'custom':
      return { start: null, end: null };
    default:
      return { start: null, end: null };
  }
};

export function TaskAccordion({ userId }: TaskAccordionProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedTask, setExpandedTask] = useState<number | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    selectedStatuses: [] as string[],
    dateRangeType: null as DateRangeType | null,
    dateRange: {
      start: null as string | null,
      end: null as string | null,
    },
  });
  
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

      // Transform the data to match our Task interface
      const transformedTasks = tasksData?.map(item => ({
        id: item.data.id,
        name: item.data.name,
        status: item.data.status.name,
        priority: item.data.priority,
        start_date: item.data.start_date,
        end_date: item.data.end_date,
        percent_complete: parseInt(item.data.percent_complete),
        description: item.data.description,
        custom_status_name: item.data.status.name,
        custom_status_color: item.data.status.color_code
      })) || [];

      setTasks(transformedTasks);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Failed to load tasks. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (userId) {
      fetchTasks();
    }
  }, [userId]);

  const handleFilterChange = (
    type: 'search' | 'status' | 'dateRangeType' | 'dateRange',
    value: FilterValue
  ) => {
    setFilters((prev) => {
      if (type === 'dateRangeType') {
        const dateRangeType = value as DateRangeType;
        return {
          ...prev,
          dateRangeType,
          dateRange: dateRangeType === 'custom' ? prev.dateRange : getDateRangeFromType(dateRangeType),
        };
      }
      return {
        ...prev,
        [type]: value,
      };
    });
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Search filter
      const searchMatch =
        !filters.search ||
        task.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        (task.description?.toLowerCase() || '').includes(
          filters.search.toLowerCase()
        );

      // Status filter
      const statusMatch =
        filters.selectedStatuses.length === 0 ||
        filters.selectedStatuses.includes(task.status);

      // Date filter
      const dateRange = filters.dateRangeType === 'custom' 
        ? filters.dateRange 
        : getDateRangeFromType(filters.dateRangeType);

      const startDate = dateRange.start ? new Date(dateRange.start) : null;
      const endDate = dateRange.end ? new Date(dateRange.end) : null;
      const taskStartDate = new Date(task.start_date);
      const taskEndDate = new Date(task.end_date);

      const dateMatch =
        (!startDate || taskStartDate >= startDate) &&
        (!endDate || taskEndDate <= endDate);

      return searchMatch && statusMatch && dateMatch;
    });
  }, [tasks, filters]);

  const availableStatuses = useMemo(() => {
    return Array.from(new Set(tasks.map((task) => task.status)));
  }, [tasks]);

  const tasksByStatus = useMemo(() => {
    return filteredTasks.reduce((acc, task) => {
      const status = task.custom_status_name || task.status;
      if (!acc[status]) acc[status] = [];
      acc[status].push(task);
      return acc;
    }, {} as Record<string, Task[]>);
  }, [filteredTasks]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-secondary-500 text-sm p-4 bg-secondary-50 rounded-lg">
        {error}
      </div>
    );
  }

  if (!tasks.length) {
    return (
      <div className="text-neutral-600 text-sm p-4 bg-neutral-50 rounded-lg">
        No tasks found for this user.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <FilterSection
        filters={filters}
        availableStatuses={availableStatuses}
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