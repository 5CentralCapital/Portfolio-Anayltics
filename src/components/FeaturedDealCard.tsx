import React from 'react';
import { MapPin, Home, TrendingUp } from 'lucide-react';

interface FeaturedDeal {
  name: string;
  address: string;
  units: number;
  purchasePrice: number;
  arv: number;
  cashOnCashReturn: number;
  status: 'current' | 'past';
}

interface FeaturedDealCardProps {
  deal: FeaturedDeal;
}

const FeaturedDealCard: React.FC<FeaturedDealCardProps> = ({ deal }) => {
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Get the appropriate image for each property
  const getPropertyImage = (name: string) => {
    const imageMap: { [key: string]: string } = {
      '3408 E Dr MLK BLVD': '/3408 E DR MLK BLVD.jpeg',
      '157 Crystal Ave': '/157 Crystal Ave.jpeg',
      '1 Harmony St': '/1 Harmony St.jpeg'
    };
    
    return imageMap[name] || null;
  };

  const propertyImage = getPropertyImage(deal.name);

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
      {/* Property Image */}
      <div className="h-32 bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center overflow-hidden">
        {propertyImage ? (
          <img 
            src={propertyImage} 
            alt={`${deal.name}, ${deal.address} - Real estate investment property`}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to placeholder if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.parentElement!.innerHTML = `
                <div class="text-center text-gray-500">
                  <svg class="h-8 w-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z"></path>
                  </svg>
                  <p class="text-xs">Property Photo</p>
                </div>
              `;
            }}
          />
        ) : (
          <div className="text-center text-gray-500">
            <Home className="h-8 w-8 mx-auto mb-1" />
            <p className="text-xs">Property Photo</p>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-gray-900">{deal.name}</h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            deal.status === 'current' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-blue-100 text-blue-800'
          }`}>
            {deal.status === 'current' ? 'Active' : 'Completed'}
          </span>
        </div>
        
        <div className="flex items-center text-gray-600 mb-3">
          <MapPin className="h-3 w-3 mr-1" />
          <span className="text-sm">{deal.address}</span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
          <div>
            <p className="text-gray-500">Units</p>
            <p className="font-semibold">{deal.units}</p>
          </div>
          <div>
            <p className="text-gray-500">Purchase</p>
            <p className="font-semibold">{formatCurrency(deal.purchasePrice)}</p>
          </div>
          <div>
            <p className="text-gray-500">ARV</p>
            <p className="font-semibold">{formatCurrency(deal.arv)}</p>
          </div>
          <div>
            <p className="text-gray-500">CoC Return</p>
            <p className="font-semibold text-green-600 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              {deal.cashOnCashReturn.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturedDealCard;