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
  X,
  Calculator,
  FileText,
  Wrench,
  CheckCircle
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

const PropertyCard = ({ property, onStatusChange }: { property: Property; onStatusChange: (id: number, status: string) => void }) => (
  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 w-full cursor-pointer hover:shadow-lg transition-shadow">
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{property.address}</h3>
        <p className="text-gray-600 dark:text-gray-400">{property.city}, {property.state} {property.zipCode || ''}</p>
      </div>
      <div className="flex items-center gap-4">
        <select 
          value={property.status} 
          onChange={(e) => onStatusChange(property.id, e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
        >
          <option value="Under Contract">Under Contract</option>
          <option value="Rehabbing">Rehabbing</option>
          <option value="Cashflowing">Cashflowing</option>
          <option value="Sold">Sold</option>
        </select>
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
        <p className="text-gray-600 dark:text-gray-400">ARV</p>
        <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(property.arvAtTimePurchased || 0)}</p>
      </div>
      <div>
        <p className="text-gray-600 dark:text-gray-400">Monthly Cash Flow</p>
        <p className="font-semibold text-green-600">{formatCurrency(property.cashFlow)}</p>
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
);

const SoldPropertyCard = ({ property, onStatusChange }: { property: Property; onStatusChange: (id: number, status: string) => void }) => (
  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 aspect-square flex flex-col cursor-pointer card-hover transition-all-smooth">
    <div className="flex items-center justify-between mb-3">
      <div className="flex-1 min-w-0">
        <h3 className="text-md font-semibold text-gray-900 dark:text-white truncate">{property.address}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{property.city}, {property.state}</p>
      </div>
      <select 
        value={property.status} 
        onChange={(e) => onStatusChange(property.id, e.target.value)}
        className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors-smooth hover:border-blue-400"
      >
        <option value="Under Contract">Under Contract</option>
        <option value="Rehabbing">Rehabbing</option>
        <option value="Cashflowing">Cashflowing</option>
        <option value="Sold">Sold</option>
      </select>
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
    </div>
  </div>
);

// Helper functions
const formatCurrency = (amount: string | number) => {
  const num = typeof amount === 'string' ? parseFloat(amount.replace(/[^0-9.-]/g, '')) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

const formatPercentage = (value: string | number) => {
  const num = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) : value;
  return `${num.toFixed(1)}%`;
};

export default function AssetManagement() {
  const queryClient = useQueryClient();
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [activeTab, setActiveTab] = useState('balance-sheet');
  const [editingProperty, setEditingProperty] = useState<number | null>(null);
  const [statusChangeModal, setStatusChangeModal] = useState<{
    property: Property;
    newStatus: string;
  } | null>(null);
  const [editingPropertyData, setEditingPropertyData] = useState<Property | null>(null);

  const { data: propertiesResponse, isLoading, error } = useQuery({
    queryKey: ['/api/properties'],
    queryFn: () => apiService.getProperties()
  });

  // Ensure properties is always an array
  const properties = (() => {
    if (!propertiesResponse) return [];
    if (Array.isArray(propertiesResponse)) return propertiesResponse;
    if (propertiesResponse.data && Array.isArray(propertiesResponse.data)) return propertiesResponse.data;
    return [];
  })();

  const updatePropertyMutation = useMutation({
    mutationFn: async (data: { id: number; property: Partial<Property> }) => {
      return await apiService.updateProperty(data.id, data.property);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
    }
  });

  const handleStatusChange = (id: number, status: string) => {
    const property = properties.find(p => p.id === id);
    if (property) {
      setStatusChangeModal({ property, newStatus: status });
      setEditingPropertyData({ ...property, status });
    }
  };

  const confirmStatusChange = () => {
    if (statusChangeModal && editingPropertyData) {
      updatePropertyMutation.mutate({ 
        id: editingPropertyData.id, 
        property: editingPropertyData 
      });
      setStatusChangeModal(null);
      setEditingPropertyData(null);
    }
  };

  const cancelStatusChange = () => {
    setStatusChangeModal(null);
    setEditingPropertyData(null);
  };

  const updateEditingPropertyData = (field: string, value: any) => {
    if (editingPropertyData) {
      setEditingPropertyData({
        ...editingPropertyData,
        [field]: value
      });
    }
  };

  const handlePropertyDoubleClick = (property: Property) => {
    setSelectedProperty(property);
  };

  const closePropertyModal = () => {
    setSelectedProperty(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Error Loading Properties</h2>
          <p className="text-gray-600 dark:text-gray-400">Please try refreshing the page</p>
          <p className="text-sm text-red-500 mt-2">{error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      </div>
    );
  }

  // Add defensive check for empty properties
  if (!properties || properties.length === 0) {
    return (
      <div className="space-y-6">
        {/* KPI Bar with zero values */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-500 via-purple-500 to-purple-600 rounded-lg shadow-lg border border-blue-200 p-6">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center">
              <Calculator className="h-6 w-6 mr-3" />
              <span className="text-lg font-semibold">Portfolio Performance</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mt-4">
            <div className="text-center border-r border-white/20 last:border-r-0 pr-6 last:pr-0">
              <div className="text-2xl font-bold text-white">0</div>
              <div className="text-sm text-white/80">Total Units</div>
            </div>
            <div className="text-center border-r border-white/20 last:border-r-0 pr-6 last:pr-0">
              <div className="text-2xl font-bold text-white">$0</div>
              <div className="text-sm text-white/80">Total AUM</div>
            </div>
            <div className="text-center border-r border-white/20 last:border-r-0 pr-6 last:pr-0">
              <div className="text-2xl font-bold text-white">$0</div>
              <div className="text-sm text-white/80">Price/Unit</div>
            </div>
            <div className="text-center border-r border-white/20 last:border-r-0 pr-6 last:pr-0">
              <div className="text-2xl font-bold text-white">$0</div>
              <div className="text-sm text-white/80">Total Equity</div>
            </div>
            <div className="text-center border-r border-white/20 last:border-r-0 pr-6 last:pr-0">
              <div className="text-2xl font-bold text-white">$0</div>
              <div className="text-sm text-white/80">Monthly Cash Flow</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">0.0%</div>
              <div className="text-sm text-white/80">Avg CoC Return</div>
            </div>
          </div>
        </div>

        <div className="text-center py-12">
          <Building className="mx-auto h-16 w-16 text-gray-400" />
          <h3 className="mt-4 text-xl font-medium text-gray-900 dark:text-white">No Properties Found</h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Your property portfolio will appear here once properties are added</p>
        </div>
      </div>
    );
  }

  // Calculate metrics with safe operations
  const metrics = {
    totalUnits: Array.isArray(properties) ? properties.reduce((sum: number, prop: Property) => sum + (prop.apartments || 0), 0) : 0,
    totalAUM: Array.isArray(properties) ? properties.reduce((sum: number, prop: Property) => {
      const acquisition = parseFloat((prop.acquisitionPrice || '0').toString().replace(/[^0-9.-]/g, ''));
      const rehab = parseFloat((prop.rehabCosts || '0').toString().replace(/[^0-9.-]/g, ''));
      return sum + (isNaN(acquisition) ? 0 : acquisition) + (isNaN(rehab) ? 0 : rehab);
    }, 0) : 0,
    totalEquity: Array.isArray(properties) ? properties.reduce((sum: number, prop: Property) => {
      const profits = parseFloat((prop.totalProfits || '0').toString().replace(/[^0-9.-]/g, ''));
      return sum + (isNaN(profits) ? 0 : profits);
    }, 0) : 0,
    totalCashFlow: Array.isArray(properties) ? properties
      .filter((prop: Property) => prop.status === 'Cashflowing')
      .reduce((sum: number, prop: Property) => {
        const cashFlow = parseFloat((prop.cashFlow || '0').toString().replace(/[^0-9.-]/g, ''));
        return sum + (isNaN(cashFlow) ? 0 : cashFlow);
      }, 0) : 0,
    avgCoCReturn: Array.isArray(properties) && properties.length > 0 
      ? properties.reduce((sum: number, prop: Property) => {
          const cocReturn = parseFloat((prop.cashOnCashReturn || '0').toString().replace(/[^0-9.-]/g, ''));
          return sum + (isNaN(cocReturn) ? 0 : cocReturn);
        }, 0) / properties.length 
      : 0,
    pricePerUnit: (() => {
      if (!Array.isArray(properties) || properties.length === 0) return 0;
      const totalValue = properties.reduce((sum: number, prop: Property) => {
        const acquisition = parseFloat((prop.acquisitionPrice || '0').toString().replace(/[^0-9.-]/g, ''));
        const rehab = parseFloat((prop.rehabCosts || '0').toString().replace(/[^0-9.-]/g, ''));
        return sum + (isNaN(acquisition) ? 0 : acquisition) + (isNaN(rehab) ? 0 : rehab);
      }, 0);
      const totalUnits = properties.reduce((sum: number, prop: Property) => sum + (prop.apartments || 0), 0);
      return totalUnits > 0 ? totalValue / totalUnits : 0;
    })()
  };

  return (
    <div className="space-y-6">
      {/* KPI Bar with Continuous Gradient Design */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-500 via-purple-500 to-purple-600 rounded-lg shadow-lg border border-blue-200 p-6 fade-in hover-glow transition-all-smooth">
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center">
            <Calculator className="h-6 w-6 mr-3 icon-bounce" />
            <span className="text-lg font-semibold">Portfolio Performance</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mt-4 stagger-children">
          <div className="text-center border-r border-white/20 last:border-r-0 pr-6 last:pr-0 hover-scale transition-transform-smooth cursor-pointer">
            <div className="text-2xl font-bold text-white">{metrics.totalUnits}</div>
            <div className="text-sm text-white/80">Total Units</div>
          </div>
          <div className="text-center border-r border-white/20 last:border-r-0 pr-6 last:pr-0 hover-scale transition-transform-smooth cursor-pointer">
            <div className="text-2xl font-bold text-white">{formatCurrency(metrics.totalAUM)}</div>
            <div className="text-sm text-white/80">Total AUM</div>
          </div>
          <div className="text-center border-r border-white/20 last:border-r-0 pr-6 last:pr-0 hover-scale transition-transform-smooth cursor-pointer">
            <div className="text-2xl font-bold text-white">{formatCurrency(metrics.pricePerUnit)}</div>
            <div className="text-sm text-white/80">Price/Unit</div>
          </div>
          <div className="text-center border-r border-white/20 last:border-r-0 pr-6 last:pr-0">
            <div className="text-2xl font-bold text-white">{formatCurrency(metrics.totalEquity)}</div>
            <div className="text-sm text-white/80">Total Equity</div>
          </div>
          <div className="text-center border-r border-white/20 last:border-r-0 pr-6 last:pr-0">
            <div className="text-2xl font-bold text-white">{formatCurrency(metrics.totalCashFlow)}</div>
            <div className="text-sm text-white/80">Monthly Cash Flow</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{formatPercentage(metrics.avgCoCReturn)}</div>
            <div className="text-sm text-white/80">Avg CoC Return</div>
          </div>
        </div>
      </div>

      {/* Financial Statements */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {[
              { id: 'balance-sheet', name: 'Balance Sheet' },
              { id: 'income-statement', name: 'Income Statement' },
              { id: 'cash-flow', name: 'Cash Flow Statement' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'balance-sheet' && (
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Assets</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Real Estate Properties</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(metrics.totalAUM)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Cash & Cash Equivalents</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(75000)}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between">
                    <span className="font-semibold text-gray-900 dark:text-white">Total Assets</span>
                    <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(metrics.totalAUM + 75000)}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Liabilities & Equity</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Mortgages Payable</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(metrics.totalAUM * 0.7)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Owner's Equity</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency((metrics.totalAUM * 0.3) + 75000)}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between">
                    <span className="font-semibold text-gray-900 dark:text-white">Total Liabilities & Equity</span>
                    <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(metrics.totalAUM + 75000)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'income-statement' && (
            <div className="max-w-2xl">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Income Statement</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Gross Rental Income</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(metrics.totalCashFlow * 1.15)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Operating Expenses</span>
                  <span className="font-semibold text-red-600">{formatCurrency(-metrics.totalCashFlow * 0.15)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="font-semibold text-gray-900 dark:text-white">Net Operating Income</span>
                  <span className="font-bold text-green-600">{formatCurrency(metrics.totalCashFlow)}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cash-flow' && (
            <div className="max-w-2xl">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Cash Flow</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Operating Cash Flow</span>
                  <span className="font-semibold text-green-600">{formatCurrency(metrics.totalCashFlow)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Capital Expenditures</span>
                  <span className="font-semibold text-red-600">{formatCurrency(-5000)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="font-semibold text-gray-900 dark:text-white">Net Cash Flow</span>
                  <span className="font-bold text-green-600">{formatCurrency(metrics.totalCashFlow - 5000)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Property Portfolio Sections */}
      <div className="space-y-6">
        {/* Under Contract - Compact Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 fade-in card-hover">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-4">
            <FileText className="h-5 w-5 mr-2 text-orange-500 icon-bounce" />
            Under Contract ({properties.filter((p: Property) => p.status === 'Under Contract').length})
          </h2>
          
          {properties.filter((p: Property) => p.status === 'Under Contract').length > 0 ? (
            <div className="space-y-3 stagger-children">
              {properties.filter((p: Property) => p.status === 'Under Contract').map((property: Property) => (
                <div key={property.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover-scale transition-all-smooth card-hover cursor-pointer">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{property.address}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{property.city}, {property.state}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Purchase Price</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(property.acquisitionPrice)}</p>
                      </div>
                      <select 
                        value={property.status} 
                        onChange={(e) => handleStatusChange(property.id, e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm transition-all-smooth hover:border-blue-400 hover-scale"
                      >
                        <option value="Under Contract">Under Contract</option>
                        <option value="Rehabbing">Rehabbing</option>
                        <option value="Cashflowing">Cashflowing</option>
                        <option value="Sold">Sold</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="mx-auto h-8 w-8 text-gray-400" />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">No properties under contract</p>
            </div>
          )}
        </div>

        {/* Rehabbing - Side by Side with Progress Tracking */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 fade-in card-hover">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-6">
            <Wrench className="h-5 w-5 mr-2 text-blue-500 icon-bounce" />
            Rehabbing ({properties.filter((p: Property) => p.status === 'Rehabbing').length})
          </h2>
          
          {properties.filter((p: Property) => p.status === 'Rehabbing').length > 0 ? (
            <div className="space-y-6 stagger-children">
              {properties.filter((p: Property) => p.status === 'Rehabbing').map((property: Property) => {
                const rehabBudget = parseFloat(property.rehabCosts);
                const rehabSpent = rehabBudget * 0.65; // Mock 65% completion
                const rehabProgress = (rehabSpent / rehabBudget) * 100;
                
                return (
                  <div key={property.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover-scale transition-all-smooth card-hover cursor-pointer">
                    <div className="grid md:grid-cols-2 gap-8">
                      {/* Left Side - Property Details */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{property.address}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{property.city}, {property.state}</p>
                            <div className="mt-2">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                {property.entity}
                              </span>
                            </div>
                          </div>
                          <select 
                            value={property.status} 
                            onChange={(e) => handleStatusChange(property.id, e.target.value)}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                          >
                            <option value="Under Contract">Under Contract</option>
                            <option value="Rehabbing">Rehabbing</option>
                            <option value="Cashflowing">Cashflowing</option>
                            <option value="Sold">Sold</option>
                          </select>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Units</p>
                            <p className="font-semibold text-gray-900 dark:text-white">{property.apartments}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Purchase Price</p>
                            <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(property.acquisitionPrice)}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">ARV</p>
                            <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(property.arvAtTimePurchased || 0)}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Initial Capital</p>
                            <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(property.initialCapitalRequired)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Right Side - Progress Tracking */}
                      <div className="space-y-6">
                        {/* Rehab Progress */}
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="text-lg font-medium text-gray-900 dark:text-white">Rehab Progress</h4>
                            <span className="text-lg font-semibold text-gray-600 dark:text-gray-400">{rehabProgress.toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-purple-600 h-4 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(rehabProgress, 100)}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-2">
                            <span>Started</span>
                            <span>In Progress</span>
                            <span>Complete</span>
                          </div>
                        </div>

                        {/* Budget Tracking */}
                        <div>
                          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Budget Tracking</h4>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Total Budget</span>
                              <span className="text-lg font-bold text-blue-900 dark:text-blue-100">{formatCurrency(rehabBudget)}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                              <span className="text-sm font-medium text-red-900 dark:text-red-100">Spent to Date</span>
                              <span className="text-lg font-bold text-red-900 dark:text-red-100">{formatCurrency(rehabSpent)}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                              <span className="text-sm font-medium text-green-900 dark:text-green-100">Remaining</span>
                              <span className="text-lg font-bold text-green-900 dark:text-green-100">{formatCurrency(rehabBudget - rehabSpent)}</span>
                            </div>
                            
                            {/* Budget Progress Bar */}
                            <div className="mt-4">
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                                <div 
                                  className={`h-3 rounded-full transition-all duration-300 ${
                                    rehabProgress > 90 ? 'bg-red-500' : rehabProgress > 75 ? 'bg-yellow-500' : 'bg-green-500'
                                  }`}
                                  style={{ width: `${Math.min(rehabProgress, 100)}%` }}
                                ></div>
                              </div>
                              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                                <span>$0</span>
                                <span>{formatCurrency(rehabBudget)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Status Indicator */}
                        <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Active Renovation</span>
                          </div>
                          <span className="text-sm text-blue-600 dark:text-blue-300 font-medium">On Track</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Wrench className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No Properties in Rehab</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Properties undergoing renovation will appear here</p>
            </div>
          )}
        </div>

        {/* Cashflowing Properties */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 fade-in card-hover">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-6">
            <DollarSign className="h-5 w-5 mr-2 text-green-500 icon-bounce" />
            Cashflowing ({properties.filter((p: Property) => p.status === 'Cashflowing').length})
          </h2>
          
          {properties.filter((p: Property) => p.status === 'Cashflowing').length > 0 ? (
            <div className="grid gap-4 stagger-children">
              {properties.filter((p: Property) => p.status === 'Cashflowing').map((property: Property) => (
                <PropertyCard key={property.id} property={property} onStatusChange={handleStatusChange} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No Cashflowing Properties</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Rental properties generating income will appear here</p>
            </div>
          )}
        </div>

        {/* Sold Properties */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 fade-in card-hover">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-6">
            <CheckCircle className="h-5 w-5 mr-2 text-purple-500 icon-bounce" />
            Sold ({properties.filter((p: Property) => p.status === 'Sold').length})
          </h2>
          
          {properties.filter((p: Property) => p.status === 'Sold').length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
              {properties.filter((p: Property) => p.status === 'Sold').map((property: Property) => (
                <SoldPropertyCard key={property.id} property={property} onStatusChange={handleStatusChange} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <CheckCircle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No Sold Properties</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Completed property sales will appear here</p>
            </div>
          )}
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
                  selectedProperty.status === 'Cashflowing' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                }`}>
                  {selectedProperty.status}
                </span>
                <button
                  onClick={closePropertyModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Left Column - Property Details */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Property Information</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Units</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{selectedProperty.apartments}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Entity</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{selectedProperty.entity || 'N/A'}</span>
                      </div>
                      {selectedProperty.acquisitionDate && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Acquisition Date</span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {new Date(selectedProperty.acquisitionDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Financial Summary</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Acquisition Price</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(selectedProperty.acquisitionPrice)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Rehab Costs</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(selectedProperty.rehabCosts)}</span>
                      </div>
                      {selectedProperty.arvAtTimePurchased && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">ARV at Purchase</span>
                          <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(selectedProperty.arvAtTimePurchased)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Initial Capital Required</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(selectedProperty.initialCapitalRequired)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Performance Metrics */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Performance Metrics</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Monthly Cash Flow</span>
                        <span className="font-semibold text-green-600">{formatCurrency(selectedProperty.cashFlow)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Cash-on-Cash Return</span>
                        <span className="font-semibold text-blue-600">{formatPercentage(selectedProperty.cashOnCashReturn)}</span>
                      </div>
                      {selectedProperty.annualizedReturn && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Annualized Return</span>
                          <span className="font-semibold text-purple-600">{formatPercentage(selectedProperty.annualizedReturn)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Total Profits</span>
                        <span className="font-semibold text-green-600">{formatCurrency(selectedProperty.totalProfits)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Sale Information (if sold) */}
                  {selectedProperty.status === 'Sold' && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Sale Information</h3>
                      <div className="space-y-3">
                        {selectedProperty.salePrice && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Sale Price</span>
                            <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(selectedProperty.salePrice)}</span>
                          </div>
                        )}
                        {selectedProperty.yearsHeld && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Years Held</span>
                            <span className="font-semibold text-gray-900 dark:text-white">{selectedProperty.yearsHeld}</span>
                          </div>
                        )}
                        {selectedProperty.salePoints && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Sale Points</span>
                            <span className="font-semibold text-gray-900 dark:text-white">{selectedProperty.salePoints}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="mt-8 flex justify-end">
                <button
                  onClick={closePropertyModal}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Confirmation Modal */}
      {statusChangeModal && editingPropertyData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Confirm Status Change: {statusChangeModal.property.status} → {statusChangeModal.newStatus}
              </h2>
              <button
                onClick={cancelStatusChange}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Property Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Property Information</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      value={editingPropertyData.address}
                      onChange={(e) => updateEditingPropertyData('address', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        value={editingPropertyData.city}
                        onChange={(e) => updateEditingPropertyData('city', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        State
                      </label>
                      <input
                        type="text"
                        value={editingPropertyData.state}
                        onChange={(e) => updateEditingPropertyData('state', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Zip Code
                      </label>
                      <input
                        type="text"
                        value={editingPropertyData.zipCode || ''}
                        onChange={(e) => updateEditingPropertyData('zipCode', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Units
                      </label>
                      <input
                        type="number"
                        value={editingPropertyData.apartments}
                        onChange={(e) => updateEditingPropertyData('apartments', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Entity
                    </label>
                    <select
                      value={editingPropertyData.entity}
                      onChange={(e) => updateEditingPropertyData('entity', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="5Central Capital">5Central Capital</option>
                      <option value="The House Doctors">The House Doctors</option>
                      <option value="Arcadia Vision Group">Arcadia Vision Group</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Status
                    </label>
                    <select
                      value={editingPropertyData.status}
                      onChange={(e) => updateEditingPropertyData('status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="Under Contract">Under Contract</option>
                      <option value="Rehabbing">Rehabbing</option>
                      <option value="Cashflowing">Cashflowing</option>
                      <option value="Sold">Sold</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Financial Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Financial Information</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Acquisition Price
                    </label>
                    <input
                      type="number"
                      value={editingPropertyData.acquisitionPrice}
                      onChange={(e) => updateEditingPropertyData('acquisitionPrice', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Rehab Costs
                    </label>
                    <input
                      type="number"
                      value={editingPropertyData.rehabCosts}
                      onChange={(e) => updateEditingPropertyData('rehabCosts', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      ARV At Purchase
                    </label>
                    <input
                      type="number"
                      value={editingPropertyData.arvAtTimePurchased}
                      onChange={(e) => updateEditingPropertyData('arvAtTimePurchased', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Cash Flow (Monthly)
                    </label>
                    <input
                      type="number"
                      value={editingPropertyData.cashFlow}
                      onChange={(e) => updateEditingPropertyData('cashFlow', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Cash-on-Cash Return (%)
                    </label>
                    <input
                      type="number"
                      value={editingPropertyData.cashOnCashReturn}
                      onChange={(e) => updateEditingPropertyData('cashOnCashReturn', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Acquisition Date
                    </label>
                    <input
                      type="date"
                      value={editingPropertyData.acquisitionDate}
                      onChange={(e) => updateEditingPropertyData('acquisitionDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={cancelStatusChange}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusChange}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                disabled={updatePropertyMutation.isPending}
              >
                {updatePropertyMutation.isPending ? 'Updating...' : 'Confirm & Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}