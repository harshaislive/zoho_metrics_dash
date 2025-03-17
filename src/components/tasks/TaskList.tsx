import React, { useState } from 'react';
import { Task } from './TaskAccordion';
import { TaskItem } from './TaskItem';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface TaskListProps {
  status: string;
  tasks: Task[];
  expandedTask: number | null;
  onExpand: (taskId: number | null) => void;
}

export function TaskList({ status, tasks, expandedTask, onExpand }: TaskListProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = (status: string) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('complete') || lowerStatus.includes('done')) {
      return 'text-accent-earth';
    }
    if (lowerStatus.includes('progress') || lowerStatus.includes('doing')) {
      return 'text-accent-orange';
    }
    if (lowerStatus.includes('block') || lowerStatus.includes('hold')) {
      return 'text-secondary-500';
    }
    return 'text-neutral-600';
  };

  return (
    <div className="border border-neutral-100 rounded-lg shadow-sm bg-white overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-neutral-50 transition-colors duration-200"
      >
        <div className="flex items-center space-x-2">
          {isExpanded ? (
            <ChevronDownIcon className="h-5 w-5 text-neutral-400" />
          ) : (
            <ChevronRightIcon className="h-5 w-5 text-neutral-400" />
          )}
          <span className={`font-medium ${getStatusColor(status)}`}>
            {status}
          </span>
          <span className="text-sm text-neutral-500">
            ({tasks.length} {tasks.length === 1 ? 'task' : 'tasks'})
          </span>
        </div>
      </button>

      {isExpanded && (
        <div className="divide-y divide-neutral-100">
          {tasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              isExpanded={expandedTask === task.id}
              onToggle={() => onExpand(expandedTask === task.id ? null : task.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
} 