import React, { useState } from 'react';
import { Lock, Eye, EyeOff, AlertTriangle, Settings, BarChart3, FileText, Users } from 'lucide-react';

const InvestorPortal = () => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // This is just a demo - in production, you'd validate against a real backend
    if (password === 'demo') {
      setIsAuthenticated(true);
    } else {
      alert('This is a demo portal. Use "demo" as the password or contact us for access.');
    }
  };

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-amber-600 mr-2" />
              <p className="text-amber-800 text-sm">
                <strong>Demo Mode:</strong> This is a preview of the investor portal. 
                Real functionality will be available when the portal launches.
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Investor Dashboard</h1>
            <button
              onClick={() => setIsAuthenticated(false)}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Logout
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Invested</p>
                  <p className="text-2xl font-bold text-gray-900">$250,000</p>
                </div>
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Current Value</p>
                  <p className="text-2xl font-bold text-green-600">$312,500</p>
                </div>
                <BarChart3 className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Distributions</p>
                  <p className="text-2xl font-bold text-blue-600">$45,750</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">IRR</p>
                  <p className="text-2xl font-bold text-purple-600">24.5%</p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b">
                  <h2 className="text-lg font-semibold text-gray-900">Active Investments</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900">Riverside Commons</h3>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Active</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">24 Units • Tampa, FL</p>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Your Investment</p>
                          <p className="font-semibold">$100,000</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Current Value</p>
                          <p className="font-semibold text-green-600">$125,000</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Distributions</p>
                          <p className="font-semibold">$18,500</p>
                        </div>
                      </div>
                    </div>
                    <div className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900">Sunset Gardens</h3>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Active</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">16 Units • St. Petersburg, FL</p>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Your Investment</p>
                          <p className="font-semibold">$150,000</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Current Value</p>
                          <p className="font-semibold text-green-600">$187,500</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Distributions</p>
                          <p className="font-semibold">$27,250</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Recent Updates
                  </h2>
                </div>
                <div className="p-6">
                  <div className="space-y-3 text-sm">
                    <div className="border-l-4 border-primary pl-3">
                      <p className="font-medium">Q4 2024 Report Available</p>
                      <p className="text-gray-600">Riverside Commons</p>
                    </div>
                    <div className="border-l-4 border-green-500 pl-3">
                      <p className="font-medium">Distribution Processed</p>
                      <p className="text-gray-600">$7,250 deposited</p>
                    </div>
                    <div className="border-l-4 border-blue-500 pl-3">
                      <p className="font-medium">Property Update</p>
                      <p className="text-gray-600">Renovation 75% complete</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Quick Actions
                  </h2>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    <button className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                      <p className="font-medium text-sm">Download Tax Documents</p>
                      <p className="text-xs text-gray-600">K-1s and annual statements</p>
                    </button>
                    <button className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                      <p className="font-medium text-sm">Schedule Call</p>
                      <p className="text-xs text-gray-600">Meet with investment team</p>
                    </button>
                    <button className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                      <p className="font-medium text-sm">Update Profile</p>
                      <p className="text-xs text-gray-600">Contact info and preferences</p>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 animate-fade-in">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Investor Portal</h1>
            <p className="text-gray-600">
              Access your private investment dashboard and property updates
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-amber-600 mr-2 mt-0.5" />
              <div className="text-amber-800 text-sm">
                <p className="font-semibold mb-1">Portal in Development</p>
                <p>
                  This is a preview of our upcoming investor portal. The full platform 
                  will launch in early 2025 with real-time investment tracking, 
                  detailed property reports, and secure document access.
                </p>
                <p className="mt-2 text-xs">
                  <strong>Demo Access:</strong> Use "demo" as the password to preview the interface.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Access Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-colors"
                  placeholder="Enter portal password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            
            <button
              type="submit"
              className="w-full bg-primary text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-dark transition-colors transform hover:scale-105"
            >
              Access Portal
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Need access?{' '}
              <a href="/investor" className="text-primary hover:text-primary-dark font-medium">
                Join our investor list
              </a>
            </p>
          </div>

          <div className="mt-8 border-t pt-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
              <Settings className="h-4 w-4 mr-1" />
              Coming Soon Features
            </h3>
            <ul className="space-y-2 text-xs text-gray-600">
              <li>• Real-time investment performance tracking</li>
              <li>• Quarterly and annual financial reports</li>
              <li>• Property photos and renovation updates</li>
              <li>• Distribution history and tax documents</li>
              <li>• Direct messaging with investment team</li>
              <li>• New deal presentations and offerings</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestorPortal;