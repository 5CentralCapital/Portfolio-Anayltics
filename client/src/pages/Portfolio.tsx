import React, { useState } from 'react';
import PropertyCard from '../components/PropertyCard';
import MetricsCard from '../components/MetricsCard';
import { Building, DollarSign, TrendingUp, Home, Award, FileText, Wrench, Calculator, ShoppingCart, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Property } from '@shared/schema';

const Portfolio = () => {
  const [showKPIModal, setShowKPIModal] = useState<Property | null>(null);

  // Fetch properties from public endpoint
  const { data: propertiesResponse, isLoading, error } = useQuery({
    queryKey: ['/api/public/portfolio'],
    queryFn: async () => {
      const response = await fetch('/api/public/portfolio');
      if (!response.ok) throw new Error('Failed to fetch properties');
      return response.json();
    }
  });

  const properties = (() => {
    if (!propertiesResponse) return [];
    if (Array.isArray(propertiesResponse)) return propertiesResponse;
    if (propertiesResponse.data && Array.isArray(propertiesResponse.data)) return propertiesResponse.data;
    return [];
  })();

  // Calculate property KPIs using centralized calculation logic
  const calculatePropertyKPIs = (property: Property) => {
    if (!property.dealAnalyzerData) {
      // Return basic metrics from property fields if no deal data (matching Admin dashboard exactly)
      const acquisitionPrice = parseFloat(property.acquisitionPrice || '0');
      const totalRehab = parseFloat(property.rehabCosts || '0');
      const allInCost = acquisitionPrice + totalRehab;
      const totalInvestedCapital = parseFloat(property.initialCapitalRequired || '0');
      const arv = parseFloat(property.arvAtTimePurchased || '0');
      const cashCollected = parseFloat(property.totalProfits || '0');
      const capitalRequired = totalInvestedCapital; // Use same value for simple case
      const equityMultiple = capitalRequired > 0 ? (arv - allInCost + cashCollected) / capitalRequired : 0;
      
      return {
        grossRent: 0,
        effectiveGrossIncome: 0,
        monthlyExpenses: 0,
        monthlyNOI: 0,
        annualNOI: 0,
        monthlyDebtService: 0,
        monthlyCashFlow: parseFloat(property.cashFlow || '0'),
        annualCashFlow: parseFloat(property.cashFlow || '0') * 12,
        acquisitionPrice,
        totalRehab,
        allInCost,
        capitalRequired: totalInvestedCapital,
        totalInvestedCapital,
        arv,
        cashCollected,
        equityMultiple,
        cocReturn: property.cashOnCashReturn ? parseFloat(property.cashOnCashReturn) : 0
      };
    }
    
    try {
      const dealData = JSON.parse(property.dealAnalyzerData);
      
      // Get gross rental income
      const grossRent = dealData.rentRoll?.reduce((sum: number, unit: any) => {
        return sum + (parseFloat(unit.proFormaRent || unit.currentRent || '0'));
      }, 0) || 0;
      
      // Calculate vacancy loss
      const vacancyRate = dealData.assumptions?.vacancyRate || 0.05;
      const vacancy = grossRent * vacancyRate;
      const effectiveGrossIncome = grossRent - vacancy;
      
      // Calculate monthly operating expenses
      let monthlyExpenses = 0;
      if (dealData.expenses) {
        Object.entries(dealData.expenses).forEach(([key, value]: [string, any]) => {
          if (value && typeof value === 'object' && 'amount' in value) {
            const amount = parseFloat(value.amount || '0');
            const isPercentage = value.isPercentage || false;
            
            if (isPercentage) {
              monthlyExpenses += (effectiveGrossIncome * 12 * (amount / 100)) / 12;
            } else {
              monthlyExpenses += amount;
            }
          } else {
            monthlyExpenses += parseFloat(value || '0');
          }
        });
      }
      
      // Calculate NOI
      const monthlyNOI = effectiveGrossIncome - monthlyExpenses;
      const annualNOI = monthlyNOI * 12;
      
      // Get debt service from active loan
      const activeLoan = dealData.loans?.find((loan: any) => loan.isActive) || dealData.loans?.[0];
      const monthlyDebtService = activeLoan?.monthlyPayment || 0;
      
      // Calculate cash flow
      const monthlyCashFlow = monthlyNOI - monthlyDebtService;
      const annualCashFlow = monthlyCashFlow * 12;
      
      // Calculate investment metrics
      const acquisitionPrice = parseFloat(property.acquisitionPrice || '0');
      
      // Calculate total rehab from budget
      let totalRehab = 0;
      if (dealData.rehabBudget) {
        Object.values(dealData.rehabBudget).forEach((category: any) => {
          if (typeof category === 'object') {
            Object.values(category).forEach((item: any) => {
              if (typeof item === 'object' && item.cost) {
                totalRehab += parseFloat(item.cost || '0');
              }
            });
          }
        });
      }
      
      const allInCost = acquisitionPrice + totalRehab;
      
      // Calculate capital required
      const loanPercentage = dealData.assumptions?.loanPercentage || 0.85;
      const downPayment = (acquisitionPrice + totalRehab) * (1 - loanPercentage);
      
      let closingCosts = 0;
      if (dealData.closingCosts) {
        Object.values(dealData.closingCosts).forEach((cost: any) => {
          closingCosts += parseFloat(cost || '0');
        });
      }
      
      let holdingCosts = 0;
      if (dealData.holdingCosts) {
        Object.values(dealData.holdingCosts).forEach((cost: any) => {
          holdingCosts += parseFloat(cost || '0');
        });
      }
      
      const capitalRequired = downPayment + closingCosts + holdingCosts;
      
      // Calculate total invested capital exactly like Admin dashboard
      const totalInvested = parseFloat(property.initialCapitalRequired || '0');
      const totalInvestedCapital = totalInvested > 0 ? totalInvested : (acquisitionPrice + totalRehab + closingCosts + holdingCosts);
      
      // Calculate ARV and equity metrics using correct formula: (ARV - all in costs + cash collected) / capital required
      const arv = parseFloat(property.arvAtTimePurchased || '0');
      const cashCollected = parseFloat(property.totalProfits || '0'); // This represents cash flow collected over time
      const equityMultiple = capitalRequired > 0 ? (arv - allInCost + cashCollected) / capitalRequired : 0;
      
      console.log('Portfolio Equity Multiple Calculation for', property.address, {
        arv,
        allInCost,
        cashCollected,
        capitalRequired,
        equityMultiple,
        calculation: `(${arv} - ${allInCost} + ${cashCollected}) / ${capitalRequired} = ${equityMultiple}`
      });
      
      // Calculate cash-on-cash return
      const cocReturn = capitalRequired > 0 ? (annualCashFlow / capitalRequired) * 100 : 0;
      
      return {
        grossRent,
        effectiveGrossIncome,
        monthlyExpenses,
        monthlyNOI,
        annualNOI,
        monthlyDebtService,
        monthlyCashFlow,
        annualCashFlow,
        acquisitionPrice,
        totalRehab,
        allInCost,
        capitalRequired,
        totalInvestedCapital,
        arv,
        cashCollected,
        equityMultiple,
        cocReturn
      };
    } catch (error) {
      console.error('Error calculating KPIs for', property.address, error);
      return null;
    }
  };

  const formatCurrency = (amount: number) => {
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

  // Function to get property image
  const getPropertyImage = (address: string) => {
    // Clean address for filename matching
    const cleanAddress = address.trim();
    
    // Map of property addresses to their image files
    const imageMap: { [key: string]: string } = {
      '1 Harmony St': '/1 Harmony St.jpeg',
      '145 Crystal Ave': '/145 Crystal Ave.jpg', 
      '149 Crystal Ave': '/149 Crystal Ave.jpeg',
      '157 Crystal Ave': '/157 Crystal Ave.jpeg',
      '175 Crystal Ave': '/175 Crystal Ave.jpeg',
      '25 Huntington Pl': '/25 Huntington Pl.jpeg',
      '29 Brainard St': '/29 Brainard St.jpeg',
      '3408 E DR MLK BLVD': '/3408 E DR MLK BLVD.jpeg',
      '3408 E Dr MLK BLVD': '/3408 E Dr MLK BLVD.jpeg',
      '35 Linden St': '/35 Linden St.jpeg',
      '41 Stuart Ave': '/41 Stuart Ave.jpeg',
      '52 Summit Ave': '/52 Summit Ave.jpeg'
    };

    return imageMap[cleanAddress] || null;
  };

  // Separate properties by status
  const underContractProperties = properties.filter((p: Property) => p.status === 'Under Contract');
  const rehabbingProperties = properties.filter((p: Property) => p.status === 'Rehabbing');
  const cashflowingProperties = properties.filter((p: Property) => p.status === 'Cashflowing');
  const soldPropertiesFromDB = properties.filter((p: Property) => p.status === 'Sold');

  // Loading and error states
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading portfolio data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-red-600">Error loading portfolio data. Please try again.</p>
          </div>
        </div>
      </div>
    );
  }

  // Hardcoded portfolio data as fallback
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

  // Separate current and sold properties for fallback data
  const currentProperties = portfolioProperties.filter(p => p.status === 'Currently Own');
  const fallbackSoldProperties = portfolioProperties.filter(p => p.status === 'Sold');

  // Calculate portfolio aggregate metrics dynamically from properties
  const calculatePortfolioMetrics = () => {
    // Total Portfolio Value - sum of ARVs for all properties
    const totalPortfolioValue = properties.reduce((sum: number, property: Property) => {
      const arv = parseFloat(property.arvAtTimePurchased || '0');
      return sum + arv;
    }, 0);

    // Total Units - sum of all apartments
    const totalUnits = properties.reduce((sum: number, property: Property) => {
      return sum + (property.apartments || 0);
    }, 0);

    // Total Equity Created - sum of (ARV - acquisition price - rehab costs) for all properties
    const totalEquityCreated = properties.reduce((sum: number, property: Property) => {
      const arv = parseFloat(property.arvAtTimePurchased || '0');
      const acquisition = parseFloat(property.acquisitionPrice || '0');
      const rehab = parseFloat(property.rehabCosts || '0');
      const equity = arv - acquisition - rehab;
      return sum + (equity > 0 ? equity : 0);
    }, 0);

    // Average Cash-on-Cash Return
    let totalCoCReturn = 0;
    let propertiesWithCoC = 0;
    
    properties.forEach((property: Property) => {
      const kpis = calculatePropertyKPIs(property);
      if (kpis && kpis.cocReturn > 0) {
        totalCoCReturn += kpis.cocReturn;
        propertiesWithCoC++;
      }
    });
    
    const avgCoCReturn = propertiesWithCoC > 0 ? totalCoCReturn / propertiesWithCoC : 0;

    // Average Annualized Return - for sold properties
    const soldProperties = properties.filter((p: Property) => p.status === 'Sold');
    let totalAnnualizedReturn = 0;
    let propertiesWithReturn = 0;

    soldProperties.forEach((property: Property) => {
      if (property.annualizedReturn) {
        const annReturn = parseFloat(property.annualizedReturn || '0');
        if (annReturn > 0) {
          totalAnnualizedReturn += annReturn;
          propertiesWithReturn++;
        }
      }
    });

    const avgAnnualizedReturn = propertiesWithReturn > 0 ? totalAnnualizedReturn / propertiesWithReturn : 0;

    return {
      totalPortfolioValue,
      totalUnits,
      totalEquityCreated,
      avgCoCReturn,
      avgAnnualizedReturn
    };
  };

  const metrics = calculatePortfolioMetrics();

  const portfolioMetrics = [
    { 
      title: 'Total Portfolio Value', 
      value: formatCurrency(metrics.totalPortfolioValue), 
      icon: DollarSign, 
      subtitle: 'Current Asset Values' 
    },
    { 
      title: 'Total Units', 
      value: metrics.totalUnits.toString(), 
      icon: Building, 
      subtitle: 'All Properties Combined' 
    },
    { 
      title: 'Total Equity Created', 
      value: formatCurrency(metrics.totalEquityCreated), 
      icon: TrendingUp, 
      subtitle: 'Value Added Through Strategy' 
    },
    { 
      title: 'Avg Cash-on-Cash', 
      value: formatPercentage(metrics.avgCoCReturn), 
      icon: Award, 
      subtitle: 'All Properties Performance' 
    },
    { 
      title: 'Avg Annualized Return', 
      value: formatPercentage(metrics.avgAnnualizedReturn), 
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

        {/* Under Contract Properties */}
        {underContractProperties.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center mb-6">
              <FileText className="h-6 w-6 mr-3 text-orange-500" />
              <h2 className="text-2xl font-bold text-gray-900">Under Contract</h2>
              <span className="ml-4 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                {underContractProperties.length} Properties
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {underContractProperties.map((property: Property) => (
                <div
                  key={property.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  onDoubleClick={() => setShowKPIModal(property)}
                  title="Double-click to view financial KPIs"
                >
                  {/* Property Image */}
                  {getPropertyImage(property.address) && (
                    <div className="h-48 overflow-hidden">
                      <img 
                        src={getPropertyImage(property.address)!} 
                        alt={property.address}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  
                  <div className="p-6">
                    <div className="mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{property.address} • {property.apartments} Units</h3>
                      <p className="text-gray-600 text-sm">{property.city}, {property.state}</p>
                      {property.acquisitionDate && (
                        <p className="text-gray-500 text-xs mt-1">
                          Acquired: {new Date(property.acquisitionDate).toLocaleDateString()}
                          {(() => {
                            if (property.acquisitionDate) {
                              const yearsHeld = (new Date().getTime() - new Date(property.acquisitionDate).getTime()) / (1000 * 60 * 60 * 24 * 365);
                              return ` • ${yearsHeld.toFixed(1)} years held`;
                            }
                            return '';
                          })()}
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div className="flex justify-between">
                        <p className="text-gray-500">Purchase Price</p>
                        <p className="font-semibold">{formatCurrency(parseFloat(property.acquisitionPrice || '0'))}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Rehabbing Properties */}
        {rehabbingProperties.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center mb-6">
              <Wrench className="h-6 w-6 mr-3 text-yellow-500" />
              <h2 className="text-2xl font-bold text-gray-900">Rehabbing</h2>
              <span className="ml-4 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                {rehabbingProperties.length} Properties
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rehabbingProperties.map((property: Property) => (
                <div
                  key={property.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  onDoubleClick={() => setShowKPIModal(property)}
                  title="Double-click to view financial KPIs"
                >
                  {/* Property Image */}
                  {getPropertyImage(property.address) && (
                    <div className="h-48 overflow-hidden">
                      <img 
                        src={getPropertyImage(property.address)!} 
                        alt={property.address}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  
                  <div className="p-6">
                    <div className="mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{property.address} • {property.apartments} Units</h3>
                      <p className="text-gray-600 text-sm">{property.city}, {property.state}</p>
                      {property.acquisitionDate && (
                        <p className="text-gray-500 text-xs mt-1">
                          Acquired: {new Date(property.acquisitionDate).toLocaleDateString()}
                          {(() => {
                            if (property.acquisitionDate) {
                              const yearsHeld = (new Date().getTime() - new Date(property.acquisitionDate).getTime()) / (1000 * 60 * 60 * 24 * 365);
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
                        <p className="font-semibold">{formatCurrency(parseFloat(property.acquisitionPrice || '0'))}</p>
                      </div>
                      <div className="flex justify-between">
                        <p className="text-gray-500">ARV</p>
                        <p className="font-semibold">{formatCurrency(parseFloat(property.arvAtTimePurchased || '0'))}</p>
                      </div>
                      <div className="flex justify-between">
                        <p className="text-gray-500">Rehab Cost</p>
                        <p className="font-semibold">{formatCurrency(parseFloat(property.rehabCosts || '0'))}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Cashflowing Properties */}
        {cashflowingProperties.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center mb-6">
              <Calculator className="h-6 w-6 mr-3 text-green-500" />
              <h2 className="text-2xl font-bold text-gray-900">Cashflowing</h2>
              <span className="ml-4 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                {cashflowingProperties.length} Properties
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cashflowingProperties.map((property: Property) => (
                <div
                  key={property.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  onDoubleClick={() => setShowKPIModal(property)}
                  title="Double-click to view financial KPIs"
                >
                  {/* Property Image */}
                  {getPropertyImage(property.address) && (
                    <div className="h-48 overflow-hidden">
                      <img 
                        src={getPropertyImage(property.address)!} 
                        alt={property.address}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  
                  <div className="p-6">
                    <div className="mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{property.address} • {property.apartments} Units</h3>
                      <p className="text-gray-600 text-sm">{property.city}, {property.state}</p>
                      {property.acquisitionDate && (
                        <p className="text-gray-500 text-xs mt-1">
                          Acquired: {new Date(property.acquisitionDate).toLocaleDateString()}
                          {(() => {
                            if (property.acquisitionDate) {
                              const yearsHeld = (new Date().getTime() - new Date(property.acquisitionDate).getTime()) / (1000 * 60 * 60 * 24 * 365);
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
                        <p className="font-semibold">{formatCurrency(parseFloat(property.acquisitionPrice || '0'))}</p>
                      </div>
                      <div className="flex justify-between">
                        <p className="text-gray-500">ARV</p>
                        <p className="font-semibold">{formatCurrency(parseFloat(property.arvAtTimePurchased || '0'))}</p>
                      </div>
                      <div className="flex justify-between">
                        <p className="text-gray-500">Annual Cash Flow</p>
                        {(() => {
                          const kpis = calculatePropertyKPIs(property);
                          return (
                            <p className={`font-semibold ${kpis?.annualCashFlow && kpis.annualCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {kpis ? formatCurrency(kpis.annualCashFlow) : 'N/A'}
                            </p>
                          );
                        })()}
                      </div>
                      <div className="flex justify-between">
                        <p className="text-gray-500">Equity Multiple</p>
                        {(() => {
                          const kpis = calculatePropertyKPIs(property);
                          return (
                            <p className={`font-semibold ${kpis?.equityMultiple && kpis.equityMultiple >= 1 ? 'text-blue-600' : 'text-red-600'}`}>
                              {kpis ? `${kpis.equityMultiple.toFixed(2)}x` : 'N/A'}
                            </p>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Sold Properties */}
        {soldPropertiesFromDB.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center mb-6">
              <ShoppingCart className="h-6 w-6 mr-3 text-blue-500" />
              <h2 className="text-2xl font-bold text-gray-900">Sold Properties</h2>
              <span className="ml-4 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {soldPropertiesFromDB.length} Completed
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {soldPropertiesFromDB.map((property: Property) => (
                <div
                  key={property.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  onDoubleClick={() => setShowKPIModal(property)}
                  title="Double-click to view financial KPIs"
                >
                  {/* Property Image */}
                  {getPropertyImage(property.address) && (
                    <div className="h-32 overflow-hidden">
                      <img 
                        src={getPropertyImage(property.address)!} 
                        alt={property.address}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  
                  <div className="p-4">
                    <div className="mb-3">
                      <h3 className="text-md font-semibold text-gray-900 mb-1">{property.address} • {property.apartments} Units</h3>
                      <p className="text-sm text-gray-600">{property.city}, {property.state}</p>
                      {property.acquisitionDate && (
                        <p className="text-gray-500 text-xs mt-1">
                          Acquired: {new Date(property.acquisitionDate).toLocaleDateString()}
                          {(() => {
                            if (property.acquisitionDate) {
                              let endDate = property.saleDate ? new Date(property.saleDate) : new Date();
                              const yearsHeld = (endDate.getTime() - new Date(property.acquisitionDate).getTime()) / (1000 * 60 * 60 * 24 * 365);
                              return ` • ${yearsHeld.toFixed(1)} years held`;
                            }
                            return '';
                          })()}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Capital Invested</span>
                        <span className="font-semibold text-blue-700">{formatCurrency(parseFloat(property.initialCapitalRequired || '0'))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Total Profit</span>
                        <span className="font-semibold text-green-600">{formatCurrency(parseFloat(property.totalProfits || '0'))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Equity Multiple</span>
                        <span className="font-semibold text-purple-600">{parseFloat(property.cashOnCashReturn || '0').toFixed(1)}x</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Sale Price</span>
                        <span className="font-semibold text-orange-600">{formatCurrency(parseFloat(property.salePrice || '0'))}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* KPI Modal */}
        {showKPIModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Property KPIs - {showKPIModal.address}
                </h2>
                <button
                  onClick={() => setShowKPIModal(null)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {(() => {
                const kpis = calculatePropertyKPIs(showKPIModal);
                if (!kpis) {
                  return (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No financial data available for this property</p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Revenue Section */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-4">Revenue</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-blue-700 dark:text-blue-300">Gross Rent (Monthly)</span>
                          <span className="font-semibold text-blue-900 dark:text-blue-200">{formatCurrency(kpis.grossRent)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700 dark:text-blue-300">Effective Gross Income (Monthly)</span>
                          <span className="font-semibold text-blue-900 dark:text-blue-200">{formatCurrency(kpis.effectiveGrossIncome)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700 dark:text-blue-300">Annual NOI</span>
                          <span className="font-semibold text-blue-900 dark:text-blue-200">{formatCurrency(kpis.annualNOI)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Expenses Section */}
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-4">Expenses</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-red-700 dark:text-red-300">Operating Expenses (Monthly)</span>
                          <span className="font-semibold text-red-900 dark:text-red-200">{formatCurrency(kpis.monthlyExpenses)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-red-700 dark:text-red-300">Debt Service (Monthly)</span>
                          <span className="font-semibold text-red-900 dark:text-red-200">{formatCurrency(kpis.monthlyDebtService)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Cash Flow Section */}
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-green-900 dark:text-green-200 mb-4">Cash Flow</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-green-700 dark:text-green-300">Monthly Cash Flow</span>
                          <span className={`font-semibold ${kpis.monthlyCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(kpis.monthlyCashFlow)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-700 dark:text-green-300">Annual Cash Flow</span>
                          <span className={`font-semibold ${kpis.annualCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(kpis.annualCashFlow)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-700 dark:text-green-300">Cash-on-Cash Return</span>
                          <span className={`font-semibold ${kpis.cocReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatPercentage(kpis.cocReturn)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Investment Summary */}
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-200 mb-4">Investment Summary</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-purple-700 dark:text-purple-300">Capital Required</span>
                          <span className="font-semibold text-purple-900 dark:text-purple-200">{formatCurrency(kpis.capitalRequired)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-purple-700 dark:text-purple-300">All-In Cost</span>
                          <span className="font-semibold text-purple-900 dark:text-purple-200">{formatCurrency(kpis.allInCost)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-purple-700 dark:text-purple-300">Current ARV</span>
                          <span className="font-semibold text-purple-900 dark:text-purple-200">{formatCurrency(kpis.arv)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-purple-700 dark:text-purple-300">Equity Multiple</span>
                          <span className={`font-semibold ${kpis.equityMultiple >= 1 ? 'text-green-600' : 'text-red-600'}`}>
                            {kpis.equityMultiple.toFixed(2)}x
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

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
                <li>• Exceptional average cash-on-cash returns: 458.8%</li>
                <li>• Strong annualized performance: 115.6% average</li>
                <li>• Total equity created: $2.42M across portfolio</li>
                <li>• Diversified across 37 units in two states</li>
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