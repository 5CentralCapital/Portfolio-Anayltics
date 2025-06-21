/**
 * Unified Data Migration System
 * 
 * Ensures all existing properties work seamlessly with the unified database system
 * and newly imported properties from Deal Analyzer are properly synchronized.
 */

import { db } from './db';
import { properties, type Property } from '@shared/schema';
import { dataSyncManager } from './dataSync';
import { eq } from 'drizzle-orm';

export interface MigrationResult {
  totalProperties: number;
  migratedProperties: number;
  skippedProperties: number;
  errors: string[];
  warnings: string[];
  validationResults: ValidationResult[];
}

export interface ValidationResult {
  propertyId: number;
  address: string;
  issues: string[];
  severity: 'info' | 'warning' | 'error';
}

/**
 * Unified Data Migration Manager
 */
export class UnifiedDataMigrationManager {
  private static instance: UnifiedDataMigrationManager;
  
  private constructor() {}

  static getInstance(): UnifiedDataMigrationManager {
    if (!UnifiedDataMigrationManager.instance) {
      UnifiedDataMigrationManager.instance = new UnifiedDataMigrationManager();
    }
    return UnifiedDataMigrationManager.instance;
  }

  /**
   * Migrate all existing properties to unified system
   */
  async migrateAllProperties(): Promise<MigrationResult> {
    console.log('Starting unified data migration for all properties...');
    
    const result: MigrationResult = {
      totalProperties: 0,
      migratedProperties: 0,
      skippedProperties: 0,
      errors: [],
      warnings: [],
      validationResults: []
    };

    try {
      // Get all properties
      const allProperties = await db.select().from(properties);
      result.totalProperties = allProperties.length;

      console.log(`Found ${allProperties.length} properties to migrate`);

      for (const property of allProperties) {
        try {
          await this.migrateProperty(property, result);
        } catch (error) {
          const errorMsg = `Failed to migrate property ${property.id}: ${error}`;
          console.error(errorMsg);
          result.errors.push(errorMsg);
        }
      }

      // Validate all properties after migration
      await this.validateAllProperties(result);

      console.log('Migration completed:', {
        total: result.totalProperties,
        migrated: result.migratedProperties,
        skipped: result.skippedProperties,
        errors: result.errors.length,
        warnings: result.warnings.length
      });

    } catch (error) {
      result.errors.push(`Migration failed: ${error}`);
      console.error('Migration failed:', error);
    }

    return result;
  }

  /**
   * Migrate a single property to unified system
   */
  private async migrateProperty(property: Property, result: MigrationResult): Promise<void> {
    try {
      // Check if property needs migration
      if (await this.isPropertyUpToDate(property)) {
        result.skippedProperties++;
        return;
      }

      // Enhance deal analyzer data if incomplete
      const enhancedDealData = await this.enhanceDealAnalyzerData(property);
      
      // Perform unified sync with enhanced data
      const syncResult = await dataSyncManager.updatePropertyWithSync(property.id, {
        dealAnalyzerData: enhancedDealData ? JSON.stringify(enhancedDealData) : property.dealAnalyzerData
      });

      // Log any warnings
      if (syncResult.warnings.length > 0) {
        result.warnings.push(...syncResult.warnings.map(w => `Property ${property.id}: ${w}`));
      }

      result.migratedProperties++;
      console.log(`Migrated property ${property.id} (${property.address})`);

    } catch (error) {
      throw new Error(`Property migration failed: ${error}`);
    }
  }

