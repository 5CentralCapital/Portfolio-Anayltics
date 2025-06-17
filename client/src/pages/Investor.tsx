import React, { useState } from 'react';
import { Mail, AlertCircle, CheckCircle, Users, TrendingUp, Shield } from 'lucide-react';
import InvestmentCalculator from '../components/InvestmentCalculator';

const Investor = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && name) {
      // Store email in localStorage for now (in production, would send to backend)
      const existingEmails = JSON.parse(localStorage.getItem('investorEmails') || '[]');
      existingEmails.push({ name, email, date: new Date().toISOString() });
      localStorage.setItem('investorEmails', JSON.stringify(existingEmails));
      
      setSubmitted(true);
      setEmail('');
      setName('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 animate-fade-in">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Investor Opportunities
          </h1>
          <div className="inline-flex items-center px-4 py-2 bg-amber-100 text-amber-800 rounded-full text-sm font-medium mb-6">
            <AlertCircle className="h-4 w-4 mr-2" />
            Coming Soon
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            5Central Capital will soon be offering accredited investors the opportunity 
            to co-invest in select real estate deals. Join our investor list to be the 
            first to know about upcoming opportunities.
          </p>
        </div>

        {/* Investment Calculator Section */}
        <div className="mb-16">
          <InvestmentCalculator />
        </div>

        {/* Coming Soon Message */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Exclusive Investment Opportunities
            </h2>
            <p className="text-gray-600 leading-relaxed">
              We're currently developing our investor portal and preparing to offer 
              accredited investors the opportunity to participate in our high-return 
              multifamily deals. Our investment offerings will feature carefully 
              selected properties with strong fundamentals and significant upside potential.
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-primary rounded-lg mx-auto mb-3 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Exceptional Returns</h3>
              <p className="text-sm text-gray-600">
                Target returns based on our proven track record of 458.8% average cash-on-cash returns
              </p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-primary rounded-lg mx-auto mb-3 flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Experienced Team</h3>
              <p className="text-sm text-gray-600">
                Benefit from our deep market knowledge and proven track record across Florida and Connecticut
              </p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-primary rounded-lg mx-auto mb-3 flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Exclusive Access</h3>
              <p className="text-sm text-gray-600">
                Limited partnerships on hand-selected deals with institutional-quality due diligence
              </p>
            </div>
          </div>
        </div>

        {/* Email Signup */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-12">
          <div className="max-w-md mx-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-6 text-center flex items-center justify-center">
              <Mail className="h-5 w-5 mr-2 text-primary" />
              Join Our Investor List
            </h3>
            
            {submitted ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h4 className="font-semibold text-green-800 mb-1">Thank You!</h4>
                <p className="text-green-700 text-sm">
                  You've been added to our investor list. We'll notify you when opportunities become available.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-colors"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-colors"
                    placeholder="Enter your email address"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-primary text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-dark transition-colors transform hover:scale-105"
                >
                  Join Investor List
                </button>
              </form>
            )}

            <p className="text-xs text-gray-500 text-center mt-4">
              * Investment opportunities are limited to accredited investors only. 
              Past performance does not guarantee future results.
            </p>
          </div>
        </div>

        {/* What's Coming */}
        <div className="bg-primary rounded-xl p-8 text-white">
          <h3 className="text-2xl font-bold mb-6 text-center">What to Expect</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Investor Portal Features</h4>
              <ul className="space-y-2 text-blue-100">
                <li>• Private deal presentations and financial projections</li>
                <li>• Regular property updates and performance reports</li>
                <li>• Secure document sharing and investment tracking</li>
                <li>• Direct communication with the investment team</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Investment Structure</h4>
              <ul className="space-y-2 text-blue-100">
                <li>• Minimum investments starting at $50K-$100K</li>
                <li>• Quarterly distributions and annual reports</li>
                <li>• 3-5 year typical hold periods</li>
                <li>• Professional property management included</li>
              </ul>
            </div>
          </div>
          
          <div className="text-center mt-8">
            <p className="text-blue-100 mb-4">
              The investor portal is currently in development and will launch in early 2025.
            </p>
            <a
              href="/investor-portal"
              className="inline-flex items-center bg-white text-primary px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Preview Investor Portal
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Investor;