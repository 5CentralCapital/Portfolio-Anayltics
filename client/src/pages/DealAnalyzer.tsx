import React, { useState, useEffect } from 'react';
import { Building, Users, Wrench, Calculator, DollarSign, Calendar, AlertTriangle, TrendingUp, Home, Target } from 'lucide-react';

export default function DealAnalyzer() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [dealData, setDealData] = useState<any>(null);
  const [editingProperty, setEditingProperty] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);
  const [propertyName, setPropertyName] = useState('Maple Street Apartments');
  const [propertyAddress, setPropertyAddress] = useState('123 Maple Street, Hartford, CT 06106');
  const [editingExpenses, setEditingExpenses] = useState(false);
  
  // Editable assumptions state
  const [assumptions, setAssumptions] = useState({
    unitCount: 8,
    purchasePrice: 1500000,
    closingCosts: 45000,
    holdingCosts: 30000,
    loanPercentage: 0.80,
    interestRate: 0.0875,
    loanTermYears: 2,
    vacancyRate: 0.05,
    expenseRatio: 0.45,
    marketCapRate: 0.055,
    refinanceLTV: 0.75,
    refinanceInterestRate: 0.065,
    dscrThreshold: 1.25
  });

  // Unit types with market rents
  const [unitTypes, setUnitTypes] = useState([
    { id: 1, name: '2BR/1BA', marketRent: 1450 },
    { id: 2, name: '3BR/1BA', marketRent: 1650 },
    { id: 3, name: '1BR/1BA', marketRent: 1200 },
    { id: 4, name: '2BR/2BA', marketRent: 1550 }
  ]);

  // Generate rent roll based on unit count
  const generateRentRoll = (count: number) => {
    const units = [];
    for (let i = 1; i <= count; i++) {
      const unitTypeId = i % 2 === 1 ? 1 : 2; // Alternate between unit types
      const unitType = unitTypes.find(ut => ut.id === unitTypeId);
      
      units.push({
        id: i,
        unit: i.toString(), // Fixed unit numbers: 1, 2, 3, etc.
        unitTypeId: unitTypeId,
        currentRent: unitType ? unitType.marketRent - 200 : 1200,
        proFormaRent: unitType ? unitType.marketRent : 1450
      });
    }
    return units;
  };

  const [rentRoll, setRentRoll] = useState(generateRentRoll(assumptions.unitCount));

  // Rehab budget data
  const [rehabBudget, setRehabBudget] = useState([
    { id: 1, category: 'Kitchens', perUnitCost: 8000, quantity: 8, totalCost: 64000 },
    { id: 2, category: 'Bathrooms', perUnitCost: 4500, quantity: 8, totalCost: 36000 },
    { id: 3, category: 'Flooring', perUnitCost: 3000, quantity: 8, totalCost: 24000 },
    { id: 4, category: 'Windows', perUnitCost: 1200, quantity: 24, totalCost: 28800 },
    { id: 5, category: 'HVAC', perUnitCost: 2500, quantity: 8, totalCost: 20000 },
    { id: 6, category: 'Paint/Misc', perUnitCost: 1500, quantity: 8, totalCost: 12000 },
    { id: 7, category: 'Common Areas', perUnitCost: 0, quantity: 1, totalCost: 15000 },
    { id: 8, category: 'Contingency (10%)', perUnitCost: 0, quantity: 1, totalCost: 19980 },
  ]);

  // Expense breakdown with names
  const [expenses, setExpenses] = useState<{ [key: string]: number }>({
    propertyTax: 18000,
    insurance: 8500,
    maintenance: 12000,
    managementFee: 0, // Will be calculated as percentage
    waterSewerTrash: 6000,
    capitalReserves: 4800,
    utilities: 3600,
    other: 2400
  });

  const [expenseNames, setExpenseNames] = useState<{ [key: string]: string }>({
    propertyTax: 'Property Tax',
    insurance: 'Insurance',
    maintenance: 'Maintenance',
    waterSewerTrash: 'Water/Sewer/Trash',
    capitalReserves: 'Capital Reserves',
    utilities: 'Utilities',
    other: 'Other'
  });

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setDealData({ loaded: true });
      setLoading(false);
    }, 1000);
  }, []);

  // Calculation functions
  const calculateMetrics = () => {
    const totalRehab = rehabBudget.reduce((sum, item) => sum + item.totalCost, 0);
    const initialLoan = assumptions.purchasePrice * assumptions.loanPercentage;
    const downPayment = assumptions.purchasePrice - initialLoan;
    const totalCashInvested = downPayment + assumptions.closingCosts + assumptions.holdingCosts + totalRehab;
    const allInCost = assumptions.purchasePrice + totalRehab + assumptions.closingCosts + assumptions.holdingCosts;
    
    // Revenue calculations
    const grossRent = rentRoll.reduce((sum, unit) => {
      const unitType = unitTypes.find(ut => ut.id === unit.unitTypeId);
      return sum + (unitType ? unitType.marketRent : unit.proFormaRent);
    }, 0) * 12;
    const vacancyLoss = grossRent * assumptions.vacancyRate;
    const netRevenue = grossRent - vacancyLoss;
    
    // Expense calculations
    const managementFee = netRevenue * 0.08; // 8% management fee
    const totalExpenses = Object.values(expenses).reduce((sum, exp) => sum + exp, 0) + managementFee;
    const noi = netRevenue - totalExpenses;
    
    // ARV and refinance calculations
    const arv = noi / assumptions.marketCapRate;
    const refinanceLoan = arv * assumptions.refinanceLTV;
    const cashOut = Math.max(0, refinanceLoan - initialLoan);
    
    // Post-refi debt service (using refinance interest rate assumption)
    const refiRate = assumptions.refinanceInterestRate / 12;
    const refiPayments = 30 * 12;
    const monthlyDebtService = refinanceLoan * (refiRate * Math.pow(1 + refiRate, refiPayments)) / (Math.pow(1 + refiRate, refiPayments) - 1);
    const annualDebtService = monthlyDebtService * 12;
    const netCashFlow = noi - annualDebtService;
    
    // Return calculations
    const dscr = noi / annualDebtService;
    const cashOnCashReturn = totalCashInvested > 0 ? netCashFlow / totalCashInvested : 0;
    const equityMultiple = totalCashInvested > 0 ? (cashOut + netCashFlow) / totalCashInvested : 0;
    const breakEvenOccupancy = annualDebtService / grossRent;
    
    return {
      totalRehab,
      initialLoan,
      downPayment,
      totalCashInvested,
      allInCost,
      grossRent,
      vacancyLoss,
      netRevenue,
      managementFee,
      totalExpenses,
      noi,
      arv,
      refinanceLoan,
      cashOut,
      monthlyDebtService,
      annualDebtService,
      netCashFlow,
      dscr,
      cashOnCashReturn,
      equityMultiple,
      breakEvenOccupancy
    };
  };

  const metrics = calculateMetrics();

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

  const updateAssumption = (key: string, value: number) => {
    setAssumptions(prev => {
      const newAssumptions = {
        ...prev,
        [key]: value
      };
      
      // Regenerate rent roll if unit count changes
      if (key === 'unitCount') {
        setRentRoll(generateRentRoll(value));
      }
      
      return newAssumptions;
    });
  };

  const addUnit = () => {
    const maxId = Math.max(...rentRoll.map(u => u.id), 0);
    const floor = Math.ceil((maxId + 1) / 2);
    const side = (maxId + 1) % 2 === 1 ? 'A' : 'B';
    const defaultUnitType = unitTypes[0];
    
    const newUnit = {
      id: maxId + 1,
      unit: `${floor}${side}`,
      unitTypeId: defaultUnitType.id,
      currentRent: defaultUnitType.marketRent - 200,
      proFormaRent: defaultUnitType.marketRent
    };
    
    setRentRoll([...rentRoll, newUnit]);
    updateAssumption('unitCount', rentRoll.length + 1);
  };

  const addRehabItem = () => {
    const newItem = {
      id: Math.max(...rehabBudget.map(i => i.id)) + 1,
      category: 'New Item',
      perUnitCost: 0,
      quantity: 1,
      totalCost: 0
    };
    setRehabBudget([...rehabBudget, newItem]);
  };

  const addExpenseItem = () => {
    const newExpenseKey = `customExpense${Date.now()}`;
    setExpenses(prev => ({
      ...prev,
      [newExpenseKey]: 0
    }));
  };

  const updateExpense = (key: string, value: number) => {
    setExpenses(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Building },
    { id: 'rentroll', label: 'Rent Roll', icon: Users },
    { id: 'rehab', label: 'Rehab Budget', icon: Wrench },
    { id: 'proforma', label: '12 Month Pro Forma', icon: Calendar }
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <div>
              <div className="mb-2">
                {editingProperty ? (
                  <input
                    type="text"
                    value={propertyName}
                    onChange={(e) => setPropertyName(e.target.value)}
                    onBlur={() => setEditingProperty(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === 'Escape') {
                        setEditingProperty(false);
                      }
                    }}
                    className="text-3xl font-bold text-gray-900 border-b-2 border-blue-500 bg-transparent outline-none"
                    autoFocus
                  />
                ) : (
                  <h1 
                    className="text-3xl font-bold text-gray-900 cursor-pointer hover:text-blue-600" 
                    title="Double-click to edit"
                    onDoubleClick={() => setEditingProperty(true)}
                  >
                    {propertyName}
                  </h1>
                )}
              </div>
              <div>
                {editingAddress ? (
                  <input
                    type="text"
                    value={propertyAddress}
                    onChange={(e) => setPropertyAddress(e.target.value)}
                    onBlur={() => setEditingAddress(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === 'Escape') {
                        setEditingAddress(false);
                      }
                    }}
                    className="text-lg text-gray-600 border-b border-blue-300 bg-transparent outline-none w-full"
                    autoFocus
                  />
                ) : (
                  <p 
                    className="text-lg text-gray-600 cursor-pointer hover:text-blue-600" 
                    title="Double-click to edit"
                    onDoubleClick={() => setEditingAddress(true)}
                  >
                    {propertyAddress}
                  </p>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-500">{assumptions.unitCount} Units • Multifamily • Value-Add Strategy</p>
          </div>
          <div className="text-right">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              Under Analysis
            </span>
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
        <div className="grid grid-cols-12 gap-6">
          {/* LEFT PANEL - Editable Inputs */}
          <div className="col-span-3 space-y-6">
            {/* Purchase & Loan */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Home className="h-5 w-5 mr-2 text-blue-600" />
                Purchase & Loan
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Count</label>
                  <input
                    type="number"
                    value={assumptions.unitCount}
                    onChange={(e) => updateAssumption('unitCount', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price</label>
                  <input
                    type="number"
                    value={assumptions.purchasePrice}
                    onChange={(e) => updateAssumption('purchasePrice', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Closing Costs</label>
                  <input
                    type="number"
                    value={assumptions.closingCosts}
                    onChange={(e) => updateAssumption('closingCosts', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Holding Costs</label>
                  <input
                    type="number"
                    value={assumptions.holdingCosts}
                    onChange={(e) => updateAssumption('holdingCosts', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Loan % (LTC)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={assumptions.loanPercentage * 100}
                    onChange={(e) => updateAssumption('loanPercentage', Number(e.target.value) / 100)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Interest Rate (%)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={assumptions.interestRate * 100}
                    onChange={(e) => updateAssumption('interestRate', Number(e.target.value) / 100)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Loan Term (Years)</label>
                  <input
                    type="number"
                    value={assumptions.loanTermYears}
                    onChange={(e) => updateAssumption('loanTermYears', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Market Assumptions */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Target className="h-5 w-5 mr-2 text-green-600" />
                Market Assumptions
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vacancy Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={assumptions.vacancyRate * 100}
                    onChange={(e) => updateAssumption('vacancyRate', Number(e.target.value) / 100)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Market Cap Rate (%)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={assumptions.marketCapRate * 100}
                    onChange={(e) => updateAssumption('marketCapRate', Number(e.target.value) / 100)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Refinance LTV (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={assumptions.refinanceLTV * 100}
                    onChange={(e) => updateAssumption('refinanceLTV', Number(e.target.value) / 100)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Refinance Interest Rate (%)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={assumptions.refinanceInterestRate * 100}
                    onChange={(e) => updateAssumption('refinanceInterestRate', Number(e.target.value) / 100)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">DSCR Threshold</label>
                  <input
                    type="number"
                    step="0.01"
                    value={assumptions.dscrThreshold}
                    onChange={(e) => updateAssumption('dscrThreshold', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* CENTER PANEL - Financial Breakdown */}
          <div className="col-span-6 space-y-6">
            {/* Top KPI Bar */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
              <div className="grid grid-cols-6 gap-4">
                <div className="text-center">
                  <p className="text-sm opacity-90">All-In Cost</p>
                  <p className="text-xl font-bold">{formatCurrency(metrics.allInCost)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm opacity-90">ARV</p>
                  <p className="text-xl font-bold">{formatCurrency(metrics.arv)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm opacity-90">Price Per Unit</p>
                  <p className="text-xl font-bold">{formatCurrency(assumptions.purchasePrice / assumptions.unitCount)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm opacity-90">Cash-Out Refi</p>
                  <p className="text-xl font-bold">{formatCurrency(metrics.cashOut)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm opacity-90">Equity Multiple</p>
                  <p className="text-xl font-bold">{metrics.equityMultiple.toFixed(2)}x</p>
                </div>
                <div className="text-center">
                  <p className="text-sm opacity-90">Cash-on-Cash</p>
                  <p className="text-xl font-bold">{formatPercent(metrics.cashOnCashReturn)}</p>
                </div>
              </div>
            </div>

            {/* Financial Breakdown */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                Financial Breakdown
              </h3>
              
              {/* Revenue Section */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Revenue</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gross Rent (Annual)</span>
                    <span className="font-medium">{formatCurrency(metrics.grossRent)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vacancy Loss ({formatPercent(assumptions.vacancyRate)})</span>
                    <span className="font-medium text-red-600">-{formatCurrency(metrics.vacancyLoss)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-medium">Net Revenue</span>
                    <span className="font-bold text-green-600">{formatCurrency(metrics.netRevenue)}</span>
                  </div>
                </div>
              </div>

              {/* Expenses Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 
                    className="font-medium text-gray-900 cursor-pointer hover:text-blue-600"
                    onDoubleClick={() => setEditingExpenses(true)}
                    title="Double-click to edit expenses"
                  >
                    Expenses
                  </h4>
                  {editingExpenses && (
                    <div className="flex space-x-2">
                      <button
                        onClick={addExpenseItem}
                        className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                      >
                        Add Line Item
                      </button>
                      <button
                        onClick={() => setEditingExpenses(false)}
                        className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                      >
                        Done
                      </button>
                    </div>
                  )}
                </div>
                <div className="space-y-2 text-sm">
                  {editingExpenses ? (
                    <>
                      {Object.entries(expenses).map(([key, value]) => {
                        const label = expenseNames[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                        
                        return (
                          <div key={key} className="flex justify-between items-center gap-2">
                            <input
                              type="text"
                              value={label}
                              onChange={(e) => {
                                setExpenseNames(prev => ({
                                  ...prev,
                                  [key]: e.target.value
                                }));
                              }}
                              className="flex-1 px-2 py-1 border rounded text-sm text-gray-600"
                            />
                            <input
                              type="number"
                              value={value}
                              onChange={(e) => updateExpense(key, Number(e.target.value))}
                              className="w-24 px-2 py-1 border rounded text-sm text-right font-medium"
                            />
                          </div>
                        );
                      })}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Management Fee (8%)</span>
                        <span className="font-medium text-gray-500">{formatCurrency(metrics.managementFee)}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      {Object.entries(expenses).map(([key, value]) => {
                        const label = expenseNames[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                        return (
                          <div key={key} className="flex justify-between">
                            <span className="text-gray-600">{label}</span>
                            <span className="font-medium">{formatCurrency(value)}</span>
                          </div>
                        );
                      })}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Management Fee (8%)</span>
                        <span className="font-medium">{formatCurrency(metrics.managementFee)}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-medium">Total Expenses</span>
                    <span className="font-bold text-red-600">{formatCurrency(metrics.totalExpenses)}</span>
                  </div>
                </div>
              </div>

              {/* NOI and Cash Flow */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-900">Net Operating Income (NOI)</span>
                    <span className="font-bold text-blue-600 text-lg">{formatCurrency(metrics.noi)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Monthly Debt Service (Post-Refi)</span>
                    <span className="font-medium text-red-600">-{formatCurrency(metrics.monthlyDebtService)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-3">
                    <span className="font-semibold text-gray-900">Net Cash Flow (Monthly)</span>
                    <span className="font-bold text-green-600 text-lg">{formatCurrency(metrics.netCashFlow / 12)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL - Loan & Refinance Analysis */}
          <div className="col-span-3 space-y-6">
            {/* Loan Analysis */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Calculator className="h-5 w-5 mr-2 text-blue-600" />
                Loan Analysis
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Initial Loan (LTC)</span>
                  <span className="font-medium">{formatCurrency(metrics.initialLoan)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Max Loan Amount (65% ARV)</span>
                  <span className="font-medium">{formatCurrency(metrics.arv * 0.65)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Monthly Debt Service</span>
                  <span className="font-medium">{formatCurrency(metrics.initialLoan * assumptions.interestRate / 12)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Interest Rate</span>
                  <span className="font-medium">{formatPercent(assumptions.interestRate)}</span>
                </div>
              </div>
            </div>

            {/* Post-Refi Analysis */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Calculator className="h-5 w-5 mr-2 text-purple-600" />
                Refinance Analysis
              </h3>
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-center">
                    <p className="text-sm text-blue-600 font-medium">DSCR</p>
                    <p className={`text-2xl font-bold ${metrics.dscr >= assumptions.dscrThreshold ? 'text-green-600' : 'text-red-600'}`}>
                      {metrics.dscr.toFixed(2)}
                    </p>
                    {metrics.dscr < assumptions.dscrThreshold && (
                      <p className="text-xs text-red-600 mt-1">Below {assumptions.dscrThreshold} threshold</p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Refinance Loan</span>
                    <span className="font-medium">{formatCurrency(metrics.refinanceLoan)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Monthly Debt Service (Post-Refi)</span>
                    <span className="font-medium">{formatCurrency(metrics.monthlyDebtService)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Break-Even Occupancy</span>
                    <span className="font-medium">{formatPercent(metrics.breakEvenOccupancy)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Investment Summary */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-orange-600" />
                Investment Summary
              </h3>
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Cash Invested</span>
                    <span className="font-medium">{formatCurrency(metrics.totalCashInvested)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Annual Cash Flow</span>
                    <span className="font-medium text-green-600">{formatCurrency(metrics.netCashFlow)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Cash-Out at Refi</span>
                    <span className="font-medium text-blue-600">{formatCurrency(metrics.cashOut)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-3">
                    <span className="font-medium">Total Return</span>
                    <span className="font-bold text-green-600">{formatCurrency(metrics.cashOut + metrics.netCashFlow)}</span>
                  </div>
                </div>

                {/* Warning Indicators */}
                {(metrics.dscr < 1.25 || metrics.equityMultiple < 1.5) && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-start">
                      <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 mr-2" />
                      <div className="text-sm">
                        <p className="font-medium text-red-800">Risk Warnings:</p>
                        <ul className="text-red-700 mt-1 space-y-1">
                          {metrics.dscr < 1.25 && <li>• DSCR below 1.25</li>}
                          {metrics.equityMultiple < 1.5 && <li>• Equity multiple below 1.5x</li>}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'rentroll' && (
        <div className="space-y-6">
          {/* Unit Types Legend */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Unit Types & Market Rents</h3>
              <button className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">
                Add Unit Type
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {unitTypes.map((unitType) => (
                <div key={unitType.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={unitType.name}
                      onChange={(e) => {
                        const updated = unitTypes.map(ut => ut.id === unitType.id ? {...ut, name: e.target.value} : ut);
                        setUnitTypes(updated);
                      }}
                      className="w-full px-2 py-1 border rounded text-sm font-medium"
                    />
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-600">Market Rent:</span>
                      <input
                        type="number"
                        value={unitType.marketRent}
                        onChange={(e) => {
                          const newRent = Number(e.target.value);
                          const updatedTypes = unitTypes.map(ut => ut.id === unitType.id ? {...ut, marketRent: newRent} : ut);
                          setUnitTypes(updatedTypes);
                          
                          // Update rent roll for units of this type
                          const updatedRentRoll = rentRoll.map(unit => 
                            unit.unitTypeId === unitType.id ? {...unit, proFormaRent: newRent} : unit
                          );
                          setRentRoll(updatedRentRoll);
                        }}
                        className="flex-1 px-2 py-1 border rounded text-sm text-right"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rent Roll Table */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Rent Roll</h2>
              <button 
                onClick={addUnit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Unit
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Unit #</th>
                    <th className="text-left py-3 px-4">Unit Type</th>
                    <th className="text-right py-3 px-4">Current Rent</th>
                    <th className="text-right py-3 px-4">Pro Forma Rent</th>
                    <th className="text-right py-3 px-4">Monthly Increase</th>
                  </tr>
                </thead>
                <tbody>
                  {rentRoll.map((unit) => {
                    const selectedUnitType = unitTypes.find(ut => ut.id === unit.unitTypeId) || unitTypes[0];
                    return (
                      <tr key={unit.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={unit.unit}
                            onChange={(e) => {
                              const updated = rentRoll.map(u => u.id === unit.id ? {...u, unit: e.target.value} : u);
                              setRentRoll(updated);
                            }}
                            className="w-20 px-2 py-1 border rounded text-sm"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={unit.unitTypeId}
                            onChange={(e) => {
                              const newUnitTypeId = Number(e.target.value);
                              const newUnitType = unitTypes.find(ut => ut.id === newUnitTypeId);
                              const updated = rentRoll.map(u => u.id === unit.id ? {
                                ...u, 
                                unitTypeId: newUnitTypeId,
                                proFormaRent: newUnitType ? newUnitType.marketRent : u.proFormaRent
                              } : u);
                              setRentRoll(updated);
                            }}
                            className="w-32 px-2 py-1 border rounded text-sm"
                          >
                            {unitTypes.map(ut => (
                              <option key={ut.id} value={ut.id}>{ut.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <input
                            type="number"
                            value={unit.currentRent}
                            onChange={(e) => {
                              const updated = rentRoll.map(u => u.id === unit.id ? {...u, currentRent: Number(e.target.value)} : u);
                              setRentRoll(updated);
                            }}
                            className="w-24 px-2 py-1 border rounded text-sm text-right"
                          />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-gray-600 text-sm">
                            {formatCurrency(selectedUnitType.marketRent)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-green-600">
                          {formatCurrency(selectedUnitType.marketRent - unit.currentRent)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 bg-gray-50">
                    <td className="py-3 px-4 font-bold">Total ({rentRoll.length} units)</td>
                    <td className="py-3 px-4"></td>
                    <td className="py-3 px-4 text-right font-bold">
                      {formatCurrency(rentRoll.reduce((sum, unit) => sum + unit.currentRent, 0))}
                    </td>
                    <td className="py-3 px-4 text-right font-bold">
                      {formatCurrency(rentRoll.reduce((sum, unit) => {
                        const unitType = unitTypes.find(ut => ut.id === unit.unitTypeId);
                        return sum + (unitType ? unitType.marketRent : unit.proFormaRent);
                      }, 0))}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-green-600">
                      {formatCurrency(rentRoll.reduce((sum, unit) => {
                        const unitType = unitTypes.find(ut => ut.id === unit.unitTypeId);
                        return sum + ((unitType ? unitType.marketRent : unit.proFormaRent) - unit.currentRent);
                      }, 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'rehab' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Rehab Budget</h2>
            <button 
              onClick={addRehabItem}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Item
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Category</th>
                  <th className="text-right py-3 px-4">Per Unit Cost</th>
                  <th className="text-right py-3 px-4">Quantity</th>
                  <th className="text-right py-3 px-4">Total Cost</th>
                </tr>
              </thead>
              <tbody>
                {rehabBudget.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={item.category}
                        onChange={(e) => {
                          const updated = rehabBudget.map(i => i.id === item.id ? {...i, category: e.target.value} : i);
                          setRehabBudget(updated);
                        }}
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <input
                        type="number"
                        value={item.perUnitCost}
                        onChange={(e) => {
                          const perUnitCost = Number(e.target.value);
                          const totalCost = perUnitCost * item.quantity;
                          const updated = rehabBudget.map(i => i.id === item.id ? {...i, perUnitCost, totalCost} : i);
                          setRehabBudget(updated);
                        }}
                        className="w-24 px-2 py-1 border rounded text-sm text-right"
                      />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => {
                          const quantity = Number(e.target.value);
                          const totalCost = item.perUnitCost * quantity;
                          const updated = rehabBudget.map(i => i.id === item.id ? {...i, quantity, totalCost} : i);
                          setRehabBudget(updated);
                        }}
                        className="w-20 px-2 py-1 border rounded text-sm text-right"
                      />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <input
                        type="number"
                        value={item.totalCost}
                        onChange={(e) => {
                          const updated = rehabBudget.map(i => i.id === item.id ? {...i, totalCost: Number(e.target.value)} : i);
                          setRehabBudget(updated);
                        }}
                        className="w-28 px-2 py-1 border rounded text-sm text-right font-medium"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 bg-gray-50">
                  <td className="py-3 px-4 font-bold">Total Rehab Budget</td>
                  <td className="py-3 px-4"></td>
                  <td className="py-3 px-4"></td>
                  <td className="py-3 px-4 text-right font-bold text-lg">
                    {formatCurrency(rehabBudget.reduce((sum, item) => sum + item.totalCost, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'proforma' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-6">12-Month Pro Forma</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium">Item</th>
                  {Array.from({length: 12}, (_, i) => (
                    <th key={i} className="text-right py-3 px-2 font-medium">
                      {new Date(2024, i).toLocaleDateString('en-US', { month: 'short' })}
                    </th>
                  ))}
                  <th className="text-right py-3 px-4 font-bold">Annual</th>
                </tr>
              </thead>
              <tbody>
                {/* Revenue Section */}
                <tr className="bg-green-50">
                  <td className="py-2 px-4 font-semibold text-green-800">REVENUE</td>
                  {Array.from({length: 13}).map((_, i) => (
                    <td key={i} className="py-2 px-2"></td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-4 text-gray-700">Gross Rental Income</td>
                  {Array.from({length: 12}, (_, i) => (
                    <td key={i} className="py-2 px-2 text-right">
                      {formatCurrency(metrics.grossRent / 12)}
                    </td>
                  ))}
                  <td className="py-2 px-4 text-right font-bold">
                    {formatCurrency(metrics.grossRent)}
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-4 text-gray-700">Vacancy Loss</td>
                  {Array.from({length: 12}, (_, i) => (
                    <td key={i} className="py-2 px-2 text-right text-red-600">
                      -{formatCurrency(metrics.vacancyLoss / 12)}
                    </td>
                  ))}
                  <td className="py-2 px-4 text-right font-bold text-red-600">
                    -{formatCurrency(metrics.vacancyLoss)}
                  </td>
                </tr>
                <tr className="border-b bg-green-100">
                  <td className="py-2 px-4 font-semibold">Net Rental Income</td>
                  {Array.from({length: 12}, (_, i) => (
                    <td key={i} className="py-2 px-2 text-right font-semibold">
                      {formatCurrency(metrics.netRevenue / 12)}
                    </td>
                  ))}
                  <td className="py-2 px-4 text-right font-bold text-green-600">
                    {formatCurrency(metrics.netRevenue)}
                  </td>
                </tr>

                {/* Expenses Section */}
                <tr className="bg-red-50">
                  <td className="py-2 px-4 font-semibold text-red-800">EXPENSES</td>
                  {Array.from({length: 13}).map((_, i) => (
                    <td key={i} className="py-2 px-2"></td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-4 text-gray-700">Property Tax</td>
                  {Array.from({length: 12}, (_, i) => (
                    <td key={i} className="py-2 px-2 text-right">
                      {formatCurrency(expenses.propertyTax / 12)}
                    </td>
                  ))}
                  <td className="py-2 px-4 text-right font-bold">
                    {formatCurrency(expenses.propertyTax)}
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-4 text-gray-700">Insurance</td>
                  {Array.from({length: 12}, (_, i) => (
                    <td key={i} className="py-2 px-2 text-right">
                      {formatCurrency(expenses.insurance / 12)}
                    </td>
                  ))}
                  <td className="py-2 px-4 text-right font-bold">
                    {formatCurrency(expenses.insurance)}
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-4 text-gray-700">Maintenance</td>
                  {Array.from({length: 12}, (_, i) => (
                    <td key={i} className="py-2 px-2 text-right">
                      {formatCurrency(expenses.maintenance / 12)}
                    </td>
                  ))}
                  <td className="py-2 px-4 text-right font-bold">
                    {formatCurrency(expenses.maintenance)}
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-4 text-gray-700">Management Fee</td>
                  {Array.from({length: 12}, (_, i) => (
                    <td key={i} className="py-2 px-2 text-right">
                      {formatCurrency(metrics.managementFee / 12)}
                    </td>
                  ))}
                  <td className="py-2 px-4 text-right font-bold">
                    {formatCurrency(metrics.managementFee)}
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-4 text-gray-700">Water/Sewer/Trash</td>
                  {Array.from({length: 12}, (_, i) => (
                    <td key={i} className="py-2 px-2 text-right">
                      {formatCurrency(expenses.waterSewerTrash / 12)}
                    </td>
                  ))}
                  <td className="py-2 px-4 text-right font-bold">
                    {formatCurrency(expenses.waterSewerTrash)}
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-4 text-gray-700">Capital Reserves</td>
                  {Array.from({length: 12}, (_, i) => (
                    <td key={i} className="py-2 px-2 text-right">
                      {formatCurrency(expenses.capitalReserves / 12)}
                    </td>
                  ))}
                  <td className="py-2 px-4 text-right font-bold">
                    {formatCurrency(expenses.capitalReserves)}
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-4 text-gray-700">Utilities</td>
                  {Array.from({length: 12}, (_, i) => (
                    <td key={i} className="py-2 px-2 text-right">
                      {formatCurrency(expenses.utilities / 12)}
                    </td>
                  ))}
                  <td className="py-2 px-4 text-right font-bold">
                    {formatCurrency(expenses.utilities)}
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-4 text-gray-700">Other</td>
                  {Array.from({length: 12}, (_, i) => (
                    <td key={i} className="py-2 px-2 text-right">
                      {formatCurrency(expenses.other / 12)}
                    </td>
                  ))}
                  <td className="py-2 px-4 text-right font-bold">
                    {formatCurrency(expenses.other)}
                  </td>
                </tr>
                <tr className="border-b bg-red-100">
                  <td className="py-2 px-4 font-semibold">Total Expenses</td>
                  {Array.from({length: 12}, (_, i) => (
                    <td key={i} className="py-2 px-2 text-right font-semibold">
                      {formatCurrency(metrics.totalExpenses / 12)}
                    </td>
                  ))}
                  <td className="py-2 px-4 text-right font-bold text-red-600">
                    {formatCurrency(metrics.totalExpenses)}
                  </td>
                </tr>

                {/* NOI Section */}
                <tr className="border-b bg-blue-100">
                  <td className="py-3 px-4 font-bold text-blue-800">NET OPERATING INCOME</td>
                  {Array.from({length: 12}, (_, i) => (
                    <td key={i} className="py-3 px-2 text-right font-bold text-blue-800">
                      {formatCurrency(metrics.noi / 12)}
                    </td>
                  ))}
                  <td className="py-3 px-4 text-right font-bold text-blue-600 text-lg">
                    {formatCurrency(metrics.noi)}
                  </td>
                </tr>

                {/* Debt Service */}
                <tr className="border-b">
                  <td className="py-2 px-4 text-gray-700">Debt Service (Post-Refi)</td>
                  {Array.from({length: 12}, (_, i) => (
                    <td key={i} className="py-2 px-2 text-right text-red-600">
                      -{formatCurrency(metrics.monthlyDebtService)}
                    </td>
                  ))}
                  <td className="py-2 px-4 text-right font-bold text-red-600">
                    -{formatCurrency(metrics.annualDebtService)}
                  </td>
                </tr>

                {/* Cash Flow */}
                <tr className="border-t-2 bg-green-200">
                  <td className="py-3 px-4 font-bold text-green-800">NET CASH FLOW</td>
                  {Array.from({length: 12}, (_, i) => (
                    <td key={i} className="py-3 px-2 text-right font-bold text-green-800">
                      {formatCurrency(metrics.netCashFlow / 12)}
                    </td>
                  ))}
                  <td className="py-3 px-4 text-right font-bold text-green-600 text-lg">
                    {formatCurrency(metrics.netCashFlow)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}