  /**
   * Check if property is up to date with unified system
   */
  private async isPropertyUpToDate(property: Property): Promise<boolean> {
    // Check if deal analyzer data exists and is properly structured
    if (!property.dealAnalyzerData) {
      return false;
    }

    try {
      const dealData = JSON.parse(property.dealAnalyzerData);
      
      // Check for required data structures
      const requiredStructures = [
        'assumptions',
        'rentRoll',
        'incomeAndExpenses',
        'exitAnalysis'
      ];

      for (const structure of requiredStructures) {
        if (!dealData[structure]) {
          return false;
        }
      }

      // Check if calculations are consistent
      const calculations = dataSyncManager['calculateAllFields'](property);
      const storedCashFlow = parseFloat(property.cashFlow || '0');
      const calculatedCashFlow = calculations.monthlyCashFlow;

      // Allow 5% variance for rounding
      if (Math.abs(storedCashFlow - calculatedCashFlow) > Math.abs(storedCashFlow * 0.05)) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Enhance deal analyzer data for existing properties
   */
  private async enhanceDealAnalyzerData(property: Property): Promise<any | null> {
    try {
      let dealData = property.dealAnalyzerData ? JSON.parse(property.dealAnalyzerData) : {};

      // Create default assumptions if missing
      if (!dealData.assumptions) {
        dealData.assumptions = {
          unitCount: property.apartments || 1,
          purchasePrice: parseFloat(property.acquisitionPrice || '0'),
          loanPercentage: 0.8,
          interestRate: 0.07,
          loanTermYears: 30,
          vacancyRate: 0.05,
          expenseRatio: 0.45,
          marketCapRate: 0.065,
          refinanceLTV: 0.70,
          refinanceInterestRate: 0.065,
          refinanceClosingCostPercent: 0.03,
          dscrThreshold: 1.25
        };
      }

      // Create rent roll if missing
      if (!dealData.rentRoll || !Array.isArray(dealData.rentRoll)) {
        const unitCount = property.apartments || 1;
        const monthlyCashFlow = parseFloat(property.cashFlow || '0');
        const estimatedRent = monthlyCashFlow > 0 ? (monthlyCashFlow * 2.5) : 1000; // Rough estimate

        dealData.rentRoll = Array.from({ length: unitCount }, (_, i) => ({
          id: i + 1,
          unitNumber: `Unit ${i + 1}`,
          unitTypeId: 1,
          tenant: '',
          leaseStart: '',
          leaseEnd: '',
          currentRent: estimatedRent,
          proFormaRent: estimatedRent,
          sqft: 800,
          occupied: true
        }));
      }

      // Create unit types if missing
      if (!dealData.unitTypes || !Array.isArray(dealData.unitTypes)) {
        const avgRent = dealData.rentRoll.length > 0 ? 
          dealData.rentRoll.reduce((sum: number, unit: any) => sum + (unit.proFormaRent || 0), 0) / dealData.rentRoll.length : 1000;

        dealData.unitTypes = [
          {
            id: 1,
            name: '1 Bedroom',
            beds: 1,
            baths: 1,
            sqft: 800,
            marketRent: avgRent,
            count: property.apartments || 1
          }
        ];
      }

      // Create income and expenses structure if missing
      if (!dealData.incomeAndExpenses) {
        const grossRent = dealData.rentRoll.reduce((sum: number, unit: any) => sum + (unit.proFormaRent || 0), 0) * 12;
        const estimatedExpenses = grossRent * 0.45; // 45% expense ratio

        dealData.incomeAndExpenses = {
          income: [
            { id: 1, source: 'Rental Income', monthlyAmount: grossRent / 12, annualAmount: grossRent }
          ],
          operatingExpenses: [
            { id: 1, category: 'Property Tax', monthlyAmount: estimatedExpenses * 0.25 / 12, annualAmount: estimatedExpenses * 0.25 },
            { id: 2, category: 'Insurance', monthlyAmount: estimatedExpenses * 0.15 / 12, annualAmount: estimatedExpenses * 0.15 },
            { id: 3, category: 'Maintenance', monthlyAmount: estimatedExpenses * 0.20 / 12, annualAmount: estimatedExpenses * 0.20 },
            { id: 4, category: 'Management', monthlyAmount: estimatedExpenses * 0.25 / 12, annualAmount: estimatedExpenses * 0.25 },
            { id: 5, category: 'Utilities', monthlyAmount: estimatedExpenses * 0.10 / 12, annualAmount: estimatedExpenses * 0.10 },
            { id: 6, category: 'Capital Reserves', monthlyAmount: estimatedExpenses * 0.05 / 12, annualAmount: estimatedExpenses * 0.05 }
          ]
        };
      }

      // Create financing structure if missing
      if (!dealData.financing) {
        const purchasePrice = parseFloat(property.acquisitionPrice || '0');
        const loanAmount = purchasePrice * 0.8;
        const interestRate = 0.07;
        const termYears = 30;
        
        let monthlyPayment = 0;
        if (loanAmount > 0 && interestRate > 0) {
          const monthlyRate = interestRate / 12;
          const numPayments = termYears * 12;
          monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
            (Math.pow(1 + monthlyRate, numPayments) - 1);
        }

        dealData.financing = {
          loans: [
            {
              id: 1,
              loanType: 'acquisition',
              lenderName: 'Primary Lender',
              loanAmount: loanAmount,
              interestRate: interestRate,
              termYears: termYears,
              monthlyPayment: monthlyPayment,
              isActive: true,
              isInterestOnly: false
            }
          ]
        };
      }

      // Create exit analysis if missing
      if (!dealData.exitAnalysis) {
        const arv = parseFloat(property.arvAtTimePurchased || property.acquisitionPrice || '0');
        
        dealData.exitAnalysis = {
          salesCapRate: '6.5',
          sellingCostPercent: '8',
          projectedSalesPrice: arv,
          holdStrategy: 'Hold for Cash Flow',
          refinanceStrategy: {
            newLoanAmount: arv * 0.70,
            newInterestRate: 0.065,
            newTermYears: 30,
            refinanceClosingCosts: arv * 0.03,
            cashOut: 0
          }
        };
      }

      // Create rehab budget sections if missing
      if (!dealData.rehabBudgetSections) {
        const totalRehabCosts = parseFloat(property.rehabCosts || '0');
        const unitCount = property.apartments || 1;
        const perUnitCost = totalRehabCosts > 0 ? totalRehabCosts / unitCount : 10000;

        dealData.rehabBudgetSections = {
          exterior: [
            { id: 1, category: 'General Rehab', perUnitCost: perUnitCost * 0.4, quantity: unitCount, totalCost: totalRehabCosts * 0.4 }
          ],
          kitchens: [
            { id: 1, category: 'Kitchen Rehab', perUnitCost: perUnitCost * 0.25, quantity: unitCount, totalCost: totalRehabCosts * 0.25 }
          ],
          bathrooms: [
            { id: 1, category: 'Bathroom Rehab', perUnitCost: perUnitCost * 0.15, quantity: unitCount, totalCost: totalRehabCosts * 0.15 }
          ],
          generalInterior: [
            { id: 1, category: 'Interior Rehab', perUnitCost: perUnitCost * 0.15, quantity: unitCount, totalCost: totalRehabCosts * 0.15 }
          ],
          finishings: [
            { id: 1, category: 'Finishings', perUnitCost: perUnitCost * 0.05, quantity: unitCount, totalCost: totalRehabCosts * 0.05 }
          ]
        };
      }

      return dealData;
    } catch (error) {
      console.warn(`Failed to enhance deal data for property ${property.id}:`, error);
      return null;
    }
  }

  /**
   * Validate all properties after migration
   */
  private async validateAllProperties(result: MigrationResult): Promise<void> {
    const allProperties = await db.select().from(properties);
    
    for (const property of allProperties) {
      const validation = await this.validateProperty(property);
      result.validationResults.push(validation);
      
      if (validation.severity === 'error') {
        result.errors.push(`Validation error for property ${property.id}: ${validation.issues.join(', ')}`);
      } else if (validation.severity === 'warning') {
        result.warnings.push(`Validation warning for property ${property.id}: ${validation.issues.join(', ')}`);
      }
    }
  }

  /**
   * Validate a single property
   */
  private async validateProperty(property: Property): Promise<ValidationResult> {
    const issues: string[] = [];
    let severity: 'info' | 'warning' | 'error' = 'info';

    try {
      // Check deal analyzer data structure
      if (!property.dealAnalyzerData) {
        issues.push('Missing deal analyzer data');
        severity = 'error';
      } else {
        try {
          const dealData = JSON.parse(property.dealAnalyzerData);
          
          // Check required structures
          const requiredStructures = ['assumptions', 'rentRoll', 'incomeAndExpenses'];
          for (const structure of requiredStructures) {
            if (!dealData[structure]) {
              issues.push(`Missing ${structure} in deal data`);
              severity = 'warning';
            }
          }
        } catch (parseError) {
          issues.push('Invalid deal analyzer data format');
          severity = 'error';
        }
      }

      // Check calculation consistency
      try {
        const calculations = dataSyncManager['calculateAllFields'](property);
        const storedCashFlow = parseFloat(property.cashFlow || '0');
        const calculatedCashFlow = calculations.monthlyCashFlow;

        if (Math.abs(storedCashFlow - calculatedCashFlow) > Math.abs(storedCashFlow * 0.10)) {
          issues.push(`Cash flow inconsistency: stored ${storedCashFlow}, calculated ${calculatedCashFlow}`);
          severity = severity === 'error' ? 'error' : 'warning';
        }
      } catch (calcError) {
        issues.push('Failed to validate calculations');
        severity = 'error';
      }

      // Check required fields
      const requiredFields = ['acquisitionPrice', 'apartments', 'address'];
      for (const field of requiredFields) {
        if (!property[field as keyof Property]) {
          issues.push(`Missing required field: ${field}`);
          severity = 'warning';
        }
      }

    } catch (error) {
      issues.push(`Validation failed: ${error}`);
      severity = 'error';
    }

    if (issues.length === 0) {
      issues.push('Property validation passed');
    }

    return {
      propertyId: property.id,
      address: property.address || 'Unknown',
      issues,
      severity
    };
  }

  /**
   * Migrate properties imported from Deal Analyzer
   */
  async migrateDealAnalyzerImports(): Promise<MigrationResult> {
    console.log('Migrating Deal Analyzer imported properties...');
    
    const result: MigrationResult = {
      totalProperties: 0,
      migratedProperties: 0,
      skippedProperties: 0,
      errors: [],
      warnings: [],
      validationResults: []
    };

    try {
      // Find properties with deal analyzer data (imported from Deal Analyzer)
      const allProperties = await db.select().from(properties);
      const dealAnalyzerProperties = allProperties.filter(p => 
        p.dealAnalyzerData && p.dealAnalyzerData.length > 100 // Has substantial deal data
      );

      result.totalProperties = dealAnalyzerProperties.length;
      console.log(`Found ${dealAnalyzerProperties.length} Deal Analyzer imported properties`);

      for (const property of dealAnalyzerProperties) {
        try {
          // Ensure these properties are fully synchronized
          const syncResult = await dataSyncManager.updatePropertyWithSync(property.id, {});
          
          if (syncResult.warnings.length > 0) {
            result.warnings.push(...syncResult.warnings.map(w => `Property ${property.id}: ${w}`));
          }

          result.migratedProperties++;
          console.log(`Synchronized Deal Analyzer import ${property.id} (${property.address})`);

        } catch (error) {
          const errorMsg = `Failed to sync Deal Analyzer import ${property.id}: ${error}`;
          console.error(errorMsg);
          result.errors.push(errorMsg);
        }
      }

    } catch (error) {
      result.errors.push(`Deal Analyzer migration failed: ${error}`);
      console.error('Deal Analyzer migration failed:', error);
    }

    return result;
  }
}

// Export singleton instance
export const unifiedDataMigrationManager = UnifiedDataMigrationManager.getInstance();