import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  path?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className = '' }) => {
  return (
    <nav className={`flex items-center space-x-1 text-sm text-gray-500 ${className}`} aria-label="Breadcrumb">
      <Home className="h-4 w-4" />
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          {item.onClick || item.path ? (
            <button
              onClick={item.onClick}
              className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
            >
              {item.icon}
              <span className={index === items.length - 1 ? 'text-gray-900 font-medium' : ''}>{item.label}</span>
            </button>
          ) : (
            <span className={`flex items-center space-x-1 ${index === items.length - 1 ? 'text-gray-900 font-medium' : ''}`}>
              {item.icon}
              <span>{item.label}</span>
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

// Progress indicator for multi-step processes
interface ProgressStepProps {
  steps: Array<{
    label: string;
    status: 'completed' | 'current' | 'upcoming';
    icon?: React.ReactNode;
  }>;
  className?: string;
}

export const ProgressSteps: React.FC<ProgressStepProps> = ({ steps, className = '' }) => {
  return (
    <nav className={`flex items-center justify-between ${className}`} aria-label="Progress">
      {steps.map((step, index) => (
        <React.Fragment key={index}>
          <div className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
              step.status === 'completed' 
                ? 'bg-green-600 border-green-600 text-white' 
                : step.status === 'current'
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-white border-gray-300 text-gray-500'
            }`}>
              {step.icon || (
                <span className="text-sm font-medium">
                  {step.status === 'completed' ? '✓' : index + 1}
                </span>
              )}
            </div>
            <span className={`ml-2 text-sm ${
              step.status === 'current' ? 'text-blue-600 font-medium' : 'text-gray-500'
            }`}>
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className={`flex-1 h-px mx-4 ${
              steps[index + 1].status === 'completed' ? 'bg-green-600' : 'bg-gray-300'
            }`} />
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};