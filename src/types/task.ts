import { DateRangeType } from '@/components/tasks/DateRangeSelector';

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

export interface TaskFilters {
  search: string;
  selectedStatuses: string[];
  selectedPriorities: string[];
  dateRangeType: DateRangeType | null;
  dateRange: {
    start: string | null;
    end: string | null;
  };
}

export type FilterChangeType = 'search' | 'status' | 'priority' | 'dateRangeType' | 'dateRange';

export type FilterValue = 
  | string  // for search
  | string[] // for status or priority
  | DateRangeType // for dateRangeType
  | { start: string | null; end: string | null }; // for custom dateRange

// Helper functions for date handling
export const isIsoDateFormat = (dateString: string): boolean => {
  return /^\d{4}-\d{2}-\d{2}/.test(dateString);
};

export const convertDateToIsoFormat = (dateString: string): string => {
  try {
    // Handle MM-DD-YYYY format (from Zoho)
    const match = dateString.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (match) {
      const [, month, day, year] = match;
      return `${year}-${month}-${day}`;
    }
    
    // Try to parse as a Date object and convert to ISO
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    
    // If all else fails, return the original string
    console.warn('Could not convert date format:', dateString);
    return dateString;
  } catch (error) {
    console.error('Error converting date format:', error);
    return dateString;
  }
}; 