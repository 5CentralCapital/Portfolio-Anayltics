import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, TrendingUp, Shield, Target, DollarSign, Building, Users, Award } from 'lucide-react';
import MetricsCard from '../components/MetricsCard';
import ValuePropCard from '../components/ValuePropCard';
import FeaturedDealCard from '../components/FeaturedDealCard';
import FAQSection from '../components/FAQSection';

const Home = () => {
  // Updated company metrics to sync with portfolio page
  const metrics = [
    { title: 'Total Portfolio Value', value: '$7.23M', icon: DollarSign, subtitle: 'Current Asset Values' },
    { title: 'Total Units', value: '19', icon: Building, subtitle: 'All Properties Combined' },
    { title: 'Total Equity Created', value: '$2.42M', icon: TrendingUp, subtitle: 'Value Added Through Strategy' },
    { title: 'Avg Cash-on-Cash', value: '458.8%', icon: Award, subtitle: 'All Properties Performance' },
    { title: 'Avg Annualized Return', value: '115.6%', icon: Target, subtitle: 'Including Appreciation' }
  ];

  // Value propositions
  const valueProps = [
    {
      title: 'High-Yield Strategy',
      description: 'Target 15-25% cash-on-cash returns through strategic value-add renovations and operational improvements.',
      icon: TrendingUp
    },
    {
      title: 'Proven Operator',
      description: 'Track record of successful multifamily acquisitions with deep Florida market knowledge and execution expertise.',
      icon: Award
    },
    {
      title: 'Skin in the Game',
      description: 'Founder-led with significant personal capital invested alongside partners in every deal.',
      icon: Shield
    },
    {
      title: 'Investor Transparency',
      description: 'Regular updates, detailed reporting, and direct access to the investment team throughout the hold period.',
      icon: Users
    }
  ];

  // Featured deals - updated with current properties
  const featuredDeals = [
    {
      name: '3408 E Dr MLK BLVD',
      address: 'Tampa, FL',
      units: 10,
      purchasePrice: 750000,
      arv: 2000000,
      cashOnCashReturn: 372.1,
      status: 'current' as const
    },
    {
      name: '157 Crystal Ave',
      address: 'New London, CT',
      units: 5,
      purchasePrice: 376000,
      arv: 700000,
      cashOnCashReturn: 381.1,
      status: 'current' as const
    },
    {
      name: '1 Harmony St',
      address: 'Stonington, CT',
      units: 4,
      purchasePrice: 1075000,
      arv: 1500000,
      cashOnCashReturn: 222.6,
      status: 'current' as const
    }
  ];

  return (
    <div className="animate-fade-in">
      {/* Hero Section - Reduced Height */}
      <section className="relative h-[60vh] flex items-center justify-center">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop)',
          }}
        >
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center text-white px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 animate-slide-up">
            5Central Capital
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-4 font-medium">
            Investing Simply Since 2021
          </p>
          <p className="text-base md:text-lg text-gray-300 mb-6 max-w-2xl mx-auto leading-relaxed">
            Tampa-based real estate investment firm focused on strategic multifamily acquisitions 
            and value creation through disciplined execution.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/portfolio"
              className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-dark transition-all transform hover:scale-105 flex items-center justify-center space-x-2"
            >
              <span>View Our Portfolio</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/investor"
              className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-gray-900 transition-all transform hover:scale-105"
            >
              Invest With Us (Coming Soon)
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Deal Preview */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Featured Deals
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Showcase of our current multifamily investments
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredDeals.map((deal, index) => (
              <FeaturedDealCard key={index} deal={deal} />
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              to="/portfolio"
              className="inline-flex items-center bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors"
            >
              View Full Portfolio
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Company Metrics Section - Now before Why Invest With Us */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Company Metrics
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Track record of consistent performance across our multifamily portfolio
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {metrics.map((metric, index) => (
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
      </section>

      {/* Why Invest With Us Section - Now after Company Metrics */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Invest With Us
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our proven strategy combines aggressive value creation with strategic financing 
              to maximize returns for our investors.
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
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600">
              Common questions about our investment process and strategy
            </p>
          </div>

          <FAQSection />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Learn More?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Discover our current investment opportunities and learn about our founder's 
            ambitious vision to reach $1B in AUM by 2050.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/portfolio"
              className="bg-white text-primary px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-all transform hover:scale-105"
            >
              View Current Portfolio
            </Link>
            <Link
              to="/founder"
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-primary transition-all transform hover:scale-105"
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