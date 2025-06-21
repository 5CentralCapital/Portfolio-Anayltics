/**
 * Centralized property financial calculations
 * All property metrics should be calculated through this utility to ensure consistency
 */

export interface PropertyMetrics {
  // Basic metrics
  monthlyCashFlow: number;
  annualCashFlow: number;
  arv: number;
  totalProfit: number;
  equityMultiple: number;
  cashOnCashReturn: number;
  
  // Additional metrics
  noi: number;
  capRate: number;
  dscr: number;
  ltv: number;
  breakEvenOccupancy: number;
  
  // Financial breakdown
  grossRentalIncome: number;
  effectiveGrossIncome: number;
  totalExpenses: number;
  debtService: number;
  
  // Investment metrics
  initialCapitalRequired: number;
  totalCashInvested: number;
  currentEquity: number;
}

export interface PropertyData {
  id: number;
  acquisitionPrice: string;
  rehabCosts: string;
  arvAtTimePurchased: string;
  initialCapitalRequired: string;
  cashFlow: string;
  totalProfits: string;
  cashOnCashReturn: string;
  dealAnalyzerData?: string;
  apartments: number;
  status: string;
  yearsHeld?: string;
  salePrice?: string;
}

/**
 * Calculate all property metrics from a single source of truth
 */
export function calculatePropertyMetrics(property: PropertyData): PropertyMetrics {
  const dealData = property.dealAnalyzerData ? JSON.parse(property.dealAnalyzerData) : null;
  
  // Base values from database (these are the authoritative source)
  const monthlyCashFlow = parseFloat(property.cashFlow || '0');
  const annualCashFlow = monthlyCashFlow * 12;
  const arv = parseFloat(property.arvAtTimePurchased || '0');
  const initialCapitalRequired = parseFloat(property.initialCapitalRequired || '0');
  const acquisitionPrice = parseFloat(property.acquisitionPrice || '0');
  const rehabCosts = parseFloat(property.rehabCosts || '0');
  
  // Cash-on-Cash Return: Use stored value if available, otherwise calculate
  let cashOnCashReturn = parseFloat(property.cashOnCashReturn || '0');
  if (cashOnCashReturn === 0 && initialCapitalRequired > 0) {
    cashOnCashReturn = (annualCashFlow / initialCapitalRequired) * 100;
  }
  
  // Total Profit calculation
  let totalProfit = parseFloat(property.totalProfits || '0');
  if (property.status === 'Sold') {
    // For sold properties, use stored total profits
    totalProfit = parseFloat(property.totalProfits || '0');
  } else {
    // For active properties, calculate unrealized profit
    const totalInvested = acquisitionPrice + rehabCosts;
    totalProfit = arv - totalInvested;
  }
  
  // Equity Multiple calculation
  let equityMultiple = 1.0;
  if (initialCapitalRequired > 0) {
    if (property.status === 'Sold') {
      // For sold properties: (Total Profits + Cash Flow) / Initial Capital
      const totalCashFlow = annualCashFlow * parseFloat(property.yearsHeld || '1');
      const totalReturns = totalProfit + totalCashFlow;
      equityMultiple = totalReturns / initialCapitalRequired;
    } else {
      // For active properties: Current Value / Initial Investment
      const currentValue = arv;
      const totalInvested = acquisitionPrice + rehabCosts;
      equityMultiple = currentValue / totalInvested;
    }
  }
  
  // Calculate income and expenses from deal analyzer data or estimates
  let grossRentalIncome = 0;
  let effectiveGrossIncome = 0;
  let totalExpenses = 0;
  let noi = 0;
  let debtService = 0;
  
  if (dealData) {
    // Use Deal Analyzer data for detailed calculations
    if (dealData.rentRoll && Array.isArray(dealData.rentRoll)) {
      grossRentalIncome = dealData.rentRoll.reduce((sum: number, unit: any) => 
        sum + (parseFloat(unit.proFormaRent) || 0), 0) * 12;
    }
    
    const vacancyRate = dealData.assumptions?.vacancyRate || 0.05;
    effectiveGrossIncome = grossRentalIncome * (1 - vacancyRate);
    
    // Calculate expenses
    if (dealData.expenses) {
      totalExpenses = Object.values(dealData.expenses).reduce((sum: number, val: any) => 
        sum + (parseFloat(val) || 0), 0);
    }
    
    noi = effectiveGrossIncome - totalExpenses;
    
    // Calculate debt service from active loan or assumptions
    if (dealData.assumptions) {
      const loanAmount = acquisitionPrice * (dealData.assumptions.loanPercentage || 0.8);
      const interestRate = dealData.assumptions.interestRate || 0.07;
      const loanTermYears = dealData.assumptions.loanTermYears || 30;
      
      if (loanAmount > 0 && interestRate > 0) {
        const monthlyRate = interestRate / 12;
        const numPayments = loanTermYears * 12;
        const monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
          (Math.pow(1 + monthlyRate, numPayments) - 1);
        debtService = monthlyPayment * 12;
      }
    }
  } else {
    // Estimate based on property data
    grossRentalIncome = monthlyCashFlow * 12 / 0.3; // Estimate assuming 30% net margin
    effectiveGrossIncome = grossRentalIncome * 0.95; // Assume 5% vacancy
    totalExpenses = effectiveGrossIncome - annualCashFlow - (acquisitionPrice * 0.8 * 0.07); // Rough estimate
    noi = effectiveGrossIncome - totalExpenses;
    debtService = acquisitionPrice * 0.8 * 0.07; // Estimate 80% LTV at 7%
  }
  
  // Additional ratios
  const capRate = arv > 0 ? (noi / arv) * 100 : 0;
  const dscr = debtService > 0 ? noi / debtService : 0;
  const ltv = arv > 0 ? ((acquisitionPrice * 0.8) / arv) * 100 : 0; // Estimate loan balance
  const breakEvenOccupancy = grossRentalIncome > 0 ? 
    ((totalExpenses + debtService) / grossRentalIncome) * 100 : 0;
  
  const currentEquity = arv - (acquisitionPrice * 0.8); // Estimate current equity
  const totalCashInvested = initialCapitalRequired;
  
  return {
    monthlyCashFlow,
    annualCashFlow,
    arv,
    totalProfit,
    equityMultiple,
    cashOnCashReturn,
    noi,
    capRate,
    dscr,
    ltv,
    breakEvenOccupancy,
    grossRentalIncome,
    effectiveGrossIncome,
    totalExpenses,
    debtService,
    initialCapitalRequired,
    totalCashInvested,
    currentEquity
  };
}

/**
 * Format currency values consistently
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format percentage values consistently
 */
export function formatPercentage(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
}

/**
 * Safe number parsing with fallback
 */
export function parseNumber(value: string | number | undefined | null): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value.replace(/[,$]/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}