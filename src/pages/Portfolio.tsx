import React from 'react';
import PropertyCard from '../components/PropertyCard';
import MetricsCard from '../components/MetricsCard';
import { Building, DollarSign, TrendingUp, Home, Award } from 'lucide-react';

const Portfolio = () => {
  // Updated portfolio data from the provided spreadsheet
  const portfolioProperties = [
    // Currently Owned Properties (in specified order)
    {
      address: '3408 E Dr MLK BLVD',
      city: 'Tampa',
      state: 'FL',
      units: 10,
      acquisitionPrice: 750000,
      rehabCosts: 450000,
      arv: 2000000,
      cashOnCashReturn: 372.10,
      annualizedReturn: 372.10,
      status: 'Currently Own' as const
    },
    {
      address: '157 Crystal Ave',
      city: 'New London',
      state: 'CT',
      units: 5,
      acquisitionPrice: 376000,
      rehabCosts: 10000,
      arv: 700000,
      cashOnCashReturn: 381.10,
      annualizedReturn: 68.80,
      status: 'Currently Own' as const
    },
    {
      address: '1 Harmony St',
      city: 'Stonington',
      state: 'CT',
      units: 4,
      acquisitionPrice: 1075000,
      rehabCosts: 80000,
      arv: 1500000,
      cashOnCashReturn: 222.60,
      annualizedReturn: 222.60,
      status: 'Currently Own' as const
    },
    // Sold Properties
    {
      address: '41 Stuart Ave',
      city: 'New London',
      state: 'CT',
      units: 3,
      acquisitionPrice: 195000,
      rehabCosts: 20000,
      soldPrice: 375000,
      cashRentsCollected: 120000,
      yearsHeld: 4,
      cashOnCashReturn: 1400.00,
      annualizedReturn: 96.80,
      status: 'Sold' as const
    },
    {
      address: '52 Summit Ave',
      city: 'New London',
      state: 'CT',
      units: 2,
      acquisitionPrice: 315000,
      rehabCosts: 10000,
      soldPrice: 375000,
      cashRentsCollected: 48000,
      yearsHeld: 2.5,
      cashOnCashReturn: 326.70,
      annualizedReturn: 78.70,
      status: 'Sold' as const
    },
    {
      address: '29 Brainard St',
      city: 'New London',
      state: 'CT',
      units: '11 Room Boarding House',
      acquisitionPrice: 329000,
      rehabCosts: 0,
      soldPrice: 375000,
      cashRentsCollected: 30000,
      yearsHeld: 3,
      cashOnCashReturn: 633.30,
      annualizedReturn: 94.30,
      status: 'Sold' as const
    },
    {
      address: '25 Huntington Pl',
      city: 'Norwich',
      state: 'CT',
      units: '13 Room Boarding House',
      acquisitionPrice: 319000,
      rehabCosts: 0,
      soldPrice: 350000,
      cashRentsCollected: 36000,
      yearsHeld: 2,
      cashOnCashReturn: 67.00,
      annualizedReturn: 29.20,
      status: 'Sold' as const
    },
    {
      address: '175 Crystal Ave',
      city: 'New London',
      state: 'CT',
      units: 2,
      acquisitionPrice: 280000,
      rehabCosts: 0,
      soldPrice: 425000,
      cashRentsCollected: 97000,
      yearsHeld: 2,
      cashOnCashReturn: 958.00,
      annualizedReturn: 226.80,
      status: 'Sold' as const
    },
    {
      address: '35 Linden St',
      city: 'New London',
      state: 'CT',
      units: 3,
      acquisitionPrice: 385000,
      rehabCosts: 0,
      soldPrice: 440000,
      cashRentsCollected: 84000,
      yearsHeld: 2,
      cashOnCashReturn: 233.60,
      annualizedReturn: 43.50,
      status: 'Sold' as const
    },
    {
      address: '145 Crystal Ave',
      city: 'New London',
      state: 'CT',
      units: 3,
      acquisitionPrice: 210000,
      rehabCosts: 50000,
      soldPrice: 335000,
      cashRentsCollected: 90000,
      yearsHeld: 2,
      cashOnCashReturn: 152.10,
      annualizedReturn: 58.80,
      status: 'Sold' as const
    },
    {
      address: '149 Crystal Ave',
      city: 'New London',
      state: 'CT',
      units: 3,
      acquisitionPrice: 230000,
      rehabCosts: 50000,
      soldPrice: 335000,
      cashRentsCollected: 90000,
      yearsHeld: 2,
      cashOnCashReturn: 126.10,
      annualizedReturn: 50.40,
      status: 'Sold' as const
    }
  ];

  // Separate current and sold properties
  const currentProperties = portfolioProperties.filter(p => p.status === 'Currently Own');
  const soldProperties = portfolioProperties.filter(p => p.status === 'Sold');

  // Calculate real portfolio metrics
  const totalUnits = portfolioProperties.reduce((sum, prop) => {
    // Handle string units (boarding houses)
    if (typeof prop.units === 'string') return sum + 1;
    return sum + prop.units;
  }, 0);
  
  // Total Portfolio Value = Sum of current asset values (ARV for current properties, sold price for sold properties)
  const totalPortfolioValue = portfolioProperties.reduce((sum, prop) => {
    if (prop.status === 'Currently Own') {
      return sum + (prop.arv || prop.acquisitionPrice);
    } else {
      return sum + (prop.soldPrice || prop.acquisitionPrice);
    }
  }, 0);

  // Calculate total equity created
  const totalEquityCreated = portfolioProperties.reduce((sum, prop) => {
    const totalCost = prop.acquisitionPrice + (prop.rehabCosts || 0);
    const currentValue = prop.status === 'Currently Own' 
      ? (prop.arv || prop.acquisitionPrice)
      : (prop.soldPrice || prop.acquisitionPrice);
    return sum + Math.max(0, currentValue - totalCost);
  }, 0);

  // Calculate average returns for all properties with data
  const propsWithReturns = portfolioProperties.filter(p => p.cashOnCashReturn > 0);
  const avgCashOnCash = propsWithReturns.length > 0 
    ? propsWithReturns.reduce((sum, prop) => sum + prop.cashOnCashReturn, 0) / propsWithReturns.length 
    : 0;
  const avgAnnualized = propsWithReturns.length > 0 
    ? propsWithReturns.reduce((sum, prop) => sum + prop.annualizedReturn, 0) / propsWithReturns.length 
    : 0;

  // Portfolio aggregate metrics based on real data
  const portfolioMetrics = [
    { 
      title: 'Total Portfolio Value', 
      value: `$${(totalPortfolioValue / 1000000).toFixed(2)}M`, 
      icon: DollarSign, 
      subtitle: 'Current Asset Values' 
    },
    { 
      title: 'Total Units', 
      value: totalUnits.toString(), 
      icon: Building, 
      subtitle: 'All Properties Combined' 
    },
    { 
      title: 'Total Equity Created', 
      value: `$${(totalEquityCreated / 1000000).toFixed(2)}M`, 
      icon: TrendingUp, 
      subtitle: 'Value Added Through Strategy' 
    },
    { 
      title: 'Avg Cash-on-Cash', 
      value: `${avgCashOnCash.toFixed(1)}%`, 
      icon: Award, 
      subtitle: 'All Properties Performance' 
    },
    { 
      title: 'Avg Annualized Return', 
      value: `${avgAnnualized.toFixed(1)}%`, 
      icon: Home, 
      subtitle: 'Including Appreciation' 
    }
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
            Complete overview of our real estate investments across Connecticut and Florida, 
            showcasing our track record of value creation and strategic property management.
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
            <h2 className="text-3xl font-bold text-gray-900">Currently Owned Properties</h2>
            <span className="ml-4 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              {currentProperties.length} Active
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {currentProperties.map((property, index) => (
              <PropertyCard key={`current-${index}`} property={property} />
            ))}
          </div>
        </section>

        {/* Sold Properties Section */}
        <section>
          <div className="flex items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Sold Properties</h2>
            <span className="ml-4 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              {soldProperties.length} Completed
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {soldProperties.map((property, index) => (
              <PropertyCard key={`sold-${index}`} property={property} />
            ))}
          </div>
        </section>

        {/* Investment Approach */}
        <section className="mt-16 bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Our Investment Approach</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-semibold text-primary mb-3">Geographic Focus</h4>
              <ul className="space-y-2 text-gray-700">
                <li>• <strong>Connecticut:</strong> {portfolioProperties.filter(p => p.state === 'CT').length} properties</li>
                <li>• <strong>Florida:</strong> {portfolioProperties.filter(p => p.state === 'FL').length} property</li>
                <li>• Primary markets: New London, Norwich, Tampa, Stonington</li>
                <li>• Focus on emerging neighborhoods with growth potential</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-primary mb-3">Performance Highlights</h4>
              <ul className="space-y-2 text-gray-700">
                <li>• Highest Cash-on-Cash: {Math.max(...propsWithReturns.map(p => p.cashOnCashReturn)).toFixed(0)}% (41 Stuart Ave)</li>
                <li>• Highest Annualized: {Math.max(...propsWithReturns.map(p => p.annualizedReturn)).toFixed(0)}% (Tampa Property)</li>
                <li>• Total properties transacted: {soldProperties.length}</li>
                <li>• Current active portfolio: {currentProperties.length} properties</li>
              </ul>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="mt-16 bg-primary rounded-xl p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-4">Interested in Our Next Deal?</h3>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Our track record demonstrates consistent performance across diverse property types and markets. 
            Join our investor list to be the first to know about upcoming investment opportunities.
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