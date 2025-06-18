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
  const [editingRentRoll, setEditingRentRoll] = useState(false);
  const [editingIncome, setEditingIncome] = useState(false);
  const [editingExpenses, setEditingExpenses] = useState(false);
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
          purchasePrice: Number(data.deal.purchasePrice),
          units: data.deal.units,
          ltcPercentage: 0.80, // Default 80% LTC
          marketCapRate: data.deal.marketCapRate,
          exitCapRate: data.deal.exitCapRate,
          refinanceLTV: 0.75, // Default 75% refinance LTV
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

  // Calculate derived values from assumptions
  const calculateDerivedValues = () => {
    const purchasePrice = assumptions.purchasePrice || Number(deal.purchasePrice);
    const ltcPercentage = assumptions.ltcPercentage || 0.80;
    const refinanceLTV = assumptions.refinanceLTV || 0.75;
    
    const purchaseLoanAmount = purchasePrice * ltcPercentage;
    const downPayment = purchasePrice * (1 - ltcPercentage);
    const refinanceLoanAmount = kpis.arv * refinanceLTV;
    const cashOut = Math.max(0, refinanceLoanAmount - purchaseLoanAmount);
    const totalProfit = cashOut + (kpis.cashFlow * (assumptions.projectedRefiMonth / 12)) + (kpis.arv - kpis.allInCost);
    
    return {
      purchaseLoanAmount,
      downPayment,
      refinanceLoanAmount,
      cashOut,
      totalProfit
    };
  };

  const derivedValues = calculateDerivedValues();

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Building },
    { id: 'rentroll', label: 'Rent Roll', icon: Users },
    { id: 'income', label: 'Income & Expense', icon: DollarSign },
    { id: 'proforma', label: '12 Month Proforma', icon: Calendar },
    { id: 'rehab', label: 'Rehab Budget', icon: Wrench },
    { id: 'loans', label: 'Loans', icon: Calculator }
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
                    <p className="text-2xl font-bold">{formatCurrency(assumptions.purchasePrice || Number(deal.purchasePrice))}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Down Payment</label>
                    <p className="text-2xl font-bold">{formatCurrency(derivedValues.downPayment)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Purchase Loan</label>
                    <p className="text-2xl font-bold">{formatCurrency(derivedValues.purchaseLoanAmount)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Total Rehab</label>
                    <p className="text-2xl font-bold">{formatCurrency(kpis.totalRehab)}</p>
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
                    <label className="text-sm font-medium text-gray-600">Refinance Loan</label>
                    <p className="text-2xl font-bold">{formatCurrency(derivedValues.refinanceLoanAmount)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Cash Out</label>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(derivedValues.cashOut)}</p>
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
                  
                  {/* Primary Deal Parameters */}
                  <div className="mb-6">
                    <h3 className="text-md font-medium text-gray-800 mb-3">Deal Parameters</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price</label>
                        <input
                          type="number"
                          value={assumptions.purchasePrice || Number(deal.purchasePrice)}
                          onChange={(e) => updateAssumption('purchasePrice', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Unit Count</label>
                        <input
                          type="number"
                          value={assumptions.units || deal.units}
                          onChange={(e) => updateAssumption('units', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">LTC (%)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={(assumptions.ltcPercentage * 100).toFixed(1)}
                          onChange={(e) => updateAssumption('ltcPercentage', (parseFloat(e.target.value) / 100).toString())}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Refinance LTV (%)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={(assumptions.refinanceLTV * 100).toFixed(1)}
                          onChange={(e) => updateAssumption('refinanceLTV', (parseFloat(e.target.value) / 100).toString())}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Cap Rates */}
                  <div className="mb-6">
                    <h3 className="text-md font-medium text-gray-800 mb-3">Cap Rates</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Market Cap Rate (%)</label>
                        <input
                          type="number"
                          step="0.001"
                          value={(assumptions.marketCapRate * 100).toFixed(3)}
                          onChange={(e) => updateAssumption('marketCapRate', (parseFloat(e.target.value) / 100).toString())}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Exit Cap Rate (%)</label>
                        <input
                          type="number"
                          step="0.001"
                          value={(assumptions.exitCapRate * 100).toFixed(3)}
                          onChange={(e) => updateAssumption('exitCapRate', (parseFloat(e.target.value) / 100).toString())}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Operating Assumptions */}
                  <div>
                    <h3 className="text-md font-medium text-gray-800 mb-3">Operating Assumptions</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

                  {/* Calculated Values Display */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="text-md font-medium text-gray-800 mb-3">Calculated Values</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gray-50 p-3 rounded">
                        <label className="block text-sm font-medium text-gray-600">Down Payment</label>
                        <p className="text-lg font-bold">{formatCurrency(derivedValues.downPayment)}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <label className="block text-sm font-medium text-gray-600">Purchase Loan</label>
                        <p className="text-lg font-bold">{formatCurrency(derivedValues.purchaseLoanAmount)}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <label className="block text-sm font-medium text-gray-600">Refinance Loan</label>
                        <p className="text-lg font-bold">{formatCurrency(derivedValues.refinanceLoanAmount)}</p>
                      </div>
                      <div className="bg-green-50 p-3 rounded">
                        <label className="block text-sm font-medium text-gray-600">Total Profit</label>
                        <p className="text-lg font-bold text-green-600">{formatCurrency(derivedValues.totalProfit)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Rent Roll Tab */}
          {activeTab === 'rentroll' && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Unit Rent Roll</h2>
                <button 
                  onClick={() => setEditingRentRoll(!editingRentRoll)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    editingRentRoll 
                      ? 'bg-green-600 text-white hover:bg-green-700' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {editingRentRoll ? 'Save Changes' : 'Edit Rent Roll'}
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenant Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lease Start</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lease End</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Rent</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Market Rent</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Array.from({ length: assumptions.units || deal.units }, (_, index) => {
                      const unit = dealData.units[index] || {};
                      return (
                        <tr key={index}>
                          <td className="px-4 py-3">
                            {editingRentRoll ? (
                              <input
                                type="text"
                                defaultValue={unit.unitNumber || `Unit ${index + 1}`}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            ) : (
                              <span className="text-sm font-medium">{unit.unitNumber || `Unit ${index + 1}`}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {editingRentRoll ? (
                              <input
                                type="text"
                                defaultValue={unit.isOccupied ? 'Tenant Name' : ''}
                                placeholder="Tenant name"
                                className="w-32 px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            ) : (
                              <span className="text-sm">{unit.isOccupied ? 'Tenant Name' : 'Vacant'}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {editingRentRoll ? (
                              <input
                                type="date"
                                defaultValue={unit.isOccupied ? '2024-01-15' : ''}
                                className="w-32 px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            ) : (
                              <span className="text-sm">{unit.isOccupied ? '01/15/2024' : '-'}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {editingRentRoll ? (
                              <input
                                type="date"
                                defaultValue={unit.isOccupied ? '2025-01-15' : ''}
                                className="w-32 px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            ) : (
                              <span className="text-sm">{unit.isOccupied ? '01/15/2025' : '-'}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {editingRentRoll ? (
                              <input
                                type="number"
                                defaultValue={Number(unit.currentRent) || 1200}
                                className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            ) : (
                              <span className="text-sm font-medium">{formatCurrency(Number(unit.currentRent) || 1200)}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {editingRentRoll ? (
                              <input
                                type="number"
                                defaultValue={Number(unit.marketRent) || 1300}
                                className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            ) : (
                              <span className="text-sm font-medium">{formatCurrency(Number(unit.marketRent) || 1300)}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {editingRentRoll ? (
                              <select
                                defaultValue={unit.isOccupied ? 'occupied' : 'vacant'}
                                className="px-2 py-1 border border-gray-300 rounded text-sm"
                              >
                                <option value="occupied">Occupied</option>
                                <option value="vacant">Vacant</option>
                              </select>
                            ) : (
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                unit.isOccupied 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {unit.isOccupied ? 'Occupied' : 'Vacant'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Income & Expense Tab */}
          {activeTab === 'income' && (
            <div className="space-y-6">
              {/* Income Section */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Income</h2>
                  <button 
                    onClick={() => setEditingIncome(!editingIncome)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      editingIncome 
                        ? 'bg-green-600 text-white hover:bg-green-700' 
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {editingIncome ? 'Save Changes' : 'Edit Income'}
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Monthly</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proforma Monthly</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {/* Fixed Rental Income Row */}
                      <tr className="bg-blue-50">
                        <td className="px-4 py-3">
                          <span className="text-sm font-semibold text-blue-800">Rental Income</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-blue-600">Total from rent roll</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-bold text-blue-800">{formatCurrency(kpis.grossRentalIncome / 12)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-bold text-blue-800">
                            {formatCurrency(
                              dealData.units.reduce((sum: number, unit: any) => 
                                sum + Number(unit.marketRent || 1300), 0
                              )
                            )}
                          </span>
                        </td>
                      </tr>
                      
                      {/* Other Income Rows */}
                      {dealData.otherIncome.map((income: any, index: number) => (
                        <tr key={income.id || index}>
                          <td className="px-4 py-3">
                            {editingIncome ? (
                              <input
                                type="text"
                                defaultValue={income.category}
                                placeholder="Income category"
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                              />
                            ) : (
                              <span className="text-sm">{income.category}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {editingIncome ? (
                              <input
                                type="text"
                                defaultValue={income.description}
                                placeholder="Description"
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                              />
                            ) : (
                              <span className="text-sm">{income.description}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {editingIncome ? (
                              <input
                                type="number"
                                defaultValue={Number(income.monthlyAmount)}
                                placeholder="Current amount"
                                className="w-24 px-3 py-2 border border-gray-300 rounded text-sm"
                              />
                            ) : (
                              <span className="text-sm font-medium">{formatCurrency(Number(income.monthlyAmount))}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {editingIncome ? (
                              <input
                                type="number"
                                defaultValue={Number(income.monthlyAmount)}
                                placeholder="Proforma amount"
                                className="w-24 px-3 py-2 border border-gray-300 rounded text-sm"
                              />
                            ) : (
                              <span className="text-sm font-medium">{formatCurrency(Number(income.monthlyAmount))}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      
                      <tr className="bg-green-100 font-bold">
                        <td className="px-4 py-3" colSpan={2}>
                          <span className="text-sm font-bold">Total Income</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-bold text-green-600">
                            {formatCurrency((kpis.grossRentalIncome + kpis.totalOtherIncome) / 12)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-bold text-green-600">
                            {formatCurrency(
                              dealData.units.reduce((sum: number, unit: any) => 
                                sum + Number(unit.marketRent || 1300), 0
                              ) + (kpis.totalOtherIncome / 12)
                            )}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Expenses Section */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Operating Expenses</h2>
                  <button 
                    onClick={() => setEditingExpenses(!editingExpenses)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      editingExpenses 
                        ? 'bg-green-600 text-white hover:bg-green-700' 
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {editingExpenses ? 'Save Changes' : 'Edit Expenses'}
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Monthly</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proforma Monthly</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {dealData.expenses.map((expense: any, index: number) => (
                        <tr key={expense.id || index}>
                          <td className="px-4 py-3">
                            {editingExpenses ? (
                              <input
                                type="text"
                                defaultValue={expense.category}
                                placeholder="Expense category"
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                              />
                            ) : (
                              <span className="text-sm">{expense.category}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {editingExpenses ? (
                              <input
                                type="text"
                                defaultValue={expense.description}
                                placeholder="Description"
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                              />
                            ) : (
                              <span className="text-sm">{expense.description}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {editingExpenses ? (
                              <input
                                type="number"
                                defaultValue={expense.isPercentOfRent 
                                  ? (kpis.grossRentalIncome * parseFloat(expense.percentage) / 12).toFixed(0)
                                  : Number(expense.monthlyAmount)
                                }
                                placeholder="Current amount"
                                className="w-24 px-3 py-2 border border-gray-300 rounded text-sm"
                              />
                            ) : (
                              <span className="text-sm font-medium">
                                {expense.isPercentOfRent 
                                  ? formatCurrency((kpis.grossRentalIncome * parseFloat(expense.percentage)) / 12)
                                  : formatCurrency(Number(expense.monthlyAmount))
                                }
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {editingExpenses ? (
                              <input
                                type="number"
                                defaultValue={expense.isPercentOfRent 
                                  ? (dealData.units.reduce((sum: number, unit: any) => 
                                      sum + Number(unit.marketRent || 1300), 0
                                    ) * parseFloat(expense.percentage)).toFixed(0)
                                  : Number(expense.monthlyAmount)
                                }
                                placeholder="Proforma amount"
                                className="w-24 px-3 py-2 border border-gray-300 rounded text-sm"
                              />
                            ) : (
                              <span className="text-sm font-medium">
                                {expense.isPercentOfRent 
                                  ? formatCurrency(
                                      dealData.units.reduce((sum: number, unit: any) => 
                                        sum + Number(unit.marketRent || 1300), 0
                                      ) * parseFloat(expense.percentage)
                                    )
                                  : formatCurrency(Number(expense.monthlyAmount))
                                }
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {editingExpenses ? (
                              <select
                                defaultValue={expense.isPercentOfRent ? 'percentage' : 'fixed'}
                                className="px-3 py-2 border border-gray-300 rounded text-sm"
                              >
                                <option value="fixed">Fixed</option>
                                <option value="percentage">% of Rent</option>
                              </select>
                            ) : (
                              <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                                {expense.isPercentOfRent ? `${(parseFloat(expense.percentage) * 100).toFixed(1)}%` : 'Fixed'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                      
                      <tr className="bg-red-100 font-bold">
                        <td className="px-4 py-3" colSpan={2}>
                          <span className="text-sm font-bold">Total Expenses</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-bold text-red-600">
                            {formatCurrency(kpis.totalOperatingExpenses / 12)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-bold text-red-600">
                            {formatCurrency(
                              dealData.expenses.reduce((sum: number, expense: any) => {
                                const proformaRent = dealData.units.reduce((unitSum: number, unit: any) => 
                                  unitSum + Number(unit.marketRent || 1300), 0
                                );
                                return sum + (expense.isPercentOfRent 
                                  ? proformaRent * parseFloat(expense.percentage)
                                  : Number(expense.monthlyAmount)
                                );
                              }, 0)
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* NOI Summary */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Net Operating Income Summary</h2>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-green-800 mb-2">Current NOI</h3>
                    <div className="text-2xl font-bold text-green-600">{formatCurrency(kpis.netOperatingIncome / 12)}</div>
                    <div className="text-sm text-green-600">Monthly</div>
                  </div>
                  <div>
                    <h3 className="font-medium text-blue-800 mb-2">Proforma NOI</h3>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(
                        dealData.units.reduce((sum: number, unit: any) => 
                          sum + Number(unit.marketRent || 1300), 0
                        ) + (kpis.totalOtherIncome / 12) -
                        dealData.expenses.reduce((sum: number, expense: any) => {
                          const proformaRent = dealData.units.reduce((unitSum: number, unit: any) => 
                            unitSum + Number(unit.marketRent || 1300), 0
                          );
                          return sum + (expense.isPercentOfRent 
                            ? proformaRent * parseFloat(expense.percentage)
                            : Number(expense.monthlyAmount)
                          );
                        }, 0)
                      )}
                    </div>
                    <div className="text-sm text-blue-600">Monthly (at market rents)</div>
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
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Rehab Budget Detail</h2>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
                  + Add Rehab Item
                </button>
              </div>
              <div className="space-y-4">
                {dealData.rehabItems.map((item: any, index: number) => (
                  <div key={item.id || index} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-12 gap-4 items-start">
                      <div className="col-span-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <input
                          type="text"
                          defaultValue={item.category}
                          placeholder="e.g., Kitchen, HVAC"
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div className="col-span-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <input
                          type="text"
                          defaultValue={item.description}
                          placeholder="Detailed description"
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Total Cost</label>
                        <input
                          type="number"
                          defaultValue={Number(item.totalCost)}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bid Status</label>
                        <select
                          defaultValue={item.bidStatus}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        >
                          <option value="estimated">Estimated</option>
                          <option value="bid_received">Bid Received</option>
                          <option value="contracted">Contracted</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                      <div className="col-span-1 flex items-end">
                        <button className="text-red-600 hover:text-red-800 text-sm p-2">
                          Delete
                        </button>
                      </div>
                    </div>
                    
                    {/* Additional Fields */}
                    <div className="grid grid-cols-12 gap-4 mt-3">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contractor</label>
                        <input
                          type="text"
                          placeholder="Contractor name"
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <input
                          type="date"
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <input
                          type="date"
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded text-sm">
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">% Complete</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          placeholder="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Per Unit Cost</label>
                        <input
                          type="number"
                          value={(Number(item.totalCost) / (assumptions.units || deal.units)).toFixed(0)}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-gray-50"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Rehab Summary */}
                <div className="border-t-2 border-gray-300 pt-4">
                  <div className="grid grid-cols-3 gap-6">
                    <div className="bg-blue-50 p-4 rounded">
                      <h3 className="font-medium text-blue-800">Total Rehab Budget</h3>
                      <p className="text-2xl font-bold text-blue-600">{formatCurrency(kpis.totalRehab)}</p>
                      <p className="text-sm text-blue-600">{formatCurrency(kpis.totalRehab / (assumptions.units || deal.units))} per unit</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded">
                      <h3 className="font-medium text-green-800">Contracted</h3>
                      <p className="text-xl font-bold text-green-600">
                        {formatCurrency(dealData.rehabItems
                          .filter((item: any) => item.bidStatus === 'contracted')
                          .reduce((sum: number, item: any) => sum + Number(item.totalCost), 0)
                        )}
                      </p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded">
                      <h3 className="font-medium text-yellow-800">Estimated</h3>
                      <p className="text-xl font-bold text-yellow-600">
                        {formatCurrency(dealData.rehabItems
                          .filter((item: any) => item.bidStatus === 'estimated')
                          .reduce((sum: number, item: any) => sum + Number(item.totalCost), 0)
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loans Tab */}
          {activeTab === 'loans' && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Loan Structure</h2>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
                  + Add Loan
                </button>
              </div>
              <div className="space-y-4">
                {dealData.loans.map((loan: any, index: number) => (
                  <div key={loan.id || index} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-12 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Loan Type</label>
                        <select
                          defaultValue={loan.loanType}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        >
                          <option value="acquisition">Acquisition</option>
                          <option value="rehab">Rehab</option>
                          <option value="bridge">Bridge</option>
                          <option value="permanent">Permanent</option>
                          <option value="refinance">Refinance</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Loan Amount</label>
                        <input
                          type="number"
                          defaultValue={Number(loan.loanAmount)}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Interest Rate (%)</label>
                        <input
                          type="number"
                          step="0.001"
                          defaultValue={(Number(loan.interestRate) * 100).toFixed(3)}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Term (Years)</label>
                        <input
                          type="number"
                          defaultValue={loan.termYears}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amortization</label>
                        <input
                          type="number"
                          defaultValue={loan.amortizationYears}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">IO Months</label>
                        <input
                          type="number"
                          defaultValue={loan.ioMonths}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div className="col-span-1 flex items-end">
                        <button className="text-red-600 hover:text-red-800 text-sm p-2">
                          Delete
                        </button>
                      </div>
                    </div>
                    
                    {/* Additional Loan Details */}
                    <div className="grid grid-cols-12 gap-4 mt-3">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Lender</label>
                        <input
                          type="text"
                          placeholder="Lender name"
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Points (%)</label>
                        <input
                          type="number"
                          step="0.01"
                          defaultValue={(Number(loan.points) * 100).toFixed(2)}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Lender Fees</label>
                        <input
                          type="number"
                          defaultValue={Number(loan.lenderFees)}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Payment</label>
                        <input
                          type="number"
                          value={(kpis.monthlyDebtService || 0).toFixed(0)}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-gray-50"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Closing Date</label>
                        <input
                          type="date"
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Maturity Date</label>
                        <input
                          type="date"
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Loan Summary */}
                <div className="border-t-2 border-gray-300 pt-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded">
                      <h3 className="font-medium text-blue-800">Total Loan Amount</h3>
                      <p className="text-xl font-bold text-blue-600">
                        {formatCurrency(dealData.loans.reduce((sum: number, loan: any) => sum + Number(loan.loanAmount), 0))}
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded">
                      <h3 className="font-medium text-green-800">Weighted Avg Rate</h3>
                      <p className="text-xl font-bold text-green-600">
                        {dealData.loans.length > 0 ? (
                          (dealData.loans.reduce((sum: number, loan: any) => 
                            sum + (Number(loan.interestRate) * Number(loan.loanAmount)), 0) / 
                           dealData.loans.reduce((sum: number, loan: any) => sum + Number(loan.loanAmount), 0) * 100
                          ).toFixed(2)
                        ) : '0.00'}%
                      </p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded">
                      <h3 className="font-medium text-yellow-800">Monthly Debt Service</h3>
                      <p className="text-xl font-bold text-yellow-600">
                        {formatCurrency(kpis.monthlyDebtService)}
                      </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded">
                      <h3 className="font-medium text-purple-800">DSCR</h3>
                      <p className={`text-xl font-bold ${
                        (kpis.dscr || 0) >= 1.25 ? "text-green-600" : 
                        (kpis.dscr || 0) >= 1.15 ? "text-yellow-600" : "text-red-600"
                      }`}>
                        {(kpis.dscr || 0).toFixed(2)}x
                      </p>
                    </div>
                  </div>
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