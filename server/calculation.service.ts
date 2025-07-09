import { db } from "./db";
import { 
  properties, 
  propertyRentRoll, 
  propertyExpenses, 
  propertyRehabBudget, 
  propertyAssumptions,
  propertyLoans,
  propertyClosingCosts,
  propertyHoldingCosts,
  propertyUnitTypes,
  propertyPerformanceMetrics,
  propertyCashFlow,
  propertyIncomeOther
} from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";

export interface PropertyMetrics {
  // Core Financial Metrics
  grossRentalIncome: number;
  effectiveGrossIncome: number;
  totalOperatingExpenses: number;
  netOperatingIncome: number;
  beforeTaxCashFlow: number;
  afterTaxCashFlow: number;
  
  // Investment Returns
  capRate: number;
  cashOnCashReturn: number;
  equityMultiple: number;
  irr: number;
  
  // Debt Metrics
  dscr: number;
  debtYield: number;
  loanToValue: number;
  
  // Risk Metrics
  breakEvenOccupancy: number;
  operatingExpenseRatio: number;
  
  // Valuation Metrics
  currentArv: number;
  totalInvestedCapital: number;
  currentEquityValue: number;
  
  // Project Costs
  totalRehab: number;
  totalClosingCosts: number;
  totalHoldingCosts: number;
  allInCost: number;
  
  // Debt Service
  monthlyDebtService: number;
  annualDebtService: number;
}

export class CalculationService {
  /**
   * Calculate comprehensive property metrics using normalized database structure
   */
  async calculatePropertyMetrics(propertyId: number): Promise<PropertyMetrics> {
    // Get property data
    const [property] = await db.select().from(properties).where(eq(properties.id, propertyId));
    if (!property) throw new Error('Property not found');

    // Get all related data in parallel for better performance
    const [
      assumptions,
      rentRoll,
      unitTypes,
      expenses,
      rehabItems,
      closingCosts,
      holdingCosts,
      loans,
      otherIncome
    ] = await Promise.all([
      this.getPropertyAssumptions(propertyId),
      db.select().from(propertyRentRoll).where(eq(propertyRentRoll.propertyId, propertyId)),
      db.select().from(propertyUnitTypes).where(eq(propertyUnitTypes.propertyId, propertyId)),
      db.select().from(propertyExpenses).where(eq(propertyExpenses.propertyId, propertyId)),
      db.select().from(propertyRehabBudget).where(eq(propertyRehabBudget.propertyId, propertyId)),
      db.select().from(propertyClosingCosts).where(eq(propertyClosingCosts.propertyId, propertyId)),
      db.select().from(propertyHoldingCosts).where(eq(propertyHoldingCosts.propertyId, propertyId)),
      db.select().from(propertyLoans).where(eq(propertyLoans.propertyId, propertyId)),
      db.select().from(propertyIncomeOther).where(eq(propertyIncomeOther.propertyId, propertyId))
    ]);

    // Calculate rental income using unit types for market rent data
    const grossRentalIncome = this.calculateGrossRentalIncome(rentRoll, unitTypes, assumptions);
    const vacancyRate = Number(assumptions.vacancyRate) || 0.05; // 5% default vacancy
    const vacancyLoss = grossRentalIncome * vacancyRate;
    const totalOtherIncome = otherIncome.reduce((sum, income) => sum + Number(income.annualAmount), 0);
    const effectiveGrossIncome = grossRentalIncome - vacancyLoss + totalOtherIncome;

    // Calculate operating expenses including management fee
    const baseOperatingExpenses = this.calculateOperatingExpenses(expenses, effectiveGrossIncome);
    const managementFee = Number(assumptions.managementFee) || 0.08; // 8% default management fee
    const managementFeeAmount = effectiveGrossIncome * managementFee;
    const totalOperatingExpenses = baseOperatingExpenses + managementFeeAmount;
    const netOperatingIncome = effectiveGrossIncome - totalOperatingExpenses;

    // Calculate debt service from active loan
    const activeLoan = loans.find(loan => loan.isActive) || loans[0];
    const monthlyDebtService = activeLoan ? Number(activeLoan.monthlyPayment) : 0;
    const annualDebtService = monthlyDebtService * 12;
    const beforeTaxCashFlow = netOperatingIncome - annualDebtService;

    // Calculate project costs
    const totalRehab = rehabItems.reduce((sum, item) => sum + Number(item.totalCost), 0);
    const totalClosingCosts = closingCosts.reduce((sum, cost) => sum + Number(cost.amount), 0);
    const totalHoldingCosts = holdingCosts.reduce((sum, cost) => sum + Number(cost.amount), 0);
    const allInCost = Number(assumptions.purchasePrice) + totalRehab + totalClosingCosts + totalHoldingCosts;

    // Calculate investment metrics
    const totalInvestedCapital = this.calculateTotalInvestedCapital(assumptions, totalRehab, totalClosingCosts, totalHoldingCosts);
    const currentArv = this.calculateCurrentARV(netOperatingIncome, assumptions);
    const currentLoanBalance = activeLoan ? Number(activeLoan.currentBalance) : 0;
    const currentEquityValue = currentArv - currentLoanBalance;

    // Calculate ratios and returns
    const capRate = currentArv > 0 ? netOperatingIncome / currentArv : 0;
    // Cash-on-Cash Return = Annual Cash Flow / Total Invested Capital (as percentage)
    const cashOnCashReturn = totalInvestedCapital > 0 ? (beforeTaxCashFlow / totalInvestedCapital) * 100 : 0;
    // Calculate equity multiple based on property status
    let equityMultiple = 0;
    const propertyRecord = await db.select().from(properties).where(eq(properties.id, propertyId)).then(rows => rows[0]);
    
    if (propertyRecord?.status === 'Sold') {
      // For sold properties: total profit / capital invested
      const totalProfit = Number(propertyRecord.totalProfits || 0);
      const capitalInvested = Number(propertyRecord.initialCapitalRequired || 0);
      equityMultiple = capitalInvested > 0 ? totalProfit / capitalInvested : 0;
    } else {
      // For active properties: (all-in cost + cashflow collected so far) / capital invested
      const cashflowCollected = Number(propertyRecord?.cashFlow || 0); // Annual cash flow from property
      const capitalInvested = Number(propertyRecord?.initialCapitalRequired || 0);
      equityMultiple = capitalInvested > 0 ? (allInCost + cashflowCollected) / capitalInvested : 0;
    }
    const dscr = annualDebtService > 0 ? netOperatingIncome / annualDebtService : 0;
    const loanToValue = currentArv > 0 ? currentLoanBalance / currentArv : 0;
    const debtYield = currentLoanBalance > 0 ? netOperatingIncome / currentLoanBalance : 0;

    // Calculate risk metrics
    const breakEvenOccupancy = this.calculateBreakEvenOccupancy(totalOperatingExpenses, annualDebtService, grossRentalIncome);
    const operatingExpenseRatio = effectiveGrossIncome > 0 ? totalOperatingExpenses / effectiveGrossIncome : 0;

    // Calculate IRR (simplified - assumes current cash flow continues)
    const irr = this.calculateSimpleIRR(totalInvestedCapital, beforeTaxCashFlow, currentEquityValue, Number(assumptions.holdPeriodYears));

    return {
      grossRentalIncome,
      effectiveGrossIncome,
      totalOperatingExpenses,
      netOperatingIncome,
      beforeTaxCashFlow,
      afterTaxCashFlow: beforeTaxCashFlow, // No tax assumptions - use actual tax calculations if needed
      capRate,
      cashOnCashReturn,
      equityMultiple,
      irr,
      dscr,
      debtYield,
      loanToValue,
      breakEvenOccupancy,
      operatingExpenseRatio,
      currentArv,
      totalInvestedCapital,
      currentEquityValue,
      totalRehab,
      totalClosingCosts,
      totalHoldingCosts,
      allInCost,
      monthlyDebtService,
      annualDebtService
    };
  }

