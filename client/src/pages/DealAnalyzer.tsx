import React, { useState, useEffect } from 'react';
import { Building, Users, Wrench, Calculator, DollarSign, Calendar, AlertTriangle, TrendingUp, Home, Target, BarChart3, Save, Download, Upload, FileDown, Database, X, Trash2 } from 'lucide-react';
import AddressAutocomplete from '../components/AddressAutocomplete';
import { MarketRatesWidget } from '../components/MarketRatesWidget';
import CensusDemographicsWidget from '../components/CensusDemographicsWidget';
import { AddressComponents } from '../services/googlePlaces';

// Load saved state function
const loadSavedState = (key: string, defaultValue: any) => {
  try {
    const saved = localStorage.getItem(`dealAnalyzer_${key}`);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
    return defaultValue;
  }
};

export default function DealAnalyzer() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [dealData, setDealData] = useState<any>(null);
  const [editingProperty, setEditingProperty] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);
  const [propertyName, setPropertyName] = useState(() => loadSavedState('propertyName', 'Maple Street Apartments'));
  const [propertyAddress, setPropertyAddress] = useState(() => loadSavedState('propertyAddress', '123 Maple Street, Hartford, CT 06106'));
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [savedDeals, setSavedDeals] = useState<any[]>([]);
  const [editingExpenses, setEditingExpenses] = useState(false);
  const [editingClosingCosts, setEditingClosingCosts] = useState(false);
  const [editingHoldingCosts, setEditingHoldingCosts] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importingToProperties, setImportingToProperties] = useState(false);
  const [importFormData, setImportFormData] = useState({
    entity: '5Central Capital',
    acquisitionDate: '',
    broker: '',
    legalNotes: '',
    closingTimeline: ''
  });
  const [editingRehabSections, setEditingRehabSections] = useState({
    exterior: false,
    kitchens: false,
    bathrooms: false,
    generalInterior: false,
    finishings: false
  });

  // Exit analysis state
  const [exitAnalysis, setExitAnalysis] = useState(() => loadSavedState('exitAnalysis', {
    saleFactor: 0.055, // Sales cap rate (5.5%) for NOI / Cap Rate calculation
    saleCostsPercent: 0.06, // 6% for broker, legal, closing fees
    holdPeriodYears: 2,
    annualAppreciationRate: 0.03 // 3% annual appreciation rate
  }));
  
  // Editable assumptions state
  const [assumptions, setAssumptions] = useState(() => loadSavedState('assumptions', {
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
  }));

  // Closing costs breakdown
  const [closingCosts, setClosingCosts] = useState<{ [key: string]: number }>(() => loadSavedState('closingCosts', {
    titleInsurance: 4500,
    appraisalFee: 800,
    legalFees: 2500,
    transferTax: 8000,
    miscellaneous: 2200,
    sellerCredit: -5000
  }));

  const [closingCostNames, setClosingCostNames] = useState<{ [key: string]: string }>(() => loadSavedState('closingCostNames', {
    titleInsurance: 'Title Insurance',
    appraisalFee: 'Appraisal Fee',
    legalFees: 'Legal Fees',
    transferTax: 'Transfer Tax',
    miscellaneous: 'Miscellaneous',
    sellerCredit: 'Seller Credit'
  }));

  // Holding costs breakdown
  const [holdingCosts, setHoldingCosts] = useState<{ [key: string]: number }>(() => loadSavedState('holdingCosts', {
    electric: 2400,
    water: 1800,
    gas: 1200,
    interest: 9600,
    title: 3000
  }));

  const [holdingCostNames, setHoldingCostNames] = useState<{ [key: string]: string }>(() => loadSavedState('holdingCostNames', {
    electric: 'Electric',
    water: 'Water',
    gas: 'Gas',
    interest: 'Interest',
    title: 'Title'
  }));

  // Unit types with market rents
  const [unitTypes, setUnitTypes] = useState(() => loadSavedState('unitTypes', [
    { id: 1, name: '2BR/1BA', marketRent: 1450 },
    { id: 2, name: '3BR/1BA', marketRent: 1650 },
    { id: 3, name: '1BR/1BA', marketRent: 1200 },
    { id: 4, name: '2BR/2BA', marketRent: 1550 }
  ]));

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

  const [rentRoll, setRentRoll] = useState(() => {
    const saved = loadSavedState('rentRoll', null);
    return saved || generateRentRoll(assumptions.unitCount);
  });

  // Structured rehab budget matching the provided format
  const [rehabBudgetSections, setRehabBudgetSections] = useState(() => loadSavedState('rehabBudgetSections', {
    exterior: [
      { id: 1, category: 'Demolition', perUnitCost: 1500, quantity: 1, totalCost: 15000, completed: false },
      { id: 2, category: 'Permits', perUnitCost: 500, quantity: 1, totalCost: 5000, completed: false },
      { id: 3, category: 'Windows', perUnitCost: 3750, quantity: 8, totalCost: 30000, completed: false },
      { id: 4, category: 'Landscaping', perUnitCost: 500, quantity: 1, totalCost: 5000, completed: false },
    ],
    generalInterior: [
      { id: 1, category: 'Exterior Doors', perUnitCost: 1250, quantity: 1, totalCost: 12500, completed: false },
      { id: 2, category: 'Framing', perUnitCost: 500, quantity: 1, totalCost: 5000, completed: false },
      { id: 3, category: 'Drywall', perUnitCost: 3500, quantity: 1, totalCost: 35000, completed: false },
      { id: 4, category: 'Insulation', perUnitCost: 1250, quantity: 1, totalCost: 12500, completed: false },
      { id: 5, category: 'Hot Water Heater', perUnitCost: 800, quantity: 1, totalCost: 8000, completed: false },
      { id: 6, category: 'Plumbing', perUnitCost: 1500, quantity: 1, totalCost: 15000, completed: false },
      { id: 7, category: 'Electric panels', perUnitCost: 2000, quantity: 1, totalCost: 8000, completed: false },
      { id: 8, category: 'Electrical wiring', perUnitCost: 1000, quantity: 1, totalCost: 10000, completed: false },
      { id: 9, category: 'Mini split', perUnitCost: 2000, quantity: 1, totalCost: 20000, completed: false },
      { id: 10, category: 'Paint', perUnitCost: 1000, quantity: 1, totalCost: 10000, completed: false },
      { id: 11, category: 'Interior door', perUnitCost: 500, quantity: 1, totalCost: 5000, completed: false },
      { id: 12, category: 'Flooring', perUnitCost: 2612.50, quantity: 1, totalCost: 26125, completed: false },
    ],
    kitchens: [
      { id: 1, category: 'Cabinets', perUnitCost: 2250, quantity: 1, totalCost: 22500, completed: false },
      { id: 2, category: 'Counter', perUnitCost: 750, quantity: 1, totalCost: 7500, completed: false },
      { id: 3, category: 'Sink + faucet', perUnitCost: 500, quantity: 1, totalCost: 5000, completed: false },
      { id: 4, category: 'Appliances', perUnitCost: 1000, quantity: 1, totalCost: 10000, completed: false },
    ],
    bathrooms: [
      { id: 1, category: 'Toilet', perUnitCost: 350, quantity: 1, totalCost: 3500, completed: false },
      { id: 2, category: 'Vanity/Mirror', perUnitCost: 650, quantity: 1, totalCost: 6500, completed: false },
      { id: 3, category: 'Shower', perUnitCost: 1000, quantity: 1, totalCost: 10000, completed: false },
      { id: 4, category: 'Tile', perUnitCost: 1250, quantity: 1, totalCost: 12500, completed: false },
      { id: 5, category: 'Lighting', perUnitCost: 100, quantity: 1, totalCost: 1000, completed: false },
    ],
    finishings: [
      { id: 1, category: 'Fixtures', perUnitCost: 200, quantity: 1, totalCost: 2000, completed: false },
      { id: 2, category: 'Lights', perUnitCost: 500, quantity: 1, totalCost: 5000, completed: false },
      { id: 3, category: 'Blinds, Doorknobs', perUnitCost: 650, quantity: 1, totalCost: 6500, completed: false },
    ]
  }));

  // Expense breakdown with names
  const [expenses, setExpenses] = useState<{ [key: string]: number }>(() => loadSavedState('expenses', {
    propertyTax: 18000,
    insurance: 8500,
    maintenance: 12000,
    managementFee: 0, // Will be calculated as percentage
    waterSewerTrash: 6000,
    capitalReserves: 4800,
    utilities: 3600,
    other: 2400
  }));

  const [expenseNames, setExpenseNames] = useState<{ [key: string]: string }>(() => loadSavedState('expenseNames', {
    propertyTax: 'Property Tax',
    insurance: 'Insurance',
    maintenance: 'Maintenance',
    waterSewerTrash: 'Water/Sewer/Trash',
    capitalReserves: 'Capital Reserves',
    utilities: 'Utilities',
    other: 'Other'
  }));

  // Workflow timeline state - integrated with budget sections
  const [workflowSteps, setWorkflowSteps] = useState(() => loadSavedState('workflowSteps', [
    { id: 1, step: 'Close on property', status: 'completed', budgetCategory: null, notes: 'Property acquired', unitsCompleted: 0 },
    { id: 2, step: 'Eviction current tenants', status: 'in-progress', budgetCategory: null, notes: 'Legal process in progress', unitsCompleted: 0 },
    { id: 3, step: 'Permits & Inspections', status: 'pending', budgetCategory: 'exterior', budgetItem: 'Permits', notes: 'City permits required', unitsCompleted: 0 },
    { id: 4, step: 'Demolition', status: 'pending', budgetCategory: 'exterior', budgetItem: 'Demolition', notes: 'Remove existing fixtures', unitsCompleted: 0 },
    { id: 5, step: 'Electrical & Plumbing Rough', status: 'pending', budgetCategory: 'generalInterior', budgetItem: 'Electrical wiring', notes: 'Rough electrical and plumbing', unitsCompleted: 0 },
    { id: 6, step: 'Drywall Installation', status: 'pending', budgetCategory: 'generalInterior', budgetItem: 'Drywall', notes: 'Hang and finish drywall', unitsCompleted: 0 },
    { id: 7, step: 'Kitchen Renovation', status: 'pending', budgetCategory: 'kitchens', budgetItem: 'Cabinets', notes: 'Complete kitchen remodel', unitsCompleted: 0 },
    { id: 8, step: 'Bathroom Renovation', status: 'pending', budgetCategory: 'bathrooms', budgetItem: 'Vanity', notes: 'Complete bathroom remodel', unitsCompleted: 0 },
    { id: 9, step: 'Flooring Installation', status: 'pending', budgetCategory: 'generalInterior', budgetItem: 'Flooring', notes: 'Install new flooring throughout', unitsCompleted: 0 },
    { id: 10, step: 'Paint & Finishings', status: 'pending', budgetCategory: 'finishings', budgetItem: 'Paint', notes: 'Interior painting and trim', unitsCompleted: 0 },
    { id: 11, step: 'HVAC Installation', status: 'pending', budgetCategory: 'generalInterior', budgetItem: 'Mini split', notes: 'Install heating and cooling', unitsCompleted: 0 },
    { id: 12, step: 'Final Inspections', status: 'pending', budgetCategory: null, notes: 'City final inspections', unitsCompleted: 0 },
    { id: 13, step: 'List for rent', status: 'pending', budgetCategory: null, notes: 'Market ready units', unitsCompleted: 0 },
    { id: 14, step: 'Refinance property', status: 'pending', budgetCategory: null, notes: 'Permanent financing', unitsCompleted: 0 }
  ]));

  const [editingWorkflow, setEditingWorkflow] = useState(false);

  // Auto-save functionality - save state changes to localStorage
  useEffect(() => {
    localStorage.setItem('dealAnalyzer_propertyName', propertyName);
  }, [propertyName]);

  useEffect(() => {
    localStorage.setItem('dealAnalyzer_propertyAddress', propertyAddress);
  }, [propertyAddress]);

  useEffect(() => {
    localStorage.setItem('dealAnalyzer_exitAnalysis', JSON.stringify(exitAnalysis));
  }, [exitAnalysis]);

  useEffect(() => {
    localStorage.setItem('dealAnalyzer_assumptions', JSON.stringify(assumptions));
  }, [assumptions]);

  useEffect(() => {
    localStorage.setItem('dealAnalyzer_closingCosts', JSON.stringify(closingCosts));
  }, [closingCosts]);

  useEffect(() => {
    localStorage.setItem('dealAnalyzer_closingCostNames', JSON.stringify(closingCostNames));
  }, [closingCostNames]);

  useEffect(() => {
    localStorage.setItem('dealAnalyzer_holdingCosts', JSON.stringify(holdingCosts));
  }, [holdingCosts]);

  useEffect(() => {
    localStorage.setItem('dealAnalyzer_holdingCostNames', JSON.stringify(holdingCostNames));
  }, [holdingCostNames]);

  useEffect(() => {
    localStorage.setItem('dealAnalyzer_unitTypes', JSON.stringify(unitTypes));
  }, [unitTypes]);

  useEffect(() => {
    localStorage.setItem('dealAnalyzer_rentRoll', JSON.stringify(rentRoll));
  }, [rentRoll]);

  useEffect(() => {
    localStorage.setItem('dealAnalyzer_rehabBudgetSections', JSON.stringify(rehabBudgetSections));
  }, [rehabBudgetSections]);

  useEffect(() => {
    localStorage.setItem('dealAnalyzer_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('dealAnalyzer_expenseNames', JSON.stringify(expenseNames));
  }, [expenseNames]);

  useEffect(() => {
    localStorage.setItem('dealAnalyzer_workflowSteps', JSON.stringify(workflowSteps));
  }, [workflowSteps]);

  // Function to clear all saved Deal Analyzer data
  const clearAllSavedData = () => {
    const keys = [
      'dealAnalyzer_propertyName',
      'dealAnalyzer_propertyAddress',
      'dealAnalyzer_exitAnalysis',
      'dealAnalyzer_assumptions',
      'dealAnalyzer_closingCosts',
      'dealAnalyzer_closingCostNames',
      'dealAnalyzer_holdingCosts',
      'dealAnalyzer_holdingCostNames',
      'dealAnalyzer_unitTypes',
      'dealAnalyzer_rentRoll',
      'dealAnalyzer_rehabBudgetSections',
      'dealAnalyzer_expenses',
      'dealAnalyzer_expenseNames',
      'dealAnalyzer_workflowSteps'
    ];
    
    keys.forEach(key => localStorage.removeItem(key));
    
    // Optionally reload the page to reset to defaults
    if (confirm('Clear all Deal Analyzer data? This will reset all entries to default values.')) {
      window.location.reload();
    }
  };

  // Function to update budget item completion when workflow step is marked complete
  const updateBudgetFromWorkflow = (stepId: number, status: string) => {
    const step = workflowSteps.find(s => s.id === stepId);
    if (step && step.budgetCategory && step.budgetItem && status === 'completed') {
      // Find and update the corresponding budget item
      setRehabBudgetSections(prev => {
        const updated = { ...prev };
        if (updated[step.budgetCategory as keyof typeof updated]) {
          updated[step.budgetCategory as keyof typeof updated] = updated[step.budgetCategory as keyof typeof updated].map(item => {
            if (item.category === step.budgetItem) {
              return { ...item, completed: true };
            }
            return item;
          });
        }
        return updated;
      });
    }
  };

  // Function to get budget item completion status
  const getBudgetItemStatus = (budgetCategory: string | null, budgetItem: string | null | undefined) => {
    if (!budgetCategory || !budgetItem) return null;
    
    const section = rehabBudgetSections[budgetCategory as keyof typeof rehabBudgetSections];
    if (!section) return null;
    
    const item = section.find(item => item.category === budgetItem);
    return item?.completed || false;
  };

  // Function to calculate overall progress for each budget category
  const getCategoryProgress = (category: string) => {
    const section = rehabBudgetSections[category as keyof typeof rehabBudgetSections];
    if (!section || section.length === 0) return 0;
    
    const completedItems = section.filter(item => item.completed || false).length;
    return Math.round((completedItems / section.length) * 100);
  };

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setDealData({ loaded: true });
      setLoading(false);
    }, 1000);
  }, []);

  // Calculation functions
  const calculateMetrics = () => {
    const exteriorTotal = (rehabBudgetSections?.exterior || []).reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0);
    const generalInteriorTotal = (rehabBudgetSections?.generalInterior || []).reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0);
    const kitchensTotal = (rehabBudgetSections?.kitchens || []).reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0);
    const bathroomsTotal = (rehabBudgetSections?.bathrooms || []).reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0);
    const finishingsTotal = (rehabBudgetSections?.finishings || []).reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0);
    
    const rehabSubtotal = exteriorTotal + generalInteriorTotal + kitchensTotal + bathroomsTotal + finishingsTotal;
    // Use contingency rate from assumptions or default to 10%
    const contingencyRate = assumptions.contingencyRate || 0.10;
    const contingency = rehabSubtotal * contingencyRate;
    const totalRehab = rehabSubtotal + contingency;
    const totalClosingCosts = Object.values(closingCosts || {}).reduce((sum, cost) => sum + (Number(cost) || 0), 0);
    const totalHoldingCosts = Object.values(holdingCosts || {}).reduce((sum, cost) => sum + (Number(cost) || 0), 0);
    
    // Updated loan calculations: loan percentage of (purchase price + total rehab cost)
    const initialLoan = (assumptions.purchasePrice + totalRehab) * assumptions.loanPercentage;
    const downPayment = assumptions.purchasePrice - (assumptions.purchasePrice * assumptions.loanPercentage);
    
    // Capital required = down payment + total closing costs
    const capitalRequired = downPayment + totalClosingCosts;
    
    // Total cash invested = capital required + holding costs
    const totalCashInvested = capitalRequired + totalHoldingCosts;
    const allInCost = assumptions.purchasePrice + totalRehab + totalClosingCosts + totalHoldingCosts;
    
    // Revenue calculations
    const grossRent = (rentRoll || []).reduce((sum, unit) => {
      const unitType = (unitTypes || []).find(ut => ut.id === unit.unitTypeId);
      return sum + (unitType ? unitType.marketRent : unit.proFormaRent);
    }, 0) * 12;
    const vacancyLoss = grossRent * assumptions.vacancyRate;
    const netRevenue = grossRent - vacancyLoss;
    
    // Expense calculations - use management fee from assumptions
    const managementFeeRate = assumptions.managementFee || 0;
    const managementFee = netRevenue * managementFeeRate;
    const totalExpenses = Object.values(expenses).reduce((sum, exp) => sum + exp, 0) + managementFee;
    const noi = netRevenue - totalExpenses;
    
    // ARV and refinance calculations
    const arv = noi > 0 && assumptions.marketCapRate > 0 ? noi / assumptions.marketCapRate : assumptions.purchasePrice;
    // Refinance loan = (editable LTV) * ARV
    const refinanceLoan = arv * assumptions.refinanceLTV;
    const refinanceClosingCosts = refinanceLoan * assumptions.refinanceClosingCostPercent;
    const cashOut = Math.max(0, refinanceLoan - initialLoan - refinanceClosingCosts);
    
    // Post-refi debt service (using refinance interest rate assumption)
    const refiRate = assumptions.refinanceInterestRate / 12;
    const refiTermYears = assumptions.refinanceTermYears || assumptions.loanTermYears || 0;
    const refiPayments = refiTermYears * 12;
    const monthlyDebtService = refiPayments > 0 && refiRate > 0 
      ? refinanceLoan * (refiRate * Math.pow(1 + refiRate, refiPayments)) / (Math.pow(1 + refiRate, refiPayments) - 1)
      : 0;
    const annualDebtService = monthlyDebtService * 12;
    const netCashFlow = noi - annualDebtService;
    
    // Return calculations
    const dscr = annualDebtService > 0 ? noi / annualDebtService : 0;
    const actualEquityInvested = totalCashInvested - cashOut; // Net equity after refinance cash-out
    const cashOnCashReturn = actualEquityInvested > 0 ? netCashFlow / actualEquityInvested : 0;
    
    // Equity Multiple = Current Equity Value / Total Invested Capital
    const currentLoanBalance = refinanceLoan; // Use refinance loan as current balance
    const currentEquityValue = arv - currentLoanBalance;
    const equityMultiple = capitalRequired > 0 ? currentEquityValue / capitalRequired : 0;
    
    const breakEvenOccupancy = grossRent > 0 ? (totalExpenses + annualDebtService) / grossRent : 1;
    const totalProfit = arv - allInCost;
    
    // Exit analysis calculations - Sales Cap Rate approach
    const salePrice = noi > 0 && exitAnalysis.saleFactor > 0 ? noi / exitAnalysis.saleFactor : arv;
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

  // Helper function to validate and format number input - 1 decimal for rehab (allows negative values)
  const validateNumberInput = (value: string): string => {
    // Allow negative sign, numbers, and decimal point
    return value;
  };

  // Helper function for closing costs - allows negative numbers for seller credits
  const validateClosingCostInput = (value: string): string => {
    return value;
  };

  // Helper function for overview fields - 2 decimal places (allows negative values)
  const validateOverviewNumberInput = (value: string): string => {
    return value;
  };

  const updateRehabItem = (section: string, itemId: number, field: string, value: number | string) => {
    let processedValue = value;
    
    // Validate numeric fields
    if (field === 'perUnitCost' || field === 'quantity') {
      processedValue = field === 'perUnitCost' ? validateNumberInput(String(value)) : String(value).replace(/[^0-9]/g, '');
    }
    
    setRehabBudgetSections(prev => ({
      ...prev,
      [section]: prev[section as keyof typeof prev].map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: processedValue };
          // Automatically calculate totalCost when perUnitCost or quantity changes
          if (field === 'perUnitCost' || field === 'quantity') {
            updatedItem.totalCost = (Number(updatedItem.perUnitCost) || 0) * (Number(updatedItem.quantity) || 0);
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

  // Load saved deals from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem('dealAnalyzerDeals');
    if (saved) {
      setSavedDeals(JSON.parse(saved));
    }
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

  // Delete a saved deal
  const deleteDeal = (dealId: number) => {
    const updatedDeals = savedDeals.filter(deal => deal.id !== dealId);
    localStorage.setItem('dealAnalyzerDeals', JSON.stringify(updatedDeals));
    setSavedDeals(updatedDeals);
  };

  // Import saved deal directly to Properties database
  const importSavedDealToProperties = async (savedDeal: any) => {
    setImportingToProperties(true);
    
    try {
      // Load the saved deal data temporarily
      const currentState = {
        propertyName,
        propertyAddress,
        assumptions,
        rehabBudgetSections,
        closingCosts,
        holdingCosts,
        expenses,
        rentRoll,
        unitTypes,
        exitAnalysis,
        workflowSteps
      };

      // Temporarily load saved deal data
      setPropertyName(savedDeal.propertyName || 'Untitled Property');
      setPropertyAddress(savedDeal.propertyAddress || 'Unknown Address');
      setAssumptions(savedDeal.assumptions || {});
      setRehabBudgetSections(savedDeal.rehabBudgetSections || {});
      setClosingCosts(savedDeal.closingCosts || {});
      setHoldingCosts(savedDeal.holdingCosts || {});
      setExpenses(savedDeal.expenses || {});
      setRentRoll(savedDeal.rentRoll || []);
      setUnitTypes(savedDeal.unitTypes || []);
      setExitAnalysis(savedDeal.exitAnalysis || {});
      setWorkflowSteps(savedDeal.workflowSteps || []);

      // Wait for state updates
      await new Promise(resolve => setTimeout(resolve, 100));

      // Set up default import form data
      setImportFormData({
        entity: '5Central Capital',
        acquisitionDate: new Date().toISOString().split('T')[0],
        broker: '',
        legalNotes: `Imported from saved deal: ${savedDeal.name || 'Untitled'}`,
        closingTimeline: ''
      });

      // Show import modal for additional details
      setShowImportModal(true);

      // Restore original state after a delay
      setTimeout(() => {
        setPropertyName(currentState.propertyName);
        setPropertyAddress(currentState.propertyAddress);
        setAssumptions(currentState.assumptions);
        setRehabBudgetSections(currentState.rehabBudgetSections);
        setClosingCosts(currentState.closingCosts);
        setHoldingCosts(currentState.holdingCosts);
        setExpenses(currentState.expenses);
        setRentRoll(currentState.rentRoll);
        setUnitTypes(currentState.unitTypes);
        setExitAnalysis(currentState.exitAnalysis);
        setWorkflowSteps(currentState.workflowSteps);
      }, 5000);

    } catch (error) {
      console.error('Error importing saved deal to properties:', error);
      alert('Failed to prepare saved deal for import. Please try again.');
    } finally {
      setImportingToProperties(false);
    }
  };

  // Import deal to Properties database
  const importToProperties = async () => {
    setImportingToProperties(true);
    
    try {
      // Extract city and state from address - use stored components if available
      let city = '';
      let state = '';
      let zipCode = '';
      
      try {
        const storedComponents = localStorage.getItem('dealAnalyzer_addressComponents');
        if (storedComponents) {
          const components: AddressComponents = JSON.parse(storedComponents);
          city = components.city || '';
          state = components.state || '';
          zipCode = components.zipCode || '';
        }
      } catch (e) {
        // Could not parse stored address components, falling back to parsing
      }
      
      // Fallback to manual parsing if no components stored
      if (!city || !state) {
        const addressParts = propertyAddress.split(',');
        city = city || (addressParts.length > 1 ? addressParts[addressParts.length - 2].trim() : '');
        const stateZip = addressParts.length > 2 ? addressParts[addressParts.length - 1].trim() : '';
        state = state || stateZip.split(' ')[0] || '';
        zipCode = zipCode || stateZip.split(' ')[1] || '';
      }

      // Calculate rehab costs from detailed sections
      const exteriorTotal = rehabBudgetSections.exterior.reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0);
      const generalInteriorTotal = rehabBudgetSections.generalInterior.reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0);
      const kitchensTotal = rehabBudgetSections.kitchens.reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0);
      const bathroomsTotal = rehabBudgetSections.bathrooms.reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0);
      const finishingsTotal = rehabBudgetSections.finishings.reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0);
      
      const rehabSubtotal = exteriorTotal + generalInteriorTotal + kitchensTotal + bathroomsTotal + finishingsTotal;
      // Use contingency rate from assumptions or default to 10%
      const contingencyRate = assumptions.contingencyRate || 0.10;
      const contingency = rehabSubtotal * contingencyRate;
      const totalRehabCosts = rehabSubtotal + contingency;

      // Calculate total closing costs and holding costs
      const totalClosingCosts = Object.values(closingCosts || {}).reduce((sum, cost) => sum + (Number(cost) || 0), 0);
      const totalHoldingCosts = Object.values(holdingCosts || {}).reduce((sum, cost) => sum + (Number(cost) || 0), 0);
      const downPayment = (assumptions.purchasePrice || 0) * (1 - (assumptions.loanPercentage || 0.8));
      const initialCapital = downPayment + totalRehabCosts + totalClosingCosts + totalHoldingCosts;

      // Calculate cash flow (annual) with detailed calculations
      const totalAnnualRent = rentRoll.reduce((sum, unit) => {
        const unitType = unitTypes.find(ut => ut.id === unit.unitTypeId);
        return sum + (unitType ? unitType.marketRent * 12 : unit.proFormaRent * 12);
      }, 0);
      
      const vacancyLoss = totalAnnualRent * assumptions.vacancyRate;
      const netRevenue = totalAnnualRent - vacancyLoss;
      const managementFee = netRevenue * 0.08; // 8% management fee
      const totalAnnualExpenses = Object.values(expenses || {}).reduce((sum, expense) => sum + (Number(expense) || 0), 0) + managementFee;
      const noi = netRevenue - totalAnnualExpenses;
      
      // Calculate debt service using initial loan terms (not refinance terms for import)
      const loanAmount = ((assumptions.purchasePrice || 0) + totalRehabCosts) * (assumptions.loanPercentage || 0.8);
      const interestRate = assumptions.interestRate || 0.0875;
      const loanTermYears = assumptions.loanTermYears || 2;
      
      let monthlyPayment = 0;
      if (loanAmount > 0 && interestRate > 0) {
        const monthlyRate = interestRate / 12;
        const numPayments = loanTermYears * 12;
        monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
      }
      
      const annualDebtService = monthlyPayment * 12;
      const annualCashFlow = noi - annualDebtService;

      // Calculate cash-on-cash return using actual initial capital
      const cashOnCashReturn = initialCapital > 0 ? (annualCashFlow / initialCapital) : 0;

      // Calculate ARV
      const marketCapRate = assumptions.marketCapRate || 0.055;
      const arv = noi > 0 && marketCapRate > 0 ? noi / marketCapRate : assumptions.purchasePrice || 0;

      const propertyData = {
        status: 'Under Contract' as const,
        apartments: Number(assumptions.unitCount) || 1,
        address: propertyAddress.split(',')[0]?.trim() || propertyName,
        city: city || 'Unknown',
        state: state || 'CT',
        zipCode: zipCode || null,
        entity: importFormData.entity || '5Central Capital',
        acquisitionDate: importFormData.acquisitionDate || new Date().toISOString().split('T')[0],
        acquisitionPrice: Math.round(Number(assumptions.purchasePrice) || 0).toString(),
        rehabCosts: Math.round(totalRehabCosts).toString(),
        arvAtTimePurchased: Math.round(arv).toString(),
        initialCapitalRequired: Math.round(initialCapital).toString(),
        cashFlow: Math.round(annualCashFlow).toString(),
        totalProfits: '0',
        cashOnCashReturn: Number((cashOnCashReturn * 100).toFixed(2)).toString(),
        annualizedReturn: Number((cashOnCashReturn * 100).toFixed(2)).toString(),
        yearsHeld: '0',
        // Include all deal analyzer data for comprehensive import
        dealAnalyzerData: {
          propertyName,
          propertyAddress,
          assumptions,
          rehabBudgetSections,
          closingCosts,
          holdingCosts,
          expenses,
          rentRoll,
          unitTypes,
          exitAnalysis,
          workflowSteps,
          // Include loan data in the same format that Asset Management expects
          loans: [{
            id: 1,
            name: 'Acquisition Loan',
            amount: loanAmount,
            loanAmount: loanAmount,
            interestRate: interestRate,
            termYears: loanTermYears,
            monthlyPayment: monthlyPayment,
            isActive: true,
            loanType: 'acquisition',
            paymentType: loanTermYears <= 3 ? 'interest-only' : 'amortizing',
            startDate: importFormData.acquisitionDate || new Date().toISOString().split('T')[0],
            remainingBalance: loanAmount
          }],
          calculations: {
            totalRehabCosts,
            totalClosingCosts,
            totalHoldingCosts,
            initialCapital,
            arv,
            noi,
            annualCashFlow,
            cashOnCashReturn,
            monthlyDebtService: monthlyPayment
          }
        }
      };

      // Importing property data

      // Get authentication token
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        throw new Error('Authentication required. Please log in first.');
      }

      const response = await fetch('/api/properties/import-normalized', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          dealData: propertyData.dealAnalyzerData,
          entity: importFormData.entity || '5Central Capital',
          acquisitionDate: importFormData.acquisitionDate || new Date().toISOString().split('T')[0],
          broker: importFormData.broker || '',
          legalNotes: importFormData.legalNotes || '',
          address: propertyAddress.split(',')[0]?.trim() || propertyName,
          city: city || 'Unknown',
          state: state || 'CT',
          zipCode: zipCode || ''
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Import failed:', response.status, errorText);
        throw new Error(`Failed to import property: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      // Import successful

      // After successful property creation, import the rehab line items
      if (result.id) {
        await importRehabLineItems(result.id);
      }

      // Close modal and reset form
      setShowImportModal(false);
      setImportFormData({
        entity: '5Central Capital',
        acquisitionDate: '',
        broker: '',
        legalNotes: '',
        closingTimeline: ''
      });
      
      // Show success message
      alert(`Deal successfully imported to Properties! Property ID: ${result.id}`);
      
    } catch (error) {
      console.error('Error importing to properties:', error);
      
      // Check if property was actually created despite the error
      if (error instanceof Error && error.message.includes('Failed to import property')) {
        const errorMessage = error.message;
        alert(`Import failed: ${errorMessage}`);
      } else {
        // Generic error - might be a network issue or unexpected error
        alert('Import failed due to an unexpected error. Please check the console for details.');
      }
    } finally {
      setImportingToProperties(false);
    }
  };

  // Import rehab line items to Asset Management
  const importRehabLineItems = async (propertyId: number) => {
    try {
      const rehabLineItems: any[] = [];
      
      // Convert Deal Analyzer rehab budget sections to line items
      Object.entries(rehabBudgetSections).forEach(([sectionKey, items]: [string, any[]]) => {
        const categoryMap: Record<string, string> = {
          exterior: 'Exterior',
          kitchens: 'Kitchens',
          bathrooms: 'Bathrooms',
          generalInterior: 'General Interior',
          finishings: 'General Interior' // Map finishings to General Interior
        };
        
        const category = categoryMap[sectionKey] || 'General Interior';
        
        items.forEach((item, index) => {
          if (item.category && item.perUnitCost > 0) {
            rehabLineItems.push({
              id: Date.now() + index,
              category,
              item: item.category,
              budgetAmount: item.perUnitCost * item.quantity,
              spentAmount: 0,
              completed: false,
              notes: `Imported from Deal Analyzer - ${item.quantity} units at $${item.perUnitCost} each`
            });
          }
        });
      });

      // Store the rehab line items in localStorage for Asset Management to access
      const existingRehabData = localStorage.getItem('rehabLineItems');
      const rehabData = existingRehabData ? JSON.parse(existingRehabData) : {};
      rehabData[propertyId] = rehabLineItems;
      localStorage.setItem('rehabLineItems', JSON.stringify(rehabData));
      
      // Imported rehab line items for property
      
    } catch (error) {
      // Error importing rehab line items
      // Don't throw error here as the main property import was successful
    }
  };

  // Component render
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
    <div className="py-6 space-y-6">
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
                <div className="w-80">
                  <AddressAutocomplete
                    value={propertyAddress}
                    onChange={(address, components) => {
                      setPropertyAddress(address);
                      // Save parsed components for potential use in property import
                      if (components) {
                        // Store address components for later use
                        localStorage.setItem('dealAnalyzer_addressComponents', JSON.stringify(components));
                      }
                    }}
                    placeholder="Enter property address..."
                    className="text-lg text-gray-600 border-b border-blue-300 bg-transparent"
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => setEditingAddress(false)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      Done
                    </button>
                    <button
                      onClick={() => setEditingAddress(false)}
                      className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
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
            
            <button
              onClick={saveDeal}
              disabled={isSaving}
              className="flex items-center px-2 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-all-smooth hover-scale btn-bounce"
            >
              <Save className="h-3 w-3 mr-1 icon-bounce" />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            
            <button
              onClick={() => setShowImportModal(true)}
              disabled={importingToProperties}
              className="flex items-center px-2 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 transition-all-smooth hover-scale btn-bounce"
              title="Import current Deal Analyzer data to Properties database"
            >
              <Database className="h-3 w-3 mr-1 icon-pulse" />
              {importingToProperties ? 'Importing...' : 'Import to Properties'}
            </button>
            
            <div className="relative group">
              <button className="flex items-center px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-all-smooth hover-scale btn-bounce">
                <Download className="h-3 w-3 mr-1 icon-bounce" />
                Export
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 slide-in-up">
                <button
                  onClick={exportDealJSON}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors-smooth hover-scale"
                >
                  Export as JSON
                </button>
                <button
                  onClick={exportDealCSV}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors-smooth hover-scale"
                >
                  Export as CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Saved Deals Panel */}
      {savedDeals.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 fade-in card-hover">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <Database className="h-5 w-5 mr-2 icon-bounce" />
            Saved Deals
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
            {savedDeals.slice(-6).map((deal) => (
              <div key={deal.id} className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 transition-all-smooth card-hover hover-scale">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{deal.name}</h4>
                    <p className="text-sm text-gray-600">{deal.address}</p>
                    <p className="text-xs text-gray-500">
                      Saved: {new Date(deal.savedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => loadDeal(deal)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-all-smooth hover-scale btn-bounce"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => importSavedDealToProperties(deal)}
                      className="px-2 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition-all-smooth hover-scale btn-bounce"
                      title="Import this deal directly to Properties"
                    >
                      Import
                    </button>
                    <button
                      onClick={() => deleteDeal(deal.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-all-smooth hover-scale btn-bounce"
                      title="Delete deal"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
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
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top KPI Bar - Full Width */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-500 via-purple-500 to-purple-600 rounded-lg border border-blue-200 p-8 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Calculator className="h-6 w-6 mr-3" />
                <span className="text-lg font-semibold">Deal Analyzer KPIs</span>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-6">
              <div className="text-center border-r border-white/20 last:border-r-0 pr-6 last:pr-0">
                <div className="text-sm opacity-90 mb-2">Capital Required</div>
                <div className="text-2xl font-bold">{formatCurrency(metrics.capitalRequired)}</div>
              </div>
              <div className="text-center border-r border-white/20 last:border-r-0 pr-6 last:pr-0">
                <div className="text-sm opacity-90 mb-2">Rehab Cost</div>
                <div className="text-2xl font-bold">{formatCurrency(metrics.totalRehab)}</div>
              </div>
              <div className="text-center border-r border-white/20 last:border-r-0 pr-6 last:pr-0">
                <div className="text-sm opacity-90 mb-2">All-In Cost</div>
                <div className="text-2xl font-bold">{formatCurrency(metrics.allInCost)}</div>
              </div>
              <div className="text-center border-r border-white/20 last:border-r-0 pr-6 last:pr-0">
                <div className="text-sm opacity-90 mb-2">ARV</div>
                <div className="text-2xl font-bold">{formatCurrency(metrics.arv)}</div>
              </div>
              <div className="text-center border-r border-white/20 last:border-r-0 pr-6 last:pr-0">
                <div className="text-sm opacity-90 mb-2">Purchase Cost/Unit</div>
                <div className="text-2xl font-bold">{formatCurrency(assumptions.purchasePrice / assumptions.unitCount)}</div>
              </div>
              <div className="text-center border-r border-white/20 last:border-r-0 pr-6 last:pr-0">
                <div className="text-sm opacity-90 mb-2">Profit</div>
                <div className="text-2xl font-bold">{formatCurrency(metrics.arv - metrics.allInCost)}</div>
              </div>
              <div className="text-center border-r border-white/20 last:border-r-0 pr-6 last:pr-0">
                <div className="text-sm opacity-90 mb-2">Equity Multiple</div>
                <div className="text-2xl font-bold">{metrics.equityMultiple.toFixed(2)}x</div>
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
                    type="text"
                    value={assumptions.unitCount}
                    onChange={(e) => {
                      const validated = e.target.value.replace(/[^0-9]/g, ''); // Only allow whole numbers for unit count
                      updateAssumption('unitCount', Number(validated) || 0);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price</label>
                  <input
                    type="text"
                    value={assumptions.purchasePrice}
                    onChange={(e) => {
                      const validated = validateOverviewNumberInput(e.target.value);
                      updateAssumption('purchasePrice', Number(validated) || 0);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Loan % (LTC)</label>
                  <input
                    type="text"
                    value={(assumptions.loanPercentage * 100).toFixed(2)}
                    onChange={(e) => {
                      const validated = validateOverviewNumberInput(e.target.value);
                      updateAssumption('loanPercentage', Number(validated) / 100 || 0);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Interest Rate (%)</label>
                  <input
                    type="text"
                    value={(assumptions.interestRate * 100).toFixed(2)}
                    onChange={(e) => {
                      const validated = validateOverviewNumberInput(e.target.value);
                      updateAssumption('interestRate', Number(validated) / 100 || 0);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Loan Term (Years)</label>
                  <input
                    type="text"
                    value={assumptions.loanTermYears}
                    onChange={(e) => {
                      const validated = e.target.value.replace(/[^0-9]/g, ''); // Only allow whole numbers for years
                      updateAssumption('loanTermYears', Number(validated) || 0);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                    onDoubleClick={() => setEditingClosingCosts(!editingClosingCosts)}
                    title="Double-click to edit closing costs"
                  >
                    Closing Costs {editingClosingCosts ? '(Editing)' : ''}
                  </h4>
                  {editingClosingCosts && (
                    <button
                      onClick={() => {
                        const keys = Object.keys(closingCosts);
                        const maxKey = keys.length > 0 ? Math.max(...keys.map(k => parseInt(k) || 0)) : 0;
                        const newKey = `item${maxKey + 1}`;
                        setClosingCosts(prev => ({
                          ...prev,
                          [newKey]: 0
                        }));
                        setClosingCostNames(prev => ({
                          ...prev,
                          [newKey]: 'New Item'
                        }));
                      }}
                      className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                    >
                      + Add Item
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
                              type="text"
                              value={value}
                              onChange={(e) => {
                                const validated = validateClosingCostInput(e.target.value);
                                updateClosingCost(key, Number(validated) || 0);
                              }}
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
                  
                  {/* 3-Month Interest Reserve - Dynamic Calculation */}
                  <div className="flex justify-between items-center py-2 border-t border-gray-200">
                    <span className="text-sm font-medium text-gray-700">3-Month Interest Reserve</span>
                    <span className="text-sm font-medium">{formatCurrency((metrics.initialLoan * assumptions.interestRate / 12) * 3)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center pt-2 border-t border-gray-900">
                    <span className="font-medium text-gray-900">Total Closing Costs (Purchase)</span>
                    <span className="font-bold text-green-600">
                      {formatCurrency(Object.values(closingCosts).reduce((sum, cost) => sum + cost, 0) + ((metrics.initialLoan * assumptions.interestRate / 12) * 3))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Holding Costs */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 
                    className="text-md font-medium text-gray-800 cursor-pointer hover:text-blue-600"
                    onDoubleClick={() => setEditingHoldingCosts(!editingHoldingCosts)}
                    title="Double-click to edit holding costs"
                  >
                    Holding Costs {editingHoldingCosts ? '(Editing)' : ''}
                  </h4>
                  {editingHoldingCosts && (
                    <button
                      onClick={() => {
                        const keys = Object.keys(holdingCosts);
                        const maxKey = keys.length > 0 ? Math.max(...keys.map(k => parseInt(k) || 0)) : 0;
                        const newKey = `item${maxKey + 1}`;
                        setHoldingCosts(prev => ({
                          ...prev,
                          [newKey]: 0
                        }));
                        setHoldingCostNames(prev => ({
                          ...prev,
                          [newKey]: 'New Item'
                        }));
                      }}
                      className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                    >
                      + Add Item
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
                              type="text"
                              value={value}
                              onChange={(e) => {
                                const validated = validateNumberInput(e.target.value);
                                updateHoldingCost(key, Number(validated) || 0);
                              }}
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
                              type="text"
                              value={value}
                              onChange={(e) => {
                                const validated = validateOverviewNumberInput(e.target.value);
                                updateExpense(key, Number(validated) || 0);
                              }}
                              className="w-24 px-2 py-1 border rounded text-sm text-right font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                      type="text"
                      value={(assumptions.vacancyRate * 100).toFixed(2)}
                      onChange={(e) => {
                        const validated = validateOverviewNumberInput(e.target.value);
                        updateAssumption('vacancyRate', Number(validated) / 100 || 0);
                      }}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Market Cap Rate (%)</label>
                    <input
                      type="text"
                      value={(assumptions.marketCapRate * 100).toFixed(2)}
                      onChange={(e) => {
                        const validated = validateOverviewNumberInput(e.target.value);
                        updateAssumption('marketCapRate', Number(validated) / 100 || 0);
                      }}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>
                
                {/* Refinance Terms */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-800 border-b pb-1">Refinance Terms</h4>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Refinance LTV (%)</label>
                    <input
                      type="text"
                      value={(assumptions.refinanceLTV * 100).toFixed(2)}
                      onChange={(e) => {
                        const validated = validateOverviewNumberInput(e.target.value);
                        updateAssumption('refinanceLTV', Number(validated) / 100 || 0);
                      }}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Refinance Rate (%)</label>
                    <input
                      type="text"
                      value={(assumptions.refinanceInterestRate * 100).toFixed(2)}
                      onChange={(e) => {
                        const validated = validateOverviewNumberInput(e.target.value);
                        updateAssumption('refinanceInterestRate', Number(validated) / 100 || 0);
                      }}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>
                
                {/* Analysis Thresholds */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-800 border-b pb-1">Analysis Settings</h4>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Refi Closing Costs (%)</label>
                    <input
                      type="text"
                      value={(assumptions.refinanceClosingCostPercent * 100).toFixed(2)}
                      onChange={(e) => {
                        const validated = validateOverviewNumberInput(e.target.value);
                        updateAssumption('refinanceClosingCostPercent', Number(validated) / 100 || 0);
                      }}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">DSCR Threshold</label>
                    <input
                      type="text"
                      value={assumptions.dscrThreshold.toFixed(2)}
                      onChange={(e) => {
                        const validated = validateOverviewNumberInput(e.target.value);
                        updateAssumption('dscrThreshold', Number(validated) || 0);
                      }}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                  <span className="text-sm text-gray-600">3-Month Interest Reserve</span>
                  <span className="font-medium">{formatCurrency((metrics.initialLoan * assumptions.interestRate / 12) * 3)}</span>
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
                    <span>Annual Appreciation (%)</span>
                    <input
                      type="number"
                      value={(exitAnalysis.annualAppreciationRate * 100).toFixed(1)}
                      onChange={(e) => setExitAnalysis({...exitAnalysis, annualAppreciationRate: (parseFloat(e.target.value) || 3.0) / 100})}
                      className="w-20 px-2 py-1 border rounded text-right"
                      step="0.1"
                      min="0.0"
                      max="10.0"
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
                    <span className="font-medium">{formatCurrency(metrics.arv * exitAnalysis.annualAppreciationRate * exitAnalysis.holdPeriodYears)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between">
                    <span className="font-semibold">Total Hold Return</span>
                    <span className="font-bold text-blue-600">{formatCurrency((metrics.netCashFlow * exitAnalysis.holdPeriodYears) + (metrics.arv * exitAnalysis.annualAppreciationRate * exitAnalysis.holdPeriodYears))}</span>
                  </div>
                </div>
              </div>

              {/* Sell Strategy */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold mb-4 text-green-600">Sell Strategy</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Sales Cap Rate (%)</span>
                    <input
                      type="number"
                      value={(exitAnalysis.saleFactor * 100).toFixed(2)}
                      onChange={(e) => setExitAnalysis({...exitAnalysis, saleFactor: (parseFloat(e.target.value) || 5.5) / 100})}
                      className="w-20 px-2 py-1 border rounded text-right"
                      step="0.1"
                      min="3.0"
                      max="10.0"
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
                  <div className="text-2xl font-bold text-blue-600">{((((metrics.netCashFlow * exitAnalysis.holdPeriodYears) + (metrics.arv * exitAnalysis.annualAppreciationRate * exitAnalysis.holdPeriodYears)) / metrics.capitalRequired) * 100).toFixed(1)}%</div>
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
          {/* Market Rates Widget */}
          <MarketRatesWidget />
          
          {/* Census Demographics Widget */}
          <CensusDemographicsWidget 
            address={propertyAddress}
            city={(() => {
              try {
                const storedComponents = localStorage.getItem('dealAnalyzer_addressComponents');
                if (storedComponents) {
                  const components: AddressComponents = JSON.parse(storedComponents);
                  return components.city || '';
                }
              } catch (e) {
                // Fallback to parsing address
                const addressParts = propertyAddress.split(',');
                return addressParts.length > 1 ? addressParts[addressParts.length - 2].trim() : '';
              }
              return '';
            })()}
            state={(() => {
              try {
                const storedComponents = localStorage.getItem('dealAnalyzer_addressComponents');
                if (storedComponents) {
                  const components: AddressComponents = JSON.parse(storedComponents);
                  return components.state || '';
                }
              } catch (e) {
                // Fallback to parsing address
                const addressParts = propertyAddress.split(',');
                const stateZip = addressParts.length > 2 ? addressParts[addressParts.length - 1].trim() : '';
                return stateZip.split(' ')[0] || '';
              }
              return '';
            })()}
          />
          
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-purple-600" />
              Sensitivity Analysis
            </h3>
            
            <div className="grid grid-cols-2 gap-8">
              {/* Rent Sensitivity */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold mb-4 text-blue-600">Rent Sensitivity</h4>
                <div className="text-sm text-gray-600 mb-3">
                  Base Market Rent: {formatCurrency(rentRoll.reduce((sum, unit) => sum + unit.proFormaRent, 0))} monthly
                </div>
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
                <div className="text-sm text-gray-600 mb-3">
                  Base Market Cap Rate: {(assumptions.marketCapRate * 100).toFixed(1)}%
                </div>
                <div className="space-y-3">
                  {(() => {
                    const baseCapRate = assumptions.marketCapRate * 100;
                    const capRates = [
                      baseCapRate - 1.0,
                      baseCapRate - 0.5,
                      baseCapRate,
                      baseCapRate + 0.5,
                      baseCapRate + 1.0
                    ];
                    return capRates.map(capRate => {
                      const impliedValue = metrics.noi / (capRate / 100);
                      const profitAtCap = impliedValue - metrics.allInCost;
                      const isBase = Math.abs(capRate - baseCapRate) < 0.01;
                      return (
                        <div key={capRate} className="flex justify-between items-center">
                          <span className={isBase ? 'font-bold' : ''}>{capRate.toFixed(1)}%</span>
                          <div className="text-right">
                            <div className={`${profitAtCap >= 0 ? 'text-green-600' : 'text-red-600'} ${isBase ? 'font-bold' : ''}`}>
                              {formatCurrency(impliedValue)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatCurrency(profitAtCap)} profit
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>

            {/* Interest Rate Impact */}
            <div className="mt-6 border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold mb-4 text-purple-600">Interest Rate Impact</h4>
              <div className="text-sm text-gray-600 mb-3">
                Base Refinance Rate: {(assumptions.refinanceInterestRate * 100).toFixed(1)}%
              </div>
              <div className="grid grid-cols-5 gap-4">
                {(() => {
                  const baseRate = assumptions.refinanceInterestRate * 100;
                  const rates = [
                    baseRate - 1.0,
                    baseRate - 0.5,
                    baseRate,
                    baseRate + 0.5,
                    baseRate + 1.0
                  ];
                  return rates.map(rate => {
                    const monthlyRate = rate / 100 / 12;
                    const termYears = assumptions.refinanceTermYears || assumptions.loanTermYears || 0;
                    const payments = termYears * 12;
                    const monthlyPayment = (metrics.refinanceLoan * monthlyRate * Math.pow(1 + monthlyRate, payments)) / (Math.pow(1 + monthlyRate, payments) - 1);
                    const annualPayment = monthlyPayment * 12;
                    const adjustedCashFlow = metrics.noi - annualPayment;
                    const isBase = Math.abs(rate - baseRate) < 0.01;
                    
                    return (
                      <div key={rate} className="text-center">
                        <div className={`font-semibold ${isBase ? 'text-blue-600' : ''}`}>
                          {rate.toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatCurrency(monthlyPayment)}/mo
                        </div>
                        <div className={`text-sm font-medium ${adjustedCashFlow >= 0 ? 'text-green-600' : 'text-red-600'} ${isBase ? 'font-bold' : ''}`}>
                          {formatCurrency(adjustedCashFlow)}
                        </div>
                      </div>
                    );
                  });
                })()}
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
                    <th className="text-left py-3 px-4">Tenant Name</th>
                    <th className="text-left py-3 px-4">Lease From</th>
                    <th className="text-left py-3 px-4">Lease To</th>
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
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={unit.tenantName || ''}
                            onChange={(e) => {
                              const updated = rentRoll.map(u => u.id === unit.id ? {...u, tenantName: e.target.value} : u);
                              setRentRoll(updated);
                            }}
                            placeholder="Tenant name"
                            className="w-32 px-2 py-1 border rounded text-sm"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="date"
                            value={unit.leaseFrom || ''}
                            onChange={(e) => {
                              const updated = rentRoll.map(u => u.id === unit.id ? {...u, leaseFrom: e.target.value} : u);
                              setRentRoll(updated);
                            }}
                            className="w-32 px-2 py-1 border rounded text-sm"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="date"
                            value={unit.leaseTo || ''}
                            onChange={(e) => {
                              const updated = rentRoll.map(u => u.id === unit.id ? {...u, leaseTo: e.target.value} : u);
                              setRentRoll(updated);
                            }}
                            className="w-32 px-2 py-1 border rounded text-sm"
                          />
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
                    <td className="py-3 px-4"></td>
                    <td className="py-3 px-4"></td>
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
                      <td 
                        className="py-2 px-3 font-semibold text-blue-700 cursor-pointer hover:text-blue-800" 
                        colSpan={3}
                        onClick={() => setEditingRehabSections(prev => ({...prev, exterior: !prev.exterior}))}
                        title="Click to edit exterior section"
                      >
                        Exterior {editingRehabSections.exterior ? '(Editing)' : ''}
                      </td>
                      <td className="py-2 px-3 text-right">
                        {editingRehabSections.exterior && (
                          <button 
                            onClick={() => addRehabItem('exterior')}
                            className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                          >
                            + Add
                          </button>
                        )}
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
                            type="text"
                            value={item.perUnitCost}
                            onChange={(e) => updateRehabItem('exterior', item.id, 'perUnitCost', e.target.value)}
                            className="w-16 px-1 py-0.5 border-0 bg-transparent text-sm text-right focus:outline-none focus:bg-white focus:border focus:border-blue-300 rounded ml-1"
                          />
                        </td>
                        <td className="py-1 px-3 text-right text-sm border-r">
                          <input
                            type="text"
                            value={item.quantity}
                            onChange={(e) => updateRehabItem('exterior', item.id, 'quantity', e.target.value)}
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
                      <td 
                        className="py-2 px-3 font-semibold text-orange-700 cursor-pointer hover:text-orange-800" 
                        colSpan={3}
                        onClick={() => setEditingRehabSections(prev => ({...prev, kitchens: !prev.kitchens}))}
                        title="Click to edit kitchens section"
                      >
                        Kitchens {editingRehabSections.kitchens ? '(Editing)' : ''}
                      </td>
                      <td className="py-2 px-3 text-right">
                        {editingRehabSections.kitchens && (
                          <button 
                            onClick={() => addRehabItem('kitchens')}
                            className="px-2 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700"
                          >
                            + Add
                          </button>
                        )}
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
                            type="text"
                            value={item.perUnitCost}
                            onChange={(e) => updateRehabItem('kitchens', item.id, 'perUnitCost', e.target.value)}
                            className="w-16 px-1 py-0.5 border-0 bg-transparent text-sm text-right focus:outline-none focus:bg-white focus:border focus:border-blue-300 rounded ml-1"
                          />
                        </td>
                        <td className="py-1 px-3 text-right text-sm border-r">
                          <input
                            type="text"
                            value={item.quantity}
                            onChange={(e) => updateRehabItem('kitchens', item.id, 'quantity', e.target.value)}
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
                      <td 
                        className="py-2 px-3 font-semibold text-purple-700 cursor-pointer hover:text-purple-800" 
                        colSpan={3}
                        onClick={() => setEditingRehabSections(prev => ({...prev, bathrooms: !prev.bathrooms}))}
                        title="Click to edit bathrooms section"
                      >
                        Bathrooms {editingRehabSections.bathrooms ? '(Editing)' : ''}
                      </td>
                      <td className="py-2 px-3 text-right">
                        {editingRehabSections.bathrooms && (
                          <button 
                            onClick={() => addRehabItem('bathrooms')}
                            className="px-2 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700"
                          >
                            + Add
                          </button>
                        )}
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
                            type="text"
                            value={item.perUnitCost}
                            onChange={(e) => updateRehabItem('bathrooms', item.id, 'perUnitCost', e.target.value)}
                            className="w-16 px-1 py-0.5 border-0 bg-transparent text-sm text-right focus:outline-none focus:bg-white focus:border focus:border-blue-300 rounded ml-1"
                          />
                        </td>
                        <td className="py-1 px-3 text-right text-sm border-r">
                          <input
                            type="text"
                            value={item.quantity}
                            onChange={(e) => updateRehabItem('bathrooms', item.id, 'quantity', e.target.value)}
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
                            type="text"
                            value={item.perUnitCost}
                            onChange={(e) => updateRehabItem('generalInterior', item.id, 'perUnitCost', e.target.value)}
                            className="w-16 px-1 py-0.5 border-0 bg-transparent text-sm text-right focus:outline-none focus:bg-white focus:border focus:border-blue-300 rounded ml-1"
                          />
                        </td>
                        <td className="py-1 px-3 text-right text-sm border-r">
                          <input
                            type="text"
                            value={item.quantity}
                            onChange={(e) => updateRehabItem('generalInterior', item.id, 'quantity', e.target.value)}
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
                            type="text"
                            value={item.perUnitCost}
                            onChange={(e) => updateRehabItem('finishings', item.id, 'perUnitCost', e.target.value)}
                            className="w-16 px-1 py-0.5 border-0 bg-transparent text-sm text-right focus:outline-none focus:bg-white focus:border focus:border-blue-300 rounded ml-1"
                          />
                        </td>
                        <td className="py-1 px-3 text-right text-sm border-r">
                          <input
                            type="text"
                            value={item.quantity}
                            onChange={(e) => updateRehabItem('finishings', item.id, 'quantity', e.target.value)}
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
                      <td className="py-1 px-3 text-right border-r">
                        $ {(
                          (rehabBudgetSections.exterior.reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0) +
                          rehabBudgetSections.generalInterior.reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0) +
                          rehabBudgetSections.kitchens.reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0) +
                          rehabBudgetSections.bathrooms.reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0) +
                          rehabBudgetSections.finishings.reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0)) * 0.75
                        ).toFixed(2)}
                      </td>
                      <td className="py-1 px-3 text-right">
                        $ {(
                          (rehabBudgetSections.exterior.reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0) +
                          rehabBudgetSections.generalInterior.reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0) +
                          rehabBudgetSections.kitchens.reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0) +
                          rehabBudgetSections.bathrooms.reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0) +
                          rehabBudgetSections.finishings.reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0)) * 0.75 / assumptions.unitCount
                        ).toFixed(2)}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-1 px-3 border-r">Materials</td>
                      <td className="py-1 px-3 text-right border-r">
                        $ {(
                          (rehabBudgetSections.exterior.reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0) +
                          rehabBudgetSections.generalInterior.reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0) +
                          rehabBudgetSections.kitchens.reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0) +
                          rehabBudgetSections.bathrooms.reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0) +
                          rehabBudgetSections.finishings.reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0)) * 0.25
                        ).toFixed(2)}
                      </td>
                      <td className="py-1 px-3 text-right">
                        $ {(
                          (rehabBudgetSections.exterior.reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0) +
                          rehabBudgetSections.generalInterior.reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0) +
                          rehabBudgetSections.kitchens.reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0) +
                          rehabBudgetSections.bathrooms.reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0) +
                          rehabBudgetSections.finishings.reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0)) * 0.25 / assumptions.unitCount
                        ).toFixed(2)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1 px-3 border-r">Buffer</td>
                      <td className="py-1 px-3 text-right border-r">
                        $ {(
                          (rehabBudgetSections.exterior.reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0) +
                          rehabBudgetSections.generalInterior.reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0) +
                          rehabBudgetSections.kitchens.reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0) +
                          rehabBudgetSections.bathrooms.reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0) +
                          rehabBudgetSections.finishings.reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0)) * 0.10
                        ).toFixed(2)}
                      </td>
                      <td className="py-1 px-3 text-right">
                        $ {(
                          (rehabBudgetSections.exterior.reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0) +
                          rehabBudgetSections.generalInterior.reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0) +
                          rehabBudgetSections.kitchens.reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0) +
                          rehabBudgetSections.bathrooms.reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0) +
                          rehabBudgetSections.finishings.reduce((sum, item) => sum + (item.perUnitCost * item.quantity), 0)) * 0.10 / assumptions.unitCount
                        ).toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          {/* Workflow Timeline Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 mt-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                Project Timeline & Workflow
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    const maxId = Math.max(...workflowSteps.map(s => s.id), 0);
                    const newStep = {
                      id: maxId + 1,
                      step: 'New Step',
                      status: 'pending',
                      budgetCategory: null,
                      notes: ''
                    };
                    setWorkflowSteps([...workflowSteps, newStep]);
                  }}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors-smooth hover-scale"
                >
                  + Add Step
                </button>
                <button
                  onClick={() => setEditingWorkflow(!editingWorkflow)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors-smooth hover-scale ${
                    editingWorkflow 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {editingWorkflow ? 'Save' : 'Edit'}
                </button>
              </div>
            </div>

            {/* Category Progress Overview */}
            <div className="grid grid-cols-5 gap-4 mb-6">
              {['exterior', 'kitchens', 'bathrooms', 'generalInterior', 'finishings'].map(category => {
                const categoryNames: Record<string, string> = {
                  exterior: 'Exterior',
                  kitchens: 'Kitchens',
                  bathrooms: 'Bathrooms',
                  generalInterior: 'General Interior',
                  finishings: 'Finishings'
                };
                const progress = getCategoryProgress(category);
                return (
                  <div key={category} className="bg-gray-50 rounded-lg p-3 text-center">
                    <h4 className="text-xs font-medium text-gray-600 mb-2">{categoryNames[category]}</h4>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          progress === 100 ? 'bg-green-500' : progress > 0 ? 'bg-blue-500' : 'bg-gray-300'
                        }`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-medium text-gray-700">{progress}%</span>
                  </div>
                );
              })}
            </div>

            <div className="space-y-3">
              {workflowSteps.map((step, index) => {
                const budgetItemCompleted = getBudgetItemStatus(step.budgetCategory, step.budgetItem || null);
                const isLinkedToBudget = step.budgetCategory && step.budgetItem;
                
                return (
                  <div key={step.id} className={`flex items-center space-x-4 p-3 border rounded-lg transition-all-smooth card-hover ${
                    step.status === 'completed' ? 'bg-green-50 border-green-200' :
                    step.status === 'in-progress' ? 'bg-blue-50 border-blue-200' :
                    step.status === 'on-hold' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-white border-gray-200 hover:border-blue-300'
                  }`}>
                    {/* Step Number */}
                    <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      step.status === 'completed' ? 'bg-green-500 text-white' :
                      step.status === 'in-progress' ? 'bg-blue-500 text-white' :
                      step.status === 'on-hold' ? 'bg-yellow-500 text-white' :
                      'bg-gray-200 text-gray-600'
                    }`}>
                      {step.status === 'completed' ? '✓' : index + 1}
                    </div>

                    {/* Status Dropdown */}
                    <div className="flex-shrink-0">
                      <select
                        value={step.status}
                        onChange={(e) => {
                          const newStatus = e.target.value;
                          const updated = workflowSteps.map(s => 
                            s.id === step.id ? {...s, status: newStatus} : s
                          );
                          setWorkflowSteps(updated);
                          
                          // Update budget item completion when workflow step is marked complete
                          updateBudgetFromWorkflow(step.id, newStatus);
                        }}
                        className={`px-2 py-1 border rounded text-xs font-medium ${
                          step.status === 'completed' ? 'bg-green-100 border-green-300 text-green-800' :
                          step.status === 'in-progress' ? 'bg-blue-100 border-blue-300 text-blue-800' :
                          step.status === 'on-hold' ? 'bg-yellow-100 border-yellow-300 text-yellow-800' :
                          'bg-white border-gray-300 text-gray-700'
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="on-hold">On Hold</option>
                      </select>
                    </div>

                    {/* Step Name and Budget Link */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        {editingWorkflow ? (
                          <input
                            type="text"
                            value={step.step}
                            onChange={(e) => {
                              const updated = workflowSteps.map(s => 
                                s.id === step.id ? {...s, step: e.target.value} : s
                              );
                              setWorkflowSteps(updated);
                            }}
                            className="flex-1 px-2 py-1 border rounded text-sm font-medium"
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-900">{step.step}</span>
                        )}
                        
                        {/* Budget Link Indicator */}
                        {isLinkedToBudget && (
                          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
                            budgetItemCompleted ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            <span className="w-2 h-2 rounded-full bg-current"></span>
                            <span>{step.budgetItem}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Budget Category Indicator */}
                      {isLinkedToBudget && (
                        <div className="mt-1">
                          <span className="text-xs text-gray-500">
                            Linked to: {step.budgetCategory} → {step.budgetItem}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Budget Progress Indicator */}
                    {isLinkedToBudget && (
                      <div className="flex-shrink-0 w-16 text-center">
                        <div className={`text-xs font-medium ${
                          budgetItemCompleted ? 'text-green-600' : 'text-gray-500'
                        }`}>
                          {budgetItemCompleted ? 'Budget ✓' : 'Budget'}
                        </div>
                      </div>
                    )}

                    {/* Unit Count Metric */}
                    <div className="flex-shrink-0 w-20 text-center">
                      <div className="text-xs text-gray-500 mb-1">Units</div>
                      <div 
                        onClick={() => {
                          const totalUnits = assumptions.units || rentRoll.length;
                          const currentCompleted = step.unitsCompleted || 0;
                          const newCompleted = currentCompleted < totalUnits ? currentCompleted + 1 : 0;
                          
                          const updated = workflowSteps.map(s => 
                            s.id === step.id ? {...s, unitsCompleted: newCompleted} : s
                          );
                          setWorkflowSteps(updated);
                        }}
                        className={`cursor-pointer px-2 py-1 rounded text-xs font-medium transition-all hover-scale ${
                          (step.unitsCompleted || 0) >= (assumptions.units || rentRoll.length) 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                        }`}
                      >
                        {step.unitsCompleted || 0}/{assumptions.units || rentRoll.length}
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="w-32">
                      {editingWorkflow ? (
                        <input
                          type="text"
                          value={step.notes}
                          onChange={(e) => {
                            const updated = workflowSteps.map(s => 
                              s.id === step.id ? {...s, notes: e.target.value} : s
                            );
                            setWorkflowSteps(updated);
                          }}
                          placeholder="Notes"
                          className="w-full px-2 py-1 border rounded text-xs"
                        />
                      ) : (
                        <span className="text-xs text-gray-600 text-center block">{step.notes}</span>
                      )}
                  </div>

                  {/* Notes */}
                  <div className="w-32">
                    {editingWorkflow ? (
                      <input
                        type="text"
                        value={step.notes}
                        onChange={(e) => {
                          const updated = workflowSteps.map(s => 
                            s.id === step.id ? {...s, notes: e.target.value} : s
                          );
                          setWorkflowSteps(updated);
                        }}
                        placeholder="Notes"
                        className="w-full px-2 py-1 border rounded text-xs"
                      />
                    ) : (
                      <span className="text-xs text-gray-500">{step.notes}</span>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className="flex-shrink-0">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      step.status === 'completed' ? 'bg-green-100 text-green-800' :
                      step.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                      step.status === 'on-hold' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {step.status === 'completed' ? '✓' :
                       step.status === 'in-progress' ? '⟳' :
                       step.status === 'on-hold' ? '⏸' : '○'}
                    </span>
                  </div>

                  {/* Delete Button */}
                  {editingWorkflow && (
                    <button
                      onClick={() => {
                        const updated = workflowSteps.filter(s => s.id !== step.id);
                        setWorkflowSteps(updated);
                      }}
                      className="flex-shrink-0 text-red-600 hover:text-red-800 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                )
              })}
            </div>

            {/* Progress Summary */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-xs text-gray-600">Total Steps</p>
                  <p className="text-lg font-bold text-gray-900">{workflowSteps.length}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Completed</p>
                  <p className="text-lg font-bold text-green-600">
                    {workflowSteps.filter(s => s.status === 'completed').length}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">In Progress</p>
                  <p className="text-lg font-bold text-blue-600">
                    {workflowSteps.filter(s => s.status === 'in-progress').length}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Overall Progress</p>
                  <p className="text-lg font-bold text-purple-600">
                    {Math.round((workflowSteps.filter(s => s.status === 'completed').length / workflowSteps.length) * 100)}%
                  </p>
                </div>
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

      {/* Import to Properties Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Import to Properties</h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Legal Entity
                </label>
                <select
                  value={importFormData.entity}
                  onChange={(e) => setImportFormData(prev => ({ ...prev, entity: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="5Central Capital">5Central Capital</option>
                  <option value="The House Doctors">The House Doctors</option>
                  <option value="Arcadia Vision Group">Arcadia Vision Group</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expected Acquisition Date
                </label>
                <input
                  type="date"
                  value={importFormData.acquisitionDate}
                  onChange={(e) => setImportFormData(prev => ({ ...prev, acquisitionDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Broker/Agent (Optional)
                </label>
                <input
                  type="text"
                  value={importFormData.broker}
                  onChange={(e) => setImportFormData(prev => ({ ...prev, broker: e.target.value }))}
                  placeholder="Enter broker name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Closing Timeline (Optional)
                </label>
                <input
                  type="text"
                  value={importFormData.closingTimeline}
                  onChange={(e) => setImportFormData(prev => ({ ...prev, closingTimeline: e.target.value }))}
                  placeholder="e.g., 30-45 days"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Legal Notes (Optional)
                </label>
                <textarea
                  value={importFormData.legalNotes}
                  onChange={(e) => setImportFormData(prev => ({ ...prev, legalNotes: e.target.value }))}
                  placeholder="Any special legal considerations or notes"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={importToProperties}
                disabled={importingToProperties}
                className="px-4 py-2 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
              >
                {importingToProperties ? 'Importing...' : 'Import Property'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}