/**
 * Unified Calculation Engine - Single Source of Truth
 * 
 * This is the ONLY place where financial calculations should happen.
 * Used by both server (Node.js) and client (React).
 * 
 * All calculations follow consistent rules:
 * - Store values as decimals (0.1 for 10%)
 * - Return raw numbers (not formatted strings)
 * - Use consistent field names
 * - Follow documented formulas
 */

export interface PropertyData {
  // Basic property info
  id: number;
  status: 'Under Contract' | 'Rehabbing' | 'Cashflowing' | 'Sold';
  address: string;
  apartments: number;
  acquisitionPrice: string | number;
  initialCapitalRequired: string | number;
  salePrice?: string | number;
  totalProfits?: string | number;
  arvAtTimePurchased?: string | number;
  rehabCosts?: string | number;
  
  // Related data
  rentRoll?: any[];
  propertyLoans?: any[];
  assumptions?: any;
  expenses?: any[];
  unitTypes?: any[];
  
  // Legacy data
  dealAnalyzerData?: any;
}

export interface CalculationResult {
  // Income
  monthlyGrossRent: number;
  annualGrossRent: number;
  vacancyLoss: number;
  otherIncome: number;
  effectiveGrossIncome: number;
  
  // Expenses
  monthlyOperatingExpenses: number;
  annualOperatingExpenses: number;
  managementFee: number;
  
  // NOI & Cash Flow
  monthlyNOI: number;
  annualNOI: number;
  monthlyDebtService: number;
  annualDebtService: number;
  monthlyCashFlow: number;
  annualCashFlow: number;
  
  // Returns & Ratios (as decimals, not percentages)
  capRate: number; // 0.09 for 9%
  cashOnCashReturn: number; // 0.131 for 13.1%
  dscr: number;
  
  // Valuation
  currentARV: number;
  totalInvestedCapital: number;
  currentDebt: number;
  currentEquity: number;
  equityMultiple: number;
  
  // Detailed breakdowns
  expenseBreakdown: {
    taxes: number;
    insurance: number;
    utilities: number;
    maintenance: number;
    management: number;
    other: number;
  };
}

export class UnifiedCalculationEngine {
  
  /**
   * Main calculation method - calculates all property metrics
   */
  static calculate(property: PropertyData): CalculationResult {
    // Step 1: Calculate Income
    const income = this.calculateIncome(property);
    
    // Step 2: Calculate Expenses
    const expenses = this.calculateExpenses(property, income.effectiveGrossIncome);
    
    // Step 3: Calculate NOI
    const noi = this.calculateNOI(income, expenses);
    
    // Step 4: Calculate Debt Service
    const debtService = this.calculateDebtService(property);
    
    // Step 5: Calculate Cash Flow
    const cashFlow = this.calculateCashFlow(noi, debtService);
    
    // Step 6: Calculate Returns & Ratios
    const returns = this.calculateReturns(property, noi, cashFlow, debtService);
    
    // Step 7: Calculate Valuation
    const valuation = this.calculateValuation(property, noi, debtService);
    
    return {
      ...income,
      ...expenses,
      ...noi,
      ...debtService,
      ...cashFlow,
      ...returns,
      ...valuation,
      expenseBreakdown: expenses.expenseBreakdown
    };
  }
  
  /**
   * INCOME CALCULATIONS
   */
  private static calculateIncome(property: PropertyData) {
    let monthlyGrossRent = 0;
    
    // Priority 1: Live rent roll with tenant data
    if (property.rentRoll && property.rentRoll.length > 0) {
      const hasLiveData = property.rentRoll.some(unit => 
        unit.tenantName || unit.leaseStart || unit.leaseEnd
      );
      
      if (hasLiveData || property.rentRoll.some(unit => this.parseNumber(unit.currentRent) > 0)) {
        monthlyGrossRent = property.rentRoll.reduce((sum, unit) => {
          const rent = this.parseNumber(unit.currentRent || unit.proFormaRent || unit.rent || 0);
          return sum + rent;
        }, 0);
      }
    }
    
    // Priority 2: Unit types from database
    if (monthlyGrossRent === 0 && property.unitTypes && property.unitTypes.length > 0) {
      monthlyGrossRent = property.unitTypes.reduce((sum, unitType) => {
        const units = this.parseNumber(unitType.units || unitType.count || 1);
        const rent = this.parseNumber(unitType.marketRent || unitType.rent || 0);
        return sum + (units * rent);
      }, 0);
    }
    
    // Priority 3: Deal Analyzer data
    if (monthlyGrossRent === 0 && property.dealAnalyzerData) {
      const data = this.parseDealAnalyzerData(property.dealAnalyzerData);
      
      if (data?.rentRoll?.length > 0) {
        monthlyGrossRent = data.rentRoll.reduce((sum: number, unit: any) => {
          const rent = this.parseNumber(unit.currentRent || unit.marketRent || unit.rent || 0);
          return sum + rent;
        }, 0);
      } else if (data?.unitTypes?.length > 0) {
        monthlyGrossRent = data.unitTypes.reduce((sum: number, unitType: any) => {
          const units = this.parseNumber(unitType.units || unitType.count || 1);
          const rent = this.parseNumber(unitType.marketRent || unitType.rent || 0);
          return sum + (units * rent);
        }, 0);
      }
    }
    
    const annualGrossRent = monthlyGrossRent * 12;
    
    // Get vacancy rate
    const vacancyRate = this.getVacancyRate(property);
    const vacancyLoss = annualGrossRent * vacancyRate;
    
    // Other income
    const otherIncome = this.calculateOtherIncome(property);
    
    const effectiveGrossIncome = annualGrossRent - vacancyLoss + otherIncome;
    
    return {
      monthlyGrossRent,
      annualGrossRent,
      vacancyLoss,
      otherIncome,
      effectiveGrossIncome
    };
  }
  
  /**
   * EXPENSE CALCULATIONS
   */
  private static calculateExpenses(property: PropertyData, effectiveGrossIncome: number) {
    let annualOperatingExpenses = 0;
    let expenseBreakdown = {
      taxes: 0,
      insurance: 0,
      utilities: 0,
      maintenance: 0,
      management: 0,
      other: 0
    };
    
    // Try to get detailed expenses
    if (property.expenses && property.expenses.length > 0) {
      property.expenses.forEach(expense => {
        const amount = this.parseNumber(expense.annualAmount || 0);
        annualOperatingExpenses += amount;
        
        // Categorize expense
        const category = this.categorizeExpense(expense.expenseName || expense.expenseType);
        expenseBreakdown[category as keyof typeof expenseBreakdown] += amount;
      });
    } else if (property.dealAnalyzerData) {
      // Try Deal Analyzer expenses
      const data = this.parseDealAnalyzerData(property.dealAnalyzerData);
      if (data?.expenses) {
        Object.entries(data.expenses).forEach(([key, value]) => {
          const amount = this.parseNumber(value as any) * 12; // Convert to annual
          annualOperatingExpenses += amount;
          
          const category = this.categorizeExpense(key);
          expenseBreakdown[category as keyof typeof expenseBreakdown] += amount;
        });
      }
    } else {
      // Use expense ratio as fallback
      const expenseRatio = this.getExpenseRatio(property);
      annualOperatingExpenses = effectiveGrossIncome * expenseRatio;
      
      // Default breakdown
      expenseBreakdown = {
        taxes: annualOperatingExpenses * 0.25,
        insurance: annualOperatingExpenses * 0.15,
        utilities: annualOperatingExpenses * 0.15,
        maintenance: annualOperatingExpenses * 0.25,
        management: annualOperatingExpenses * 0.08,
        other: annualOperatingExpenses * 0.12
      };
    }
    
    // Add management fee if not already included
    const managementRate = this.getManagementFeeRate(property);
    const managementFee = effectiveGrossIncome * managementRate;
    
    if (expenseBreakdown.management === 0) {
      annualOperatingExpenses += managementFee;
      expenseBreakdown.management = managementFee;
    }
    
    return {
      monthlyOperatingExpenses: annualOperatingExpenses / 12,
      annualOperatingExpenses,
      managementFee,
      expenseBreakdown
    };
  }
  
