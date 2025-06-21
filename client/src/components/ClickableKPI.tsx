import React, { useState } from 'react';
import { Calculator } from 'lucide-react';
import { KPICalculationModal } from './KPICalculationModal';
import { getKPICalculationBreakdown } from '../utils/kpiCalculations';

interface ClickableKPIProps {
  label: string;
  value: number | string;
  icon?: React.ComponentType<any>;
  color?: string;
  kpiType: string;
  properties?: any[];
  propertyData?: any;
  additionalData?: any;
  className?: string;
  showCalculatorIcon?: boolean;
  currencySymbol?: string;
  formatter?: (value: number | string) => string;
}

export const ClickableKPI: React.FC<ClickableKPIProps> = ({
  label,
  value,
  icon: Icon,
  color = 'blue',
  kpiType,
  properties = [],
  propertyData,
  additionalData,
  className = '',
  showCalculatorIcon = true,
  currencySymbol = '$',
  formatter
}) => {
  const [showModal, setShowModal] = useState(false);

  const numericValue = typeof value === 'string' 
    ? parseFloat(value.toString().replace(/[^0-9.-]/g, '')) || 0
    : value;

  const displayValue = formatter ? formatter(value) : value;

  const handleDoubleClick = () => {
    setShowModal(true);
  };

  const { title, formula, breakdown } = getKPICalculationBreakdown(
    kpiType,
    numericValue,
    properties,
    propertyData,
    additionalData
  );

  const getColorClasses = () => {
    const colorMap: { [key: string]: string } = {
      blue: 'bg-blue-50 border-blue-200 text-blue-600',
      green: 'bg-green-50 border-green-200 text-green-600',
      purple: 'bg-purple-50 border-purple-200 text-purple-600',
      orange: 'bg-orange-50 border-orange-200 text-orange-600',
      indigo: 'bg-indigo-50 border-indigo-200 text-indigo-600',
      emerald: 'bg-emerald-50 border-emerald-200 text-emerald-600',
      red: 'bg-red-50 border-red-200 text-red-600',
      yellow: 'bg-yellow-50 border-yellow-200 text-yellow-600'
    };
    return colorMap[color] || colorMap.blue;
  };

  return (
    <>
      <div 
        className={`
          relative p-4 rounded-lg border cursor-pointer transition-all duration-200 
          hover:shadow-md hover:scale-[1.02] group
          ${getColorClasses()}
          ${className}
        `}
        onDoubleClick={handleDoubleClick}
        title="Double-click to view calculation breakdown"
      >
        {/* Calculator Icon */}
        {showCalculatorIcon && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Calculator className="h-4 w-4 text-gray-400" />
          </div>
        )}

        {/* KPI Content */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {Icon && <Icon className="h-6 w-6" />}
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {displayValue}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {label}
              </div>
            </div>
          </div>
        </div>

        {/* Hover Indicator */}
        <div className="absolute bottom-1 right-1 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
          Click to calculate
        </div>
      </div>

      {/* Calculation Modal */}
      <KPICalculationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={title}
        finalResult={numericValue}
        formula={formula}
        breakdown={breakdown}
        currencySymbol={currencySymbol}
      />
    </>
  );
};

// Utility component for KPI bars with multiple clickable metrics
interface ClickableKPIBarProps {
  metrics: Array<{
    label: string;
    value: number | string;
    icon?: React.ComponentType<any>;
    kpiType: string;
    color?: string;
    formatter?: (value: number | string) => string;
  }>;
  properties?: any[];
  className?: string;
}

export const ClickableKPIBar: React.FC<ClickableKPIBarProps> = ({
  metrics,
  properties = [],
  className = ''
}) => {
  return (
    <div className={`bg-gradient-to-r from-blue-600 via-blue-500 via-purple-500 to-purple-600 rounded-lg p-6 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          const numericValue = typeof metric.value === 'string' 
            ? parseFloat(metric.value.toString().replace(/[^0-9.-]/g, '')) || 0
            : metric.value;
          const displayValue = metric.formatter ? metric.formatter(metric.value) : metric.value;

          return (
            <ClickableKPI
              key={index}
              label={metric.label}
              value={metric.value}
              icon={metric.icon}
              kpiType={metric.kpiType}
              properties={properties}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              showCalculatorIcon={true}
              formatter={metric.formatter}
            />
          );
        })}
      </div>
    </div>
  );
};