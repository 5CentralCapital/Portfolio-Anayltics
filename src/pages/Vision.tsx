import React from 'react';
import { Calendar, DollarSign, TrendingUp, Target, Building2, Home } from 'lucide-react';

const Vision = () => {
  const milestones = [
    {
      year: '2030',
      target: '$10M AUM',
      units: '71 Units',
      status: 'upcoming',
      description: 'Build foundation with 5-8 properties, establish proven systems',
      strategies: [
        'Focus on 10-20 unit properties in Tampa metro',
        'Perfect the bridge loan to cash-out refi strategy',
        'Build strong contractor and property management team',
        'Establish relationships with local lenders'
      ]
    },
    {
      year: '2035',
      target: '$50M AUM',
      units: '357 Units',
      status: 'upcoming',
      description: 'Scale operations with larger properties and refined processes',
      strategies: [
        'Target 20-50 unit properties across Florida',
        'Develop standardized renovation and management processes',
        'Build institutional relationships with lenders',
        'Consider strategic partnerships for larger deals'
      ]
    },
    {
      year: '2040',
      target: '$100M AUM',
      units: '500 Units',
      status: 'future',
      description: 'Scale operations, larger properties, potential partnerships',
      strategies: [
        'Target 50+ unit properties and small apartment complexes',
        'Explore partnerships for larger acquisitions',
        'Expand to secondary Florida markets',
        'Consider raising capital from accredited investors'
      ]
    },
    {
      year: '2045',
      target: '$500M AUM',
      units: '2,500 Units',
      status: 'future',
      description: 'Regional expansion and institutional-scale operations',
      strategies: [
        'Large multifamily complexes (100+ units)',
        'Expand to Southeast regional markets',
        'Institutional capital partnerships',
        'Professional management company operations'
      ]
    },
    {
      year: '2050',
      target: '$1B AUM',
      units: '5,000 Units',
      status: 'vision',
      description: 'Industry leadership, legacy wealth creation',
      strategies: [
        'Large multifamily and commercial properties',
        'Potential public or institutional partnerships',
        'Mentor next generation of real estate investors',
        'Philanthropic initiatives and community impact'
      ]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-green-100 text-green-800 border-green-200';
      case 'future': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'vision': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 animate-fade-in">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Our Vision
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            A clear roadmap to building $1 billion in AUM through strategic multifamily 
            real estate investments over the next 25 years.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-primary transform md:-translate-x-px"></div>

          {/* Milestones */}
          <div className="space-y-12">
            {milestones.map((milestone, index) => (
              <div key={milestone.year} className={`relative flex items-center ${
                index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
              }`}>
                {/* Timeline Dot */}
                <div className="absolute left-0 md:left-1/2 w-8 h-8 bg-primary rounded-full border-4 border-white shadow-lg transform md:-translate-x-1/2 z-10 flex items-center justify-center">
                  <Calendar className="h-3 w-3 text-white" />
                </div>

                {/* Content Card */}
                <div className={`ml-12 md:ml-0 md:w-5/12 ${
                  index % 2 === 0 ? 'md:mr-auto md:pr-8' : 'md:ml-auto md:pl-8'
                }`}>
                  <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-2xl font-bold text-gray-900">{milestone.year}</h2>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(milestone.status)}`}>
                        {milestone.status}
                      </span>
                    </div>
                    
                    <div className="mb-4">
                      <h3 className="text-xl font-semibold text-primary mb-1">
                        {milestone.target}
                      </h3>
                      <div className="flex items-center text-gray-600 mb-3">
                        <Home className="h-4 w-4 mr-1" />
                        <span className="text-sm font-medium">{milestone.units}</span>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-4">
                      {milestone.description}
                    </p>

                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                        <Target className="h-4 w-4 mr-1" />
                        Key Strategies
                      </h4>
                      <ul className="space-y-1">
                        {milestone.strategies.map((strategy, strategyIndex) => (
                          <li key={strategyIndex} className="text-sm text-gray-600 flex items-start">
                            <span className="text-primary mr-2">•</span>
                            {strategy}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Strategy Overview */}
        <div className="mt-16 bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <TrendingUp className="h-6 w-6 mr-2 text-primary" />
            Our Strategic Approach
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Property Focus</h3>
              <p className="text-gray-600 text-sm">
                10+ unit multifamily properties in Florida markets with strong fundamentals 
                and value-add potential
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Financing Strategy</h3>
              <p className="text-gray-600 text-sm">
                85% LTC bridge loans combined with strategic cash-out refinancing 
                to maximize leverage and returns
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Return Targets</h3>
              <p className="text-gray-600 text-sm">
                Target 3-4x return on invested capital through strategic renovations 
                and operational improvements
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">The Bridge Loan Playbook</h3>
            <p className="text-gray-700 mb-4">
              Our proven strategy leverages bridge financing to acquire undervalued properties, 
              execute value-add improvements, then refinance into permanent financing while 
              retaining ownership for long-term appreciation.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Acquisition Phase</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Identify undervalued properties</li>
                  <li>• Secure 85% LTC bridge financing</li>
                  <li>• Close quickly with minimal cash</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Value Creation Phase</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Execute renovation and improvement plan</li>
                  <li>• Increase rent roll and property value</li>
                  <li>• Refinance into permanent loan</li>
                  <li>• Extract capital for next acquisition</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Unit Growth Visualization */}
        <div className="mt-12 bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Home className="h-6 w-6 mr-2 text-primary" />
            Portfolio Growth Trajectory
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {milestones.map((milestone, index) => (
              <div key={milestone.year} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-primary mb-1">{milestone.year}</div>
                <div className="text-sm text-gray-600 mb-2">{milestone.target}</div>
                <div className="text-lg font-semibold text-gray-900">{milestone.units}</div>
              </div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Unit calculations based on $140K/unit for 2030-2035 targets and $200K/unit for 2040-2050 targets
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-12 bg-primary rounded-xl p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-4">Join Us on This Journey</h3>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            These ambitious goals require strategic partnerships and smart capital. 
            Learn more about potential investment opportunities.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/portfolio"
              className="bg-white text-primary px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              View Current Portfolio
            </a>
            <a
              href="/investor"
              className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary transition-colors"
            >
              Investor Information
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Vision;