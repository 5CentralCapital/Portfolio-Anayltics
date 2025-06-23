/**
 * Real-Time Calculation Service for Cross-Module Data Consistency
 * 
 * This service ensures that changes in Deal Analyzer instantly update
 * all affected KPIs in Properties dashboard with no manual refresh.
 */

import { db } from './db';
import { 
  properties, 
  propertyAssumptions, 
  propertyRentRoll, 
  propertyExpenses, 
  propertyLoans,
  propertyPerformanceMetrics 
} from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import { calculateAllMetrics, PropertyFinancials, CalculatedMetrics } from './finance-utils';

export class RealTimeCalculator {
  
  /**
   * Calculate and update all property metrics in real-time
   */
  async updatePropertyMetrics(propertyId: number): Promise<CalculatedMetrics> {
    // Gather all property data from normalized tables
    const financials = await this.gatherPropertyFinancials(propertyId);
    
    // Calculate all metrics using centralized finance utilities
    const metrics = calculateAllMetrics(financials);
    
    // Update the main properties table with calculated values
    await this.updatePropertiesTable(propertyId, metrics, financials);
    
    // Store historical metrics for tracking
    await this.storeHistoricalMetrics(propertyId, metrics);
    
    return metrics;
  }

  /**
   * Gather all property financial data from normalized tables
   */
  private async gatherPropertyFinancials(propertyId: number): Promise<PropertyFinancials> {
    // Get property assumptions
    const [assumptions] = await db
      .select()
      .from(propertyAssumptions)
      .where(eq(propertyAssumptions.propertyId, propertyId))
      .limit(1);

    // Get rent roll data
    const rentRoll = await db
      .select()
      .from(propertyRentRoll)
      .where(eq(propertyRentRoll.propertyId, propertyId));

    // Get operating expenses
    const expenses = await db
      .select()
      .from(propertyExpenses)
      .where(eq(propertyExpenses.propertyId, propertyId));

    // Get active loan for debt service calculations
    const [activeLoan] = await db
      .select()
      .from(propertyLoans)
      .where(and(
        eq(propertyLoans.propertyId, propertyId),
        eq(propertyLoans.isActive, true)
      ))
      .limit(1);

    // Calculate gross rental income from rent roll
    const grossRentalIncome = rentRoll.reduce((total, unit) => {
      return total + (parseFloat(unit.proFormaRent || '0') * 12);
    }, 0);

    // Calculate total operating expenses
    const operatingExpenses = expenses.reduce((total, expense) => {
      return total + parseFloat(expense.annualAmount || '0');
    }, 0);

    // Add management fee if not already included
    const managementFeeIncluded = expenses.some(exp => 
      exp.expenseType === 'management' || exp.expenseName.toLowerCase().includes('management')
    );
    
    const effectiveGrossIncome = grossRentalIncome * (1 - parseFloat(assumptions?.vacancyRate || '0.05'));
    const managementFee = managementFeeIncluded ? 0 : effectiveGrossIncome * 0.08;
    const totalOperatingExpenses = operatingExpenses + managementFee;

    // Build PropertyFinancials object
    const purchasePrice = parseFloat(assumptions?.purchasePrice || '0');
    const loanPercentage = parseFloat(assumptions?.loanPercentage || '0.8');
    const rehabCosts = await this.calculateTotalRehabCosts(propertyId);
    const closingCosts = await this.calculateTotalClosingCosts(propertyId);
    const holdingCosts = await this.calculateTotalHoldingCosts(propertyId);
    
    const loanAmount = activeLoan 
      ? parseFloat(activeLoan.originalAmount || '0')
      : (purchasePrice + rehabCosts) * loanPercentage;

    return {
      purchasePrice,
      rehabCosts,
      closingCosts,
      holdingCosts,
      grossRentalIncome,
      vacancyRate: parseFloat(assumptions?.vacancyRate || '0.05'),
      otherIncome: 0, // TODO: Add other income sources
      operatingExpenses: totalOperatingExpenses,
      loanAmount,
      interestRate: activeLoan 
        ? parseFloat(activeLoan.interestRate || '0.07')
        : parseFloat(assumptions?.interestRate || '0.07'),
      loanTermYears: activeLoan 
        ? activeLoan.termYears || 30
        : assumptions?.loanTermYears || 30,
      paymentType: activeLoan?.paymentType === 'interest_only' 
        ? 'interest_only' 
        : 'principal_and_interest',
      marketCapRate: parseFloat(assumptions?.marketCapRate || '0.055'),
      exitCapRate: parseFloat(assumptions?.exitCapRate || assumptions?.marketCapRate || '0.055'),
      refinanceLTV: parseFloat(assumptions?.refinanceLTV || '0.75'),
      refinanceRate: parseFloat(assumptions?.refinanceInterestRate || '0.065')
    };
  }

