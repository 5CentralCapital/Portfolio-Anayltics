/**
 * Centralized Finance Utilities for Real Estate Investment Calculations
 * 
 * This module provides unified calculation functions used across Deal Analyzer
 * and Properties modules to ensure consistent financial metrics.
 */

export interface PropertyFinancials {
  // Input data
  purchasePrice: number;
  rehabCosts: number;
  closingCosts: number;
  holdingCosts: number;
  
  // Rent roll data
  grossRentalIncome: number;
  vacancyRate: number;
  otherIncome: number;
  
  // Operating expenses
  operatingExpenses: number;
  
  // Loan data
  loanAmount: number;
  interestRate: number;
  loanTermYears: number;
  paymentType: 'principal_and_interest' | 'interest_only';
  
  // Market assumptions
  marketCapRate: number;
  exitCapRate?: number;
  refinanceLTV?: number;
  refinanceRate?: number;
}

export interface CalculatedMetrics {
  // Core metrics
  allInCost: number;
  arv: number;
  initialCapitalRequired: number;
  netOperatingIncome: number;
  annualDebtService: number;
  annualCashFlow: number;
  
  // Investment ratios
  capRate: number;
  cashOnCashReturn: number;
  equityMultiple: number;
  dscr: number;
  
  // Valuation metrics
  currentEquity: number;
  loanToValue: number;
  
  // Risk metrics
  breakEvenOccupancy: number;
  operatingExpenseRatio: number;
  
  // Return metrics
  totalReturn: number;
  annualizedReturn: number;
}

/**
 * Calculate monthly loan payment
 */
export function calculateLoanPayment(
  principal: number,
  annualRate: number,
  termYears: number,
  paymentType: 'principal_and_interest' | 'interest_only' = 'principal_and_interest'
): number {
  if (principal <= 0 || annualRate <= 0) return 0;
  
  const monthlyRate = annualRate / 12;
  
  if (paymentType === 'interest_only') {
    return principal * monthlyRate;
  }
  
  // Full amortization calculation
  const numPayments = termYears * 12;
  if (numPayments <= 0) return 0;
  
  return principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
         (Math.pow(1 + monthlyRate, numPayments) - 1);
}

/**
 * Calculate Net Operating Income
 */
export function calculateNOI(
  grossRentalIncome: number,
  vacancyRate: number,
  otherIncome: number,
  operatingExpenses: number
): number {
  const effectiveGrossIncome = (grossRentalIncome * (1 - vacancyRate)) + otherIncome;
  return effectiveGrossIncome - operatingExpenses;
}

/**
 * Calculate After Repair Value using cap rate method
 */
export function calculateARV(
  noi: number,
  marketCapRate: number
): number {
  if (marketCapRate <= 0 || noi <= 0) return 0;
  return noi / marketCapRate;
}

/**
 * Calculate initial capital required (down payment + costs)
 */
export function calculateInitialCapital(
  purchasePrice: number,
  rehabCosts: number,
  closingCosts: number,
  holdingCosts: number,
  loanAmount: number
): number {
  const totalProjectCost = purchasePrice + rehabCosts + closingCosts + holdingCosts;
  return totalProjectCost - loanAmount;
}

/**
 * Calculate cash-on-cash return
 */
export function calculateCashOnCashReturn(
  annualCashFlow: number,
  initialCapitalRequired: number
): number {
  if (initialCapitalRequired <= 0) return 0;
  return annualCashFlow / initialCapitalRequired;
}

/**
 * Calculate equity multiple
 */
export function calculateEquityMultiple(
  arv: number,
  allInCost: number,
  initialCapitalRequired: number
): number {
  if (initialCapitalRequired <= 0) return 0;
  const totalEquity = arv - (allInCost - initialCapitalRequired);
  return totalEquity / initialCapitalRequired;
}

/**
 * Calculate Debt Service Coverage Ratio
 */
export function calculateDSCR(
  noi: number,
  annualDebtService: number
): number {
  if (annualDebtService <= 0) return 0;
  return noi / annualDebtService;
}

/**
 * Calculate break-even occupancy
 */
export function calculateBreakEvenOccupancy(
  operatingExpenses: number,
  annualDebtService: number,
  grossRentalIncome: number
): number {
  if (grossRentalIncome <= 0) return 0;
  return (operatingExpenses + annualDebtService) / grossRentalIncome;
}

/**
 * Calculate cap rate
 */
export function calculateCapRate(
  noi: number,
  propertyValue: number
): number {
  if (propertyValue <= 0) return 0;
  return noi / propertyValue;
}

/**
 * Calculate loan-to-value ratio
 */
export function calculateLTV(
  loanAmount: number,
  propertyValue: number
): number {
  if (propertyValue <= 0) return 0;
  return loanAmount / propertyValue;
}

/**
 * Calculate operating expense ratio
 */
