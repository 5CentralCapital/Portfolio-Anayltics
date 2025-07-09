/**
 * DEPRECATED: This service is deprecated. Use UnifiedCalculationService instead.
 * This file is kept for backward compatibility only.
 */

import { UnifiedCalculationService } from './unifiedCalculations';

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
  currentDebt: number;
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
   * DEPRECATED: Use UnifiedCalculationService.calculateProperty instead
   * This wrapper maintains backward compatibility
   */
  static calculatePropertyKPIs(property: any): PropertyKPIs {
    console.warn('CalculationService.calculatePropertyKPIs is deprecated. Use UnifiedCalculationService.calculateProperty instead.');
    
    // Use unified service for calculations
    const propertyData = {
      property,
      rentRoll: property.rentRoll,
      propertyLoans: property.propertyLoans,
      assumptions: property.assumptions,
      editedExpenses: property.editedExpenses
    };
    
    const financials = UnifiedCalculationService.calculateProperty(propertyData);
    
    // Convert to legacy format
    return {
      grossRentalIncome: financials.grossRentalIncome,
      effectiveGrossIncome: financials.effectiveGrossIncome,
      netOperatingIncome: financials.netOperatingIncome,
      totalOtherIncome: financials.totalOtherIncome,
      capitalRequired: financials.totalInvestedCapital,
      allInCost: parseFloat(property.acquisitionPrice || '0') + parseFloat(property.rehabCosts || '0'),
      arv: financials.currentARV,
      equityMultiple: financials.equityMultiple,
      cashOnCashReturn: financials.cashOnCashReturn,
      currentEquityValue: financials.currentEquityValue,
      monthlyCashFlow: financials.monthlyCashFlow,
      annualCashFlow: financials.annualCashFlow,
      monthlyDebtService: financials.monthlyDebtService,
      annualDebtService: financials.annualDebtService,
      dscr: financials.dscr,
      capRate: financials.capRate,
      breakEvenOccupancy: 0.5, // Default
      operatingExpenseRatio: 0.5, // Default
      acquisitionPrice: parseFloat(property.acquisitionPrice || '0'),
      totalRehab: parseFloat(property.rehabCosts || '0'),
      totalClosingCosts: 0,
      totalHoldingCosts: 0,
      downPayment: 0,
      monthlyExpenses: financials.monthlyExpenses,
      annualExpenses: financials.annualExpenses,
      vacancyRate: 5,
      loanAmount: 0,
      loanToValue: 0,
      currentDebt: financials.currentDebt
    };
  }
  
  /**
   * DEPRECATED: Use UnifiedCalculationService.calculatePortfolioMetrics instead
   */
  static calculatePortfolioMetrics(properties: any[]): PortfolioMetrics {
    console.warn('CalculationService.calculatePortfolioMetrics is deprecated. Use UnifiedCalculationService.calculatePortfolioMetrics instead.');
    
    const propertyDataArray = properties.map(property => ({
      property,
      rentRoll: property.rentRoll,
      propertyLoans: property.propertyLoans,
      assumptions: property.assumptions,
      editedExpenses: property.editedExpenses
    }));
    
    const metrics = UnifiedCalculationService.calculatePortfolioMetrics(propertyDataArray);
    
    return {
      totalAUM: metrics.totalAUM,
      totalUnits: metrics.totalUnits,
      totalEquity: metrics.totalEquity,
      totalEquityCreated: metrics.totalEquity,
      avgEquityMultiple: metrics.avgEquityMultiple,
      avgCashOnCashReturn: metrics.avgCoCReturn,
      totalMonthlyCashFlow: metrics.currentMonthlyIncome,
      totalAnnualCashFlow: metrics.currentMonthlyIncome * 12,
      pricePerUnit: metrics.pricePerUnit,
      totalProperties: properties.length
    };
  }
  
  
  static formatCurrency = UnifiedCalculationService.formatCurrency;
  static formatPercentage = UnifiedCalculationService.formatPercentage;
}