  /**
   * Get property assumptions, creating defaults if none exist
   */
  private async getPropertyAssumptions(propertyId: number) {
    const [existing] = await db.select().from(propertyAssumptions).where(eq(propertyAssumptions.propertyId, propertyId));
    
    if (!existing) {
      // Create default assumptions with market standards
      const [newAssumptions] = await db.insert(propertyAssumptions).values({
        propertyId,
        unitCount: 1,
        purchasePrice: "0",
        vacancyRate: "0.05", // 5% default vacancy
        managementFee: "0.08", // 8% default management fee
        marketCapRate: "0.055", // 5.5% default cap rate
        loanPercentage: "0.75", // 75% default LTV
        holdPeriodYears: "5" // 5 year default hold period
      }).returning();
      return newAssumptions;
    }
    
    // Apply defaults to existing assumptions if values are missing or zero
    return {
      ...existing,
      vacancyRate: existing.vacancyRate || "0.05",
      managementFee: existing.managementFee || "0.08", 
      marketCapRate: existing.marketCapRate || "0.055",
      loanPercentage: existing.loanPercentage || "0.75",
      holdPeriodYears: existing.holdPeriodYears || "5"
    };
  }

  /**
   * Calculate gross rental income from rent roll and unit types
   */
  private calculateGrossRentalIncome(rentRoll: any[], unitTypes: any[], assumptions: any): number {
    if (!rentRoll?.length && !unitTypes?.length) return 0;
    
    let totalMonthlyRent = 0;
    
    // First check rent roll for actual rents
    if (rentRoll?.length) {
      totalMonthlyRent = rentRoll.reduce((sum, unit) => {
        const unitType = unitTypes.find(ut => ut.unitTypeId === unit.unitTypeId);
        const rent = unitType ? Number(unitType.marketRent) : Number(unit.proFormaRent || unit.currentRent || 0);
        return sum + rent;
      }, 0);
    }
    
    // If no rent roll or total is 0, use unit types
    if (totalMonthlyRent === 0 && unitTypes?.length) {
      totalMonthlyRent = unitTypes.reduce((sum, unitType) => {
        const units = Number(unitType.units || 1);
        const rent = Number(unitType.marketRent || 0);
        return sum + (units * rent);
      }, 0);
    }
    
    return totalMonthlyRent * 12; // Annual income
  }

