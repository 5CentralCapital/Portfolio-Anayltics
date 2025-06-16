import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ValuePropCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

const ValuePropCard: React.FC<ValuePropCardProps> = ({ title, description, icon: Icon }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-white" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
    </div>
  );
};

export default ValuePropCard;