  /**
   * NOI CALCULATIONS
   */
  private static calculateNOI(income: any, expenses: any) {
    const annualNOI = income.effectiveGrossIncome - expenses.annualOperatingExpenses;
    const monthlyNOI = annualNOI / 12;
    
    return {
      monthlyNOI,
      annualNOI
    };
  }
  
  /**
   * DEBT SERVICE CALCULATIONS
   */
  private static calculateDebtService(property: PropertyData) {
    let monthlyDebtService = 0;
    let currentDebt = 0;
    
    // Find active loan
    if (property.propertyLoans && property.propertyLoans.length > 0) {
      const activeLoan = property.propertyLoans.find(loan => loan.isActive) || property.propertyLoans[0];
      
      if (activeLoan) {
        monthlyDebtService = this.parseNumber(activeLoan.monthlyPayment || 0);
        currentDebt = this.parseNumber(
          activeLoan.currentBalance || 
          activeLoan.principalBalance || 
          activeLoan.originalAmount || 
          0
        );
      }
    }
    
    // Fallback to calculation if no loan data
    if (monthlyDebtService === 0) {
      const loanAmount = this.calculateLoanAmount(property);
      const rate = this.getInterestRate(property);
      const termYears = this.getLoanTerm(property);
      
      if (loanAmount > 0 && rate > 0) {
        monthlyDebtService = this.calculateMonthlyPayment(loanAmount, rate, termYears);
        currentDebt = loanAmount;
      }
    }
    
    return {
      monthlyDebtService,
      annualDebtService: monthlyDebtService * 12,
      currentDebt
    };
  }
  
  /**
   * CASH FLOW CALCULATIONS
   */
  private static calculateCashFlow(noi: any, debtService: any) {
    const monthlyCashFlow = noi.monthlyNOI - debtService.monthlyDebtService;
    const annualCashFlow = noi.annualNOI - debtService.annualDebtService;
    
    return {
      monthlyCashFlow,
      annualCashFlow
    };
  }
  
  /**
   * RETURNS & RATIOS CALCULATIONS
   */
  private static calculateReturns(property: PropertyData, noi: any, cashFlow: any, debtService: any) {
    // Cap Rate = NOI / Purchase Price
    const purchasePrice = this.parseNumber(property.acquisitionPrice || 0);
    const capRate = purchasePrice > 0 ? noi.annualNOI / purchasePrice : 0;
    
    // Cash-on-Cash Return = Annual Cash Flow / Total Invested Capital
    const totalInvestedCapital = this.calculateTotalInvestedCapital(property);
    const cashOnCashReturn = totalInvestedCapital > 0 ? cashFlow.annualCashFlow / totalInvestedCapital : 0;
    
    // DSCR = NOI / Debt Service
    const dscr = debtService.annualDebtService > 0 ? noi.annualNOI / debtService.annualDebtService : 0;
    
    return {
      capRate,
      cashOnCashReturn,
      dscr
    };
  }
  
  /**
   * VALUATION CALCULATIONS
   */
  private static calculateValuation(property: PropertyData, noi: any, debtService: any) {
    // Calculate ARV
    const currentARV = this.calculateARV(property, noi.annualNOI);
    
    // Total invested capital
    const totalInvestedCapital = this.calculateTotalInvestedCapital(property);
    
    // Current equity = ARV - Debt
    const currentEquity = currentARV - debtService.currentDebt;
    
    // Equity Multiple calculation
    let equityMultiple = 0;
    if (property.status === 'Sold') {
      const totalProfit = this.parseNumber(property.totalProfits || 0);
      equityMultiple = totalInvestedCapital > 0 ? totalProfit / totalInvestedCapital : 0;
    } else {
      const allInCost = this.calculateAllInCost(property);
      const totalReturn = Math.max(0, currentARV - allInCost);
      equityMultiple = totalInvestedCapital > 0 ? totalReturn / totalInvestedCapital : 0;
    }
    
    return {
      currentARV,
      totalInvestedCapital,
      currentEquity,
      equityMultiple
    };
  }
  