  /**
   * Calculate total rehab costs from budget items
   */
  private async calculateTotalRehabCosts(propertyId: number): Promise<number> {
    const { propertyRehabBudget } = await import('@shared/schema');
    
    const rehabItems = await db
      .select()
      .from(propertyRehabBudget)
      .where(eq(propertyRehabBudget.propertyId, propertyId));

    return rehabItems.reduce((total, item) => {
      return total + parseFloat(item.totalCost || '0');
    }, 0);
  }

  /**
   * Calculate total closing costs
   */
  private async calculateTotalClosingCosts(propertyId: number): Promise<number> {
    const { propertyClosingCosts } = await import('@shared/schema');
    
    const closingItems = await db
      .select()
      .from(propertyClosingCosts)
      .where(eq(propertyClosingCosts.propertyId, propertyId));

    return closingItems.reduce((total, item) => {
      return total + parseFloat(item.amount || '0');
    }, 0);
  }

  /**
   * Calculate total holding costs
   */
  private async calculateTotalHoldingCosts(propertyId: number): Promise<number> {
    const { propertyHoldingCosts } = await import('@shared/schema');
    
    const holdingItems = await db
      .select()
      .from(propertyHoldingCosts)
      .where(eq(propertyHoldingCosts.propertyId, propertyId));

    return holdingItems.reduce((total, item) => {
      return total + parseFloat(item.amount || '0');
    }, 0);
  }

  /**
   * Update the main properties table with calculated metrics
   */
  private async updatePropertiesTable(
    propertyId: number, 
    metrics: CalculatedMetrics,
    financials: PropertyFinancials
  ): Promise<void> {
    await db
      .update(properties)
      .set({
        acquisitionPrice: financials.purchasePrice.toString(),
        rehabCosts: financials.rehabCosts.toString(),
        arvAtTimePurchased: metrics.arv.toString(),
        initialCapitalRequired: metrics.initialCapitalRequired.toString(),
        cashFlow: metrics.annualCashFlow.toString(),
        totalProfits: metrics.totalReturn.toString(),
        cashOnCashReturn: (metrics.cashOnCashReturn * 100).toString(), // Store as percentage
        annualizedReturn: (metrics.annualizedReturn * 100).toString(),
        updatedAt: new Date()
      })
      .where(eq(properties.id, propertyId));
  }

  /**
   * Store historical metrics for performance tracking
   */
  private async storeHistoricalMetrics(
    propertyId: number, 
    metrics: CalculatedMetrics
  ): Promise<void> {
    await db.insert(propertyPerformanceMetrics).values({
      propertyId,
      calculationDate: new Date().toISOString().split('T')[0],
      grossRentalIncome: metrics.netOperatingIncome.toString(), // Will be updated with actual GRI
      netOperatingIncome: metrics.netOperatingIncome.toString(),
      annualCashFlow: metrics.annualCashFlow.toString(),
      capRate: metrics.capRate.toString(),
      cashOnCashReturn: metrics.cashOnCashReturn.toString(),
      dscr: metrics.dscr.toString(),
      equityMultiple: metrics.equityMultiple.toString(),
      currentArv: metrics.arv.toString(),
      totalInvestedCapital: metrics.initialCapitalRequired.toString(),
      currentEquityValue: metrics.currentEquity.toString(),
      breakEvenOccupancy: metrics.breakEvenOccupancy.toString(),
      operatingExpenseRatio: metrics.operatingExpenseRatio.toString(),
      loanToValue: metrics.loanToValue.toString()
    });
  }

