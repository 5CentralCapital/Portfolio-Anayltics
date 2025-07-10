import { db } from "./db";
import { 
  propertyPerformanceMetrics,
  properties
} from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { calculateProperty, formatters, type CalculationResult } from "@shared/calculations/calculation-engine";

export interface PropertyMetrics extends CalculationResult {
  // Keep interface for backward compatibility
  // All fields now come from CalculationResult
}

export class CalculationService {
  /**
   * Calculate comprehensive property metrics using unified engine
   */
  async calculatePropertyMetrics(propertyId: number): Promise<PropertyMetrics> {
    // Get property with all related data
    const property = await this.getPropertyWithData(propertyId);
    if (!property) throw new Error('Property not found');

    // Use unified calculation engine
    const metrics = calculateProperty(property);
    
    // Return metrics (PropertyMetrics extends CalculationResult)
    return metrics;
  }

  /**
   * Get property with all necessary data for calculations
   */
  private async getPropertyWithData(propertyId: number) {
    const query = sql`
      SELECT 
        p.*,
        COALESCE(
          json_agg(DISTINCT jsonb_build_object(
            'id', rr.id,
            'unitNumber', rr.unit_number,
            'currentRent', rr.current_rent,
            'proFormaRent', rr.pro_forma_rent,
            'isVacant', rr.is_vacant,
            'leaseStart', rr.lease_start,
            'leaseEnd', rr.lease_end,
            'tenantName', rr.tenant_name
          )) FILTER (WHERE rr.id IS NOT NULL), 
          '[]'::json
        ) as rent_roll,
        COALESCE(
          json_agg(DISTINCT jsonb_build_object(
            'id', pl.id,
            'loanName', pl.loan_name,
            'monthlyPayment', pl.monthly_payment,
            'currentBalance', pl.current_balance,
            'originalAmount', pl.original_amount,
            'interestRate', pl.interest_rate,
            'isActive', pl.is_active
          )) FILTER (WHERE pl.id IS NOT NULL),
          '[]'::json
        ) as property_loans,
        COALESCE(
          json_agg(DISTINCT jsonb_build_object(
            'id', pa.id,
            'vacancyRate', pa.vacancy_rate,
            'expenseRatio', pa.expense_ratio,
            'managementFee', pa.management_fee,
            'marketCapRate', pa.market_cap_rate,
            'loanPercentage', pa.loan_percentage,
            'interestRate', pa.interest_rate,
            'loanTermYears', pa.loan_term_years
          )) FILTER (WHERE pa.id IS NOT NULL),
          '[]'::json
        ) as assumptions_array,
        COALESCE(
          json_agg(DISTINCT jsonb_build_object(
            'id', pe.id,
            'expenseType', pe.expense_type,
            'expenseName', pe.expense_name,
            'annualAmount', pe.annual_amount
          )) FILTER (WHERE pe.id IS NOT NULL),
          '[]'::json
        ) as expenses,
        COALESCE(
          json_agg(DISTINCT jsonb_build_object(
            'id', ut.id,
            'unitTypeId', ut.unit_type_id,
            'name', ut.name,
            'units', ut.units,
            'marketRent', ut.market_rent
          )) FILTER (WHERE ut.id IS NOT NULL),
          '[]'::json
        ) as unit_types
      FROM properties p
      LEFT JOIN property_rent_roll rr ON rr.property_id = p.id
      LEFT JOIN property_loans pl ON pl.property_id = p.id
      LEFT JOIN property_assumptions pa ON pa.property_id = p.id
      LEFT JOIN property_expenses pe ON pe.property_id = p.id
      LEFT JOIN property_unit_types ut ON ut.property_id = p.id
      WHERE p.id = ${propertyId}
      GROUP BY p.id
    `;

    const result = await db.execute(query);
    if (!result.rows || result.rows.length === 0) return null;

    const row = result.rows[0] as any;
    
    // Transform the data to match PropertyData interface
    return {
      id: row.id,
      status: row.status,
      address: row.address,
      apartments: row.apartments,
      acquisitionPrice: row.acquisition_price,
      initialCapitalRequired: row.initial_capital_required,
      salePrice: row.sale_price,
      totalProfits: row.total_profits,
      arvAtTimePurchased: row.arv_at_time_purchased,
      rehabCosts: row.rehab_costs,
      rentRoll: row.rent_roll || [],
      propertyLoans: row.property_loans || [],
      assumptions: row.assumptions_array?.[0] || null,
      expenses: row.expenses || [],
      unitTypes: row.unit_types || [],
      dealAnalyzerData: row.deal_analyzer_data
    };
  }

