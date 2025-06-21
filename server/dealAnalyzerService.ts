import { db } from './db';
import { 
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

export class DealAnalyzerService {
  
  // Get all Deal Analyzer data for a property from normalized tables
  async getPropertyDealData(propertyId: number) {
    try {
      const [assumptions] = await db.select().from(propertyAssumptions).where(eq(propertyAssumptions.propertyId, propertyId));
      const unitTypes = await db.select().from(propertyUnitTypes).where(eq(propertyUnitTypes.propertyId, propertyId));
      const rentRoll = await db.select().from(propertyRentRoll).where(eq(propertyRentRoll.propertyId, propertyId));
      const expenses = await db.select().from(propertyExpenses).where(eq(propertyExpenses.propertyId, propertyId));
      const rehabBudget = await db.select().from(propertyRehabBudget).where(eq(propertyRehabBudget.propertyId, propertyId));
      const closingCosts = await db.select().from(propertyClosingCosts).where(eq(propertyClosingCosts.propertyId, propertyId));
      const holdingCosts = await db.select().from(propertyHoldingCosts).where(eq(propertyHoldingCosts.propertyId, propertyId));
      const [exitAnalysis] = await db.select().from(propertyExitAnalysis).where(eq(propertyExitAnalysis.propertyId, propertyId));
      const otherIncome = await db.select().from(propertyIncomeOther).where(eq(propertyIncomeOther.propertyId, propertyId));
      
      return {
        assumptions: assumptions || null,
        unitTypes: unitTypes || [],
        rentRoll: rentRoll || [],
        expenses: expenses || [],
        rehabBudget: rehabBudget || [],
        closingCosts: closingCosts || [],
        holdingCosts: holdingCosts || [],
        exitAnalysis: exitAnalysis || null,
        otherIncome: otherIncome || []
      };
    } catch (error) {
      console.error(`Error fetching deal data for property ${propertyId}:`, error);
      throw error;
    }
  }
  
  // Save assumptions data
  async saveAssumptions(propertyId: number, assumptions: any) {
    return await db.insert(propertyAssumptions).values({
      propertyId,
      ...assumptions
    }).onConflictDoUpdate({
      target: propertyAssumptions.propertyId,
      set: {
        ...assumptions,
        updatedAt: new Date()
      }
    });
  }
  
  // Save rent roll data
  async saveRentRoll(propertyId: number, rentRollData: any[]) {
    // Delete existing rent roll data
    await db.delete(propertyRentRoll).where(eq(propertyRentRoll.propertyId, propertyId));
    
    // Insert new rent roll data
    if (rentRollData.length > 0) {
      return await db.insert(propertyRentRoll).values(
        rentRollData.map(unit => ({
          propertyId,
          unitTypeId: unit.unitTypeId || 'default',
          unitNumber: unit.unitNumber,
          currentRent: unit.currentRent || 0,
          proFormaRent: unit.proFormaRent || 0,
          isVacant: unit.isVacant || false,
          leaseEndDate: unit.leaseEndDate ? new Date(unit.leaseEndDate) : null,
          tenantName: unit.tenantName
        }))
      );
    }
  }
  
  // Save expenses data
  async saveExpenses(propertyId: number, expensesData: any[]) {
    // Delete existing expenses
    await db.delete(propertyExpenses).where(eq(propertyExpenses.propertyId, propertyId));
    
    // Insert new expenses
    if (expensesData.length > 0) {
      return await db.insert(propertyExpenses).values(
        expensesData.map(expense => ({
          propertyId,
          expenseType: expense.expenseType,
          expenseName: expense.expenseName,
          annualAmount: expense.annualAmount || 0,
          isPercentage: expense.isPercentage || false,
          percentageBase: expense.percentageBase,
          notes: expense.notes
        }))
      );
    }
  }
  
  // Save rehab budget data
  async saveRehabBudget(propertyId: number, rehabData: any[]) {
    // Delete existing rehab budget
    await db.delete(propertyRehabBudget).where(eq(propertyRehabBudget.propertyId, propertyId));
    
    // Insert new rehab budget
    if (rehabData.length > 0) {
      return await db.insert(propertyRehabBudget).values(
        rehabData.map(item => ({
          propertyId,
          section: item.section,
          category: item.category,
          perUnitCost: item.perUnitCost || 0,
          quantity: item.quantity || 1,
          totalCost: item.totalCost || 0,
          spentAmount: item.spentAmount || 0,
          completionStatus: item.completionStatus || 'Not Started',
          notes: item.notes
        }))
      );
    }
  }
  
  // Save exit analysis data
  async saveExitAnalysis(propertyId: number, exitData: any) {
    return await db.insert(propertyExitAnalysis).values({
      propertyId,
      ...exitData
    }).onConflictDoUpdate({
      target: propertyExitAnalysis.propertyId,
      set: {
        ...exitData,
        updatedAt: new Date()
      }
    });
  }
  
  // Convert normalized data to JSON format for backward compatibility
  formatAsJSON(dealData: any) {
    return {
      assumptions: dealData.assumptions,
      unitTypes: dealData.unitTypes,
      rentRoll: dealData.rentRoll,
      expenses: dealData.expenses.reduce((acc: any, exp: any) => {
        acc[exp.expenseType] = exp.annualAmount;
        return acc;
      }, {}),
      rehabBudgetSections: dealData.rehabBudget.reduce((acc: any, item: any) => {
        if (!acc[item.section]) acc[item.section] = [];
        acc[item.section].push(item);
        return acc;
      }, {}),
      closingCosts: dealData.closingCosts.reduce((acc: any, cost: any) => {
        acc[cost.costType] = cost.amount;
        return acc;
      }, {}),
      holdingCosts: dealData.holdingCosts.reduce((acc: any, cost: any) => {
        acc[cost.costType] = cost.amount;
        return acc;
      }, {}),
      exitAnalysis: dealData.exitAnalysis,
      otherIncome: dealData.otherIncome.reduce((acc: any, income: any) => {
        acc[income.incomeType] = income.annualAmount;
        return acc;
      }, {})
    };
  }
  
  // Parse JSON data and save to normalized tables
  async saveFromJSON(propertyId: number, jsonData: any) {
    try {
      // Save assumptions
      if (jsonData.assumptions) {
        await this.saveAssumptions(propertyId, jsonData.assumptions);
      }
      
      // Save rent roll
      if (jsonData.rentRoll) {
        await this.saveRentRoll(propertyId, jsonData.rentRoll);
      }
      
      // Save expenses
      if (jsonData.expenses) {
        const expensesArray = Object.entries(jsonData.expenses).map(([key, value]) => ({
          expenseType: key,
          expenseName: key.replace(/([A-Z])/g, ' $1').replace(/^./, (str: string) => str.toUpperCase()),
          annualAmount: value as number,
          isPercentage: false
        }));
        await this.saveExpenses(propertyId, expensesArray);
      }
      
      // Save rehab budget
      if (jsonData.rehabBudgetSections) {
        const rehabArray: any[] = [];
        Object.entries(jsonData.rehabBudgetSections).forEach(([section, items]: [string, any]) => {
          if (Array.isArray(items)) {
            items.forEach(item => {
              rehabArray.push({
                section,
                ...item
              });
            });
          }
        });
        await this.saveRehabBudget(propertyId, rehabArray);
      }
      
      // Save exit analysis
      if (jsonData.exitAnalysis) {
        await this.saveExitAnalysis(propertyId, jsonData.exitAnalysis);
      }
      
      console.log(`Successfully saved normalized data for property ${propertyId}`);
      
    } catch (error) {
      console.error(`Error saving JSON data for property ${propertyId}:`, error);
      throw error;
    }
  }
}

export const dealAnalyzerService = new DealAnalyzerService();