  /**
   * HELPER METHODS
   */
  
  private static parseNumber(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value.replace(/[^0-9.-]/g, ''));
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }
  
  private static parseDealAnalyzerData(data: any): any {
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch {
        return null;
      }
    }
    return data;
  }
  
  private static getVacancyRate(property: PropertyData): number {
    const rate = this.parseNumber(
      property.assumptions?.vacancyRate ||
      property.dealAnalyzerData?.assumptions?.vacancyRate ||
      0.05
    );
    // If stored as percentage (5), convert to decimal (0.05)
    return rate > 1 ? rate / 100 : rate;
  }
  
  private static getExpenseRatio(property: PropertyData): number {
    const ratio = this.parseNumber(
      property.assumptions?.expenseRatio ||
      property.dealAnalyzerData?.assumptions?.expenseRatio ||
      0.45
    );
    return ratio > 1 ? ratio / 100 : ratio;
  }
  
  private static getManagementFeeRate(property: PropertyData): number {
    const rate = this.parseNumber(
      property.assumptions?.managementFee ||
      property.dealAnalyzerData?.assumptions?.managementFee ||
      0.08
    );
    return rate > 1 ? rate / 100 : rate;
  }
  
  private static getInterestRate(property: PropertyData): number {
    const rate = this.parseNumber(
      property.assumptions?.interestRate ||
      property.dealAnalyzerData?.assumptions?.interestRate ||
      0.07
    );
    return rate > 1 ? rate / 100 : rate;
  }
  
  private static getLoanTerm(property: PropertyData): number {
    return this.parseNumber(
      property.assumptions?.loanTermYears ||
      property.dealAnalyzerData?.assumptions?.loanTermYears ||
      30
    );
  }
  
  private static calculateLoanAmount(property: PropertyData): number {
    const purchasePrice = this.parseNumber(property.acquisitionPrice || 0);
    const loanPercentage = this.parseNumber(
      property.assumptions?.loanPercentage ||
      property.dealAnalyzerData?.assumptions?.loanPercentage ||
      0.75
    );
    const ltv = loanPercentage > 1 ? loanPercentage / 100 : loanPercentage;
    return purchasePrice * ltv;
  }
  
  private static calculateMonthlyPayment(principal: number, annualRate: number, years: number): number {
    const monthlyRate = annualRate / 12;
    const numPayments = years * 12;
    
    if (monthlyRate === 0) return principal / numPayments;
    
    return principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
           (Math.pow(1 + monthlyRate, numPayments) - 1);
  }
  
  private static calculateOtherIncome(property: PropertyData): number {
    // TODO: Implement other income calculation from property.incomeOther table
    return 0;
  }
  
  private static categorizeExpense(expenseName: string): string {
    const name = expenseName.toLowerCase();
    
    if (name.includes('tax')) return 'taxes';
    if (name.includes('insurance')) return 'insurance';
    if (name.includes('utility') || name.includes('utilities')) return 'utilities';
    if (name.includes('maintenance') || name.includes('repair')) return 'maintenance';
    if (name.includes('management') || name.includes('property mgmt')) return 'management';
    
    return 'other';
  }
  
  private static calculateTotalInvestedCapital(property: PropertyData): number {
    // Use the property's initial capital required if available
    const capitalRequired = this.parseNumber(property.initialCapitalRequired || 0);
    if (capitalRequired > 0) return capitalRequired;
    
    // Otherwise calculate: Down payment + closing costs + out-of-pocket rehab
    const purchasePrice = this.parseNumber(property.acquisitionPrice || 0);
    const loanAmount = this.calculateLoanAmount(property);
    const downPayment = purchasePrice - loanAmount;
    
    // Estimate closing costs at 2% of purchase price
    const closingCosts = purchasePrice * 0.02;
    
    return downPayment + closingCosts;
  }
  
  private static calculateARV(property: PropertyData, annualNOI: number): number {
    // Priority 1: Use sale price for sold properties
    if (property.status === 'Sold' && property.salePrice) {
      return this.parseNumber(property.salePrice);
    }
    
    // Priority 2: Use database ARV if available
    const dbARV = this.parseNumber(property.arvAtTimePurchased || 0);
    if (dbARV > 0) {
      return dbARV;
    }
    
    // Priority 3: Calculate using cap rate method
    const marketCapRate = this.parseNumber(
      property.assumptions?.marketCapRate ||
      property.dealAnalyzerData?.assumptions?.marketCapRate ||
      0.055
    );
    const capRate = marketCapRate > 1 ? marketCapRate / 100 : marketCapRate;
    
    if (annualNOI > 0 && capRate > 0) {
      return annualNOI / capRate;
    }
    
    // Priority 4: Fallback to purchase price
    return this.parseNumber(property.acquisitionPrice || 0);
  }
  
  private static calculateAllInCost(property: PropertyData): number {
    const purchasePrice = this.parseNumber(property.acquisitionPrice || 0);
    const rehabCosts = this.parseNumber(property.rehabCosts || 0);
    const closingCosts = purchasePrice * 0.02; // Estimate
    const holdingCosts = purchasePrice * 0.01; // Estimate
    
    return purchasePrice + rehabCosts + closingCosts + holdingCosts;
  }
}

