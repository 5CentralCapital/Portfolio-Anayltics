import React, { useState, useEffect } from 'react';
import {
  Calculator,
  DollarSign,
  Building,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Edit3,
  Plus,
  Trash2,
  Home,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';

interface RentRollItem {
  id: number;
  unitNumber: string;
  bedBath: string;
  currentRent: number;
  proFormaRent: number;
}

interface RehabItem {
  id: number;
  category: string;
  perUnitCost: number;
  quantity: number;
  totalCost: number;
}

interface ExpenseItem {
  propertyTax: number;
  insurance: number;
  maintenance: number;
  managementFee: number;
  waterSewerTrash: number;
  capitalReserves: number;
  utilities: number;
  other: number;
}

interface LenderAnalysis {
  purchasePrice: number;
  loanPercentage: number;
  arv: number;
  refinanceLTV: number;
  interestRate: number;
  loanTermYears: number;
  vacancyRate: number;
}

export default function FinancialDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [rentRoll, setRentRoll] = useState<RentRollItem[]>([
    { id: 1, unitNumber: '1A', bedBath: '2/1', currentRent: 1200, proFormaRent: 1400 },
    { id: 2, unitNumber: '1B', bedBath: '2/1', currentRent: 1150, proFormaRent: 1400 },
    { id: 3, unitNumber: '2A', bedBath: '3/2', currentRent: 1500, proFormaRent: 1650 },
    { id: 4, unitNumber: '2B', bedBath: '3/2', currentRent: 1450, proFormaRent: 1650 },
    { id: 5, unitNumber: '3A', bedBath: '2/1', currentRent: 1100, proFormaRent: 1400 },
    { id: 6, unitNumber: '3B', bedBath: '2/1', currentRent: 1250, proFormaRent: 1400 },
    { id: 7, unitNumber: '4A', bedBath: '3/2', currentRent: 1600, proFormaRent: 1650 },
    { id: 8, unitNumber: '4B', bedBath: '3/2', currentRent: 1550, proFormaRent: 1650 }
  ]);

  const [rehabBudget, setRehabBudget] = useState<RehabItem[]>([
    { id: 1, category: 'Kitchen Renovation', perUnitCost: 8000, quantity: 8, totalCost: 64000 },
    { id: 2, category: 'Bathroom Updates', perUnitCost: 4500, quantity: 12, totalCost: 54000 },
    { id: 3, category: 'Flooring', perUnitCost: 3000, quantity: 8, totalCost: 24000 },
    { id: 4, category: 'HVAC Systems', perUnitCost: 2500, quantity: 8, totalCost: 20000 },
    { id: 5, category: 'Windows/Doors', perUnitCost: 1500, quantity: 20, totalCost: 30000 },
    { id: 6, category: 'Plumbing Updates', perUnitCost: 2000, quantity: 8, totalCost: 16000 },
    { id: 7, category: 'Electrical Work', perUnitCost: 1800, quantity: 8, totalCost: 14400 },
    { id: 8, category: 'Exterior/Landscaping', perUnitCost: 0, quantity: 1, totalCost: 25000 }
  ]);

  const [expenses, setExpenses] = useState<ExpenseItem>({
    propertyTax: 18000,
    insurance: 8400,
    maintenance: 12000,
    managementFee: 0, // Calculated as percentage
    waterSewerTrash: 9600,
    capitalReserves: 6000,
    utilities: 4800,
    other: 3600
  });

  const [lenderData, setLenderData] = useState<LenderAnalysis>({
    purchasePrice: 1500000,
    loanPercentage: 0.80,
    arv: 2100000,
    refinanceLTV: 0.75,
    interestRate: 0.0875,
    loanTermYears: 30,
    vacancyRate: 0.05
  });

  const [exitScenario, setExitScenario] = useState({
    exitPrice: 2100000,
    saleCostsPercent: 0.06,
    enabled: false
  });

  // Calculation functions
  const calculateFinancials = () => {
    // Revenue calculations
    const grossRent = rentRoll.reduce((sum, unit) => sum + unit.proFormaRent, 0) * 12;
    const vacancyLoss = grossRent * lenderData.vacancyRate;
    const netRevenue = grossRent - vacancyLoss;

    // Expense calculations
    const managementFee = netRevenue * 0.08; // 8% of net revenue
    const totalExpenses = Object.values(expenses).reduce((sum, exp) => sum + exp, 0) + managementFee;
    const noi = netRevenue - totalExpenses;

    // Loan calculations
    const ltcLoanAmount = lenderData.purchasePrice * lenderData.loanPercentage;
    const refinanceLoan = lenderData.arv * lenderData.refinanceLTV;
    
    // Monthly debt service calculation
    const monthlyRate = lenderData.interestRate / 12;
    const numPayments = lenderData.loanTermYears * 12;
    const monthlyDebtService = refinanceLoan * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
    const annualDebtService = monthlyDebtService * 12;

    // Performance metrics
    const dscr = noi / annualDebtService;
    const netCashFlow = noi - annualDebtService;
    const breakEvenOccupancy = annualDebtService / grossRent;

    // Rehab totals
    const totalRehab = rehabBudget.reduce((sum, item) => sum + item.totalCost, 0);
    const allInCost = lenderData.purchasePrice + totalRehab;

    // Initial investment
    const downPayment = lenderData.purchasePrice - ltcLoanAmount;
    const initialCash = downPayment + totalRehab;
    const cashOut = Math.max(0, refinanceLoan - ltcLoanAmount);
    const equityMultiple = initialCash > 0 ? (cashOut + netCashFlow) / initialCash : 0;

    // Exit scenario
    const netProceeds = exitScenario.enabled ? 
      exitScenario.exitPrice - (exitScenario.exitPrice * exitScenario.saleCostsPercent) : 0;
    const exitROI = exitScenario.enabled && initialCash > 0 ? 
      (netProceeds + netCashFlow - initialCash) / initialCash : 0;

    return {
      grossRent,
      vacancyLoss,
      netRevenue,
      managementFee,
      totalExpenses,
      noi,
      ltcLoanAmount,
      refinanceLoan,
      monthlyDebtService,
      annualDebtService,
      dscr,
      netCashFlow,
      breakEvenOccupancy,
      totalRehab,
      allInCost,
      downPayment,
      initialCash,
      cashOut,
      equityMultiple,
      netProceeds,
      exitROI
    };
  };

  const metrics = calculateFinancials();

  // Warning flags
  const warnings = {
    lowDSCR: metrics.dscr < 1.25,
    lowEquityMultiple: metrics.equityMultiple < 1.5,
    negativeCashOut: metrics.cashOut < metrics.initialCash
  };

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

  const addRentRollItem = () => {
    const newId = Math.max(...rentRoll.map(r => r.id), 0) + 1;
    setRentRoll([...rentRoll, {
      id: newId,
      unitNumber: `Unit ${newId}`,
      bedBath: '2/1',
      currentRent: 0,
      proFormaRent: 0
    }]);
  };

  const updateRentRollItem = (id: number, field: keyof RentRollItem, value: any) => {
    setRentRoll(rentRoll.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const deleteRentRollItem = (id: number) => {
    setRentRoll(rentRoll.filter(item => item.id !== id));
  };

  const addRehabItem = () => {
    const newId = Math.max(...rehabBudget.map(r => r.id), 0) + 1;
    setRehabBudget([...rehabBudget, {
      id: newId,
      category: 'New Item',
      perUnitCost: 0,
      quantity: 1,
      totalCost: 0
    }]);
  };

  const updateRehabItem = (id: number, field: keyof RehabItem, value: any) => {
    setRehabBudget(rehabBudget.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        // Auto-calculate total cost if per-unit cost or quantity changes
        if (field === 'perUnitCost' || field === 'quantity') {
          updated.totalCost = updated.perUnitCost * updated.quantity;
        }
        return updated;
      }
      return item;
    }));
  };

  const deleteRehabItem = (id: number) => {
    setRehabBudget(rehabBudget.filter(item => item.id !== id));
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'rentroll', label: 'Rent Roll', icon: Home },
    { id: 'rehab', label: 'Rehab Budget', icon: Calculator },
    { id: 'analysis', label: 'Lender Analysis', icon: TrendingUp }
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Financial Dashboard</h1>
            <p className="text-gray-600">Comprehensive investment analysis and tracking</p>
          </div>
          <div className="flex items-center space-x-4">
            {warnings.lowDSCR && (
              <div className="flex items-center text-red-600">
                <AlertTriangle className="h-5 w-5 mr-1" />
                <span className="text-sm">Low DSCR</span>
              </div>
            )}
            {warnings.lowEquityMultiple && (
              <div className="flex items-center text-orange-600">
                <AlertTriangle className="h-5 w-5 mr-1" />
                <span className="text-sm">Low Returns</span>
              </div>
            )}
            {!warnings.lowDSCR && !warnings.lowEquityMultiple && (
              <div className="flex items-center text-green-600">
                <CheckCircle className="h-5 w-5 mr-1" />
                <span className="text-sm">Healthy Metrics</span>
              </div>
            )}
          </div>
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

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Gross Rent (Annual)</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.grossRent)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">NOI</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.noi)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Net Cash Flow</p>
                  <p className={`text-2xl font-bold ${metrics.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(metrics.netCashFlow)}
                  </p>
                </div>
                <Activity className="h-8 w-8 text-purple-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">DSCR</p>
                  <p className={`text-2xl font-bold ${metrics.dscr >= 1.25 ? 'text-green-600' : 'text-red-600'}`}>
                    {metrics.dscr.toFixed(2)}x
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Section */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Breakdown</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Gross Rent</span>
                  <span className="font-semibold">{formatCurrency(metrics.grossRent)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Vacancy Loss ({formatPercent(lenderData.vacancyRate)})</span>
                  <span className="text-red-600">({formatCurrency(metrics.vacancyLoss)})</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Net Revenue</span>
                    <span>{formatCurrency(metrics.netRevenue)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Expense Section */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Breakdown</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Property Tax</span>
                  <span>{formatCurrency(expenses.propertyTax)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Insurance</span>
                  <span>{formatCurrency(expenses.insurance)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Maintenance</span>
                  <span>{formatCurrency(expenses.maintenance)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Management Fee (8%)</span>
                  <span>{formatCurrency(metrics.managementFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Water/Sewer/Trash</span>
                  <span>{formatCurrency(expenses.waterSewerTrash)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Other</span>
                  <span>{formatCurrency(expenses.other)}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Total Expenses</span>
                    <span>{formatCurrency(metrics.totalExpenses)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Investment Summary */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Investment Summary</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-600">Purchase Price</p>
                <p className="text-xl font-semibold">{formatCurrency(lenderData.purchasePrice)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Rehab</p>
                <p className="text-xl font-semibold">{formatCurrency(metrics.totalRehab)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">All-In Cost</p>
                <p className="text-xl font-semibold">{formatCurrency(metrics.allInCost)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">ARV</p>
                <p className="text-xl font-semibold text-green-600">{formatCurrency(lenderData.arv)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Initial Cash</p>
                <p className="text-xl font-semibold">{formatCurrency(metrics.initialCash)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Cash Out (Refi)</p>
                <p className="text-xl font-semibold text-blue-600">{formatCurrency(metrics.cashOut)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Equity Multiple</p>
                <p className={`text-xl font-semibold ${metrics.equityMultiple >= 1.5 ? 'text-green-600' : 'text-red-600'}`}>
                  {metrics.equityMultiple.toFixed(2)}x
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Break-Even Occupancy</p>
                <p className="text-xl font-semibold">{formatPercent(metrics.breakEvenOccupancy)}</p>
              </div>
            </div>
          </div>

          {/* Exit Scenario */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Exit Scenario Analysis</h3>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={exitScenario.enabled}
                  onChange={(e) => setExitScenario({...exitScenario, enabled: e.target.checked})}
                  className="mr-2"
                />
                <span className="text-sm text-gray-600">Enable</span>
              </label>
            </div>
            
            {exitScenario.enabled && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Exit Price</label>
                  <input
                    type="number"
                    value={exitScenario.exitPrice}
                    onChange={(e) => setExitScenario({...exitScenario, exitPrice: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Sale Costs %</label>
                  <input
                    type="number"
                    step="0.01"
                    value={exitScenario.saleCostsPercent * 100}
                    onChange={(e) => setExitScenario({...exitScenario, saleCostsPercent: (parseInt(e.target.value) || 0) / 100})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Net Proceeds</p>
                  <p className="text-xl font-semibold text-green-600">{formatCurrency(metrics.netProceeds)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Exit ROI</p>
                  <p className="text-xl font-semibold text-blue-600">{formatPercent(metrics.exitROI)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'rentroll' && (
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Rent Roll Management</h3>
            <button
              onClick={addRentRollItem}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Unit
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Unit #</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Bed/Bath</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Current Rent</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Pro Forma Rent</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rentRoll.map((unit) => (
                  <tr key={unit.id}>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={unit.unitNumber}
                        onChange={(e) => updateRentRollItem(unit.id, 'unitNumber', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={unit.bedBath}
                        onChange={(e) => updateRentRollItem(unit.id, 'bedBath', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={unit.currentRent}
                        onChange={(e) => updateRentRollItem(unit.id, 'currentRent', parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={unit.proFormaRent}
                        onChange={(e) => updateRentRollItem(unit.id, 'proFormaRent', parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => deleteRentRollItem(unit.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-between bg-gray-50 p-4 rounded-lg">
            <div>
              <p className="text-sm text-gray-600">Total Units</p>
              <p className="text-xl font-semibold">{rentRoll.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Monthly Pro Forma Income</p>
              <p className="text-xl font-semibold text-green-600">
                {formatCurrency(rentRoll.reduce((sum, unit) => sum + unit.proFormaRent, 0))}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Annual Pro Forma Income</p>
              <p className="text-xl font-semibold text-green-600">
                {formatCurrency(metrics.grossRent)}
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'rehab' && (
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Rehab Budget</h3>
            <button
              onClick={addRehabItem}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Category</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Per-Unit Cost</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Quantity</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Total Cost</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rehabBudget.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={item.category}
                        onChange={(e) => updateRehabItem(item.id, 'category', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={item.perUnitCost}
                        onChange={(e) => updateRehabItem(item.id, 'perUnitCost', parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateRehabItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={item.totalCost}
                        onChange={(e) => updateRehabItem(item.id, 'totalCost', parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-gray-50"
                        readOnly={item.perUnitCost > 0}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => deleteRehabItem(item.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between">
              <span className="text-lg font-semibold">Total Rehab Budget</span>
              <span className="text-xl font-bold text-blue-600">{formatCurrency(metrics.totalRehab)}</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analysis' && (
        <div className="space-y-6">
          {/* Lender Parameters */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Lender Analysis Parameters</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Purchase Price</label>
                <input
                  type="number"
                  value={lenderData.purchasePrice}
                  onChange={(e) => setLenderData({...lenderData, purchasePrice: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Loan %</label>
                <input
                  type="number"
                  step="0.01"
                  value={lenderData.loanPercentage * 100}
                  onChange={(e) => setLenderData({...lenderData, loanPercentage: (parseInt(e.target.value) || 0) / 100})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">ARV</label>
                <input
                  type="number"
                  value={lenderData.arv}
                  onChange={(e) => setLenderData({...lenderData, arv: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Refinance LTV %</label>
                <input
                  type="number"
                  step="0.01"
                  value={lenderData.refinanceLTV * 100}
                  onChange={(e) => setLenderData({...lenderData, refinanceLTV: (parseInt(e.target.value) || 0) / 100})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Interest Rate %</label>
                <input
                  type="number"
                  step="0.01"
                  value={lenderData.interestRate * 100}
                  onChange={(e) => setLenderData({...lenderData, interestRate: (parseInt(e.target.value) || 0) / 100})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Loan Term (Years)</label>
                <input
                  type="number"
                  value={lenderData.loanTermYears}
                  onChange={(e) => setLenderData({...lenderData, loanTermYears: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Vacancy Rate %</label>
                <input
                  type="number"
                  step="0.01"
                  value={lenderData.vacancyRate * 100}
                  onChange={(e) => setLenderData({...lenderData, vacancyRate: (parseInt(e.target.value) || 0) / 100})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>

          {/* Loan Analysis Results */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Loan Analysis Results</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-600">LTC Loan Amount</p>
                <p className="text-xl font-semibold">{formatCurrency(metrics.ltcLoanAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Refinance Loan</p>
                <p className="text-xl font-semibold">{formatCurrency(metrics.refinanceLoan)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Monthly Debt Service</p>
                <p className="text-xl font-semibold">{formatCurrency(metrics.monthlyDebtService)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Annual Debt Service</p>
                <p className="text-xl font-semibold">{formatCurrency(metrics.annualDebtService)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">DSCR</p>
                <p className={`text-xl font-semibold ${metrics.dscr >= 1.25 ? 'text-green-600' : 'text-red-600'}`}>
                  {metrics.dscr.toFixed(2)}x
                </p>
                {metrics.dscr < 1.25 && (
                  <p className="text-xs text-red-600">Below 1.25 threshold</p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600">Break-Even Occupancy</p>
                <p className="text-xl font-semibold">{formatPercent(metrics.breakEvenOccupancy)}</p>
              </div>
            </div>
          </div>

          {/* Expense Breakdown (Editable) */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Operating Expenses</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Property Tax</label>
                <input
                  type="number"
                  value={expenses.propertyTax}
                  onChange={(e) => setExpenses({...expenses, propertyTax: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Insurance</label>
                <input
                  type="number"
                  value={expenses.insurance}
                  onChange={(e) => setExpenses({...expenses, insurance: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Maintenance</label>
                <input
                  type="number"
                  value={expenses.maintenance}
                  onChange={(e) => setExpenses({...expenses, maintenance: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Water/Sewer/Trash</label>
                <input
                  type="number"
                  value={expenses.waterSewerTrash}
                  onChange={(e) => setExpenses({...expenses, waterSewerTrash: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Capital Reserves</label>
                <input
                  type="number"
                  value={expenses.capitalReserves}
                  onChange={(e) => setExpenses({...expenses, capitalReserves: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Utilities</label>
                <input
                  type="number"
                  value={expenses.utilities}
                  onChange={(e) => setExpenses({...expenses, utilities: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Other</label>
                <input
                  type="number"
                  value={expenses.other}
                  onChange={(e) => setExpenses({...expenses, other: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <p className="text-sm text-gray-600">Management Fee (8%)</p>
                <p className="text-xl font-semibold text-gray-700">{formatCurrency(metrics.managementFee)}</p>
                <p className="text-xs text-gray-500">Auto-calculated</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}