  /**
   * Calculate operating expenses with percentage-based expenses
   */
  private calculateOperatingExpenses(expenses: any[], effectiveGrossIncome: number): number {
    return expenses.reduce((sum, expense) => {
      if (expense.isPercentage && expense.percentageBase) {
        const percentageValue = Number(expense.annualAmount) / 100;
        return sum + (effectiveGrossIncome * percentageValue);
      }
      return sum + Number(expense.annualAmount || 0);
    }, 0);
  }

  /**
   * Calculate total invested capital (down payment + closing costs + holding costs)
   * Note: Rehab costs are excluded as they are financed through the loan
   */
  private calculateTotalInvestedCapital(assumptions: any, totalRehab: number, totalClosingCosts: number, totalHoldingCosts: number): number {
    const purchasePrice = Number(assumptions.purchasePrice);
    const loanPercentage = Number(assumptions.loanPercentage);
    const downPayment = purchasePrice * (1 - loanPercentage);
    return downPayment + totalClosingCosts + totalHoldingCosts;
  }

  /**
   * Calculate current ARV using cap rate method
   */
  private calculateCurrentARV(netOperatingIncome: number, assumptions: any): number {
    const marketCapRate = Number(assumptions.marketCapRate) || 0.055; // Default 5.5% cap rate
    if (netOperatingIncome > 0 && marketCapRate > 0) {
      return netOperatingIncome / marketCapRate;
    }
    return Number(assumptions.purchasePrice); // Fallback to purchase price
  }

  /**
   * Calculate break-even occupancy rate
   */
  private calculateBreakEvenOccupancy(totalOperatingExpenses: number, annualDebtService: number, grossRentalIncome: number): number {
    if (grossRentalIncome > 0) {
      return (totalOperatingExpenses + annualDebtService) / grossRentalIncome;
    }
    return 0;
  }

  /**
   * Calculate simplified IRR based on current metrics
   */
  private calculateSimpleIRR(initialInvestment: number, annualCashFlow: number, terminalValue: number, holdPeriodYears: number): number {
    if (initialInvestment <= 0 || holdPeriodYears <= 0) return 0;
    
    // Simple IRR calculation: solve for rate where NPV = 0
    // This is a simplified calculation - real IRR would require iterative solving
    const totalReturn = (annualCashFlow * holdPeriodYears) + terminalValue;
    const totalMultiple = totalReturn / initialInvestment;
    return Math.pow(totalMultiple, 1 / holdPeriodYears) - 1;
  }

  /**
   * Store property performance metrics in database for historical tracking
   */
  async storePropertyMetrics(propertyId: number, metrics: PropertyMetrics): Promise<void> {
    await db.insert(propertyPerformanceMetrics).values({
      propertyId,
      calculationDate: new Date().toISOString().split('T')[0],
      grossRentalIncome: metrics.grossRentalIncome.toString(),
      netOperatingIncome: metrics.netOperatingIncome.toString(),
      annualCashFlow: metrics.beforeTaxCashFlow.toString(),
      capRate: metrics.capRate.toString(),
      cashOnCashReturn: metrics.cashOnCashReturn.toString(),
      dscr: metrics.dscr.toString(),
      equityMultiple: metrics.equityMultiple.toString(),
      irr: metrics.irr.toString(),
      currentArv: metrics.currentArv.toString(),
      totalInvestedCapital: metrics.totalInvestedCapital.toString(),
      currentEquityValue: metrics.currentEquityValue.toString(),
      breakEvenOccupancy: metrics.breakEvenOccupancy.toString(),
      operatingExpenseRatio: metrics.operatingExpenseRatio.toString(),
      loanToValue: metrics.loanToValue.toString(),
      debtYield: metrics.debtYield.toString()
    });
  }

  /**
   * Calculate loan payment based on parameters
   */
  private calculateLoanPayment(amount: number, annualRate: number, termYears: number, paymentType: string): number {
    if (paymentType === 'interest_only') {
      return (amount * annualRate) / 12;
    }
    
    // Principal and interest calculation
    const monthlyRate = annualRate / 12;
    const numPayments = termYears * 12;
    
    if (monthlyRate === 0) return amount / numPayments;
    
    return amount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
           (Math.pow(1 + monthlyRate, numPayments) - 1);
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
    const userProperties = await db.select()
      .from(properties)
      .where(sql`EXISTS (
        SELECT 1 FROM entity_memberships em 
        WHERE em.user_id = ${userId} 
        AND em.entity_name = ${properties.entity}
      )`);

    let totalAUM = 0;
    let totalUnits = 0;
    let totalCashFlow = 0;
    let totalEquity = 0;
    let weightedCapRate = 0;

    for (const property of userProperties) {
      const metrics = await this.calculatePropertyMetrics(property.id);
      
      totalAUM += metrics.currentArv;
      totalUnits += property.apartments;
      totalCashFlow += metrics.beforeTaxCashFlow;
      totalEquity += metrics.currentEquityValue;
      weightedCapRate += metrics.capRate * metrics.currentArv;
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

export const calculationService = new CalculationService();