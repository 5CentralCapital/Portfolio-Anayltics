import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calculator, Building, DollarSign, TrendingUp, Home, Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import EnhancedPropertyCard from '@/components/EnhancedPropertyCard';

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
  dealAnalyzerData?: string;
}

interface RehabLineItem {
  id: string;
  category: string;
  item: string;
  budgetAmount: number;
  spentAmount: number;
  completed: boolean;
  notes?: string;
}

const entityOptions = [
  '5Central Capital',
  'The House Doctors',
  'Arcadia Vision Group'
];

// Helper functions for formatting
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

const PropertyCard = ({ property, onStatusChange, onDoubleClick }: { property: Property; onStatusChange: (id: number, status: string) => void; onDoubleClick: (property: Property) => void }) => {
  // Convert the Asset Management Property to Enhanced Property Card format
  const handleDoubleClick = (enhancedProperty: any) => {
    onDoubleClick(property); // Pass the original property
  };
  
  return (
    <EnhancedPropertyCard 
      property={{
        id: property.id,
        address: property.address,
        city: property.city,
        state: property.state,
        status: property.status,
        entity: property.entity || '5Central Capital',
        apartments: property.apartments,
        acquisitionDate: property.acquisitionDate || new Date().toISOString()
      }}
      onStatusChange={onStatusChange}
      onDoubleClick={handleDoubleClick}
      variant="standard"
    />
  );
};

const SoldPropertyCard = ({ property, onStatusChange, onDoubleClick }: { property: Property; onStatusChange: (id: number, status: string) => void; onDoubleClick: (property: Property) => void }) => (
  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 aspect-square flex flex-col cursor-pointer card-hover transition-all-smooth hover:shadow-md bg-white dark:bg-gray-800"
       onDoubleClick={() => onDoubleClick(property)}
       style={{ height: '200px' }}>
    <div className="flex justify-between items-start mb-2">
      <div>
        <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-1">{property.address}</h4>
        <p className="text-xs text-gray-600 dark:text-gray-400">{property.city}, {property.state} • {property.apartments} units</p>
      </div>
      <Select onValueChange={(value) => onStatusChange(property.id, value)} defaultValue={property.status}>
        <SelectTrigger className="w-20 h-6 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Under Contract">Under Contract</SelectItem>
          <SelectItem value="Rehabbing">Rehabbing</SelectItem>
          <SelectItem value="Cashflowing">Cashflowing</SelectItem>
          <SelectItem value="Sold">Sold</SelectItem>
        </SelectContent>
      </Select>
    </div>
    
    <div className="mt-auto space-y-1.5">
      <div className="bg-green-50 dark:bg-green-900/20 rounded-md p-2">
        <p className="text-green-700 dark:text-green-400 text-xs mb-0.5">Capital Invested</p>
        <p className="font-bold text-green-700 dark:text-green-400 text-xs">{formatCurrency(property.initialCapitalRequired)}</p>
      </div>
      <div className="bg-orange-50 dark:bg-orange-900/20 rounded-md p-2">
        <p className="text-orange-700 dark:text-orange-400 text-xs mb-0.5">Total Profit</p>
        <p className="font-bold text-orange-700 dark:text-orange-400 text-xs">{formatCurrency(property.totalProfits)}</p>
      </div>
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-md p-2">
        <p className="text-blue-700 dark:text-blue-400 text-xs mb-0.5">Multiple</p>
        <p className="font-bold text-blue-700 dark:text-blue-400 text-xs">{(Number(property.totalProfits) / Number(property.initialCapitalRequired)).toFixed(2)}x</p>
      </div>
      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-md p-2">
        <p className="text-purple-700 dark:text-purple-400 text-xs mb-0.5">Sale</p>
        <p className="font-bold text-purple-700 dark:text-purple-400 text-xs">{formatCurrency(property.salePrice || '0')}</p>
      </div>
    </div>
  </div>
);

// Loan payment calculation function
const calculateLoanPayment = (amount: number, interestRate: number, termYears: number, paymentType: string) => {
  if (amount <= 0 || interestRate <= 0) return 0;
  
  const monthlyRate = interestRate / 12;
  
  if (paymentType === 'interest-only') {
    return amount * monthlyRate;
  } else {
    // Full amortization
    const numPayments = termYears * 12;
    if (numPayments <= 0) return 0;
    
    return amount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
  }
};

export default function AssetManagement() {
  const queryClient = useQueryClient();
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [statusChangeModal, setStatusChangeModal] = useState<{
    property: Property;
    newStatus: string;
  } | null>(null);
  const [editingPropertyData, setEditingPropertyData] = useState<Property | null>(null);
  const [rehabLineItems, setRehabLineItems] = useState<Record<number, RehabLineItem[]>>({});
  const [showRehabModal, setShowRehabModal] = useState<Property | null>(null);
  const [showPropertyDetailModal, setShowPropertyDetailModal] = useState<Property | null>(null);
  const [propertyDetailTab, setPropertyDetailTab] = useState('overview');
  const [editingModalProperty, setEditingModalProperty] = useState<Property | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Initialize default rehab line items for a property
  const initializeRehabItems = (property: Property): RehabLineItem[] => {
    const totalBudget = parseFloat(property.rehabCosts) || 100000;
    return [
      // Exterior
      { id: '1', category: 'Exterior', item: 'Roof Repair/Replacement', budgetAmount: totalBudget * 0.15, spentAmount: 0, completed: false },
      { id: '2', category: 'Exterior', item: 'Siding & Paint', budgetAmount: totalBudget * 0.12, spentAmount: 0, completed: false },
      { id: '3', category: 'Exterior', item: 'Windows & Doors', budgetAmount: totalBudget * 0.10, spentAmount: 0, completed: false },
      
      // Kitchens
      { id: '4', category: 'Kitchens', item: 'Cabinets & Countertops', budgetAmount: totalBudget * 0.15, spentAmount: 0, completed: false },
      { id: '5', category: 'Kitchens', item: 'Appliances', budgetAmount: totalBudget * 0.08, spentAmount: 0, completed: false },
      
      // Bathrooms
      { id: '6', category: 'Bathrooms', item: 'Tile & Fixtures', budgetAmount: totalBudget * 0.12, spentAmount: 0, completed: false },
      { id: '7', category: 'Bathrooms', item: 'Vanity & Plumbing', budgetAmount: totalBudget * 0.08, spentAmount: 0, completed: false },
      
      // General Interior
      { id: '8', category: 'General Interior', item: 'Flooring', budgetAmount: totalBudget * 0.10, spentAmount: 0, completed: false },
      { id: '9', category: 'General Interior', item: 'HVAC', budgetAmount: totalBudget * 0.10, spentAmount: 0, completed: false }
    ];
  };

  const { data: propertiesData, isLoading: propertiesLoading } = useQuery<Property[]>({
    queryKey: ['/api/properties']
  });

  // Ensure properties is always an array
  const properties = Array.isArray(propertiesData) ? propertiesData : [];

  const handlePropertyDoubleClick = (property: Property) => {
    setShowPropertyDetailModal(property);
  };

  const handleStatusChange = async (propertyId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/properties/${propertyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      }
    } catch (error) {
      console.error('Error updating property status:', error);
    }
  };

  const handleEntityChange = async (propertyId: number, newEntity: string) => {
    try {
      const response = await fetch(`/api/properties/${propertyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity: newEntity })
      });

      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      }
    } catch (error) {
      console.error('Error updating property entity:', error);
    }
  };

  const addRehabItem = (propertyId: number) => {
    const newItem: RehabLineItem = {
      id: Date.now().toString(),
      category: 'General',
      item: 'New Item',
      budgetAmount: 0,
      spentAmount: 0,
      completed: false,
      notes: ''
    };

    setRehabLineItems(prev => ({
      ...prev,
      [propertyId]: [...(prev[propertyId] || []), newItem]
    }));
  };

  const updateRehabItem = (propertyId: number, itemId: string, updates: Partial<RehabLineItem>) => {
    setRehabLineItems(prev => ({
      ...prev,
      [propertyId]: (prev[propertyId] || []).map(item =>
        item.id === itemId ? { ...item, ...updates } : item
      )
    }));
  };

  const deleteRehabItem = (propertyId: number, itemId: string) => {
    setRehabLineItems(prev => ({
      ...prev,
      [propertyId]: (prev[propertyId] || []).filter(item => item.id !== itemId)
    }));
  };

  if (propertiesLoading || !propertiesData) {
    return <div className="p-8">Loading properties...</div>;
  }

  // Calculate portfolio metrics using authentic property data
  const portfolioMetrics = {
    totalUnits: properties.reduce((sum: number, prop: Property) => sum + (prop.apartments || 0), 0),
    totalAUM: properties.reduce((sum: number, prop: Property) => {
      const price = parseFloat(prop.acquisitionPrice?.replace(/[^0-9.-]/g, '') || '0');
      return sum + price;
    }, 0),
    totalEquity: properties.reduce((sum: number, prop: Property) => {
      const capital = parseFloat(prop.initialCapitalRequired?.replace(/[^0-9.-]/g, '') || '0');
      return sum + capital;
    }, 0),
    monthlyCashFlow: properties.reduce((sum: number, prop: Property) => {
      if (prop.status !== 'Cashflowing') return sum;
      const cashFlow = parseFloat(prop.cashFlow?.replace(/[^0-9.-]/g, '') || '0');
      return sum + cashFlow;
    }, 0),
    averageCOC: properties.length > 0
      ? properties.reduce((sum: number, prop: Property) => {
          const coc = parseFloat(prop.cashOnCashReturn?.replace(/[^0-9.-]/g, '') || '0');
          return sum + coc;
        }, 0) / properties.length
      : 0,
    averageROI: properties.length > 0 ? (() => {
      const totalValue = properties.reduce((sum: number, prop: Property) => {
        const price = parseFloat(prop.acquisitionPrice?.replace(/[^0-9.-]/g, '') || '0');
        return sum + price;
      }, 0);
      const totalUnits = properties.reduce((sum: number, prop: Property) => sum + (prop.apartments || 0), 0);
      return totalUnits > 0 ? totalValue / totalUnits : 0;
    })() : 0
  };

  return (
    <div className="p-6 space-y-6">
      {/* KPI Bar */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-500 via-purple-500 to-purple-600 rounded-lg p-4 text-white">
        <div className="grid grid-cols-6 gap-4">
          <div className="text-center">
            <Calculator className="h-5 w-5 mx-auto mb-2" />
            <p className="text-sm opacity-90">Total AUM</p>
            <p className="text-lg font-bold">{formatCurrency(portfolioMetrics.totalAUM)}</p>
          </div>
          <div className="text-center border-l border-white/20 pl-4">
            <Calculator className="h-5 w-5 mx-auto mb-2" />
            <p className="text-sm opacity-90">Price/Unit</p>
            <p className="text-lg font-bold">{formatCurrency(portfolioMetrics.averageROI)}</p>
          </div>
          <div className="text-center border-l border-white/20 pl-4">
            <Calculator className="h-5 w-5 mx-auto mb-2" />
            <p className="text-sm opacity-90">Total Units</p>
            <p className="text-lg font-bold">{portfolioMetrics.totalUnits}</p>
          </div>
          <div className="text-center border-l border-white/20 pl-4">
            <Calculator className="h-5 w-5 mx-auto mb-2" />
            <p className="text-sm opacity-90">Total Equity</p>
            <p className="text-lg font-bold">{formatCurrency(portfolioMetrics.totalEquity)}</p>
          </div>
          <div className="text-center border-l border-white/20 pl-4">
            <Calculator className="h-5 w-5 mx-auto mb-2" />
            <p className="text-sm opacity-90">Avg COC Return</p>
            <p className="text-lg font-bold">{formatPercentage(portfolioMetrics.averageCOC)}</p>
          </div>
          <div className="text-center border-l border-white/20 pl-4">
            <Calculator className="h-5 w-5 mx-auto mb-2" />
            <p className="text-sm opacity-90">Monthly Cash Flow</p>
            <p className="text-lg font-bold">{formatCurrency(portfolioMetrics.monthlyCashFlow)}</p>
          </div>
        </div>
      </div>

      {/* Financial Statements */}
      <Card>
        <Tabs defaultValue="balance-sheet" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
            <TabsTrigger value="income-statement">Income Statement</TabsTrigger>
            <TabsTrigger value="cash-flow">Cash Flow Statement</TabsTrigger>
          </TabsList>
          
          <TabsContent value="balance-sheet" className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Assets</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Real Estate Properties</span>
                    <span className="font-medium">{formatCurrency(portfolioMetrics.totalAUM)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cash & Cash Equivalents</span>
                    <span className="font-medium">$125,000</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 font-semibold">
                    <span>Total Assets</span>
                    <span>{formatCurrency(portfolioMetrics.totalAUM + 125000)}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Liabilities & Equity</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Mortgage Debt</span>
                    <span className="font-medium">{formatCurrency(portfolioMetrics.totalAUM - portfolioMetrics.totalEquity)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Owner's Equity</span>
                    <span className="font-medium">{formatCurrency(portfolioMetrics.totalEquity)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 font-semibold">
                    <span>Total Liabilities & Equity</span>
                    <span>{formatCurrency(portfolioMetrics.totalAUM + 125000)}</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="income-statement" className="p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Monthly Income Statement</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Rental Income</span>
                  <span className="font-medium">{formatCurrency(portfolioMetrics.monthlyCashFlow * 1.5)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Operating Expenses</span>
                  <span className="font-medium">({formatCurrency(portfolioMetrics.monthlyCashFlow * 0.3)})</span>
                </div>
                <div className="flex justify-between">
                  <span>Debt Service</span>
                  <span className="font-medium">({formatCurrency(portfolioMetrics.monthlyCashFlow * 0.2)})</span>
                </div>
                <div className="flex justify-between border-t pt-2 font-semibold">
                  <span>Net Operating Income</span>
                  <span>{formatCurrency(portfolioMetrics.monthlyCashFlow)}</span>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="cash-flow" className="p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Monthly Cash Flow Statement</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Operating Cash Flow</span>
                  <span className="font-medium">{formatCurrency(portfolioMetrics.monthlyCashFlow)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Investment Cash Flow</span>
                  <span className="font-medium">($15,000)</span>
                </div>
                <div className="flex justify-between">
                  <span>Financing Cash Flow</span>
                  <span className="font-medium">$8,000</span>
                </div>
                <div className="flex justify-between border-t pt-2 font-semibold">
                  <span>Net Cash Flow</span>
                  <span>{formatCurrency(portfolioMetrics.monthlyCashFlow - 7000)}</span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Property Status Sections */}
      <div className="space-y-8">
        {/* Under Contract Properties */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Home className="h-5 w-5" />
            Under Contract ({properties.filter((p: Property) => p.status === 'Under Contract').length})
          </h2>
          {properties.filter((p: Property) => p.status === 'Under Contract').length > 0 ? (
            <div className="grid gap-4">
              {properties.filter((p: Property) => p.status === 'Under Contract').map((property: Property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onStatusChange={handleStatusChange}
                  onDoubleClick={handlePropertyDoubleClick}
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No properties under contract</p>
          )}
        </div>

        {/* Rehabbing Properties */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Building className="h-5 w-5" />
            Rehabbing ({properties.filter((p: Property) => p.status === 'Rehabbing').length})
          </h2>
          {properties.filter((p: Property) => p.status === 'Rehabbing').length > 0 ? (
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                {properties.filter((p: Property) => p.status === 'Rehabbing').map((property: Property) => {
                  const items = rehabLineItems[property.id] || initializeRehabItems(property);
                  if (!rehabLineItems[property.id]) {
                    setRehabLineItems(prev => ({ ...prev, [property.id]: items }));
                  }

                  return (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      onStatusChange={handleStatusChange}
                      onDoubleClick={handlePropertyDoubleClick}
                    />
                  );
                })}
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Progress Tracking</h3>
                {properties.filter((p: Property) => p.status === 'Rehabbing').map((property: Property) => {
                  const items = rehabLineItems[property.id] || initializeRehabItems(property);
                  const totalBudget = items.reduce((sum, item) => sum + item.budgetAmount, 0);
                  const totalSpent = items.reduce((sum, item) => sum + item.spentAmount, 0);
                  const completedItems = items.filter(item => item.completed).length;
                  const progressPercentage = items.length > 0 ? (completedItems / items.length) * 100 : 0;
                  const budgetPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

                  return (
                    <Card key={property.id} className="p-4">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">{property.address}</h4>
                      
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Rehab Progress</span>
                            <span>{progressPercentage.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full transition-all-smooth" 
                              style={{ width: `${progressPercentage}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Budget Utilization</span>
                            <span className={budgetPercentage > 90 ? 'text-red-600' : budgetPercentage > 75 ? 'text-yellow-600' : 'text-green-600'}>
                              {budgetPercentage.toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all-smooth ${
                                budgetPercentage > 90 ? 'bg-red-500' : budgetPercentage > 75 ? 'bg-yellow-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div className="text-center">
                            <p className="text-gray-500 dark:text-gray-400">Total Budget</p>
                            <p className="font-medium">{formatCurrency(totalBudget)}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-gray-500 dark:text-gray-400">Spent</p>
                            <p className="font-medium">{formatCurrency(totalSpent)}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-gray-500 dark:text-gray-400">Remaining</p>
                            <p className="font-medium">{formatCurrency(totalBudget - totalSpent)}</p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No properties currently rehabbing</p>
          )}
        </div>

        {/* Cashflowing Properties */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Cashflowing ({properties.filter((p: Property) => p.status === 'Cashflowing').length})
          </h2>
          {properties.filter((p: Property) => p.status === 'Cashflowing').length > 0 ? (
            <div className="grid gap-4">
              {properties.filter((p: Property) => p.status === 'Cashflowing').map((property: Property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onStatusChange={handleStatusChange}
                  onDoubleClick={handlePropertyDoubleClick}
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No cashflowing properties</p>
          )}
        </div>

        {/* Sold Properties */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Sold ({properties.filter((p: Property) => p.status === 'Sold').length})
          </h2>
          {properties.filter((p: Property) => p.status === 'Sold').length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {properties.filter((p: Property) => p.status === 'Sold').map((property: Property) => (
                <SoldPropertyCard
                  key={property.id}
                  property={property}
                  onStatusChange={handleStatusChange}
                  onDoubleClick={handlePropertyDoubleClick}
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No sold properties</p>
          )}
        </div>
      </div>

      {/* Property detail modal functionality will be integrated with enhanced property cards */}
    </div>
  );
}