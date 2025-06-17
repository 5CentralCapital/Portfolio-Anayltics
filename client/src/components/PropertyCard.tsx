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

  // Fixed property image mapping with exact file name matches
  const getPropertyImage = (address: string) => {
    const imageMap: { [key: string]: string } = {
      '1 Harmony St': '/1%20Harmony%20St.jpeg',
      '145 Crystal Ave': '/145%20Crystal%20Ave.jpg',
      '149 Crystal Ave': '/149 Crystal ave.jpeg',
      '29 Brainard St': '/29%20brainard%20st.jpeg',
      '25 Huntington Pl': '/25%20huntington%20pkl.jpeg',
      '3408 E Dr MLK BLVD': '/3408%20E%20DR%20MLK%20BLVD.jpeg',
      '41 Stuart Ave': '/41 Stuart Ave.jpeg',
      '52 Summit Ave': '/52 Summit Ave.jpeg',
      '175 Crystal Ave': '/175 Crystal Ave.jpeg',
      '35 Linden St': '/35 Linden St.jpeg',
      '157 Crystal Ave': '/157 Crystal Ave.jpeg'
    };
    
    return imageMap[address] || null;
  };

  const propertyImage = getPropertyImage(property.address);

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
      {/* Property Image with improved loading and error handling */}
      <div className="h-48 bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center overflow-hidden relative">
        {propertyImage ? (
          <>
            <img 
              src={propertyImage} 
              alt={`${property.address}, ${property.city}, ${property.state} - Real estate investment property`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              onError={(e) => {
                console.log(`Failed to load image: ${propertyImage} for ${property.address}`);
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
              onLoad={() => {
                console.log(`Successfully loaded image: ${propertyImage} for ${property.address}`);
              }}
            />
            <div className="hidden absolute inset-0 bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Home className="h-12 w-12 mx-auto mb-2" />
                <p className="text-sm font-medium">{property.address}</p>
                <p className="text-xs">Image Loading...</p>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center text-gray-500">
            <Home className="h-12 w-12 mx-auto mb-2" />
            <p className="text-sm font-medium">{property.address}</p>
            <p className="text-xs">Property Photo</p>
          </div>
        )}
        
        {/* Status overlay */}
        <div className="absolute top-3 right-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
            property.status === 'Currently Own' 
              ? 'bg-green-100/90 text-green-800 border border-green-200' 
              : 'bg-blue-100/90 text-blue-800 border border-blue-200'
          }`}>
            {property.status}
          </span>
        </div>
      </div>

      <div className="p-6">
        {/* Header with improved typography */}
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 mb-2 leading-tight">{property.address}</h3>
          <div className="flex items-center text-gray-600 mb-2">
            <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
            <span className="text-sm">{property.city}, {property.state}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <Building className="h-4 w-4 mr-1 flex-shrink-0" />
            <span className="text-sm">Units: {property.units}</span>
          </div>
        </div>

        {/* Financial Details with improved layout */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
            <DollarSign className="h-4 w-4 mr-1" />
            Financial Details
          </h4>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-1">
              <span className="text-gray-600">Purchase Price:</span>
              <span className="font-semibold text-gray-900">{formatCurrency(property.acquisitionPrice)}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-gray-600">Renovation Budget:</span>
              <span className="font-semibold text-gray-900">{formatCurrency(property.rehabCosts)}</span>
            </div>
            {property.status === 'Sold' ? (
              <>
                <div className="flex justify-between items-center py-1">
                  <span className="text-gray-600">Sold Price:</span>
                  <span className="font-semibold text-green-600">{formatCurrency(property.soldPrice)}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-gray-600">Cash/Rents Collected:</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(property.cashRentsCollected)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-600">After Repair Value:</span>
                <span className="font-semibold text-primary">{formatCurrency(property.arv)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Performance Metrics with enhanced visual hierarchy */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
            <TrendingUp className="h-4 w-4 mr-1" />
            Performance Metrics
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Cash-on-Cash Return:</span>
              <span className="font-bold text-green-600 text-lg">{formatPercentage(property.cashOnCashReturn)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Annualized Return:</span>
              <span className="font-bold text-primary text-lg">{formatPercentage(property.annualizedReturn)}</span>
            </div>
            {property.status === 'Sold' && property.yearsHeld && (
              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                <span className="text-sm text-gray-600 flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  Hold Period:
                </span>
                <span className="font-semibold text-gray-900">{property.yearsHeld} years</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;