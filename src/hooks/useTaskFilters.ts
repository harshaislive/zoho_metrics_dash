import { useState, useMemo } from 'react';
import { Task, TaskFilters, FilterChangeType, FilterValue } from '@/types/task';
import { DateRangeType } from '@/components/tasks/DateRangeSelector';

// Helper to get date ranges from predefined types
export const getDateRangeFromType = (type: DateRangeType | null): { start: string | null; end: string | null } => {
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

export function useTaskFilters(tasks: Task[]) {
  // Initialize filter state
  const [filters, setFilters] = useState<TaskFilters>({
    search: '',
    selectedStatuses: [],
    selectedPriorities: [],
    dateRangeType: null,
    dateRange: {
      start: null,
      end: null,
    },
  });

  // Handle filter changes
  const handleFilterChange = (type: FilterChangeType, value: FilterValue) => {
    console.log(`Filter change: type=${type}, value=`, value);
    
    setFilters((prev) => {
      if (type === 'dateRangeType') {
        const dateRangeType = value as DateRangeType;
        console.log('Setting dateRangeType to:', dateRangeType);
        
        let newDateRange = prev.dateRange;
        
        // Only calculate a new date range if not using custom dates
        if (dateRangeType !== 'custom') {
          newDateRange = getDateRangeFromType(dateRangeType);
          console.log('Calculated date range:', newDateRange);
        }
        
        return {
          ...prev,
          dateRangeType,
          dateRange: newDateRange
        };
      } else if (type === 'dateRange') {
        const dateRange = value as { start: string | null; end: string | null };
        console.log('Setting custom dateRange to:', dateRange);
        return {
          ...prev,
          dateRange
        };
      } else if (type === 'status') {
        const selectedStatuses = value as string[];
        console.log('Setting status filters to:', selectedStatuses);
        return {
          ...prev,
          selectedStatuses
        };
      } else if (type === 'priority') {
        const selectedPriorities = value as string[];
        console.log('Setting priority filters to:', selectedPriorities);
        return {
          ...prev,
          selectedPriorities
        };
      } else if (type === 'search') {
        const searchText = value as string;
        console.log('Setting search text to:', searchText);
        return {
          ...prev,
          search: searchText
        };
      }
      
      // This should never happen, but return the previous state just in case
      console.warn('Unknown filter type:', type);
      return prev;
    });
  };

  // Compute available statuses
  const availableStatuses = useMemo(() => {
    return Array.from(new Set(tasks.map((task) => task.status)));
  }, [tasks]);

  // Compute available priorities
  const availablePriorities = useMemo(() => {
    return Array.from(new Set(tasks.map((task) => task.priority)));
  }, [tasks]);

  // Apply filters
  const filteredTasks = useMemo(() => {
    console.log('Applying filters:', {
      search: filters.search,
      selectedStatuses: filters.selectedStatuses,
      selectedPriorities: filters.selectedPriorities,
      dateRangeType: filters.dateRangeType,
      dateRange: filters.dateRange
    });

    return tasks.filter((task) => {
      // Search filter
      const searchMatch =
        !filters.search ||
        task.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        (task.description?.toLowerCase() || '').includes(
          filters.search.toLowerCase()
        );

      // Status filter - normalize status values for comparison
      const taskStatus = (task.status || '').trim();
      const statusMatch =
        filters.selectedStatuses.length === 0 ||
        filters.selectedStatuses.some(status => 
          status.trim().toLowerCase() === taskStatus.toLowerCase()
        );
      
      // Log status matching for debugging
      if (filters.selectedStatuses.length > 0) {
        console.log('Status matching for task:', {
          taskId: task.id,
          taskName: task.name,
          taskStatus,
          selectedStatuses: filters.selectedStatuses,
          statusMatch
        });
      }

      // Priority filter - normalize priority values for comparison
      const taskPriority = (task.priority || '').trim();
      const priorityMatch =
        filters.selectedPriorities.length === 0 ||
        filters.selectedPriorities.some(priority => 
          priority.trim().toLowerCase() === taskPriority.toLowerCase()
        );
      
      // Log priority matching for debugging
      if (filters.selectedPriorities.length > 0) {
        console.log('Priority matching for task:', {
          taskId: task.id,
          taskName: task.name,
          taskPriority,
          selectedPriorities: filters.selectedPriorities,
          priorityMatch
        });
      }

      // Date filter
      const dateRange = filters.dateRangeType === 'custom' 
        ? filters.dateRange 
        : getDateRangeFromType(filters.dateRangeType);

      // Log date range for debugging
      if (filters.dateRangeType) {
        console.log('Date Filter Applied:', {
          dateRangeType: filters.dateRangeType,
          calculatedDateRange: dateRange,
        });
      }

      // Skip date filtering if no date range is selected
      if (!filters.dateRangeType || (!dateRange.start && !dateRange.end)) {
        // Return result based on other filters
        const result = searchMatch && statusMatch && priorityMatch;
        
        // Log final filter result for debugging (only for first few tasks)
        if (task.id <= tasks[0]?.id + 2) { // Log first 3 tasks
          console.log('Filter result for task:', {
            taskId: task.id,
            taskName: task.name,
            searchMatch,
            statusMatch,
            priorityMatch,
            finalResult: result
          });
        }
        
        return result;
      }

      // Convert date strings to timestamps for consistent comparison
      const startTimestamp = dateRange.start ? new Date(dateRange.start).getTime() : null;
      const endTimestamp = dateRange.end ? new Date(dateRange.end).getTime() : null;
      
      // Handle cases where the task might not have dates
      let taskStartTimestamp: number | null = null;
      let taskEndTimestamp: number | null = null;
      
      try {
        taskStartTimestamp = task.start_date ? new Date(task.start_date).getTime() : null;
        taskEndTimestamp = task.end_date ? new Date(task.end_date).getTime() : null;
      } catch (error) {
        console.error('Error parsing task dates:', error, { task });
        // Fall back to string comparison if date parsing fails
        return searchMatch && statusMatch && priorityMatch;
      }

      // Log task dates for debugging (only for first task to avoid flooding)
      if (filters.dateRangeType && task.id === tasks[0]?.id) {
        console.log('Task Date Debug:', {
          taskId: task.id,
          taskName: task.name,
          taskStartDate: task.start_date,
          taskEndDate: task.end_date,
          parsedTaskStartTimestamp: taskStartTimestamp,
          parsedTaskEndTimestamp: taskEndTimestamp,
          startTimestamp,
          endTimestamp
        });
      }

      const dateMatch =
        (!startTimestamp || !taskStartTimestamp || taskStartTimestamp >= startTimestamp) &&
        (!endTimestamp || !taskEndTimestamp || taskEndTimestamp <= endTimestamp);

      // Log date match result for debugging (only for first task to avoid flooding)
      if (filters.dateRangeType && task.id === tasks[0]?.id) {
        console.log('Date Match Result:', {
          taskId: task.id,
          dateMatch,
          condition1: !startTimestamp || !taskStartTimestamp || taskStartTimestamp >= startTimestamp,
          condition2: !endTimestamp || !taskEndTimestamp || taskEndTimestamp <= endTimestamp,
          startComparison: taskStartTimestamp && startTimestamp ? 
            `${taskStartTimestamp} >= ${startTimestamp} = ${taskStartTimestamp >= startTimestamp}` : 'N/A',
          endComparison: taskEndTimestamp && endTimestamp ?
            `${taskEndTimestamp} <= ${endTimestamp} = ${taskEndTimestamp <= endTimestamp}` : 'N/A',
        });
      }

      const finalResult = searchMatch && statusMatch && priorityMatch && dateMatch;
      
      // Log final filter result for debugging (only for first few tasks)
      if (task.id <= tasks[0]?.id + 2) { // Log first 3 tasks
        console.log('Filter result for task:', {
          taskId: task.id,
          taskName: task.name,
          searchMatch,
          statusMatch,
          priorityMatch,
          dateMatch,
          finalResult
        });
      }

      return finalResult;
    });
  }, [tasks, filters]);

  // Group tasks by status for UI
  const tasksByStatus = useMemo(() => {
    return filteredTasks.reduce((acc, task) => {
      const status = task.custom_status_name || task.status;
      if (!acc[status]) acc[status] = [];
      acc[status].push(task);
      return acc;
    }, {} as Record<string, Task[]>);
  }, [filteredTasks]);

  return {
    filters,
    handleFilterChange,
    availableStatuses,
    availablePriorities,
    filteredTasks,
    tasksByStatus
  };
} 