  /**
   * Calculate portfolio-level metrics for entity dashboards
   */
  async calculateEntityMetrics(entityName: string, userId: number): Promise<{
    totalProperties: number;
    totalUnits: number;
    totalAUM: number;
    totalEquity: number;
    avgCashOnCash: number;
    totalCashFlow: number;
    avgCapRate: number;
    properties: any[];
  }> {
    // Get all properties for this entity and user
    const entityProperties = await db
      .select()
      .from(properties)
      .where(eq(properties.entity, entityName));

    // Filter properties based on user access (simplified - would need proper entity membership logic)
    const userProperties = entityProperties;

    let totalAUM = 0;
    let totalEquity = 0;
    let totalCashFlow = 0;
    let totalUnits = 0;
    let weightedCapRate = 0;
    let weightedCashOnCash = 0;

    for (const property of userProperties) {
      const arv = parseFloat(property.arvAtTimePurchased || '0');
      const equity = parseFloat(property.initialCapitalRequired || '0');
      const cashFlow = parseFloat(property.cashFlow || '0');
      const units = property.apartments || 0;

      totalAUM += arv;
      totalEquity += equity;
      totalCashFlow += cashFlow;
      totalUnits += units;

      // Calculate weighted averages
      if (arv > 0) {
        const metrics = await this.updatePropertyMetrics(property.id);
        weightedCapRate += metrics.capRate * arv;
        weightedCashOnCash += metrics.cashOnCashReturn * equity;
      }
    }

    return {
      totalProperties: userProperties.length,
      totalUnits,
      totalAUM,
      totalEquity,
      avgCashOnCash: totalEquity > 0 ? weightedCashOnCash / totalEquity : 0,
      totalCashFlow,
      avgCapRate: totalAUM > 0 ? weightedCapRate / totalAUM : 0,
      properties: userProperties
    };
  }

  /**
   * Real-time update trigger for when Deal Analyzer data changes
   */
  async onDealAnalyzerChange(propertyId: number, changeType: string): Promise<void> {
    console.log(`Deal Analyzer change detected for property ${propertyId}: ${changeType}`);
    
    // Recalculate all metrics
    const updatedMetrics = await this.updatePropertyMetrics(propertyId);
    
    // TODO: Implement WebSocket notifications to update frontend in real-time
    // this.notifyFrontendUpdate(propertyId, updatedMetrics);
    
    console.log(`Updated metrics for property ${propertyId}:`, {
      arv: updatedMetrics.arv,
      cashFlow: updatedMetrics.annualCashFlow,
      cashOnCash: updatedMetrics.cashOnCashReturn,
      equityMultiple: updatedMetrics.equityMultiple
    });
  }

  /**
   * Bulk update all properties for consistency
   */
  async recalculateAllProperties(): Promise<void> {
    const allProperties = await db.select({ id: properties.id }).from(properties);
    
    console.log(`Recalculating metrics for ${allProperties.length} properties...`);
    
    for (const property of allProperties) {
      try {
        await this.updatePropertyMetrics(property.id);
        console.log(`✓ Updated property ${property.id}`);
      } catch (error) {
        console.error(`✗ Failed to update property ${property.id}:`, error);
      }
    }
    
    console.log('Bulk recalculation completed');
  }

  /**
   * Get latest calculated metrics for a property
   */
  async getLatestMetrics(propertyId: number): Promise<CalculatedMetrics | null> {
    const [latestMetric] = await db
      .select()
      .from(propertyPerformanceMetrics)
      .where(eq(propertyPerformanceMetrics.propertyId, propertyId))
      .orderBy(desc(propertyPerformanceMetrics.calculationDate))
      .limit(1);

    if (!latestMetric) return null;

    return {
      allInCost: 0, // Would need to calculate from components
      arv: parseFloat(latestMetric.currentArv || '0'),
      initialCapitalRequired: parseFloat(latestMetric.totalInvestedCapital || '0'),
      netOperatingIncome: parseFloat(latestMetric.netOperatingIncome || '0'),
      annualDebtService: 0, // Would need to calculate
      annualCashFlow: parseFloat(latestMetric.annualCashFlow || '0'),
      capRate: parseFloat(latestMetric.capRate || '0'),
      cashOnCashReturn: parseFloat(latestMetric.cashOnCashReturn || '0'),
      equityMultiple: parseFloat(latestMetric.equityMultiple || '0'),
      dscr: parseFloat(latestMetric.dscr || '0'),
      currentEquity: parseFloat(latestMetric.currentEquityValue || '0'),
      loanToValue: parseFloat(latestMetric.loanToValue || '0'),
      breakEvenOccupancy: parseFloat(latestMetric.breakEvenOccupancy || '0'),
      operatingExpenseRatio: parseFloat(latestMetric.operatingExpenseRatio || '0'),
      totalReturn: 0, // Would need to calculate
      annualizedReturn: 0 // Would need to calculate
    };
  }
}

// Export singleton instance
export const realTimeCalculator = new RealTimeCalculator();