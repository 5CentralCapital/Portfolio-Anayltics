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
  Wrench,
  Save,
  Download,
  Upload,
  Trash2,
  Archive
} from 'lucide-react';

export default function DealDemo() {
  const [dealData, setDealData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [editingRentRoll, setEditingRentRoll] = useState(false);
  const [editingIncome, setEditingIncome] = useState(false);
  const [editingExpenses, setEditingExpenses] = useState(false);
  const [editingRehab, setEditingRehab] = useState(false);
  const [editingLoans, setEditingLoans] = useState(false);
  const [editingAssumptionField, setEditingAssumptionField] = useState<string | null>(null);
  const [editingDealName, setEditingDealName] = useState(false);
  const [editingDealNameValue, setEditingDealNameValue] = useState('');
  const [savedDeals, setSavedDeals] = useState<any[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveModalName, setSaveModalName] = useState('');
  const [saveModalDescription, setSaveModalDescription] = useState('');
  const [assumptions, setAssumptions] = useState<any>({});
  const [rentRollData, setRentRollData] = useState<any[]>([]);
  const [incomeData, setIncomeData] = useState<any[]>([]);
  const [expenseData, setExpenseData] = useState<any[]>([]);
  const [rehabData, setRehabData] = useState<any[]>([]);
  const [loanData, setLoanData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch deal data
        const dealResponse = await fetch('/api/deals/1');
        if (!dealResponse.ok) {
          throw new Error(`HTTP error! status: ${dealResponse.status}`);
        }
        const data = await dealResponse.json();
        setDealData(data);
        
        // Initialize assumptions with deal data
        setAssumptions({
          purchasePrice: Number(data.deal.purchasePrice),
          units: data.deal.units,
          ltcPercentage: 0.80,
          marketCapRate: data.deal.marketCapRate,
          exitCapRate: data.deal.exitCapRate,
          refinanceLTV: 0.75,
          vacancyRate: data.deal.vacancyRate,
          badDebtRate: data.deal.badDebtRate,
          annualRentGrowth: data.deal.annualRentGrowth,
          annualExpenseInflation: data.deal.annualExpenseInflation,
          capexReservePerUnit: data.deal.capexReservePerUnit,
          operatingReserveMonths: data.deal.operatingReserveMonths,
          projectedRefiMonth: data.deal.projectedRefiMonth
        });
        
        // Initialize editable data states
        setRentRollData(data.units || []);
        setIncomeData(data.otherIncome || []);
        setExpenseData(data.expenses || []);
        setRehabData(data.rehabItems || []);
        setLoanData(data.loans || []);

        // Fetch saved deals
        const savedResponse = await fetch('/api/saved-deals');
        if (savedResponse.ok) {
          const savedDealsData = await savedResponse.json();
          setSavedDeals(savedDealsData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load deal');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return (value * 100).toFixed(2) + '%';
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading deal analysis...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Deal</h2>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!dealData) {
    return null;
  }

  const { deal, kpis, units, expenses, otherIncome, rehabItems, loans } = dealData;

  const updateAssumption = (key: string, value: string) => {
    const numValue = parseFloat(value);
    setAssumptions((prev: any) => ({
      ...prev,
      [key]: isNaN(numValue) ? 0 : numValue
    }));
  };

  // Save deal functionality
  const saveDeal = async () => {
    if (!saveModalName.trim()) return;
    
    try {
      const currentState = {
        name: saveModalName,
        description: saveModalDescription,
        originalDealId: dealData.deal.id,
        assumptions: JSON.stringify(assumptions),
        rentRollData: JSON.stringify(rentRollData),
        incomeData: JSON.stringify(incomeData),
        expenseData: JSON.stringify(expenseData),
        rehabData: JSON.stringify(rehabData),
        loanData: JSON.stringify(loanData),
        calculatedKpis: JSON.stringify(realTimeKPIs)
      };

      const response = await fetch('/api/saved-deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentState)
      });

      if (response.ok) {
        const newSavedDeal = await response.json();
        setSavedDeals(prev => [newSavedDeal, ...prev]);
        setShowSaveModal(false);
        setSaveModalName('');
        setSaveModalDescription('');
      }
    } catch (error) {
      console.error('Error saving deal:', error);
    }
  };

  // Load deal functionality
  const loadSavedDeal = async (savedDealId: number) => {
    try {
      const response = await fetch(`/api/saved-deals/${savedDealId}`);
      if (response.ok) {
        const savedDeal = await response.json();
        
        // Restore all data from saved state
        setAssumptions(JSON.parse(savedDeal.assumptions));
        setRentRollData(JSON.parse(savedDeal.rentRollData || '[]'));
        setIncomeData(JSON.parse(savedDeal.incomeData || '[]'));
        setExpenseData(JSON.parse(savedDeal.expenseData || '[]'));
        setRehabData(JSON.parse(savedDeal.rehabData || '[]'));
        setLoanData(JSON.parse(savedDeal.loanData || '[]'));
        
        // Switch to overview tab
        setActiveTab('overview');
      }
    } catch (error) {
      console.error('Error loading saved deal:', error);
    }
  };

  // Export deal functionality
  const exportDeal = (savedDeal: any) => {
    const exportData = {
      name: savedDeal.name,
      description: savedDeal.description,
      createdAt: savedDeal.createdAt,
      assumptions: JSON.parse(savedDeal.assumptions),
      rentRollData: JSON.parse(savedDeal.rentRollData || '[]'),
      incomeData: JSON.parse(savedDeal.incomeData || '[]'),
      expenseData: JSON.parse(savedDeal.expenseData || '[]'),
      rehabData: JSON.parse(savedDeal.rehabData || '[]'),
      loanData: JSON.parse(savedDeal.loanData || '[]'),
      calculatedKpis: JSON.parse(savedDeal.calculatedKpis || '{}')
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${savedDeal.name.replace(/[^a-z0-9]/gi, '_')}_deal_export.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Delete saved deal
  const deleteSavedDeal = async (savedDealId: number) => {
    try {
      const response = await fetch(`/api/saved-deals/${savedDealId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setSavedDeals(prev => prev.filter(deal => deal.id !== savedDealId));
      }
    } catch (error) {
      console.error('Error deleting saved deal:', error);
    }
  };

  // Calculate real-time KPIs based on current data
  const calculateRealTimeKPIs = () => {
    const purchasePrice = Number(assumptions.purchasePrice) || Number(deal.purchasePrice) || 0;
    
    // Current income calculations
    const currentGrossRentalIncome = (rentRollData.length > 0 ? rentRollData : units).reduce((sum: number, unit: any) => 
      sum + (Number(unit.currentRent) || 0) * 12, 0
    );
    
    const proformaGrossRentalIncome = (rentRollData.length > 0 ? rentRollData : units).reduce((sum: number, unit: any) => 
      sum + (Number(unit.marketRent) || 1300) * 12, 0
    );
    
    const currentOtherIncome = (incomeData.length > 0 ? incomeData : otherIncome).reduce((sum: number, income: any) => 
      sum + (Number(income.annualAmount) || 0), 0
    );
    
    const currentEffectiveGrossIncome = currentGrossRentalIncome + currentOtherIncome;
    const proformaEffectiveGrossIncome = proformaGrossRentalIncome + currentOtherIncome;
    
    // Expense calculations
    const totalOperatingExpenses = (expenseData.length > 0 ? expenseData : expenses).reduce((sum: number, expense: any) => {
      const proformaRent = proformaGrossRentalIncome;
      return sum + (expense.isPercentOfRent 
        ? proformaRent * (Number(expense.percentage) || 0)
        : (Number(expense.monthlyAmount) * 12 || 0)
      );
    }, 0);
    
    // NOI calculations
    const currentNOI = currentEffectiveGrossIncome - totalOperatingExpenses;
    const proformaNOI = proformaEffectiveGrossIncome - totalOperatingExpenses;
    
    // Loan calculations
    const loanAmount = (loanData.length > 0 ? loanData : loans)
      .filter((loan: any) => loan.loanType === 'acquisition')
      .reduce((sum: number, loan: any) => sum + (Number(loan.loanAmount) || 0), 0) || 
      (purchasePrice * (assumptions.ltcPercentage || 0.80));
    
    const monthlyDebtService = (loanData.length > 0 ? loanData : loans)
      .filter((loan: any) => loan.loanType === 'acquisition')
      .reduce((sum: number, loan: any) => {
        const principal = Number(loan.loanAmount) || 0;
        const rate = Number(loan.interestRate) || 0.06;
        const term = Number(loan.amortizationYears) || 30;
        
        if (principal <= 0 || rate <= 0 || term <= 0) return sum;
        
        const monthlyRate = rate / 12;
        const numPayments = term * 12;
        const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                       (Math.pow(1 + monthlyRate, numPayments) - 1);
        
        return sum + (isNaN(payment) ? 0 : payment);
      }, 0);
    
    // Cash flow calculations
    const currentCashFlow = (currentNOI / 12) - monthlyDebtService;
    const proformaCashFlow = (proformaNOI / 12) - monthlyDebtService;
    
    // Investment metrics
    const downPayment = purchasePrice - loanAmount;
    const capRate = purchasePrice > 0 ? proformaNOI / purchasePrice : 0;
    const cashOnCashReturn = downPayment > 0 ? (currentCashFlow * 12) / downPayment : 0;
    const dscr = monthlyDebtService > 0 ? (currentNOI / 12) / monthlyDebtService : 0;
    
    // Refinance calculations
    const refinanceLTV = assumptions.refinanceLTV || 0.75;
    const refinanceLoanAmount = proformaNOI > 0 ? (proformaNOI / (assumptions.exitCapRate || 0.06)) * refinanceLTV : 0;
    const cashOut = Math.max(0, refinanceLoanAmount - loanAmount);
    const totalProfit = cashOut - downPayment;
    
    return {
      currentGrossRentalIncome,
      currentEffectiveGrossIncome,
      currentNOI,
      currentCashFlow,
      currentMonthlyRent: currentGrossRentalIncome / 12,
      currentMonthlyExpenses: totalOperatingExpenses / 12,
      proformaGrossRentalIncome,
      proformaEffectiveGrossIncome,
      proformaNOI,
      proformaCashFlow,
      proformaMonthlyRent: proformaGrossRentalIncome / 12,
      totalOperatingExpenses,
      loanAmount,
      monthlyDebtService,
      annualDebtService: monthlyDebtService * 12,
      downPayment,
      capRate,
      cashOnCashReturn,
      dscr,
      refinanceLoanAmount,
      cashOut,
      totalProfit,
      ltc: purchasePrice > 0 ? loanAmount / purchasePrice : 0,
      ltv: purchasePrice > 0 ? loanAmount / purchasePrice : 0,
      otherCurrentIncome: currentOtherIncome,
      otherProformaIncome: currentOtherIncome
    };
  };

  const realTimeKPIs = calculateRealTimeKPIs();

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Building },
    { id: 'rentroll', label: 'Rent Roll', icon: Users },
    { id: 'income', label: 'Income & Expense', icon: DollarSign },
    { id: 'proforma', label: '12 Month Proforma', icon: Calendar },
    { id: 'rehab', label: 'Rehab Budget', icon: Wrench },
    { id: 'loans', label: 'Loans', icon: Calculator },
    { id: 'saved', label: 'Saved Deals', icon: Archive }
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div>
            {editingDealName ? (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={editingDealNameValue}
                  onChange={(e) => setEditingDealNameValue(e.target.value)}
                  onBlur={() => {
                    setEditingDealName(false);
                    // Here you would save the new deal name
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      setEditingDealName(false);
                      // Here you would save the new deal name
                    }
                  }}
                  className="text-2xl font-bold bg-transparent border-b-2 border-blue-500 focus:outline-none"
                  autoFocus
                />
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-gray-900">{deal.name}</h1>
                <button
                  onClick={() => {
                    setEditingDealNameValue(deal.name);
                    setEditingDealName(true);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Edit className="h-4 w-4" />
                </button>
              </div>
            )}
            <p className="text-gray-600 mt-1">
              {deal.address}, {deal.city}, {deal.state}
            </p>
          </div>
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
            onClick={() => setShowSaveModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Save className="h-4 w-4" />
            <span>Save Deal</span>
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
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Main Content */}
        <div className="col-span-8">
          {/* Saved Deals Tab */}
          {activeTab === 'saved' && (
            <div className="space-y-6">
              {/* Saved Deals List */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Saved Deals</h2>
                  <div className="text-sm text-gray-600">
                    {savedDeals.length} saved deal{savedDeals.length !== 1 ? 's' : ''}
                  </div>
                </div>
                
                {savedDeals.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Archive className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>No saved deals yet</p>
                    <p className="text-sm">Click "Save Deal" to save your current analysis</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Group saved deals by property name */}
                    {Object.entries(
                      savedDeals.reduce((groups: any, deal: any) => {
                        const propertyName = deal.name.split(' - ')[0] || deal.name;
                        if (!groups[propertyName]) groups[propertyName] = [];
                        groups[propertyName].push(deal);
                        return groups;
                      }, {})
                    ).map(([propertyName, deals]: [string, any]) => (
                      <div key={propertyName} className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-3">{propertyName}</h3>
                        <div className="space-y-2">
                          {(deals as any[]).map((deal: any) => (
                            <div
                              key={deal.id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex-1">
                                <div className="flex items-center space-x-3">
                                  <div>
                                    <p className="font-medium text-gray-900">{deal.name}</p>
                                    {deal.description && (
                                      <p className="text-sm text-gray-600">{deal.description}</p>
                                    )}
                                    <p className="text-xs text-gray-500">
                                      Saved {new Date(deal.createdAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => loadSavedDeal(deal.id)}
                                  className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm flex items-center space-x-1"
                                >
                                  <Upload className="h-3 w-3" />
                                  <span>Load</span>
                                </button>
                                
                                <button
                                  onClick={() => exportDeal(deal)}
                                  className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm flex items-center space-x-1"
                                >
                                  <Download className="h-3 w-3" />
                                  <span>Export</span>
                                </button>
                                
                                <button
                                  onClick={() => deleteSavedDeal(deal.id)}
                                  className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm flex items-center space-x-1"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Investment Metrics */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Key Investment Metrics</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Purchase Price</label>
                    {editingAssumptionField === 'purchasePrice' ? (
                      <input
                        type="number"
                        value={assumptions.purchasePrice || Number(deal.purchasePrice)}
                        onChange={(e) => updateAssumption('purchasePrice', e.target.value)}
                        onBlur={() => setEditingAssumptionField(null)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            setEditingAssumptionField(null);
                          }
                        }}
                        className="text-2xl font-bold border-b-2 border-blue-500 bg-transparent outline-none w-full"
                        autoFocus
                      />
                    ) : (
                      <p 
                        className="text-2xl font-bold cursor-pointer hover:text-blue-600"
                        onDoubleClick={() => setEditingAssumptionField('purchasePrice')}
                        title="Double-click to edit"
                      >
                        {formatCurrency(assumptions.purchasePrice || Number(deal.purchasePrice))}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Down Payment</label>
                    <p className="text-2xl font-bold">{formatCurrency(realTimeKPIs.downPayment)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Purchase Loan</label>
                    <p className="text-2xl font-bold">{formatCurrency(realTimeKPIs.loanAmount)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Cap Rate</label>
                    <p className="text-2xl font-bold">{((realTimeKPIs.capRate || 0) * 100).toFixed(2)}%</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Cash Flow</label>
                    <p className={`text-2xl font-bold ${
                      (realTimeKPIs.currentCashFlow || 0) > 0 ? "text-green-600" : "text-red-600"
                    }`}>
                      {formatCurrency(realTimeKPIs.currentCashFlow)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Cash-on-Cash Return</label>
                    <p className={`text-2xl font-bold ${
                      (realTimeKPIs.cashOnCashReturn || 0) > 0.12 ? "text-green-600" : 
                      (realTimeKPIs.cashOnCashReturn || 0) > 0.08 ? "text-yellow-600" : "text-red-600"
                    }`}>
                      {((realTimeKPIs.cashOnCashReturn || 0) * 100).toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Refinance Loan</label>
                    <p className="text-2xl font-bold">{formatCurrency(realTimeKPIs.refinanceLoanAmount)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Total Profit</label>
                    <p className={`text-2xl font-bold ${
                      (realTimeKPIs.totalProfit || 0) > 0 ? "text-green-600" : "text-red-600"
                    }`}>
                      {formatCurrency(realTimeKPIs.totalProfit)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Assumptions Panel */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Investment Assumptions</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-600">LTC Percentage</label>
                    {editingAssumptionField === 'ltcPercentage' ? (
                      <input
                        type="number"
                        step="0.01"
                        value={((assumptions.ltcPercentage || 0.80) * 100).toFixed(0)}
                        onChange={(e) => updateAssumption('ltcPercentage', (Number(e.target.value) / 100).toString())}
                        onBlur={() => setEditingAssumptionField(null)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            setEditingAssumptionField(null);
                          }
                        }}
                        className="text-lg font-bold border-b-2 border-blue-500 bg-transparent outline-none w-full"
                        autoFocus
                      />
                    ) : (
                      <p 
                        className="text-lg font-bold cursor-pointer hover:text-blue-600"
                        onDoubleClick={() => setEditingAssumptionField('ltcPercentage')}
                        title="Double-click to edit"
                      >
                        {((assumptions.ltcPercentage || 0.80) * 100).toFixed(0)}%
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Exit Cap Rate</label>
                    {editingAssumptionField === 'exitCapRate' ? (
                      <input
                        type="number"
                        step="0.001"
                        value={((assumptions.exitCapRate || deal.exitCapRate) * 100).toFixed(3)}
                        onChange={(e) => updateAssumption('exitCapRate', (Number(e.target.value) / 100).toString())}
                        onBlur={() => setEditingAssumptionField(null)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            setEditingAssumptionField(null);
                          }
                        }}
                        className="text-lg font-bold border-b-2 border-blue-500 bg-transparent outline-none w-full"
                        autoFocus
                      />
                    ) : (
                      <p 
                        className="text-lg font-bold cursor-pointer hover:text-blue-600"
                        onDoubleClick={() => setEditingAssumptionField('exitCapRate')}
                        title="Double-click to edit"
                      >
                        {((assumptions.exitCapRate || deal.exitCapRate) * 100).toFixed(3)}%
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Refinance LTV</label>
                    {editingAssumptionField === 'refinanceLTV' ? (
                      <input
                        type="number"
                        step="0.01"
                        value={((assumptions.refinanceLTV || 0.75) * 100).toFixed(0)}
                        onChange={(e) => updateAssumption('refinanceLTV', (Number(e.target.value) / 100).toString())}
                        onBlur={() => setEditingAssumptionField(null)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            setEditingAssumptionField(null);
                          }
                        }}
                        className="text-lg font-bold border-b-2 border-blue-500 bg-transparent outline-none w-full"
                        autoFocus
                      />
                    ) : (
                      <p 
                        className="text-lg font-bold cursor-pointer hover:text-blue-600"
                        onDoubleClick={() => setEditingAssumptionField('refinanceLTV')}
                        title="Double-click to edit"
                      >
                        {((assumptions.refinanceLTV || 0.75) * 100).toFixed(0)}%
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Rent Roll Tab */}
          {activeTab === 'rentroll' && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Rent Roll</h2>
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sqft</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Rent</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Market Rent</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lease End</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(rentRollData.length > 0 ? rentRollData : units).map((unit: any, index: number) => (
                      <tr key={index}>
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium">{unit.unitNumber}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm">{unit.bedrooms}BR/{unit.bathrooms}BA</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm">{unit.sqft}</span>
                        </td>
                        <td className="px-4 py-3">
                          {editingRentRoll ? (
                            <input
                              type="number"
                              value={rentRollData.find((r: any) => r.unitNumber === unit.unitNumber)?.currentRent || unit.currentRent}
                              onChange={(e) => {
                                const newData = [...rentRollData];
                                const unitIndex = newData.findIndex((r: any) => r.unitNumber === unit.unitNumber);
                                if (unitIndex >= 0) {
                                  newData[unitIndex].currentRent = Number(e.target.value);
                                } else {
                                  newData.push({ ...unit, currentRent: Number(e.target.value) });
                                }
                                setRentRollData(newData);
                              }}
                              className="w-24 px-3 py-2 border border-gray-300 rounded text-sm"
                            />
                          ) : (
                            <span className="text-sm font-bold">{formatCurrency(unit.currentRent)}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {editingRentRoll ? (
                            <input
                              type="number"
                              value={rentRollData.find((r: any) => r.unitNumber === unit.unitNumber)?.marketRent || unit.marketRent}
                              onChange={(e) => {
                                const newData = [...rentRollData];
                                const unitIndex = newData.findIndex((r: any) => r.unitNumber === unit.unitNumber);
                                if (unitIndex >= 0) {
                                  newData[unitIndex].marketRent = Number(e.target.value);
                                } else {
                                  newData.push({ ...unit, marketRent: Number(e.target.value) });
                                }
                                setRentRollData(newData);
                              }}
                              className="w-24 px-3 py-2 border border-gray-300 rounded text-sm"
                            />
                          ) : (
                            <span className="text-sm font-bold text-blue-600">{formatCurrency(unit.marketRent)}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm">{unit.tenantName || 'Vacant'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm">{unit.leaseEndDate || 'N/A'}</span>
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
              {/* Income Section */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Other Income</h2>
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
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Income Source</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monthly Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Annual Amount</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(incomeData.length > 0 ? incomeData : otherIncome).map((income: any, index: number) => (
                        <tr key={index}>
                          <td className="px-4 py-3">
                            <span className="text-sm font-medium">{income.category || income.incomeName}</span>
                          </td>
                          <td className="px-4 py-3">
                            {editingIncome ? (
                              <input
                                type="number"
                                value={incomeData.find((i: any) => i.category === income.category)?.monthlyAmount || Number(income.monthlyAmount)}
                                onChange={(e) => {
                                  const newData = [...incomeData];
                                  const incomeIndex = newData.findIndex((i: any) => i.category === income.category);
                                  if (incomeIndex >= 0) {
                                    newData[incomeIndex].monthlyAmount = Number(e.target.value);
                                  } else {
                                    newData.push({
                                      ...income,
                                      monthlyAmount: Number(e.target.value)
                                    });
                                  }
                                  setIncomeData(newData);
                                }}
                                className="w-24 px-3 py-2 border border-gray-300 rounded text-sm"
                              />
                            ) : (
                              <span className="text-sm font-bold">{formatCurrency(Number(income.monthlyAmount))}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-bold text-green-600">
                              {formatCurrency((incomeData.find((i: any) => i.category === income.category)?.monthlyAmount || Number(income.monthlyAmount)) * 12)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Expense Section */}
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
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expense Category</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount/Percentage</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monthly Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Annual Amount</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(expenseData.length > 0 ? expenseData : expenses).map((expense: any, index: number) => (
                        <tr key={index}>
                          <td className="px-4 py-3">
                            <span className="text-sm font-medium">{expense.category}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm">{expense.isPercentOfRent ? 'Percentage' : 'Fixed'}</span>
                          </td>
                          <td className="px-4 py-3">
                            {editingExpenses ? (
                              expense.isPercentOfRent ? (
                                <input
                                  type="number"
                                  step="0.001"
                                  value={((expenseData.find((e: any) => e.category === expense.category)?.percentage || Number(expense.percentage)) * 100).toFixed(1)}
                                  onChange={(e) => {
                                    const newData = [...expenseData];
                                    const expenseIndex = newData.findIndex((ex: any) => ex.category === expense.category);
                                    if (expenseIndex >= 0) {
                                      newData[expenseIndex].percentage = Number(e.target.value) / 100;
                                    } else {
                                      newData.push({ ...expense, percentage: Number(e.target.value) / 100 });
                                    }
                                    setExpenseData(newData);
                                  }}
                                  className="w-20 px-3 py-2 border border-gray-300 rounded text-sm"
                                />
                              ) : (
                                <input
                                  type="number"
                                  value={expenseData.find((e: any) => e.category === expense.category)?.monthlyAmount || Number(expense.monthlyAmount)}
                                  onChange={(e) => {
                                    const newData = [...expenseData];
                                    const expenseIndex = newData.findIndex((ex: any) => ex.category === expense.category);
                                    if (expenseIndex >= 0) {
                                      newData[expenseIndex].monthlyAmount = Number(e.target.value);
                                    } else {
                                      newData.push({ ...expense, monthlyAmount: Number(e.target.value) });
                                    }
                                    setExpenseData(newData);
                                  }}
                                  className="w-24 px-3 py-2 border border-gray-300 rounded text-sm"
                                />
                              )
                            ) : (
                              <span className="text-sm">
                                {expense.isPercentOfRent 
                                  ? `${(Number(expense.percentage) * 100).toFixed(1)}%`
                                  : formatCurrency(Number(expense.monthlyAmount))
                                }
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-bold">
                              {expense.isPercentOfRent
                                ? formatCurrency((realTimeKPIs.proformaGrossRentalIncome * Number(expense.percentage)) / 12)
                                : formatCurrency(Number(expense.monthlyAmount))
                              }
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-bold text-red-600">
                              {expense.isPercentOfRent
                                ? formatCurrency(realTimeKPIs.proformaGrossRentalIncome * Number(expense.percentage))
                                : formatCurrency(Number(expense.monthlyAmount) * 12)
                              }
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 12 Month Proforma Tab */}
          {activeTab === 'proforma' && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">12 Month Proforma</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gross Rent</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Other Income</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Effective Income</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Operating Expenses</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">NOI</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Debt Service</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cash Flow</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Array.from({ length: 12 }, (_, month) => {
                      const monthlyGrossRent = realTimeKPIs.proformaGrossRentalIncome / 12;
                      const monthlyOtherIncome = realTimeKPIs.currentOtherIncome / 12;
                      const monthlyEffectiveIncome = monthlyGrossRent + monthlyOtherIncome;
                      const monthlyOperatingExpenses = realTimeKPIs.totalOperatingExpenses / 12;
                      const monthlyNOI = monthlyEffectiveIncome - monthlyOperatingExpenses;
                      const monthlyDebtService = realTimeKPIs.monthlyDebtService;
                      const monthlyCashFlow = monthlyNOI - monthlyDebtService;
                      
                      return (
                        <tr key={month}>
                          <td className="px-4 py-3">
                            <span className="text-sm font-medium">Month {month + 1}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm">{formatCurrency(monthlyGrossRent)}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm">{formatCurrency(monthlyOtherIncome)}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-bold">{formatCurrency(monthlyEffectiveIncome)}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-red-600">{formatCurrency(monthlyOperatingExpenses)}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-bold text-blue-600">{formatCurrency(monthlyNOI)}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-red-600">{formatCurrency(monthlyDebtService)}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-sm font-bold ${monthlyCashFlow > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(monthlyCashFlow)}
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
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Rehab Budget</h2>
                <button
                  onClick={() => setEditingRehab(!editingRehab)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    editingRehab 
                      ? 'bg-green-600 text-white hover:bg-green-700' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {editingRehab ? 'Save Changes' : 'Edit Budget'}
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Cost</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bid Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(rehabData.length > 0 ? rehabData : rehabItems).map((item: any, index: number) => (
                      <tr key={index}>
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium">{item.category}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm">{item.description}</span>
                        </td>
                        <td className="px-4 py-3">
                          {editingRehab ? (
                            <input
                              type="number"
                              value={rehabData.find((r: any) => r.category === item.category)?.totalCost || Number(item.totalCost)}
                              onChange={(e) => {
                                const newData = [...rehabData];
                                const itemIndex = newData.findIndex((r: any) => r.category === item.category);
                                if (itemIndex >= 0) {
                                  newData[itemIndex].totalCost = Number(e.target.value);
                                } else {
                                  newData.push({ ...item, totalCost: Number(e.target.value) });
                                }
                                setRehabData(newData);
                              }}
                              className="w-24 px-3 py-2 border border-gray-300 rounded text-sm"
                            />
                          ) : (
                            <span className="text-sm font-bold">{formatCurrency(Number(item.totalCost))}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.bidStatus === 'contracted' ? 'bg-green-100 text-green-800' :
                            item.bidStatus === 'bid_received' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {item.bidStatus?.replace('_', ' ') || 'estimated'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total Rehab Budget:</span>
                  <span className="text-xl font-bold text-blue-600">
                    {formatCurrency((rehabData.length > 0 ? rehabData : rehabItems).reduce((sum: number, item: any) => 
                      sum + Number(item.totalCost), 0
                    ))}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Loans Tab */}
          {activeTab === 'loans' && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Loan Details</h2>
                <button
                  onClick={() => setEditingLoans(!editingLoans)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    editingLoans 
                      ? 'bg-green-600 text-white hover:bg-green-700' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {editingLoans ? 'Save Changes' : 'Edit Loans'}
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loan Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loan Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Interest Rate</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Term (Years)</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monthly Payment</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Points</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(loanData.length > 0 ? loanData : loans).map((loan: any, index: number) => {
                      const principal = Number(loan.loanAmount);
                      const rate = Number(loan.interestRate);
                      const term = Number(loan.amortizationYears);
                      
                      let monthlyPayment = 0;
                      if (principal > 0 && rate > 0 && term > 0) {
                        const monthlyRate = rate / 12;
                        const numPayments = term * 12;
                        monthlyPayment = (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                                        (Math.pow(1 + monthlyRate, numPayments) - 1);
                      }
                      
                      return (
                        <tr key={index}>
                          <td className="px-4 py-3">
                            <span className="text-sm font-medium capitalize">{loan.loanType}</span>
                          </td>
                          <td className="px-4 py-3">
                            {editingLoans ? (
                              <input
                                type="number"
                                value={loanData.find((l: any) => l.loanType === loan.loanType)?.loanAmount || Number(loan.loanAmount)}
                                onChange={(e) => {
                                  const newData = [...loanData];
                                  const loanIndex = newData.findIndex((l: any) => l.loanType === loan.loanType);
                                  if (loanIndex >= 0) {
                                    newData[loanIndex].loanAmount = Number(e.target.value);
                                  } else {
                                    newData.push({ ...loan, loanAmount: Number(e.target.value) });
                                  }
                                  setLoanData(newData);
                                }}
                                className="w-32 px-3 py-2 border border-gray-300 rounded text-sm"
                              />
                            ) : (
                              <span className="text-sm font-bold">{formatCurrency(principal)}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {editingLoans ? (
                              <input
                                type="number"
                                step="0.001"
                                value={(loanData.find((l: any) => l.loanType === loan.loanType)?.interestRate || rate) * 100}
                                onChange={(e) => {
                                  const newData = [...loanData];
                                  const loanIndex = newData.findIndex((l: any) => l.loanType === loan.loanType);
                                  if (loanIndex >= 0) {
                                    newData[loanIndex].interestRate = Number(e.target.value) / 100;
                                  } else {
                                    newData.push({ ...loan, interestRate: Number(e.target.value) / 100 });
                                  }
                                  setLoanData(newData);
                                }}
                                className="w-20 px-3 py-2 border border-gray-300 rounded text-sm"
                              />
                            ) : (
                              <span className="text-sm">{(rate * 100).toFixed(3)}%</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm">{term}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-bold">{formatCurrency(monthlyPayment)}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm">{(Number(loan.points) * 100).toFixed(1)}%</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Placeholder for any remaining tabs */}
          {!['saved', 'overview', 'rentroll', 'income', 'proforma', 'rehab', 'loans'].includes(activeTab) && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">{tabs.find(t => t.id === activeTab)?.label}</h2>
              <p className="text-gray-600">Tab content for {activeTab} coming soon...</p>
            </div>
          )}
        </div>

        {/* KPI Panel */}
        <div className="col-span-4">
          <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-6">
            <h2 className="text-lg font-semibold mb-4">Real-Time KPIs</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Cash Flow</span>
                <span className={`text-lg font-bold ${
                  (realTimeKPIs.currentCashFlow || 0) > 0 ? "text-green-600" : "text-red-600"
                }`}>
                  {formatCurrency(realTimeKPIs.currentCashFlow)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Cap Rate</span>
                <span className="text-lg font-bold text-blue-600">
                  {((realTimeKPIs.capRate || 0) * 100).toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Cash-on-Cash</span>
                <span className="text-lg font-bold text-blue-600">
                  {((realTimeKPIs.cashOnCashReturn || 0) * 100).toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">DSCR</span>
                <span className={`text-lg font-bold ${
                  (realTimeKPIs.dscr || 0) >= 1.25 ? "text-green-600" : "text-red-600"
                }`}>
                  {(realTimeKPIs.dscr || 0).toFixed(2)}x
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Profit</span>
                <span className={`text-lg font-bold ${
                  (realTimeKPIs.totalProfit || 0) > 0 ? "text-green-600" : "text-red-600"
                }`}>
                  {formatCurrency(realTimeKPIs.totalProfit)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Deal Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Save Current Deal Analysis</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deal Name *
                </label>
                <input
                  type="text"
                  value={saveModalName}
                  onChange={(e) => setSaveModalName(e.target.value)}
                  placeholder="e.g., Maple Street Apartments - High Cap Rate Scenario"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={saveModalDescription}
                  onChange={(e) => setSaveModalDescription(e.target.value)}
                  placeholder="Brief description of this analysis scenario..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowSaveModal(false);
                  setSaveModalName('');
                  setSaveModalDescription('');
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveDeal}
                disabled={!saveModalName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>Save Deal</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}