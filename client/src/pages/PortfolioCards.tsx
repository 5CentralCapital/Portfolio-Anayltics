import React from 'react';
import { useQuery } from '@tanstack/react-query';
import PropertyCard from '../components/PropertyCard';
import MetricsCard from '../components/MetricsCard';
import { Building, DollarSign, TrendingUp, Award, Home } from 'lucide-react';

const PortfolioCards = () => {
  // Fetch live property data from the database
  const { data: properties, isLoading, error } = useQuery({
    queryKey: ['/api/property-performance'],
    queryFn: async () => {
      const response = await fetch('/api/property-performance');
      if (!response.ok) throw new Error('Failed to fetch properties');
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading portfolio data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-red-600">Error loading portfolio data. Please try again.</p>
          </div>
        </div>
      </div>
    );
  }

  // Transform API data to match PropertyCard interface
  const portfolioProperties = properties?.map((property: any) => ({
    address: property.address,
    city: property.city,
    state: property.state,
    units: property.units,
    acquisitionPrice: property.acquisition_price,
    rehabCosts: property.rehab_costs || undefined,
    soldPrice: property.status === 'sold' ? property.current_value : undefined,
    arv: property.current_value,
    cashRentsCollected: property.monthly_rent * 12,
    yearsHeld: property.years_held || 1,
    cashOnCashReturn: property.cash_on_cash_return, // Now dynamically calculated
    annualizedReturn: property.annualized_return, // Now dynamically calculated
    status: property.status === 'active' ? 'Currently Own' as const : 'Sold' as const
  })) || [];

  // Calculate portfolio statistics from real data
  const currentProperties = portfolioProperties.filter(p => p.status === 'Currently Own');
  const soldProperties = portfolioProperties.filter(p => p.status === 'Sold');
  
  const totalPropertiesCount = portfolioProperties.length;
  const totalUnitsCount = portfolioProperties.reduce((sum, prop) => sum + (prop.units || 0), 0);
  const totalInvestedAmount = portfolioProperties.reduce((sum, prop) => sum + prop.acquisitionPrice, 0);
  const totalEquityCreated = portfolioProperties.reduce((sum, prop) => {
    return sum + ((prop.soldPrice || prop.arv || 0) - prop.acquisitionPrice);
  }, 0);

  const avgCashOnCash = portfolioProperties.length > 0 
    ? portfolioProperties.reduce((sum, prop) => sum + prop.cashOnCashReturn, 0) / portfolioProperties.length 
    : 0;

  const avgAnnualizedReturn = portfolioProperties.length > 0
    ? portfolioProperties.reduce((sum, prop) => sum + prop.annualizedReturn, 0) / portfolioProperties.length 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Real Estate Portfolio
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Comprehensive view of our multifamily real estate investments across Connecticut and Florida markets
          </p>
        </div>

        {/* Portfolio Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
          <MetricsCard
            title="Total Properties"
            value={totalPropertiesCount.toString()}
            icon={Building}
            subtitle={`${currentProperties.length} active, ${soldProperties.length} sold`}
          />
          <MetricsCard
            title="Total Units"
            value={totalUnitsCount.toString()}
            icon={Home}
            subtitle="Apartment units"
          />
          <MetricsCard
            title="Total Invested"
            value={`$${(totalInvestedAmount / 1000000).toFixed(1)}M`}
            icon={DollarSign}
            subtitle="Acquisition costs"
          />
          <MetricsCard
            title="Avg Cash-on-Cash"
            value={`${avgCashOnCash.toFixed(1)}%`}
            icon={TrendingUp}
            subtitle="Annual return"
            trend={avgCashOnCash > 15 ? "Strong performance" : "Steady growth"}
            trendUp={avgCashOnCash > 0}
          />
          <MetricsCard
            title="Avg Annualized"
            value={`${avgAnnualizedReturn.toFixed(1)}%`}
            icon={Award}
            subtitle="Total return"
            trend={avgAnnualizedReturn > 20 ? "Excellent returns" : "Good performance"}
            trendUp={avgAnnualizedReturn > 0}
          />
        </div>

        {/* Property Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {portfolioProperties.map((property, index) => (
            <PropertyCard key={`${property.address}-${index}`} property={property} />
          ))}
        </div>

        {/* Portfolio Summary */}
        <div className="mt-16 bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Portfolio Performance Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">
                ${(totalEquityCreated / 1000000).toFixed(1)}M
              </div>
              <div className="text-gray-600">Total Equity Created</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {currentProperties.length}
              </div>
              <div className="text-gray-600">Currently Owned</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {soldProperties.length}
              </div>
              <div className="text-gray-600">Successfully Exited</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioCards;