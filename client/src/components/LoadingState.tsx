import React from 'react';
import { Loader2, Building, Calculator, BarChart3, DollarSign } from 'lucide-react';

interface LoadingStateProps {
  type?: 'default' | 'properties' | 'calculations' | 'dashboard' | 'financial';
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  inline?: boolean;
}

const LoadingState: React.FC<LoadingStateProps> = ({ 
  type = 'default', 
  message,
  size = 'md',
  inline = false 
}) => {
  const getIcon = () => {
    switch (type) {
      case 'properties':
        return <Building className={`animate-pulse ${getIconSize()}`} />;
      case 'calculations':
        return <Calculator className={`animate-pulse ${getIconSize()}`} />;
      case 'dashboard':
        return <BarChart3 className={`animate-pulse ${getIconSize()}`} />;
      case 'financial':
        return <DollarSign className={`animate-pulse ${getIconSize()}`} />;
      default:
        return <Loader2 className={`animate-spin ${getIconSize()}`} />;
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm': return 'h-4 w-4';
      case 'lg': return 'h-12 w-12';
      default: return 'h-8 w-8';
    }
  };

  const getMessage = () => {
    if (message) return message;
    
    switch (type) {
      case 'properties':
        return 'Loading properties...';
      case 'calculations':
        return 'Calculating metrics...';
      case 'dashboard':
        return 'Loading dashboard data...';
      case 'financial':
        return 'Processing financial data...';
      default:
        return 'Loading...';
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'sm': return 'text-sm';
      case 'lg': return 'text-lg';
      default: return 'text-base';
    }
  };

  if (inline) {
    return (
      <div className="flex items-center space-x-2">
        {getIcon()}
        <span className={`text-gray-600 ${getTextSize()}`}>{getMessage()}</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center ${size === 'lg' ? 'py-16' : 'py-8'}`}>
      <div className="text-primary mb-4">
        {getIcon()}
      </div>
      <p className={`text-gray-600 ${getTextSize()}`}>{getMessage()}</p>
    </div>
  );
};

// Skeleton loading components for specific use cases
export const PropertyCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
    <div className="flex justify-between items-start mb-4">
      <div className="h-6 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-16"></div>
    </div>
    <div className="space-y-3">
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
    </div>
    <div className="mt-4 grid grid-cols-2 gap-4">
      <div className="h-8 bg-gray-200 rounded"></div>
      <div className="h-8 bg-gray-200 rounded"></div>
    </div>
  </div>
);

export const KPIBarSkeleton: React.FC = () => (
  <div className="bg-gradient-to-r from-blue-600 via-blue-500 via-purple-500 to-purple-600 text-white p-6 rounded-lg animate-pulse">
    <div className="flex items-center justify-between">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-white/20 rounded"></div>
          <div className="space-y-1">
            <div className="h-3 bg-white/20 rounded w-16"></div>
            <div className="h-4 bg-white/30 rounded w-20"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default LoadingState;