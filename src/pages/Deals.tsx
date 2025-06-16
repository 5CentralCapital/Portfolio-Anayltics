import React from 'react';
import DealCard from '../components/DealCard';
import StatsCard from '../components/StatsCard';
import { Building, DollarSign, TrendingUp, Home } from 'lucide-react';

const Deals = () => {
  // Sample deals data
  const currentDeals = [
    {
      id: '1',
      name: 'Riverside Commons',
      address: 'Tampa, FL',
      units: 24,
      purchasePrice: 1800000,
      rehabBudget: 300000,
      arv: 2400000,
      strategy: 'Full gut renovation with modern amenities, targeting young professionals. Bridge loan refinance strategy with 85% LTC.',
      cashOnCashReturn: 18.5,
      equityCreated: 300000,
      remainingEquity: 450000,
      status: 'current' as const,
    },
    {
      id: '2',
      name: 'Sunset Gardens',
      address: 'St. Petersburg, FL',
      units: 16,
      purchasePrice: 1200000,
      rehabBudget: 180000,
      arv: 1650000,
      strategy: 'Value-add repositioning with unit upgrades and exterior improvements. Focus on increasing rent roll through strategic renovations.',
      cashOnCashReturn: 22.3,
      equityCreated: 270000,
      remainingEquity: 320000,
      status: 'current' as const,
    },
  ];

  const pastDeals = [
    {
      id: '3',
      name: 'Pine Valley Apartments',
      address: 'Brandon, FL',
      units: 32,
      purchasePrice: 2200000,
      rehabBudget: 400000,
      arv: 3100000,
      strategy: 'Complete property transformation with new roofing, HVAC systems, and unit modernization. Successfully refinanced and retained.',
      cashOnCashReturn: 25.8,
      equityCreated: 500000,
      remainingEquity: 680000,
      status: 'past' as const,
    },
  ];

  const allDeals = [...currentDeals, ...pastDeals];
  
  // Calculate portfolio stats
  const totalPortfolioValue = allDeals.reduce((sum, deal) => sum + deal.arv, 0);
  const totalEquity = allDeals.reduce((sum, deal) => sum + deal.remainingEquity, 0);
  const totalUnits = allDeals.reduce((sum, deal) => sum + deal.units, 0);
  const avgCashOnCash = allDeals.reduce((sum, deal) => sum + deal.cashOnCashReturn, 0) / allDeals.length;

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

  return (
    <div className="min-h-screen bg-gray-50 py-12 animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Our Investment Portfolio
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Strategic multifamily acquisitions focused on value creation through renovation, 
            repositioning, and operational improvements across Florida markets.
          </p>
        </div>

        {/* Portfolio Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatsCard
            title="Total Portfolio Value"
            value={formatCurrency(totalPortfolioValue)}
            icon={Building}
          />
          <StatsCard
            title="Total Equity"
            value={formatCurrency(totalEquity)}
            icon={DollarSign}
          />
          <StatsCard
            title="Average Cash-on-Cash"
            value={`${avgCashOnCash.toFixed(1)}%`}
            icon={TrendingUp}
          />
          <StatsCard
            title="Units Owned"
            value={totalUnits.toString()}
            icon={Home}
          />
        </div>

        {/* Current Deals */}
        <section className="mb-16">
          <div className="flex items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Current Deals</h2>
            <span className="ml-4 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              {currentDeals.length} Active
            </span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {currentDeals.map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        </section>

        {/* Past Deals */}
        <section>
          <div className="flex items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Past Deals</h2>
            <span className="ml-4 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              {pastDeals.length} Completed
            </span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {pastDeals.map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        </section>

        {/* Investment Approach */}
        <section className="mt-16 bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Our Investment Approach</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-semibold text-primary mb-3">Target Criteria</h4>
              <ul className="space-y-2 text-gray-700">
                <li>• 10+ unit multifamily properties</li>
                <li>• Value-add opportunities in Florida markets</li>
                <li>• Properties with 3-4x return potential</li>
                <li>• Strong cash flow and appreciation upside</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-primary mb-3">Financing Strategy</h4>
              <ul className="space-y-2 text-gray-700">
                <li>• 85% LTC bridge loan financing</li>
                <li>• Cash-out refinance upon completion</li>
                <li>• Retain ownership for long-term wealth building</li>
                <li>• Leverage optimization for maximum returns</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Deals;