import { db } from './db';
import { 
  properties,
  propertyAssumptions,
  propertyUnitTypes,
  propertyRentRoll,
  propertyExpenses,
  propertyRehabBudget,
  propertyClosingCosts,
  propertyHoldingCosts,
  propertyExitAnalysis,
  propertyIncomeOther
} from '@shared/schema';
import { eq } from 'drizzle-orm';

export interface PropertyFinancials {
  // Revenue calculations
  grossRentalIncome: number;
  effectiveGrossIncome: number;
  totalOtherIncome: number;
  
  // Expense calculations
  totalOperatingExpenses: number;
  netOperatingIncome: number;
  
  // Investment metrics
  totalRehabCosts: number;
  totalClosingCosts: number;
  totalHoldingCosts: number;
  allInCost: number;
  initialCapitalRequired: number;
  
  // Performance ratios
  cashFlow: number;
  cashOnCashReturn: number;
  capRate: number;
  arv: number;
  
  // Detailed breakdowns
  expenseBreakdown: Record<string, number>;
  rehabBreakdown: Record<string, number>;
  unitDetails: Array<{
    unitNumber: string;
    currentRent: number;
    proFormaRent: number;
    unitType: string;
  }>;
}

export class PropertyCalculationService {
  
  async calculatePropertyFinancials(propertyId: number): Promise<PropertyFinancials> {
    try {
      // Get property data from normalized tables first, fallback to JSON
      const [property] = await db.select().from(properties).where(eq(properties.id, propertyId));
      if (!property) {
        throw new Error(`Property ${propertyId} not found`);
      }

      // Try to get data from normalized tables
      const [assumptions] = await db.select().from(propertyAssumptions).where(eq(propertyAssumptions.propertyId, propertyId));
      const rentRoll = await db.select().from(propertyRentRoll).where(eq(propertyRentRoll.propertyId, propertyId));
      const expenses = await db.select().from(propertyExpenses).where(eq(propertyExpenses.propertyId, propertyId));
      const rehabBudget = await db.select().from(propertyRehabBudget).where(eq(propertyRehabBudget.propertyId, propertyId));
      const closingCosts = await db.select().from(propertyClosingCosts).where(eq(propertyClosingCosts.propertyId, propertyId));
      const holdingCosts = await db.select().from(propertyHoldingCosts).where(eq(propertyHoldingCosts.propertyId, propertyId));
      const [exitAnalysis] = await db.select().from(propertyExitAnalysis).where(eq(propertyExitAnalysis.propertyId, propertyId));
      const otherIncome = await db.select().from(propertyIncomeOther).where(eq(propertyIncomeOther.propertyId, propertyId));
      const unitTypes = await db.select().from(propertyUnitTypes).where(eq(propertyUnitTypes.propertyId, propertyId));

      // If no normalized data, fallback to JSON
      let dealData: any = null;
      if (!assumptions && !rentRoll.length && !expenses.length) {
        if (property.dealAnalyzerData) {
          dealData = JSON.parse(property.dealAnalyzerData);
        } else {
          // No data available, return default calculations
          return this.getDefaultCalculations(property);
        }
      }

      // Calculate financials using normalized data or JSON fallback
      return this.computeFinancials({
        property,
        assumptions: assumptions || dealData?.assumptions,
        rentRoll: rentRoll.length > 0 ? rentRoll : dealData?.rentRoll || [],
        expenses: expenses.length > 0 ? expenses : this.parseExpensesFromJSON(dealData?.expenses || {}),
        rehabBudget: rehabBudget.length > 0 ? rehabBudget : this.parseRehabFromJSON(dealData?.rehabBudgetSections || {}),
        closingCosts: closingCosts.length > 0 ? closingCosts : this.parseClosingCostsFromJSON(dealData?.closingCosts || {}),
        holdingCosts: holdingCosts.length > 0 ? holdingCosts : this.parseHoldingCostsFromJSON(dealData?.holdingCosts || {}),
        exitAnalysis: exitAnalysis || dealData?.exitAnalysis,
        otherIncome: otherIncome.length > 0 ? otherIncome : this.parseOtherIncomeFromJSON(dealData?.otherIncome || {}),
        unitTypes: unitTypes.length > 0 ? unitTypes : dealData?.unitTypes || []
      });

    } catch (error) {
      console.error(`Error calculating financials for property ${propertyId}:`, error);
      // Return default calculations if there's an error
      const [property] = await db.select().from(properties).where(eq(properties.id, propertyId));
      return this.getDefaultCalculations(property);
    }
  }

