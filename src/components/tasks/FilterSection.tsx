import React from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { DateRangeSelector } from './DateRangeSelector';
import { TaskFilters, FilterChangeType, FilterValue } from '@/types/task';

interface FilterSectionProps {
  filters: TaskFilters;
  availableStatuses: string[];
  availablePriorities: string[];
  onFilterChange: (
    type: FilterChangeType,
    value: FilterValue
  ) => void;
}

export function FilterSection({
  filters,
  availableStatuses,
  availablePriorities,
  onFilterChange,
}: FilterSectionProps) {
  // Add debug logging
  console.log('FilterSection rendering with:', {
    availableStatuses,
    availablePriorities,
    selectedStatuses: filters.selectedStatuses,
    selectedPriorities: filters.selectedPriorities
  });

  const handleStatusToggle = (status: string) => {
    const isSelected = filters.selectedStatuses.includes(status);
    console.log(`Status toggle: ${status}, currently selected: ${isSelected}`);
    
    const newSelectedStatuses = isSelected
      ? filters.selectedStatuses.filter(s => s !== status)
      : [...filters.selectedStatuses, status];
    
    console.log('New selected statuses:', newSelectedStatuses);
    onFilterChange('status', newSelectedStatuses);
  };

  const handlePriorityToggle = (priority: string) => {
    const isSelected = filters.selectedPriorities.includes(priority);
    console.log(`Priority toggle: ${priority}, currently selected: ${isSelected}`);
    
    const newSelectedPriorities = isSelected
      ? filters.selectedPriorities.filter(p => p !== priority)
      : [...filters.selectedPriorities, priority];
    
    console.log('New selected priorities:', newSelectedPriorities);
    onFilterChange('priority', newSelectedPriorities);
  };

  return (
    <div className="space-y-4 mb-6 p-4 bg-white rounded-lg border border-neutral-100 shadow-sm transition-shadow hover:shadow-md">
      {/* Search Input */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
        <input
          type="text"
          placeholder="Search tasks..."
          value={filters.search}
          onChange={(e) => onFilterChange('search', e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Filter Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Status Filters */}
        <div>
          <h3 className="text-sm font-medium text-neutral-700 mb-2">Status</h3>
          <div className="flex flex-wrap gap-2">
            {availableStatuses.map((status) => (
              <button
                key={status}
                onClick={() => handleStatusToggle(status)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${
                  filters.selectedStatuses.includes(status)
                    ? 'bg-primary-100 text-primary-700 border border-primary-300'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Priority Filters */}
        <div>
          <h3 className="text-sm font-medium text-neutral-700 mb-2">Priority</h3>
          <div className="flex flex-wrap gap-2">
            {availablePriorities.map((priority) => (
              <button
                key={priority}
                onClick={() => handlePriorityToggle(priority)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${
                  filters.selectedPriorities.includes(priority)
                    ? 'bg-amber-100 text-amber-700 border border-amber-300'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {priority}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Date Range Selector */}
      <div>
        <h3 className="text-sm font-medium text-neutral-700 mb-2">Date Range</h3>
        <DateRangeSelector
          selectedRange={filters.dateRangeType}
          customRange={filters.dateRange}
          onRangeChange={(range) => onFilterChange('dateRangeType', range)}
          onCustomRangeChange={(range) => onFilterChange('dateRange', range)}
        />
      </div>
    </div>
  );
} 