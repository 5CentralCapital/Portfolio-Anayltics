import { db } from './db';
import { 
  properties, 
  propertyAssumptions,
  propertyRentRoll,
  propertyExpenses,
  propertyRehabBudget,
  propertyClosingCosts,
  propertyHoldingCosts,
  propertyExitAnalysis,
  propertyIncomeOther,
  propertyUnitTypes
} from '@shared/schema';

export async function runSimpleMigration() {
  console.log('Starting simple data migration from JSON to normalized tables...');
  
  try {
    // Get all properties with dealAnalyzerData
    const allProperties = await db.select().from(properties);
    console.log(`Found ${allProperties.length} properties to process`);
    
    for (const property of allProperties) {
      if (!property.dealAnalyzerData) {
        console.log(`Skipping property ${property.id} - no deal analyzer data`);
        continue;
      }
      
      try {
        const dealData = JSON.parse(property.dealAnalyzerData);
        console.log(`Processing property ${property.id}: ${property.address}`);
        console.log(`Deal data keys:`, Object.keys(dealData));
        
        // Migrate assumptions
        if (dealData.assumptions) {
          console.log(`  - Migrating assumptions`);
          await db.insert(propertyAssumptions).values({
            propertyId: property.id,
            unitCount: dealData.assumptions.unitCount || 0,
            purchasePrice: dealData.assumptions.purchasePrice?.toString() || '0',
            loanPercentage: dealData.assumptions.loanPercentage?.toString() || '0',
            interestRate: dealData.assumptions.interestRate?.toString() || '0',
            loanTermYears: dealData.assumptions.loanTermYears || 0,
            vacancyRate: dealData.assumptions.vacancyRate?.toString() || '0',
            expenseRatio: dealData.assumptions.expenseRatio?.toString() || '0',
            marketCapRate: dealData.assumptions.marketCapRate?.toString() || '0',
            refinanceLTV: dealData.assumptions.refinanceLTV?.toString() || '0',
            refinanceInterestRate: dealData.assumptions.refinanceInterestRate?.toString() || '0',
            refinanceClosingCostPercent: dealData.assumptions.refinanceClosingCostPercent?.toString() || '0',
            dscrThreshold: dealData.assumptions.dscrThreshold?.toString() || '0'
          }).onConflictDoUpdate({
            target: propertyAssumptions.propertyId,
            set: {
              unitCount: dealData.assumptions.unitCount || 0,
              purchasePrice: dealData.assumptions.purchasePrice?.toString() || '0',
              loanPercentage: dealData.assumptions.loanPercentage?.toString() || '0',
              interestRate: dealData.assumptions.interestRate?.toString() || '0',
              loanTermYears: dealData.assumptions.loanTermYears || 0,
              vacancyRate: dealData.assumptions.vacancyRate?.toString() || '0',
              expenseRatio: dealData.assumptions.expenseRatio?.toString() || '0',
              marketCapRate: dealData.assumptions.marketCapRate?.toString() || '0',
              refinanceLTV: dealData.assumptions.refinanceLTV?.toString() || '0',
              refinanceInterestRate: dealData.assumptions.refinanceInterestRate?.toString() || '0',
              refinanceClosingCostPercent: dealData.assumptions.refinanceClosingCostPercent?.toString() || '0',
              dscrThreshold: dealData.assumptions.dscrThreshold?.toString() || '0',
              updatedAt: new Date()
            }
          });
        }

        // Migrate rent roll
        if (dealData.rentRoll && Array.isArray(dealData.rentRoll)) {
          console.log(`  - Migrating ${dealData.rentRoll.length} rent roll units`);
          for (const unit of dealData.rentRoll) {
            await db.insert(propertyRentRoll).values({
              propertyId: property.id,
              unitTypeId: unit.unitTypeId || 'default',
              unitNumber: unit.unitNumber || '',
              currentRent: parseFloat(unit.currentRent?.toString() || '0'),
              proFormaRent: parseFloat(unit.proFormaRent?.toString() || '0'),
              isVacant: unit.isVacant || false,
              leaseEndDate: unit.leaseEndDate || null,
              tenantName: unit.tenantName || null
            }).onConflictDoNothing();
          }
        }

        // Migrate expenses
        if (dealData.expenses) {
          console.log(`  - Migrating expenses`);
          const expenseEntries = Object.entries(dealData.expenses);
          for (const [expenseKey, expenseValue] of expenseEntries) {
            if (expenseValue && typeof expenseValue === 'object') {
              await db.insert(propertyExpenses).values({
                propertyId: property.id,
                expenseType: 'Operating',
                expenseName: expenseKey,
                amount: parseFloat(expenseValue.amount?.toString() || '0'),
                isPercentage: expenseValue.isPercentage || false,
                percentageBase: expenseValue.percentageBase || null,
                notes: expenseValue.notes || null
              }).onConflictDoNothing();
            }
          }
        }

        // Migrate rehab budget
        if (dealData.rehabBudgetSections) {
          console.log(`  - Migrating rehab budget`);
          const rehabSections = Object.entries(dealData.rehabBudgetSections);
          for (const [sectionName, sectionData] of rehabSections) {
            if (sectionData && typeof sectionData === 'object' && sectionData.items) {
              for (const item of sectionData.items) {
                await db.insert(propertyRehabBudget).values({
                  propertyId: property.id,
                  category: sectionName,
                  itemName: item.name || '',
                  budgetAmount: parseFloat(item.budget?.toString() || '0'),
                  actualAmount: parseFloat(item.actual?.toString() || '0'),
                  notes: item.notes || null
                }).onConflictDoNothing();
              }
            }
          }
        }

        // Migrate exit analysis
        if (dealData.exitAnalysis) {
          console.log(`  - Migrating exit analysis`);
          await db.insert(propertyExitAnalysis).values({
            propertyId: property.id,
            exitStrategy: dealData.exitAnalysis.exitStrategy || 'Hold',
            holdYears: dealData.exitAnalysis.holdYears || 5,
            salesCapRate: dealData.exitAnalysis.salesCapRate?.toString() || '0.055',
            sellingCostPercent: dealData.exitAnalysis.sellingCostPercent?.toString() || '0.06',
            projectedValue: dealData.exitAnalysis.projectedValue?.toString() || '0',
            netProceeds: dealData.exitAnalysis.netProceeds?.toString() || '0'
          }).onConflictDoUpdate({
            target: propertyExitAnalysis.propertyId,
            set: {
              exitStrategy: dealData.exitAnalysis.exitStrategy || 'Hold',
              holdYears: dealData.exitAnalysis.holdYears || 5,
              salesCapRate: dealData.exitAnalysis.salesCapRate?.toString() || '0.055',
              sellingCostPercent: dealData.exitAnalysis.sellingCostPercent?.toString() || '0.06',
              projectedValue: dealData.exitAnalysis.projectedValue?.toString() || '0',
              netProceeds: dealData.exitAnalysis.netProceeds?.toString() || '0',
              updatedAt: new Date()
            }
          });
        }
        
      } catch (error) {
        console.error(`Error parsing JSON for property ${property.id}:`, error);
      }
    }
    
    console.log('Migration analysis completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}