import React, { useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

export type DateRangeType =
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'last_week'
  | 'this_month'
  | 'last_month'
  | 'this_year'
  | 'last_year'
  | 'custom'
  | null;

interface DateRange {
  start: string | null;
  end: string | null;
}

interface DateRangeSelectorProps {
  selectedRange: DateRangeType;
  customRange: DateRange;
  onRangeChange: (range: DateRangeType) => void;
  onCustomRangeChange: (range: DateRange) => void;
}

const dateRangeOptions: { value: DateRangeType; label: string }[] = [
  { value: null, label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'this_week', label: 'This Week' },
  { value: 'last_week', label: 'Last Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'this_year', label: 'This Year' },
  { value: 'last_year', label: 'Last Year' },
  { value: 'custom', label: 'Custom Range' },
];

export function DateRangeSelector({
  selectedRange,
  customRange,
  onRangeChange,
  onCustomRangeChange,
}: DateRangeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedLabel = dateRangeOptions.find(
    (option) => option.value === selectedRange
  )?.label;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 text-left border border-neutral-200 rounded-lg flex items-center justify-between hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
      >
        <span className="text-sm font-medium text-neutral-700">
          {selectedLabel || 'All Time'}
        </span>
        <ChevronDownIcon className="h-5 w-5 text-neutral-400" />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg">
          <div className="py-1">
            {dateRangeOptions.map((option) => (
              <button
                key={option.value || 'all-time'}
                onClick={() => {
                  onRangeChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2 text-sm text-left hover:bg-neutral-50 ${
                  selectedRange === option.value
                    ? 'text-primary-700 bg-primary-50'
                    : 'text-neutral-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedRange === 'custom' && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={customRange.start || ''}
              onChange={(e) =>
                onCustomRangeChange({
                  ...customRange,
                  start: e.target.value || null,
                })
              }
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={customRange.end || ''}
              onChange={(e) =>
                onCustomRangeChange({
                  ...customRange,
                  end: e.target.value || null,
                })
              }
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      )}
    </div>
  );
} 