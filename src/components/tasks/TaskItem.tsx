import React from 'react';
import { Task } from './TaskAccordion';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface TaskItemProps {
  task: Task;
  isExpanded: boolean;
  onToggle: () => void;
}

export function TaskItem({ task, isExpanded, onToggle }: TaskItemProps) {
  const formatDate = (dateString: string) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-white">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-start justify-between hover:bg-neutral-50 transition-colors duration-200"
      >
        <div className="flex-1 text-left">
          <div className="flex items-center space-x-2">
            {isExpanded ? (
              <ChevronDownIcon className="h-5 w-5 text-neutral-400" />
            ) : (
              <ChevronRightIcon className="h-5 w-5 text-neutral-400" />
            )}
            <h4 className="font-medium text-neutral-900">{task.name}</h4>
          </div>
          {!isExpanded && (
            <div className="mt-1 text-sm text-neutral-500">
              Due: {formatDate(task.end_date)}
            </div>
          )}
        </div>
        <div className="ml-4">
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800">
            {task.priority}
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="px-6 pb-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-neutral-500">Start Date:</span>
                <span className="ml-2 text-neutral-900">
                  {formatDate(task.start_date)}
                </span>
              </div>
              <div>
                <span className="text-neutral-500">Due Date:</span>
                <span className="ml-2 text-neutral-900">
                  {formatDate(task.end_date)}
                </span>
              </div>
              <div>
                <span className="text-neutral-500">Progress:</span>
                <span className="ml-2 text-neutral-900">
                  {task.percent_complete}%
                </span>
              </div>
              <div>
                <span className="text-neutral-500">Priority:</span>
                <span className="ml-2 text-neutral-900">
                  {task.priority}
                </span>
              </div>
            </div>
            {task.description && (
              <div className="text-sm">
                <span className="text-neutral-500">Description:</span>
                <p className="mt-1 text-neutral-900 whitespace-pre-wrap">
                  {task.description}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 