/**
 * Unified Data Synchronization System
 * 
 * This system ensures all property data remains consistent across
 * the database and provides automatic calculation updates when
 * any property data changes.
 */

import { db } from './db';
import { properties, type Property } from '@shared/schema';
import { eq } from 'drizzle-orm';

export interface PropertyUpdateResult {
  property: Property;
  calculationResults: PropertyCalculations;
  syncedFields: string[];
  warnings: string[];
}

export interface PropertyCalculations {
  monthlyCashFlow: number;
  annualCashFlow: number;
  cashOnCashReturn: number;
  arv: number;
  noi: number;
  totalProfit: number;
  equityMultiple: number;
  initialCapitalRequired: number;
}

/**
 * Unified Data Sync Manager
 * Handles all property data updates and ensures consistency
 */
export class DataSyncManager {
  private static instance: DataSyncManager;
  
  private constructor() {}

  static getInstance(): DataSyncManager {
    if (!DataSyncManager.instance) {
      DataSyncManager.instance = new DataSyncManager();
    }
    return DataSyncManager.instance;
  }

  /**
   * Update property with automatic calculation sync
   */
  async updatePropertyWithSync(
    propertyId: number, 
    updates: Partial<Property>,
    userId?: number
  ): Promise<PropertyUpdateResult> {
    
    // Get current property data
    const [currentProperty] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, propertyId));

    if (!currentProperty) {
      throw new Error(`Property ${propertyId} not found`);
    }

    // Merge updates with current data
    const updatedData = { ...currentProperty, ...updates };
    
    // Calculate all derived fields
    const calculations = this.calculateAllFields(updatedData);
    
    // Prepare synchronized updates
    const syncedUpdates = {
      ...updates,
      cashFlow: calculations.monthlyCashFlow.toString(),
      cashOnCashReturn: calculations.cashOnCashReturn.toString(),
      arvAtTimePurchased: calculations.arv.toString(),
      initialCapitalRequired: calculations.initialCapitalRequired.toString(),
      totalProfits: calculations.totalProfit.toString(),
      // Always update the deal analyzer data if it exists in updates
      ...(updates.dealAnalyzerData && { 
        dealAnalyzerData: this.validateAndCleanDealData(updates.dealAnalyzerData) 
      })
    };

    // Update database
    const [updatedProperty] = await db
      .update(properties)
      .set(syncedUpdates)
      .where(eq(properties.id, propertyId))
      .returning();

    // Validate consistency
    const warnings = this.validatePropertyConsistency(updatedProperty);

    return {
      property: updatedProperty,
      calculationResults: calculations,
      syncedFields: Object.keys(syncedUpdates),
      warnings
    };
  }

  /**
   * Calculate all property fields from deal analyzer data
   */
  private calculateAllFields(property: any): PropertyCalculations {
    const dealData = property.dealAnalyzerData ? 
      this.parseDealData(property.dealAnalyzerData) : null;
    
    const acquisitionPrice = parseFloat(property.acquisitionPrice || '0');
    const rehabCosts = parseFloat(property.rehabCosts || '0');
    
    let calculations: PropertyCalculations = {
      monthlyCashFlow: 0,
      annualCashFlow: 0,
      cashOnCashReturn: 0,
      arv: 0,
      noi: 0,
      totalProfit: 0,
      equityMultiple: 1,
      initialCapitalRequired: 0
    };

    if (!dealData) {
      // Use stored values if no deal data
      calculations.monthlyCashFlow = parseFloat(property.cashFlow || '0');
      calculations.annualCashFlow = calculations.monthlyCashFlow * 12;
      calculations.arv = parseFloat(property.arvAtTimePurchased || '0');
      calculations.cashOnCashReturn = parseFloat(property.cashOnCashReturn || '0');
      calculations.initialCapitalRequired = parseFloat(property.initialCapitalRequired || '0');
      calculations.totalProfit = parseFloat(property.totalProfits || '0');
      return calculations;
    }

    // Calculate income
    let grossRentalIncome = 0;
    if (dealData.rentRoll && Array.isArray(dealData.rentRoll)) {
      grossRentalIncome = dealData.rentRoll.reduce((sum: number, unit: any) => 
        sum + (parseFloat(unit.proFormaRent) || 0), 0) * 12;
    }

    const vacancyRate = dealData.assumptions?.vacancyRate || 0.05;
    const effectiveGrossIncome = grossRentalIncome * (1 - vacancyRate);

    // Calculate expenses
    let totalExpenses = 0;
    if (dealData.incomeAndExpenses?.operatingExpenses) {
      totalExpenses = dealData.incomeAndExpenses.operatingExpenses.reduce(
        (sum: number, expense: any) => sum + (parseFloat(expense.annualAmount) || 0), 0
      );
    } else if (dealData.expenses) {
      totalExpenses = Object.values(dealData.expenses).reduce(
        (sum: number, val: any) => sum + (parseFloat(val) || 0), 0
      );
    }

    calculations.noi = effectiveGrossIncome - totalExpenses;

    // Calculate debt service
    let annualDebtService = 0;
    if (dealData.financing?.loans) {
      const activeLoan = dealData.financing.loans.find((loan: any) => loan.isActive);
      if (activeLoan) {
        annualDebtService = parseFloat(activeLoan.monthlyPayment || '0') * 12;
      }
    } else if (dealData.assumptions) {
      // Fallback to assumptions
      const loanAmount = acquisitionPrice * (dealData.assumptions.loanPercentage || 0.8);
      const interestRate = dealData.assumptions.interestRate || 0.07;
      const loanTermYears = dealData.assumptions.loanTermYears || 30;

      if (loanAmount > 0 && interestRate > 0) {
        const monthlyRate = interestRate / 12;
        const numPayments = loanTermYears * 12;
        const monthlyPayment = loanAmount * 
          (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
          (Math.pow(1 + monthlyRate, numPayments) - 1);
        annualDebtService = monthlyPayment * 12;
      }
    }

    // Priority 1: Use 12-month proforma data if available (most accurate)
    if (dealData.proforma && Array.isArray(dealData.proforma) && dealData.proforma.length > 0) {
      const totalAnnualCashFlow = dealData.proforma.reduce((sum: number, month: any) => 
        sum + (parseFloat(month.cashFlow) || 0), 0);
      
      if (totalAnnualCashFlow !== 0) {
        calculations.annualCashFlow = totalAnnualCashFlow;
        calculations.monthlyCashFlow = totalAnnualCashFlow / 12;
      } else {
        // Fall back to NOI calculation
        calculations.annualCashFlow = calculations.noi - annualDebtService;
        calculations.monthlyCashFlow = calculations.annualCashFlow / 12;
      }
    } else {
      // Priority 2: Calculate from NOI minus debt service
      calculations.annualCashFlow = calculations.noi - annualDebtService;
      calculations.monthlyCashFlow = calculations.annualCashFlow / 12;
    }

    // Calculate ARV from cap rate
    if (dealData.exitAnalysis?.salesCapRate) {
      const capRate = parseFloat(dealData.exitAnalysis.salesCapRate) / 100;
      if (capRate > 0 && calculations.noi > 0) {
        calculations.arv = calculations.noi / capRate;
      }
    }

    // If no ARV calculated, use stored value or estimate
    if (calculations.arv === 0) {
      calculations.arv = parseFloat(property.arvAtTimePurchased || '0') || 
        (acquisitionPrice + rehabCosts) * 1.2; // 20% appreciation estimate
    }

    // Calculate initial capital required
    const loanPercentage = dealData.assumptions?.loanPercentage || 0.8;
    const downPayment = acquisitionPrice * (1 - loanPercentage);
    const closingCosts = this.calculateClosingCosts(dealData) || (acquisitionPrice * 0.02);
    const totalRehabCosts = this.calculateTotalRehabCosts(dealData) || rehabCosts;
    
    calculations.initialCapitalRequired = downPayment + closingCosts + totalRehabCosts;

    // Calculate cash-on-cash return
    if (calculations.initialCapitalRequired > 0) {
      calculations.cashOnCashReturn = 
        (calculations.annualCashFlow / calculations.initialCapitalRequired) * 100;
    }

    // Calculate total profit and equity multiple
    if (property.status === 'Sold') {
      calculations.totalProfit = parseFloat(property.totalProfits || '0');
      const yearsHeld = parseFloat(property.yearsHeld || '1');
      const totalCashFlow = calculations.annualCashFlow * yearsHeld;
      calculations.equityMultiple = calculations.initialCapitalRequired > 0 ? 
        (calculations.totalProfit + totalCashFlow) / calculations.initialCapitalRequired : 1;
    } else {
      const totalInvested = acquisitionPrice + rehabCosts;
      calculations.totalProfit = calculations.arv - totalInvested;
      calculations.equityMultiple = totalInvested > 0 ? calculations.arv / totalInvested : 1;
    }

    return calculations;
  }

  /**
   * Calculate total rehab costs from deal data
   */
  private calculateTotalRehabCosts(dealData: any): number {
    let total = 0;

    if (dealData.rehabBudgetSections) {
      Object.values(dealData.rehabBudgetSections).forEach((section: any) => {
        if (Array.isArray(section)) {
          section.forEach((item: any) => {
            total += parseFloat(item.totalCost) || 0;
          });
        }
      });
    }

    return total;
  }

  /**
   * Calculate closing costs from deal data
   */
  private calculateClosingCosts(dealData: any): number {
    let total = 0;

    if (dealData.closingCosts && Array.isArray(dealData.closingCosts)) {
      total = dealData.closingCosts.reduce((sum: number, cost: any) => 
        sum + (parseFloat(cost.amount) || 0), 0);
    }

    return total;
  }

  /**
   * Parse and validate deal analyzer data
   */
  private parseDealData(dealAnalyzerData: string): any {
    try {
      return JSON.parse(dealAnalyzerData);
    } catch (error) {
      console.warn('Failed to parse deal analyzer data:', error);
      return null;
    }
  }

  /**
   * Validate and clean deal analyzer data
   */
  private validateAndCleanDealData(dealAnalyzerData: string): string {
    try {
      const data = JSON.parse(dealAnalyzerData);
      
      // Ensure required structure exists
      if (!data.assumptions) data.assumptions = {};
      if (!data.rentRoll) data.rentRoll = [];
      if (!data.incomeAndExpenses) data.incomeAndExpenses = { operatingExpenses: [] };
      if (!data.financing) data.financing = { loans: [] };
      if (!data.exitAnalysis) data.exitAnalysis = {};

      return JSON.stringify(data);
    } catch (error) {
      console.warn('Invalid deal analyzer data, returning original:', error);
      return dealAnalyzerData;
    }
  }

  /**
   * Validate property data consistency
   */
  private validatePropertyConsistency(property: any): string[] {
    const warnings: string[] = [];
    
    const calculations = this.calculateAllFields(property);
    const storedCashFlow = parseFloat(property.cashFlow || '0');
    const storedCOC = parseFloat(property.cashOnCashReturn || '0');

    // Check cash flow consistency (allow 5% variance)
    if (Math.abs(storedCashFlow - calculations.monthlyCashFlow) > 
        Math.abs(storedCashFlow * 0.05)) {
      warnings.push(
        `Cash flow inconsistency: stored ${storedCashFlow}, calculated ${calculations.monthlyCashFlow}`
      );
    }

    // Check cash-on-cash return consistency (allow 1% variance)
    if (Math.abs(storedCOC - calculations.cashOnCashReturn) > 1) {
      warnings.push(
        `Cash-on-cash return inconsistency: stored ${storedCOC}%, calculated ${calculations.cashOnCashReturn}%`
      );
    }

    return warnings;
  }

  /**
   * Sync all properties to ensure consistency
   */
  async syncAllProperties(userId?: number): Promise<{ updated: number; warnings: string[] }> {
    const allProperties = await db.select().from(properties);
    let updated = 0;
    const allWarnings: string[] = [];

    for (const property of allProperties) {
      try {
        const result = await this.updatePropertyWithSync(property.id, {}, userId);
        
        // Only count as updated if there were actual changes
        if (result.syncedFields.length > 0) {
          updated++;
        }
        
        allWarnings.push(...result.warnings);
      } catch (error) {
        allWarnings.push(`Failed to sync property ${property.id}: ${error}`);
      }
    }

    return { updated, warnings: allWarnings };
  }

  /**
   * Get property with all calculations
   */
  async getPropertyWithCalculations(propertyId: number): Promise<Property & { calculations: PropertyCalculations }> {
    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, propertyId));

    if (!property) {
      throw new Error(`Property ${propertyId} not found`);
    }

    const calculations = this.calculateAllFields(property);

    return {
      ...property,
      calculations
    };
  }
}

// Export singleton instance
export const dataSyncManager = DataSyncManager.getInstance();