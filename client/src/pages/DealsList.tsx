import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Building, Calculator, TrendingUp } from 'lucide-react';

export default function DealsList() {
  const { data: deals, isLoading } = useQuery({
    queryKey: ['/api/deals'],
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Deal Analysis</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          New Deal
        </button>
      </div>

      <div className="grid gap-6">
        {deals?.map((deal: any) => (
          <Link
            key={deal.id}
            to={`/deal-analysis/${deal.id}`}
            className="block bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Building className="h-8 w-8 text-blue-600" />
                <div>
                  <h3 className="text-xl font-semibold">{deal.name}</h3>
                  <p className="text-gray-600">{deal.address}, {deal.city}, {deal.state}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="text-sm text-gray-500">{deal.units} units</span>
                    <span className="text-sm text-gray-500">
                      {formatCurrency(Number(deal.purchasePrice))}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      deal.status === 'active' ? 'bg-green-100 text-green-800' :
                      deal.status === 'underwriting' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {deal.status}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Calculator className="h-5 w-5 text-gray-400" />
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {(!deals || deals.length === 0) && (
        <div className="text-center py-12">
          <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No deals found</h3>
          <p className="text-gray-600">Get started by creating your first deal analysis.</p>
        </div>
      )}
    </div>
  );
}