/**
 * Export calculation function for easy use
 */
export function calculateProperty(property: PropertyData): CalculationResult {
  return UnifiedCalculationEngine.calculate(property);
}

/**
 * Backward compatibility mapping
 * Maps new unified field names to legacy field names used throughout the app
 */
export function mapToLegacyFields(result: CalculationResult): any {
  return {
    // Direct mappings from new structure
    ...result,
    
    // Legacy field mappings
    grossRentalIncome: result.annualGrossRent,
    effectiveGrossIncome: result.effectiveGrossIncome,
    totalOperatingExpenses: result.annualOperatingExpenses,
    netOperatingIncome: result.annualNOI,
    beforeTaxCashFlow: result.annualCashFlow,
    afterTaxCashFlow: result.annualCashFlow, // No tax calculation yet
    currentArv: result.currentARV,
    currentEquityValue: result.currentEquity,
    monthlyDebtService: result.monthlyDebtService,
    annualDebtService: result.annualDebtService,
    
    // Additional calculated fields for compatibility
    totalRehab: 0, // Not calculated in unified engine yet
    totalClosingCosts: 0, // Not calculated in unified engine yet
    totalHoldingCosts: 0, // Not calculated in unified engine yet
    allInCost: 0, // Not calculated in unified engine yet
    
    // NOI variations used in different places
    noiAnnual: result.annualNOI,
    noiMonthly: result.monthlyNOI,
    
    // Percentage conversions (stored as decimals, but some components expect percentages)
    capRatePercent: result.capRate * 100,
    cashOnCashReturnPercent: result.cashOnCashReturn * 100,
    
    // Risk metrics (not yet calculated)
    breakEvenOccupancy: 0,
    operatingExpenseRatio: result.annualOperatingExpenses / result.effectiveGrossIncome,
    loanToValue: result.currentDebt > 0 && result.currentARV > 0 ? result.currentDebt / result.currentARV : 0,
    debtYield: 0,
    irr: 0
  };
}

/**
 * Export calculation function with optional legacy mapping
 */
export function calculatePropertyWithLegacy(property: PropertyData): any {
  const result = UnifiedCalculationEngine.calculate(property);
  return mapToLegacyFields(result);
}

/**
 * Format helpers - keep formatting separate from calculations
 */
export const formatters = {
  currency: (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  },
  
  percentage: (value: number, decimals: number = 1): string => {
    return `${(value * 100).toFixed(decimals)}%`;
  },
  
  number: (value: number): string => {
    return new Intl.NumberFormat('en-US').format(value);
  }
};