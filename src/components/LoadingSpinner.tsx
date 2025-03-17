import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export default function LoadingSpinner({ 
  size = 'md', 
  color = 'primary-500' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-16 w-16'
  };

  return (
    <div className="flex items-center justify-center">
      <div className={`${sizeClasses[size]} relative`}>
        <div className={`animate-spin rounded-full border-2 border-t-transparent border-accent-earth ${sizeClasses[size]}`}></div>
        <div className={`absolute top-0 left-0 animate-pulse opacity-75 rounded-full border border-accent-earth/30 ${sizeClasses[size]}`}></div>
      </div>
    </div>
  );
} 