  private computeFinancials(data: any): PropertyFinancials {
    const { property, assumptions, rentRoll, expenses, rehabBudget, closingCosts, holdingCosts, exitAnalysis, otherIncome, unitTypes } = data;

    // Calculate rental income from rent roll
    const grossRentalIncome = rentRoll.reduce((total: number, unit: any) => {
      const monthlyRent = unit.proFormaRent || unit.currentRent || 0;
      return total + (Number(monthlyRent) * 12);
    }, 0);

    // Calculate vacancy loss
    const vacancyRate = assumptions?.vacancyRate || assumptions?.vacancy_rate || 0.05;
    const effectiveGrossIncome = grossRentalIncome * (1 - vacancyRate);

    // Calculate other income
    const totalOtherIncome = otherIncome.reduce((total: number, income: any) => {
      return total + (Number(income.annualAmount || income.annual_amount) || 0);
    }, 0);

    // Calculate operating expenses
    const expenseBreakdown: Record<string, number> = {};
    const totalOperatingExpenses = expenses.reduce((total: number, expense: any) => {
      const amount = Number(expense.annualAmount || expense.annual_amount) || 0;
      const expenseKey = expense.expenseType || expense.expense_type || expense.expenseName || expense.expense_name || 'Other';
      expenseBreakdown[expenseKey] = amount;
      return total + amount;
    }, 0);

    // Calculate NOI
    const netOperatingIncome = effectiveGrossIncome + totalOtherIncome - totalOperatingExpenses;

    // Calculate investment costs
    const rehabBreakdown: Record<string, number> = {};
    const totalRehabCosts = rehabBudget.reduce((total: number, item: any) => {
      const cost = Number(item.totalCost || item.total_cost) || 0;
      const section = item.section || 'General';
      rehabBreakdown[section] = (rehabBreakdown[section] || 0) + cost;
      return total + cost;
    }, 0);

    const totalClosingCosts = closingCosts.reduce((total: number, cost: any) => {
      return total + (Number(cost.amount) || 0);
    }, 0);

    const totalHoldingCosts = holdingCosts.reduce((total: number, cost: any) => {
      return total + (Number(cost.amount) || 0);
    }, 0);

    // Calculate purchase price and financing
    const purchasePrice = Number(assumptions?.purchasePrice || assumptions?.purchase_price) || 0;
    const loanPercentage = Number(assumptions?.loanPercentage || assumptions?.loan_percentage) || 0.8;
    const loanAmount = purchasePrice * loanPercentage;
    const downPayment = purchasePrice - loanAmount;

    const allInCost = purchasePrice + totalRehabCosts + totalClosingCosts + totalHoldingCosts;
    const initialCapitalRequired = downPayment + totalRehabCosts + totalClosingCosts + totalHoldingCosts;

    // Calculate debt service (simplified calculation)
    const interestRate = Number(assumptions?.interestRate || assumptions?.interest_rate) || 0.065;
    const loanTermYears = Number(assumptions?.loanTermYears || assumptions?.loan_term_years) || 30;
    const monthlyRate = interestRate / 12;
    const numPayments = loanTermYears * 12;
    const monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
    const annualDebtService = monthlyPayment * 12;

    // Calculate cash flow
    const cashFlow = netOperatingIncome - annualDebtService;

    // Calculate performance metrics
    const cashOnCashReturn = initialCapitalRequired > 0 ? (cashFlow / initialCapitalRequired) * 100 : 0;
    const capRate = purchasePrice > 0 ? (netOperatingIncome / purchasePrice) * 100 : 0;
    
    // Calculate ARV
    const marketCapRate = Number(assumptions?.marketCapRate || assumptions?.market_cap_rate) || 0.055;
    const arv = marketCapRate > 0 ? netOperatingIncome / marketCapRate : purchasePrice;

    // Prepare unit details
    const unitDetails = rentRoll.map((unit: any) => ({
      unitNumber: unit.unitNumber || unit.unit_number || '',
      currentRent: Number(unit.currentRent || unit.current_rent) || 0,
      proFormaRent: Number(unit.proFormaRent || unit.pro_forma_rent) || 0,
      unitType: unit.unitTypeId || unit.unit_type_id || 'Standard'
    }));

    return {
      grossRentalIncome,
      effectiveGrossIncome,
      totalOtherIncome,
      totalOperatingExpenses,
      netOperatingIncome,
      totalRehabCosts,
      totalClosingCosts,
      totalHoldingCosts,
      allInCost,
      initialCapitalRequired,
      cashFlow,
      cashOnCashReturn,
      capRate,
      arv,
      expenseBreakdown,
      rehabBreakdown,
      unitDetails
    };
  }

  private getDefaultCalculations(property: any): PropertyFinancials {
    // Fallback calculations using property card data
    const grossRentalIncome = Math.abs(Number(property.cashFlow)) * 12;
    const purchasePrice = Number(property.acquisitionPrice) || 0;
    const rehabCosts = Number(property.rehabCosts) || 0;
    
    return {
      grossRentalIncome,
      effectiveGrossIncome: grossRentalIncome * 0.95,
      totalOtherIncome: 0,
      totalOperatingExpenses: grossRentalIncome * 0.45,
      netOperatingIncome: grossRentalIncome * 0.55,
      totalRehabCosts: rehabCosts,
      totalClosingCosts: purchasePrice * 0.03,
      totalHoldingCosts: 15000,
      allInCost: purchasePrice + rehabCosts,
      initialCapitalRequired: Number(property.initialCapitalRequired) || 0,
      cashFlow: Number(property.cashFlow) || 0,
      cashOnCashReturn: Number(property.cashOnCashReturn) || 0,
      capRate: purchasePrice > 0 ? (grossRentalIncome * 0.55 / purchasePrice) * 100 : 0,
      arv: Number(property.arvAtTimePurchased) || purchasePrice,
      expenseBreakdown: {},
      rehabBreakdown: {},
      unitDetails: []
    };
  }

  // Helper methods to parse JSON data
  private parseExpensesFromJSON(expensesJSON: any): any[] {
    return Object.entries(expensesJSON || {}).map(([key, value]) => ({
      expenseType: key,
      expenseName: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
      annualAmount: Number(value) || 0
    }));
  }

  private parseRehabFromJSON(rehabJSON: any): any[] {
    const items: any[] = [];
    Object.entries(rehabJSON || {}).forEach(([section, sectionItems]: [string, any]) => {
      if (Array.isArray(sectionItems)) {
        sectionItems.forEach(item => {
          items.push({
            section,
            category: item.category,
            totalCost: Number(item.totalCost) || 0
          });
        });
      }
    });
    return items;
  }

  private parseClosingCostsFromJSON(closingJSON: any): any[] {
    return Object.entries(closingJSON || {}).map(([key, value]) => ({
      costType: key,
      amount: Number(value) || 0
    }));
  }

  private parseHoldingCostsFromJSON(holdingJSON: any): any[] {
    return Object.entries(holdingJSON || {}).map(([key, value]) => ({
      costType: key,
      amount: Number(value) || 0
    }));
  }

  private parseOtherIncomeFromJSON(incomeJSON: any): any[] {
    return Object.entries(incomeJSON || {}).map(([key, value]) => ({
      incomeType: key,
      annualAmount: Number(value) || 0
    }));
  }
}

export const propertyCalculationService = new PropertyCalculationService();