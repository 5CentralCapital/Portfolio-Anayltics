/**
 * Centralized Calculation Service
 * Single source of truth for all property and portfolio financial calculations
 */

export interface PropertyKPIs {
  // Revenue metrics
  grossRentalIncome: number;
  effectiveGrossIncome: number;
  netOperatingIncome: number;
  totalOtherIncome: number;
  
  // Investment metrics
  capitalRequired: number;
  allInCost: number;
  arv: number;
  equityMultiple: number;
  cashOnCashReturn: number;
  currentEquityValue: number;
  
  // Cash flow metrics
  monthlyCashFlow: number;
  annualCashFlow: number;
  monthlyDebtService: number;
  annualDebtService: number;
  
  // Performance ratios
  dscr: number;
  capRate: number;
  breakEvenOccupancy: number;
  operatingExpenseRatio: number;
  
  // Cost breakdown
  acquisitionPrice: number;
  totalRehab: number;
  totalClosingCosts: number;
  totalHoldingCosts: number;
  downPayment: number;
  
  // Operational metrics
  monthlyExpenses: number;
  annualExpenses: number;
  vacancyRate: number;
  
  // Loan metrics
  loanAmount: number;
  loanToValue: number;
}

export interface PortfolioMetrics {
  totalAUM: number;
  totalUnits: number;
  totalEquity: number;
  totalEquityCreated: number;
  avgEquityMultiple: number;
  avgCashOnCashReturn: number;
  totalMonthlyCashFlow: number;
  totalAnnualCashFlow: number;
  pricePerUnit: number;
  totalProperties: number;
}

export interface DealAnalyzerData {
  assumptions?: any;
  unitTypes?: any[];
  rentRoll?: any[];
  otherIncome?: any[];
  expenses?: any[];
  rehabBudget?: any[];
  closingCosts?: any[];
  holdingCosts?: any[];
  loans?: any[];
  exitAnalysis?: any;
}

