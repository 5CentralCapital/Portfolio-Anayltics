import React, { useState, useEffect } from 'react';
import { Building, Users, Wrench, Calculator, DollarSign, Calendar, AlertTriangle, TrendingUp, Home, Target, BarChart3 } from 'lucide-react';

export default function DealAnalyzer() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [dealData, setDealData] = useState<any>(null);
  const [editingProperty, setEditingProperty] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);
  const [propertyName, setPropertyName] = useState('Maple Street Apartments');
  const [propertyAddress, setPropertyAddress] = useState('123 Maple Street, Hartford, CT 06106');
  const [editingExpenses, setEditingExpenses] = useState(false);
  const [editingClosingCosts, setEditingClosingCosts] = useState(false);
  const [editingHoldingCosts, setEditingHoldingCosts] = useState(false);
  
  // Exit analysis state
  const [exitAnalysis, setExitAnalysis] = useState({
    saleFactor: 1.0, // Multiplier for ARV to get sale price
    saleCostsPercent: 0.06, // 6% for broker, legal, closing fees
    holdPeriodYears: 2
  });
  
  // Editable assumptions state
  const [assumptions, setAssumptions] = useState({
    unitCount: 8,
    purchasePrice: 1500000,
    loanPercentage: 0.80,
    interestRate: 0.0875,
    loanTermYears: 2,
    vacancyRate: 0.05,
    expenseRatio: 0.45,
    marketCapRate: 0.055,
    refinanceLTV: 0.75,
    refinanceInterestRate: 0.065,
    refinanceClosingCostPercent: 0.02,
    dscrThreshold: 1.25
  });

  // Closing costs breakdown
  const [closingCosts, setClosingCosts] = useState<{ [key: string]: number }>({
    titleInsurance: 4500,
    appraisalFee: 800,
    legalFees: 2500,
    transferTax: 8000,
    miscellaneous: 2200,
    sellerCredit: -5000
  });

  const [closingCostNames, setClosingCostNames] = useState<{ [key: string]: string }>({
    titleInsurance: 'Title Insurance',
    appraisalFee: 'Appraisal Fee',
    legalFees: 'Legal Fees',
    transferTax: 'Transfer Tax',
    miscellaneous: 'Miscellaneous',
    sellerCredit: 'Seller Credit'
  });

  // Holding costs breakdown
  const [holdingCosts, setHoldingCosts] = useState<{ [key: string]: number }>({
    electric: 2400,
    water: 1800,
    gas: 1200,
    interest: 9600,
    title: 3000
  });

  const [holdingCostNames, setHoldingCostNames] = useState<{ [key: string]: string }>({
    electric: 'Electric',
    water: 'Water',
    gas: 'Gas',
    interest: 'Interest',
    title: 'Title'
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

  // Structured rehab budget matching the provided format
  const [rehabBudgetSections, setRehabBudgetSections] = useState({
    exterior: [
      { id: 1, category: 'Demolition', perUnitCost: 1500, quantity: 1, totalCost: 15000 },
      { id: 2, category: 'Permits', perUnitCost: 500, quantity: 1, totalCost: 5000 },
      { id: 3, category: 'Windows', perUnitCost: 3750, quantity: 8, totalCost: 30000 },
      { id: 4, category: 'Landscaping', perUnitCost: 500, quantity: 1, totalCost: 5000 },
    ],
    generalInterior: [
      { id: 1, category: 'Exterior Doors', perUnitCost: 1250, quantity: 1, totalCost: 12500 },
      { id: 2, category: 'Framing', perUnitCost: 500, quantity: 1, totalCost: 5000 },
      { id: 3, category: 'Drywall', perUnitCost: 3500, quantity: 1, totalCost: 35000 },
      { id: 4, category: 'Insulation', perUnitCost: 1250, quantity: 1, totalCost: 12500 },
      { id: 5, category: 'Hot Water Heater', perUnitCost: 800, quantity: 1, totalCost: 8000 },
      { id: 6, category: 'Plumbing', perUnitCost: 1500, quantity: 1, totalCost: 15000 },
      { id: 7, category: 'Electric panels', perUnitCost: 2000, quantity: 1, totalCost: 8000 },
      { id: 8, category: 'Electrical wiring', perUnitCost: 1000, quantity: 1, totalCost: 10000 },
      { id: 9, category: 'Mini split', perUnitCost: 2000, quantity: 1, totalCost: 20000 },
      { id: 10, category: 'Paint', perUnitCost: 1000, quantity: 1, totalCost: 10000 },
      { id: 11, category: 'Interior door', perUnitCost: 500, quantity: 1, totalCost: 5000 },
      { id: 12, category: 'Flooring', perUnitCost: 2612.50, quantity: 1, totalCost: 26125 },
    ],
    kitchens: [
      { id: 1, category: 'Cabinets', perUnitCost: 2250, quantity: 1, totalCost: 22500 },
      { id: 2, category: 'Counter', perUnitCost: 750, quantity: 1, totalCost: 7500 },
      { id: 3, category: 'Sink + faucet', perUnitCost: 500, quantity: 1, totalCost: 5000 },
      { id: 4, category: 'Appliances', perUnitCost: 1000, quantity: 1, totalCost: 10000 },
    ],
    bathrooms: [
      { id: 1, category: 'Toilet', perUnitCost: 350, quantity: 1, totalCost: 3500 },
      { id: 2, category: 'Vanity/Mirror', perUnitCost: 650, quantity: 1, totalCost: 6500 },
      { id: 3, category: 'Shower', perUnitCost: 1000, quantity: 1, totalCost: 10000 },
      { id: 4, category: 'Tile', perUnitCost: 1250, quantity: 1, totalCost: 12500 },
      { id: 5, category: 'Lighting', perUnitCost: 100, quantity: 1, totalCost: 1000 },
    ],
    finishings: [
      { id: 1, category: 'Fixtures', perUnitCost: 200, quantity: 1, totalCost: 2000 },
      { id: 2, category: 'Lights', perUnitCost: 500, quantity: 1, totalCost: 5000 },
      { id: 3, category: 'Blinds, Doorknobs', perUnitCost: 650, quantity: 1, totalCost: 6500 },
    ]
  });

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
    const exteriorTotal = rehabBudgetSections.exterior.reduce((sum, item) => sum + item.totalCost, 0);
    const generalInteriorTotal = rehabBudgetSections.generalInterior.reduce((sum, item) => sum + item.totalCost, 0);
    const kitchensTotal = rehabBudgetSections.kitchens.reduce((sum, item) => sum + item.totalCost, 0);
    const bathroomsTotal = rehabBudgetSections.bathrooms.reduce((sum, item) => sum + item.totalCost, 0);
    const finishingsTotal = rehabBudgetSections.finishings.reduce((sum, item) => sum + item.totalCost, 0);
    
    const rehabSubtotal = exteriorTotal + generalInteriorTotal + kitchensTotal + bathroomsTotal + finishingsTotal;
    const contingency = rehabSubtotal * 0.10; // 10% buffer as shown in image
    const totalRehab = rehabSubtotal + contingency;
    const totalClosingCosts = Object.values(closingCosts).reduce((sum, cost) => sum + cost, 0);
    const totalHoldingCosts = Object.values(holdingCosts).reduce((sum, cost) => sum + cost, 0);
    const initialLoan = assumptions.purchasePrice * assumptions.loanPercentage;
    const downPayment = assumptions.purchasePrice - initialLoan;
    const totalCashInvested = downPayment + totalClosingCosts + totalHoldingCosts + totalRehab;
    const allInCost = assumptions.purchasePrice + totalRehab + totalClosingCosts + totalHoldingCosts;
    
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
    const refinanceClosingCosts = refinanceLoan * assumptions.refinanceClosingCostPercent;
    const cashOut = Math.max(0, refinanceLoan - initialLoan - refinanceClosingCosts);
    
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
    const totalProfit = arv - allInCost - totalHoldingCosts;
    const capitalRequired = downPayment + totalClosingCosts;
    
    // Exit analysis calculations
    const salePrice = arv * exitAnalysis.saleFactor;
    const saleCosts = salePrice * exitAnalysis.saleCostsPercent;
    const debtPayoff = refinanceLoan; // Simplified - assumes no amortization
    const netProceeds = salePrice - saleCosts - debtPayoff;
    const totalCashFlowOverHold = netCashFlow * exitAnalysis.holdPeriodYears;
    const roiOnSale = capitalRequired > 0 ? ((netProceeds + totalCashFlowOverHold - capitalRequired) / capitalRequired) : 0;
    
    // Risk scoring
    const getRiskScore = () => {
      let score = 0;
      let warnings = [];
      
      if (equityMultiple < 2.0) {
        score += 2;
        warnings.push('Low equity multiple');
      }
      if (dscr < assumptions.dscrThreshold) {
        score += 2;
        warnings.push('DSCR below threshold');
      }
      if (cashOut < capitalRequired) {
        score += 1;
        warnings.push('Cash-out less than capital invested');
      }
      if (breakEvenOccupancy > 0.90) {
        score += 1;
        warnings.push('High break-even occupancy');
      }
      
      let level = 'Low';
      let color = 'green';
      if (score >= 3) {
        level = 'High';
        color = 'red';
      } else if (score >= 1) {
        level = 'Moderate';
        color = 'yellow';
      }
      
      return { score, level, color, warnings };
    };
    
    const riskAssessment = getRiskScore();
    
    return {
      totalRehab,
      totalClosingCosts,
      totalHoldingCosts,
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
      refinanceClosingCosts,
      cashOut,
      monthlyDebtService,
      annualDebtService,
      netCashFlow,
      dscr,
      cashOnCashReturn,
      equityMultiple,
      breakEvenOccupancy,
      totalProfit,
      capitalRequired,
      salePrice,
      saleCosts,
      netProceeds,
      roiOnSale,
      riskAssessment
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

  const addRehabItem = (section: string) => {
    const currentSection = rehabBudgetSections[section as keyof typeof rehabBudgetSections];
    const maxId = currentSection.length > 0 ? Math.max(...currentSection.map(i => i.id)) : 0;
    const newItem = {
      id: maxId + 1,
      category: 'New Item',
      perUnitCost: 0,
      quantity: 1,
      totalCost: 0
    };
    
    setRehabBudgetSections(prev => ({
      ...prev,
      [section]: [...prev[section as keyof typeof prev], newItem]
    }));
  };

  const updateRehabItem = (section: string, itemId: number, field: string, value: number | string) => {
    setRehabBudgetSections(prev => ({
      ...prev,
      [section]: prev[section as keyof typeof prev].map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value };
          // Automatically calculate totalCost when perUnitCost or quantity changes
          if (field === 'perUnitCost' || field === 'quantity') {
            updatedItem.totalCost = updatedItem.perUnitCost * updatedItem.quantity;
          }
          return updatedItem;
        }
        return item;
      })
    }));
  };

  const updateExpense = (key: string, value: number) => {
    setExpenses(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const addExpenseItem = () => {
    const newKey = `custom_${Date.now()}`;
    const newName = `Custom Expense ${Object.keys(expenses).length}`;
    setExpenses(prev => ({ ...prev, [newKey]: 0 }));
    setExpenseNames(prev => ({ ...prev, [newKey]: newName }));
  };

  const updateClosingCost = (key: string, value: number) => {
    setClosingCosts(prev => ({ ...prev, [key]: value }));
  };

  const updateHoldingCost = (key: string, value: number) => {
    setHoldingCosts(prev => ({ ...prev, [key]: value }));
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
    { id: 'exit', label: 'Exit Analysis', icon: TrendingUp },
    { id: 'sensitivity', label: 'Sensitivity Analysis', icon: TrendingUp },
    { id: 'proforma', label: '12 Month Pro Forma', icon: Calendar }
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="space-y-2">
          <div className="flex items-center gap-6">
            <div>
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
                  className="text-2xl font-bold text-gray-900 border-b-2 border-blue-500 bg-transparent outline-none"
                  autoFocus
                />
              ) : (
                <h1 
                  className="text-2xl font-bold text-gray-900 cursor-pointer hover:text-blue-600" 
                  title="Double-click to edit"
                  onDoubleClick={() => setEditingProperty(true)}
                >
                  {propertyName}
                </h1>
              )}
            </div>
            <div className="text-lg text-gray-600">•</div>
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
                  className="text-base text-gray-600 border-b border-blue-300 bg-transparent outline-none"
                  autoFocus
                />
              ) : (
                <p 
                  className="text-base text-gray-600 cursor-pointer hover:text-blue-600" 
                  title="Double-click to edit"
                  onDoubleClick={() => setEditingAddress(true)}
                >
                  {propertyAddress}
                </p>
              )}
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {assumptions.unitCount} Units • Multifamily • Value-Add Strategy
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
          {/* Top KPI Bar - Full Width */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white">
            <div className="grid grid-cols-6 gap-4">
              <div className="text-center">
                <p className="text-sm opacity-90 mb-2">All-In Cost</p>
                <p className="text-xl font-bold">{formatCurrency(metrics.allInCost)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm opacity-90 mb-2">ARV</p>
                <p className="text-xl font-bold">{formatCurrency(metrics.arv)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm opacity-90 mb-2">Total Profit</p>
                <p className="text-xl font-bold text-green-300">{formatCurrency(metrics.totalProfit)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm opacity-90 mb-2">Capital Required</p>
                <p className="text-xl font-bold text-orange-300">{formatCurrency(metrics.capitalRequired)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm opacity-90 mb-2">Cash-Out Refi</p>
                <p className="text-xl font-bold">{formatCurrency(metrics.cashOut)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm opacity-90 mb-2">Equity Multiple</p>
                <p className="text-xl font-bold">{metrics.equityMultiple.toFixed(2)}x</p>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
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

            {/* Closing & Holding Costs */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Calculator className="h-5 w-5 mr-2 text-green-600" />
                Closing & Holding Costs (Purchase)
              </h3>
              
              {/* Closing Costs */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 
                    className="text-md font-medium text-gray-800 cursor-pointer hover:text-blue-600"
                    onDoubleClick={() => setEditingClosingCosts(true)}
                    title="Double-click to edit closing costs"
                  >
                    Closing Costs
                  </h4>
                  {editingClosingCosts && (
                    <button
                      onClick={() => setEditingClosingCosts(false)}
                      className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                    >
                      Done
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  {editingClosingCosts ? (
                    <>
                      {Object.entries(closingCosts).map(([key, value]) => {
                        const label = closingCostNames[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                        return (
                          <div key={key} className="flex justify-between items-center gap-2">
                            <input
                              type="text"
                              value={label}
                              onChange={(e) => {
                                setClosingCostNames(prev => ({
                                  ...prev,
                                  [key]: e.target.value
                                }));
                              }}
                              className="flex-1 px-2 py-1 border rounded text-sm text-gray-700"
                            />
                            <input
                              type="number"
                              value={value}
                              onChange={(e) => updateClosingCost(key, Number(e.target.value))}
                              className="w-24 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                            />
                          </div>
                        );
                      })}
                    </>
                  ) : (
                    <>
                      {Object.entries(closingCosts).map(([key, value]) => {
                        const label = closingCostNames[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                        return (
                          <div key={key} className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700 flex-1">{label}</span>
                            <span className="text-sm font-medium">{formatCurrency(value)}</span>
                          </div>
                        );
                      })}
                    </>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="font-medium text-gray-900">Total Closing Costs (Purchase)</span>
                    <span className="font-bold text-green-600">
                      {formatCurrency(Object.values(closingCosts).reduce((sum, cost) => sum + cost, 0))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Holding Costs */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 
                    className="text-md font-medium text-gray-800 cursor-pointer hover:text-blue-600"
                    onDoubleClick={() => setEditingHoldingCosts(true)}
                    title="Double-click to edit holding costs"
                  >
                    Holding Costs
                  </h4>
                  {editingHoldingCosts && (
                    <button
                      onClick={() => setEditingHoldingCosts(false)}
                      className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                    >
                      Done
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  {editingHoldingCosts ? (
                    <>
                      {Object.entries(holdingCosts).map(([key, value]) => {
                        const label = holdingCostNames[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                        return (
                          <div key={key} className="flex justify-between items-center gap-2">
                            <input
                              type="text"
                              value={label}
                              onChange={(e) => {
                                setHoldingCostNames(prev => ({
                                  ...prev,
                                  [key]: e.target.value
                                }));
                              }}
                              className="flex-1 px-2 py-1 border rounded text-sm text-gray-700"
                            />
                            <input
                              type="number"
                              value={value}
                              onChange={(e) => updateHoldingCost(key, Number(e.target.value))}
                              className="w-24 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                            />
                          </div>
                        );
                      })}
                    </>
                  ) : (
                    <>
                      {Object.entries(holdingCosts).map(([key, value]) => {
                        const label = holdingCostNames[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                        return (
                          <div key={key} className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700 flex-1">{label}</span>
                            <span className="text-sm font-medium">{formatCurrency(value)}</span>
                          </div>
                        );
                      })}
                    </>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="font-medium text-gray-900">Total Holding Costs (Purchase)</span>
                    <span className="font-bold text-green-600">
                      {formatCurrency(Object.values(holdingCosts).reduce((sum, cost) => sum + cost, 0))}
                    </span>
                  </div>
                </div>
              </div>
            </div>


          </div>

          {/* CENTER PANEL - Financial Breakdown */}
          <div className="col-span-6 space-y-6">
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
                      <button
                        onClick={addExpenseItem}
                        className="w-full mt-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded border border-dashed border-gray-300"
                      >
                        + Add Line Item
                      </button>
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

            {/* Market Assumptions */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Target className="h-5 w-5 mr-2 text-green-600" />
                Market Assumptions
              </h3>
              <div className="grid grid-cols-3 gap-6">
                {/* General Market */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-800 border-b pb-1">Market Factors</h4>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Vacancy Rate (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={assumptions.vacancyRate * 100}
                      onChange={(e) => updateAssumption('vacancyRate', Number(e.target.value) / 100)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Market Cap Rate (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={assumptions.marketCapRate * 100}
                      onChange={(e) => updateAssumption('marketCapRate', Number(e.target.value) / 100)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                </div>
                
                {/* Refinance Terms */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-800 border-b pb-1">Refinance Terms</h4>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Refinance LTV (%)</label>
                    <input
                      type="number"
                      step="1"
                      value={assumptions.refinanceLTV * 100}
                      onChange={(e) => updateAssumption('refinanceLTV', Number(e.target.value) / 100)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Refinance Rate (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={assumptions.refinanceInterestRate * 100}
                      onChange={(e) => updateAssumption('refinanceInterestRate', Number(e.target.value) / 100)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                </div>
                
                {/* Analysis Thresholds */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-800 border-b pb-1">Analysis Settings</h4>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Refi Closing Costs (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={assumptions.refinanceClosingCostPercent * 100}
                      onChange={(e) => updateAssumption('refinanceClosingCostPercent', Number(e.target.value) / 100)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">DSCR Threshold</label>
                    <input
                      type="number"
                      step="0.01"
                      value={assumptions.dscrThreshold}
                      onChange={(e) => updateAssumption('dscrThreshold', Number(e.target.value))}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
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
                    <span className="text-sm text-gray-600">Refinance Closing Costs ({formatPercent(assumptions.refinanceClosingCostPercent)})</span>
                    <span className="font-medium text-red-600">-{formatCurrency(metrics.refinanceClosingCosts)}</span>
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

                {/* Risk Scoring Badge */}
                <div className={`border rounded-lg p-3 ${
                  metrics.riskAssessment.color === 'red' ? 'bg-red-50 border-red-200' :
                  metrics.riskAssessment.color === 'yellow' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-green-50 border-green-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-2 ${
                        metrics.riskAssessment.color === 'red' ? 'bg-red-500' :
                        metrics.riskAssessment.color === 'yellow' ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}></div>
                      <span className={`font-medium text-sm ${
                        metrics.riskAssessment.color === 'red' ? 'text-red-800' :
                        metrics.riskAssessment.color === 'yellow' ? 'text-yellow-800' :
                        'text-green-800'
                      }`}>
                        {metrics.riskAssessment.level} Risk
                      </span>
                    </div>
                    <span className={`text-xs ${
                      metrics.riskAssessment.color === 'red' ? 'text-red-600' :
                      metrics.riskAssessment.color === 'yellow' ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      Score: {metrics.riskAssessment.score}
                    </span>
                  </div>
                  {metrics.riskAssessment.warnings.length > 0 && (
                    <div className="mt-2">
                      <ul className={`text-xs space-y-1 ${
                        metrics.riskAssessment.color === 'red' ? 'text-red-700' :
                        metrics.riskAssessment.color === 'yellow' ? 'text-yellow-700' :
                        'text-green-700'
                      }`}>
                        {metrics.riskAssessment.warnings.map((warning, index) => (
                          <li key={index}>• {warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      )}

      {activeTab === 'exit' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
              Exit Analysis - Hold vs Sell Comparison
            </h3>
            
            <div className="grid grid-cols-2 gap-8">
              {/* Hold Strategy */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold mb-4 text-blue-600">Hold Strategy</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Hold Period (Years)</span>
                    <input
                      type="number"
                      value={exitAnalysis.holdPeriodYears}
                      onChange={(e) => setExitAnalysis({...exitAnalysis, holdPeriodYears: parseFloat(e.target.value) || 1})}
                      className="w-20 px-2 py-1 border rounded text-right"
                      step="0.5"
                      min="0.5"
                    />
                  </div>
                  <div className="flex justify-between">
                    <span>Annual Cash Flow</span>
                    <span className="font-medium">{formatCurrency(metrics.netCashFlow)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Cash Flow</span>
                    <span className="font-bold text-green-600">{formatCurrency(metrics.netCashFlow * exitAnalysis.holdPeriodYears)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Property Appreciation</span>
                    <span className="font-medium">{formatCurrency(metrics.arv - assumptions.purchasePrice)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between">
                    <span className="font-semibold">Total Hold Return</span>
                    <span className="font-bold text-blue-600">{formatCurrency((metrics.netCashFlow * exitAnalysis.holdPeriodYears) + (metrics.arv - assumptions.purchasePrice))}</span>
                  </div>
                </div>
              </div>

              {/* Sell Strategy */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold mb-4 text-green-600">Sell Strategy</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Sale Price Factor</span>
                    <input
                      type="number"
                      value={exitAnalysis.saleFactor}
                      onChange={(e) => setExitAnalysis({...exitAnalysis, saleFactor: parseFloat(e.target.value) || 1})}
                      className="w-20 px-2 py-1 border rounded text-right"
                      step="0.01"
                      min="0.5"
                      max="1.5"
                    />
                  </div>
                  <div className="flex justify-between">
                    <span>Sale Price</span>
                    <span className="font-medium">{formatCurrency(metrics.salePrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sale Costs ({(exitAnalysis.saleCostsPercent * 100).toFixed(1)}%)</span>
                    <span className="font-medium text-red-600">-{formatCurrency(metrics.saleCosts)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Debt Payoff</span>
                    <span className="font-medium text-red-600">-{formatCurrency(metrics.refinanceLoan)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cash Flow During Hold</span>
                    <span className="font-medium">{formatCurrency(metrics.netCashFlow * exitAnalysis.holdPeriodYears)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between">
                    <span className="font-semibold">Net Proceeds</span>
                    <span className="font-bold text-green-600">{formatCurrency(metrics.netProceeds + (metrics.netCashFlow * exitAnalysis.holdPeriodYears))}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ROI Comparison */}
            <div className="mt-8 bg-gray-50 rounded-lg p-6">
              <h4 className="text-lg font-semibold mb-4">ROI Comparison</h4>
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <span className="text-gray-600">Capital Required</span>
                  <div className="text-2xl font-bold text-orange-600">{formatCurrency(metrics.capitalRequired)}</div>
                </div>
                <div>
                  <span className="text-gray-600">Hold ROI</span>
                  <div className="text-2xl font-bold text-blue-600">{((((metrics.netCashFlow * exitAnalysis.holdPeriodYears) + (metrics.arv - assumptions.purchasePrice)) / metrics.capitalRequired) * 100).toFixed(1)}%</div>
                </div>
                <div>
                  <span className="text-gray-600">Sell ROI</span>
                  <div className="text-2xl font-bold text-green-600">{(metrics.roiOnSale * 100).toFixed(1)}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sensitivity' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-purple-600" />
              Sensitivity Analysis
            </h3>
            
            <div className="grid grid-cols-2 gap-8">
              {/* Rent Sensitivity */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold mb-4 text-blue-600">Rent Sensitivity</h4>
                <div className="space-y-3">
                  {[-10, -5, 0, 5, 10].map(percent => {
                    const adjustedRent = metrics.grossRent * (1 + percent / 100);
                    const adjustedNOI = adjustedRent * (1 - assumptions.vacancyRate - 0.05) - metrics.totalExpenses; // 5% management fee
                    const adjustedCashFlow = adjustedNOI - metrics.annualDebtService;
                    return (
                      <div key={percent} className="flex justify-between items-center">
                        <span className={percent === 0 ? 'font-bold' : ''}>{percent > 0 ? '+' : ''}{percent}%</span>
                        <span className={`${adjustedCashFlow >= 0 ? 'text-green-600' : 'text-red-600'} ${percent === 0 ? 'font-bold' : ''}`}>
                          {formatCurrency(adjustedCashFlow)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cap Rate Sensitivity */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold mb-4 text-green-600">Cap Rate Sensitivity</h4>
                <div className="space-y-3">
                  {[4.0, 4.5, 5.0, 5.5, 6.0].map(capRate => {
                    const impliedValue = metrics.noi / (capRate / 100);
                    const profitAtCap = impliedValue - metrics.allInCost;
                    return (
                      <div key={capRate} className="flex justify-between items-center">
                        <span className={capRate === 5.0 ? 'font-bold' : ''}>{capRate.toFixed(1)}%</span>
                        <div className="text-right">
                          <div className={`${profitAtCap >= 0 ? 'text-green-600' : 'text-red-600'} ${capRate === 5.0 ? 'font-bold' : ''}`}>
                            {formatCurrency(impliedValue)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatCurrency(profitAtCap)} profit
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Interest Rate Impact */}
            <div className="mt-6 border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold mb-4 text-purple-600">Interest Rate Impact</h4>
              <div className="grid grid-cols-5 gap-4">
                {[3.5, 4.0, 4.5, 5.0, 5.5].map(rate => {
                  const monthlyRate = rate / 100 / 12;
                  const payments = assumptions.loanTermYears * 12;
                  const monthlyPayment = (metrics.initialLoan * monthlyRate * Math.pow(1 + monthlyRate, payments)) / (Math.pow(1 + monthlyRate, payments) - 1);
                  const annualPayment = monthlyPayment * 12;
                  const adjustedCashFlow = metrics.noi - annualPayment;
                  
                  return (
                    <div key={rate} className="text-center">
                      <div className={`font-semibold ${rate === assumptions.interestRate * 100 ? 'text-blue-600' : ''}`}>
                        {rate.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatCurrency(monthlyPayment)}/mo
                      </div>
                      <div className={`text-sm font-medium ${adjustedCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(adjustedCashFlow)}
                      </div>
                    </div>
                  );
                })}
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
        <div className="space-y-6">
          <h2 className="text-xl font-bold mb-6">Rehab Budget</h2>
          
          <div className="grid grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-2 px-3 font-medium text-sm border-r">Category</th>
                      <th className="text-right py-2 px-3 font-medium text-sm border-r">Per unit</th>
                      <th className="text-right py-2 px-3 font-medium text-sm border-r">Number of units</th>
                      <th className="text-right py-2 px-3 font-medium text-sm">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Exterior Section Header */}
                    <tr className="bg-blue-50">
                      <td className="py-2 px-3 font-semibold text-blue-700" colSpan={3}>Exterior</td>
                      <td className="py-2 px-3 text-right">
                        <button 
                          onClick={() => addRehabItem('exterior')}
                          className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                        >
                          + Add
                        </button>
                      </td>
                    </tr>
                    {/* Exterior Section */}
                    {rehabBudgetSections.exterior.map((item) => (
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className="py-1 px-3 text-sm border-r">
                          <input
                            type="text"
                            value={item.category}
                            onChange={(e) => updateRehabItem('exterior', item.id, 'category', e.target.value)}
                            className="w-full px-1 py-0.5 border-0 bg-transparent text-sm focus:outline-none focus:bg-white focus:border focus:border-blue-300 rounded"
                          />
                        </td>
                        <td className="py-1 px-3 text-right text-sm border-r">
                          $
                          <input
                            type="number"
                            value={item.perUnitCost}
                            onChange={(e) => updateRehabItem('exterior', item.id, 'perUnitCost', Number(e.target.value))}
                            className="w-16 px-1 py-0.5 border-0 bg-transparent text-sm text-right focus:outline-none focus:bg-white focus:border focus:border-blue-300 rounded ml-1"
                          />
                        </td>
                        <td className="py-1 px-3 text-right text-sm border-r">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateRehabItem('exterior', item.id, 'quantity', Number(e.target.value))}
                            className="w-12 px-1 py-0.5 border-0 bg-transparent text-sm text-right focus:outline-none focus:bg-white focus:border focus:border-blue-300 rounded"
                          />
                        </td>
                        <td className="py-1 px-3 text-right text-sm">$ {(item.perUnitCost * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                    <tr className="bg-blue-100 border-b-2">
                      <td className="py-1 px-3 font-medium text-sm border-r">Total</td>
                      <td className="py-1 px-3 text-right text-sm border-r">$ {rehabBudgetSections.exterior.reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0).toFixed(2)}</td>
                      <td className="py-1 px-3 text-right text-sm border-r"></td>
                      <td className="py-1 px-3 text-right font-bold text-sm">
                        $ {rehabBudgetSections.exterior.reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0).toFixed(2)}
                      </td>
                    </tr>

                    {/* Kitchens Section Header */}
                    <tr className="bg-orange-50">
                      <td className="py-2 px-3 font-semibold text-orange-700" colSpan={3}>Kitchens</td>
                      <td className="py-2 px-3 text-right">
                        <button 
                          onClick={() => addRehabItem('kitchens')}
                          className="px-2 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700"
                        >
                          + Add
                        </button>
                      </td>
                    </tr>
                    {rehabBudgetSections.kitchens.map((item) => (
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className="py-1 px-3 text-sm border-r">
                          <input
                            type="text"
                            value={item.category}
                            onChange={(e) => updateRehabItem('kitchens', item.id, 'category', e.target.value)}
                            className="w-full px-1 py-0.5 border-0 bg-transparent text-sm focus:outline-none focus:bg-white focus:border focus:border-blue-300 rounded"
                          />
                        </td>
                        <td className="py-1 px-3 text-right text-sm border-r">
                          $
                          <input
                            type="number"
                            value={item.perUnitCost}
                            onChange={(e) => updateRehabItem('kitchens', item.id, 'perUnitCost', Number(e.target.value))}
                            className="w-16 px-1 py-0.5 border-0 bg-transparent text-sm text-right focus:outline-none focus:bg-white focus:border focus:border-blue-300 rounded ml-1"
                          />
                        </td>
                        <td className="py-1 px-3 text-right text-sm border-r">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateRehabItem('kitchens', item.id, 'quantity', Number(e.target.value))}
                            className="w-12 px-1 py-0.5 border-0 bg-transparent text-sm text-right focus:outline-none focus:bg-white focus:border focus:border-blue-300 rounded"
                          />
                        </td>
                        <td className="py-1 px-3 text-right text-sm">$ {(item.perUnitCost * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                    <tr className="bg-orange-100 border-b-2">
                      <td className="py-1 px-3 font-medium text-sm border-r"></td>
                      <td className="py-1 px-3 text-right font-bold text-sm border-r">
                        $ {rehabBudgetSections.kitchens.reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0).toFixed(2)}
                      </td>
                      <td className="py-1 px-3 text-right text-sm border-r"></td>
                      <td className="py-1 px-3 text-right font-bold text-sm">
                        $ {rehabBudgetSections.kitchens.reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0).toFixed(2)}
                      </td>
                    </tr>

                    {/* Bathrooms Section Header */}
                    <tr className="bg-purple-50">
                      <td className="py-2 px-3 font-semibold text-purple-700" colSpan={3}>Bathrooms</td>
                      <td className="py-2 px-3 text-right">
                        <button 
                          onClick={() => addRehabItem('bathrooms')}
                          className="px-2 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700"
                        >
                          + Add
                        </button>
                      </td>
                    </tr>
                    {rehabBudgetSections.bathrooms.map((item) => (
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className="py-1 px-3 text-sm border-r">
                          <input
                            type="text"
                            value={item.category}
                            onChange={(e) => updateRehabItem('bathrooms', item.id, 'category', e.target.value)}
                            className="w-full px-1 py-0.5 border-0 bg-transparent text-sm focus:outline-none focus:bg-white focus:border focus:border-blue-300 rounded"
                          />
                        </td>
                        <td className="py-1 px-3 text-right text-sm border-r">
                          $
                          <input
                            type="number"
                            value={item.perUnitCost}
                            onChange={(e) => updateRehabItem('bathrooms', item.id, 'perUnitCost', Number(e.target.value))}
                            className="w-16 px-1 py-0.5 border-0 bg-transparent text-sm text-right focus:outline-none focus:bg-white focus:border focus:border-blue-300 rounded ml-1"
                          />
                        </td>
                        <td className="py-1 px-3 text-right text-sm border-r">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateRehabItem('bathrooms', item.id, 'quantity', Number(e.target.value))}
                            className="w-12 px-1 py-0.5 border-0 bg-transparent text-sm text-right focus:outline-none focus:bg-white focus:border focus:border-blue-300 rounded"
                          />
                        </td>
                        <td className="py-1 px-3 text-right text-sm">$ {(item.perUnitCost * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                    <tr className="bg-purple-100 border-b-2">
                      <td className="py-1 px-3 font-medium text-sm border-r"></td>
                      <td className="py-1 px-3 text-right font-bold text-sm border-r">
                        $ {rehabBudgetSections.bathrooms.reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0).toFixed(2)}
                      </td>
                      <td className="py-1 px-3 text-right text-sm border-r"></td>
                      <td className="py-1 px-3 text-right font-bold text-sm">
                        $ {rehabBudgetSections.bathrooms.reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0).toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Column */}
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-2 px-3 font-medium text-sm border-r">Category</th>
                      <th className="text-right py-2 px-3 font-medium text-sm border-r">Per unit</th>
                      <th className="text-right py-2 px-3 font-medium text-sm border-r">Number of units</th>
                      <th className="text-right py-2 px-3 font-medium text-sm">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* General Interior Section Header */}
                    <tr className="bg-green-50">
                      <td className="py-2 px-3 font-semibold text-green-700" colSpan={3}>General Interior Rough</td>
                      <td className="py-2 px-3 text-right">
                        <button 
                          onClick={() => addRehabItem('generalInterior')}
                          className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                        >
                          + Add
                        </button>
                      </td>
                    </tr>
                    {rehabBudgetSections.generalInterior.map((item) => (
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className="py-1 px-3 text-sm border-r">
                          <input
                            type="text"
                            value={item.category}
                            onChange={(e) => updateRehabItem('generalInterior', item.id, 'category', e.target.value)}
                            className="w-full px-1 py-0.5 border-0 bg-transparent text-sm focus:outline-none focus:bg-white focus:border focus:border-blue-300 rounded"
                          />
                        </td>
                        <td className="py-1 px-3 text-right text-sm border-r">
                          $
                          <input
                            type="number"
                            value={item.perUnitCost}
                            onChange={(e) => updateRehabItem('generalInterior', item.id, 'perUnitCost', Number(e.target.value))}
                            className="w-16 px-1 py-0.5 border-0 bg-transparent text-sm text-right focus:outline-none focus:bg-white focus:border focus:border-blue-300 rounded ml-1"
                          />
                        </td>
                        <td className="py-1 px-3 text-right text-sm border-r">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateRehabItem('generalInterior', item.id, 'quantity', Number(e.target.value))}
                            className="w-12 px-1 py-0.5 border-0 bg-transparent text-sm text-right focus:outline-none focus:bg-white focus:border focus:border-blue-300 rounded"
                          />
                        </td>
                        <td className="py-1 px-3 text-right text-sm">$ {(item.perUnitCost * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                    <tr className="bg-green-100 border-b-2">
                      <td className="py-1 px-3 font-medium text-sm border-r"></td>
                      <td className="py-1 px-3 text-right font-bold text-sm border-r">
                        $ {rehabBudgetSections.generalInterior.reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0).toFixed(2)}
                      </td>
                      <td className="py-1 px-3 text-right text-sm border-r"></td>
                      <td className="py-1 px-3 text-right font-bold text-sm">
                        $ {rehabBudgetSections.generalInterior.reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0).toFixed(2)}
                      </td>
                    </tr>

                    {/* Finishings Section Header */}
                    <tr className="bg-yellow-50">
                      <td className="py-2 px-3 font-semibold text-yellow-700" colSpan={3}>Finishings</td>
                      <td className="py-2 px-3 text-right">
                        <button 
                          onClick={() => addRehabItem('finishings')}
                          className="px-2 py-1 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700"
                        >
                          + Add
                        </button>
                      </td>
                    </tr>
                    {rehabBudgetSections.finishings.map((item) => (
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className="py-1 px-3 text-sm border-r">
                          <input
                            type="text"
                            value={item.category}
                            onChange={(e) => updateRehabItem('finishings', item.id, 'category', e.target.value)}
                            className="w-full px-1 py-0.5 border-0 bg-transparent text-sm focus:outline-none focus:bg-white focus:border focus:border-blue-300 rounded"
                          />
                        </td>
                        <td className="py-1 px-3 text-right text-sm border-r">
                          $
                          <input
                            type="number"
                            value={item.perUnitCost}
                            onChange={(e) => updateRehabItem('finishings', item.id, 'perUnitCost', Number(e.target.value))}
                            className="w-16 px-1 py-0.5 border-0 bg-transparent text-sm text-right focus:outline-none focus:bg-white focus:border focus:border-blue-300 rounded ml-1"
                          />
                        </td>
                        <td className="py-1 px-3 text-right text-sm border-r">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateRehabItem('finishings', item.id, 'quantity', Number(e.target.value))}
                            className="w-12 px-1 py-0.5 border-0 bg-transparent text-sm text-right focus:outline-none focus:bg-white focus:border focus:border-blue-300 rounded"
                          />
                        </td>
                        <td className="py-1 px-3 text-right text-sm">$ {(item.perUnitCost * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                    <tr className="bg-yellow-100 border-b-2">
                      <td className="py-1 px-3 font-medium text-sm border-r"></td>
                      <td className="py-1 px-3 text-right font-bold text-sm border-r">
                        $ {rehabBudgetSections.finishings.reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0).toFixed(2)}
                      </td>
                      <td className="py-1 px-3 text-right text-sm border-r"></td>
                      <td className="py-1 px-3 text-right font-bold text-sm">
                        $ {rehabBudgetSections.finishings.reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0).toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Bottom Summary Section */}
          <div className="grid grid-cols-2 gap-6">
            {/* Left Summary */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <table className="w-full text-sm border-collapse">
                <tbody>
                  <tr className="border-b">
                    <td className="py-1 font-medium border-r">Exterior</td>
                    <td className="py-1 text-right font-bold">
                      $ {rehabBudgetSections.exterior.reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0).toFixed(2)}
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-1 font-medium border-r">General Interior</td>
                    <td className="py-1 text-right">
                      $ {rehabBudgetSections.generalInterior.reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0).toFixed(2)}
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-1 font-medium border-r">Kitchens</td>
                    <td className="py-1 text-right">
                      $ {rehabBudgetSections.kitchens.reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0).toFixed(2)}
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-1 font-medium border-r">Bathrooms</td>
                    <td className="py-1 text-right">
                      $ {rehabBudgetSections.bathrooms.reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0).toFixed(2)}
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-1 font-medium border-r">Finishings</td>
                    <td className="py-1 text-right">
                      $ {rehabBudgetSections.finishings.reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0).toFixed(2)}
                    </td>
                  </tr>
                  <tr className="border-t-2 border-black">
                    <td className="py-2 font-bold border-r">Total</td>
                    <td className="py-2 text-right font-bold">
                      $ {(
                        rehabBudgetSections.exterior.reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0) +
                        rehabBudgetSections.generalInterior.reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0) +
                        rehabBudgetSections.kitchens.reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0) +
                        rehabBudgetSections.bathrooms.reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0) +
                        rehabBudgetSections.finishings.reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0)
                      ).toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1 border-r">10% Buffer</td>
                    <td className="py-1 text-right">
                      $ {(
                        (rehabBudgetSections.exterior.reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0) +
                        rehabBudgetSections.generalInterior.reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0) +
                        rehabBudgetSections.kitchens.reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0) +
                        rehabBudgetSections.bathrooms.reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0) +
                        rehabBudgetSections.finishings.reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0)) * 0.10
                      ).toFixed(2)}
                    </td>
                  </tr>
                  <tr className="border-t">
                    <td className="py-2 font-bold border-r"></td>
                    <td className="py-2 text-right font-bold">
                      $ {(
                        (rehabBudgetSections.exterior.reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0) +
                        rehabBudgetSections.generalInterior.reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0) +
                        rehabBudgetSections.kitchens.reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0) +
                        rehabBudgetSections.bathrooms.reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0) +
                        rehabBudgetSections.finishings.reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0)) * 1.10
                      ).toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Right Summary - Breakdown */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="border border-black">
                <div className="bg-gray-100 px-3 py-2 border-b">
                  <h4 className="font-bold text-center">Breakdown</h4>
                </div>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-1 px-3 border-r"></th>
                      <th className="text-right py-1 px-3 font-medium border-r">Total</th>
                      <th className="text-right py-1 px-3 font-medium">Per Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-1 px-3 border-r">Labor</td>
                      <td className="py-1 px-3 text-right border-r">$ 241,712.75</td>
                      <td className="py-1 px-3 text-right">$ 24,121.88</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-1 px-3 border-r">Materials</td>
                      <td className="py-1 px-3 text-right border-r">$ 80,406.25</td>
                      <td className="py-1 px-3 text-right">$ 8,040.63</td>
                    </tr>
                    <tr>
                      <td className="py-1 px-3 border-r">Buffer</td>
                      <td className="py-1 px-3 text-right border-r">$ 32,162.50</td>
                      <td className="py-1 px-3 text-right">$ 3,216.25</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
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