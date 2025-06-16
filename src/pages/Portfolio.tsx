import React from 'react';
import DealCard from '../components/DealCard';
import MetricsCard from '../components/MetricsCard';
import { Building, DollarSign, TrendingUp, Home, Award } from 'lucide-react';

const Portfolio = () => {
  // Current deals (owned properties)
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

  // Past deals (sold properties)
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
  
  // Portfolio aggregate metrics
  const portfolioMetrics = [
    { title: 'Total AUM', value: '$7.05M', icon: DollarSign, subtitle: 'Assets Under Management' },
    { title: 'Units Owned', value: '72', icon: Building, subtitle: 'Multifamily Units' },
    { title: 'Total Equity Created', value: '$1.07M', icon: TrendingUp, subtitle: 'Value Added' },
    { title: 'Avg CoC Return', value: '22.2%', icon: Award, subtitle: 'Cash-on-Cash' },
    { title: 'Avg Annualized Return', value: '28.5%', icon: Home, subtitle: 'Including Appreciation' }
  ];

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

        {/* Aggregate Metrics Bar */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Portfolio Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {portfolioMetrics.map((metric, index) => (
              <MetricsCard
                key={index}
                title={metric.title}
                value={metric.value}
                icon={metric.icon}
                subtitle={metric.subtitle}
              />
            ))}
          </div>
        </div>

        {/* Currently Owned Section */}
        <section className="mb-16">
          <div className="flex items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Currently Owned</h2>
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

        {/* Past Deals Section */}
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

        {/* CTA Section */}
        <section className="mt-16 bg-primary rounded-xl p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-4">Interested in Our Next Deal?</h3>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Join our investor list to be the first to know about upcoming investment opportunities 
            with similar risk-adjusted returns.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/investor"
              className="bg-white text-primary px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Join Investor List
            </a>
            <a
              href="/founder"
              className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary transition-colors"
            >
              Meet the Team
            </a>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Portfolio;