export class CalculationService {
  /**
   * Calculate comprehensive property KPIs from property data
   * This is the single source of truth for all property calculations
   */
  static calculatePropertyKPIs(property: any): PropertyKPIs {
    try {
      // Extract Deal Analyzer data if available
      const dealData: DealAnalyzerData = property.dealAnalyzerData || {};
      
      // Get assumptions with market standard defaults when missing
      const assumptions = dealData.assumptions || {};
      const purchasePrice = parseFloat(assumptions.purchasePrice || property.acquisitionPrice || '0');
      const vacancyRate = parseFloat(assumptions.vacancyRate || '0.05'); // 5% default vacancy
      const managementFee = parseFloat(assumptions.managementFee || '0.08'); // 8% default management fee
      const exitCapRate = parseFloat(assumptions.exitCapRate || assumptions.marketCapRate || '0.055'); // 5.5% default cap rate
      const loanPercentage = parseFloat(assumptions.loanPercentage || '0.75'); // 75% default LTV
      
      // Use normalized database data when available (from property modal)
      // For rent roll, check if property has normalized rent roll data
      let rentRollData = dealData.rentRoll;
      if (property.rentRoll && property.rentRoll.length > 0) {
        console.log('Using normalized database rent roll data:', property.rentRoll);
        rentRollData = property.rentRoll;
      } else if (dealData.rentRoll && dealData.rentRoll.length > 0) {
        console.log('Using Deal Analyzer rent roll data:', dealData.rentRoll);
      } else {
        console.log('No rent roll data found in property or Deal Analyzer');
      }
      
      // For loans, prioritize live debt data over Deal Analyzer loans
      let activeLoans = [];
      if (property.propertyLoans && property.propertyLoans.length > 0) {
        // Use live debt data (highest priority)
        activeLoans = property.propertyLoans.filter((loan: any) => loan.isActive);
        console.log('Using live debt data for loan calculations:', activeLoans);
      } else if (dealData.loans && dealData.loans.length > 0) {
        // Fallback to Deal Analyzer loans
        activeLoans = dealData.loans.filter((loan: any) => loan.isActive);
        console.log('Using Deal Analyzer loan data:', activeLoans);
      }
      
      // Ensure only one active loan per property
      const activeLoan = activeLoans.length > 0 ? activeLoans[0] : null;
      
      let unitTypesData = dealData.unitTypes;
      if (property.unitTypes && property.unitTypes.length > 0) {
        console.log('Using normalized database unit types data:', property.unitTypes);
        unitTypesData = property.unitTypes;
      }
      
      // Calculate rental income
      const grossRentalIncome = CalculationService.calculateGrossRentalIncome(rentRollData, unitTypesData);
      console.log('Debug - Final gross rental income calculation:', grossRentalIncome);
      const vacancyLoss = grossRentalIncome * vacancyRate;
      const totalOtherIncome = CalculationService.calculateOtherIncome(dealData.otherIncome);
      const effectiveGrossIncome = grossRentalIncome - vacancyLoss + totalOtherIncome;
      console.log('Debug - EGI calculation:', { grossRentalIncome, vacancyLoss, totalOtherIncome, effectiveGrossIncome });
      
      // Calculate expenses including management fee
      const baseMonthlyExpenses = CalculationService.calculateMonthlyExpenses(dealData.expenses, effectiveGrossIncome);
      const managementFeeAmount = (effectiveGrossIncome / 12) * managementFee; // Monthly management fee
      const monthlyExpenses = baseMonthlyExpenses + managementFeeAmount;
      const annualExpenses = monthlyExpenses * 12;
      
      // Calculate NOI
      const monthlyNOI = effectiveGrossIncome / 12 - monthlyExpenses;
      const netOperatingIncome = monthlyNOI * 12;
      
      // Calculate project costs (use Deal Analyzer data first, fallback to property fields)
      const totalRehab = CalculationService.calculateTotalRehab(dealData.rehabBudget) || parseFloat(property.rehabCosts || '0');
      const totalClosingCosts = CalculationService.calculateClosingCosts(dealData.closingCosts) || parseFloat(property.closingCosts || '0');
      const totalHoldingCosts = CalculationService.calculateHoldingCosts(dealData.holdingCosts) || parseFloat(property.holdingCosts || '0');
      const allInCost = purchasePrice + totalRehab + totalClosingCosts + totalHoldingCosts;
      
      // Calculate loan and equity
      const loanAmount = (purchasePrice + totalRehab) * loanPercentage;
      const downPayment = purchasePrice - (purchasePrice * loanPercentage);
      const capitalRequired = downPayment + totalClosingCosts + totalHoldingCosts;
      
      // Calculate debt service using active loan's actual monthly payment
      let monthlyDebtService = 0;
      if (activeLoan) {
        // Use actual monthly payment from active loan (live debt data or Deal Analyzer)
        monthlyDebtService = parseFloat(activeLoan.monthlyPayment || '0');
        console.log('Using active loan monthly payment:', monthlyDebtService, 'from loan:', activeLoan);
      } else {
        // Fallback to calculated debt service if no active loan
        monthlyDebtService = CalculationService.calculateMonthlyDebtService(dealData.loans, loanAmount);
        console.log('Calculated debt service (no active loan):', monthlyDebtService);
      }
      const annualDebtService = monthlyDebtService * 12;
      
      // Calculate cash flow
      const monthlyCashFlow = monthlyNOI - monthlyDebtService;
      const annualCashFlow = monthlyCashFlow * 12;
      
      // Calculate ARV using cap rate method
      const arv = netOperatingIncome > 0 && exitCapRate > 0 
        ? netOperatingIncome / exitCapRate 
        : parseFloat(property.arvAtTimePurchased || '0');
      
      // Calculate current equity value
      const currentEquityValue = arv - loanAmount;
      
      // Calculate return metrics with validation
      // Calculate equity multiple based on property status
      let equityMultiple = 0;
      if (property.status === 'Sold') {
        // For sold properties: total profit / capital invested
        const totalProfit = parseFloat(property.totalProfits || '0');
        const capitalInvested = parseFloat(property.initialCapitalRequired || '0');
        equityMultiple = capitalInvested > 0 ? totalProfit / capitalInvested : 0;
      } else {
        // For active properties: (ARV - all in cost) / capital invested
        const capitalInvested = parseFloat(property.initialCapitalRequired || '0');
        equityMultiple = capitalInvested > 0 ? (arv - allInCost) / capitalInvested : 0;
      }
        
      const cashOnCashReturn = capitalRequired > 0 
        ? (annualCashFlow / capitalRequired) * 100 
        : 0;
      
      // Calculate performance ratios
      const capRate = purchasePrice > 0 
        ? (netOperatingIncome / purchasePrice) * 100 
        : 0;
        
      const dscr = annualDebtService > 0 
        ? netOperatingIncome / annualDebtService 
        : 0;
        
      const breakEvenOccupancy = grossRentalIncome > 0 
        ? ((annualExpenses + annualDebtService) / grossRentalIncome) * 100 
        : 0;
        
      const operatingExpenseRatio = effectiveGrossIncome > 0 
        ? (annualExpenses / effectiveGrossIncome) * 100 
        : 0;
        
      const loanToValue = arv > 0 
        ? (loanAmount / arv) * 100 
        : 0;
      
      return {
        // Revenue metrics
        grossRentalIncome,
        effectiveGrossIncome,
        netOperatingIncome,
        totalOtherIncome,
        
        // Investment metrics
        capitalRequired,
        allInCost,
        arv,
        equityMultiple,
        cashOnCashReturn,
        currentEquityValue,
        
        // Cash flow metrics
        monthlyCashFlow,
        annualCashFlow,
        monthlyDebtService,
        annualDebtService,
        
        // Performance ratios
        dscr,
        capRate,
        breakEvenOccupancy,
        operatingExpenseRatio,
        
        // Cost breakdown
        acquisitionPrice: purchasePrice,
        totalRehab,
        totalClosingCosts,
        totalHoldingCosts,
        downPayment,
        
        // Operational metrics
        monthlyExpenses,
        annualExpenses,
        vacancyRate: vacancyRate * 100,
        
        // Loan metrics
        loanAmount,
        loanToValue
      };
    } catch (error) {
      console.error('Error calculating property KPIs:', error);
      return {
        grossRentalIncome: 0,
        effectiveGrossIncome: 0,
        netOperatingIncome: 0,
        totalOtherIncome: 0,
        capitalRequired: 0,
        allInCost: 0,
        arv: 0,
        equityMultiple: 0,
        cashOnCashReturn: 0,
        currentEquityValue: 0,
        monthlyCashFlow: 0,
        annualCashFlow: 0,
        monthlyDebtService: 0,
        annualDebtService: 0,
        dscr: 0,
        capRate: 0,
        breakEvenOccupancy: 1,
        operatingExpenseRatio: 0,
        acquisitionPrice: 0,
        totalRehab: 0,
        totalClosingCosts: 0,
        totalHoldingCosts: 0,
        downPayment: 0,
        monthlyExpenses: 0,
        annualExpenses: 0,
        vacancyRate: 5,
        loanAmount: 0,
        loanToValue: 0
      };
    }
  }
  
