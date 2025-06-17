import React from 'react';
import { MapPin, DollarSign, TrendingUp, Home } from 'lucide-react';

interface Deal {
  id: string;
  name: string;
  address: string;
  units: number;
  purchasePrice: number;
  rehabBudget: number;
  arv: number;
  strategy: string;
  cashOnCashReturn: number;
  equityCreated: number;
  remainingEquity: number;
  status: 'current' | 'past';
}

interface DealCardProps {
  deal: Deal;
}

const DealCard: React.FC<DealCardProps> = ({ deal }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
      {/* Property Image Placeholder */}
      <div className="h-48 bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <Home className="h-12 w-12 mx-auto mb-2" />
          <p className="text-sm">Property Photo</p>
          <p className="text-xs">Coming Soon</p>
        </div>
      </div>

      <div className="p-6">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-bold text-gray-900">{deal.name}</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              deal.status === 'current' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-blue-100 text-blue-800'
            }`}>
              {deal.status === 'current' ? 'Active' : 'Completed'}
            </span>
          </div>
          <div className="flex items-center text-gray-600 mb-3">
            <MapPin className="h-4 w-4 mr-1" />
            <span className="text-sm">{deal.address}</span>
          </div>
          <p className="text-gray-700 text-sm leading-relaxed">{deal.strategy}</p>
        </div>

        {/* Property Details */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Units</p>
            <p className="text-lg font-semibold text-gray-900">{deal.units}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Purchase Price</p>
            <p className="text-lg font-semibold text-gray-900">{formatCurrency(deal.purchasePrice)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Rehab Budget</p>
            <p className="text-lg font-semibold text-gray-900">{formatCurrency(deal.rehabBudget)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">ARV</p>
            <p className="text-lg font-semibold text-gray-900">{formatCurrency(deal.arv)}</p>
          </div>
        </div>

        {/* ROI Metrics */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
            <TrendingUp className="h-4 w-4 mr-1" />
            Returns & Equity
          </h4>
          <div className="grid grid-cols-1 gap-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Cash-on-Cash Return</span>
              <span className="font-semibold text-green-600">{formatPercentage(deal.cashOnCashReturn)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Equity Created</span>
              <span className="font-semibold text-primary">{formatCurrency(deal.equityCreated)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Remaining Equity</span>
              <span className="font-semibold text-gray-900">{formatCurrency(deal.remainingEquity)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealCard;