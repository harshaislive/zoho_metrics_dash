import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  color: string;
}

const getExplanation = (title: string): string => {
  switch (title) {
    case 'Task Completion Rate':
      return `Measures the percentage of completed tasks among tasks that are either:
      1. Created more than 2 weeks ago, or
      2. Already completed
      
      Example: If there are 10 tasks total:
      - 7 tasks older than 2 weeks (5 completed)
      - 3 recent tasks (2 completed)
      Rate = (7 completed) / (8 mature tasks) = 87.5%`;

    case 'Timeliness Rate':
      return `Percentage of completed tasks that were finished before their due date.
      
      Example: If 10 tasks are completed:
      - 8 tasks completed before due date
      - 2 tasks completed after due date
      Rate = (8 on-time) / (10 completed) = 80%`;

    case 'Open Tasks Aging':
      return `Average number of days tasks have been aging, where a task is considered aging if:
      1. It's past its due date: counts days since due date
      2. No due date: counts days since creation if older than 14 days
      
      Example: 3 open tasks:
      - Task 1: 10 days overdue
      - Task 2: 20 days overdue
      - Task 3: 30 days since creation (no due date)
      Average = (10 + 20 + 30) / 3 = 20 days`;

    case 'Backlog Rate':
      return `Percentage of total tasks that are overdue (past due date and not completed).
      
      Example: If there are 20 total tasks:
      - 5 tasks are past due date and not completed
      Rate = (5 overdue) / (20 total) = 25%`;

    default:
      return '';
  }
};

export default function MetricCard({ title, value, change, color }: MetricCardProps) {
  return (
    <div className="relative bg-white rounded-lg shadow p-6 transition-all duration-200 hover:shadow-lg">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            <div className="group relative">
              <QuestionMarkCircleIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 cursor-help" />
              <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 absolute z-10 left-0 mt-2 w-72 p-4 bg-gray-900 text-white text-sm rounded-lg shadow-lg whitespace-pre-wrap">
                {getExplanation(title)}
              </div>
            </div>
          </div>
          <div className={`mt-2 text-3xl font-bold tracking-tight ${color}`}>
            {value}
          </div>
          <p className="mt-2 text-sm text-gray-600">{change}</p>
        </div>
      </div>
    </div>
  );
} 