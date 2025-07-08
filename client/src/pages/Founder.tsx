import React from 'react';
import { Calendar, MapPin, Target, TrendingUp, User, Award, Building } from 'lucide-react';

const Founder = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 animate-fade-in">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Meet Michael McElwee
          </h1>
          <p className="text-xl text-gray-600">
            Founder & Managing Partner of 5Central Capital LLC
          </p>
        </div>

        {/* Profile Section */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-12">
          <div className="md:flex">
            {/* Photo Placeholder */}
            <div className="md:w-1/3 bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center h-64 md:h-auto">
              <div className="text-center text-white">
                <User className="h-20 w-20 mx-auto mb-4" />
                <p className="text-sm">Professional Photo</p>
                <p className="text-xs opacity-75">Coming Soon</p>
              </div>
            </div>

            {/* Bio Content */}
            <div className="md:w-2/3 p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center space-x-2 text-gray-600">
                  <Award className="h-4 w-4" />
                  <span>51 units across $5.8M in acquisitions</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>Based in Tampa, FL</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <Building className="h-4 w-4" />
                  <span>12 properties transacted</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <TrendingUp className="h-4 w-4" />
                  <span>4.9x average equity multiple</span>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">About Michael</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  Michael McElwee is the founder and driving force behind 5Central Capital LLC. 
                  With over 5 years of hands-on experience in real estate investing, Michael has 
                  built a proven track record of exceptional returns through strategic property 
                  acquisitions and value-add improvements.
                </p>
                <p>
                  Based in Tampa, Florida, Michael has developed deep expertise in both the Florida 
                  and Connecticut multifamily markets. His portfolio spans 12 properties across 
                  two states, demonstrating his ability to identify and execute profitable 
                  investments in diverse market conditions.
                </p>
                <p>
                  Michael's approach combines aggressive value creation with strategic financing, 
                  consistently delivering equity multiples averaging 4.9x that far exceed industry standards. 
                  His focus on building long-term wealth through smart real estate leverage has 
                  positioned 5Central Capital as a leader in multifamily investment strategy.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Experience & Expertise Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Award className="h-6 w-6 mr-2 text-primary" />
            Experience & Expertise
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-primary mb-4">Real Estate Investment</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• 5+ years of active real estate investing</li>
                <li>• 12 properties successfully acquired and managed</li>
                <li>• Expertise in multifamily and boarding house properties</li>
                <li>• Proven track record in Connecticut and Florida markets</li>
                <li>• Specialization in value-add renovation strategies</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-primary mb-4">Financial Strategy</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Advanced knowledge of bridge loan financing</li>
                <li>• Cash-out refinancing and leverage optimization</li>
                <li>• Portfolio management and performance tracking</li>
                <li>• Market analysis and deal sourcing expertise</li>
                <li>• 4.9x average equity multiple across all investments</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Vision Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Target className="h-6 w-6 mr-2 text-primary" />
            Why I Started This Company
          </h2>
          <div className="space-y-6 text-gray-700">
            <p className="text-lg leading-relaxed">
              "I founded 5Central Capital because I believe real estate is the most reliable path 
              to building generational wealth. While others my age are focused on short-term gains, 
              I'm building a portfolio that will compound for decades."
            </p>
            <p>
              "My approach is methodical and data-driven. I target undervalued multifamily properties 
              where I can add significant value through strategic renovations, operational improvements, 
              and smart financing. The goal isn't just to flip properties—it's to build a portfolio 
              of cash-flowing assets that appreciate over time."
            </p>
            <p>
              "Every deal we pursue must meet strict criteria: strong cash flow potential, significant 
              value-add opportunity, and the ability to refinance and retain the property for long-term 
              wealth building. This disciplined approach is what will get us to $1 billion in AUM 
              by 2050."
            </p>
            <p>
              "I'm not just building a real estate portfolio—I'm building a legacy. 5Central Capital 
              represents the intersection of aggressive growth and strategic patience, combining the 
              energy of youth with the wisdom of proven investment principles."
            </p>
          </div>
        </div>

        {/* Philosophy Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-primary" />
              Investment Philosophy
            </h3>
            <ul className="space-y-3 text-gray-700">
              <li>• Focus on cash-flowing multifamily properties</li>
              <li>• Target exceptional equity multiples through value-add strategies</li>
              <li>• Use strategic financing to maximize leverage</li>
              <li>• Refinance and hold for long-term appreciation</li>
              <li>• Reinvest profits to accelerate portfolio growth</li>
            </ul>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Target className="h-5 w-5 mr-2 text-primary" />
              Core Values
            </h3>
            <ul className="space-y-3 text-gray-700">
              <li>• Disciplined analysis and due diligence</li>
              <li>• Transparent communication with partners</li>
              <li>• Long-term wealth building over quick profits</li>
              <li>• Continuous learning and market adaptation</li>
              <li>• Building relationships, not just deals</li>
            </ul>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-12 bg-primary rounded-xl p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-4">Ready to Build Wealth Together?</h3>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Learn more about our ambitious vision and how we plan to reach $1 billion in AUM 
            through strategic multifamily investments.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/vision"
              className="bg-white text-primary px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              View Our Vision
            </a>
            <a
              href="/portfolio"
              className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary transition-colors"
            >
              See Current Portfolio
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Founder;