export function calculateOperatingExpenseRatio(
  operatingExpenses: number,
  effectiveGrossIncome: number
): number {
  if (effectiveGrossIncome <= 0) return 0;
  return operatingExpenses / effectiveGrossIncome;
}

/**
 * Main calculation engine - computes all metrics from property financials
 */
export function calculateAllMetrics(financials: PropertyFinancials): CalculatedMetrics {
  // Core calculations
  const allInCost = financials.purchasePrice + financials.rehabCosts + 
                   financials.closingCosts + financials.holdingCosts;
  
  const effectiveGrossIncome = (financials.grossRentalIncome * (1 - financials.vacancyRate)) + 
                              financials.otherIncome;
  
  const noi = calculateNOI(
    financials.grossRentalIncome,
    financials.vacancyRate,
    financials.otherIncome,
    financials.operatingExpenses
  );
  
  const arv = calculateARV(noi, financials.marketCapRate);
  
  const monthlyDebtService = calculateLoanPayment(
    financials.loanAmount,
    financials.interestRate,
    financials.loanTermYears,
    financials.paymentType
  );
  
  const annualDebtService = monthlyDebtService * 12;
  const annualCashFlow = noi - annualDebtService;
  
  const initialCapitalRequired = calculateInitialCapital(
    financials.purchasePrice,
    financials.rehabCosts,
    financials.closingCosts,
    financials.holdingCosts,
    financials.loanAmount
  );
  
  // Investment ratios
  const capRate = calculateCapRate(noi, arv);
  const cashOnCashReturn = calculateCashOnCashReturn(annualCashFlow, initialCapitalRequired);
  const equityMultiple = calculateEquityMultiple(arv, allInCost, initialCapitalRequired);
  const dscr = calculateDSCR(noi, annualDebtService);
  
  // Valuation metrics
  const currentEquity = arv - financials.loanAmount;
  const loanToValue = calculateLTV(financials.loanAmount, arv);
  
  // Risk metrics
  const breakEvenOccupancy = calculateBreakEvenOccupancy(
    financials.operatingExpenses,
    annualDebtService,
    financials.grossRentalIncome
  );
  const operatingExpenseRatio = calculateOperatingExpenseRatio(
    financials.operatingExpenses,
    effectiveGrossIncome
  );
  
  // Return metrics
  const totalReturn = arv - allInCost;
  const annualizedReturn = cashOnCashReturn; // Simplified - could be enhanced with IRR
  
  return {
    allInCost,
    arv,
    initialCapitalRequired,
    netOperatingIncome: noi,
    annualDebtService,
    annualCashFlow,
    capRate,
    cashOnCashReturn,
    equityMultiple,
    dscr,
    currentEquity,
    loanToValue,
    breakEvenOccupancy,
    operatingExpenseRatio,
    totalReturn,
    annualizedReturn
  };
}

/**
 * Sensitivity analysis utilities
 */
export interface SensitivityAnalysis {
  baseCase: CalculatedMetrics;
  rentSensitivity: {
    minus10: CalculatedMetrics;
    minus5: CalculatedMetrics;
    plus5: CalculatedMetrics;
    plus10: CalculatedMetrics;
  };
  capRateSensitivity: {
    minus1: CalculatedMetrics;
    minusHalf: CalculatedMetrics;
    plusHalf: CalculatedMetrics;
    plus1: CalculatedMetrics;
  };
  interestRateSensitivity: {
    minus1: CalculatedMetrics;
    minusHalf: CalculatedMetrics;
    plusHalf: CalculatedMetrics;
    plus1: CalculatedMetrics;
  };
}

/**
 * Calculate sensitivity analysis for key variables
 */
export function calculateSensitivityAnalysis(financials: PropertyFinancials): SensitivityAnalysis {
  const baseCase = calculateAllMetrics(financials);
  
  // Rent sensitivity
  const rentSensitivity = {
    minus10: calculateAllMetrics({
      ...financials,
      grossRentalIncome: financials.grossRentalIncome * 0.9
    }),
    minus5: calculateAllMetrics({
      ...financials,
      grossRentalIncome: financials.grossRentalIncome * 0.95
    }),
    plus5: calculateAllMetrics({
      ...financials,
      grossRentalIncome: financials.grossRentalIncome * 1.05
    }),
    plus10: calculateAllMetrics({
      ...financials,
      grossRentalIncome: financials.grossRentalIncome * 1.1
    })
  };
  
  // Cap rate sensitivity
  const capRateSensitivity = {
    minus1: calculateAllMetrics({
      ...financials,
      marketCapRate: financials.marketCapRate - 0.01
    }),
    minusHalf: calculateAllMetrics({
      ...financials,
      marketCapRate: financials.marketCapRate - 0.005
    }),
    plusHalf: calculateAllMetrics({
      ...financials,
      marketCapRate: financials.marketCapRate + 0.005
    }),
    plus1: calculateAllMetrics({
      ...financials,
      marketCapRate: financials.marketCapRate + 0.01
    })
  };
  
  // Interest rate sensitivity
  const interestRateSensitivity = {
    minus1: calculateAllMetrics({
      ...financials,
      interestRate: financials.interestRate - 0.01
    }),
    minusHalf: calculateAllMetrics({
      ...financials,
      interestRate: financials.interestRate - 0.005
    }),
    plusHalf: calculateAllMetrics({
      ...financials,
      interestRate: financials.interestRate + 0.005
    }),
    plus1: calculateAllMetrics({
      ...financials,
      interestRate: financials.interestRate + 0.01
    })
  };
  
  return {
    baseCase,
    rentSensitivity,
    capRateSensitivity,
    interestRateSensitivity
  };
}

