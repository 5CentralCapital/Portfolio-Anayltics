import React from 'react';
import { X, Calculator, Info, DollarSign } from 'lucide-react';

export interface KPIBreakdownItem {
  label: string;
  description: string;
  value: number;
  formula?: string;
  subItems?: Array<{
    label: string;
    value: number;
    description?: string;
  }>;
}

interface KPICalculationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  finalResult: number;
  formula: string;
  breakdown: KPIBreakdownItem[];
  currencySymbol?: string;
}

export const KPICalculationModal: React.FC<KPICalculationModalProps> = ({
  isOpen,
  onClose,
  title,
  finalResult,
  formula,
  breakdown,
  currencySymbol = '$'
}) => {
  if (!isOpen) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value: number) => {
    if (currencySymbol === '$') {
      return formatCurrency(value);
    }
    return value.toLocaleString('en-US', {
      minimumFractionDigits: value % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Calculator className="h-6 w-6 mr-2 text-blue-600" />
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Formula Section */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6 border border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center">
            <Info className="h-5 w-5 mr-2" />
            Formula
          </h3>
          <div className="bg-white dark:bg-gray-800 rounded p-3 border font-mono text-sm">
            {formula}
          </div>
        </div>

        {/* Final Result */}
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mb-6 border border-green-200 dark:border-green-800">
          <h3 className="text-lg font-semibold text-green-900 dark:text-green-300 mb-2 flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Final Result
          </h3>
          <div className="text-3xl font-bold text-green-900 dark:text-green-200">
            {formatNumber(finalResult)}
          </div>
        </div>

        {/* Components Breakdown */}
        <div className="bg-gray-50 dark:bg-gray-900/20 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Components Breakdown
          </h3>
          <div className="space-y-4">
            {breakdown.map((item, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">{item.label}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                    {item.formula && (
                      <div className="mt-2 text-xs font-mono bg-gray-100 dark:bg-gray-700 p-2 rounded">
                        {item.formula}
                      </div>
                    )}
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white ml-4">
                    {formatNumber(item.value)}
                  </div>
                </div>
                
                {/* Sub-items */}
                {item.subItems && item.subItems.length > 0 && (
                  <div className="mt-3 pl-4 border-l-2 border-gray-200 dark:border-gray-600">
                    <div className="space-y-2">
                      {item.subItems.map((subItem, subIndex) => (
                        <div key={subIndex} className="flex justify-between items-center">
                          <div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{subItem.label}</span>
                            {subItem.description && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">{subItem.description}</p>
                            )}
                          </div>
                          <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                            {formatNumber(subItem.value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Double-click any KPI value throughout the dashboard to view its calculation breakdown
          </p>
        </div>
      </div>
    </div>
  );
};