  /**
   * Calculate gross rental income from rent roll and unit types
   */
  private static calculateGrossRentalIncome(rentRoll?: any[], unitTypes?: any[]): number {
    if (!rentRoll?.length && !unitTypes?.length) {
      console.log('No rent roll or unit types data available');
      return 0;
    }
    
    let totalMonthlyRent = 0;
    
    // First check rent roll for actual rents
    if (rentRoll?.length) {
      console.log('Calculating from rent roll:', rentRoll);
      totalMonthlyRent = rentRoll.reduce((sum, unit) => {
        // Check multiple field names for rent (prioritize current rent over pro forma for existing properties)
        const rent = parseFloat(unit.currentRent || unit.current_rent || unit.marketRent || unit.proFormaRent || unit.pro_forma_rent || unit.rent || '0');
        console.log(`Unit ${unit.unitNumber || unit.unit_number || 'N/A'} rent: $${rent}`);
        return sum + rent;
      }, 0);
    }
    
    // If no rent roll or total is 0, use unit types
    if (totalMonthlyRent === 0 && unitTypes?.length) {
      console.log('Calculating from unit types:', unitTypes);
      totalMonthlyRent = unitTypes.reduce((sum, unitType) => {
        const units = parseInt(unitType.units || unitType.count || '1');
        const rent = parseFloat(unitType.marketRent || unitType.rent || '0');
        console.log(`Unit type: ${units} units at $${rent}/month`);
        return sum + (units * rent);
      }, 0);
    }
    
    console.log(`Total monthly rent: $${totalMonthlyRent}, Annual: $${totalMonthlyRent * 12}`);
    return totalMonthlyRent * 12; // Annual income
  }
  
  /**
   * Calculate other income sources
   */
  private static calculateOtherIncome(otherIncome?: any[]): number {
    if (!otherIncome?.length) return 0;
    
    return otherIncome.reduce((sum, income) => {
      return sum + parseFloat(income.annualAmount || '0');
    }, 0);
  }
  
