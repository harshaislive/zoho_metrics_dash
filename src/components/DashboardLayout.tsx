import React from 'react';
import LoadingSpinner from './LoadingSpinner';

interface DashboardLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  selector?: React.ReactNode;
  loading?: boolean;
  error?: string | null;
}

export default function DashboardLayout({
  title,
  subtitle,
  children,
  selector,
  loading = false,
  error = null
}: DashboardLayoutProps) {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6 mb-6 transition-all duration-300 hover:shadow-card-hover">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-serif font-bold text-neutral-900">{title}</h1>
                {subtitle && <p className="text-neutral-600 font-sans mt-1">{subtitle}</p>}
              </div>
              {selector && <div className="w-full md:w-72">{selector}</div>}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6 shadow-sm">
              <p>{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="transition-opacity duration-300">{children}</div>
          )}
        </div>
      </div>
    </div>
  );
} 