/**
 * Exit analysis scenarios
 */
export interface ExitScenario {
  holdPeriodYears: number;
  projectedNOI: number;
  projectedSalePrice: number;
  saleCosts: number;
  netSaleProceeds: number;
  totalCashFlow: number;
  totalReturn: number;
  annualizedReturn: number;
  equityMultiple: number;
}

/**
 * Calculate exit scenarios (hold vs refinance vs sale)
 */
export function calculateExitScenarios(
  financials: PropertyFinancials,
  holdPeriodYears: number = 3,
  annualRentGrowth: number = 0.03,
  annualExpenseGrowth: number = 0.025,
  saleCostsPercent: number = 0.06
): {
  hold: ExitScenario;
  refinance: ExitScenario;
  sale: ExitScenario;
} {
  const futureGrossIncome = financials.grossRentalIncome * Math.pow(1 + annualRentGrowth, holdPeriodYears);
  const futureExpenses = financials.operatingExpenses * Math.pow(1 + annualExpenseGrowth, holdPeriodYears);
  const futureNOI = calculateNOI(futureGrossIncome, financials.vacancyRate, financials.otherIncome, futureExpenses);
  
  const exitCapRate = financials.exitCapRate || financials.marketCapRate;
  const projectedSalePrice = futureNOI / exitCapRate;
  const saleCosts = projectedSalePrice * saleCostsPercent;
  const netSaleProceeds = projectedSalePrice - saleCosts - financials.loanAmount;
  
  // Hold scenario - continue holding the property
  const hold: ExitScenario = {
    holdPeriodYears,
    projectedNOI: futureNOI,
    projectedSalePrice: 0, // Not selling
    saleCosts: 0,
    netSaleProceeds: 0,
    totalCashFlow: futureNOI - (financials.loanAmount * financials.interestRate), // Interest-only assumption
    totalReturn: futureNOI * holdPeriodYears,
    annualizedReturn: futureNOI / calculateInitialCapital(financials.purchasePrice, financials.rehabCosts, financials.closingCosts, financials.holdingCosts, financials.loanAmount),
    equityMultiple: (projectedSalePrice - financials.loanAmount) / calculateInitialCapital(financials.purchasePrice, financials.rehabCosts, financials.closingCosts, financials.holdingCosts, financials.loanAmount)
  };
  
  // Refinance scenario
  const refinanceLTV = financials.refinanceLTV || 0.75;
  const refinanceAmount = projectedSalePrice * refinanceLTV;
  const cashOutAmount = refinanceAmount - financials.loanAmount;
  
  const refinance: ExitScenario = {
    holdPeriodYears,
    projectedNOI: futureNOI,
    projectedSalePrice: projectedSalePrice,
    saleCosts: 0,
    netSaleProceeds: cashOutAmount,
    totalCashFlow: futureNOI - (refinanceAmount * (financials.refinanceRate || 0.065)),
    totalReturn: cashOutAmount + (futureNOI * holdPeriodYears),
    annualizedReturn: (cashOutAmount + futureNOI) / calculateInitialCapital(financials.purchasePrice, financials.rehabCosts, financials.closingCosts, financials.holdingCosts, financials.loanAmount),
    equityMultiple: (projectedSalePrice - refinanceAmount + cashOutAmount) / calculateInitialCapital(financials.purchasePrice, financials.rehabCosts, financials.closingCosts, financials.holdingCosts, financials.loanAmount)
  };
  
  // Sale scenario
  const sale: ExitScenario = {
    holdPeriodYears,
    projectedNOI: futureNOI,
    projectedSalePrice,
    saleCosts,
    netSaleProceeds,
    totalCashFlow: 0, // No ongoing cash flow after sale
    totalReturn: netSaleProceeds + (calculateAllMetrics(financials).annualCashFlow * holdPeriodYears),
    annualizedReturn: (netSaleProceeds / holdPeriodYears) / calculateInitialCapital(financials.purchasePrice, financials.rehabCosts, financials.closingCosts, financials.holdingCosts, financials.loanAmount),
    equityMultiple: netSaleProceeds / calculateInitialCapital(financials.purchasePrice, financials.rehabCosts, financials.closingCosts, financials.holdingCosts, financials.loanAmount)
  };
  
  return { hold, refinance, sale };
}