  /**
   * Store property performance metrics in database for historical tracking
   */
  async storePropertyMetrics(propertyId: number, metrics: PropertyMetrics): Promise<void> {
    await db.insert(propertyPerformanceMetrics).values({
      propertyId,
      calculationDate: new Date().toISOString().split('T')[0],
      grossRentalIncome: metrics.annualGrossRent.toString(),
      netOperatingIncome: metrics.annualNOI.toString(),
      annualCashFlow: metrics.annualCashFlow.toString(),
      // Store as decimals (not percentages)
      capRate: Math.min(metrics.capRate, 0.9999).toString(),
      cashOnCashReturn: Math.min(metrics.cashOnCashReturn, 0.9999).toString(),
      dscr: metrics.dscr.toString(),
      equityMultiple: metrics.equityMultiple.toString(),
      irr: "0", // Not calculated yet
      currentArv: metrics.currentARV.toString(),
      totalInvestedCapital: metrics.totalInvestedCapital.toString(),
      currentEquityValue: metrics.currentEquity.toString(),
      breakEvenOccupancy: "0", // Not calculated yet
      operatingExpenseRatio: (metrics.annualOperatingExpenses / metrics.effectiveGrossIncome).toString(),
      loanToValue: (metrics.currentDebt / metrics.currentARV).toString(),
      debtYield: metrics.currentARV > 0 ? (metrics.annualNOI / metrics.currentARV).toString() : "0"
    });
  }

  /**
   * Update property metrics whenever dependent data changes
   */
  async updatePropertyMetrics(propertyId: number): Promise<void> {
    const metrics = await this.calculatePropertyMetrics(propertyId);
    await this.storePropertyMetrics(propertyId, metrics);
  }

  /**
   * Calculate portfolio-level metrics for a user
   */
  async calculatePortfolioMetrics(userId: number): Promise<{
    totalAUM: number;
    totalUnits: number;
    averageCapRate: number;
    totalCashFlow: number;
    totalEquity: number;
  }> {
    // Get user's properties through entity memberships
    const userProperties = await db.execute(sql`
      SELECT DISTINCT p.*
      FROM properties p
      WHERE EXISTS (
        SELECT 1 FROM entity_memberships em 
        WHERE em.user_id = ${userId} 
        AND em.entity_name = p.entity
      )
    `);

    let totalAUM = 0;
    let totalUnits = 0;
    let totalCashFlow = 0;
    let totalEquity = 0;
    let weightedCapRate = 0;

    for (const row of userProperties.rows) {
      const property = row as any;
      const propertyWithData = await this.getPropertyWithData(property.id);
      if (!propertyWithData) continue;
      
      const metrics = calculateProperty(propertyWithData);
      
      totalAUM += metrics.currentARV;
      totalUnits += property.apartments || 0;
      totalCashFlow += metrics.annualCashFlow;
      totalEquity += metrics.currentEquity;
      weightedCapRate += metrics.capRate * metrics.currentARV;
    }

    const averageCapRate = totalAUM > 0 ? weightedCapRate / totalAUM : 0;

    return {
      totalAUM,
      totalUnits,
      averageCapRate,
      totalCashFlow,
      totalEquity
    };
  }
}

// Export singleton instance and formatters
export const calculationService = new CalculationService();
export { formatters };