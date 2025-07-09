import React from 'react';
import { MapPin, Home } from 'lucide-react';
import { useCalculations } from '../contexts/CalculationsContext';

interface Property {
  id: number;
  address: string;
  city: string;
  state: string;
  apartments: string;
  acquisitionPrice: string;
  arvAtTimePurchased: string;
  acquisitionDate?: string;
  status: string;
  [key: string]: any;
}

interface FeaturedDealCardProps {
  deal: Property;
}

const FeaturedDealCard: React.FC<FeaturedDealCardProps> = ({ deal }) => {
  const { calculateProperty, formatCurrency } = useCalculations();

  // Fixed image mapping for featured deals
  const getPropertyImage = (address: string) => {
    const imageMap: { [key: string]: string } = {
      '3408 E DR MLK BLVD': '/3408 E DR MLK BLVD.jpeg',
      '157 Crystal Ave': '/157 Crystal Ave.jpeg',
      '1 Harmony St': '/1 Harmony St.jpeg',
      '4809 N Grady Ave': '/attached_assets/4809 N Grady Ave_1752009463748.png'
    };
    
    return imageMap[address] || null;
  };

  const propertyImage = getPropertyImage(deal.address);
  const kpis = calculateProperty(deal);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
      {/* Property Image */}
      {propertyImage && (
        <div className="h-48 overflow-hidden">
          <img 
            src={propertyImage} 
            alt={deal.address}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}
      
      <div className="p-6">
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{deal.address} • {deal.apartments} Units</h3>
          <p className="text-gray-600 text-sm">{deal.city}, {deal.state}</p>
          {deal.acquisitionDate && (
            <p className="text-gray-500 text-xs mt-1">
              Acquired: {new Date(deal.acquisitionDate).toLocaleDateString()}
              {(() => {
                if (deal.acquisitionDate) {
                  const yearsHeld = (new Date().getTime() - new Date(deal.acquisitionDate).getTime()) / (1000 * 60 * 60 * 24 * 365);
                  return ` • ${yearsHeld.toFixed(1)} years held`;
                }
                return '';
              })()}
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex justify-between">
            <p className="text-gray-500">Purchase Price</p>
            <p className="font-semibold">{formatCurrency(parseFloat(deal.acquisitionPrice || '0'))}</p>
          </div>
          <div className="flex justify-between">
            <p className="text-gray-500">ARV</p>
            <p className="font-semibold">{formatCurrency(parseFloat(deal.arvAtTimePurchased || '0'))}</p>
          </div>
          <div className="flex justify-between">
            <p className="text-gray-500">Annual Cash Flow</p>
            {kpis ? (
              <p className={`font-semibold ${kpis.annualCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(kpis.annualCashFlow)}
              </p>
            ) : (
              <p className="font-semibold text-gray-400">N/A</p>
            )}
          </div>
          <div className="flex justify-between">
            <p className="text-gray-500">Equity Multiple</p>
            {kpis ? (
              <p className={`font-semibold ${kpis.equityMultiple >= 1 ? 'text-blue-600' : 'text-red-600'}`}>
                {kpis.equityMultiple.toFixed(2)}x
              </p>
            ) : (
              <p className="font-semibold text-gray-400">N/A</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturedDealCard;