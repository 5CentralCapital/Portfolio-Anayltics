/**
 * Comprehensive Property Calculation Engine
 * 
 * Data Source Priority (highest to lowest):
 * 1. Live/Uploaded Data (lease uploads, mortgage statements, user edits)
 * 2. Normalized Database Data (property tables)
 * 3. Deal Analyzer Data (assumptions and defaults)
 * 4. Market Standard Defaults
 */

export interface PropertyFinancials {
  // Income
  grossRentalIncome: number;
  totalOtherIncome: number;
  effectiveGrossIncome: number;
  
  // Expenses
  monthlyExpenses: number;
  annualExpenses: number;
  expenseBreakdown: {
    insurance: number;
    taxes: number;
    maintenance: number;
    management: number;
    utilities: number;
    other: number;
  };
  
  // Cash Flow
  netOperatingIncome: number;
  monthlyNOI: number;
  monthlyDebtService: number;
  annualDebtService: number;
  monthlyCashFlow: number;
  annualCashFlow: number;
  
  // Investment Metrics
  capRate: number;
  cashOnCashReturn: number;
  equityMultiple: number;
  dscr: number;
  
  // Property Valuation
  currentARV: number;
  totalInvestedCapital: number;
  currentEquityValue: number;
  currentDebt: number;
}

export interface DataSources {
  // Live data (highest priority)
  liveRentRoll?: any[];
  liveLoanData?: any[];
  editedExpenses?: any;
  
  // Normalized database data
  dbRentRoll?: any[];
  dbLoans?: any[];
  dbAssumptions?: any;
  
  // Deal Analyzer data (fallback)
  dealAnalyzerData?: any;
  
  // Property base data
  property: any;
}

export class PropertyCalculationEngine {
  
  /**
   * Calculate comprehensive property financials using proper data source priorities
   */
  static calculatePropertyFinancials(sources: DataSources): PropertyFinancials {
    try {
      // 1. INCOME CALCULATIONS
      const incomeData = this.calculateIncome(sources);
      
      // 2. EXPENSE CALCULATIONS  
      const expenseData = this.calculateExpenses(sources, incomeData.effectiveGrossIncome);
      
      // 3. DEBT SERVICE CALCULATIONS
      const debtData = this.calculateDebtService(sources);
      
      // 4. CASH FLOW CALCULATIONS
      const cashFlowData = this.calculateCashFlow(incomeData, expenseData, debtData);
      
      // 5. INVESTMENT METRICS
      const investmentData = this.calculateInvestmentMetrics(sources, cashFlowData, debtData);
      
      return {
        ...incomeData,
        ...expenseData,
        ...debtData,
        ...cashFlowData,
        ...investmentData
      };
      
    } catch (error) {
      console.error('Error in property calculations:', error);
      return this.getDefaultFinancials();
    }
  }
  
  /**
   * INCOME CALCULATIONS
   * Priority: Live rent roll > DB rent roll > Deal Analyzer > Assumptions
   */
  private static calculateIncome(sources: DataSources) {
    let grossRentalIncome = 0;
    let totalOtherIncome = 0;
    
    // 1. Try live rent roll data (from lease uploads)
    if (sources.liveRentRoll && sources.liveRentRoll.length > 0) {
      console.log('Using live rent roll data for income calculation');
      grossRentalIncome = sources.liveRentRoll.reduce((sum, unit) => {
        const rent = parseFloat(unit.currentRent || unit.rent || '0');
        return sum + rent;
      }, 0) * 12; // Annual
    }
    
    // 2. Fallback to normalized DB rent roll
    else if (sources.dbRentRoll && sources.dbRentRoll.length > 0) {
      console.log('Using database rent roll data for income calculation');
      grossRentalIncome = sources.dbRentRoll.reduce((sum, unit) => {
        const rent = parseFloat(unit.currentRent || unit.proFormaRent || '0');
        return sum + rent;
      }, 0) * 12; // Annual
    }
    
    // 3. Fallback to Deal Analyzer rent roll
    else if (sources.dealAnalyzerData?.rentRoll?.length > 0) {
      console.log('Using Deal Analyzer rent roll data for income calculation');
      grossRentalIncome = sources.dealAnalyzerData.rentRoll.reduce((sum: number, unit: any) => {
        const rent = parseFloat(unit.currentRent || unit.marketRent || unit.proFormaRent || '0');
        return sum + rent;
      }, 0) * 12; // Annual
    }
    
    // 4. Fallback to unit types data
    else if (sources.dealAnalyzerData?.unitTypes?.length > 0) {
      console.log('Using unit types data for income calculation');
      grossRentalIncome = sources.dealAnalyzerData.unitTypes.reduce((sum: number, unitType: any) => {
        const units = parseInt(unitType.units || unitType.count || '1');
        const rent = parseFloat(unitType.marketRent || unitType.rent || '0');
        return sum + (units * rent);
      }, 0) * 12; // Annual
    }
    
    // Calculate other income
    if (sources.dealAnalyzerData?.otherIncome?.length > 0) {
      totalOtherIncome = sources.dealAnalyzerData.otherIncome.reduce((sum: number, income: any) => {
        return sum + parseFloat(income.annualAmount || '0');
      }, 0);
    }
    
    // Apply vacancy rate
    const vacancyRate = this.getVacancyRate(sources);
    const vacancyLoss = grossRentalIncome * vacancyRate;
    const effectiveGrossIncome = grossRentalIncome - vacancyLoss + totalOtherIncome;
    
    console.log('Income calculation result:', { 
      grossRentalIncome, 
      totalOtherIncome, 
      vacancyRate, 
      effectiveGrossIncome 
    });
    
    return {
      grossRentalIncome,
      totalOtherIncome,
      effectiveGrossIncome
    };
  }
  
