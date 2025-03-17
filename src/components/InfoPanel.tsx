import React from 'react';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

interface MetricExplanation {
  metric: string;
  description: string;
  interpretation: string;
  actionableInsights: string[];
}

interface InfoPanelProps {
  title: string;
  description: string;
  metrics: MetricExplanation[];
}

export default function InfoPanel({ title, description, metrics }: InfoPanelProps) {
  return (
    <div className="bg-white rounded-xl shadow-card border border-gray-100 p-6 mb-6">
      <div className="flex items-start space-x-3">
        <InformationCircleIcon className="h-6 w-6 text-primary-600 flex-shrink-0 mt-1" />
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
          <p className="text-gray-600 mb-6">{description}</p>
          
          <div className="space-y-6">
            {metrics.map((metric, index) => (
              <div key={index} className="border-l-4 border-primary-200 pl-4">
                <h3 className="font-medium text-gray-900 mb-2">{metric.metric}</h3>
                <p className="text-gray-600 mb-3 text-sm">{metric.description}</p>
                <div className="bg-gray-50 rounded-lg p-4 mb-3">
                  <p className="text-gray-700 text-sm"><span className="font-medium">How to interpret:</span> {metric.interpretation}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Actionable Insights:</p>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    {metric.actionableInsights.map((insight, i) => (
                      <li key={i}>{insight}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 