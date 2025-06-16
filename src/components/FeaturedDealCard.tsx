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

  // Updated image mapping for featured deals
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
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
      {/* Property Image with improved loading */}
      <div className="h-32 bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center overflow-hidden relative">
        {propertyImage ? (
          <>
            <img 
              src={propertyImage} 
              alt={`${deal.name}, ${deal.address} - Real estate investment property`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            <div className="hidden absolute inset-0 bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Home className="h-8 w-8 mx-auto mb-1" />
                <p className="text-xs">Loading...</p>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center text-gray-500">
            <Home className="h-8 w-8 mx-auto mb-1" />
            <p className="text-xs">Property Photo</p>
          </div>
        )}
        
        {/* Status badge overlay */}
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
            deal.status === 'current' 
              ? 'bg-green-100/90 text-green-800 border border-green-200' 
              : 'bg-blue-100/90 text-blue-800 border border-blue-200'
          }`}>
            {deal.status === 'current' ? 'Active' : 'Completed'}
          </span>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-2">
          <h3 className="text-lg font-bold text-gray-900 leading-tight">{deal.name}</h3>
        </div>
        
        <div className="flex items-center text-gray-600 mb-3">
          <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
          <span className="text-sm">{deal.address}</span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wide">Units</p>
            <p className="font-semibold text-gray-900">{deal.units}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wide">Purchase</p>
            <p className="font-semibold text-gray-900">{formatCurrency(deal.purchasePrice)}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wide">ARV</p>
            <p className="font-semibold text-primary">{formatCurrency(deal.arv)}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wide">CoC Return</p>
            <p className="font-bold text-green-600 flex items-center">
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