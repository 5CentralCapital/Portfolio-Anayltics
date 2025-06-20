import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit3,
  Save,
  X,
  Trash2,
  Calculator,
  DollarSign,
  Building,
  TrendingUp,
  Home,
  Target,
  PieChart,
  Download,
  Upload,
  Users,
  Percent,
  BarChart3,
  FileText,
  Activity,
  CreditCard,
  MapPin,
  Calendar,
  Briefcase
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface Property {
  id: number;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  units: number;
  purchasePrice: number;
  purchaseDate: string;
  rehabCosts: number;
  totalInvestment: number;
  currentValue: number;
  grossRent: number;
  netRent: number;
  expenses: number;
  noi: number;
  cashFlow: number;
  capRate: number;
  cocReturn: number;
  annualizedReturn: number;
  equityCreated: number;
  status: 'Active' | 'Sold' | 'Under Contract' | 'Rehab';
  entity?: string;
}

const PropertiesManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [properties, setProperties] = useState<Property[]>([]);

  // Fetch properties data
  const { data: propertiesData, isLoading } = useQuery({
    queryKey: ['/api/properties'],
    enabled: true
  });

  useEffect(() => {
    if (propertiesData && Array.isArray(propertiesData)) {
      setProperties(propertiesData);
    }
  }, [propertiesData]);

  // Calculate metrics
  const metrics = {
    totalProperties: properties.length,
    totalUnits: properties.reduce((sum, prop) => sum + prop.units, 0),
    totalAUM: properties.reduce((sum, prop) => sum + prop.currentValue, 0),
    totalEquity: properties.reduce((sum, prop) => sum + prop.equityCreated, 0),
    totalMonthlyRent: properties.reduce((sum, prop) => sum + prop.grossRent, 0),
    totalMonthlyCashFlow: properties.reduce((sum, prop) => sum + prop.cashFlow, 0),
    avgCapRate: properties.length > 0 ? properties.reduce((sum, prop) => sum + prop.capRate, 0) / properties.length : 0
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

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Asset Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Portfolio overview and property management</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Property
        </button>
      </div>

      {/* KPI Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center gap-2 mb-2">
            <Building className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Properties</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.totalProperties}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center gap-2 mb-2">
            <Home className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Units</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.totalUnits}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">AUM</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(metrics.totalAUM)}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-orange-600" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Equity</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(metrics.totalEquity)}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-red-600" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Monthly Rent</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(metrics.totalMonthlyRent)}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center gap-2 mb-2">
            <Percent className="w-5 h-5 text-indigo-600" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Cap Rate</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatPercentage(metrics.avgCapRate)}</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'balance-sheet', label: 'Balance Sheet', icon: FileText },
              { id: 'income-statement', label: 'Income Statement', icon: Activity },
              { id: 'cash-flow', label: 'Cash Flow Statement', icon: CreditCard }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Property Portfolio</h2>
              
              {properties.length === 0 ? (
                <div className="text-center py-12">
                  <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No properties found</p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {properties.map((property) => (
                    <div key={property.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {property.address}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400">
                            {property.city}, {property.state} {property.zipCode}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            property.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            property.status === 'Sold' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' :
                            property.status === 'Under Contract' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                            'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          }`}>
                            {property.status}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Units</p>
                          <p className="font-semibold text-gray-900 dark:text-white">{property.units}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Purchase Price</p>
                          <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(property.purchasePrice)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Current Value</p>
                          <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(property.currentValue)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Monthly Rent</p>
                          <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(property.grossRent)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Cash Flow</p>
                          <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(property.cashFlow)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Cap Rate</p>
                          <p className="font-semibold text-gray-900 dark:text-white">{formatPercentage(property.capRate)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'balance-sheet' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Balance Sheet</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Assets</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Real Estate Portfolio</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(metrics.totalAUM)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Cash & Equivalents</span>
                      <span className="font-semibold text-gray-900 dark:text-white">$0</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-semibold">
                      <span className="text-gray-900 dark:text-white">Total Assets</span>
                      <span className="text-gray-900 dark:text-white">{formatCurrency(metrics.totalAUM)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Liabilities & Equity</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Mortgage Debt</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(metrics.totalAUM - metrics.totalEquity)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Owner's Equity</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(metrics.totalEquity)}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-semibold">
                      <span className="text-gray-900 dark:text-white">Total Liabilities & Equity</span>
                      <span className="text-gray-900 dark:text-white">{formatCurrency(metrics.totalAUM)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'income-statement' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Income Statement</h2>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Rental Income</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(metrics.totalMonthlyRent * 12)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Operating Expenses</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency((metrics.totalMonthlyRent - metrics.totalMonthlyCashFlow) * 12)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span className="text-gray-900 dark:text-white">Net Operating Income</span>
                  <span className="text-gray-900 dark:text-white">{formatCurrency(metrics.totalMonthlyCashFlow * 12)}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cash-flow' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Cash Flow Statement</h2>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Operating Activities</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(metrics.totalMonthlyCashFlow * 12)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Investing Activities</span>
                  <span className="font-semibold text-gray-900 dark:text-white">$0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Financing Activities</span>
                  <span className="font-semibold text-gray-900 dark:text-white">$0</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span className="text-gray-900 dark:text-white">Net Cash Flow</span>
                  <span className="text-gray-900 dark:text-white">{formatCurrency(metrics.totalMonthlyCashFlow * 12)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertiesManager;