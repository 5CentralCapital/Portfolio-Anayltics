import { db } from "./db";
import { properties, propertyRentRoll, propertyExpenses, propertyRehabBudget, entityMemberships } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface PropertyMetrics {
  grossRentalIncome: number;
  totalExpenses: number;
  netOperatingIncome: number;
  cashFlow: number;
  capRate: number;
  cashOnCashReturn: number;
  dscr: number;
  arv: number;
  equityMultiple: number;
  totalRehab: number;
  allInCost: number;
}

export class CalculationService {
  /**
   * Calculate real-time property metrics based on current data
   */
  async calculatePropertyMetrics(propertyId: number): Promise<PropertyMetrics> {
    // Get property data
    const [property] = await db.select().from(properties).where(eq(properties.id, propertyId));
    if (!property) throw new Error('Property not found');

    // Get rent roll data
    const rentRoll = await db.select().from(propertyRentRoll).where(eq(propertyRentRoll.propertyId, propertyId));
    
    // Get expenses
    const expenses = await db.select().from(propertyExpenses).where(eq(propertyExpenses.propertyId, propertyId));
    
    // Get rehab budget
    const rehabItems = await db.select().from(propertyRehabBudget).where(eq(propertyRehabBudget.propertyId, propertyId));

    // Calculate metrics dynamically using actual schema properties
    const grossRentalIncome = rentRoll.reduce((sum, unit) => {
      const rent = !unit.isVacant ? Number(unit.currentRent || 0) : Number(unit.proFormaRent || 0);
      return sum + (rent * 12);
    }, 0);

    const totalExpenses = expenses.reduce((sum, expense) => {
      if (expense.isPercentage) {
        const percentageValue = Number(expense.percentageBase || 0) / 100;
        return sum + (grossRentalIncome * percentageValue);
      }
      return sum + (Number(expense.annualAmount || 0));
    }, 0);

    const totalRehab = rehabItems.reduce((sum, item) => sum + Number(item.totalCost || 0), 0);
    
    // Get purchase price from dealAnalyzerData if available
    let purchasePrice = 0;
    if (property.dealAnalyzerData) {
      try {
        const dealData = JSON.parse(property.dealAnalyzerData);
        purchasePrice = dealData.assumptions?.purchasePrice || 0;
      } catch (e) {
        purchasePrice = 0;
      }
    }
    
    const allInCost = purchasePrice + totalRehab;
    
    const netOperatingIncome = grossRentalIncome - totalExpenses;
    const capRate = purchasePrice > 0 ? netOperatingIncome / purchasePrice : 0;
    
    // Get active loan for debt service
    const dealData = property.dealAnalyzerData ? JSON.parse(property.dealAnalyzerData) : {};
    const activeLoan = dealData.loans?.find((loan: any) => loan.isActive) || dealData.loans?.[0];
    
    let annualDebtService = 0;
    if (activeLoan) {
      const monthlyPayment = this.calculateLoanPayment(
        Number(activeLoan.amount),
        Number(activeLoan.interestRate),
        Number(activeLoan.termYears),
        activeLoan.paymentType || 'amortizing'
      );
      annualDebtService = monthlyPayment * 12;
    }

    const cashFlow = netOperatingIncome - annualDebtService;
    const dscr = annualDebtService > 0 ? netOperatingIncome / annualDebtService : 0;
    
    // Calculate ARV based on current NOI and market cap rate
    let marketCapRate = 0.055;
    if (property.dealAnalyzerData) {
      try {
        const dealData = JSON.parse(property.dealAnalyzerData);
        marketCapRate = dealData.assumptions?.marketCapRate || 0.055;
      } catch (e) {
        marketCapRate = 0.055;
      }
    }
    const arv = netOperatingIncome > 0 ? netOperatingIncome / marketCapRate : purchasePrice;
    
    // Calculate equity multiple
    const initialInvestment = Number(property.initialCapitalRequired) || allInCost * 0.2;
    const equityMultiple = initialInvestment > 0 ? (arv - allInCost) / initialInvestment : 0;
    
    const cashOnCashReturn = initialInvestment > 0 ? cashFlow / initialInvestment : 0;

    return {
      grossRentalIncome,
      totalExpenses,
      netOperatingIncome,
      cashFlow,
      capRate,
      cashOnCashReturn,
      dscr,
      arv,
      equityMultiple,
      totalRehab,
      allInCost
    };
  }

  /**
   * Calculate loan payment based on parameters
   */
  private calculateLoanPayment(amount: number, annualRate: number, termYears: number, paymentType: string): number {
    if (paymentType === 'interest_only') {
      return amount * (annualRate / 12);
    }

    const monthlyRate = annualRate / 12;
    const totalPayments = termYears * 12;
    
    if (monthlyRate === 0) return amount / totalPayments;
    
    const numerator = monthlyRate * Math.pow(1 + monthlyRate, totalPayments);
    const denominator = Math.pow(1 + monthlyRate, totalPayments) - 1;
    
    return amount * (numerator / denominator);
  }

  /**
   * Update property metrics whenever dependent data changes
   */
  async updatePropertyMetrics(propertyId: number): Promise<void> {
    const metrics = await this.calculatePropertyMetrics(propertyId);
    
    // Store calculated metrics in dealAnalyzerData JSON field
    const property = await db.query.properties.findFirst({
      where: eq(properties.id, propertyId)
    });
    
    if (property) {
      let dealData = {};
      if (property.dealAnalyzerData) {
        try {
          dealData = JSON.parse(property.dealAnalyzerData);
        } catch (e) {
          dealData = {};
        }
      }
      
      // Update calculated metrics
      dealData.calculatedMetrics = {
        grossRentalIncome: metrics.grossRentalIncome,
        netOperatingIncome: metrics.netOperatingIncome,
        cashFlow: metrics.cashFlow,
        capRate: metrics.capRate,
        arv: metrics.arv,
        updatedAt: new Date()
      };
      
      await db.update(properties)
        .set({
          dealAnalyzerData: JSON.stringify(dealData)
        })
        .where(eq(properties.id, propertyId));
    }
  }

  /**
   * Recalculate portfolio-level metrics
   */
  async calculatePortfolioMetrics(userId: number): Promise<{
    totalAUM: number;
    totalUnits: number;
    averageCapRate: number;
    totalCashFlow: number;
    totalEquity: number;
  }> {
    // Get user's entity names first
    const userEntities = await db.select({ entityName: entityMemberships.entityName })
      .from(entityMemberships)
      .where(eq(entityMemberships.userId, userId));
    
    const entityNames = userEntities.map(e => e.entityName);
    
    // Get user's properties through entity memberships
    const userProperties = await db.query.properties.findMany({
      where: (properties, { inArray }) => inArray(properties.entity, entityNames)
    });

    let totalAUM = 0;
    let totalUnits = 0;
    let totalCashFlow = 0;
    let totalEquity = 0;
    let weightedCapRate = 0;

    for (const property of userProperties) {
      const metrics = await this.calculatePropertyMetrics(property.id);
      
      totalAUM += metrics.arv;
      totalUnits += Number(property.apartments);
      totalCashFlow += metrics.cashFlow;
      // Calculate equity from dealAnalyzerData if available
      let purchasePrice = 0;
      if (property.dealAnalyzerData) {
        try {
          const dealData = JSON.parse(property.dealAnalyzerData);
          purchasePrice = dealData.assumptions?.purchasePrice || 0;
        } catch (e) {
          purchasePrice = 0;
        }
      }
      totalEquity += metrics.arv - purchasePrice;
      weightedCapRate += metrics.capRate * metrics.arv;
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