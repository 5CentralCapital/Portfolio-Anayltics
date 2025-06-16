import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface MetricsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  subtitle?: string;
}

const MetricsCard: React.FC<MetricsCardProps> = ({ title, value, icon: Icon, subtitle }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
      <div>
        <p className="text-sm text-gray-600 uppercase tracking-wide font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {subtitle && (
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
};

export default MetricsCard;