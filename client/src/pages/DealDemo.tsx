import React, { useState, useEffect } from 'react';
import { 
  Building, 
  Calculator, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  Edit,
  Users,
  Calendar,
  Home,
  Wrench
} from 'lucide-react';

export default function DealDemo() {
  const [dealData, setDealData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [editingAssumptions, setEditingAssumptions] = useState(false);
  const [assumptions, setAssumptions] = useState<any>({});

  useEffect(() => {
    const fetchDeal = async () => {
      try {
        const response = await fetch('/api/deals/1');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setDealData(data);
        
        // Initialize assumptions with deal data
        setAssumptions({
          marketCapRate: data.deal.marketCapRate,
          exitCapRate: data.deal.exitCapRate,
          vacancyRate: data.deal.vacancyRate,
          badDebtRate: data.deal.badDebtRate,
          annualRentGrowth: data.deal.annualRentGrowth,
          annualExpenseInflation: data.deal.annualExpenseInflation,
          capexReservePerUnit: data.deal.capexReservePerUnit,
          operatingReserveMonths: data.deal.operatingReserveMonths,
          projectedRefiMonth: data.deal.projectedRefiMonth
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load deal');
      } finally {
        setLoading(false);
      }
    };

    fetchDeal();
  }, []);

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
      maximumFractionDigits: 2,
    }).format(value || 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !dealData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Failed to load deal</h3>
          <p className="text-gray-600">{error || 'Please try refreshing the page'}</p>
        </div>
      </div>
    );
  }

  const { deal, kpis } = dealData;

  const updateAssumption = (key: string, value: string) => {
    setAssumptions((prev: any) => ({
      ...prev,
      [key]: parseFloat(value) || value
    }));
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Building },
    { id: 'rentroll', label: 'Rent Roll', icon: Users },
    { id: 'income', label: 'Income & Expense', icon: DollarSign },
    { id: 'proforma', label: '12 Month Proforma', icon: Calendar },
    { id: 'rehab', label: 'Rehab Budget', icon: Wrench }
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{deal.name}</h1>
          <p className="text-lg text-gray-600">
            {deal.address}, {deal.city}, {deal.state}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            deal.status === 'active' ? 'bg-green-100 text-green-800' :
            deal.status === 'underwriting' ? 'bg-blue-100 text-blue-800' :
            deal.status === 'closed' ? 'bg-gray-100 text-gray-800' : 'bg-red-100 text-red-800'
          }`}>
            {deal.status}
          </span>
          <button
            onClick={() => setEditingAssumptions(!editingAssumptions)}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 ${
              editingAssumptions 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Edit className="h-4 w-4" />
            <span>{editingAssumptions ? 'Save Changes' : 'Edit Assumptions'}</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Main Content */}
        <div className="col-span-8">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Investment Metrics */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Key Investment Metrics</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Purchase Price</label>
                    <p className="text-2xl font-bold">{formatCurrency(Number(deal.purchasePrice))}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">All-In Cost</label>
                    <p className="text-2xl font-bold">{formatCurrency(kpis.allInCost)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">ARV</label>
                    <p className="text-2xl font-bold">{formatCurrency(kpis.arv)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Total Rehab</label>
                    <p className="text-2xl font-bold">{formatCurrency(kpis.totalRehab)}</p>
                  </div>
                </div>
              </div>

              {/* Return Metrics */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Return Analysis</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Cash-on-Cash Return</label>
                    <p className={`text-2xl font-bold ${
                      (kpis.cashOnCashReturn || 0) > 0.12 ? "text-green-600" : 
                      (kpis.cashOnCashReturn || 0) > 0.08 ? "text-yellow-600" : "text-red-600"
                    }`}>
                      {formatPercent(kpis.cashOnCashReturn)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">IRR (5-year)</label>
                    <p className={`text-2xl font-bold ${
                      (kpis.irr || 0) > 0.15 ? "text-green-600" : 
                      (kpis.irr || 0) > 0.10 ? "text-yellow-600" : "text-red-600"
                    }`}>
                      {formatPercent(kpis.irr)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Cap Rate</label>
                    <p className="text-2xl font-bold">{formatPercent(kpis.capRate)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Cash Flow</label>
                    <p className={`text-2xl font-bold ${
                      (kpis.cashFlow || 0) > 0 ? "text-green-600" : "text-red-600"
                    }`}>
                      {formatCurrency(kpis.cashFlow)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Editable Assumptions */}
              {editingAssumptions && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h2 className="text-lg font-semibold mb-4">Investment Assumptions</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Market Cap Rate</label>
                      <input
                        type="number"
                        step="0.001"
                        value={(assumptions.marketCapRate * 100).toFixed(2)}
                        onChange={(e) => updateAssumption('marketCapRate', (parseFloat(e.target.value) / 100).toString())}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Exit Cap Rate</label>
                      <input
                        type="number"
                        step="0.001"
                        value={(assumptions.exitCapRate * 100).toFixed(2)}
                        onChange={(e) => updateAssumption('exitCapRate', (parseFloat(e.target.value) / 100).toString())}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Vacancy Rate (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={(assumptions.vacancyRate * 100).toFixed(1)}
                        onChange={(e) => updateAssumption('vacancyRate', (parseFloat(e.target.value) / 100).toString())}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bad Debt Rate (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={(assumptions.badDebtRate * 100).toFixed(1)}
                        onChange={(e) => updateAssumption('badDebtRate', (parseFloat(e.target.value) / 100).toString())}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Annual Rent Growth (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={(assumptions.annualRentGrowth * 100).toFixed(1)}
                        onChange={(e) => updateAssumption('annualRentGrowth', (parseFloat(e.target.value) / 100).toString())}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Hold Period (Months)</label>
                      <input
                        type="number"
                        value={assumptions.projectedRefiMonth}
                        onChange={(e) => updateAssumption('projectedRefiMonth', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Rent Roll Tab */}
          {activeTab === 'rentroll' && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Unit Rent Roll</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lease Start</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lease End</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Rent</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Market Rent</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dealData.units.map((unit: any) => (
                      <tr key={unit.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{unit.unitNumber}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {unit.isOccupied ? 'Tenant Name' : 'Vacant'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {unit.isOccupied ? '01/15/2024' : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {unit.isOccupied ? '01/15/2025' : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(Number(unit.currentRent))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(Number(unit.marketRent))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            unit.isOccupied 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {unit.isOccupied ? 'Occupied' : 'Vacant'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Income & Expense Tab */}
          {activeTab === 'income' && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Monthly Income</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Gross Rental Income</span>
                    <span className="font-semibold">{formatCurrency(kpis.grossRentalIncome / 12)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Other Income</span>
                    <span className="font-semibold">{formatCurrency(kpis.totalOtherIncome / 12)}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between items-center font-bold">
                    <span>Total Income</span>
                    <span>{formatCurrency((kpis.grossRentalIncome + kpis.totalOtherIncome) / 12)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Monthly Expenses</h2>
                <div className="space-y-3">
                  {dealData.expenses.map((expense: any) => (
                    <div key={expense.id} className="flex justify-between items-center">
                      <span className="text-gray-600">{expense.category}</span>
                      <span className="font-semibold">
                        {expense.isPercentOfRent 
                          ? `${(parseFloat(expense.percentage) * 100).toFixed(1)}% (${formatCurrency((kpis.grossRentalIncome * parseFloat(expense.percentage)) / 12)})`
                          : formatCurrency(Number(expense.monthlyAmount))
                        }
                      </span>
                    </div>
                  ))}
                  <div className="border-t pt-3 flex justify-between items-center font-bold">
                    <span>Total Expenses</span>
                    <span>{formatCurrency(kpis.totalOperatingExpenses / 12)}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between items-center font-bold text-lg">
                    <span>Net Operating Income</span>
                    <span className="text-green-600">{formatCurrency(kpis.netOperatingIncome / 12)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Proforma Tab */}
          {activeTab === 'proforma' && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">12-Month Cash Flow Proforma</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gross Income</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expenses</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">NOI</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Debt Service</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cash Flow</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Array.from({ length: 12 }, (_, i) => {
                      const monthlyIncome = (kpis.grossRentalIncome + kpis.totalOtherIncome) / 12;
                      const monthlyExpenses = kpis.totalOperatingExpenses / 12;
                      const monthlyNOI = kpis.netOperatingIncome / 12;
                      const monthlyDebtService = kpis.monthlyDebtService;
                      const monthlyCashFlow = monthlyNOI - monthlyDebtService;
                      
                      return (
                        <tr key={i}>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {new Date(2024, i).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(monthlyIncome)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(monthlyExpenses)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(monthlyNOI)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(monthlyDebtService)}
                          </td>
                          <td className={`px-4 py-4 whitespace-nowrap text-sm font-semibold ${
                            monthlyCashFlow > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(monthlyCashFlow)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Rehab Tab */}
          {activeTab === 'rehab' && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Rehab Budget Detail</h2>
              <div className="space-y-4">
                {dealData.rehabItems.map((item: any, index: number) => (
                  <div key={item.id || index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-lg">{item.category}</h3>
                        <p className="text-gray-600 mt-1">{item.description}</p>
                        <div className="mt-2 flex items-center space-x-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            item.bidStatus === 'contracted' ? 'bg-green-100 text-green-800' :
                            item.bidStatus === 'bid_received' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {item.bidStatus.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{formatCurrency(Number(item.totalCost))}</p>
                        <p className="text-sm text-gray-500">{formatCurrency(Number(item.totalCost) / deal.units)} per unit</p>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="border-t-2 border-gray-300 pt-4 flex justify-between items-center">
                  <span className="text-xl font-bold">Total Rehab Budget</span>
                  <span className="text-2xl font-bold text-blue-600">{formatCurrency(kpis.totalRehab)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* KPI Panel */}
        <div className="col-span-4">
          <div className="sticky top-6 space-y-4">
            {/* Key Metrics */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Calculator className="h-5 w-5 mr-2" />
                Key Metrics
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">ARV</label>
                    <p className="text-lg font-semibold">{formatCurrency(kpis.arv)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">All-In Cost</label>
                    <p className="text-lg font-semibold">{formatCurrency(kpis.allInCost)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Cash Flow</label>
                    <p className={`text-lg font-semibold ${
                      (kpis.cashFlow || 0) > 0 ? "text-green-600" : "text-red-600"
                    }`}>
                      {formatCurrency(kpis.cashFlow)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Cash-on-Cash</label>
                    <p className={`text-lg font-semibold ${
                      (kpis.cashOnCashReturn || 0) > 0.12 ? "text-green-600" : 
                      (kpis.cashOnCashReturn || 0) > 0.08 ? "text-yellow-600" : "text-red-600"
                    }`}>
                      {formatPercent(kpis.cashOnCashReturn)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Returns */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Returns Analysis
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">IRR (5-year)</span>
                  <span className={`font-semibold ${
                    (kpis.irr || 0) > 0.15 ? "text-green-600" : 
                    (kpis.irr || 0) > 0.10 ? "text-yellow-600" : "text-red-600"
                  }`}>
                    {formatPercent(kpis.irr)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Equity Multiple</span>
                  <span className="font-semibold">{(kpis.equityMultiple || 0).toFixed(2)}x</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Cap Rate</span>
                  <span className="font-semibold">{formatPercent(kpis.capRate)}</span>
                </div>
              </div>
            </div>

            {/* Risk Metrics */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Risk Assessment</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">DSCR</span>
                  <div className="flex items-center space-x-2">
                    <span className={`font-semibold ${
                      (kpis.dscr || 0) >= 1.25 ? "text-green-600" : 
                      (kpis.dscr || 0) >= 1.15 ? "text-yellow-600" : "text-red-600"
                    }`}>
                      {(kpis.dscr || 0).toFixed(2)}x
                    </span>
                    {(kpis.dscr || 0) >= 1.25 ? (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Low Risk</span>
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Break-even Occ.</span>
                  <span className={`font-semibold ${
                    (kpis.breakEvenOccupancy || 0) <= 0.80 ? "text-green-600" : 
                    (kpis.breakEvenOccupancy || 0) <= 0.90 ? "text-yellow-600" : "text-red-600"
                  }`}>
                    {formatPercent(kpis.breakEvenOccupancy)}
                  </span>
                </div>
              </div>
            </div>

            {/* Refinance Projection */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Refinance Projection
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">New Loan Amount</span>
                  <span className="font-semibold">
                    {formatCurrency(kpis.newLoanAmount)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Cash Out</span>
                  <span className={`font-semibold ${
                    (kpis.cashOut || 0) > 0 ? "text-green-600" : "text-gray-600"
                  }`}>
                    {formatCurrency(kpis.cashOut)}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t pt-3">
                  <span className="text-sm font-medium">Total Profit</span>
                  <span className={`text-lg font-bold ${
                    (kpis.totalProfit || 0) > 0 ? "text-green-600" : "text-red-600"
                  }`}>
                    {formatCurrency(kpis.totalProfit)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}