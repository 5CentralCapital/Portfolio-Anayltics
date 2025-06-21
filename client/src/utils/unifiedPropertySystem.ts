/**
 * Unified Property Data System
 * 
 * This system centralizes all property data management and calculations
 * to ensure consistency across all dashboard pages and components.
 * All property operations should go through this system.
 */

import { calculatePropertyMetrics, PropertyMetrics, PropertyData } from './propertyCalculations';

export interface UnifiedPropertyData extends PropertyData {
  // Computed metrics (always calculated, never stored)
  computedMetrics?: PropertyMetrics;
  // Last calculation timestamp
  lastCalculated?: number;
  // Parsed deal analyzer data for easier access
  parsedDealData?: any;
}

/**
 * Unified Property Manager
 * Centralizes all property data operations and ensures consistency
 */
export class UnifiedPropertyManager {
  private static instance: UnifiedPropertyManager;
  private propertyCache = new Map<number, UnifiedPropertyData>();
  private calculationCache = new Map<number, { metrics: PropertyMetrics; timestamp: number }>();
  private readonly CACHE_DURATION = 30000; // 30 seconds

  private constructor() {}

  static getInstance(): UnifiedPropertyManager {
    if (!UnifiedPropertyManager.instance) {
      UnifiedPropertyManager.instance = new UnifiedPropertyManager();
    }
    return UnifiedPropertyManager.instance;
  }

  /**
   * Get property with unified calculations
   */
  getUnifiedProperty(property: PropertyData): UnifiedPropertyData {
    const now = Date.now();
    const cacheKey = property.id;
    
    // Check if we have a recent calculation cached
    const cached = this.calculationCache.get(cacheKey);
    if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
      return {
        ...property,
        computedMetrics: cached.metrics,
        lastCalculated: cached.timestamp,
        parsedDealData: this.parseDealAnalyzerData(property.dealAnalyzerData)
      };
    }

    // Calculate fresh metrics
    const metrics = calculatePropertyMetrics(property);
    
    // Cache the calculation
    this.calculationCache.set(cacheKey, { metrics, timestamp: now });
    
    const unifiedProperty: UnifiedPropertyData = {
      ...property,
      computedMetrics: metrics,
      lastCalculated: now,
      parsedDealData: this.parseDealAnalyzerData(property.dealAnalyzerData)
    };