  /**
   * Calculate monthly expenses including percentage-based fees
   * Handles both array format (Deal Analyzer) and object format (edited expenses)
   */
  private static calculateMonthlyExpenses(expenses?: any[] | any, effectiveGrossIncome?: number): number {
    if (!expenses) return 0;
    
    const annualEGI = effectiveGrossIncome || 0;
    const monthlyEGI = annualEGI / 12;
    
    // Handle object format (edited expenses from modal)
    if (!Array.isArray(expenses)) {
      const expenseKeys = ['taxes', 'insurance', 'maintenance', 'waterSewerTrash', 'capex', 'utilities', 'other'];
      const totalMonthly = expenseKeys.reduce((sum, key) => {
        const value = parseFloat(expenses[key] || '0');
        return sum + (value / 12); // Convert annual to monthly
      }, 0);
      
      return totalMonthly;
    }
    
    // Handle array format (Deal Analyzer format)
    if (!expenses.length) return 0;
    
    const totalExpenses = expenses.reduce((sum, expense) => {
      if (expense.isPercentage && expense.percentage) {
        // Percentage-based expense
        const percentage = parseFloat(expense.percentage) / 100;
        return sum + (monthlyEGI * percentage);
      } else {
        // Fixed expense
        const amount = parseFloat(expense.annualAmount || '0');
        return sum + (amount / 12);
      }
    }, 0);
    
    return totalExpenses;
  }
  
  /**
   * Calculate total rehab costs
   */
  private static calculateTotalRehab(rehabBudget?: any[]): number {
    if (!rehabBudget?.length) return 0;
    
    return rehabBudget.reduce((sum, item) => {
      return sum + parseFloat(item.totalCost || '0');
    }, 0);
  }
  
  /**
   * Calculate closing costs
   */
  private static calculateClosingCosts(closingCosts?: any[]): number {
    if (!closingCosts?.length) return 0;
    
    return closingCosts.reduce((sum, cost) => {
      return sum + parseFloat(cost.amount || '0');
    }, 0);
  }
  
  /**
   * Calculate holding costs
   */
  private static calculateHoldingCosts(holdingCosts?: any[]): number {
    if (!holdingCosts?.length) return 0;
    
    return holdingCosts.reduce((sum, cost) => {
      return sum + parseFloat(cost.amount || '0');
    }, 0);
  }
  
  /**
   * Calculate monthly debt service from loans
   */
  private static calculateMonthlyDebtService(loans?: any[], defaultLoanAmount?: number): number {
    if (!loans?.length) {
      // If no loans but we have a default loan amount, calculate using standard terms
      if (defaultLoanAmount && defaultLoanAmount > 0) {
        // Use standard investment property loan terms: 6.5% interest, 30 years
        const principal = defaultLoanAmount;
        const monthlyRate = 0.065 / 12; // 6.5% annual rate
        const numPayments = 30 * 12; // 30 years
        
        if (monthlyRate === 0) return principal / numPayments;
        
        const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                       (Math.pow(1 + monthlyRate, numPayments) - 1);
        return payment;
      }
      return 0;
    }
    
    // Find active loan or use first loan
    const activeLoan = loans.find(loan => loan.isActive) || loans[0];
    const monthlyPayment = parseFloat(activeLoan.monthlyPayment || '0');
    
    // If no monthly payment calculated, calculate it from loan details
    if (monthlyPayment === 0 && activeLoan.loanAmount) {
      const principal = parseFloat(activeLoan.loanAmount || activeLoan.amount || '0');
      const annualRate = parseFloat(activeLoan.interestRate || '0.065'); // Default 6.5%
      const termYears = parseFloat(activeLoan.termYears || '30'); // Default 30 years
      
      if (principal > 0 && annualRate > 0 && termYears > 0) {
        const monthlyRate = annualRate / 12;
        const numPayments = termYears * 12;
        
        if (monthlyRate === 0) return principal / numPayments;
        
        const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                       (Math.pow(1 + monthlyRate, numPayments) - 1);
        return payment;
      }
    }
    
    return monthlyPayment;
  }
  
