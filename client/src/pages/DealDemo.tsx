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

  const [editingRentRoll, setEditingRentRoll] = useState(false);
  const [editingIncome, setEditingIncome] = useState(false);
  const [editingExpenses, setEditingExpenses] = useState(false);
  const [editingRehab, setEditingRehab] = useState(false);
  const [editingLoans, setEditingLoans] = useState(false);
  const [editingAssumptionField, setEditingAssumptionField] = useState<string | null>(null);
  const [editingDealName, setEditingDealName] = useState(false);
  const [editingDealNameValue, setEditingDealNameValue] = useState('');
  const [assumptions, setAssumptions] = useState<any>({});
  const [rentRollData, setRentRollData] = useState<any[]>([]);
  const [incomeData, setIncomeData] = useState<any[]>([]);
  const [expenseData, setExpenseData] = useState<any[]>([]);
  const [rehabData, setRehabData] = useState<any[]>([]);
  const [loanData, setLoanData] = useState<any[]>([]);

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
        
        // Initialize editable data states
        setRentRollData(data.units || []);
        setIncomeData(data.otherIncome || []);
        setExpenseData(data.expenses || []);
        setRehabData(data.rehabItems || []);
        setLoanData(data.loans || []);
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

  const { deal, kpis, units, expenses, otherIncome, rehabItems, loans } = dealData;

  const updateAssumption = (key: string, value: string) => {
    const numValue = parseFloat(value);
    setAssumptions((prev: any) => ({
      ...prev,
      [key]: isNaN(numValue) ? 0 : numValue
    }));
  };

  // Calculate real-time KPIs based on current data
  const calculateRealTimeKPIs = () => {
    const purchasePrice = Number(assumptions.purchasePrice) || Number(deal.purchasePrice) || 0;
    const ltcPercentage = Number(assumptions.ltcPercentage) || 0.80;
    const refinanceLTV = Number(assumptions.refinanceLTV) || 0.75;
    const marketCapRate = Number(assumptions.marketCapRate) || Number(deal.marketCapRate) || 0.06;
    const vacancyRate = Number(assumptions.vacancyRate) || Number(deal.vacancyRate) || 0.05;
    const badDebtRate = Number(assumptions.badDebtRate) || Number(deal.badDebtRate) || 0.02;
    
    // Calculate rent roll totals from current data
    const currentRentRoll = rentRollData.length > 0 ? rentRollData : (units || []);
    const currentMonthlyRent = currentRentRoll.reduce((sum: number, unit: any) => 
      sum + (unit.isOccupied ? Number(unit.currentRent || 0) : 0), 0
    );
    const marketMonthlyRent = currentRentRoll.reduce((sum: number, unit: any) => 
      sum + Number(unit.marketRent || 0), 0
    );
    
    // Calculate income from current data
    const currentIncomeData = incomeData.length > 0 ? incomeData : (otherIncome || []);
    const otherMonthlyIncome = currentIncomeData.reduce((sum: number, income: any) => 
      sum + Number(income.monthlyAmount || 0), 0
    );
    const otherProformaIncome = currentIncomeData.reduce((sum: number, income: any) => 
      sum + Number(income.proformaAmount || income.monthlyAmount || 0), 0
    );
    
    // Calculate expenses from current data
    const currentExpenseData = expenseData.length > 0 ? expenseData : (expenses || []);
    const currentMonthlyExpenses = currentExpenseData.reduce((sum: number, expense: any) => {
      if (expense.isPercentOfRent) {
        return sum + (currentMonthlyRent * parseFloat(expense.percentage || 0));
      }
      return sum + Number(expense.currentAmount || expense.monthlyAmount || 0);
    }, 0);
    const proformaMonthlyExpenses = currentExpenseData.reduce((sum: number, expense: any) => {
      if (expense.isPercentOfRent) {
        return sum + (marketMonthlyRent * parseFloat(expense.percentage || 0));
      }
      return sum + Number(expense.proformaAmount || expense.monthlyAmount || 0);
    }, 0);
    
    // Calculate rehab total from current data
    const currentRehabData = rehabData.length > 0 ? rehabData : (rehabItems || []);
    const totalRehab = currentRehabData.reduce((sum: number, item: any) => 
      sum + Number(item.totalCost || 0), 0
    );
    
    // Calculate gross rental income
    const currentGrossRentalIncome = (currentMonthlyRent + otherMonthlyIncome) * 12;
    const proformaGrossRentalIncome = (marketMonthlyRent + otherProformaIncome) * 12;
    
    // Calculate effective gross income (after vacancy and bad debt)
    const currentEffectiveGrossIncome = currentGrossRentalIncome * (1 - vacancyRate - badDebtRate);
    const proformaEffectiveGrossIncome = proformaGrossRentalIncome * (1 - vacancyRate - badDebtRate);
    
    // Calculate NOI
    const currentNOI = currentEffectiveGrossIncome - (currentMonthlyExpenses * 12);
    const proformaNOI = proformaEffectiveGrossIncome - (proformaMonthlyExpenses * 12);
    
    // Calculate ARV based on proforma NOI
    const arv = marketCapRate > 0 ? proformaNOI / marketCapRate : 0;
    
    // Calculate all-in cost using available data
    const closingCosts = kpis.totalClosingCosts || 0;
    const holdingCosts = kpis.totalHoldingCosts || 0;
    const allInCost = purchasePrice + totalRehab + closingCosts + holdingCosts;
    
    // Get dynamic loan data
    const currentLoanData = loanData.length > 0 ? loanData : (loans || []);
    const acquisitionLoan = currentLoanData.find((l: any) => l.loanType === 'acquisition') || currentLoanData[0];
    const refinanceLoan = currentLoanData.find((l: any) => l.loanType === 'refinance');
    
    // Calculate loan metrics using dynamic data
    const loanAmount = acquisitionLoan ? Number(acquisitionLoan.loanAmount) : purchasePrice * ltcPercentage;
    const interestRate = acquisitionLoan ? Number(acquisitionLoan.interestRate) / 100 : 0.0725;
    const termYears = acquisitionLoan ? Number(acquisitionLoan.termYears) : 30;
    const downPayment = purchasePrice - loanAmount;
    
    // Calculate refinance metrics
    const refinanceLoanAmount = refinanceLoan ? Number(refinanceLoan.loanAmount) : arv * refinanceLTV;
    const refinanceRate = refinanceLoan ? Number(refinanceLoan.interestRate) / 100 : interestRate;
    const refinanceTermYears = refinanceLoan ? Number(refinanceLoan.termYears) : termYears;
    
    // Calculate cash out correctly: refinance loan minus remaining acquisition loan balance
    const remainingBalance = loanAmount; // Simplified - in reality this would be calculated based on amortization
    const cashOut = Math.max(0, refinanceLoanAmount - remainingBalance - totalRehab);
    
    // Calculate monthly debt service for acquisition loan
    const monthlyRate = interestRate / 12;
    const numPayments = termYears * 12;
    const monthlyDebtService = loanAmount > 0 && monthlyRate > 0 
      ? loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1)
      : 0;
    
    // Calculate cash flow and returns
    const currentCashFlow = currentNOI - (monthlyDebtService * 12);
    const proformaCashFlow = proformaNOI - (monthlyDebtService * 12);
    const totalCashInvested = downPayment + totalRehab + closingCosts + holdingCosts;
    const cashOnCashReturn = totalCashInvested > 0 ? proformaCashFlow / totalCashInvested : 0;
    const capRate = purchasePrice > 0 ? proformaNOI / purchasePrice : 0;
    const dscr = monthlyDebtService > 0 ? proformaNOI / (monthlyDebtService * 12) : 0;
    const ltc = allInCost > 0 ? loanAmount / allInCost : 0;
    const ltv = arv > 0 ? loanAmount / arv : 0;
    
    const totalProfit = cashOut + proformaCashFlow + (arv - allInCost);
    const equityMultiple = totalCashInvested > 0 ? (totalProfit + totalCashInvested) / totalCashInvested : 0;
    const irrBase = totalCashInvested > 0 ? totalProfit / totalCashInvested + 1 : 1;
    const irr = irrBase > 0 ? Math.pow(irrBase, 1/5) - 1 : 0; // 5-year IRR approximation
    
    return {
      // Current performance
      currentGrossRentalIncome,
      currentEffectiveGrossIncome,
      currentNOI,
      currentCashFlow,
      currentMonthlyRent,
      currentMonthlyExpenses,
      
      // Proforma performance
      proformaGrossRentalIncome,
      proformaEffectiveGrossIncome,
      proformaNOI,
      proformaCashFlow,
      marketMonthlyRent,
      proformaMonthlyExpenses,
      
      // Key metrics
      arv,
      totalRehab,
      allInCost,
      loanAmount,
      downPayment,
      refinanceLoanAmount,
      cashOut,
      monthlyDebtService,
      cashOnCashReturn,
      capRate,
      dscr,
      ltc,
      ltv,
      totalProfit,
      equityMultiple,
      irr,
      otherMonthlyIncome,
      otherProformaIncome
    };
  };

  const realTimeKPIs = calculateRealTimeKPIs();

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
        <div className="flex-1">
          <div>
            {editingDealName ? (
              <input
                type="text"
                value={editingDealNameValue}
                onChange={(e) => setEditingDealNameValue(e.target.value)}
                onBlur={() => {
                  // Save the deal name change
                  if (editingDealNameValue.trim()) {
                    setDealData(prev => ({
                      ...prev,
                      deal: { ...prev.deal, name: editingDealNameValue }
                    }));
                  }
                  setEditingDealName(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (editingDealNameValue.trim()) {
                      setDealData(prev => ({
                        ...prev,
                        deal: { ...prev.deal, name: editingDealNameValue }
                      }));
                    }
                    setEditingDealName(false);
                  }
                  if (e.key === 'Escape') {
                    setEditingDealName(false);
                  }
                }}
                className="text-3xl font-bold border-b-2 border-blue-500 bg-transparent outline-none"
                placeholder="Deal Name"
                autoFocus
              />
            ) : (
              <h1 
                className="text-3xl font-bold cursor-pointer hover:text-blue-600"
                onDoubleClick={() => {
                  setEditingDealNameValue(deal.name);
                  setEditingDealName(true);
                }}
                title="Double-click to edit"
              >
                {deal.name}
              </h1>
            )}
            <p className="text-lg text-gray-600">
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
                    <label className="text-sm font-medium text-gray-600">Total Rehab</label>
                    <p className="text-2xl font-bold">{formatCurrency(realTimeKPIs.totalRehab)}</p>
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
                    <p className="text-2xl font-bold">{formatCurrency(realTimeKPIs.refinanceLoanAmount)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Cash Out</label>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(realTimeKPIs.cashOut)}</p>
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

              {/* Operating Assumptions */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Operating Assumptions</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Unit Count</label>
                    {editingAssumptionField === 'units' ? (
                      <input
                        type="number"
                        value={assumptions.units || deal.units}
                        onChange={(e) => updateAssumption('units', e.target.value)}
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
                        onDoubleClick={() => setEditingAssumptionField('units')}
                        title="Double-click to edit"
                      >
                        {assumptions.units || deal.units}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Market Cap Rate</label>
                    {editingAssumptionField === 'marketCapRate' ? (
                      <input
                        type="number"
                        step="0.001"
                        value={(assumptions.marketCapRate * 100).toFixed(3)}
                        onChange={(e) => updateAssumption('marketCapRate', (parseFloat(e.target.value) / 100).toString())}
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
                        onDoubleClick={() => setEditingAssumptionField('marketCapRate')}
                        title="Double-click to edit"
                      >
                        {formatPercent(assumptions.marketCapRate || deal.marketCapRate)}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Vacancy Rate</label>
                    {editingAssumptionField === 'vacancyRate' ? (
                      <input
                        type="number"
                        step="0.01"
                        value={(assumptions.vacancyRate * 100).toFixed(1)}
                        onChange={(e) => updateAssumption('vacancyRate', (parseFloat(e.target.value) / 100).toString())}
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
                        onDoubleClick={() => setEditingAssumptionField('vacancyRate')}
                        title="Double-click to edit"
                      >
                        {formatPercent(assumptions.vacancyRate || deal.vacancyRate)}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">LTC Percentage</label>
                    {editingAssumptionField === 'ltcPercentage' ? (
                      <input
                        type="number"
                        step="0.01"
                        value={(assumptions.ltcPercentage * 100).toFixed(1)}
                        onChange={(e) => updateAssumption('ltcPercentage', (parseFloat(e.target.value) / 100).toString())}
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
                        onDoubleClick={() => setEditingAssumptionField('ltcPercentage')}
                        title="Double-click to edit"
                      >
                        {formatPercent(assumptions.ltcPercentage || 0.80)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Old Editable Assumptions - Remove this section */}
              {false && (
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
                        <p className="text-lg font-bold">{formatCurrency(realTimeKPIs.downPayment)}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <label className="block text-sm font-medium text-gray-600">Purchase Loan</label>
                        <p className="text-lg font-bold">{formatCurrency(realTimeKPIs.loanAmount)}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <label className="block text-sm font-medium text-gray-600">Refinance Loan</label>
                        <p className="text-lg font-bold">{formatCurrency(realTimeKPIs.refinanceLoanAmount)}</p>
                      </div>
                      <div className="bg-green-50 p-3 rounded">
                        <label className="block text-sm font-medium text-gray-600">Total Profit</label>
                        <p className="text-lg font-bold text-green-600">{formatCurrency(realTimeKPIs.totalProfit)}</p>
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
                      const unit = units[index] || {};
                      const unitNumber = unit.unitNumber || `Unit ${index + 1}`;
                      const currentRent = Number(unit.currentRent) || 1200;
                      const marketRent = Number(unit.marketRent) || 1300;
                      const isOccupied = unit.isOccupied !== undefined ? unit.isOccupied : true;
                      
                      return (
                        <tr key={index}>
                          <td className="px-4 py-3">
                            {editingRentRoll ? (
                              <input
                                type="text"
                                value={rentRollData[index]?.unitNumber || unitNumber}
                                onChange={(e) => {
                                  const newData = [...rentRollData];
                                  if (!newData[index]) newData[index] = {};
                                  newData[index].unitNumber = e.target.value;
                                  setRentRollData(newData);
                                }}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            ) : (
                              <span className="text-sm font-medium">{unitNumber}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {editingRentRoll ? (
                              <input
                                type="text"
                                value={rentRollData[index]?.tenantName || (isOccupied ? 'Tenant Name' : '')}
                                onChange={(e) => {
                                  const newData = [...rentRollData];
                                  if (!newData[index]) newData[index] = {};
                                  newData[index].tenantName = e.target.value;
                                  setRentRollData(newData);
                                }}
                                placeholder="Tenant name"
                                className="w-32 px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            ) : (
                              <span className="text-sm">{rentRollData[index]?.tenantName || (isOccupied ? 'Tenant Name' : 'Vacant')}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {editingRentRoll ? (
                              <input
                                type="date"
                                value={rentRollData[index]?.leaseStart || (isOccupied ? '2024-01-15' : '')}
                                onChange={(e) => {
                                  const newData = [...rentRollData];
                                  if (!newData[index]) newData[index] = {};
                                  newData[index].leaseStart = e.target.value;
                                  setRentRollData(newData);
                                }}
                                className="w-32 px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            ) : (
                              <span className="text-sm">{rentRollData[index]?.leaseStart || (isOccupied ? '01/15/2024' : '-')}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {editingRentRoll ? (
                              <input
                                type="date"
                                value={rentRollData[index]?.leaseEnd || (isOccupied ? '2025-01-15' : '')}
                                onChange={(e) => {
                                  const newData = [...rentRollData];
                                  if (!newData[index]) newData[index] = {};
                                  newData[index].leaseEnd = e.target.value;
                                  setRentRollData(newData);
                                }}
                                className="w-32 px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            ) : (
                              <span className="text-sm">{rentRollData[index]?.leaseEnd || (isOccupied ? '01/15/2025' : '-')}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {editingRentRoll ? (
                              <input
                                type="number"
                                value={rentRollData[index]?.currentRent || currentRent || 0}
                                onChange={(e) => {
                                  const newData = [...rentRollData];
                                  if (!newData[index]) newData[index] = {};
                                  newData[index].currentRent = Number(e.target.value) || 0;
                                  setRentRollData(newData);
                                }}
                                className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            ) : (
                              <span className="text-sm font-medium">{formatCurrency(rentRollData[index]?.currentRent || currentRent)}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {editingRentRoll ? (
                              <input
                                type="number"
                                value={rentRollData[index]?.marketRent || marketRent || 0}
                                onChange={(e) => {
                                  const newData = [...rentRollData];
                                  if (!newData[index]) newData[index] = {};
                                  newData[index].marketRent = Number(e.target.value) || 0;
                                  setRentRollData(newData);
                                }}
                                className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            ) : (
                              <span className="text-sm font-medium">{formatCurrency(rentRollData[index]?.marketRent || marketRent)}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {editingRentRoll ? (
                              <select
                                value={rentRollData[index]?.isOccupied !== undefined ? (rentRollData[index].isOccupied ? 'occupied' : 'vacant') : (isOccupied ? 'occupied' : 'vacant')}
                                onChange={(e) => {
                                  const newData = [...rentRollData];
                                  if (!newData[index]) newData[index] = {};
                                  newData[index].isOccupied = e.target.value === 'occupied';
                                  setRentRollData(newData);
                                }}
                                className="px-2 py-1 border border-gray-300 rounded text-sm"
                              >
                                <option value="occupied">Occupied</option>
                                <option value="vacant">Vacant</option>
                              </select>
                            ) : (
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                (rentRollData[index]?.isOccupied !== undefined ? rentRollData[index].isOccupied : isOccupied)
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {(rentRollData[index]?.isOccupied !== undefined ? rentRollData[index].isOccupied : isOccupied) ? 'Occupied' : 'Vacant'}
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
                          <span className="text-sm font-bold text-blue-800">{formatCurrency(realTimeKPIs.currentMonthlyRent)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-bold text-blue-800">
                            {formatCurrency(realTimeKPIs.marketMonthlyRent)}
                          </span>
                        </td>
                      </tr>
                      
                      {/* Other Income Rows */}
                      {(incomeData.length > 0 ? incomeData : otherIncome).map((income: any, index: number) => (
                        <tr key={income.id || index}>
                          <td className="px-4 py-3">
                            {editingIncome ? (
                              <input
                                type="text"
                                value={incomeData[index]?.category || income.category}
                                onChange={(e) => {
                                  const newData = [...incomeData];
                                  if (!newData[index]) newData[index] = { ...income };
                                  newData[index].category = e.target.value;
                                  setIncomeData(newData);
                                }}
                                placeholder="Income category"
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                              />
                            ) : (
                              <span className="text-sm">{incomeData[index]?.category || income.category}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {editingIncome ? (
                              <input
                                type="text"
                                value={incomeData[index]?.description || income.description}
                                onChange={(e) => {
                                  const newData = [...incomeData];
                                  if (!newData[index]) newData[index] = { ...income };
                                  newData[index].description = e.target.value;
                                  setIncomeData(newData);
                                }}
                                placeholder="Description"
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                              />
                            ) : (
                              <span className="text-sm">{incomeData[index]?.description || income.description}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {editingIncome ? (
                              <input
                                type="number"
                                value={incomeData[index]?.monthlyAmount || Number(income.monthlyAmount)}
                                onChange={(e) => {
                                  const newData = [...incomeData];
                                  if (!newData[index]) newData[index] = { ...income };
                                  newData[index].monthlyAmount = Number(e.target.value);
                                  setIncomeData(newData);
                                }}
                                placeholder="Current amount"
                                className="w-24 px-3 py-2 border border-gray-300 rounded text-sm"
                              />
                            ) : (
                              <span className="text-sm font-medium">{formatCurrency(incomeData[index]?.monthlyAmount || Number(income.monthlyAmount))}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {editingIncome ? (
                              <input
                                type="number"
                                value={incomeData[index]?.proformaAmount || incomeData[index]?.monthlyAmount || Number(income.monthlyAmount)}
                                onChange={(e) => {
                                  const newData = [...incomeData];
                                  if (!newData[index]) newData[index] = { ...income };
                                  newData[index].proformaAmount = Number(e.target.value);
                                  setIncomeData(newData);
                                }}
                                placeholder="Proforma amount"
                                className="w-24 px-3 py-2 border border-gray-300 rounded text-sm"
                              />
                            ) : (
                              <span className="text-sm font-medium">{formatCurrency(incomeData[index]?.proformaAmount || incomeData[index]?.monthlyAmount || Number(income.monthlyAmount))}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      
                      {editingIncome && (
                        <tr>
                          <td colSpan={4} className="px-4 py-3">
                            <button 
                              onClick={() => {
                                const newIncome = {
                                  id: Date.now(),
                                  category: 'New Income',
                                  description: '',
                                  monthlyAmount: 0,
                                  proformaAmount: 0
                                };
                                setIncomeData([...incomeData, newIncome]);
                              }}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              + Add Income Item
                            </button>
                          </td>
                        </tr>
                      )}
                      
                      <tr className="bg-green-100 font-bold">
                        <td className="px-4 py-3" colSpan={2}>
                          <span className="text-sm font-bold">Total Income</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-bold text-green-600">
                            {formatCurrency((realTimeKPIs.currentGrossRentalIncome + realTimeKPIs.otherMonthlyIncome * 12) / 12)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-bold text-green-600">
                            {formatCurrency(
                              dealData.units.reduce((sum: number, unit: any) => 
                                sum + Number(unit.marketRent || 1300), 0
                              ) + (realTimeKPIs.otherMonthlyIncome * 12 / 12)
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
                      {(expenseData.length > 0 ? expenseData : expenses).map((expense: any, index: number) => (
                        <tr key={expense.id || index}>
                          <td className="px-4 py-3">
                            {editingExpenses ? (
                              <input
                                type="text"
                                value={expenseData[index]?.category || expense.category}
                                onChange={(e) => {
                                  const newData = [...expenseData];
                                  if (!newData[index]) newData[index] = { ...expense };
                                  newData[index].category = e.target.value;
                                  setExpenseData(newData);
                                }}
                                placeholder="Expense category"
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                              />
                            ) : (
                              <span className="text-sm">{expenseData[index]?.category || expense.category}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {editingExpenses ? (
                              <input
                                type="text"
                                value={expenseData[index]?.description || expense.description}
                                onChange={(e) => {
                                  const newData = [...expenseData];
                                  if (!newData[index]) newData[index] = { ...expense };
                                  newData[index].description = e.target.value;
                                  setExpenseData(newData);
                                }}
                                placeholder="Description"
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                              />
                            ) : (
                              <span className="text-sm">{expenseData[index]?.description || expense.description}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {editingExpenses ? (
                              <input
                                type="number"
                                value={expenseData[index]?.currentAmount || (expense.isPercentOfRent 
                                  ? (realTimeKPIs.currentGrossRentalIncome * parseFloat(expense.percentage) / 12).toFixed(0)
                                  : Number(expense.monthlyAmount)
                                )}
                                onChange={(e) => {
                                  const newData = [...expenseData];
                                  if (!newData[index]) newData[index] = { ...expense };
                                  newData[index].currentAmount = Number(e.target.value);
                                  setExpenseData(newData);
                                }}
                                placeholder="Current amount"
                                className="w-24 px-3 py-2 border border-gray-300 rounded text-sm"
                              />
                            ) : (
                              <span className="text-sm font-medium">
                                {formatCurrency(expenseData[index]?.currentAmount || (expense.isPercentOfRent 
                                  ? (realTimeKPIs.currentGrossRentalIncome * parseFloat(expense.percentage)) / 12
                                  : Number(expense.monthlyAmount))
                                )}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {editingExpenses ? (
                              <input
                                type="number"
                                value={expenseData[index]?.proformaAmount || (expense.isPercentOfRent 
                                  ? (units.reduce((sum: number, unit: any) => 
                                      sum + Number(unit.marketRent || 1300), 0
                                    ) * parseFloat(expense.percentage)).toFixed(0)
                                  : Number(expense.monthlyAmount)
                                )}
                                onChange={(e) => {
                                  const newData = [...expenseData];
                                  if (!newData[index]) newData[index] = { ...expense };
                                  newData[index].proformaAmount = Number(e.target.value);
                                  setExpenseData(newData);
                                }}
                                placeholder="Proforma amount"
                                className="w-24 px-3 py-2 border border-gray-300 rounded text-sm"
                              />
                            ) : (
                              <span className="text-sm font-medium">
                                {formatCurrency(expenseData[index]?.proformaAmount || (expense.isPercentOfRent 
                                  ? units.reduce((sum: number, unit: any) => 
                                      sum + Number(unit.marketRent || 1300), 0
                                    ) * parseFloat(expense.percentage)
                                  : Number(expense.monthlyAmount))
                                )}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {editingExpenses ? (
                              <select
                                value={expenseData[index]?.isPercentOfRent !== undefined 
                                  ? (expenseData[index].isPercentOfRent ? 'percentage' : 'fixed')
                                  : (expense.isPercentOfRent ? 'percentage' : 'fixed')
                                }
                                onChange={(e) => {
                                  const newData = [...expenseData];
                                  if (!newData[index]) newData[index] = { ...expense };
                                  newData[index].isPercentOfRent = e.target.value === 'percentage';
                                  setExpenseData(newData);
                                }}
                                className="px-3 py-2 border border-gray-300 rounded text-sm"
                              >
                                <option value="fixed">Fixed</option>
                                <option value="percentage">% of Rent</option>
                              </select>
                            ) : (
                              <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                                {(expenseData[index]?.isPercentOfRent !== undefined ? expenseData[index].isPercentOfRent : expense.isPercentOfRent) 
                                  ? `${(parseFloat(expense.percentage) * 100).toFixed(1)}%` 
                                  : 'Fixed'
                                }
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                      
                      {editingExpenses && (
                        <tr>
                          <td colSpan={5} className="px-4 py-3">
                            <button 
                              onClick={() => {
                                const newExpense = {
                                  id: Date.now(),
                                  category: 'New Expense',
                                  description: '',
                                  currentAmount: 0,
                                  proformaAmount: 0,
                                  isPercentOfRent: false
                                };
                                setExpenseData([...expenseData, newExpense]);
                              }}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              + Add Expense Item
                            </button>
                          </td>
                        </tr>
                      )}
                      
                      <tr className="bg-red-100 font-bold">
                        <td className="px-4 py-3" colSpan={2}>
                          <span className="text-sm font-bold">Total Expenses</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-bold text-red-600">
                            {formatCurrency(realTimeKPIs.currentMonthlyExpenses * 12 / 12)}
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
                    <div className="text-2xl font-bold text-green-600">{formatCurrency(realTimeKPIs.currentNOI / 12)}</div>
                    <div className="text-sm text-green-600">Monthly</div>
                  </div>
                  <div>
                    <h3 className="font-medium text-blue-800 mb-2">Proforma NOI</h3>
                    <div className="text-2xl font-bold text-blue-600">{formatCurrency(realTimeKPIs.proformaNOI / 12)}</div>
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
                      const monthlyIncome = (realTimeKPIs.currentGrossRentalIncome + realTimeKPIs.otherMonthlyIncome * 12) / 12;
                      const monthlyExpenses = realTimeKPIs.currentMonthlyExpenses * 12 / 12;
                      const monthlyNOI = kpis.netOperatingIncome / 12;
                      const monthlyDebtService = realTimeKPIs.monthlyDebtService;
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
                <button 
                  onClick={() => setEditingRehab(!editingRehab)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    editingRehab 
                      ? 'bg-green-600 text-white hover:bg-green-700' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {editingRehab ? 'Save Changes' : 'Edit Rehab'}
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Per Unit Cost</th>
                      {editingRehab && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(rehabData.length > 0 ? rehabData : rehabItems).map((item: any, index: number) => (
                      <tr key={item.id || index}>
                        <td className="px-4 py-3">
                          {editingRehab ? (
                            <input
                              type="text"
                              value={rehabData[index]?.category || item.category}
                              onChange={(e) => {
                                const newData = [...rehabData];
                                if (!newData[index]) newData[index] = { ...item };
                                newData[index].category = e.target.value;
                                setRehabData(newData);
                              }}
                              placeholder="e.g., Kitchen, HVAC"
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                            />
                          ) : (
                            <span className="text-sm font-medium">{rehabData[index]?.category || item.category}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {editingRehab ? (
                            <input
                              type="text"
                              value={rehabData[index]?.description || item.description}
                              onChange={(e) => {
                                const newData = [...rehabData];
                                if (!newData[index]) newData[index] = { ...item };
                                newData[index].description = e.target.value;
                                setRehabData(newData);
                              }}
                              placeholder="Detailed description"
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                            />
                          ) : (
                            <span className="text-sm">{rehabData[index]?.description || item.description}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {editingRehab ? (
                            <input
                              type="number"
                              value={rehabData[index]?.totalCost || Number(item.totalCost)}
                              onChange={(e) => {
                                const newData = [...rehabData];
                                if (!newData[index]) newData[index] = { ...item };
                                newData[index].totalCost = Number(e.target.value);
                                setRehabData(newData);
                              }}
                              className="w-24 px-3 py-2 border border-gray-300 rounded text-sm"
                            />
                          ) : (
                            <span className="text-sm font-bold">{formatCurrency(rehabData[index]?.totalCost || Number(item.totalCost))}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {editingRehab ? (
                            <select
                              value={rehabData[index]?.bidStatus || item.bidStatus}
                              onChange={(e) => {
                                const newData = [...rehabData];
                                if (!newData[index]) newData[index] = { ...item };
                                newData[index].bidStatus = e.target.value;
                                setRehabData(newData);
                              }}
                              className="px-3 py-2 border border-gray-300 rounded text-sm"
                            >
                              <option value="estimated">Estimated</option>
                              <option value="bid_received">Bid Received</option>
                              <option value="contracted">Contracted</option>
                              <option value="completed">Completed</option>
                            </select>
                          ) : (
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              (rehabData[index]?.bidStatus || item.bidStatus) === 'contracted' ? 'bg-green-100 text-green-800' :
                              (rehabData[index]?.bidStatus || item.bidStatus) === 'bid_received' ? 'bg-blue-100 text-blue-800' :
                              (rehabData[index]?.bidStatus || item.bidStatus) === 'completed' ? 'bg-purple-100 text-purple-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {(rehabData[index]?.bidStatus || item.bidStatus).replace('_', ' ').toUpperCase()}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600">
                            {formatCurrency((rehabData[index]?.totalCost || Number(item.totalCost)) / (assumptions.units || deal.units))}
                          </span>
                        </td>
                        {editingRehab && (
                          <td className="px-4 py-3">
                            <button 
                              onClick={() => {
                                const newData = rehabData.filter((_, i) => i !== index);
                                setRehabData(newData);
                              }}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Delete
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                    
                    {editingRehab && (
                      <tr>
                        <td colSpan={editingRehab ? 6 : 5} className="px-4 py-3">
                          <button 
                            onClick={() => {
                              const newItem = {
                                id: Date.now(),
                                category: 'New Item',
                                description: '',
                                totalCost: 0,
                                bidStatus: 'estimated'
                              };
                              setRehabData([...rehabData, newItem]);
                            }}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            + Add Rehab Item
                          </button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                
                {editingRehab && (
                  <div className="mt-4">
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
                      + Add Rehab Item
                    </button>
                  </div>
                )}
              </div>
              
              {/* Rehab Summary */}
              <div className="border-t-2 border-gray-300 pt-4 mt-6">
                <div className="grid grid-cols-3 gap-6">
                  <div className="bg-blue-50 p-4 rounded">
                    <h3 className="font-medium text-blue-800">Total Rehab Budget</h3>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(realTimeKPIs.totalRehab)}</p>
                    <p className="text-sm text-blue-600">{formatCurrency(realTimeKPIs.totalRehab / (assumptions.units || deal.units))} per unit</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded">
                    <h3 className="font-medium text-green-800">Contracted</h3>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency((rehabData.length > 0 ? rehabData : rehabItems)
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
          )}

          {/* Loans Tab */}
          {activeTab === 'loans' && (
            <div className="space-y-6">
              {/* Acquisition Loan */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Acquisition Loan</h2>
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
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lender</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loan Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate (%)</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Term (Years)</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amortization</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monthly Payment</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(loanData.length > 0 ? loanData.filter((loan: any) => loan.loanType === 'acquisition') : loans.filter((loan: any) => loan.loanType === 'acquisition')).map((loan: any, index: number) => (
                        <tr key={index}>
                          <td className="px-4 py-3">
                            {editingLoans ? (
                              <input
                                type="text"
                                value={loanData.find((l: any) => l.loanType === 'acquisition')?.lenderName || "Local Bank"}
                                onChange={(e) => {
                                  const newData = [...loanData];
                                  const loanIndex = newData.findIndex((l: any) => l.loanType === 'acquisition');
                                  if (loanIndex >= 0) {
                                    newData[loanIndex].lenderName = e.target.value;
                                  } else {
                                    newData.push({ ...loan, lenderName: e.target.value });
                                  }
                                  setLoanData(newData);
                                }}
                                placeholder="Lender name"
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                              />
                            ) : (
                              <span className="text-sm font-medium">{loanData.find((l: any) => l.loanType === 'acquisition')?.lenderName || "Local Bank"}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {editingLoans ? (
                              <input
                                type="number"
                                value={loanData.find((l: any) => l.loanType === 'acquisition')?.loanAmount || realTimeKPIs.loanAmount}
                                onChange={(e) => {
                                  const newData = [...loanData];
                                  const loanIndex = newData.findIndex((l: any) => l.loanType === 'acquisition');
                                  if (loanIndex >= 0) {
                                    newData[loanIndex].loanAmount = Number(e.target.value);
                                  } else {
                                    newData.push({ ...loan, loanAmount: Number(e.target.value) });
                                  }
                                  setLoanData(newData);
                                }}
                                className="w-24 px-3 py-2 border border-gray-300 rounded text-sm"
                              />
                            ) : (
                              <span className="text-sm font-bold">{formatCurrency(loanData.find((l: any) => l.loanType === 'acquisition')?.loanAmount || realTimeKPIs.loanAmount)}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {editingLoans ? (
                              <input
                                type="number"
                                step="0.001"
                                value={loanData.find((l: any) => l.loanType === 'acquisition')?.interestRate ? (Number(loanData.find((l: any) => l.loanType === 'acquisition').interestRate) * 100).toFixed(3) : (Number(loan.interestRate) * 100).toFixed(3)}
                                onChange={(e) => {
                                  const newData = [...loanData];
                                  const loanIndex = newData.findIndex((l: any) => l.loanType === 'acquisition');
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
                              <span className="text-sm">{loanData.find((l: any) => l.loanType === 'acquisition')?.interestRate ? (Number(loanData.find((l: any) => l.loanType === 'acquisition').interestRate) * 100).toFixed(3) : (Number(loan.interestRate) * 100).toFixed(3)}%</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {editingLoans ? (
                              <input
                                type="number"
                                value={loanData.find((l: any) => l.loanType === 'acquisition')?.termYears || loan.termYears}
                                onChange={(e) => {
                                  const newData = [...loanData];
                                  const loanIndex = newData.findIndex((l: any) => l.loanType === 'acquisition');
                                  if (loanIndex >= 0) {
                                    newData[loanIndex].termYears = Number(e.target.value);
                                  } else {
                                    newData.push({ ...loan, termYears: Number(e.target.value) });
                                  }
                                  setLoanData(newData);
                                }}
                                className="w-16 px-3 py-2 border border-gray-300 rounded text-sm"
                              />
                            ) : (
                              <span className="text-sm">{loanData.find((l: any) => l.loanType === 'acquisition')?.termYears || loan.termYears}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {editingLoans ? (
                              <input
                                type="number"
                                value={loanData.find((l: any) => l.loanType === 'acquisition')?.amortizationYears || loan.amortizationYears}
                                onChange={(e) => {
                                  const newData = [...loanData];
                                  const loanIndex = newData.findIndex((l: any) => l.loanType === 'acquisition');
                                  if (loanIndex >= 0) {
                                    newData[loanIndex].amortizationYears = Number(e.target.value);
                                  } else {
                                    newData.push({ ...loan, amortizationYears: Number(e.target.value) });
                                  }
                                  setLoanData(newData);
                                }}
                                className="w-16 px-3 py-2 border border-gray-300 rounded text-sm"
                              />
                            ) : (
                              <span className="text-sm">{loanData.find((l: any) => l.loanType === 'acquisition')?.amortizationYears || loan.amortizationYears}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-medium">{formatCurrency(realTimeKPIs.monthlyDebtService)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Refinance Loan */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Refinance Loan (Exit Strategy)</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lender</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loan Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate (%)</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Term (Years)</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">LTV (%)</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cash Out</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-4 py-3">
                          {editingLoans ? (
                            <input
                              type="text"
                              value={loanData.find((l: any) => l.loanType === 'refinance')?.lenderName || "Permanent Lender"}
                              onChange={(e) => {
                                const newData = [...loanData];
                                const loanIndex = newData.findIndex((l: any) => l.loanType === 'refinance');
                                if (loanIndex >= 0) {
                                  newData[loanIndex].lenderName = e.target.value;
                                } else {
                                  newData.push({ loanType: 'refinance', lenderName: e.target.value });
                                }
                                setLoanData(newData);
                              }}
                              placeholder="Lender name"
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                            />
                          ) : (
                            <span className="text-sm font-medium">{loanData.find((l: any) => l.loanType === 'refinance')?.lenderName || "Permanent Lender"}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {editingLoans ? (
                            <input
                              type="number"
                              value={loanData.find((l: any) => l.loanType === 'refinance')?.loanAmount || realTimeKPIs.refinanceLoanAmount}
                              onChange={(e) => {
                                const newData = [...loanData];
                                const loanIndex = newData.findIndex((l: any) => l.loanType === 'refinance');
                                if (loanIndex >= 0) {
                                  newData[loanIndex].loanAmount = Number(e.target.value);
                                } else {
                                  newData.push({ loanType: 'refinance', loanAmount: Number(e.target.value) });
                                }
                                setLoanData(newData);
                              }}
                              className="w-24 px-3 py-2 border border-gray-300 rounded text-sm"
                            />
                          ) : (
                            <span className="text-sm font-bold">{formatCurrency(loanData.find((l: any) => l.loanType === 'refinance')?.loanAmount || realTimeKPIs.refinanceLoanAmount)}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {editingLoans ? (
                            <input
                              type="number"
                              step="0.001"
                              value={loanData.find((l: any) => l.loanType === 'refinance')?.interestRate ? (Number(loanData.find((l: any) => l.loanType === 'refinance').interestRate) * 100).toFixed(3) : "5.500"}
                              onChange={(e) => {
                                const newData = [...loanData];
                                const loanIndex = newData.findIndex((l: any) => l.loanType === 'refinance');
                                if (loanIndex >= 0) {
                                  newData[loanIndex].interestRate = Number(e.target.value) / 100;
                                } else {
                                  newData.push({ loanType: 'refinance', interestRate: Number(e.target.value) / 100 });
                                }
                                setLoanData(newData);
                              }}
                              className="w-20 px-3 py-2 border border-gray-300 rounded text-sm"
                            />
                          ) : (
                            <span className="text-sm">{loanData.find((l: any) => l.loanType === 'refinance')?.interestRate ? (Number(loanData.find((l: any) => l.loanType === 'refinance').interestRate) * 100).toFixed(3) : "5.500"}%</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {editingLoans ? (
                            <input
                              type="number"
                              value={loanData.find((l: any) => l.loanType === 'refinance')?.termYears || 30}
                              onChange={(e) => {
                                const newData = [...loanData];
                                const loanIndex = newData.findIndex((l: any) => l.loanType === 'refinance');
                                if (loanIndex >= 0) {
                                  newData[loanIndex].termYears = Number(e.target.value);
                                } else {
                                  newData.push({ loanType: 'refinance', termYears: Number(e.target.value) });
                                }
                                setLoanData(newData);
                              }}
                              className="w-16 px-3 py-2 border border-gray-300 rounded text-sm"
                            />
                          ) : (
                            <span className="text-sm">{loanData.find((l: any) => l.loanType === 'refinance')?.termYears || 30}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {editingLoans ? (
                            <input
                              type="number"
                              step="0.1"
                              value={loanData.find((l: any) => l.loanType === 'refinance')?.ltv ? (loanData.find((l: any) => l.loanType === 'refinance').ltv * 100).toFixed(1) : ((assumptions.refinanceLtv * 100) || 75)}
                              onChange={(e) => {
                                const newData = [...loanData];
                                const loanIndex = newData.findIndex((l: any) => l.loanType === 'refinance');
                                if (loanIndex >= 0) {
                                  newData[loanIndex].ltv = Number(e.target.value) / 100;
                                } else {
                                  newData.push({ loanType: 'refinance', ltv: Number(e.target.value) / 100 });
                                }
                                setLoanData(newData);
                              }}
                              className="w-16 px-3 py-2 border border-gray-300 rounded text-sm"
                            />
                          ) : (
                            <span className="text-sm">{loanData.find((l: any) => l.loanType === 'refinance')?.ltv ? (loanData.find((l: any) => l.loanType === 'refinance').ltv * 100).toFixed(1) : ((assumptions.refinanceLtv * 100) || 75).toFixed(1)}%</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-bold text-green-600">{formatCurrency(realTimeKPIs.cashOut)}</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Loan Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Loan Summary & Metrics</h2>
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded shadow-sm">
                    <h3 className="font-medium text-gray-800">Down Payment</h3>
                    <p className="text-xl font-bold text-blue-600">{formatCurrency(realTimeKPIs.downPayment)}</p>
                    <p className="text-sm text-gray-600">{((realTimeKPIs.downPayment / (assumptions.purchasePrice || deal.purchasePrice)) * 100).toFixed(1)}% of purchase</p>
                  </div>
                  <div className="bg-white p-4 rounded shadow-sm">
                    <h3 className="font-medium text-gray-800">Monthly Debt Service</h3>
                    <p className="text-xl font-bold text-blue-600">{formatCurrency(realTimeKPIs.monthlyDebtService)}</p>
                    <p className="text-sm text-gray-600">Acquisition loan</p>
                  </div>
                  <div className="bg-white p-4 rounded shadow-sm">
                    <h3 className="font-medium text-gray-800">DSCR</h3>
                    <p className={`text-xl font-bold ${
                      (realTimeKPIs.dscr || 0) >= 1.25 ? "text-green-600" : 
                      (realTimeKPIs.dscr || 0) >= 1.15 ? "text-yellow-600" : "text-red-600"
                    }`}>
                      {(realTimeKPIs.dscr || 0).toFixed(2)}x
                    </p>
                    <p className="text-sm text-gray-600">Debt coverage ratio</p>
                  </div>
                  <div className="bg-white p-4 rounded shadow-sm">
                    <h3 className="font-medium text-gray-800">Total Profit</h3>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(realTimeKPIs.totalProfit)}</p>
                    <p className="text-sm text-gray-600">From refinance</p>
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
                    <p className="text-lg font-semibold">{formatCurrency(realTimeKPIs.arv)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">All-In Cost</label>
                    <p className="text-lg font-semibold">{formatCurrency(realTimeKPIs.allInCost)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Cash Flow</label>
                    <p className={`text-lg font-semibold ${
                      (realTimeKPIs.currentCashFlow || 0) > 0 ? "text-green-600" : "text-red-600"
                    }`}>
                      {formatCurrency(realTimeKPIs.currentCashFlow)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Cash-on-Cash</label>
                    <p className={`text-lg font-semibold ${
                      (realTimeKPIs.cashOnCashReturn || 0) > 0.12 ? "text-green-600" : 
                      (realTimeKPIs.cashOnCashReturn || 0) > 0.08 ? "text-yellow-600" : "text-red-600"
                    }`}>
                      {formatPercent(realTimeKPIs.cashOnCashReturn)}
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
                    (realTimeKPIs.irr || 0) > 0.15 ? "text-green-600" : 
                    (realTimeKPIs.irr || 0) > 0.10 ? "text-yellow-600" : "text-red-600"
                  }`}>
                    {formatPercent(realTimeKPIs.irr)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Equity Multiple</span>
                  <span className="font-semibold">{(realTimeKPIs.equityMultiple || 0).toFixed(2)}x</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Cap Rate</span>
                  <span className="font-semibold">{formatPercent(realTimeKPIs.capRate)}</span>
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
                      (realTimeKPIs.dscr || 0) >= 1.25 ? "text-green-600" : 
                      (realTimeKPIs.dscr || 0) >= 1.15 ? "text-yellow-600" : "text-red-600"
                    }`}>
                      {(realTimeKPIs.dscr || 0).toFixed(2)}x
                    </span>
                    {(realTimeKPIs.dscr || 0) >= 1.25 ? (
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
                    {formatCurrency(realTimeKPIs.refinanceLoanAmount)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Cash Out</span>
                  <span className={`font-semibold ${
                    (realTimeKPIs.cashOut || 0) > 0 ? "text-green-600" : "text-gray-600"
                  }`}>
                    {formatCurrency(realTimeKPIs.cashOut)}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t pt-3">
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
      </div>
    </div>
  );
}