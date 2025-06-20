import React, { useState, useEffect } from 'react';
import { Building, Users, Wrench, Calculator, DollarSign, Calendar, AlertTriangle, TrendingUp, Home, Target, BarChart3, Save, Download, Upload, FileDown, Plus, Check } from 'lucide-react';

export default function DealAnalyzer() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [dealData, setDealData] = useState<any>(null);
  const [editingProperty, setEditingProperty] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);
  const [propertyName, setPropertyName] = useState('Maple Street Apartments');
  const [propertyAddress, setPropertyAddress] = useState('123 Maple Street, Hartford, CT 06106');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [savedDeals, setSavedDeals] = useState<any[]>([]);
  const [editingExpenses, setEditingExpenses] = useState(false);
  const [editingClosingCosts, setEditingClosingCosts] = useState(false);
  const [editingHoldingCosts, setEditingHoldingCosts] = useState(false);
  const [editingRehabSections, setEditingRehabSections] = useState({
    exterior: false,
    kitchens: false,
    bathrooms: false,
    generalInterior: false,
    finishings: false
  });
  
  // Property import modal state
  const [showImportModal, setShowImportModal] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [importData, setImportData] = useState({
    entity: '5Central Capital',
    broker: '',
    propertyManager: '',
    generalContractor: '',
    closingTimeline: '',
    notes: '',
    acquisitionDate: ''
  });
  
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
    dueDisligence: 15000,
    titleInsurance: 8500,
    legalFees: 12000,
    lenderFees: 18000,
    inspections: 5000,
    survey: 3500,
    other: 7000
  });

  // Holding costs breakdown
  const [holdingCosts, setHoldingCosts] = useState<{ [key: string]: number }>({
    propertyTaxes: 3500,
    insurance: 1200,
    utilities: 800,
    management: 2000,
    maintenance: 1500,
    other: 1000
  });

  // Operating expenses
  const [expenses, setExpenses] = useState<{ [key: string]: number }>({
    propertyTaxes: 42000,
    insurance: 14400,
    management: 24000,
    maintenance: 18000,
    utilities: 9600,
    marketing: 3600,
    legal: 2400,
    other: 8000
  });

  // Rent roll data
  const [rentRoll, setRentRoll] = useState([
    { id: 1, unitNumber: '1A', unitTypeId: 1, currentRent: 2200, marketRent: 2400, isOccupied: true, leaseExpiry: '2024-12-31' },
    { id: 2, unitNumber: '1B', unitTypeId: 1, currentRent: 2150, marketRent: 2400, isOccupied: true, leaseExpiry: '2024-11-30' },
    { id: 3, unitNumber: '2A', unitTypeId: 2, currentRent: 2800, marketRent: 3000, isOccupied: true, leaseExpiry: '2025-01-31' },
    { id: 4, unitNumber: '2B', unitTypeId: 2, currentRent: 2750, marketRent: 3000, isOccupied: false, leaseExpiry: null },
    { id: 5, unitNumber: '3A', unitTypeId: 1, currentRent: 2100, marketRent: 2400, isOccupied: true, leaseExpiry: '2024-10-31' },
    { id: 6, unitNumber: '3B', unitTypeId: 1, currentRent: 2200, marketRent: 2400, isOccupied: true, leaseExpiry: '2025-02-28' },
    { id: 7, unitNumber: '4A', unitTypeId: 2, currentRent: 2900, marketRent: 3000, isOccupied: true, leaseExpiry: '2024-09-30' },
    { id: 8, unitNumber: '4B', unitTypeId: 2, currentRent: 0, marketRent: 3000, isOccupied: false, leaseExpiry: null }
  ]);

  // Unit types
  const [unitTypes, setUnitTypes] = useState([
    { id: 1, name: '2BR/1BA', bedrooms: 2, bathrooms: 1, sqft: 900, marketRent: 2400 },
    { id: 2, name: '3BR/2BA', bedrooms: 3, bathrooms: 2, sqft: 1200, marketRent: 3000 }
  ]);

  // Rehab budget sections
  const [rehabBudgetSections, setRehabBudgetSections] = useState({
    exterior: [
      { category: 'Roof Repairs', perUnitCost: 2500, quantity: 8, totalCost: 20000 },
      { category: 'Exterior Paint', perUnitCost: 1200, quantity: 8, totalCost: 9600 },
      { category: 'Windows', perUnitCost: 800, quantity: 8, totalCost: 6400 },
      { category: 'Landscaping', perUnitCost: 500, quantity: 8, totalCost: 4000 }
    ],
    kitchens: [
      { category: 'Cabinets', perUnitCost: 4500, quantity: 8, totalCost: 36000 },
      { category: 'Countertops', perUnitCost: 1800, quantity: 8, totalCost: 14400 },
      { category: 'Appliances', perUnitCost: 3200, quantity: 8, totalCost: 25600 },
      { category: 'Flooring', perUnitCost: 1500, quantity: 8, totalCost: 12000 }
    ],
    bathrooms: [
      { category: 'Vanity & Sink', perUnitCost: 1200, quantity: 12, totalCost: 14400 },
      { category: 'Toilet', perUnitCost: 400, quantity: 12, totalCost: 4800 },
      { category: 'Shower/Tub', perUnitCost: 2000, quantity: 12, totalCost: 24000 },
      { category: 'Tile Work', perUnitCost: 1800, quantity: 12, totalCost: 21600 }
    ],
    generalInterior: [
      { category: 'Interior Paint', perUnitCost: 2000, quantity: 8, totalCost: 16000 },
      { category: 'Flooring (LVP)', perUnitCost: 3500, quantity: 8, totalCost: 28000 },
      { category: 'HVAC Updates', perUnitCost: 2500, quantity: 8, totalCost: 20000 },
      { category: 'Electrical Updates', perUnitCost: 1800, quantity: 8, totalCost: 14400 }
    ],
    finishings: [
      { category: 'Light Fixtures', perUnitCost: 600, quantity: 8, totalCost: 4800 },
      { category: 'Hardware', perUnitCost: 300, quantity: 8, totalCost: 2400 },
      { category: 'Trim & Molding', perUnitCost: 800, quantity: 8, totalCost: 6400 },
      { category: 'Final Cleaning', perUnitCost: 200, quantity: 8, totalCost: 1600 }
    ]
  });

  // Calculate total rehab costs
  const totalRehabCosts = Object.values(rehabBudgetSections).reduce((total, section) => {
    return total + section.reduce((sectionTotal, item) => sectionTotal + item.totalCost, 0);
  }, 0);

  // Calculate total closing costs
  const totalClosingCosts = Object.values(closingCosts).reduce((sum, cost) => sum + cost, 0);

  // Calculate total holding costs (monthly)
  const totalHoldingCosts = Object.values(holdingCosts).reduce((sum, cost) => sum + cost, 0);

  // Calculate total operating expenses (annual)
  const totalOperatingExpenses = Object.values(expenses).reduce((sum, expense) => sum + expense, 0);

  // Calculate metrics
  const loanAmount = assumptions.purchasePrice * assumptions.loanPercentage;
  const downPayment = assumptions.purchasePrice - loanAmount;
  const monthlyInterestRate = assumptions.interestRate / 12;
  const numberOfPayments = assumptions.loanTermYears * 12;
  
  // Monthly payment calculation (interest-only for short-term bridge loans)
  const monthlyDebtService = loanAmount * monthlyInterestRate;
  const annualDebtService = monthlyDebtService * 12;

  // Total project cost
  const allInCost = assumptions.purchasePrice + totalRehabCosts + totalClosingCosts + (totalHoldingCosts * 12);

  // ARV calculation based on market rent and cap rate
  const totalMarketRent = rentRoll.reduce((sum, unit) => {
    const unitType = unitTypes.find(type => type.id === unit.unitTypeId);
    return sum + (unitType?.marketRent || 0);
  }, 0);

  const grossRentalIncome = totalMarketRent * 12;
  const effectiveGrossIncome = grossRentalIncome * (1 - assumptions.vacancyRate);
  const noi = effectiveGrossIncome - totalOperatingExpenses;
  const arv = noi / assumptions.marketCapRate;

  // Refinance calculations
  const refinanceLoanAmount = arv * assumptions.refinanceLTV;
  const refinanceClosingCosts = refinanceLoanAmount * assumptions.refinanceClosingCostPercent;
  const cashOut = refinanceLoanAmount - loanAmount - refinanceClosingCosts;
  
  // Post-refi monthly payment (30-year amortization)
  const refinanceMonthlyRate = assumptions.refinanceInterestRate / 12;
  const refinancePayments = 30 * 12;
  const refinanceMonthlyPayment = refinanceLoanAmount * 
    (refinanceMonthlyRate * Math.pow(1 + refinanceMonthlyRate, refinancePayments)) / 
    (Math.pow(1 + refinanceMonthlyRate, refinancePayments) - 1);
  
  const postRefiAnnualDebtService = refinanceMonthlyPayment * 12;
  const netCashFlow = noi - postRefiAnnualDebtService;
  
  // Return metrics
  const totalProfit = cashOut + (netCashFlow * exitAnalysis.holdPeriodYears);
  const totalCashInvested = downPayment + totalRehabCosts + totalClosingCosts + (totalHoldingCosts * 12);
  const cashOnCashReturn = netCashFlow / (totalCashInvested - cashOut);
  const irr = Math.pow(totalProfit / totalCashInvested, 1 / exitAnalysis.holdPeriodYears) - 1;
  
  // Risk metrics
  const dscr = noi / postRefiAnnualDebtService;
  const ltv = refinanceLoanAmount / arv;
  const ltc = allInCost / arv;

  const metrics = {
    // Financial metrics
    totalRehab: totalRehabCosts,
    totalClosingCosts,
    totalHoldingCosts,
    allInCost,
    
    // Income calculations
    grossRentalIncome,
    effectiveGrossIncome,
    noi,
    totalOperatingExpenses,
    
    // Debt service
    monthlyDebtService,
    annualDebtService,
    
    // Key ratios
    arv,
    netCashFlow,
    cashOnCashReturn,
    capRate: noi / arv,
    dscr,
    ltc,
    ltv,
    
    // Return metrics
    irr,
    totalProfit,
    
    // Refinance metrics
    refinanceLoanAmount,
    cashOut,
    
    // Risk indicators
    isSpeculative: arv < allInCost,
    dscrWarning: dscr < assumptions.dscrThreshold,
    occupancyRisk: assumptions.vacancyRate > 0.1
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return (value * 100).toFixed(2) + '%';
  };

  // Update rehab item
  const updateRehabItem = (section: string, index: number, field: string, value: number) => {
    setRehabBudgetSections(prev => ({
      ...prev,
      [section]: prev[section as keyof typeof prev].map((item, i) => 
        i === index ? { 
          ...item, 
          [field]: value,
          totalCost: field === 'totalCost' ? value : item.perUnitCost * item.quantity
        } : item
      )
    }));
  };

  // Update expense
  const updateExpense = (key: string, value: number) => {
    setExpenses(prev => ({ ...prev, [key]: value }));
  };

  // Update closing cost
  const updateClosingCost = (key: string, value: number) => {
    setClosingCosts(prev => ({ ...prev, [key]: value }));
  };

  // Update holding cost
  const updateHoldingCost = (key: string, value: number) => {
    setHoldingCosts(prev => ({ ...prev, [key]: value }));
  };

  // Load saved deals from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem('dealAnalyzerDeals');
    if (saved) {
      setSavedDeals(JSON.parse(saved));
    }
    setLoading(false);
  }, []);

  // Save current deal data
  const saveDeal = async () => {
    setIsSaving(true);
    try {
      const dealToSave = {
        id: Date.now(),
        name: propertyName,
        address: propertyAddress,
        savedAt: new Date().toISOString(),
        data: {
          propertyName,
          propertyAddress,
          assumptions,
          closingCosts,
          holdingCosts,
          expenses,
          rehabBudgetSections,
          rentRoll,
          unitTypes,
          exitAnalysis
        }
      };

      const existing = localStorage.getItem('dealAnalyzerDeals');
      const deals = existing ? JSON.parse(existing) : [];
      deals.push(dealToSave);
      
      localStorage.setItem('dealAnalyzerDeals', JSON.stringify(deals));
      setSavedDeals(deals);
      setLastSaved(new Date());
      
      // Show success message
      setTimeout(() => setIsSaving(false), 1000);
    } catch (error) {
      console.error('Error saving deal:', error);
      setIsSaving(false);
    }
  };

  // Export deal to JSON
  const exportDealJSON = () => {
    const dealData = {
      name: propertyName,
      address: propertyAddress,
      exportedAt: new Date().toISOString(),
      data: {
        propertyName,
        propertyAddress,
        assumptions,
        closingCosts,
        holdingCosts,
        expenses,
        rehabBudgetSections,
        rentRoll,
        unitTypes,
        exitAnalysis,
        metrics
      }
    };

    const blob = new Blob([JSON.stringify(dealData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${propertyName.replace(/\s+/g, '_')}_deal_analysis.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export deal to CSV
  const exportDealCSV = () => {
    const csvData = [
      ['Property Information'],
      ['Name', propertyName],
      ['Address', propertyAddress],
      [''],
      ['Financial Assumptions'],
      ['Purchase Price', assumptions.purchasePrice],
      ['Units', assumptions.unitCount],
      ['Loan Percentage', (assumptions.loanPercentage * 100) + '%'],
      ['Interest Rate', (assumptions.interestRate * 100) + '%'],
      ['Vacancy Rate', (assumptions.vacancyRate * 100) + '%'],
      [''],
      ['Key Metrics'],
      ['All-In Cost', metrics.allInCost],
      ['ARV', metrics.arv],
      ['Total Profit', metrics.totalProfit],
      ['Cash Flow', metrics.netCashFlow],
      ['Cap Rate', (metrics.arv > 0 ? (metrics.noi * 12 / metrics.arv * 100).toFixed(2) + '%' : '0%')],
      ['Cash-on-Cash Return', (metrics.cashOnCashReturn * 100).toFixed(2) + '%'],
      ['DSCR', metrics.dscr.toFixed(2)],
      [''],
      ['Rehab Budget'],
      ...Object.entries(rehabBudgetSections).flatMap(([section, items]: [string, any[]]) => [
        [section.charAt(0).toUpperCase() + section.slice(1)],
        ...items.map(item => [item.category, item.perUnitCost, item.quantity, item.totalCost])
      ]),
      [''],
      ['Rent Roll'],
      ['Unit Type', 'Market Rent', 'Count'],
      ...unitTypes.map(type => [type.name, type.marketRent, rentRoll.filter(unit => unit.unitTypeId === type.id).length])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${propertyName.replace(/\s+/g, '_')}_deal_analysis.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Load a saved deal
  const loadDeal = (deal: any) => {
    const data = deal.data;
    setPropertyName(data.propertyName);
    setPropertyAddress(data.propertyAddress);
    setAssumptions(data.assumptions);
    setClosingCosts(data.closingCosts);
    setHoldingCosts(data.holdingCosts);
    setExpenses(data.expenses);
    setRehabBudgetSections(data.rehabBudgetSections);
    setRentRoll(data.rentRoll);
    setUnitTypes(data.unitTypes);
    setExitAnalysis(data.exitAnalysis);
  };

  // Import property to properties database
  const importToProperties = async () => {
    setIsImporting(true);
    try {
      const importPayload = {
        propertyName,
        propertyAddress,
        assumptions,
        metrics,
        rehabBudgetSections,
        rentRoll,
        unitTypes,
        exitAnalysis,
        ...importData
      };

      const response = await fetch('/api/properties/import-from-deal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(importPayload),
      });

      if (!response.ok) {
        throw new Error('Failed to import property');
      }

      setImportSuccess(true);
      setTimeout(() => {
        setShowImportModal(false);
        setImportSuccess(false);
        setIsImporting(false);
      }, 2000);
    } catch (error) {
      console.error('Error importing property:', error);
      setIsImporting(false);
    }
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
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
                  className="text-lg text-gray-600 border-b border-blue-300 bg-transparent outline-none"
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
            <div className="text-lg text-gray-600">•</div>
            <div className="text-lg text-gray-500">
              {assumptions.unitCount} Units • Multifamily • Value-Add Strategy
            </div>
          </div>
          
          {/* Save and Export Controls */}
          <div className="flex items-center space-x-3">
            {lastSaved && (
              <span className="text-sm text-gray-500">
                Last saved: {lastSaved.toLocaleTimeString()}
              </span>
            )}
            
            {/* Import to Properties Button */}
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Import to Properties</span>
            </button>
            
            <button
              onClick={saveDeal}
              disabled={isSaving}
              className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Deal</span>
                </>
              )}
            </button>
            
            <div className="flex space-x-2">
              <button
                onClick={exportDealJSON}
                className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>JSON</span>
              </button>
              
              <button
                onClick={exportDealCSV}
                className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                <FileDown className="h-4 w-4" />
                <span>CSV</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Saved Deals Panel */}
      {savedDeals.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Saved Deals</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedDeals.slice(-6).map((deal) => (
              <div key={deal.id} className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{deal.name}</h4>
                    <p className="text-sm text-gray-600">{deal.address}</p>
                    <p className="text-xs text-gray-500">
                      Saved: {new Date(deal.savedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => loadDeal(deal)}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                  >
                    Load
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
      <div className="bg-white border border-gray-200 rounded-lg">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Key Metrics */}
              <div className="lg:col-span-2 space-y-6">
                {/* Deal Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-600 font-medium">Purchase Price</p>
                    <p className="text-2xl font-bold text-blue-900">{formatCurrency(assumptions.purchasePrice)}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-green-600 font-medium">Total Rehab</p>
                    <p className="text-2xl font-bold text-green-900">{formatCurrency(metrics.totalRehab)}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-purple-600 font-medium">ARV</p>
                    <p className="text-2xl font-bold text-purple-900">{formatCurrency(metrics.arv)}</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <p className="text-sm text-orange-600 font-medium">All-In Cost</p>
                    <p className="text-2xl font-bold text-orange-900">{formatCurrency(metrics.allInCost)}</p>
                  </div>
                </div>

                {/* Return Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-emerald-50 p-4 rounded-lg">
                    <p className="text-sm text-emerald-600 font-medium">Cash Flow</p>
                    <p className="text-xl font-bold text-emerald-900">{formatCurrency(metrics.netCashFlow)}</p>
                    <p className="text-xs text-emerald-600">Annual</p>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <p className="text-sm text-indigo-600 font-medium">Cash-on-Cash Return</p>
                    <p className="text-xl font-bold text-indigo-900">{formatPercentage(metrics.cashOnCashReturn)}</p>
                    <p className="text-xs text-indigo-600">Annual</p>
                  </div>
                  <div className="bg-teal-50 p-4 rounded-lg">
                    <p className="text-sm text-teal-600 font-medium">IRR</p>
                    <p className="text-xl font-bold text-teal-900">{formatPercentage(metrics.irr)}</p>
                    <p className="text-xs text-teal-600">{exitAnalysis.holdPeriodYears} Year Hold</p>
                  </div>
                </div>

                {/* Risk Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={`p-4 rounded-lg ${metrics.dscr >= assumptions.dscrThreshold ? 'bg-green-50' : 'bg-red-50'}`}>
                    <p className={`text-sm font-medium ${metrics.dscr >= assumptions.dscrThreshold ? 'text-green-600' : 'text-red-600'}`}>DSCR</p>
                    <p className={`text-xl font-bold ${metrics.dscr >= assumptions.dscrThreshold ? 'text-green-900' : 'text-red-900'}`}>{metrics.dscr.toFixed(2)}x</p>
                    <p className={`text-xs ${metrics.dscr >= assumptions.dscrThreshold ? 'text-green-600' : 'text-red-600'}`}>
                      {metrics.dscr >= assumptions.dscrThreshold ? 'Strong' : 'Weak'}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 font-medium">LTV</p>
                    <p className="text-xl font-bold text-gray-900">{formatPercentage(metrics.ltv)}</p>
                    <p className="text-xs text-gray-600">Post-Refi</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 font-medium">Cap Rate</p>
                    <p className="text-xl font-bold text-gray-900">{formatPercentage(metrics.capRate)}</p>
                    <p className="text-xs text-gray-600">Stabilized</p>
                  </div>
                </div>
              </div>

              {/* Assumptions Panel */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Deal Assumptions</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Purchase Price</label>
                    <input
                      type="number"
                      value={assumptions.purchasePrice}
                      onChange={(e) => setAssumptions(prev => ({ ...prev, purchasePrice: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Unit Count</label>
                    <input
                      type="number"
                      value={assumptions.unitCount}
                      onChange={(e) => setAssumptions(prev => ({ ...prev, unitCount: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Loan %</label>
                    <input
                      type="number"
                      step="0.01"
                      value={assumptions.loanPercentage}
                      onChange={(e) => setAssumptions(prev => ({ ...prev, loanPercentage: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Interest Rate</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={assumptions.interestRate}
                      onChange={(e) => setAssumptions(prev => ({ ...prev, interestRate: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Vacancy Rate</label>
                    <input
                      type="number"
                      step="0.01"
                      value={assumptions.vacancyRate}
                      onChange={(e) => setAssumptions(prev => ({ ...prev, vacancyRate: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Market Cap Rate</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={assumptions.marketCapRate}
                      onChange={(e) => setAssumptions(prev => ({ ...prev, marketCapRate: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rent Roll Tab */}
        {activeTab === 'rentroll' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Rent Roll Analysis</h3>
              <div className="text-sm text-gray-600">
                Total Units: {rentRoll.length} | Occupied: {rentRoll.filter(unit => unit.isOccupied).length} | 
                Vacancy: {rentRoll.filter(unit => !unit.isOccupied).length}
              </div>
            </div>

            {/* Unit Types Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {unitTypes.map(type => {
                const unitsOfType = rentRoll.filter(unit => unit.unitTypeId === type.id);
                const occupiedUnits = unitsOfType.filter(unit => unit.isOccupied);
                return (
                  <div key={type.id} className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900">{type.name}</h4>
                    <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Market Rent</p>
                        <p className="font-semibold">{formatCurrency(type.marketRent)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Avg Current Rent</p>
                        <p className="font-semibold">
                          {formatCurrency(occupiedUnits.reduce((sum, unit) => sum + unit.currentRent, 0) / (occupiedUnits.length || 1))}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Units</p>
                        <p className="font-semibold">{unitsOfType.length}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Occupancy</p>
                        <p className="font-semibold">{((occupiedUnits.length / unitsOfType.length) * 100).toFixed(0)}%</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Detailed Rent Roll Table */}
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Unit</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Type</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Current Rent</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Market Rent</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Status</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Lease Expiry</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Upside</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {rentRoll.map(unit => {
                    const unitType = unitTypes.find(type => type.id === unit.unitTypeId);
                    const upside = (unitType?.marketRent || 0) - unit.currentRent;
                    return (
                      <tr key={unit.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{unit.unitNumber}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{unitType?.name}</td>
                        <td className="px-4 py-3 text-sm text-right">{formatCurrency(unit.currentRent)}</td>
                        <td className="px-4 py-3 text-sm text-right">{formatCurrency(unitType?.marketRent || 0)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            unit.isOccupied ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {unit.isOccupied ? 'Occupied' : 'Vacant'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600">
                          {unit.leaseExpiry ? new Date(unit.leaseExpiry).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <span className={upside > 0 ? 'text-green-600' : 'text-gray-600'}>
                            {formatCurrency(upside)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Rehab Budget Tab */}
        {activeTab === 'rehab' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Rehab Budget</h3>
              <div className="text-sm text-gray-600">
                Total Budget: {formatCurrency(totalRehabCosts)} | 
                Per Unit: {formatCurrency(totalRehabCosts / assumptions.unitCount)}
              </div>
            </div>

            <div className="space-y-6">
              {Object.entries(rehabBudgetSections).map(([sectionName, items]) => (
                <div key={sectionName} className="bg-white border border-gray-200 rounded-lg">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900 capitalize">
                        {sectionName.replace(/([A-Z])/g, ' $1').trim()}
                      </h4>
                      <button
                        onClick={() => setEditingRehabSections(prev => ({ ...prev, [sectionName]: !prev[sectionName as keyof typeof prev] }))}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        {editingRehabSections[sectionName as keyof typeof editingRehabSections] ? 'Done' : 'Edit'}
                      </button>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Subtotal: {formatCurrency(items.reduce((sum, item) => sum + item.totalCost, 0))}
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-left text-sm text-gray-600">
                            <th className="pb-2">Category</th>
                            <th className="pb-2 text-right">Per Unit</th>
                            <th className="pb-2 text-right">Quantity</th>
                            <th className="pb-2 text-right">Total Cost</th>
                          </tr>
                        </thead>
                        <tbody className="space-y-2">
                          {items.map((item, index) => (
                            <tr key={index} className="border-t border-gray-100">
                              <td className="py-2 text-sm text-gray-900">{item.category}</td>
                              <td className="py-2 text-right">
                                {editingRehabSections[sectionName as keyof typeof editingRehabSections] ? (
                                  <input
                                    type="number"
                                    value={item.perUnitCost}
                                    onChange={(e) => updateRehabItem(sectionName, index, 'perUnitCost', Number(e.target.value))}
                                    className="w-20 px-2 py-1 text-sm border border-gray-300 rounded text-right"
                                  />
                                ) : (
                                  <span className="text-sm">{formatCurrency(item.perUnitCost)}</span>
                                )}
                              </td>
                              <td className="py-2 text-right">
                                {editingRehabSections[sectionName as keyof typeof editingRehabSections] ? (
                                  <input
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) => updateRehabItem(sectionName, index, 'quantity', Number(e.target.value))}
                                    className="w-16 px-2 py-1 text-sm border border-gray-300 rounded text-right"
                                  />
                                ) : (
                                  <span className="text-sm">{item.quantity}</span>
                                )}
                              </td>
                              <td className="py-2 text-right">
                                <span className="text-sm font-medium">{formatCurrency(item.totalCost)}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ))}

              {/* Rehab Summary */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-blue-600">Total Rehab Budget</p>
                    <p className="text-lg font-bold text-blue-900">{formatCurrency(totalRehabCosts)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600">Per Unit Average</p>
                    <p className="text-lg font-bold text-blue-900">{formatCurrency(totalRehabCosts / assumptions.unitCount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600">10% Buffer</p>
                    <p className="text-lg font-bold text-blue-900">{formatCurrency(totalRehabCosts * 0.10)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600">Total w/ Buffer</p>
                    <p className="text-lg font-bold text-blue-900">{formatCurrency(totalRehabCosts * 1.10)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Exit Analysis Tab */}
        {activeTab === 'exit' && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Exit Analysis</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Exit Assumptions */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Exit Assumptions</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Sale Factor (% of ARV)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={exitAnalysis.saleFactor}
                      onChange={(e) => setExitAnalysis(prev => ({ ...prev, saleFactor: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Sale Costs (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={exitAnalysis.saleCostsPercent}
                      onChange={(e) => setExitAnalysis(prev => ({ ...prev, saleCostsPercent: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Hold Period (Years)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={exitAnalysis.holdPeriodYears}
                      onChange={(e) => setExitAnalysis(prev => ({ ...prev, holdPeriodYears: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>

              {/* Exit Scenarios */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Exit Scenarios</h4>
                <div className="space-y-3">
                  {[0.85, 0.95, 1.0, 1.05, 1.15].map(factor => {
                    const salePrice = metrics.arv * factor;
                    const saleCosts = salePrice * exitAnalysis.saleCostsPercent;
                    const netSaleProceeds = salePrice - saleCosts - loanAmount;
                    const totalReturn = netSaleProceeds + (metrics.netCashFlow * exitAnalysis.holdPeriodYears);
                    const totalInvested = downPayment + totalRehabCosts + totalClosingCosts;
                    const multiple = totalReturn / totalInvested;
                    const annualizedReturn = Math.pow(multiple, 1/exitAnalysis.holdPeriodYears) - 1;

                    return (
                      <div key={factor} className={`p-3 rounded-lg border ${factor === 1.0 ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}>
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{(factor * 100).toFixed(0)}% of ARV</span>
                          <span className="text-sm text-gray-600">{formatCurrency(salePrice)}</span>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-600">Total Return:</span>
                            <span className={`ml-1 font-medium ${totalReturn > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(totalReturn)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">IRR:</span>
                            <span className={`ml-1 font-medium ${annualizedReturn > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatPercentage(annualizedReturn)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Cash Flow Summary */}
            <div className="mt-8 bg-gray-50 p-6 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-4">Cash Flow Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Cash Outflows</h5>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Down Payment</span>
                      <span>{formatCurrency(downPayment)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rehab Costs</span>
                      <span>{formatCurrency(totalRehabCosts)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Closing Costs</span>
                      <span>{formatCurrency(totalClosingCosts)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-1 font-medium">
                      <span>Total Cash Invested</span>
                      <span>{formatCurrency(downPayment + totalRehabCosts + totalClosingCosts)}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Cash Inflows</h5>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Cash Out (Refi)</span>
                      <span>{formatCurrency(metrics.cashOut)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Annual Cash Flow</span>
                      <span>{formatCurrency(metrics.netCashFlow)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Cash Flow ({exitAnalysis.holdPeriodYears}yr)</span>
                      <span>{formatCurrency(metrics.netCashFlow * exitAnalysis.holdPeriodYears)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-1 font-medium">
                      <span>Total Cash Generated</span>
                      <span>{formatCurrency(metrics.cashOut + (metrics.netCashFlow * exitAnalysis.holdPeriodYears))}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sensitivity Analysis Tab */}
        {activeTab === 'sensitivity' && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Sensitivity Analysis</h3>
            
            {/* Cap Rate vs Purchase Price Sensitivity */}
            <div className="mb-8">
              <h4 className="font-medium text-gray-900 mb-4">IRR Sensitivity (Cap Rate vs Purchase Price)</h4>
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-sm font-medium text-gray-900">Purchase Price</th>
                      {[0.045, 0.05, 0.055, 0.06, 0.065].map(rate => (
                        <th key={rate} className="px-3 py-2 text-center text-sm font-medium text-gray-900">
                          {formatPercentage(rate)} Cap
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {[0.9, 0.95, 1.0, 1.05, 1.1].map(priceMultiplier => {
                      const testPrice = assumptions.purchasePrice * priceMultiplier;
                      return (
                        <tr key={priceMultiplier}>
                          <td className="px-3 py-2 text-sm font-medium">
                            {formatCurrency(testPrice)}
                          </td>
                          {[0.045, 0.05, 0.055, 0.06, 0.065].map(capRate => {
                            const testArv = noi / capRate;
                            const testAllInCost = testPrice + totalRehabCosts + totalClosingCosts;
                            const testLoanAmount = testPrice * assumptions.loanPercentage;
                            const testRefinanceLoan = testArv * assumptions.refinanceLTV;
                            const testCashOut = testRefinanceLoan - testLoanAmount - (testRefinanceLoan * assumptions.refinanceClosingCostPercent);
                            const testTotalInvested = (testPrice - testLoanAmount) + totalRehabCosts + totalClosingCosts;
                            const testTotalProfit = testCashOut + (metrics.netCashFlow * exitAnalysis.holdPeriodYears);
                            const testIrr = Math.pow(testTotalProfit / testTotalInvested, 1 / exitAnalysis.holdPeriodYears) - 1;
                            
                            return (
                              <td key={capRate} className={`px-3 py-2 text-center text-sm ${
                                priceMultiplier === 1.0 && capRate === assumptions.marketCapRate 
                                  ? 'bg-blue-100 font-medium' 
                                  : testIrr > 0.15 ? 'bg-green-100 text-green-800' 
                                  : testIrr > 0.10 ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {formatPercentage(testIrr)}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Key Variable Impact */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Key Variable Impact on IRR</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { name: 'Purchase Price', baseValue: assumptions.purchasePrice, unit: '$', variations: [-10, -5, 0, 5, 10] },
                  { name: 'Rehab Costs', baseValue: totalRehabCosts, unit: '$', variations: [-10, -5, 0, 5, 10] },
                  { name: 'Market Rent', baseValue: totalMarketRent, unit: '$', variations: [-10, -5, 0, 5, 10] },
                  { name: 'Cap Rate', baseValue: assumptions.marketCapRate * 100, unit: '%', variations: [-10, -5, 0, 5, 10] }
                ].map(variable => (
                  <div key={variable.name} className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="font-medium text-gray-900 mb-3">{variable.name}</h5>
                    <div className="space-y-2">
                      {variable.variations.map(variation => {
                        let testValue;
                        let testIrr = metrics.irr;
                        
                        if (variable.name === 'Purchase Price') {
                          testValue = variable.baseValue * (1 + variation/100);
                          const testLoan = testValue * assumptions.loanPercentage;
                          const testTotalInvested = (testValue - testLoan) + totalRehabCosts + totalClosingCosts;
                          testIrr = Math.pow(metrics.totalProfit / testTotalInvested, 1 / exitAnalysis.holdPeriodYears) - 1;
                        } else if (variable.name === 'Rehab Costs') {
                          testValue = variable.baseValue * (1 + variation/100);
                          const testTotalInvested = downPayment + testValue + totalClosingCosts;
                          testIrr = Math.pow(metrics.totalProfit / testTotalInvested, 1 / exitAnalysis.holdPeriodYears) - 1;
                        } else if (variable.name === 'Market Rent') {
                          testValue = variable.baseValue * (1 + variation/100);
                          const testGrossIncome = testValue * 12;
                          const testEffectiveIncome = testGrossIncome * (1 - assumptions.vacancyRate);
                          const testNoi = testEffectiveIncome - totalOperatingExpenses;
                          const testArv = testNoi / assumptions.marketCapRate;
                          const testRefinanceLoan = testArv * assumptions.refinanceLTV;
                          const testCashOut = testRefinanceLoan - loanAmount - (testRefinanceLoan * assumptions.refinanceClosingCostPercent);
                          const testTotalProfit = testCashOut + (testNoi - (testRefinanceLoan * assumptions.refinanceInterestRate)) * exitAnalysis.holdPeriodYears;
                          testIrr = Math.pow(testTotalProfit / (downPayment + totalRehabCosts + totalClosingCosts), 1 / exitAnalysis.holdPeriodYears) - 1;
                        } else if (variable.name === 'Cap Rate') {
                          testValue = (variable.baseValue * (1 + variation/100)) / 100;
                          const testArv = noi / testValue;
                          const testRefinanceLoan = testArv * assumptions.refinanceLTV;
                          const testCashOut = testRefinanceLoan - loanAmount - (testRefinanceLoan * assumptions.refinanceClosingCostPercent);
                          const testTotalProfit = testCashOut + (metrics.netCashFlow * exitAnalysis.holdPeriodYears);
                          testIrr = Math.pow(testTotalProfit / (downPayment + totalRehabCosts + totalClosingCosts), 1 / exitAnalysis.holdPeriodYears) - 1;
                        }

                        return (
                          <div key={variation} className={`flex justify-between text-sm ${variation === 0 ? 'font-medium' : ''}`}>
                            <span>{variation > 0 ? '+' : ''}{variation}%</span>
                            <span className={`${
                              testIrr > metrics.irr ? 'text-green-600' : 
                              testIrr < metrics.irr ? 'text-red-600' : 'text-gray-900'
                            }`}>
                              {formatPercentage(testIrr)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 12 Month Pro Forma Tab */}
        {activeTab === 'proforma' && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">12 Month Pro Forma</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 rounded-lg text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Item</th>
                    {Array.from({length: 12}, (_, i) => (
                      <th key={i} className="px-2 py-3 text-center font-medium text-gray-900">
                        {new Date(2024, i).toLocaleDateString('en-US', { month: 'short' })}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-right font-medium text-gray-900">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {/* Revenue Section */}
                  <tr className="bg-green-50">
                    <td className="px-4 py-3 font-semibold text-green-800">RENTAL INCOME</td>
                    {Array.from({length: 12}, (_, i) => (
                      <td key={i} className="px-2 py-3 text-center font-semibold text-green-800">
                        {formatCurrency(metrics.effectiveGrossIncome / 12)}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right font-bold text-green-600">
                      {formatCurrency(metrics.effectiveGrossIncome)}
                    </td>
                  </tr>
                  
                  {/* Operating Expenses */}
                  <tr className="border-b bg-red-100">
                    <td className="py-2 px-4 font-semibold">OPERATING EXPENSES</td>
                    <td className="py-2 px-2"></td><td className="py-2 px-2"></td><td className="py-2 px-2"></td>
                    <td className="py-2 px-2"></td><td className="py-2 px-2"></td><td className="py-2 px-2"></td>
                    <td className="py-2 px-2"></td><td className="py-2 px-2"></td><td className="py-2 px-2"></td>
                    <td className="py-2 px-2"></td><td className="py-2 px-2"></td><td className="py-2 px-2"></td>
                    <td className="py-2 px-4"></td>
                  </tr>
                  
                  <tr className="border-b">
                    <td className="py-2 px-4 text-gray-700">Property Taxes</td>
                    {Array.from({length: 12}, (_, i) => (
                      <td key={i} className="py-2 px-2 text-center">
                        {formatCurrency(expenses.propertyTaxes / 12)}
                      </td>
                    ))}
                    <td className="py-2 px-4 text-right font-bold">
                      {formatCurrency(expenses.propertyTaxes)}
                    </td>
                  </tr>
                  
                  <tr className="border-b">
                    <td className="py-2 px-4 text-gray-700">Insurance</td>
                    {Array.from({length: 12}, (_, i) => (
                      <td key={i} className="py-2 px-2 text-center">
                        {formatCurrency(expenses.insurance / 12)}
                      </td>
                    ))}
                    <td className="py-2 px-4 text-right font-bold">
                      {formatCurrency(expenses.insurance)}
                    </td>
                  </tr>
                  
                  <tr className="border-b">
                    <td className="py-2 px-4 text-gray-700">Property Management</td>
                    {Array.from({length: 12}, (_, i) => (
                      <td key={i} className="py-2 px-2 text-center">
                        {formatCurrency(expenses.management / 12)}
                      </td>
                    ))}
                    <td className="py-2 px-4 text-right font-bold">
                      {formatCurrency(expenses.management)}
                    </td>
                  </tr>
                  
                  <tr className="border-b">
                    <td className="py-2 px-4 text-gray-700">Maintenance & Repairs</td>
                    {Array.from({length: 12}, (_, i) => (
                      <td key={i} className="py-2 px-2 text-center">
                        {formatCurrency(expenses.maintenance / 12)}
                      </td>
                    ))}
                    <td className="py-2 px-4 text-right font-bold">
                      {formatCurrency(expenses.maintenance)}
                    </td>
                  </tr>
                  
                  <tr className="border-b">
                    <td className="py-2 px-4 text-gray-700">Utilities</td>
                    {Array.from({length: 12}, (_, i) => (
                      <td key={i} className="py-2 px-2 text-center">
                        {formatCurrency(expenses.utilities / 12)}
                      </td>
                    ))}
                    <td className="py-2 px-4 text-right font-bold">
                      {formatCurrency(expenses.utilities)}
                    </td>
                  </tr>
                  
                  <tr className="border-b">
                    <td className="py-2 px-4 text-gray-700">Marketing & Leasing</td>
                    {Array.from({length: 12}, (_, i) => (
                      <td key={i} className="py-2 px-2 text-center">
                        {formatCurrency(expenses.marketing / 12)}
                      </td>
                    ))}
                    <td className="py-2 px-4 text-right font-bold">
                      {formatCurrency(expenses.marketing)}
                    </td>
                  </tr>
                  
                  <tr className="border-b">
                    <td className="py-2 px-4 text-gray-700">Legal & Professional</td>
                    {Array.from({length: 12}, (_, i) => (
                      <td key={i} className="py-2 px-2 text-center">
                        {formatCurrency(expenses.legal / 12)}
                      </td>
                    ))}
                    <td className="py-2 px-4 text-right font-bold">
                      {formatCurrency(expenses.legal)}
                    </td>
                  </tr>
                  
                  <tr className="border-b">
                    <td className="py-2 px-4 text-gray-700">Other Operating Expenses</td>
                    {Array.from({length: 12}, (_, i) => (
                      <td key={i} className="py-2 px-2 text-center">
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
                      <td key={i} className="py-2 px-2 text-center font-semibold">
                        {formatCurrency(metrics.totalOperatingExpenses / 12)}
                      </td>
                    ))}
                    <td className="py-2 px-4 text-right font-bold text-red-600">
                      {formatCurrency(metrics.totalOperatingExpenses)}
                    </td>
                  </tr>

                  {/* NOI Section */}
                  <tr className="border-b bg-blue-100">
                    <td className="py-3 px-4 font-bold text-blue-800">NET OPERATING INCOME</td>
                    {Array.from({length: 12}, (_, i) => (
                      <td key={i} className="py-3 px-2 text-center font-bold text-blue-800">
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
                      <td key={i} className="py-2 px-2 text-center text-red-600">
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
                      <td key={i} className="py-3 px-2 text-center font-bold text-green-800">
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
      
      {/* Property Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Import to Properties</h2>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            {importSuccess ? (
              <div className="text-center py-8">
                <Check className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-green-800 mb-2">Property Imported Successfully!</h3>
                <p className="text-green-600">
                  {propertyName} has been added to your properties portfolio with "Under Contract" status.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Entity Assignment</label>
                    <select
                      value={importData.entity}
                      onChange={(e) => setImportData(prev => ({ ...prev, entity: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="5Central Capital">5Central Capital</option>
                      <option value="The House Doctors">The House Doctors</option>
                      <option value="Arcadia Vision Group">Arcadia Vision Group</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Acquisition Date</label>
                    <input
                      type="date"
                      value={importData.acquisitionDate}
                      onChange={(e) => setImportData(prev => ({ ...prev, acquisitionDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Broker</label>
                    <input
                      type="text"
                      value={importData.broker}
                      onChange={(e) => setImportData(prev => ({ ...prev, broker: e.target.value }))}
                      placeholder="Enter broker name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Property Manager</label>
                    <input
                      type="text"
                      value={importData.propertyManager}
                      onChange={(e) => setImportData(prev => ({ ...prev, propertyManager: e.target.value }))}
                      placeholder="Enter property manager"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">General Contractor</label>
                    <input
                      type="text"
                      value={importData.generalContractor}
                      onChange={(e) => setImportData(prev => ({ ...prev, generalContractor: e.target.value }))}
                      placeholder="Enter GC name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Closing Timeline</label>
                    <input
                      type="text"
                      value={importData.closingTimeline}
                      onChange={(e) => setImportData(prev => ({ ...prev, closingTimeline: e.target.value }))}
                      placeholder="e.g., 30-45 days"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={importData.notes}
                    onChange={(e) => setImportData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes about this property..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Deal Summary</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p><strong>Property:</strong> {propertyName}</p>
                    <p><strong>Address:</strong> {propertyAddress}</p>
                    <p><strong>Units:</strong> {assumptions.unitCount}</p>
                    <p><strong>Purchase Price:</strong> {formatCurrency(assumptions.purchasePrice)}</p>
                    <p><strong>Total Rehab:</strong> {formatCurrency(metrics.totalRehab)}</p>
                    <p><strong>ARV:</strong> {formatCurrency(metrics.arv)}</p>
                    <p><strong>Cash Flow:</strong> {formatCurrency(metrics.netCashFlow)}</p>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowImportModal(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={importToProperties}
                    disabled={isImporting}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
                  >
                    {isImporting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Importing...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        <span>Import Property</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}