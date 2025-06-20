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
import apiService from '../services/api';

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
  '5Central Capital',
  'The House Doctors',
  'Arcadia Vision Group'
];

const AssetManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('balance-sheet');
  const [editingProperty, setEditingProperty] = useState<number | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const queryClient = useQueryClient();

  // Fetch properties from database using authenticated API
  const { data: propertiesData, isLoading } = useQuery({
    queryKey: ['/api/properties'],
    queryFn: () => apiService.getProperties(),
    enabled: true
  });

  // Mutation for updating property entity
  const updatePropertyMutation = useMutation({
    mutationFn: async ({ id, entity }: { id: number; entity: string }) => {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/properties/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
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

  // Process properties data - handle both direct array and wrapped data structure
  const properties: Property[] = Array.isArray(propertiesData?.data) ? propertiesData.data : 
    Array.isArray(propertiesData) ? propertiesData : [];
  
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

  const handlePropertyDoubleClick = (property: Property) => {
    setSelectedProperty(property);
  };

  const closePropertyModal = () => {
    setSelectedProperty(null);
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

      {/* KPI Bar - Deal Analyzer Style */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-900 dark:text-white">
          <BarChart3 className="h-5 w-5 mr-2" />
          Portfolio Key Metrics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-orange-50 dark:bg-orange-900 p-4 rounded-lg">
            <label className="text-sm text-orange-900 dark:text-orange-100 font-medium">Properties</label>
            <p className="text-lg font-semibold text-orange-900 dark:text-orange-100">{metrics.totalProperties}</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900 p-4 rounded-lg">
            <label className="text-sm text-purple-900 dark:text-purple-100 font-medium">Units</label>
            <p className="text-lg font-semibold text-purple-900 dark:text-purple-100">{metrics.totalUnits}</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
            <label className="text-sm text-blue-900 dark:text-blue-100 font-medium">AUM</label>
            <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">{formatCurrency(metrics.totalAUM)}</p>
          </div>
          <div className={`p-4 rounded-lg ${
            metrics.totalEquity > 0 ? "bg-green-50 dark:bg-green-900" : "bg-red-50 dark:bg-red-900"
          }`}>
            <label className={`text-sm font-medium ${
              metrics.totalEquity > 0 ? "text-green-900 dark:text-green-100" : "text-red-900 dark:text-red-100"
            }`}>Total Profits</label>
            <p className={`text-lg font-semibold ${
              metrics.totalEquity > 0 ? "text-green-900 dark:text-green-100" : "text-red-900 dark:text-red-100"
            }`}>{formatCurrency(metrics.totalEquity)}</p>
          </div>
          <div className={`p-4 rounded-lg ${
            metrics.totalMonthlyRent > 0 ? "bg-emerald-50 dark:bg-emerald-900" : "bg-red-50 dark:bg-red-900"
          }`}>
            <label className={`text-sm font-medium ${
              metrics.totalMonthlyRent > 0 ? "text-emerald-900 dark:text-emerald-100" : "text-red-900 dark:text-red-100"
            }`}>Monthly Cash Flow</label>
            <p className={`text-lg font-semibold ${
              metrics.totalMonthlyRent > 0 ? "text-emerald-900 dark:text-emerald-100" : "text-red-900 dark:text-red-100"
            }`}>{formatCurrency(metrics.totalMonthlyRent)}</p>
          </div>
          <div className="bg-indigo-50 dark:bg-indigo-900 p-4 rounded-lg">
            <label className="text-sm text-indigo-900 dark:text-indigo-100 font-medium">Avg CoC Return</label>
            <p className="text-lg font-semibold text-indigo-900 dark:text-indigo-100">{formatPercentage(metrics.avgCapRate)}</p>
          </div>
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
      <div className="space-y-8">
        {/* Active Properties Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Active Properties</h2>
            
            {properties.filter(p => p.status === 'Currently Own').length === 0 ? (
              <div className="text-center py-12">
                <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No active properties found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {properties.filter(p => p.status === 'Currently Own').map((property: Property) => (
                  <div 
                    key={property.id} 
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 w-full cursor-pointer hover:shadow-lg transition-shadow"
                    onDoubleClick={() => handlePropertyDoubleClick(property)}
                    title="Double-click to view full property details"
                  >
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
                                defaultValue={property.entity || '5Central Capital'}
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
                                {property.entity || '5Central Capital'}
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
                        
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
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
                        <p className="text-gray-600 dark:text-gray-400">Monthly Cash Flow</p>
                        <p className="font-semibold text-green-600">{formatCurrency(property.cashFlow)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Total Profits</p>
                        <p className="font-semibold text-green-600">{formatCurrency(property.totalProfits)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">CoC Return</p>
                        <p className="font-semibold text-blue-600">{formatPercentage(property.cashOnCashReturn)}</p>
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

        {/* Sold Properties Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Sold Properties</h2>
            
            {properties.filter(p => p.status === 'Sold').length === 0 ? (
              <div className="text-center py-12">
                <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No sold properties found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.filter(p => p.status === 'Sold').map((property: Property) => (
                  <div 
                    key={property.id} 
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 aspect-square flex flex-col cursor-pointer hover:shadow-lg transition-shadow"
                    onDoubleClick={() => handlePropertyDoubleClick(property)}
                    title="Double-click to view full property details"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-md font-semibold text-gray-900 dark:text-white truncate">
                          {property.address}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {property.city}, {property.state}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {/* Entity Assignment Dropdown */}
                        {editingProperty === property.id ? (
                          <div className="flex items-center gap-1">
                            <select
                              defaultValue={property.entity || '5Central Capital'}
                              onChange={(e) => handleEntityChange(property.id, e.target.value)}
                              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                              {entities.map((entity) => (
                                <option key={entity} value={entity}>{entity}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => setEditingProperty(null)}
                              className="p-1 text-gray-400 hover:text-gray-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                              {property.entity || '5Central Capital'}
                            </span>
                            <button
                              onClick={() => setEditingProperty(property.id)}
                              className="p-1 text-gray-400 hover:text-gray-600"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                          {property.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Units</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{property.apartments}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Purchase</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(property.acquisitionPrice)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Sale Price</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(property.salePrice || '0')}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Total Profit</p>
                        <p className="font-semibold text-green-600">{formatCurrency(property.totalProfits)}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-gray-600 dark:text-gray-400">CoC Return</p>
                        <p className="font-semibold text-blue-600">{formatPercentage(property.cashOnCashReturn)}</p>
                      </div>
                    </div>

                    {property.acquisitionDate && (
                      <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                        <MapPin className="w-3 h-3 inline mr-1" />
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

      {/* Property Detail Modal */}
      {selectedProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {selectedProperty.address}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {selectedProperty.city}, {selectedProperty.state} {selectedProperty.zipCode || ''}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  selectedProperty.status === 'Currently Own' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                }`}>
                  {selectedProperty.status}
                </span>
                <button
                  onClick={closePropertyModal}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Basic Information */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Property Details</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                        <p className="text-gray-600 dark:text-gray-400">Units</p>
                        <p className="font-semibold text-gray-900 dark:text-white text-lg">{selectedProperty.apartments}</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                        <p className="text-gray-600 dark:text-gray-400">Entity</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{selectedProperty.entity || '5Central Capital'}</p>
                      </div>
                      {selectedProperty.acquisitionDate && (
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          <p className="text-gray-600 dark:text-gray-400">Acquisition Date</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {new Date(selectedProperty.acquisitionDate).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      {selectedProperty.yearsHeld && (
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          <p className="text-gray-600 dark:text-gray-400">Years Held</p>
                          <p className="font-semibold text-gray-900 dark:text-white">{selectedProperty.yearsHeld}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Financial Summary */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Financial Summary</h3>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-blue-700 dark:text-blue-300 text-sm">Acquisition Price</p>
                        <p className="font-bold text-blue-900 dark:text-blue-100 text-xl">{formatCurrency(selectedProperty.acquisitionPrice)}</p>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                        <p className="text-purple-700 dark:text-purple-300 text-sm">Rehab Costs</p>
                        <p className="font-bold text-purple-900 dark:text-purple-100 text-xl">{formatCurrency(selectedProperty.rehabCosts)}</p>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                        <p className="text-green-700 dark:text-green-300 text-sm">
                          {selectedProperty.status === 'Currently Own' ? 'Monthly Cash Flow' : 'Total Profits'}
                        </p>
                        <p className="font-bold text-green-900 dark:text-green-100 text-xl">
                          {selectedProperty.status === 'Currently Own' 
                            ? formatCurrency(selectedProperty.cashFlow)
                            : formatCurrency(selectedProperty.totalProfits)
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Investment Metrics */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Investment Metrics</h3>
                    <div className="space-y-3">
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Initial Capital Required</p>
                        <p className="font-semibold text-gray-900 dark:text-white text-lg">{formatCurrency(selectedProperty.initialCapitalRequired)}</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <p className="text-gray-600 dark:text-gray-400 text-sm">Cash-on-Cash Return</p>
                        <p className="font-semibold text-blue-600 text-lg">{formatPercentage(selectedProperty.cashOnCashReturn)}</p>
                      </div>
                      {selectedProperty.annualizedReturn && (
                        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                          <p className="text-gray-600 dark:text-gray-400 text-sm">Annualized Return</p>
                          <p className="font-semibold text-blue-600 text-lg">{formatPercentage(selectedProperty.annualizedReturn)}</p>
                        </div>
                      )}
                      {selectedProperty.arvAtTimePurchased && (
                        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                          <p className="text-gray-600 dark:text-gray-400 text-sm">ARV at Purchase</p>
                          <p className="font-semibold text-gray-900 dark:text-white text-lg">{formatCurrency(selectedProperty.arvAtTimePurchased)}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sale Information (if sold) */}
                  {selectedProperty.status === 'Sold' && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sale Information</h3>
                      <div className="space-y-3">
                        {selectedProperty.salePrice && (
                          <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                            <p className="text-orange-700 dark:text-orange-300 text-sm">Sale Price</p>
                            <p className="font-bold text-orange-900 dark:text-orange-100 text-xl">{formatCurrency(selectedProperty.salePrice)}</p>
                          </div>
                        )}
                        {selectedProperty.salePoints && (
                          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                            <p className="text-gray-600 dark:text-gray-400 text-sm">Sale Points</p>
                            <p className="font-semibold text-gray-900 dark:text-white text-lg">{formatCurrency(selectedProperty.salePoints)}</p>
                          </div>
                        )}
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg border border-emerald-200 dark:border-emerald-800">
                          <p className="text-emerald-700 dark:text-emerald-300 text-sm">Total Profits</p>
                          <p className="font-bold text-emerald-900 dark:text-emerald-100 text-xl">{formatCurrency(selectedProperty.totalProfits)}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Performance Summary */}
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800">
                    <h4 className="text-indigo-900 dark:text-indigo-100 font-semibold mb-2">Performance Summary</h4>
                    <div className="text-sm text-indigo-700 dark:text-indigo-300">
                      <p>• {selectedProperty.apartments} unit property in {selectedProperty.city}, {selectedProperty.state}</p>
                      <p>• Total investment: {formatCurrency((parseFloat(selectedProperty.acquisitionPrice) + parseFloat(selectedProperty.rehabCosts)).toString())}</p>
                      <p>• Current status: {selectedProperty.status}</p>
                      {selectedProperty.status === 'Currently Own' ? (
                        <p>• Generating {formatCurrency(selectedProperty.cashFlow)} monthly cash flow</p>
                      ) : (
                        <p>• Realized {formatCurrency(selectedProperty.totalProfits)} in total profits</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={closePropertyModal}
                className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetManagement;