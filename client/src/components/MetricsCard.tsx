import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface MetricsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  subtitle?: string;
  trend?: string;
  trendUp?: boolean;
}

const MetricsCard: React.FC<MetricsCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  subtitle, 
  trend, 
  trendUp 
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center group-hover:bg-primary-dark transition-colors">
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mb-1 leading-tight">{value}</p>
        {subtitle && (
          <p className="text-sm text-gray-500">{subtitle}</p>
        )}
        {trend && (
          <p className={`text-sm mt-2 font-medium ${
            trendUp ? 'text-green-600' : 'text-gray-600'
          }`}>
            {trend}
          </p>
        )}
      </div>
    </div>
  );
};

export default MetricsCard;