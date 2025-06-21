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

export async function completeMigration() {
  console.log('Starting complete data migration from JSON to normalized tables...');
  
  try {
    // Get all properties with Deal Analyzer data
    const propertiesWithData = await db
      .select()
      .from(properties)
      .where(eq(properties.dealAnalyzerData, properties.dealAnalyzerData));

    console.log(`Found ${propertiesWithData.length} properties to check`);

    for (const property of propertiesWithData) {
      if (!property.dealAnalyzerData) {
        console.log(`Skipping property ${property.id} - no deal analyzer data`);
        continue;
      }

      try {
        const dealData = JSON.parse(property.dealAnalyzerData);
        console.log(`Migrating property ${property.id}: ${property.address}`);

        // Migrate assumptions
        if (dealData.assumptions) {
          console.log(`  - Migrating assumptions`);
          
          // Check if assumptions already exist
          const [existingAssumptions] = await db.select().from(propertyAssumptions).where(eq(propertyAssumptions.propertyId, property.id));
          
          if (existingAssumptions) {
            // Update existing assumptions
            await db.update(propertyAssumptions)
              .set({
                unitCount: dealData.assumptions.unitCount || 1,
                purchasePrice: dealData.assumptions.purchasePrice?.toString() || '0',
                loanPercentage: dealData.assumptions.loanPercentage?.toString() || '0',
                interestRate: dealData.assumptions.interestRate?.toString() || '0',
                loanTermYears: dealData.assumptions.loanTermYears || 30,
                vacancyRate: dealData.assumptions.vacancyRate?.toString() || '0.05',
                expenseRatio: dealData.assumptions.expenseRatio?.toString() || '0.45',
                marketCapRate: dealData.assumptions.marketCapRate?.toString() || '0.08',
                refinanceLTV: dealData.assumptions.refinanceLTV?.toString() || '0.75',
                refinanceInterestRate: dealData.assumptions.refinanceInterestRate?.toString() || '0.065',
                refinanceClosingCostPercent: dealData.assumptions.refinanceClosingCostPercent?.toString() || '0.02',
                dscrThreshold: dealData.assumptions.dscrThreshold?.toString() || '1.25',
                updatedAt: new Date()
              })
              .where(eq(propertyAssumptions.propertyId, property.id));
          } else {
            // Insert new assumptions
            await db.insert(propertyAssumptions).values({
              propertyId: property.id,
              unitCount: dealData.assumptions.unitCount || 1,
              purchasePrice: dealData.assumptions.purchasePrice?.toString() || '0',
              loanPercentage: dealData.assumptions.loanPercentage?.toString() || '0',
              interestRate: dealData.assumptions.interestRate?.toString() || '0',
              loanTermYears: dealData.assumptions.loanTermYears || 30,
              vacancyRate: dealData.assumptions.vacancyRate?.toString() || '0.05',
              expenseRatio: dealData.assumptions.expenseRatio?.toString() || '0.45',
              marketCapRate: dealData.assumptions.marketCapRate?.toString() || '0.08',
              refinanceLTV: dealData.assumptions.refinanceLTV?.toString() || '0.75',
              refinanceInterestRate: dealData.assumptions.refinanceInterestRate?.toString() || '0.065',
              refinanceClosingCostPercent: dealData.assumptions.refinanceClosingCostPercent?.toString() || '0.02',
              dscrThreshold: dealData.assumptions.dscrThreshold?.toString() || '1.25'
            });
          }
        }

        // Migrate unit types
        if (dealData.unitTypes && Array.isArray(dealData.unitTypes)) {
          console.log(`  - Migrating ${dealData.unitTypes.length} unit types`);
          for (const unitType of dealData.unitTypes) {
            await db.insert(propertyUnitTypes).values({
              propertyId: property.id,
              unitTypeId: unitType.id || 'default',
              name: unitType.name || 'Standard Unit',
              marketRent: parseFloat(unitType.marketRent?.toString() || '0'),
              squareFeet: parseFloat(unitType.sqft?.toString() || '0')
            }).onConflictDoNothing();
          }
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
                amount: parseFloat((expenseValue as any).amount?.toString() || '0'),
                isPercentage: (expenseValue as any).isPercentage || false,
                percentageBase: (expenseValue as any).percentageBase || null,
                notes: (expenseValue as any).notes || null
              }).onConflictDoNothing();
            }
          }
        }

        // Migrate rehab budget
        if (dealData.rehabBudgetSections) {
          console.log(`  - Migrating rehab budget`);
          const rehabSections = Object.entries(dealData.rehabBudgetSections);
          for (const [sectionName, sectionData] of rehabSections) {
            if (sectionData && typeof sectionData === 'object' && (sectionData as any).items) {
              for (const item of (sectionData as any).items) {
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

        // Migrate closing costs
        if (dealData.closingCosts && Array.isArray(dealData.closingCosts)) {
          console.log(`  - Migrating ${dealData.closingCosts.length} closing costs`);
          for (const cost of dealData.closingCosts) {
            await db.insert(propertyClosingCosts).values({
              propertyId: property.id,
              costType: cost.type || 'Other',
              amount: parseFloat(cost.amount?.toString() || '0'),
              description: cost.description || null
            }).onConflictDoNothing();
          }
        }

        // Migrate holding costs
        if (dealData.holdingCosts && Array.isArray(dealData.holdingCosts)) {
          console.log(`  - Migrating ${dealData.holdingCosts.length} holding costs`);
          for (const cost of dealData.holdingCosts) {
            await db.insert(propertyHoldingCosts).values({
              propertyId: property.id,
              costType: cost.type || 'Other',
              amount: parseFloat(cost.amount?.toString() || '0'),
              description: cost.description || null
            }).onConflictDoNothing();
          }
        }

        // Migrate exit analysis
        if (dealData.exitAnalysis) {
          console.log(`  - Migrating exit analysis`);
          await db.insert(propertyExitAnalysis).values({
            propertyId: property.id,
            holdPeriodYears: parseFloat(dealData.exitAnalysis.holdYears?.toString() || '5'),
            saleFactor: parseFloat(dealData.exitAnalysis.saleFactor?.toString() || '1.0'),
            saleCostsPercent: parseFloat(dealData.exitAnalysis.sellingCostPercent?.toString() || '0.06'),
            annualRentGrowth: parseFloat(dealData.exitAnalysis.annualRentGrowth?.toString() || '0.03'),
            annualExpenseGrowth: parseFloat(dealData.exitAnalysis.annualExpenseGrowth?.toString() || '0.03'),
            exitCapRate: parseFloat(dealData.exitAnalysis.salesCapRate?.toString() || '0.055')
          }).onConflictDoUpdate({
            target: propertyExitAnalysis.propertyId,
            set: {
              holdPeriodYears: parseFloat(dealData.exitAnalysis.holdYears?.toString() || '5'),
              saleFactor: parseFloat(dealData.exitAnalysis.saleFactor?.toString() || '1.0'),
              saleCostsPercent: parseFloat(dealData.exitAnalysis.sellingCostPercent?.toString() || '0.06'),
              annualRentGrowth: parseFloat(dealData.exitAnalysis.annualRentGrowth?.toString() || '0.03'),
              annualExpenseGrowth: parseFloat(dealData.exitAnalysis.annualExpenseGrowth?.toString() || '0.03'),
              exitCapRate: parseFloat(dealData.exitAnalysis.salesCapRate?.toString() || '0.055'),
              updatedAt: new Date()
            }
          });
        }

        console.log(`✓ Successfully migrated property ${property.id}: ${property.address}`);
        
      } catch (error) {
        console.error(`Error migrating property ${property.id}:`, error);
      }
    }

    console.log('Migration completed successfully!');
    return { success: true, message: 'Data migration completed' };
    
  } catch (error) {
    console.error('Migration failed:', error);
    return { success: false, error: error.message };
  }
}