    this.propertyCache.set(cacheKey, unifiedProperty);
    return unifiedProperty;
  }

  /**
   * Update property and recalculate all dependent values
   */
  async updateProperty(propertyId: number, updates: Partial<PropertyData>): Promise<UnifiedPropertyData> {
    // Clear cache for this property
    this.calculationCache.delete(propertyId);
    this.propertyCache.delete(propertyId);

    // Make API call to update database
    const response = await fetch(`/api/properties/${propertyId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      throw new Error(`Failed to update property: ${response.statusText}`);
    }

    const updatedProperty = await response.json();
    
    // Return unified property with fresh calculations
    return this.getUnifiedProperty(updatedProperty);
  }

  /**
   * Update deal analyzer data and sync with property fields
   */
  async updateDealAnalyzerData(propertyId: number, dealData: any): Promise<UnifiedPropertyData> {
    // Calculate derived fields from deal analyzer data
    const derivedFields = this.calculateDerivedFields(dealData);
    
    const updates = {
      dealAnalyzerData: JSON.stringify(dealData),
      ...derivedFields
    };

    return await this.updateProperty(propertyId, updates);
  }

  /**
   * Calculate derived property fields from deal analyzer data
   */
  private calculateDerivedFields(dealData: any): Partial<PropertyData> {
    const derived: Partial<PropertyData> = {};

    // Calculate monthly cash flow from NOI and debt service
    if (dealData.incomeAndExpenses || dealData.rentRoll) {
      let grossRentalIncome = 0;
      let totalExpenses = 0;
      let debtService = 0;

      // Calculate income
      if (dealData.rentRoll && Array.isArray(dealData.rentRoll)) {
        grossRentalIncome = dealData.rentRoll.reduce((sum: number, unit: any) => 
          sum + (parseFloat(unit.proFormaRent) || 0), 0) * 12;
      }

      const vacancyRate = dealData.assumptions?.vacancyRate || 0.05;
      const effectiveGrossIncome = grossRentalIncome * (1 - vacancyRate);

      // Calculate expenses
      if (dealData.incomeAndExpenses?.operatingExpenses) {
        totalExpenses = dealData.incomeAndExpenses.operatingExpenses.reduce((sum: number, expense: any) => 
          sum + (parseFloat(expense.annualAmount) || 0), 0);
      }

      const noi = effectiveGrossIncome - totalExpenses;

      // Calculate debt service from active loan
      if (dealData.financing?.loans) {
        const activeLoan = dealData.financing.loans.find((loan: any) => loan.isActive);
        if (activeLoan) {
          debtService = parseFloat(activeLoan.monthlyPayment || '0') * 12;
        }
      }

      const annualCashFlow = noi - debtService;
      derived.cashFlow = (annualCashFlow / 12).toString();
    }

    // Calculate ARV from NOI and cap rate
    if (dealData.exitAnalysis?.salesCapRate && dealData.incomeAndExpenses) {
      const capRate = parseFloat(dealData.exitAnalysis.salesCapRate) / 100;
      if (capRate > 0) {
        const metrics = calculatePropertyMetrics({ dealAnalyzerData: JSON.stringify(dealData) } as PropertyData);
        derived.arvAtTimePurchased = metrics.arv.toString();
      }
    }

    // Calculate cash-on-cash return
    if (derived.cashFlow && dealData.assumptions) {
      const annualCashFlow = parseFloat(derived.cashFlow) * 12;
      const purchasePrice = dealData.assumptions.purchasePrice || 0;
      const loanPercentage = dealData.assumptions.loanPercentage || 0.8;
      const rehabCosts = this.calculateTotalRehabCosts(dealData);
      const closingCosts = purchasePrice * 0.02; // Estimate 2%

      const initialCapital = (purchasePrice * (1 - loanPercentage)) + rehabCosts + closingCosts;
      
      if (initialCapital > 0) {
        derived.cashOnCashReturn = ((annualCashFlow / initialCapital) * 100).toString();
        derived.initialCapitalRequired = initialCapital.toString();
      }
    }

    return derived;
  }

  /**
   * Calculate total rehab costs from deal analyzer data
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
   * Parse deal analyzer data safely
   */
  private parseDealAnalyzerData(dealAnalyzerData?: string): any {
    if (!dealAnalyzerData) return null;
    
    try {
      return JSON.parse(dealAnalyzerData);
    } catch (error) {
      console.warn('Failed to parse deal analyzer data:', error);
      return null;
    }
  }

  /**
   * Get all properties with unified calculations
   */
  async getAllUnifiedProperties(): Promise<UnifiedPropertyData[]> {
    const response = await fetch('/api/properties');
    if (!response.ok) {
      throw new Error(`Failed to fetch properties: ${response.statusText}`);
    }

    const properties = await response.json();
    return properties.map((property: PropertyData) => this.getUnifiedProperty(property));
  }

  /**
   * Clear all caches (useful for forced refresh)
   */
  clearCache(): void {
    this.propertyCache.clear();
    this.calculationCache.clear();
  }

  /**
   * Sync property status change and update related calculations
   */
  async updatePropertyStatus(propertyId: number, newStatus: string): Promise<UnifiedPropertyData> {
    // Status changes may affect calculations (especially for sold properties)
    this.calculationCache.delete(propertyId);
    
    const updates: Partial<PropertyData> = { status: newStatus };
    
    // If changing to sold status, may need additional fields
    if (newStatus === 'Sold') {
      // Keep existing sale data or prompt for it
    }

    return await this.updateProperty(propertyId, updates);
  }

  /**
   * Validate data consistency across property record
   */
  validatePropertyConsistency(property: UnifiedPropertyData): string[] {
    const issues: string[] = [];
    
    if (!property.computedMetrics) {
      issues.push('Missing computed metrics');
      return issues;
    }

    const { computedMetrics } = property;
    const storedCashFlow = parseFloat(property.cashFlow || '0');
    const computedCashFlow = computedMetrics.monthlyCashFlow;

    // Check cash flow consistency (allow 5% variance)
    if (Math.abs(storedCashFlow - computedCashFlow) > Math.abs(storedCashFlow * 0.05)) {
      issues.push(`Cash flow inconsistency: stored ${storedCashFlow}, computed ${computedCashFlow}`);
    }

    // Check cash-on-cash return consistency
    const storedCOC = parseFloat(property.cashOnCashReturn || '0');
    const computedCOC = computedMetrics.cashOnCashReturn;

    if (Math.abs(storedCOC - computedCOC) > 1) { // Allow 1% variance
      issues.push(`Cash-on-cash return inconsistency: stored ${storedCOC}%, computed ${computedCOC}%`);
    }

    return issues;
  }
}

// Export singleton instance
export const unifiedPropertyManager = UnifiedPropertyManager.getInstance();

/**
 * Hook for React components to use unified property data
 */
export function useUnifiedProperty(property: PropertyData): UnifiedPropertyData {
  return unifiedPropertyManager.getUnifiedProperty(property);
}

/**
 * Hook for updating properties through unified system
 */
export function useUnifiedPropertyUpdate() {
  return {
    updateProperty: (id: number, updates: Partial<PropertyData>) => 
      unifiedPropertyManager.updateProperty(id, updates),
    updateDealAnalyzerData: (id: number, dealData: any) => 
      unifiedPropertyManager.updateDealAnalyzerData(id, dealData),
    updateStatus: (id: number, status: string) => 
      unifiedPropertyManager.updatePropertyStatus(id, status)
  };
}