  /**
   * Calculate portfolio-wide metrics from multiple properties
   * DEPRECATED: Use individual calculatePropertyKPIs and aggregate in components
   */
  static calculatePortfolioMetrics(properties: any[]): PortfolioMetrics {
    // This method is deprecated - use calculatePropertyKPIs for each property
    // and aggregate in components for better consistency
    console.warn('calculatePortfolioMetrics is deprecated. Use calculatePropertyKPIs instead.');
    
    // Filter only cashflowing properties for most metrics
    const cashflowingProperties = properties.filter(p => p.status === 'Cashflowing');
    const allProperties = properties.filter(p => ['Under Contract', 'Rehabbing', 'Cashflowing'].includes(p.status));
    
    // Calculate individual property KPIs
    const propertyKPIs = cashflowingProperties.map(property => CalculationService.calculatePropertyKPIs(property));
    const allPropertyKPIs = allProperties.map(property => CalculationService.calculatePropertyKPIs(property));
    
    // Calculate total units (from all active properties)
    const totalUnits = allProperties.reduce((sum, property) => {
      const units = parseInt(property.apartments || property.numberOfUnits || '0');
      return sum + units;
    }, 0);
    
    // Calculate AUM (total ARV of all active properties)
    const totalAUM = allPropertyKPIs.reduce((sum, kpis) => sum + kpis.arv, 0);
    
    // Calculate total equity created (ARV - all-in costs for properties that required rehab)
    const totalEquityCreated = allPropertyKPIs.reduce((sum, kpis) => {
      // Only include properties that had rehab costs (value-add strategy)
      if (kpis.totalRehab > 0) {
        const equityCreated = kpis.arv - kpis.allInCost;
        return sum + Math.max(0, equityCreated); // Don't include negative equity
      }
      return sum;
    }, 0);
    
    // Calculate total current equity (AUM - total debt) for other metrics
    const totalDebt = allPropertyKPIs.reduce((sum, kpis) => sum + kpis.loanAmount, 0);
    const totalEquity = totalAUM - totalDebt;
    
    // Calculate cash flow metrics (only from cashflowing properties)
    const totalMonthlyCashFlow = propertyKPIs.reduce((sum, kpis) => sum + kpis.monthlyCashFlow, 0);
    const totalAnnualCashFlow = propertyKPIs.reduce((sum, kpis) => sum + kpis.annualCashFlow, 0);
    
    // Calculate average metrics (only from cashflowing properties)
    const avgEquityMultiple = propertyKPIs.length > 0
      ? propertyKPIs.reduce((sum, kpis) => sum + kpis.equityMultiple, 0) / propertyKPIs.length
      : 0;
      
    const avgCashOnCashReturn = propertyKPIs.length > 0
      ? propertyKPIs.reduce((sum, kpis) => sum + kpis.cashOnCashReturn, 0) / propertyKPIs.length
      : 0;
    
    // Calculate price per unit
    const pricePerUnit = totalUnits > 0 ? totalAUM / totalUnits : 0;
    
    return {
      totalAUM,
      totalUnits,
      totalEquity,
      totalEquityCreated,
      avgEquityMultiple,
      avgCashOnCashReturn,
      totalMonthlyCashFlow,
      totalAnnualCashFlow,
      pricePerUnit,
      totalProperties: allProperties.length
    };
  }
  
  /**
   * Get default KPIs for error cases
   */
  private static getDefaultKPIs(): PropertyKPIs {
    return {
      grossRentalIncome: 0,
      effectiveGrossIncome: 0,
      netOperatingIncome: 0,
      totalOtherIncome: 0,
      capitalRequired: 0,
      allInCost: 0,
      arv: 0,
      equityMultiple: 0,
      cashOnCashReturn: 0,
      currentEquityValue: 0,
      monthlyCashFlow: 0,
      annualCashFlow: 0,
      monthlyDebtService: 0,
      annualDebtService: 0,
      dscr: 0,
      capRate: 0,
      breakEvenOccupancy: 0,
      operatingExpenseRatio: 0,
      acquisitionPrice: 0,
      totalRehab: 0,
      totalClosingCosts: 0,
      totalHoldingCosts: 0,
      downPayment: 0,
      monthlyExpenses: 0,
      annualExpenses: 0,
      vacancyRate: 0,
      loanAmount: 0,
      loanToValue: 0
    };
  }
  
  /**
   * Format currency for display
   */
  static formatCurrency(value: number): string {
    // Ensure value is a number
    const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numValue);
  }
  
  /**
   * Format percentage for display
   */
  static formatPercentage(value: number, decimals: number = 1): string {
    // Ensure value is a number
    const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;
    return `${numValue.toFixed(decimals)}%`;
  }
}