  /**
   * EXPENSE CALCULATIONS
   * Priority: User edited expenses > DB expenses > Deal Analyzer > Percentage-based defaults
   */
  private static calculateExpenses(sources: DataSources, effectiveGrossIncome: number) {
    let monthlyExpenses = 0;
    let expenseBreakdown = {
      insurance: 0,
      taxes: 0,
      maintenance: 0,
      management: 0,
      utilities: 0,
      other: 0
    };
    
    // 1. Try user-edited expenses (highest priority)
    if (sources.editedExpenses) {
      console.log('Using user-edited expenses');
      monthlyExpenses = this.calculateFromEditedExpenses(sources.editedExpenses);
      expenseBreakdown = this.getExpenseBreakdown(sources.editedExpenses);
    }
    
    // 2. Try Deal Analyzer expenses
    else if (sources.dealAnalyzerData?.expenses?.length > 0) {
      console.log('Using Deal Analyzer expenses');
      monthlyExpenses = this.calculateFromDealAnalyzerExpenses(
        sources.dealAnalyzerData.expenses, 
        effectiveGrossIncome
      );
      expenseBreakdown = this.getDealAnalyzerExpenseBreakdown(sources.dealAnalyzerData.expenses);
    }
    
    // 3. Fallback to percentage-based calculation
    else {
      console.log('Using percentage-based expense calculation');
      const expenseRatio = this.getExpenseRatio(sources);
      monthlyExpenses = (effectiveGrossIncome / 12) * expenseRatio;
      expenseBreakdown = this.getDefaultExpenseBreakdown(monthlyExpenses);
    }
    
    const annualExpenses = monthlyExpenses * 12;
    
    console.log('Expense calculation result:', { 
      monthlyExpenses, 
      annualExpenses, 
      expenseBreakdown 
    });
    
    return {
      monthlyExpenses,
      annualExpenses,
      expenseBreakdown
    };
  }
  
  /**
   * DEBT SERVICE CALCULATIONS
   * Priority: Live loan data (actual payments) > DB loans > Deal Analyzer loans > Calculated
   */
  private static calculateDebtService(sources: DataSources) {
    let monthlyDebtService = 0;
    let currentDebt = 0;
    
    // 1. Try live loan data (from mortgage uploads)
    if (sources.liveLoanData && sources.liveLoanData.length > 0) {
      console.log('Using live loan data for debt service');
      const activeLoan = sources.liveLoanData.find(loan => loan.isActive) || sources.liveLoanData[0];
      if (activeLoan) {
        monthlyDebtService = parseFloat(activeLoan.monthlyPayment || '0');
        currentDebt = parseFloat(
          activeLoan.currentBalance || 
          activeLoan.principalBalance || 
          activeLoan.balance || 
          activeLoan.originalAmount || 
          '0'
        );
      }
    }
    
    // 2. Try DB loan data
    else if (sources.dbLoans && sources.dbLoans.length > 0) {
      console.log('Using database loan data for debt service');
      const activeLoan = sources.dbLoans.find(loan => loan.isActive) || sources.dbLoans[0];
      if (activeLoan) {
        monthlyDebtService = parseFloat(activeLoan.monthlyPayment || '0');
        currentDebt = parseFloat(activeLoan.loanAmount || activeLoan.amount || '0');
      }
    }
    
    // 3. Try Deal Analyzer loan data
    else if (sources.dealAnalyzerData?.loans?.length > 0) {
      console.log('Using Deal Analyzer loan data for debt service');
      const activeLoan = sources.dealAnalyzerData.loans.find((loan: any) => loan.isActive) || 
                         sources.dealAnalyzerData.loans[0];
      if (activeLoan) {
        monthlyDebtService = parseFloat(activeLoan.monthlyPayment || '0');
        currentDebt = parseFloat(activeLoan.loanAmount || '0');
      }
    }
    
    // 4. Calculate from assumptions if no loan data available
    else {
      console.log('Calculating debt service from assumptions');
      const loanAmount = this.calculateLoanAmount(sources);
      const interestRate = this.getInterestRate(sources);
      const termYears = this.getLoanTerm(sources);
      
      if (loanAmount > 0 && interestRate > 0) {
        monthlyDebtService = this.calculateMonthlyPayment(loanAmount, interestRate, termYears);
        currentDebt = loanAmount;
      }
    }
    
    const annualDebtService = monthlyDebtService * 12;
    
    console.log('Debt service calculation result:', { 
      monthlyDebtService, 
      annualDebtService, 
      currentDebt 
    });
    
    return {
      monthlyDebtService,
      annualDebtService,
      currentDebt
    };
  }
  
  /**
   * CASH FLOW CALCULATIONS
   */
  private static calculateCashFlow(incomeData: any, expenseData: any, debtData: any) {
    const monthlyNOI = (incomeData.effectiveGrossIncome / 12) - expenseData.monthlyExpenses;
    const netOperatingIncome = monthlyNOI * 12;
    const monthlyCashFlow = monthlyNOI - debtData.monthlyDebtService;
    const annualCashFlow = monthlyCashFlow * 12;
    
    console.log('Cash flow calculation result:', { 
      monthlyNOI, 
      netOperatingIncome, 
      monthlyCashFlow, 
      annualCashFlow 
    });
    
    return {
      netOperatingIncome,
      monthlyNOI,
      monthlyCashFlow,
      annualCashFlow
    };
  }
  
  /**
   * INVESTMENT METRICS CALCULATIONS
   */
  private static calculateInvestmentMetrics(sources: DataSources, cashFlowData: any, debtData: any) {
    const purchasePrice = this.getPurchasePrice(sources);
    const capitalRequired = this.getCapitalRequired(sources);
    const exitCapRate = this.getExitCapRate(sources);
    
    // Calculate ARV
    const currentARV = cashFlowData.netOperatingIncome > 0 && exitCapRate > 0 
      ? cashFlowData.netOperatingIncome / exitCapRate 
      : this.getARVFromProperty(sources);
    
    // Calculate investment metrics
    const capRate = purchasePrice > 0 ? (cashFlowData.netOperatingIncome / purchasePrice) * 100 : 0;
    const cashOnCashReturn = capitalRequired > 0 ? (cashFlowData.annualCashFlow / capitalRequired) * 100 : 0;
    const currentEquityValue = currentARV - debtData.currentDebt;
    const equityMultiple = capitalRequired > 0 ? currentEquityValue / capitalRequired : 0;
    const dscr = debtData.annualDebtService > 0 ? cashFlowData.netOperatingIncome / debtData.annualDebtService : 0;
    
    console.log('Investment metrics result:', { 
      currentARV, 
      capRate, 
      cashOnCashReturn, 
      equityMultiple, 
      dscr 
    });
    
    return {
      capRate,
      cashOnCashReturn,
      equityMultiple,
      dscr,
      currentARV,
      totalInvestedCapital: capitalRequired,
      currentEquityValue
    };
  }
  
  // Helper methods for data extraction with proper fallbacks
  private static getVacancyRate(sources: DataSources): number {
    return parseFloat(
      sources.dbAssumptions?.vacancyRate ||
      sources.dealAnalyzerData?.assumptions?.vacancyRate ||
      '0.05' // 5% default
    );
  }
  
  private static getExpenseRatio(sources: DataSources): number {
    return parseFloat(
      sources.dbAssumptions?.expenseRatio ||
      sources.dealAnalyzerData?.assumptions?.expenseRatio ||
      '0.45' // 45% default
    );
  }
  
  private static getInterestRate(sources: DataSources): number {
    return parseFloat(
      sources.dbAssumptions?.interestRate ||
      sources.dealAnalyzerData?.assumptions?.interestRate ||
      '0.07' // 7% default
    );
  }
  
  private static getLoanTerm(sources: DataSources): number {
    return parseInt(
      sources.dbAssumptions?.loanTermYears ||
      sources.dealAnalyzerData?.assumptions?.loanTermYears ||
      '30' // 30 years default
    );
  }
  
  private static getPurchasePrice(sources: DataSources): number {
    return parseFloat(
      sources.dbAssumptions?.purchasePrice ||
      sources.dealAnalyzerData?.assumptions?.purchasePrice ||
      sources.property?.acquisitionPrice ||
      '0'
    );
  }
  
  private static getCapitalRequired(sources: DataSources): number {
    return parseFloat(sources.property?.initialCapitalRequired || '0');
  }
  
  private static getExitCapRate(sources: DataSources): number {
    return parseFloat(
      sources.dbAssumptions?.exitCapRate ||
      sources.dbAssumptions?.marketCapRate ||
      sources.dealAnalyzerData?.assumptions?.exitCapRate ||
      sources.dealAnalyzerData?.assumptions?.marketCapRate ||
      '0.055' // 5.5% default
    );
  }
  
