import React, { useState, useEffect } from 'react';
import {
  Building,
  TrendingUp,
  Home,
  BarChart3,
  Activity,
  MapPin,
  Target
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
  propertyType: 'Multifamily' | 'Single Family' | 'Commercial';
  strategy: 'Buy & Hold' | 'Fix & Flip' | 'BRRRR' | 'Value-Add';
  entityId?: string;
}

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

export default function AssetManagement() {
  const [activeTab, setActiveTab] = useState<'balance' | 'income' | 'cashflow'>('balance');
  
  // Available entities for assignment
  const [entities] = useState([
    { id: '5central', name: '5Central Capital LLC' },
    { id: 'harmony', name: 'Harmony Holdings LLC' },
    { id: 'crystal', name: 'Crystal Properties LLC' }
  ]);

  // Fetch properties from API
  const { data: propertiesData, isLoading } = useQuery({
    queryKey: ['/api/property-performance'],
    select: (data) => data || []
  });

  const [properties, setProperties] = useState<Property[]>([]);

  useEffect(() => {
    if (propertiesData) {
      // Transform API data to match Property interface
      const transformedProperties = propertiesData.map((prop: any) => ({
        id: parseInt(prop.id),
        address: prop.address,
        city: prop.city || 'Hartford',
        state: prop.state || 'CT',
        zipCode: prop.zipCode || '06106',
        units: prop.units || 1,
        purchasePrice: prop.purchasePrice || 0,
        purchaseDate: prop.purchaseDate || '2023-01-01',
        rehabCosts: prop.rehabCosts || 0,
        totalInvestment: prop.totalInvestment || prop.purchasePrice || 0,
        currentValue: prop.currentValue || 0,
        grossRent: prop.grossRent || 0,
        netRent: prop.netRent || 0,
        expenses: prop.expenses || 0,
        noi: prop.noi || 0,
        cashFlow: prop.cashFlow || 0,
        capRate: prop.capRate || 0,
        cocReturn: prop.cocReturn || 0,
        annualizedReturn: prop.annualizedReturn || 0,
        equityCreated: prop.equityCreated || 0,
        status: prop.status || 'Active',
        propertyType: prop.propertyType || 'Multifamily',
        strategy: prop.strategy || 'Buy & Hold',
        entityId: prop.entityId
      }));
      setProperties(transformedProperties);
    }
  }, [propertiesData]);

  // Function to assign property to entity
  const assignPropertyToEntity = (propertyId: number, entityId: string | null) => {
    setProperties(prev => prev.map(property => 
      property.id === propertyId 
        ? { ...property, entityId: entityId || undefined }
        : property
    ));
  };

  // Calculate portfolio KPIs
  const calculateKPIs = () => {
    const totalAUM = properties.reduce((sum, prop) => sum + prop.currentValue, 0);
    const totalUnits = properties.reduce((sum, prop) => sum + prop.units, 0);
    const totalProperties = properties.length;
    const totalMonthlyRent = properties.reduce((sum, prop) => sum + prop.grossRent, 0);
    const totalMonthlyCashFlow = properties.reduce((sum, prop) => sum + prop.cashFlow, 0);
    const totalEquity = properties.reduce((sum, prop) => sum + prop.equityCreated, 0);
    const avgCapRate = properties.length > 0 ? properties.reduce((sum, prop) => sum + prop.capRate, 0) / properties.length : 0;
    
    return {
      totalAUM,
      totalUnits,
      totalProperties,
      totalMonthlyRent,
      totalMonthlyCashFlow,
      totalEquity,
      avgCapRate,
      pricePerUnit: totalUnits > 0 ? totalAUM / totalUnits : 0
    };
  };

  const kpis = calculateKPIs();

  // Calculate financial statements
  const calculateBalanceSheet = (): BalanceSheetData => {
    const totalPropertyValue = properties.reduce((sum, prop) => sum + prop.currentValue, 0);
    const estimatedDebt = properties.reduce((sum, prop) => sum + (prop.currentValue * 0.75), 0); // Assume 75% LTV
    const ownerEquity = totalPropertyValue - estimatedDebt;

    return {
      assets: {
        totalPropertyValue,
        cashAndEquivalents: 285000, // From entity cash balances
        otherAssets: 50000
      },
      liabilities: {
        mortgageDebt: estimatedDebt,
        otherLiabilities: 25000
      },
      equity: {
        ownerEquity,
        retainedEarnings: kpis.totalMonthlyCashFlow * 12 * 2 // 2 years of retained cash flow
      }
    };
  };

  const calculateIncomeStatement = (): IncomeStatementData => {
    const rentalIncome = properties.reduce((sum, prop) => sum + prop.grossRent * 12, 0);
    const operatingExpenses = properties.reduce((sum, prop) => sum + prop.expenses * 12, 0);
    const interestExpense = calculateBalanceSheet().liabilities.mortgageDebt * 0.05; // Assume 5% interest
    const depreciation = properties.reduce((sum, prop) => sum + prop.currentValue * 0.0364, 0); // 3.64% depreciation
    const netIncome = rentalIncome - operatingExpenses - interestExpense - depreciation;

    return {
      revenue: {
        rentalIncome,
        otherIncome: 15000
      },
      expenses: {
        operatingExpenses,
        interestExpense,
        depreciation,
        otherExpenses: 10000
      },
      netIncome
    };
  };

  const calculateCashFlowStatement = (): CashFlowStatementData => {
    const incomeStatement = calculateIncomeStatement();
    const totalAcquisitions = properties.reduce((sum, prop) => sum + prop.purchasePrice, 0);

    return {
      operatingActivities: {
        netIncome: incomeStatement.netIncome,
        depreciation: incomeStatement.expenses.depreciation,
        changesInWorkingCapital: -15000
      },
      investingActivities: {
        propertyAcquisitions: -totalAcquisitions,
        capitalImprovements: -properties.reduce((sum, prop) => sum + prop.rehabCosts, 0),
        dispositions: 0
      },
      financingActivities: {
        debtProceeds: calculateBalanceSheet().liabilities.mortgageDebt,
        debtPayments: -50000,
        ownerContributions: 500000
      }
    };
  };

  const balanceSheet = calculateBalanceSheet();
  const incomeStatement = calculateIncomeStatement();
  const cashFlowStatement = calculateCashFlowStatement();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'Rehab': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'Under Contract': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'Sold': return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600 dark:text-gray-400">Loading properties...</div>
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
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div className="text-center">
            <div className="text-white/80 text-sm font-medium">Total AUM</div>
            <div className="text-2xl font-bold text-white">{formatCurrency(kpis.totalAUM)}</div>
          </div>
          <div className="text-center">
            <div className="text-white/80 text-sm font-medium">Properties</div>
            <div className="text-2xl font-bold text-white">{kpis.totalProperties}</div>
          </div>
          <div className="text-center">
            <div className="text-white/80 text-sm font-medium">Total Units</div>
            <div className="text-2xl font-bold text-white">{kpis.totalUnits}</div>
          </div>
          <div className="text-center">
            <div className="text-white/80 text-sm font-medium">Price/Unit</div>
            <div className="text-2xl font-bold text-white">{formatCurrency(kpis.pricePerUnit)}</div>
          </div>
          <div className="text-center">
            <div className="text-white/80 text-sm font-medium">Monthly Rent</div>
            <div className="text-2xl font-bold text-white">{formatCurrency(kpis.totalMonthlyRent)}</div>
          </div>
          <div className="text-center">
            <div className="text-white/80 text-sm font-medium">Cash Flow</div>
            <div className="text-2xl font-bold text-white">{formatCurrency(kpis.totalMonthlyCashFlow)}</div>
          </div>
          <div className="text-center">
            <div className="text-white/80 text-sm font-medium">Avg Cap Rate</div>
            <div className="text-2xl font-bold text-white">{formatPercent(kpis.avgCapRate)}</div>
          </div>
        </div>
      </div>

      {/* Financial Statements */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'balance', label: 'Balance Sheet', icon: BarChart3 },
              { id: 'income', label: 'Income Statement', icon: TrendingUp },
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
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Balance Sheet</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Assets */}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Assets</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">Real Estate Properties</span>
                      <span className="font-semibold text-blue-600">{formatCurrency(balanceSheet.assets.totalPropertyValue)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">Cash & Equivalents</span>
                      <span className="font-semibold">{formatCurrency(balanceSheet.assets.cashAndEquivalents)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">Other Assets</span>
                      <span className="font-semibold">{formatCurrency(balanceSheet.assets.otherAssets)}</span>
                    </div>
                    <div className="flex justify-between py-3 border-t-2 border-gray-200 dark:border-gray-600 font-bold">
                      <span className="text-gray-900 dark:text-white">Total Assets</span>
                      <span className="text-blue-600">{formatCurrency(
                        balanceSheet.assets.totalPropertyValue + 
                        balanceSheet.assets.cashAndEquivalents + 
                        balanceSheet.assets.otherAssets
                      )}</span>
                    </div>
                  </div>
                </div>

                {/* Liabilities & Equity */}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Liabilities & Equity</h4>
                  <div className="space-y-3 mb-6">
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Liabilities</h5>
                    <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">Mortgage Debt</span>
                      <span className="font-semibold text-red-600">{formatCurrency(balanceSheet.liabilities.mortgageDebt)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">Other Liabilities</span>
                      <span className="font-semibold">{formatCurrency(balanceSheet.liabilities.otherLiabilities)}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Equity</h5>
                    <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">Owner Equity</span>
                      <span className="font-semibold text-green-600">{formatCurrency(balanceSheet.equity.ownerEquity)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">Retained Earnings</span>
                      <span className="font-semibold">{formatCurrency(balanceSheet.equity.retainedEarnings)}</span>
                    </div>
                    <div className="flex justify-between py-3 border-t-2 border-gray-200 dark:border-gray-600 font-bold">
                      <span className="text-gray-900 dark:text-white">Total Liabilities & Equity</span>
                      <span className="text-green-600">{formatCurrency(
                        balanceSheet.liabilities.mortgageDebt + 
                        balanceSheet.liabilities.otherLiabilities +
                        balanceSheet.equity.ownerEquity + 
                        balanceSheet.equity.retainedEarnings
                      )}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'income' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Income Statement</h3>
              <div className="max-w-2xl">
                <div className="space-y-4">
                  {/* Revenue */}
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Revenue</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                        <span className="text-gray-600 dark:text-gray-400">Rental Income</span>
                        <span className="font-semibold text-green-600">{formatCurrency(incomeStatement.revenue.rentalIncome)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                        <span className="text-gray-600 dark:text-gray-400">Other Income</span>
                        <span className="font-semibold">{formatCurrency(incomeStatement.revenue.otherIncome)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b-2 border-gray-200 dark:border-gray-600 font-semibold">
                        <span className="text-gray-900 dark:text-white">Total Revenue</span>
                        <span className="text-green-600">{formatCurrency(
                          incomeStatement.revenue.rentalIncome + incomeStatement.revenue.otherIncome
                        )}</span>
                      </div>
                    </div>
                  </div>

                  {/* Expenses */}
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Expenses</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                        <span className="text-gray-600 dark:text-gray-400">Operating Expenses</span>
                        <span className="font-semibold text-red-600">{formatCurrency(incomeStatement.expenses.operatingExpenses)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                        <span className="text-gray-600 dark:text-gray-400">Interest Expense</span>
                        <span className="font-semibold">{formatCurrency(incomeStatement.expenses.interestExpense)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                        <span className="text-gray-600 dark:text-gray-400">Depreciation</span>
                        <span className="font-semibold">{formatCurrency(incomeStatement.expenses.depreciation)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                        <span className="text-gray-600 dark:text-gray-400">Other Expenses</span>
                        <span className="font-semibold">{formatCurrency(incomeStatement.expenses.otherExpenses)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b-2 border-gray-200 dark:border-gray-600 font-semibold">
                        <span className="text-gray-900 dark:text-white">Total Expenses</span>
                        <span className="text-red-600">{formatCurrency(
                          incomeStatement.expenses.operatingExpenses + 
                          incomeStatement.expenses.interestExpense + 
                          incomeStatement.expenses.depreciation + 
                          incomeStatement.expenses.otherExpenses
                        )}</span>
                      </div>
                    </div>
                  </div>

                  {/* Net Income */}
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">Net Income</span>
                      <span className={`text-lg font-bold ${incomeStatement.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(incomeStatement.netIncome)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cashflow' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Cash Flow Statement</h3>
              <div className="max-w-2xl space-y-6">
                {/* Operating Activities */}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Operating Activities</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">Net Income</span>
                      <span className="font-semibold">{formatCurrency(cashFlowStatement.operatingActivities.netIncome)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">Depreciation</span>
                      <span className="font-semibold">{formatCurrency(cashFlowStatement.operatingActivities.depreciation)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">Changes in Working Capital</span>
                      <span className="font-semibold">{formatCurrency(cashFlowStatement.operatingActivities.changesInWorkingCapital)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b-2 border-gray-200 dark:border-gray-600 font-semibold">
                      <span className="text-gray-900 dark:text-white">Net Cash from Operations</span>
                      <span className="text-blue-600">{formatCurrency(
                        cashFlowStatement.operatingActivities.netIncome + 
                        cashFlowStatement.operatingActivities.depreciation + 
                        cashFlowStatement.operatingActivities.changesInWorkingCapital
                      )}</span>
                    </div>
                  </div>
                </div>

                {/* Investing Activities */}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Investing Activities</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">Property Acquisitions</span>
                      <span className="font-semibold text-red-600">{formatCurrency(cashFlowStatement.investingActivities.propertyAcquisitions)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">Capital Improvements</span>
                      <span className="font-semibold">{formatCurrency(cashFlowStatement.investingActivities.capitalImprovements)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">Dispositions</span>
                      <span className="font-semibold">{formatCurrency(cashFlowStatement.investingActivities.dispositions)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b-2 border-gray-200 dark:border-gray-600 font-semibold">
                      <span className="text-gray-900 dark:text-white">Net Cash from Investing</span>
                      <span className="text-red-600">{formatCurrency(
                        cashFlowStatement.investingActivities.propertyAcquisitions + 
                        cashFlowStatement.investingActivities.capitalImprovements + 
                        cashFlowStatement.investingActivities.dispositions
                      )}</span>
                    </div>
                  </div>
                </div>

                {/* Financing Activities */}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Financing Activities</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">Debt Proceeds</span>
                      <span className="font-semibold text-green-600">{formatCurrency(cashFlowStatement.financingActivities.debtProceeds)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">Debt Payments</span>
                      <span className="font-semibold">{formatCurrency(cashFlowStatement.financingActivities.debtPayments)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">Owner Contributions</span>
                      <span className="font-semibold">{formatCurrency(cashFlowStatement.financingActivities.ownerContributions)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b-2 border-gray-200 dark:border-gray-600 font-semibold">
                      <span className="text-gray-900 dark:text-white">Net Cash from Financing</span>
                      <span className="text-green-600">{formatCurrency(
                        cashFlowStatement.financingActivities.debtProceeds + 
                        cashFlowStatement.financingActivities.debtPayments + 
                        cashFlowStatement.financingActivities.ownerContributions
                      )}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Property Cards */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Property Portfolio</h2>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {properties.length} properties • {kpis.totalUnits} total units
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <div key={property.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:shadow-md transition-shadow">
              {/* Property Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-1">{property.address}</h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <MapPin className="h-3 w-3" />
                    <span>{property.city}, {property.state}</span>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(property.status)}`}>
                  {property.status}
                </span>
              </div>

              {/* Property Metrics */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">Units</div>
                  <div className="text-lg font-bold text-blue-700 dark:text-blue-300">{property.units}</div>
                </div>
                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-xs text-green-600 dark:text-green-400 font-medium">Cap Rate</div>
                  <div className="text-lg font-bold text-green-700 dark:text-green-300">{formatPercent(property.capRate)}</div>
                </div>
              </div>

              {/* Financial Details */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Purchase Price:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(property.purchasePrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Current Value:</span>
                  <span className="font-semibold text-blue-600">{formatCurrency(property.currentValue)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Monthly Rent:</span>
                  <span className="font-semibold text-green-600">{formatCurrency(property.grossRent)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Cash Flow:</span>
                  <span className={`font-semibold ${property.cashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(property.cashFlow)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">CoC Return:</span>
                  <span className="font-semibold text-purple-600">{formatPercent(property.cocReturn)}</span>
                </div>
              </div>

              {/* Property Type & Strategy */}
              <div className="flex items-center justify-between text-xs mb-4">
                <div className="flex items-center space-x-1">
                  <Building className="h-3 w-3 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">{property.propertyType}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Target className="h-3 w-3 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">{property.strategy}</span>
                </div>
              </div>

              {/* Entity Assignment */}
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Assigned Entity
                </label>
                <select
                  value={property.entityId || ''}
                  onChange={(e) => assignPropertyToEntity(property.id, e.target.value || null)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Unassigned</option>
                  {entities.map((entity) => (
                    <option key={entity.id} value={entity.id}>
                      {entity.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}