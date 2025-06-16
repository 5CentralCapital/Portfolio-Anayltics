import React from 'react';
import { MapPin, Building, DollarSign, TrendingUp, Calendar, Home } from 'lucide-react';

interface PropertyData {
  address: string;
  city: string;
  state: string;
  units: number | string;
  acquisitionPrice: number;
  rehabCosts?: number;
  soldPrice?: number;
  arv?: number;
  cashRentsCollected?: number;
  yearsHeld?: number;
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
    return `${value.toFixed(1)}%`;
  };

  // Get the appropriate image for each property
  const getPropertyImage = (address: string) => {
    const imageMap: { [key: string]: string } = {
      '1 Harmony St': '/1 Harmony St.jpeg',
      '145 Crystal Ave': '/145 Crystal Ave.jpg',
      '149 Crystal Ave': '/149 Crystal ave.jpeg',
      '29 Brainard St': '/29 brainard st.jpeg',
      '25 Huntington Pl': '/25 huntington pkl.jpeg',
      '3408 E Dr MLK BLVD': '/3408 E DR MLK BLVD.jpeg',
      '41 Stuart Ave': '/41 stuart ave.jpeg',
      '52 Summit Ave': '/52 summit ave.jpeg',
      '175 Crystal Ave': '/175 Crystal Ave.jpeg',
      '35 Linden St': '/35 linden st.jpeg',
      '157 Crystal Ave': '/157 Crystal Ave.jpeg'
    };
    
    return imageMap[address] || null;
  };

  const propertyImage = getPropertyImage(property.address);

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
      {/* Property Image */}
      <div className="h-48 bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center overflow-hidden">
        {propertyImage ? (
          <img 
            src={propertyImage} 
            alt={`${property.address}, ${property.city}, ${property.state} - Real estate investment property`}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to placeholder if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.parentElement!.innerHTML = `
                <div class="text-center text-gray-500">
                  <svg class="h-12 w-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z"></path>
                  </svg>
                  <p class="text-sm font-medium">${property.address}</p>
                  <p class="text-xs">Property Photo</p>
                </div>
              `;
            }}
          />
        ) : (
          <div className="text-center text-gray-500">
            <Home className="h-12 w-12 mx-auto mb-2" />
            <p className="text-sm font-medium">{property.address}</p>
            <p className="text-xs">Property Photo</p>
          </div>
        )}
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
            <span className="text-sm">Units: {property.units}</span>
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
            {property.status === 'Sold' ? (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sold Price:</span>
                  <span className="font-semibold">{formatCurrency(property.soldPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cash/Rents Collected:</span>
                  <span className="font-semibold">{formatCurrency(property.cashRentsCollected)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between">
                <span className="text-gray-600">After Repair Value:</span>
                <span className="font-semibold">{formatCurrency(property.arv)}</span>
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
            {property.status === 'Sold' && property.yearsHeld && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  Years Held:
                </span>
                <span className="font-semibold text-gray-900">{property.yearsHeld}</span>
              </div>
            )}
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