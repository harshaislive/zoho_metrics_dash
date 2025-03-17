import { Metric, MetricStatus } from '@/types/zoho';
import React from 'react';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  XCircleIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';

interface MetricCardProps {
  metric: Metric;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

const statusColors: Record<MetricStatus, string> = {
  success: 'text-accent-earth border-accent-earth',
  warning: 'text-accent-orange border-accent-orange',
  danger: 'text-secondary-500 border-secondary-500'
};

const statusIcons: Record<MetricStatus, React.ReactNode> = {
  success: <CheckCircleIcon className="h-6 w-6 text-accent-earth" />,
  warning: <ExclamationTriangleIcon className="h-6 w-6 text-accent-orange" />,
  danger: <XCircleIcon className="h-6 w-6 text-secondary-500" />
};

export function MetricCard({ metric, trend = 'neutral', trendValue }: MetricCardProps) {
  const colorClass = statusColors[metric.status];

  return (
    <div className="bg-white rounded-lg border border-neutral-100 p-6 shadow-card hover:shadow-card-hover transition-all duration-300">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-sans font-medium text-neutral-800">{metric.label}</h3>
        <div className="transform transition-transform duration-300 hover:scale-110">
          {statusIcons[metric.status]}
        </div>
      </div>
      
      <div className="flex items-baseline">
        <p className={`font-serif text-3xl font-semibold ${colorClass}`}>
          {metric.value}
          <span className={`text-lg ml-1 ${colorClass}`}>{metric.unit}</span>
        </p>
        
        {trend !== 'neutral' && trendValue && (
          <div className={`ml-3 flex items-center text-sm font-sans ${
            trend === 'up' ? 'text-accent-earth' : 'text-secondary-500'
          }`}>
            {trend === 'up' ? (
              <ArrowUpIcon className="h-4 w-4 mr-1 animate-pulse-slow" />
            ) : (
              <ArrowDownIcon className="h-4 w-4 mr-1 animate-pulse-slow" />
            )}
            {trendValue}
          </div>
        )}
      </div>
      
      <p className="mt-3 text-sm font-sans text-neutral-600">{metric.description}</p>
    </div>
  );
} 