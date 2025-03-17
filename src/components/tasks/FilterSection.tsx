import React from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { DateRangeSelector, DateRangeType } from './DateRangeSelector';

type FilterValue = 
  | string  // for search
  | string[] // for status
  | DateRangeType // for dateRangeType
  | { start: string | null; end: string | null }; // for custom dateRange

interface FilterSectionProps {
  filters: {
    search: string;
    selectedStatuses: string[];
    dateRangeType: DateRangeType;
    dateRange: {
      start: string | null;
      end: string | null;
    };
  };
  availableStatuses: string[];
  onFilterChange: (
    type: 'search' | 'status' | 'dateRangeType' | 'dateRange',
    value: FilterValue
  ) => void;
}

export function FilterSection({
  filters,
  availableStatuses,
  onFilterChange,
}: FilterSectionProps) {
  return (
    <div className="space-y-4 mb-6 p-4 bg-white rounded-lg border border-neutral-100">
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

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2">
        {availableStatuses.map((status) => (
          <button
            key={status}
            onClick={() => {
              const newSelectedStatuses = filters.selectedStatuses.includes(status)
                ? filters.selectedStatuses.filter((s) => s !== status)
                : [...filters.selectedStatuses, status];
              onFilterChange('status', newSelectedStatuses);
            }}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${
              filters.selectedStatuses.includes(status)
                ? 'bg-primary-100 text-primary-700'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Date Range Selector */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Date Range
        </label>
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