  private static getARVFromProperty(sources: DataSources): number {
    return parseFloat(sources.property?.arvAtTimePurchased || '0');
  }
  
  private static calculateLoanAmount(sources: DataSources): number {
    const purchasePrice = this.getPurchasePrice(sources);
    const loanPercentage = parseFloat(
      sources.dbAssumptions?.loanPercentage ||
      sources.dealAnalyzerData?.assumptions?.loanPercentage ||
      '0.8' // 80% default
    );
    return purchasePrice * loanPercentage;
  }
  
  private static calculateMonthlyPayment(loanAmount: number, annualRate: number, years: number): number {
    const monthlyRate = annualRate / 12;
    const numPayments = years * 12;
    
    if (monthlyRate === 0) return loanAmount / numPayments;
    
    return loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
           (Math.pow(1 + monthlyRate, numPayments) - 1);
  }
  
  // Expense calculation helpers
  private static calculateFromEditedExpenses(editedExpenses: any): number {
    // Handle user-edited expenses from property modal
    if (typeof editedExpenses === 'object' && !Array.isArray(editedExpenses)) {
      return Object.values(editedExpenses).reduce((sum: number, expense: any) => {
        return sum + parseFloat(expense.monthlyAmount || expense.amount || '0');
      }, 0);
    }
    return 0;
  }
  
  private static calculateFromDealAnalyzerExpenses(expenses: any[], effectiveGrossIncome: number): number {
    return expenses.reduce((sum, expense) => {
      if (expense.isPercentage) {
        const percentage = parseFloat(expense.percentage || '0') / 100;
        return sum + (effectiveGrossIncome / 12) * percentage;
      } else {
        return sum + parseFloat(expense.monthlyAmount || '0');
      }
    }, 0);
  }
  
  private static getExpenseBreakdown(editedExpenses: any) {
    // Extract expense breakdown from edited expenses
    return {
      insurance: parseFloat(editedExpenses?.insurance?.monthlyAmount || '0'),
      taxes: parseFloat(editedExpenses?.taxes?.monthlyAmount || '0'),
      maintenance: parseFloat(editedExpenses?.maintenance?.monthlyAmount || '0'),
      management: parseFloat(editedExpenses?.management?.monthlyAmount || '0'),
      utilities: parseFloat(editedExpenses?.utilities?.monthlyAmount || '0'),
      other: parseFloat(editedExpenses?.other?.monthlyAmount || '0')
    };
  }
  
  private static getDealAnalyzerExpenseBreakdown(expenses: any[]) {
    const breakdown = {
      insurance: 0,
      taxes: 0,
      maintenance: 0,
      management: 0,
      utilities: 0,
      other: 0
    };
    
    expenses.forEach(expense => {
      const amount = parseFloat(expense.monthlyAmount || '0');
      const category = expense.category?.toLowerCase() || 'other';
      
      if (category.includes('insurance')) breakdown.insurance += amount;
      else if (category.includes('tax')) breakdown.taxes += amount;
      else if (category.includes('maintenance') || category.includes('repair')) breakdown.maintenance += amount;
      else if (category.includes('management')) breakdown.management += amount;
      else if (category.includes('utilities')) breakdown.utilities += amount;
      else breakdown.other += amount;
    });
    
    return breakdown;
  }
  
  private static getDefaultExpenseBreakdown(monthlyExpenses: number) {
    // Default breakdown percentages
    return {
      insurance: monthlyExpenses * 0.15,  // 15%
      taxes: monthlyExpenses * 0.25,      // 25%
      maintenance: monthlyExpenses * 0.20, // 20%
      management: monthlyExpenses * 0.20,  // 20%
      utilities: monthlyExpenses * 0.10,   // 10%
      other: monthlyExpenses * 0.10        // 10%
    };
  }
  
  private static getDefaultFinancials(): PropertyFinancials {
    return {
      grossRentalIncome: 0,
      totalOtherIncome: 0,
      effectiveGrossIncome: 0,
      monthlyExpenses: 0,
      annualExpenses: 0,
      expenseBreakdown: {
        insurance: 0,
        taxes: 0,
        maintenance: 0,
        management: 0,
        utilities: 0,
        other: 0
      },
      netOperatingIncome: 0,
      monthlyNOI: 0,
      monthlyDebtService: 0,
      annualDebtService: 0,
      monthlyCashFlow: 0,
      annualCashFlow: 0,
      capRate: 0,
      cashOnCashReturn: 0,
      equityMultiple: 0,
      dscr: 0,
      currentARV: 0,
      totalInvestedCapital: 0,
      currentEquityValue: 0,
      currentDebt: 0
    };
  }
}