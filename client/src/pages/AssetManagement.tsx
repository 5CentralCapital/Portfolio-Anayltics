import React, { useState, useEffect } from 'react';
import {
  Building,
  TrendingUp,
  Home,
  BarChart3,
  Activity,
  MapPin,
  Target,
  DollarSign,
  Calendar,
  Percent,
  Edit3,
  Save,
  X
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Property {
  id: number;
  status: string;
  apartments: number;
  address: string;
  city: string;
  state: string;
  zipCode?: string;
  entity?: string;
  acquisitionDate?: string;
  acquisitionPrice: string;
  rehabCosts: string;
  arvAtTimePurchased?: string;
  initialCapitalRequired: string;
  cashFlow: string;
  salePrice?: string;
  salePoints?: string;
  totalProfits: string;
  yearsHeld?: string;
  cashOnCashReturn: string;
  annualizedReturn: string;
}

const entities = [
  '5Central Capital LLC',
  'Harmony Holdings LLC',
  'Crystal Properties LLC'
];

const AssetManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('balance-sheet');
  const [editingProperty, setEditingProperty] = useState<number | null>(null);
  const queryClient = useQueryClient();

  // Fetch properties from database
  const { data: propertiesData, isLoading } = useQuery({
    queryKey: ['/api/properties'],
    enabled: true
  });

  // Mutation for updating property entity
  const updatePropertyMutation = useMutation({
    mutationFn: async ({ id, entity }: { id: number; entity: string }) => {
      const response = await fetch(`/api/properties/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity })
      });
      if (!response.ok) throw new Error('Failed to update property');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      setEditingProperty(null);
    }
  });

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatPercentage = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return `${num.toFixed(1)}%`;
  };

  // Process properties data
  const properties: Property[] = Array.isArray(propertiesData) ? propertiesData : [];
  
  // Debug logging
  console.log('Properties data:', propertiesData);
  console.log('Properties array:', properties);
  console.log('Properties length:', properties.length);
  
  // Calculate portfolio metrics
  const metrics = {
    totalProperties: properties.length,
    totalUnits: properties.reduce((sum: number, prop: Property) => sum + prop.apartments, 0),
    totalAUM: properties.reduce((sum: number, prop: Property) => {
      const currentValue = prop.status === 'Currently Own' 
        ? parseFloat(prop.arvAtTimePurchased || prop.acquisitionPrice)
        : parseFloat(prop.salePrice || '0');
      return sum + currentValue;
    }, 0),
    totalEquity: properties.reduce((sum: number, prop: Property) => sum + parseFloat(prop.totalProfits), 0),
    totalMonthlyRent: properties
      .filter((prop: Property) => prop.status === 'Currently Own')
      .reduce((sum: number, prop: Property) => sum + parseFloat(prop.cashFlow), 0),
    avgCapRate: properties.length > 0 
      ? properties.reduce((sum: number, prop: Property) => sum + parseFloat(prop.cashOnCashReturn), 0) / properties.length 
      : 0
  };

  const handleEntityChange = (propertyId: number, newEntity: string) => {
    updatePropertyMutation.mutate({ id: propertyId, entity: newEntity });
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
      </div>

      {/* KPI Bar */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Profits</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(metrics.totalEquity)}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-red-600" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Monthly Cash Flow</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(metrics.totalMonthlyRent)}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center gap-2 mb-2">
            <Percent className="w-5 h-5 text-indigo-600" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg CoC Return</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatPercentage(metrics.avgCapRate)}</p>
        </div>
      </div>

      {/* Financial Statements Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'balance-sheet', label: 'Balance Sheet', icon: Building },
              { id: 'income-statement', label: 'Income Statement', icon: Activity },
              { id: 'cash-flow', label: 'Cash Flow Statement', icon: TrendingUp }
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
                  <span className="text-gray-600 dark:text-gray-400">Annual Cash Flow</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(metrics.totalMonthlyRent * 12)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Profits Realized</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(metrics.totalEquity)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span className="text-gray-900 dark:text-white">Net Income</span>
                  <span className="text-gray-900 dark:text-white">{formatCurrency(metrics.totalEquity + (metrics.totalMonthlyRent * 12))}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cash-flow' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Cash Flow Statement</h2>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Operating Activities (Annual)</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(metrics.totalMonthlyRent * 12)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Investment Activities</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(-properties.reduce((sum: number, prop: Property) => 
                      sum + parseFloat(prop.acquisitionPrice) + parseFloat(prop.rehabCosts), 0
                    ))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Financing Activities</span>
                  <span className="font-semibold text-gray-900 dark:text-white">$0</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span className="text-gray-900 dark:text-white">Net Cash Flow</span>
                  <span className="text-gray-900 dark:text-white">{formatCurrency(metrics.totalMonthlyRent * 12)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Property Portfolio Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Property Portfolio</h2>
            
            {properties.length === 0 ? (
              <div className="text-center py-12">
                <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No properties found</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {properties.map((property: Property) => (
                  <div key={property.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {property.address}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          {property.city}, {property.state} {property.zipCode || ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        {/* Entity Assignment Dropdown */}
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Entity:</label>
                          {editingProperty === property.id ? (
                            <div className="flex items-center gap-2">
                              <select
                                defaultValue={property.entity || '5Central Capital LLC'}
                                onChange={(e) => handleEntityChange(property.id, e.target.value)}
                                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              >
                                {entities.map((entity) => (
                                  <option key={entity} value={entity}>{entity}</option>
                                ))}
                              </select>
                              <button
                                onClick={() => setEditingProperty(null)}
                                className="p-1 text-gray-400 hover:text-gray-600"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {property.entity || '5Central Capital LLC'}
                              </span>
                              <button
                                onClick={() => setEditingProperty(property.id)}
                                className="p-1 text-gray-400 hover:text-gray-600"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                        
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          property.status === 'Currently Own' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                        }`}>
                          {property.status}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Units</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{property.apartments}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Acquisition Price</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(property.acquisitionPrice)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Rehab Costs</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(property.rehabCosts)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Cash Flow</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(property.cashFlow)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Total Profits</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(property.totalProfits)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">CoC Return</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{formatPercentage(property.cashOnCashReturn)}</p>
                      </div>
                    </div>

                    {property.acquisitionDate && (
                      <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                        <MapPin className="w-4 h-4 inline mr-1" />
                        Acquired: {new Date(property.acquisitionDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetManagement;