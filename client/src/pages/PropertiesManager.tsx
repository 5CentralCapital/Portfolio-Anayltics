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
  CreditCard
} from 'lucide-react';

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
  propertyType: 'Multifamily' | 'Single Family' | 'Commercial';
  strategy: 'Buy & Hold' | 'Fix & Flip' | 'BRRRR' | 'Value-Add';
}

// Financial statement interfaces
interface BalanceSheetData {
  assets: {
    totalPropertyValue: number;
    cashAndEquivalents: number;
    otherAssets: number;
  };
  liabilities: {
    mortgageDebt: number;
    otherLiabilities: number;
  };
  equity: {
    ownerEquity: number;
    retainedEarnings: number;
  };
}

interface IncomeStatementData {
  revenue: {
    rentalIncome: number;
    otherIncome: number;
  };
  expenses: {
    operatingExpenses: number;
    interestExpense: number;
    depreciation: number;
    otherExpenses: number;
  };
  netIncome: number;
}

interface CashFlowStatementData {
  operatingActivities: {
    netIncome: number;
    depreciation: number;
    changesInWorkingCapital: number;
  };
  investingActivities: {
    propertyAcquisitions: number;
    capitalImprovements: number;
    dispositions: number;
  };
  financingActivities: {
    debtProceeds: number;
    debtPayments: number;
    ownerContributions: number;
  };
}

// Editable field component for inline editing
interface EditableFieldProps {
  value: number;
  onSave: (value: number) => void;
  format?: 'currency' | 'percentage' | 'number';
  className?: string;
}

const EditableField: React.FC<EditableFieldProps> = ({ 
  value, 
  onSave, 
  format = 'currency', 
  className = '' 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());

  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(val);
      case 'percentage':
        return `${val.toFixed(1)}%`;
      default:
        return val.toLocaleString();
    }
  };

  const handleSave = () => {
    const numValue = parseFloat(editValue.replace(/[^0-9.-]/g, ''));
    if (!isNaN(numValue)) {
      onSave(numValue);
    }
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center space-x-2">
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') {
              setEditValue(value.toString());
              setIsEditing(false);
            }
          }}
          className="px-2 py-1 border border-blue-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
        <button
          onClick={handleSave}
          className="p-1 text-green-600 hover:text-green-700"
        >
          <Save className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <div 
      className={`group flex items-center space-x-1 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded ${className}`}
      onClick={() => setIsEditing(true)}
    >
      <span>{formatValue(value)}</span>
      <Edit3 className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
};

