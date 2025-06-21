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

export class DataMigrationService {
  
  /**
   * Fix property data inconsistencies and create normalized structures
   */
  async fixPropertyDataset() {
    console.log('Starting property dataset fix...');

    try {
      // 1. Fix duplicate properties (123 Maple Street appears twice)
      await this.fixDuplicateProperties();
      
      // 2. Update entity names to match current branding
      await this.fixEntityNames();
      
      // 3. Create missing normalized data structures for all properties
      await this.createNormalizedDataStructures();
      
      // 4. Fix negative cash flow calculations
      await this.fixCashFlowCalculations();
      
      // 5. Ensure data consistency across related tables
      await this.ensureDataConsistency();
      
      console.log('Property dataset fix completed successfully!');
      return { success: true, message: 'All property data has been fixed and normalized' };
      
    } catch (error) {
      console.error('Error fixing property dataset:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Remove or merge duplicate properties
   */
  private async fixDuplicateProperties() {
    console.log('Fixing duplicate properties...');
    
    // Find the duplicate 123 Maple Street entries
    const duplicates = await db.select()
      .from(properties)
      .where(eq(properties.address, '123 Maple Street'));
    
    if (duplicates.length > 1) {
      // Keep the one with deal_analyzer_data (id: 39), remove the other (id: 37)
      const keepProperty = duplicates.find(p => p.dealAnalyzerData);
      const removeProperty = duplicates.find(p => !p.dealAnalyzerData);
      
      if (keepProperty && removeProperty) {
        // Update the keeper with combined data if needed
        await db.update(properties)
          .set({
            cashFlow: keepProperty.cashFlow, // Keep the better cash flow
            updatedAt: new Date()
          })
          .where(eq(properties.id, keepProperty.id));
        
        // Remove the duplicate
        await db.delete(properties)
          .where(eq(properties.id, removeProperty.id));
        
        console.log(`Removed duplicate property (ID: ${removeProperty.id})`);
      }
    }
  }

  /**
   * Update entity names to match current branding
   */
  private async fixEntityNames() {
    console.log('Updating entity names...');
    
    // Update entity names to match current branding
    await db.update(properties)
      .set({ entity: '5Central Capital', updatedAt: new Date() })
      .where(eq(properties.entity, '5Central Capital LLC'));
    
    // The House Doctors should remain as is
    // Arcadia Vision Group entities would be updated here if any exist
  }

  /**
   * Create normalized data structures for properties that don't have them
   */
  private async createNormalizedDataStructures() {
    console.log('Creating normalized data structures...');
    
    const allProperties = await db.select().from(properties);
    
    for (const property of allProperties) {
      await this.createPropertyAssumptions(property);
      await this.createPropertyUnitTypes(property);
      await this.createPropertyRentRoll(property);
      await this.createPropertyExpenses(property);
      await this.createPropertyRehabBudget(property);
      await this.createPropertyClosingCosts(property);
      await this.createPropertyHoldingCosts(property);
      await this.createPropertyExitAnalysis(property);
    }
  }

  /**
   * Create property assumptions based on existing data
   */
  private async createPropertyAssumptions(property: any) {
    const existing = await db.select()
      .from(propertyAssumptions)
      .where(eq(propertyAssumptions.propertyId, property.id));
    
    if (existing.length === 0) {
      await db.insert(propertyAssumptions).values({
        propertyId: property.id,
        unitCount: property.apartments,
        purchasePrice: property.acquisitionPrice.toString(),
        loanPercentage: "0.75", // Standard 75% LTV
        interestRate: "0.07", // 7% interest rate
        loanTermYears: 30,
        vacancyRate: "0.05", // 5% vacancy
        expenseRatio: "0.45", // 45% expense ratio
        marketCapRate: "0.055", // 5.5% cap rate
        refinanceLTV: "0.75",
        refinanceInterestRate: "0.065",
        refinanceClosingCostPercent: "0.02",
        dscrThreshold: "1.25"
      });
    }
  }

  /**
   * Create unit types based on property apartment count
   */
  private async createPropertyUnitTypes(property: any) {
    const existing = await db.select()
      .from(propertyUnitTypes)
      .where(eq(propertyUnitTypes.propertyId, property.id));
    
    if (existing.length === 0) {
      // Create a default unit type based on property size
      const avgRent = property.apartments > 0 ? (parseFloat(property.cashFlow) || 0) / property.apartments / 12 * 1.25 : 1200;
      
      await db.insert(propertyUnitTypes).values({
        propertyId: property.id,
        unitTypeId: 'unit-1',
        name: property.apartments === 1 ? 'Single Family' : `${property.apartments > 4 ? '2' : '1'}BR/${property.apartments > 4 ? '1' : '1'}BA`,
        bedrooms: property.apartments > 4 ? 2 : 1,
        bathrooms: "1.0",
        squareFeet: property.apartments > 4 ? 900 : 750,
        marketRent: avgRent.toString()
      });
    }
  }

  /**
   * Create rent roll based on unit types and property data
   */
  private async createPropertyRentRoll(property: any) {
    const existing = await db.select()
      .from(propertyRentRoll)
      .where(eq(propertyRentRoll.propertyId, property.id));
    
    if (existing.length === 0) {
      const unitTypes = await db.select()
        .from(propertyUnitTypes)
        .where(eq(propertyUnitTypes.propertyId, property.id));
      
      const primaryUnitType = unitTypes[0];
      if (primaryUnitType) {
        // Create rent roll entries for each unit
        for (let i = 1; i <= property.apartments; i++) {
          await db.insert(propertyRentRoll).values({
            propertyId: property.id,
            unitTypeId: primaryUnitType.unitTypeId,
            unitNumber: `Unit ${i}`,
            currentRent: primaryUnitType.marketRent,
            proFormaRent: primaryUnitType.marketRent,
            isVacant: property.status === 'Rehabbing' ? true : false
          });
        }
      }
    }
  }

  /**
   * Create standard property expenses
   */
  private async createPropertyExpenses(property: any) {
    const existing = await db.select()
      .from(propertyExpenses)
      .where(eq(propertyExpenses.propertyId, property.id));
    
    if (existing.length === 0) {
      const standardExpenses = [
        { type: 'taxes', name: 'Property Taxes', amount: parseFloat(property.acquisitionPrice) * 0.015 },
        { type: 'insurance', name: 'Property Insurance', amount: parseFloat(property.acquisitionPrice) * 0.002 },
        { type: 'maintenance', name: 'Repairs & Maintenance', amount: 2400 * property.apartments },
        { type: 'utilities', name: 'Utilities', amount: 1200 * property.apartments },
        { type: 'other', name: 'Other Operating Expenses', amount: 600 * property.apartments }
      ];

      for (const expense of standardExpenses) {
        await db.insert(propertyExpenses).values({
          propertyId: property.id,
          expenseType: expense.type,
          expenseName: expense.name,
          annualAmount: expense.amount.toString()
        });
      }
    }
  }

  /**
   * Create rehab budget based on property type and status
   */
  private async createPropertyRehabBudget(property: any) {
    const existing = await db.select()
      .from(propertyRehabBudget)
      .where(eq(propertyRehabBudget.propertyId, property.id));
    
    if (existing.length === 0 && property.rehabCosts && parseFloat(property.rehabCosts) > 0) {
      const totalRehab = parseFloat(property.rehabCosts);
      const perUnit = totalRehab / property.apartments;
      
      const rehabCategories = [
        { section: 'exterior', category: 'Exterior Repairs', cost: perUnit * 0.2 },
        { section: 'kitchens', category: 'Kitchen Renovation', cost: perUnit * 0.3 },
        { section: 'bathrooms', category: 'Bathroom Renovation', cost: perUnit * 0.25 },
        { section: 'generalInterior', category: 'Flooring & Paint', cost: perUnit * 0.15 },
        { section: 'finishings', category: 'Final Touches', cost: perUnit * 0.1 }
      ];

      for (const item of rehabCategories) {
        await db.insert(propertyRehabBudget).values({
          propertyId: property.id,
          section: item.section,
          category: item.category,
          perUnitCost: item.cost.toString(),
          quantity: property.apartments,
          totalCost: (item.cost * property.apartments).toString(),
          spentAmount: property.status === 'Sold' ? (item.cost * property.apartments).toString() : "0",
          completionStatus: property.status === 'Sold' ? 'Completed' : 
                           property.status === 'Rehabbing' ? 'In Progress' : 'Not Started'
        });
      }
    }
  }

  /**
   * Create closing costs based on acquisition price
   */
  private async createPropertyClosingCosts(property: any) {
    const existing = await db.select()
      .from(propertyClosingCosts)
      .where(eq(propertyClosingCosts.propertyId, property.id));
    
    if (existing.length === 0) {
      const acquisitionPrice = parseFloat(property.acquisitionPrice);
      const closingCosts = [
        { type: 'title', amount: acquisitionPrice * 0.005 },
        { type: 'inspection', amount: 500 },
        { type: 'legal', amount: 1500 },
        { type: 'lender', amount: acquisitionPrice * 0.01 }
      ];

      for (const cost of closingCosts) {
        await db.insert(propertyClosingCosts).values({
          propertyId: property.id,
          costType: cost.type,
          amount: cost.amount.toString(),
          description: `${cost.type.charAt(0).toUpperCase() + cost.type.slice(1)} costs`
        });
      }
    }
  }

  /**
   * Create holding costs for rehab period
   */
  private async createPropertyHoldingCosts(property: any) {
    const existing = await db.select()
      .from(propertyHoldingCosts)
      .where(eq(propertyHoldingCosts.propertyId, property.id));
    
    if (existing.length === 0) {
      const holdingCosts = [
        { type: 'insurance', amount: 200 * property.apartments },
        { type: 'utilities', amount: 150 * property.apartments },
        { type: 'security', amount: 100 },
        { type: 'taxes', amount: parseFloat(property.acquisitionPrice) * 0.015 / 12 * 6 } // 6 months
      ];

      for (const cost of holdingCosts) {
        await db.insert(propertyHoldingCosts).values({
          propertyId: property.id,
          costType: cost.type,
          amount: cost.amount.toString(),
          description: `${cost.type.charAt(0).toUpperCase() + cost.type.slice(1)} during rehab period`
        });
      }
    }
  }

  /**
   * Create exit analysis scenarios
   */
  private async createPropertyExitAnalysis(property: any) {
    const existing = await db.select()
      .from(propertyExitAnalysis)
      .where(eq(propertyExitAnalysis.propertyId, property.id));
    
    if (existing.length === 0) {
      await db.insert(propertyExitAnalysis).values({
        propertyId: property.id,
        holdPeriodYears: "3.0",
        saleFactor: "0.055", // 5.5% cap rate for sale
        saleCostsPercent: "0.06",
        annualRentGrowth: "0.03",
        annualExpenseGrowth: "0.03",
        exitCapRate: "0.055"
      });
    }
  }

  /**
   * Fix cash flow calculations that show negative values
   */
  private async fixCashFlowCalculations() {
    console.log('Fixing cash flow calculations...');
    
    const propertiesWithNegativeCashFlow = await db.select()
      .from(properties)
      .where(eq(properties.status, 'Rehabbing'));
    
    for (const property of propertiesWithNegativeCashFlow) {
      // For rehabbing properties, cash flow should be 0 until stabilized
      if (parseFloat(property.cashFlow) < 0) {
        await db.update(properties)
          .set({
            cashFlow: "0",
            updatedAt: new Date()
          })
          .where(eq(properties.id, property.id));
      }
    }
  }

  /**
   * Ensure data consistency across all related tables
   */
  private async ensureDataConsistency() {
    console.log('Ensuring data consistency...');
    
    // Update all properties to have consistent entity naming
    const allProperties = await db.select().from(properties);
    
    for (const property of allProperties) {
      // Ensure all related data exists
      const hasAssumptions = await db.select().from(propertyAssumptions)
        .where(eq(propertyAssumptions.propertyId, property.id));
      
      if (hasAssumptions.length === 0) {
        await this.createPropertyAssumptions(property);
      }
    }
  }

  /**
   * Get migration status report
   */
  async getMigrationStatus() {
    const totalProperties = await db.select().from(properties);
    const propertiesWithAssumptions = await db.select().from(propertyAssumptions);
    const propertiesWithUnits = await db.select().from(propertyUnitTypes);
    const propertiesWithRentRoll = await db.select().from(propertyRentRoll);
    
    return {
      totalProperties: totalProperties.length,
      withAssumptions: propertiesWithAssumptions.length,
      withUnitTypes: propertiesWithUnits.length,
      withRentRoll: propertiesWithRentRoll.length,
      migrationComplete: totalProperties.length === propertiesWithAssumptions.length
    };
  }
}

export const dataMigrationService = new DataMigrationService();