/**
 * Unified Calculation Service
 * Integrates all data sources and provides consistent calculations across the app
 */

import { PropertyCalculationEngine, PropertyFinancials, DataSources } from './propertyCalculations';
import { ExpenseManager } from './expenseManager';

export interface UnifiedPropertyData {
  property: any;
  rentRoll?: any[];
  propertyLoans?: any[];
  assumptions?: any;
  editedExpenses?: any;
}

export class UnifiedCalculationService {
  
  /**
   * Main entry point for all property calculations
   * Fetches all required data and runs calculations with proper priorities
   */
  static calculateProperty(propertyData: UnifiedPropertyData): PropertyFinancials {
    try {
      // Prepare data sources with proper priority structure
      const sources: DataSources = this.prepareDataSources(propertyData);
      
      // Run calculations using the new engine
      const financials = PropertyCalculationEngine.calculatePropertyFinancials(sources);
      
      // console.log(`Calculated financials for property ${propertyData.property.address}:`, financials);
      
      return financials;
      
    } catch (error) {
      console.error('Error in unified calculations:', error);
      return this.getDefaultFinancials();
    }
  }
  
  /**
   * Calculate portfolio-level metrics from multiple properties
   */
  static calculatePortfolioMetrics(properties: UnifiedPropertyData[]): any {
    let totalAUM = 0;
    let totalUnits = 0;
    let totalEquity = 0;
    let totalMonthlyCashFlow = 0;
    let totalEquityMultiples = 0;
    let totalCoCReturns = 0;
    let propertiesWithMetrics = 0;
    
    console.log(`[AUM DEBUG] Starting portfolio calculation with ${properties.length} properties`);
    
    // List all properties and their status for debugging
    properties.forEach((propertyData, index) => {
      const property = propertyData.property;
      console.log(`[AUM DEBUG] Property ${index + 1}: ${property.address} - Status: ${property.status}, ARV from DB: ${property.arvAtTimePurchased}`);
    });
    
    properties.forEach(propertyData => {
      const financials = this.calculateProperty(propertyData);
      const property = propertyData.property;
      
      console.log(`[AUM DEBUG] Property: ${property.address}, Status: ${property.status}, ARV: ${financials.currentARV}, Units: ${property.apartments}`);
      
      // Only include active properties (exclude sold)
      if (property.status !== 'Sold') {
        totalAUM += financials.currentARV;
        totalUnits += property.apartments || 0;
        totalEquity += financials.currentEquityValue;
        
        console.log(`[AUM DEBUG] Added to AUM: ${financials.currentARV}, Running total: ${totalAUM}`);
        
        if (property.status === 'Cashflowing') {
          totalMonthlyCashFlow += financials.monthlyCashFlow;
        }
        
        if (financials.equityMultiple > 0) {
          totalEquityMultiples += financials.equityMultiple;
          propertiesWithMetrics++;
        }
        
        if (financials.cashOnCashReturn > 0) {
          totalCoCReturns += financials.cashOnCashReturn;
        }
      } else {
        console.log(`[AUM DEBUG] Excluded sold property from AUM: ${property.address}`);
      }
    });
    
    console.log(`[AUM DEBUG] Final totals - AUM: ${totalAUM}, Units: ${totalUnits}, Properties: ${properties.length}`);
    console.log(`[AUM DEBUG] Active properties breakdown:`);
    
    // Log each active property for debugging
    properties.forEach(propertyData => {
      const property = propertyData.property;
      if (property.status !== 'Sold') {
        const financials = this.calculateProperty(propertyData);
        console.log(`[AUM DEBUG] - ${property.address} (${property.status}): ARV $${financials.currentARV.toLocaleString()}, Units: ${property.apartments}`);
      }
    });
    
    return {
      totalAUM,
      totalUnits,
      totalEquity,
      currentMonthlyIncome: totalMonthlyCashFlow,
      pricePerUnit: totalUnits > 0 ? totalAUM / totalUnits : 0,
      avgEquityMultiple: propertiesWithMetrics > 0 ? totalEquityMultiples / propertiesWithMetrics : 0,
      avgCoCReturn: propertiesWithMetrics > 0 ? totalCoCReturns / propertiesWithMetrics : 0
    };
  }
  
  /**
   * Get editable expenses for a property
   */
  static getPropertyExpenses(propertyId: number, dealAnalyzerData?: any) {
    return ExpenseManager.getPropertyExpenses(propertyId, dealAnalyzerData);
  }
  
  /**
   * Save edited expenses for a property
   */
  static savePropertyExpenses(propertyId: number, expenses: any) {
    ExpenseManager.saveEditedExpenses(propertyId, expenses);
  }
  
  /**
   * Check if property has user-edited expenses
   */
  static hasEditedExpenses(propertyId: number): boolean {
    return ExpenseManager.hasEditedExpenses(propertyId);
  }
  
  /**
   * Prepare data sources with proper priority ordering
   */
  private static prepareDataSources(propertyData: UnifiedPropertyData): DataSources {
    const { property, rentRoll, propertyLoans, assumptions } = propertyData;
    
    // Parse Deal Analyzer data if available
    let dealAnalyzerData = null;
    if (property.dealAnalyzerData) {
      try {
        dealAnalyzerData = JSON.parse(property.dealAnalyzerData);
      } catch (e) {
        console.warn('Failed to parse Deal Analyzer data:', e);
      }
    }
    
    // Check for live rent roll data (from lease uploads)
    let liveRentRoll = null;
    if (rentRoll && rentRoll.length > 0) {
      // Check if this looks like real lease data vs. Deal Analyzer assumptions
      const hasRealData = rentRoll.some(unit => 
        unit.tenantName || 
        unit.leaseStart || 
        unit.leaseEnd ||
        (unit.currentRent && unit.currentRent !== unit.proFormaRent)
      );
      
      if (hasRealData) {
        liveRentRoll = rentRoll;
        console.log('Detected live rent roll data with real tenant information');
      }
    }
    
    // Check for live loan data (from mortgage uploads)
    let liveLoanData = null;
    if (propertyLoans && propertyLoans.length > 0) {
      // Check if this looks like real loan data vs. Deal Analyzer loans
      const hasRealData = propertyLoans.some(loan => 
        loan.externalLoanId || 
        loan.lender !== 'Deal Analyzer Import' ||
        loan.syncStatus === 'success'
      );
      
      if (hasRealData) {
        liveLoanData = propertyLoans;
        console.log('Detected live loan data from mortgage uploads');
      }
    }
    
    // Get user-edited expenses
    const editedExpenses = ExpenseManager.getEditedExpenses(property.id);
    
    return {
      // Live data (highest priority)
      liveRentRoll,
      liveLoanData,
      editedExpenses,
      
      // Normalized database data
      dbRentRoll: liveRentRoll ? null : rentRoll, // Only use if not live data
      dbLoans: liveLoanData ? null : propertyLoans, // Only use if not live data
      dbAssumptions: assumptions,
      
      // Deal Analyzer data (fallback)
      dealAnalyzerData,
      
      // Property base data
      property
    };
  }
  
  /**
   * Format currency for display
   */
  static formatCurrency(value: number | string): string {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return '$0';
    
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
    if (isNaN(value)) return '0.0%';
    return `${value.toFixed(decimals)}%`;
  }
  
  /**
   * Get default financials for error cases
   */
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

// Legacy compatibility layer - maintains existing API while using new calculations
export class CalculationService {
  static calculatePropertyKPIs(property: any): any {
    console.warn('calculatePropertyKPIs is deprecated. Use UnifiedCalculationService.calculateProperty instead.');
    
    // Convert to new format
    const propertyData: UnifiedPropertyData = {
      property,
      rentRoll: property.rentRoll,
      propertyLoans: property.propertyLoans,
      assumptions: property.assumptions
    };
    
    const financials = UnifiedCalculationService.calculateProperty(propertyData);
    
    // Convert back to legacy format for backward compatibility
    return {
      // Revenue metrics
      grossRentalIncome: financials.grossRentalIncome,
      effectiveGrossIncome: financials.effectiveGrossIncome,
      netOperatingIncome: financials.netOperatingIncome,
      totalOtherIncome: financials.totalOtherIncome,
      
      // Investment metrics
      capitalRequired: financials.totalInvestedCapital,
      allInCost: 0, // Calculate if needed
      arv: financials.currentARV,
      equityMultiple: financials.equityMultiple,
      cashOnCashReturn: financials.cashOnCashReturn,
      currentEquityValue: financials.currentEquityValue,
      
      // Cash flow metrics
      monthlyCashFlow: financials.monthlyCashFlow,
      annualCashFlow: financials.annualCashFlow,
      monthlyDebtService: financials.monthlyDebtService,
      annualDebtService: financials.annualDebtService,
      
      // Performance ratios
      dscr: financials.dscr,
      capRate: financials.capRate,
      breakEvenOccupancy: 0, // Calculate if needed
      operatingExpenseRatio: 0, // Calculate if needed
      
      // Cost breakdown
      acquisitionPrice: parseFloat(property.acquisitionPrice || '0'),
      totalRehab: parseFloat(property.rehabCosts || '0'),
      totalClosingCosts: 0,
      totalHoldingCosts: 0,
      downPayment: 0,
      
      // Operational metrics
      monthlyExpenses: financials.monthlyExpenses,
      annualExpenses: financials.annualExpenses,
      vacancyRate: 5, // Default
      
      // Loan metrics
      loanAmount: 0, // Calculate if needed
      loanToValue: 0, // Calculate if needed
      currentDebt: financials.currentDebt
    };
  }
  
  static formatCurrency = UnifiedCalculationService.formatCurrency;
  static formatPercentage = UnifiedCalculationService.formatPercentage;
}