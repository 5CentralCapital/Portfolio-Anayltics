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

export async function migratePropertyData() {
  console.log('Starting property data migration...');
  
  try {
    // Get all properties with dealAnalyzerData
    const propertiesWithData = await db.select().from(properties);
    
    for (const property of propertiesWithData) {
      if (!property.dealAnalyzerData) continue;
      
      try {
        const dealData = JSON.parse(property.dealAnalyzerData);
        console.log(`Processing property ${property.id}: ${property.address} with data:`, Object.keys(dealData));
        console.log(`Migrating property ${property.id}: ${property.address}`);
        
        // 1. Migrate assumptions
        if (dealData.assumptions) {
          await db.insert(propertyAssumptions).values({
            propertyId: property.id,
            unitCount: dealData.assumptions.unitCount || 1,
            purchasePrice: dealData.assumptions.purchasePrice || 0,
            loanPercentage: dealData.assumptions.loanPercentage || 0.8,
            interestRate: dealData.assumptions.interestRate || 0.07,
            loanTermYears: dealData.assumptions.loanTermYears || 30,
            vacancyRate: dealData.assumptions.vacancyRate || 0.05,
            expenseRatio: dealData.assumptions.expenseRatio || 0.45,
            marketCapRate: dealData.assumptions.marketCapRate || 0.055,
            refinanceLTV: dealData.assumptions.refinanceLTV || 0.75,
            refinanceInterestRate: dealData.assumptions.refinanceInterestRate || 0.065,
            refinanceClosingCostPercent: dealData.assumptions.refinanceClosingCostPercent || 0.02,
            dscrThreshold: dealData.assumptions.dscrThreshold || 1.25,
          }).onConflictDoNothing();
        }
        
        // 2. Migrate unit types
        if (dealData.unitTypes) {
          for (const unitType of dealData.unitTypes) {
            await db.insert(propertyUnitTypes).values({
              propertyId: property.id,
              unitTypeId: unitType.id,
              name: unitType.name,
              bedrooms: unitType.bedrooms || 1,
              bathrooms: unitType.bathrooms || 1.0,
              squareFeet: unitType.squareFeet,
              marketRent: unitType.marketRent || 0,
            }).onConflictDoNothing();
          }
        }
        
        // 3. Migrate rent roll
        if (dealData.rentRoll) {
          for (const unit of dealData.rentRoll) {
            await db.insert(propertyRentRoll).values({
              propertyId: property.id,
              unitTypeId: unit.unitTypeId || 'default',
              unitNumber: unit.unitNumber,
              currentRent: unit.currentRent || 0,
              proFormaRent: unit.proFormaRent || 0,
              isVacant: unit.isVacant || false,
              leaseEndDate: unit.leaseEndDate ? unit.leaseEndDate.toString() : null,
              tenantName: unit.tenantName,
            }).onConflictDoNothing();
          }
        }
        
        // 4. Migrate expenses
        if (dealData.expenses) {
          for (const [expenseType, amount] of Object.entries(dealData.expenses)) {
            if (typeof amount === 'number' && amount > 0) {
              await db.insert(propertyExpenses).values({
                propertyId: property.id,
                expenseType: expenseType,
                expenseName: expenseType.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
                annualAmount: amount,
                isPercentage: false,
              }).onConflictDoNothing();
            }
          }
        }
        
        // 5. Migrate rehab budget
        if (dealData.rehabBudgetSections) {
          for (const [section, items] of Object.entries(dealData.rehabBudgetSections)) {
            if (Array.isArray(items)) {
              for (const item of items) {
                await db.insert(propertyRehabBudget).values({
                  propertyId: property.id,
                  section: section,
                  category: item.category,
                  perUnitCost: item.perUnitCost || 0,
                  quantity: item.quantity || 1,
                  totalCost: item.totalCost || 0,
                  spentAmount: item.spentAmount || 0,
                  completionStatus: item.completionStatus || 'Not Started',
                  notes: item.notes,
                }).onConflictDoNothing();
              }
            }
          }
        }
        
        // 6. Migrate closing costs
        if (dealData.closingCosts) {
          for (const [costType, amount] of Object.entries(dealData.closingCosts)) {
            if (typeof amount === 'number' && amount > 0) {
              await db.insert(propertyClosingCosts).values({
                propertyId: property.id,
                costType: costType,
                amount: amount,
                description: `${costType} closing cost`,
              }).onConflictDoNothing();
            }
          }
        }
        
        // 7. Migrate holding costs
        if (dealData.holdingCosts) {
          for (const [costType, amount] of Object.entries(dealData.holdingCosts)) {
            if (typeof amount === 'number' && amount > 0) {
              await db.insert(propertyHoldingCosts).values({
                propertyId: property.id,
                costType: costType,
                amount: amount,
                description: `${costType} holding cost`,
              }).onConflictDoNothing();
            }
          }
        }
        
        // 8. Migrate exit analysis
        if (dealData.exitAnalysis) {
          await db.insert(propertyExitAnalysis).values({
            propertyId: property.id,
            holdPeriodYears: dealData.exitAnalysis.holdPeriodYears || 3.0,
            saleFactor: dealData.exitAnalysis.saleFactor || 1.0,
            saleCostsPercent: dealData.exitAnalysis.saleCostsPercent || 0.06,
            annualRentGrowth: dealData.exitAnalysis.annualRentGrowth || 0.03,
            annualExpenseGrowth: dealData.exitAnalysis.annualExpenseGrowth || 0.03,
            exitCapRate: dealData.exitAnalysis.exitCapRate,
          }).onConflictDoNothing();
        }
        
        // 9. Migrate other income
        if (dealData.otherIncome) {
          for (const [incomeType, amount] of Object.entries(dealData.otherIncome)) {
            if (typeof amount === 'number' && amount > 0) {
              await db.insert(propertyIncomeOther).values({
                propertyId: property.id,
                incomeType: incomeType,
                incomeName: incomeType.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
                annualAmount: amount,
                description: `${incomeType} income source`,
              }).onConflictDoNothing();
            }
          }
        }
        
        console.log(`✓ Migrated property ${property.id}`);
        
      } catch (error) {
        console.error(`Error migrating property ${property.id}:`, error);
      }
    }
    
    console.log('Property data migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Function to sync normalized data back to JSON (for backward compatibility)
export async function syncNormalizedToJSON(propertyId: number) {
  try {
    // Fetch all normalized data for the property
    const [assumptions] = await db.select().from(propertyAssumptions).where(eq(propertyAssumptions.propertyId, propertyId));
    const unitTypes = await db.select().from(propertyUnitTypes).where(eq(propertyUnitTypes.propertyId, propertyId));
    const rentRoll = await db.select().from(propertyRentRoll).where(eq(propertyRentRoll.propertyId, propertyId));
    const expenses = await db.select().from(propertyExpenses).where(eq(propertyExpenses.propertyId, propertyId));
    const rehabBudget = await db.select().from(propertyRehabBudget).where(eq(propertyRehabBudget.propertyId, propertyId));
    const closingCosts = await db.select().from(propertyClosingCosts).where(eq(propertyClosingCosts.propertyId, propertyId));
    const holdingCosts = await db.select().from(propertyHoldingCosts).where(eq(propertyHoldingCosts.propertyId, propertyId));
    const [exitAnalysis] = await db.select().from(propertyExitAnalysis).where(eq(propertyExitAnalysis.propertyId, propertyId));
    const otherIncome = await db.select().from(propertyIncomeOther).where(eq(propertyIncomeOther.propertyId, propertyId));
    
    // Reconstruct the JSON structure
    const dealAnalyzerData = {
      assumptions: assumptions || {},
      unitTypes: unitTypes || [],
      rentRoll: rentRoll || [],
      expenses: expenses.reduce((acc, exp) => ({ ...acc, [exp.expenseType]: exp.annualAmount }), {}),
      rehabBudgetSections: rehabBudget.reduce((acc, item) => {
        if (!acc[item.section]) acc[item.section] = [];
        acc[item.section].push(item);
        return acc;
      }, {} as any),
      closingCosts: closingCosts.reduce((acc, cost) => ({ ...acc, [cost.costType]: cost.amount }), {}),
      holdingCosts: holdingCosts.reduce((acc, cost) => ({ ...acc, [cost.costType]: cost.amount }), {}),
      exitAnalysis: exitAnalysis || {},
      otherIncome: otherIncome.reduce((acc, income) => ({ ...acc, [income.incomeType]: income.annualAmount }), {}),
    };
    
    // Update the property with the synced JSON data
    await db.update(properties)
      .set({ dealAnalyzerData: JSON.stringify(dealAnalyzerData) })
      .where(eq(properties.id, propertyId));
    
    return dealAnalyzerData;
    
  } catch (error) {
    console.error(`Error syncing normalized data for property ${propertyId}:`, error);
    throw error;
  }
}