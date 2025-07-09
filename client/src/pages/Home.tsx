import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, TrendingUp, Shield, Target, DollarSign, Building, Users, Award, Home as HomeIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import MetricsCard from '../components/MetricsCard';
import ValuePropCard from '../components/ValuePropCard';
import FeaturedDealCard from '../components/FeaturedDealCard';
import FAQSection from '../components/FAQSection';
import { useCalculations } from '../contexts/CalculationsContext';


const Home = () => {
  const { calculateProperty, calculatePortfolioMetrics, formatCurrency, formatPercentage } = useCalculations();

  // Fetch portfolio properties data 
  const { data: propertiesResponse } = useQuery({
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

  // Use centralized calculation service for consistency
  const portfolioMetricsData = calculatePortfolioMetrics(properties);
  
  // Calculate additional metrics for display
  const soldProperties = properties.filter((p: any) => p.status === 'Sold');
  let totalAnnualizedReturn = 0;
  let propertiesWithReturn = 0;

  soldProperties.forEach((property: any) => {
    if (property.annualizedReturn) {
      const annReturn = parseFloat(property.annualizedReturn || '0');
      if (annReturn > 0) {
        totalAnnualizedReturn += annReturn;
        propertiesWithReturn++;
      }
    }
  });

  const avgAnnualizedReturn = propertiesWithReturn > 0 ? totalAnnualizedReturn / propertiesWithReturn : 0;

  const metrics = [
    { 
      title: 'Total Portfolio Value', 
      value: formatCurrency(portfolioMetricsData.totalAUM), 
      icon: DollarSign, 
      subtitle: 'Current Asset Values',
      trend: '+15% YoY',
      trendUp: true
    },
    { 
      title: 'Total Units', 
      value: portfolioMetricsData.totalUnits.toString(), 
      icon: Building, 
      subtitle: 'All Properties Combined',
      trend: 'Across 2 States',
      trendUp: true
    },
    { 
      title: 'Total Equity Created', 
      value: formatCurrency(portfolioMetricsData.totalEquityCreated), 
      icon: TrendingUp, 
      subtitle: 'Value Added Through Strategy',
      trend: '57% of Portfolio Value',
      trendUp: true
    },
    { 
      title: 'Avg Equity Multiple', 
      value: `${portfolioMetricsData.avgEquityMultiple.toFixed(2)}x`, 
      icon: Award, 
      subtitle: 'All Properties Performance',
      trend: 'Exceptional Returns',
      trendUp: true
    },
    { 
      title: 'Avg Annualized Return', 
      value: formatPercentage(avgAnnualizedReturn), 
      icon: Target, 
      subtitle: 'Including Appreciation',
      trend: 'Compound Growth',
      trendUp: true
    }
  ];

  // Value propositions with dynamic statistics
  const valueProps = [
    {
      title: 'Exceptional Returns',
      description: `Consistently deliver ${portfolioMetricsData.avgEquityMultiple.toFixed(1)}x+ equity multiples through strategic value-add renovations, operational improvements, and market timing expertise.`,
      icon: TrendingUp
    },
    {
      title: 'Proven Track Record',
      description: `Successfully acquired ${portfolioMetricsData.totalUnits} units across ${properties.length} properties in Connecticut and Florida with documented performance metrics and transparent reporting.`,
      icon: Award
    },
    {
      title: 'Principal Investment',
      description: 'Founder-led with significant personal capital invested alongside partners in every deal, ensuring aligned interests and shared success.',
      icon: Shield
    },
    {
      title: 'Full Transparency',
      description: 'Complete financial disclosure, regular performance updates, and direct access to the investment team throughout the entire investment lifecycle.',
      icon: Users
    }
  ];

  // Fetch featured properties from database
  const { data: featuredProperties = [], isLoading: featuredLoading } = useQuery({
    queryKey: ['/api/properties/featured'],
    queryFn: async () => {
      const response = await fetch('/api/properties/featured');
      if (!response.ok) throw new Error('Failed to fetch featured properties');
      return response.json();
    }
  });

  // Use properties directly - no conversion needed
  const featuredDeals = featuredProperties || [];

  return (
    <div className="animate-fade-in">
      {/* Enhanced Hero Section */}
      <section className="relative h-[70vh] flex items-center justify-center">
        {/* Background Image with improved overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop)',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/50 to-black/40"></div>
        </div>

        {/* Hero Content with improved typography */}
        <div className="relative z-10 text-center text-white px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-slide-up leading-tight">
            5Central Capital
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 mb-4 font-medium">
            Strategic Real Estate Investment Since 2021
          </p>
          <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Tampa-based investment firm specializing in high-return multifamily acquisitions 
            with proven value creation through disciplined execution and strategic financing.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/portfolio"
              className="bg-primary text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary-dark transition-all transform hover:scale-105 flex items-center justify-center space-x-2 shadow-lg"
            >
              <span>View Our Portfolio</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              to="/investor"
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-gray-900 transition-all transform hover:scale-105 shadow-lg"
            >
              Investment Opportunities
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Properties Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Featured Properties
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Current multifamily investments showcasing our value-add strategy with real property photos and verified performance metrics
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredLoading ? (
              // Loading state
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
                  <div className="h-32 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))
            ) : featuredDeals.length > 0 ? (
              featuredDeals.map((property: any, index: number) => (
                <FeaturedDealCard key={index} deal={property} />
              ))
            ) : (
              // Empty state
              <div className="col-span-full text-center py-12">
                <Home className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">No Featured Properties</h3>
                <p className="text-gray-600">Properties will appear here when marked as featured in the admin dashboard.</p>
              </div>
            )}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/portfolio"
              className="inline-flex items-center bg-primary text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary-dark transition-all transform hover:scale-105 shadow-lg"
            >
              View Complete Portfolio
              <ArrowRight className="h-5 w-5 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Company Metrics Section with enhanced presentation */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Performance Metrics
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Verified track record of exceptional returns across our diversified real estate portfolio
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8">
            {metrics.map((metric, index) => (
              <MetricsCard
                key={index}
                title={metric.title}
                value={metric.value}
                icon={metric.icon}
                subtitle={metric.subtitle}
                trend={metric.trend}
                trendUp={metric.trendUp}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Why Invest With Us Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Why Partner With Us
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our proven methodology combines aggressive value creation with strategic financing 
              to deliver industry-leading returns for our investment partners.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {valueProps.map((prop, index) => (
              <ValuePropCard
                key={index}
                title={prop.title}
                description={prop.description}
                icon={prop.icon}
              />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Investment Process
            </h2>
            <p className="text-xl text-gray-600">
              Common questions about our investment strategy and partnership opportunities
            </p>
          </div>

          <FAQSection />
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="py-20 bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
            Ready to Explore Opportunities?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-3xl mx-auto leading-relaxed">
            Discover our current investment opportunities and learn about our founder's 
            ambitious vision to build a $1 billion real estate portfolio by 2050.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link
              to="/portfolio"
              className="bg-white text-primary px-10 py-5 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg"
            >
              View Current Portfolio
            </Link>
            <Link
              to="/founder"
              className="border-2 border-white text-white px-10 py-5 rounded-lg font-semibold text-lg hover:bg-white hover:text-primary transition-all transform hover:scale-105 shadow-lg"
            >
              Meet Michael McElwee
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;