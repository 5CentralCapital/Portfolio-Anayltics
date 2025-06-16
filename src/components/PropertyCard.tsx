import React from 'react';
import { MapPin, Building, DollarSign, TrendingUp, Calendar, Home } from 'lucide-react';

interface PropertyData {
  address: string;
  city: string;
  state: string;
  units: number;
  acquisitionPrice: number;
  rehabCosts?: number;
  arv?: number;
  currentPrincipalBalance?: number;
  amortizationMonths?: number;
  cashOnCashReturn: number;
  annualizedReturn: number;
  status: 'Currently Own' | 'Sold';
}

interface PropertyCardProps {
  property: PropertyData;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property }) => {
  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || isNaN(amount)) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
      {/* Property Image Placeholder */}
      <div className="h-48 bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <Home className="h-12 w-12 mx-auto mb-2" />
          <p className="text-sm font-medium">{property.address}</p>
          <p className="text-xs">Property Photo Coming Soon</p>
        </div>
      </div>

      <div className="p-6">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-bold text-gray-900">{property.address}</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              property.status === 'Currently Own' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-blue-100 text-blue-800'
            }`}>
              {property.status}
            </span>
          </div>
          <div className="flex items-center text-gray-600 mb-2">
            <MapPin className="h-4 w-4 mr-1" />
            <span className="text-sm">Location: {property.city}, {property.state}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <Building className="h-4 w-4 mr-1" />
            <span className="text-sm">Units: {property.units} {property.units === 1 ? 'Apartment' : 'Apartments'}</span>
          </div>
        </div>

        {/* Financial Details */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
            <DollarSign className="h-4 w-4 mr-1" />
            Financial Details
          </h4>
          <div className="grid grid-cols-1 gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Purchase Price:</span>
              <span className="font-semibold">{formatCurrency(property.acquisitionPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Renovation Budget:</span>
              <span className="font-semibold">{formatCurrency(property.rehabCosts)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">After Repair Value:</span>
              <span className="font-semibold">{formatCurrency(property.arv)}</span>
            </div>
            {property.currentPrincipalBalance && (
              <div className="flex justify-between">
                <span className="text-gray-600">Current Mortgage Balance:</span>
                <span className="font-semibold">{formatCurrency(property.currentPrincipalBalance)}</span>
              </div>
            )}
            {property.amortizationMonths && (
              <div className="flex justify-between">
                <span className="text-gray-600">Loan Term:</span>
                <span className="font-semibold">{property.amortizationMonths} months</span>
              </div>
            )}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
            <TrendingUp className="h-4 w-4 mr-1" />
            Performance Metrics
          </h4>
          <div className="grid grid-cols-1 gap-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Cash on Cash Return:</span>
              <span className="font-semibold text-green-600">{formatPercentage(property.cashOnCashReturn)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Annualized Return:</span>
              <span className="font-semibold text-primary">{formatPercentage(property.annualizedReturn)}</span>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-center">
            <span className="text-sm text-gray-600">Status: </span>
            <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
              property.status === 'Currently Own' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-blue-100 text-blue-800'
            }`}>
              {property.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;