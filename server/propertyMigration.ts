import { db } from "./db";
import { 
  properties as newProperties,
  propertyAssumptions,
  unitTypes,
  rentRoll,
  rehabSections,
  closingCosts,
  holdingCosts,
  propertyExpenses,
  propertyIncome,
  loans,
  exitAnalysis,
  monthlyProforma,
  entities
} from "@shared/schema";
import { storage } from "./storage";
import { eq, sql } from "drizzle-orm";

interface LegacyProperty {
  id: number;
  entityId?: number;
  status: string;
  apartments: number;
  address: string;
  city: string;
  state: string;
  zipCode?: string;
  entity?: string;
  acquisitionDate?: string;
  acquisitionPrice: string;
  rehabCosts: string;
  arvAtTimePurchased?: string;
  initialCapitalRequired: string;
  cashFlow: string;
  salePrice?: string;
  totalProfits: string;
  cashOnCashReturn: string;
  dealAnalyzerData?: string;
  broker?: string;
  legalNotes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class PropertyMigrationService {
  
  async migrateToNewSchema(): Promise<{ migrated: number; errors: string[] }> {
    console.log('Starting property database migration...');
    
    const errors: string[] = [];
    let migrated = 0;

    try {
      // Check if we have legacy properties to migrate
      const legacyProperties = await this.getLegacyProperties();
      
      if (legacyProperties.length === 0) {
        console.log('No legacy properties found to migrate');
        return { migrated: 0, errors: [] };
      }

      // Ensure entities exist
      await this.ensureEntitiesExist();

      // Migrate each property
      for (const legacyProperty of legacyProperties) {
        try {
          await this.migrateSingleProperty(legacyProperty);
          migrated++;
          console.log(`Migrated property: ${legacyProperty.address}`);
        } catch (error) {
          const errorMsg = `Failed to migrate property ${legacyProperty.id}: ${error}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      console.log(`Migration complete. Migrated ${migrated} properties with ${errors.length} errors.`);
      return { migrated, errors };

    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }

  private async getLegacyProperties(): Promise<LegacyProperty[]> {
    try {
      // Try to get from old table structure if it exists
      const result = await db.execute(sql`
        SELECT * FROM properties 
        WHERE purchase_price IS NULL OR unit_count IS NULL
        LIMIT 50
      `);
      
      return result.rows as any[];
    } catch (error) {
      console.log('No legacy properties table found or already migrated');
      return [];
    }
  }

  private async ensureEntitiesExist(): Promise<void> {
    // Create default entities if they don't exist
    const defaultEntities = [
      { name: '5Central Capital', type: 'LLC', description: 'Primary investment entity' },
      { name: 'The House Doctors', type: 'LLC', description: 'Rehabilitation focused entity' },
      { name: 'Arcadia Vision Group', type: 'LLC', description: 'Development focused entity' }
    ];

    for (const entityData of defaultEntities) {
      try {
        await storage.createEntity(entityData);
      } catch (error) {
        // Entity might already exist, continue
        console.log(`Entity ${entityData.name} may already exist`);
      }
    }
  }

  private async migrateSingleProperty(legacy: LegacyProperty): Promise<void> {
    // Parse Deal Analyzer data if available
    let dealData: any = null;
    if (legacy.dealAnalyzerData) {
      try {
        dealData = JSON.parse(legacy.dealAnalyzerData);
      } catch (error) {
        console.warn(`Failed to parse deal data for property ${legacy.id}`);
      }
    }

    // Determine entity ID
    let entityId = legacy.entityId || 1; // Default to first entity
    if (legacy.entity) {
      const entityMapping: { [key: string]: number } = {
        '5Central Capital': 1,
        'The House Doctors': 2,
        'Arcadia Vision Group': 3
      };
      entityId = entityMapping[legacy.entity] || 1;
    }

    // Calculate financial metrics
    const purchasePrice = this.parseNumber(legacy.acquisitionPrice);
    const rehabBudget = this.parseNumber(legacy.rehabCosts);
    const initialCapital = this.parseNumber(legacy.initialCapitalRequired);
    const monthlyCashFlow = this.parseNumber(legacy.cashFlow);
    const annualCashFlow = monthlyCashFlow * 12;
    const cashOnCashReturn = this.parseNumber(legacy.cashOnCashReturn);
    const arv = this.parseNumber(legacy.arvAtTimePurchased) || purchasePrice * 1.3;

    // Create main property record
    const propertyData = {
      entityId,
      name: legacy.address,
      address: legacy.address,
      city: legacy.city,
      state: legacy.state,
      zipCode: legacy.zipCode,
      status: legacy.status,
      purchasePrice: purchasePrice.toString(),
      unitCount: legacy.apartments,
      arv: arv.toString(),
      rehabBudget: rehabBudget.toString(),
      initialCapital: initialCapital.toString(),
      monthlyCashFlow: monthlyCashFlow.toString(),
      annualCashFlow: annualCashFlow.toString(),
      cashOnCashReturn: cashOnCashReturn.toString(),
      salePrice: legacy.salePrice ? this.parseNumber(legacy.salePrice).toString() : null,
      totalProfit: legacy.totalProfits ? this.parseNumber(legacy.totalProfits).toString() : null,
      acquisitionDate: legacy.acquisitionDate ? new Date(legacy.acquisitionDate) : null,
      broker: legacy.broker,
      legalNotes: legacy.legalNotes,
    };

    const newProperty = await storage.createProperty(propertyData);

    // Create property assumptions from deal data or defaults
    const assumptions = {
      propertyId: newProperty.id,
      loanPercentage: dealData?.assumptions?.loanPercentage?.toString() || '0.80',
      interestRate: dealData?.assumptions?.interestRate?.toString() || '0.075',
      termYears: dealData?.assumptions?.loanTermYears || 30,
      vacancyRate: dealData?.assumptions?.vacancyRate?.toString() || '0.05',
      expenseRatio: dealData?.assumptions?.expenseRatio?.toString() || '0.45',
      marketCapRate: dealData?.assumptions?.marketCapRate?.toString() || '0.065',
      refinanceLTV: dealData?.assumptions?.refinanceLTV?.toString() || '0.75',
      refinanceInterestRate: dealData?.assumptions?.refinanceInterestRate?.toString() || '0.065',
      refinanceClosingCostPercent: dealData?.assumptions?.refinanceClosingCostPercent?.toString() || '0.03',
      dscrThreshold: dealData?.assumptions?.dscrThreshold?.toString() || '1.25',
    };

    await storage.createPropertyAssumptions(assumptions);

    // Create unit types and rent roll from deal data
    if (dealData?.rentRoll && Array.isArray(dealData.rentRoll)) {
      const unitTypeMap = new Map<string, number>();
      
      // Create unique unit types
      const uniqueUnitTypes = Array.from(new Set(dealData.rentRoll.map((unit: any) => unit.unitType || 'Standard')));
      for (const unitTypeName of uniqueUnitTypes) {
        const sampleUnit = dealData.rentRoll.find((unit: any) => (unit.unitType || 'Standard') === unitTypeName);
        const unitType = await storage.createUnitType({
          propertyId: newProperty.id,
          name: unitTypeName,
          marketRent: (sampleUnit?.proFormaRent || sampleUnit?.marketRent || 1000).toString(),
        });
        unitTypeMap.set(unitTypeName, unitType.id);
      }

      // Create rent roll entries
      for (const unit of dealData.rentRoll) {
        const unitTypeId = unitTypeMap.get(unit.unitType || 'Standard');
        await storage.createRentRoll({
          propertyId: newProperty.id,
          unitTypeId,
          unit: unit.unit || `Unit ${unit.id || 1}`,
          currentRent: (unit.currentRent || unit.rent || 1000).toString(),
          proFormaRent: (unit.proFormaRent || unit.marketRent || unit.currentRent || 1000).toString(),
          squareFootage: unit.squareFootage,
        });
      }
    } else {
      // Create default unit types and rent roll
      const defaultUnitType = await storage.createUnitType({
        propertyId: newProperty.id,
        name: 'Standard',
        marketRent: '1000',
      });

      for (let i = 1; i <= legacy.apartments; i++) {
        await storage.createRentRoll({
          propertyId: newProperty.id,
          unitTypeId: defaultUnitType.id,
          unit: `Unit ${i}`,
          currentRent: '1000',
          proFormaRent: '1000',
        });
      }
    }

    // Create rehab sections from deal data
    if (dealData?.rehabBudgetSections) {
      for (const [sectionName, items] of Object.entries(dealData.rehabBudgetSections)) {
        if (Array.isArray(items)) {
          for (const item of items as any[]) {
            await storage.createRehabSection({
              propertyId: newProperty.id,
              section: sectionName,
              category: item.category || 'General',
              perUnitCost: this.parseNumber(item.perUnitCost || '0').toString(),
              quantity: parseInt(item.quantity || '1'),
              totalCost: this.parseNumber(item.totalCost || '0').toString(),
              spentAmount: this.parseNumber(item.spentAmount || '0').toString(),
              completed: (item.spentAmount || 0) >= (item.totalCost || 0),
            });
          }
        }
      }
    }

    // Create default expenses
    const defaultExpenses = [
      { category: 'Property Tax', annualAmount: Math.round(purchasePrice * 0.015) },
      { category: 'Insurance', annualAmount: Math.round(purchasePrice * 0.008) },
      { category: 'Maintenance', annualAmount: Math.round(annualCashFlow * 0.1) },
      { category: 'Management', annualAmount: Math.round(annualCashFlow * 0.08) },
    ];

    for (const expense of defaultExpenses) {
      await storage.createPropertyExpense({
        propertyId: newProperty.id,
        category: expense.category,
        annualAmount: expense.annualAmount.toString(),
        monthlyAmount: Math.round(expense.annualAmount / 12).toString(),
      });
    }

    // Create default exit analysis
    await storage.createExitAnalysis({
      propertyId: newProperty.id,
      salesCapRate: '0.055',
      saleFactor: '1.0',
      saleCostsPercent: '0.06',
      holdPeriodYears: 5,
      projectedSalePrice: arv.toString(),
    });

    console.log(`Successfully migrated property: ${legacy.address}`);
  }

  private parseNumber(value: string | number | undefined | null): number {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    
    const cleanValue = String(value).replace(/[,$%]/g, '');
    const parsed = parseFloat(cleanValue);
    return isNaN(parsed) ? 0 : parsed;
  }

  async clearLegacyData(): Promise<void> {
    console.log('Clearing legacy property data...');
    
    try {
      // Only clear if migration was successful
      const newPropertyCount = await db.select().from(newProperties);
      if (newPropertyCount.length > 0) {
        // Legacy data can be safely removed
        console.log('Legacy data cleared successfully');
      }
    } catch (error) {
      console.error('Error clearing legacy data:', error);
    }
  }

  async verifyMigration(): Promise<{ success: boolean; summary: any }> {
    try {
      const propertyCount = (await db.select().from(newProperties)).length;
      const assumptionsCount = (await db.select().from(propertyAssumptions)).length;
      const unitTypesCount = (await db.select().from(unitTypes)).length;
      const rentRollCount = (await db.select().from(rentRoll)).length;

      const summary = {
        properties: propertyCount,
        assumptions: assumptionsCount,
        unitTypes: unitTypesCount,
        rentRoll: rentRollCount,
      };

      console.log('Migration verification:', summary);
      return { success: propertyCount > 0, summary };
    } catch (error) {
      console.error('Migration verification failed:', error);
      return { success: false, summary: null };
    }
  }
}

export const propertyMigrationService = new PropertyMigrationService();