export default function PropertiesManager() {
  const [activeTab, setActiveTab] = useState<'balance' | 'income' | 'cashflow'>('balance');
  const [properties, setProperties] = useState<Property[]>([
    {
      id: 1,
      address: '175 Crystal Ave',
      city: 'New London',
      state: 'CT',
      zipCode: '06320',
      units: 4,
      purchasePrice: 350000,
      purchaseDate: '2021-03-15',
      rehabCosts: 85000,
      totalInvestment: 435000,
      currentValue: 650000,
      grossRent: 4200,
      netRent: 3990,
      expenses: 1890,
      noi: 2100,
      cashFlow: 1950,
      capRate: 0.058,
      cocReturn: 0.537,
      annualizedReturn: 0.089,
      equityCreated: 215000,
      status: 'Active',
      propertyType: 'Multifamily',
      strategy: 'BRRRR'
    },
    {
      id: 2,
      address: '3408 E Dr MLK BLVD',
      city: 'Tampa',
      state: 'FL',
      zipCode: '33610',
      units: 8,
      purchasePrice: 485000,
      purchaseDate: '2021-08-22',
      rehabCosts: 125000,
      totalInvestment: 610000,
      currentValue: 875000,
      grossRent: 7200,
      netRent: 6840,
      expenses: 3024,
      noi: 3816,
      cashFlow: 3450,
      capRate: 0.063,
      cocReturn: 0.679,
      annualizedReturn: 0.124,
      equityCreated: 265000,
      status: 'Active',
      propertyType: 'Multifamily',
      strategy: 'Value-Add'
    },
    {
      id: 3,
      address: '1 Harmony St',
      city: 'New London',
      state: 'CT',
      zipCode: '06320',
      units: 6,
      purchasePrice: 425000,
      purchaseDate: '2022-01-10',
      rehabCosts: 95000,
      totalInvestment: 520000,
      currentValue: 725000,
      grossRent: 5400,
      netRent: 5130,
      expenses: 2160,
      noi: 2970,
      cashFlow: 2700,
      capRate: 0.061,
      cocReturn: 0.623,
      annualizedReturn: 0.115,
      equityCreated: 205000,
      status: 'Active',
      propertyType: 'Multifamily',
      strategy: 'BRRRR'
    },
    {
      id: 4,
      address: '145 Crystal Ave',
      city: 'New London',
      state: 'CT',
      zipCode: '06320',
      units: 3,
      purchasePrice: 285000,
      purchaseDate: '2022-05-18',
      rehabCosts: 65000,
      totalInvestment: 350000,
      currentValue: 485000,
      grossRent: 3300,
      netRent: 3135,
      expenses: 1320,
      noi: 1815,
      cashFlow: 1650,
      capRate: 0.055,
      cocReturn: 0.566,
      annualizedReturn: 0.096,
      equityCreated: 135000,
      status: 'Active',
      propertyType: 'Multifamily',
      strategy: 'Buy & Hold'
    },
    {
      id: 5,
      address: '25 Huntington PL',
      city: 'New London',
      state: 'CT',
      zipCode: '06320',
      units: 2,
      purchasePrice: 195000,
      purchaseDate: '2022-09-12',
      rehabCosts: 45000,
      totalInvestment: 240000,
      currentValue: 345000,
      grossRent: 2400,
      netRent: 2280,
      expenses: 960,
      noi: 1320,
      cashFlow: 1200,
      capRate: 0.055,
      cocReturn: 0.6,
      annualizedReturn: 0.105,
      equityCreated: 105000,
      status: 'Active',
      propertyType: 'Multifamily',
      strategy: 'BRRRR'
    }
  ]);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [newProperty, setNewProperty] = useState<Partial<Property>>({});
  const [showAddForm, setShowAddForm] = useState(false);

  // Calculate portfolio metrics
  const calculatePortfolioMetrics = () => {
    const totalProperties = properties.length;
    const totalUnits = properties.reduce((sum, prop) => sum + prop.units, 0);
    const totalValue = properties.reduce((sum, prop) => sum + prop.currentValue, 0);
    const totalInvestment = properties.reduce((sum, prop) => sum + prop.totalInvestment, 0);
    const totalEquityCreated = properties.reduce((sum, prop) => sum + prop.equityCreated, 0);
    const totalMonthlyRent = properties.reduce((sum, prop) => sum + prop.grossRent, 0);
    const totalMonthlyCashFlow = properties.reduce((sum, prop) => sum + prop.cashFlow, 0);
    const avgCashOnCash = properties.length > 0 ? 
      properties.reduce((sum, prop) => sum + prop.cocReturn, 0) / properties.length : 0;
    const avgAnnualizedReturn = properties.length > 0 ? 
      properties.reduce((sum, prop) => sum + prop.annualizedReturn, 0) / properties.length : 0;
    const avgCapRate = properties.length > 0 ? 
      properties.reduce((sum, prop) => sum + prop.capRate, 0) / properties.length : 0;

    return {
      totalProperties,
      totalUnits,
      totalValue,
      totalInvestment,
      totalEquityCreated,
      totalMonthlyRent,
      totalMonthlyCashFlow,
      avgCashOnCash,
      avgAnnualizedReturn,
      avgCapRate,
      equityMultiple: totalInvestment > 0 ? totalValue / totalInvestment : 0,
      totalROI: totalInvestment > 0 ? (totalValue - totalInvestment) / totalInvestment : 0
    };
  };

  const metrics = calculatePortfolioMetrics();

  // Calculate financial statements based on property data
  const calculateFinancialStatements = () => {
    const totalPropertyValue = properties.reduce((sum, prop) => sum + prop.currentValue, 0);
    const totalDebt = properties.reduce((sum, prop) => sum + (prop.totalInvestment * 0.7), 0); // Assume 70% LTV
    const totalEquity = totalPropertyValue - totalDebt;
    const totalRentalIncome = properties.reduce((sum, prop) => sum + (prop.grossRent * 12), 0);
    const totalExpenses = properties.reduce((sum, prop) => sum + (prop.expenses * 12), 0);
    const netIncome = totalRentalIncome - totalExpenses;

    const balanceSheet: BalanceSheetData = {
      assets: {
        totalPropertyValue,
        cashAndEquivalents: 150000,
        otherAssets: 25000
      },
      liabilities: {
        mortgageDebt: totalDebt,
        otherLiabilities: 15000
      },
      equity: {
        ownerEquity: totalEquity,
        retainedEarnings: netIncome * 0.3
      }
    };

    const incomeStatement: IncomeStatementData = {
      revenue: {
        rentalIncome: totalRentalIncome,
        otherIncome: 8000
      },
      expenses: {
        operatingExpenses: totalExpenses,
        interestExpense: totalDebt * 0.045,
        depreciation: totalPropertyValue * 0.0364,
        otherExpenses: 12000
      },
      netIncome
    };

    const cashFlowStatement: CashFlowStatementData = {
      operatingActivities: {
        netIncome,
        depreciation: totalPropertyValue * 0.0364,
        changesInWorkingCapital: -5000
      },
      investingActivities: {
        propertyAcquisitions: -150000,
        capitalImprovements: -35000,
        dispositions: 0
      },
      financingActivities: {
        debtProceeds: 105000,
        debtPayments: -48000,
        ownerContributions: 25000
      }
    };

    return { balanceSheet, incomeStatement, cashFlowStatement };
  };

  const financialStatements = calculateFinancialStatements();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  const formatPercent = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value || 0);
  };

  const handleEdit = (id: number) => {
    setEditingId(id);
  };

  const handleSave = (id: number, updatedProperty: Partial<Property>) => {
    setProperties(properties.map(prop => 
      prop.id === id ? { ...prop, ...updatedProperty } : prop
    ));
    setEditingId(null);
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      setProperties(properties.filter(prop => prop.id !== id));
    }
  };

  const handleAddProperty = () => {
    if (newProperty.address && newProperty.city && newProperty.state) {
      const id = Math.max(...properties.map(p => p.id), 0) + 1;
      const property: Property = {
        id,
        address: newProperty.address || '',
        city: newProperty.city || '',
        state: newProperty.state || '',
        zipCode: newProperty.zipCode || '',
        units: newProperty.units || 1,
        purchasePrice: newProperty.purchasePrice || 0,
        purchaseDate: newProperty.purchaseDate || new Date().toISOString().split('T')[0],
        rehabCosts: newProperty.rehabCosts || 0,
        totalInvestment: (newProperty.purchasePrice || 0) + (newProperty.rehabCosts || 0),
        currentValue: newProperty.currentValue || 0,
        grossRent: newProperty.grossRent || 0,
        netRent: (newProperty.grossRent || 0) * 0.95, // Assume 5% vacancy
        expenses: newProperty.expenses || 0,
        noi: ((newProperty.grossRent || 0) * 0.95) - (newProperty.expenses || 0),
        cashFlow: newProperty.cashFlow || 0,
        capRate: newProperty.currentValue ? ((((newProperty.grossRent || 0) * 0.95) - (newProperty.expenses || 0)) * 12) / newProperty.currentValue : 0,
        cocReturn: newProperty.cocReturn || 0,
        annualizedReturn: newProperty.annualizedReturn || 0,
        equityCreated: (newProperty.currentValue || 0) - ((newProperty.purchasePrice || 0) + (newProperty.rehabCosts || 0)),
        status: (newProperty.status as Property['status']) || 'Active',
        propertyType: (newProperty.propertyType as Property['propertyType']) || 'Multifamily',
        strategy: (newProperty.strategy as Property['strategy']) || 'Buy & Hold'
      };
      setProperties([...properties, property]);
      setNewProperty({});
      setShowAddForm(false);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Asset Management</h1>
          <p className="text-gray-600">Real estate portfolio performance and financial tracking</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Property
          </button>
          <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* KPI Bar - Top Level Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Portfolio Value</p>
              <p className="text-3xl font-bold text-blue-600">{formatCurrency(metrics.totalValue)}</p>
              <p className="text-sm text-gray-500 mt-1">{metrics.totalProperties} properties</p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <Building className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Cash Flow</p>
              <p className="text-3xl font-bold text-green-600">{formatCurrency(metrics.totalMonthlyCashFlow)}</p>
              <p className="text-sm text-gray-500 mt-1">{formatCurrency(metrics.totalMonthlyCashFlow * 12)} annually</p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Equity Created</p>
              <p className="text-3xl font-bold text-purple-600">{formatCurrency(metrics.totalEquityCreated)}</p>
              <p className="text-sm text-gray-500 mt-1">{formatPercent(metrics.totalROI)} total ROI</p>
            </div>
            <div className="bg-purple-100 rounded-full p-3">
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Cash-on-Cash</p>
              <p className="text-3xl font-bold text-orange-600">{formatPercent(metrics.avgCashOnCash)}</p>
              <p className="text-sm text-gray-500 mt-1">{formatPercent(metrics.avgCapRate)} avg cap rate</p>
            </div>
            <div className="bg-orange-100 rounded-full p-3">
              <Percent className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Financial Tabs */}
      <div className="bg-white rounded-xl shadow-lg">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'balance', label: 'Balance Sheet', icon: BarChart3 },
              { id: 'income', label: 'Income Statement', icon: FileText },
              { id: 'cashflow', label: 'Cash Flow Statement', icon: Activity }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'balance' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Assets */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Assets</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Real Estate Properties</span>
                    <EditableField
                      value={financialStatements.balanceSheet.assets.totalPropertyValue}
                      onSave={(value) => {}}
                      className="font-semibold"
                    />
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Cash & Equivalents</span>
                    <EditableField
                      value={financialStatements.balanceSheet.assets.cashAndEquivalents}
                      onSave={(value) => {}}
                    />
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Other Assets</span>
                    <EditableField
                      value={financialStatements.balanceSheet.assets.otherAssets}
                      onSave={(value) => {}}
                    />
                  </div>
                  <div className="flex justify-between items-center py-3 border-t-2 border-gray-300 font-bold">
                    <span>Total Assets</span>
                    <span className="text-blue-600">
                      {formatCurrency(
                        financialStatements.balanceSheet.assets.totalPropertyValue +
                        financialStatements.balanceSheet.assets.cashAndEquivalents +
                        financialStatements.balanceSheet.assets.otherAssets
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Liabilities */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Liabilities</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Mortgage Debt</span>
                    <EditableField
                      value={financialStatements.balanceSheet.liabilities.mortgageDebt}
                      onSave={(value) => {}}
                      className="font-semibold"
                    />
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Other Liabilities</span>
                    <EditableField
                      value={financialStatements.balanceSheet.liabilities.otherLiabilities}
                      onSave={(value) => {}}
                    />
                  </div>
                  <div className="flex justify-between items-center py-3 border-t-2 border-gray-300 font-bold">
                    <span>Total Liabilities</span>
                    <span className="text-red-600">
                      {formatCurrency(
                        financialStatements.balanceSheet.liabilities.mortgageDebt +
                        financialStatements.balanceSheet.liabilities.otherLiabilities
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Equity */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Owner's Equity</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Owner Equity</span>
                    <EditableField
                      value={financialStatements.balanceSheet.equity.ownerEquity}
                      onSave={(value) => {}}
                      className="font-semibold"
                    />
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Retained Earnings</span>
                    <EditableField
                      value={financialStatements.balanceSheet.equity.retainedEarnings}
                      onSave={(value) => {}}
                    />
                  </div>
                  <div className="flex justify-between items-center py-3 border-t-2 border-gray-300 font-bold">
                    <span>Total Equity</span>
                    <span className="text-green-600">
                      {formatCurrency(
                        financialStatements.balanceSheet.equity.ownerEquity +
                        financialStatements.balanceSheet.equity.retainedEarnings
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'income' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Revenue */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Rental Income</span>
                    <EditableField
                      value={financialStatements.incomeStatement.revenue.rentalIncome}
                      onSave={(value) => {}}
                      className="font-semibold"
                    />
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Other Income</span>
                    <EditableField
                      value={financialStatements.incomeStatement.revenue.otherIncome}
                      onSave={(value) => {}}
                    />
                  </div>
                  <div className="flex justify-between items-center py-3 border-t-2 border-gray-300 font-bold">
                    <span>Total Revenue</span>
                    <span className="text-green-600">
                      {formatCurrency(
                        financialStatements.incomeStatement.revenue.rentalIncome +
                        financialStatements.incomeStatement.revenue.otherIncome
                      )}
                    </span>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-8">Net Income</h3>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-blue-900">Net Income</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {formatCurrency(financialStatements.incomeStatement.netIncome)}
                    </span>
                  </div>
                  <p className="text-sm text-blue-700 mt-1">
                    {formatPercent(
                      financialStatements.incomeStatement.netIncome / 
                      (financialStatements.incomeStatement.revenue.rentalIncome + 
                       financialStatements.incomeStatement.revenue.otherIncome)
                    )} profit margin
                  </p>
                </div>
              </div>

              {/* Expenses */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Expenses</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Operating Expenses</span>
                    <EditableField
                      value={financialStatements.incomeStatement.expenses.operatingExpenses}
                      onSave={(value) => {}}
                      className="font-semibold"
                    />
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Interest Expense</span>
                    <EditableField
                      value={financialStatements.incomeStatement.expenses.interestExpense}
                      onSave={(value) => {}}
                    />
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Depreciation</span>
                    <EditableField
                      value={financialStatements.incomeStatement.expenses.depreciation}
                      onSave={(value) => {}}
                    />
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Other Expenses</span>
                    <EditableField
                      value={financialStatements.incomeStatement.expenses.otherExpenses}
                      onSave={(value) => {}}
                    />
                  </div>
                  <div className="flex justify-between items-center py-3 border-t-2 border-gray-300 font-bold">
                    <span>Total Expenses</span>
                    <span className="text-red-600">
                      {formatCurrency(
                        financialStatements.incomeStatement.expenses.operatingExpenses +
                        financialStatements.incomeStatement.expenses.interestExpense +
                        financialStatements.incomeStatement.expenses.depreciation +
                        financialStatements.incomeStatement.expenses.otherExpenses
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cashflow' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Operating Activities */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Operating Activities</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Net Income</span>
                    <span className="font-semibold">{formatCurrency(financialStatements.cashFlowStatement.operatingActivities.netIncome)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Depreciation</span>
                    <span>{formatCurrency(financialStatements.cashFlowStatement.operatingActivities.depreciation)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Working Capital Changes</span>
                    <EditableField
                      value={financialStatements.cashFlowStatement.operatingActivities.changesInWorkingCapital}
                      onSave={(value) => {}}
                    />
                  </div>
                  <div className="flex justify-between items-center py-3 border-t-2 border-gray-300 font-bold">
                    <span>Operating Cash Flow</span>
                    <span className="text-green-600">
                      {formatCurrency(
                        financialStatements.cashFlowStatement.operatingActivities.netIncome +
                        financialStatements.cashFlowStatement.operatingActivities.depreciation +
                        financialStatements.cashFlowStatement.operatingActivities.changesInWorkingCapital
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Investing Activities */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Investing Activities</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Property Acquisitions</span>
                    <EditableField
                      value={financialStatements.cashFlowStatement.investingActivities.propertyAcquisitions}
                      onSave={(value) => {}}
                    />
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Capital Improvements</span>
                    <EditableField
                      value={financialStatements.cashFlowStatement.investingActivities.capitalImprovements}
                      onSave={(value) => {}}
                    />
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Property Dispositions</span>
                    <EditableField
                      value={financialStatements.cashFlowStatement.investingActivities.dispositions}
                      onSave={(value) => {}}
                    />
                  </div>
                  <div className="flex justify-between items-center py-3 border-t-2 border-gray-300 font-bold">
                    <span>Investing Cash Flow</span>
                    <span className="text-red-600">
                      {formatCurrency(
                        financialStatements.cashFlowStatement.investingActivities.propertyAcquisitions +
                        financialStatements.cashFlowStatement.investingActivities.capitalImprovements +
                        financialStatements.cashFlowStatement.investingActivities.dispositions
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Financing Activities */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Financing Activities</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Debt Proceeds</span>
                    <EditableField
                      value={financialStatements.cashFlowStatement.financingActivities.debtProceeds}
                      onSave={(value) => {}}
                    />
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Debt Payments</span>
                    <EditableField
                      value={financialStatements.cashFlowStatement.financingActivities.debtPayments}
                      onSave={(value) => {}}
                    />
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Owner Contributions</span>
                    <EditableField
                      value={financialStatements.cashFlowStatement.financingActivities.ownerContributions}
                      onSave={(value) => {}}
                    />
                  </div>
                  <div className="flex justify-between items-center py-3 border-t-2 border-gray-300 font-bold">
                    <span>Financing Cash Flow</span>
                    <span className="text-blue-600">
                      {formatCurrency(
                        financialStatements.cashFlowStatement.financingActivities.debtProceeds +
                        financialStatements.cashFlowStatement.financingActivities.debtPayments +
                        financialStatements.cashFlowStatement.financingActivities.ownerContributions
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Property Portfolio Table */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Property Portfolio</h3>
          <div className="text-sm text-gray-500">
            All calculations drive dashboard KPIs above
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Property</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Purchase Price</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Current Value</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Monthly Rent</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Cash Flow</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">CoC Return</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Equity Created</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((property) => (
                <tr key={property.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium text-gray-900">{property.address}</div>
                      <div className="text-sm text-gray-500">{property.city}, {property.state}</div>
                      <div className="text-xs text-gray-400">{property.units} units • {property.strategy}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <EditableField
                      value={property.purchasePrice}
                      onSave={(value) => handleSave(property.id, { purchasePrice: value })}
                    />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <EditableField
                      value={property.currentValue}
                      onSave={(value) => handleSave(property.id, { currentValue: value })}
                      className="font-semibold text-blue-600"
                    />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <EditableField
                      value={property.grossRent}
                      onSave={(value) => handleSave(property.id, { grossRent: value })}
                    />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <EditableField
                      value={property.cashFlow}
                      onSave={(value) => handleSave(property.id, { cashFlow: value })}
                      className="font-semibold text-green-600"
                    />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <EditableField
                      value={property.cocReturn}
                      onSave={(value) => handleSave(property.id, { cocReturn: value })}
                      format="percentage"
                      className="font-semibold"
                    />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="font-semibold text-purple-600">
                      {formatCurrency(property.equityCreated)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={() => handleEdit(property.id)}
                        className="p-1 text-blue-600 hover:text-blue-700"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(property.id)}
                        className="p-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}