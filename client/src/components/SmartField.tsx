import React from 'react';
import { Calculator, Info, Lock, Edit3 } from 'lucide-react';
import { 
  isFieldEditable, 
  getFieldDescription, 
  calculateFieldValue,
  PropertyCalculationConfig 
} from '../utils/propertyCalculations';

interface SmartFieldProps {
  tabName: keyof PropertyCalculationConfig;
  fieldName: string;
  value: number | string;
  propertyData: any;
  onChange?: (value: number | string) => void;
  onCalculate?: () => void;
  label: string;
  className?: string;
  prefix?: string;
  suffix?: string;
  type?: 'currency' | 'percentage' | 'number' | 'text';
  showCalculationIcon?: boolean;
  showTooltip?: boolean;
}

export const SmartField: React.FC<SmartFieldProps> = ({
  tabName,
  fieldName,
  value,
  propertyData,
  onChange,
  onCalculate,
  label,
  className = '',
  prefix = '',
  suffix = '',
  type = 'number',
  showCalculationIcon = true,
  showTooltip = true
}) => {
  const isEditable = isFieldEditable(tabName, fieldName);
  const description = getFieldDescription(tabName, fieldName);
  const calculatedValue = !isEditable ? calculateFieldValue(tabName, fieldName, propertyData) : null;

  const formatValue = (val: number | string) => {
    if (type === 'currency') {
      const numVal = typeof val === 'string' ? parseFloat(val) || 0 : val;
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(numVal);
    }
    
    if (type === 'percentage') {
      const numVal = typeof val === 'string' ? parseFloat(val) || 0 : val;
      return `${numVal.toFixed(2)}%`;
    }
    
    return val?.toString() || '';
  };

  const displayValue = calculatedValue !== null ? formatValue(calculatedValue) : formatValue(value);

  const handleDoubleClick = () => {
    if (!isEditable && onCalculate) {
      onCalculate();
    }
  };

  if (isEditable) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
          <Edit3 className="h-3 w-3 text-blue-500" />
          {showTooltip && (
            <div className="relative group">
              <Info className="h-3 w-3 text-gray-400 cursor-help" />
              <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
                {description}
              </div>
            </div>
          )}
        </div>
        <div className="relative">
          {prefix && (
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
              {prefix}
            </span>
          )}
          <input
            type={type === 'text' ? 'text' : 'number'}
            value={value}
            onChange={(e) => onChange?.(type === 'text' ? e.target.value : parseFloat(e.target.value) || 0)}
            className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all-smooth ${
              prefix ? 'pl-8' : ''
            } ${suffix ? 'pr-8' : ''}`}
            step={type === 'percentage' ? '0.01' : type === 'currency' ? '1' : 'any'}
          />
          {suffix && (
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
              {suffix}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center space-x-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
        <Lock className="h-3 w-3 text-gray-400" />
        {showCalculationIcon && (
          <Calculator 
            className="h-3 w-3 text-green-500 cursor-pointer hover:text-green-600 transition-colors" 
            onClick={handleDoubleClick}
          />
        )}
        {showTooltip && (
          <div className="relative group">
            <Info className="h-3 w-3 text-gray-400 cursor-help" />
            <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10 max-w-xs">
              {description}
            </div>
          </div>
        )}
      </div>
      <div 
        className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-all-smooth"
        onDoubleClick={handleDoubleClick}
        title={!isEditable ? "Auto-calculated field - double-click for breakdown" : undefined}
      >
        <div className="flex items-center justify-between">
          <span className="text-gray-900 dark:text-white font-medium">
            {displayValue}
          </span>
          {showCalculationIcon && (
            <Calculator className="h-4 w-4 text-green-500 opacity-60" />
          )}
        </div>
      </div>
    </div>
  );
};

interface CalculationBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  tabName: string;
  fieldName: string;
  propertyData: any;
  label?: string;
}

interface BreakdownItem {
  label: string;
  value: any;
  isInput?: boolean;
  calculated?: string;
  isTotal?: boolean;
}

export const CalculationBreakdownModal: React.FC<CalculationBreakdownModalProps> = ({
  isOpen,
  onClose,
  tabName,
  fieldName,
  propertyData,
  label: fieldLabel
}) => {
  if (!isOpen) return null;

  const description = 'Property calculation field';
  const calculatedValue = 0;

  // Get breakdown details based on field type
  const getBreakdownDetails = (): BreakdownItem[] => {
    switch (fieldName) {
      case 'initialCapitalRequired':
        const purchasePrice = propertyData.acquisitionPrice || 0;
        const loanPercentage = propertyData.loanPercentage || 0.75;
        const downPayment = purchasePrice * (1 - loanPercentage);
        const closingCosts = propertyData.closingCosts || (purchasePrice * 0.02);
        const rehabCosts = propertyData.rehabCosts || 0;
        
        return [
          { label: 'Purchase Price', value: purchasePrice, isInput: true },
          { label: 'Loan Percentage', value: `${(loanPercentage * 100).toFixed(1)}%`, isInput: true },
          { label: 'Down Payment', value: downPayment, calculated: `${purchasePrice} × ${((1-loanPercentage)*100).toFixed(1)}%` },
          { label: 'Closing Costs', value: closingCosts, calculated: `${purchasePrice} × 2%` },
          { label: 'Rehab Costs', value: rehabCosts, isInput: true },
          { label: 'Total Initial Capital', value: calculatedValue, calculated: `${downPayment} + ${closingCosts} + ${rehabCosts}`, isTotal: true }
        ];

      case 'annualCashFlow':
        const noi = propertyData.noi || 0;
        const debtService = propertyData.annualDebtService || 0;
        
        return [
          { label: 'Net Operating Income (NOI)', value: noi, isInput: true },
          { label: 'Annual Debt Service', value: debtService, isInput: true },
          { label: 'Annual Cash Flow', value: calculatedValue, calculated: `${noi} - ${debtService}`, isTotal: true }
        ];

      case 'cashOnCashReturn':
        const cashFlow = propertyData.annualCashFlow || 0;
        const initialCapital = propertyData.initialCapitalRequired || 0;
        
        return [
          { label: 'Annual Cash Flow', value: cashFlow, isInput: true },
          { label: 'Initial Capital Required', value: initialCapital, isInput: true },
          { label: 'Cash-on-Cash Return', value: `${(calculatedValue || 0).toFixed(2)}%`, calculated: `(${cashFlow} ÷ ${initialCapital}) × 100`, isTotal: true }
        ];

      default:
        return [
          { label: 'Calculated Value', value: calculatedValue, isTotal: true }
        ];
    }
  };

  const breakdownItems = getBreakdownDetails();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <Calculator className="h-5 w-5 mr-2 text-blue-500" />
            Calculation Breakdown
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
            <p className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-1">
              {fieldLabel || fieldName}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              {description}
            </p>
          </div>

          <div className="space-y-3">
            {breakdownItems.map((item, index) => (
              <div 
                key={index}
                className={`flex justify-between items-center py-2 px-3 rounded-lg ${
                  item.isTotal 
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                    : item.isInput 
                      ? 'bg-gray-50 dark:bg-gray-700' 
                      : 'bg-purple-50 dark:bg-purple-900/20'
                }`}
              >
                <div>
                  <p className={`text-sm font-medium ${
                    item.isTotal ? 'text-green-700 dark:text-green-300' : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {item.label}
                  </p>
                  {item.calculated && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {item.calculated}
                    </p>
                  )}
                </div>
                <span className={`font-semibold ${
                  item.isTotal ? 'text-green-700 dark:text-green-300' : 'text-gray-900 dark:text-white'
                }`}>
                  {typeof item.value === 'number' ? 
                    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(item.value) :
                    item.value
                  }
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};