import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Building, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  MapPin,
  Users,
  Calculator,
  Target,
  PieChart
} from 'lucide-react';

interface Property {
  id: number;
  address: string;
  city: string;
  state: string;
  status: string;
  entity: string;
  apartments: number;
  acquisitionDate: string;
}

interface PropertyFinancials {
  grossRentalIncome: number;
  effectiveGrossIncome: number;
  totalOtherIncome: number;
  totalOperatingExpenses: number;
  netOperatingIncome: number;
  totalRehabCosts: number;
  totalClosingCosts: number;
  totalHoldingCosts: number;
  allInCost: number;
  initialCapitalRequired: number;
  cashFlow: number;
  cashOnCashReturn: number;
  capRate: number;
  arv: number;
  expenseBreakdown: Record<string, number>;
  rehabBreakdown: Record<string, number>;
  unitDetails: Array<{
    unitNumber: string;
    currentRent: number;
    proFormaRent: number;
    unitType: string;
  }>;
}

interface EnhancedPropertyCardProps {
  property: Property;
  onStatusChange: (id: number, status: string) => void;
  onDoubleClick: (property: Property) => void;
  variant?: 'standard' | 'compact' | 'detailed';
}

export default function EnhancedPropertyCard({ 
  property, 
  onStatusChange, 
  onDoubleClick, 
  variant = 'standard' 
}: EnhancedPropertyCardProps) {
  
  // Fetch accurate financial calculations
  const { data: financials, isLoading } = useQuery<PropertyFinancials>({
    queryKey: ['/api/properties', property.id, 'financials'],
    enabled: !!property.id
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(amount));
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Under Contract': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Rehabbing': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Cashflowing': return 'bg-green-100 text-green-800 border-green-200';
      case 'Sold': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEntityColor = (entity: string) => {
    switch (entity) {
      case '5Central Capital': return 'text-blue-600 bg-blue-50';
      case 'The House Doctors': return 'text-green-600 bg-green-50';
      case 'Arcadia Vision Group': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 hover:shadow-md transition-all duration-200 cursor-pointer card-hover"
        onDoubleClick={() => onDoubleClick(property)}
      >
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-medium text-sm text-gray-900 dark:text-white truncate">
            {property.address}
          </h3>
          <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(property.status)}`}>
            {property.status}
          </span>
        </div>
        
        <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex justify-between">
            <span>Units:</span>
            <span className="font-medium">{property.apartments}</span>
          </div>
          {financials && (
            <>
              <div className="flex justify-between">
                <span>Monthly CF:</span>
                <span className={`font-medium ${financials.cashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(financials.cashFlow / 12)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>CoC Return:</span>
                <span className={`font-medium ${financials.cashOnCashReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(financials.cashOnCashReturn)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-300 cursor-pointer card-hover fade-in"
      onDoubleClick={() => onDoubleClick(property)}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            {property.address}
          </h3>
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
            <MapPin className="h-4 w-4 mr-1" />
            {property.city}, {property.state}
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(property.status)}`}>
              {property.status}
            </span>
            <span className={`px-2 py-1 text-xs rounded-md ${getEntityColor(property.entity)}`}>
              {property.entity}
            </span>
          </div>
        </div>
        
        <div className="text-right">
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-1">
            <Building className="h-4 w-4 mr-1" />
            {property.apartments} Units
          </div>
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            <Calendar className="h-3 w-3 mr-1" />
            {new Date(property.acquisitionDate).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Financial Metrics */}
      {financials && (
        <div className="space-y-4">
          {/* Key Performance Indicators */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Monthly Cash Flow</span>
                <DollarSign className="h-4 w-4 text-blue-600" />
              </div>
              <div className={`text-lg font-bold ${financials.cashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(financials.cashFlow / 12)}
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-green-700 dark:text-green-300">CoC Return</span>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <div className={`text-lg font-bold ${financials.cashOnCashReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(financials.cashOnCashReturn)}
              </div>
            </div>
          </div>

          {/* Detailed Financials */}
          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Gross Rent</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                {formatCurrency(financials.grossRentalIncome)}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">NOI</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                {formatCurrency(financials.netOperatingIncome)}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Cap Rate</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                {financials.capRate.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Investment Summary */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Investment Summary</span>
              <Calculator className="h-4 w-4 text-gray-600" />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">All-in Cost:</span>
                <span className="font-medium">{formatCurrency(financials.allInCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Capital Req:</span>
                <span className="font-medium">{formatCurrency(financials.initialCapitalRequired)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">ARV:</span>
                <span className="font-medium">{formatCurrency(financials.arv)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Rehab:</span>
                <span className="font-medium">{formatCurrency(financials.totalRehabCosts)}</span>
              </div>
            </div>
          </div>

          {/* Unit Performance Preview */}
          {financials.unitDetails.length > 0 && (
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Unit Performance</span>
                <Users className="h-4 w-4 text-purple-600" />
              </div>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-purple-600 dark:text-purple-400">Avg Current Rent:</span>
                  <span className="font-medium">
                    {formatCurrency(financials.unitDetails.reduce((sum, unit) => sum + unit.currentRent, 0) / financials.unitDetails.length)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-600 dark:text-purple-400">Avg Market Rent:</span>
                  <span className="font-medium">
                    {formatCurrency(financials.unitDetails.reduce((sum, unit) => sum + unit.proFormaRent, 0) / financials.unitDetails.length)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}