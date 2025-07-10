import { db } from '../db';
import { properties } from '@shared/schema';
import { isNotNull, eq } from 'drizzle-orm';
import { storage } from '../storage';

/**
 * Migrate all existing properties from JSON storage to normalized tables
 * This is a one-time migration to transition from dealAnalyzerData JSON blobs
 * to properly normalized database tables
 */
export async function migrateToNormalizedStorage() {
  console.log('Starting migration from JSON to normalized tables...');
  
  try {
    // Get all properties that have dealAnalyzerData
    const propertiesWithJson = await db.select()
      .from(properties)
      .where(isNotNull(properties.dealAnalyzerData));
    
    console.log(`Found ${propertiesWithJson.length} properties with JSON data to migrate`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const property of propertiesWithJson) {
      try {
        console.log(`Migrating property ${property.id}: ${property.address}`);
        
        if (property.dealAnalyzerData) {
          // Sync JSON data to normalized tables
          await storage.syncDealAnalyzerDataToTables(
            property.id,
            typeof property.dealAnalyzerData === 'string' 
              ? property.dealAnalyzerData 
              : JSON.stringify(property.dealAnalyzerData)
          );
          
          // Mark as migrated by adding a flag (we'll add this column in a migration)
          // For now, we can track this in a separate table or just log it
          console.log(`✓ Successfully migrated property ${property.id}`);
          successCount++;
        }
      } catch (error) {
        console.error(`✗ Error migrating property ${property.id}:`, error);
        errorCount++;
      }
    }
    
    console.log('\nMigration Summary:');
    console.log(`Total properties processed: ${propertiesWithJson.length}`);
    console.log(`Successful migrations: ${successCount}`);
    console.log(`Failed migrations: ${errorCount}`);
    
    if (errorCount === 0) {
      console.log('\n✓ Migration completed successfully!');
    } else {
      console.log('\n⚠ Migration completed with errors. Please review the failed properties.');
    }
    
  } catch (error) {
    console.error('Fatal error during migration:', error);
    throw error;
  }
}

/**
 * Verify that normalized data matches JSON data
 * Run this after migration to ensure data integrity
 */
export async function verifyMigration() {
  console.log('Verifying migration integrity...');
  
  const propertiesWithJson = await db.select()
    .from(properties)
    .where(isNotNull(properties.dealAnalyzerData));
  
  let mismatchCount = 0;
  
  for (const property of propertiesWithJson) {
    try {
      // Build JSON from normalized tables
      const rebuiltJson = await storage.buildDealAnalyzerDataFromTables(property.id);
      
      if (!rebuiltJson) {
        console.warn(`⚠ Property ${property.id} has no normalized data`);
        mismatchCount++;
        continue;
      }
      
      // Parse both JSONs for comparison
      const originalData = typeof property.dealAnalyzerData === 'string' 
        ? JSON.parse(property.dealAnalyzerData)
        : property.dealAnalyzerData;
      const rebuiltData = JSON.parse(rebuiltJson);
      
      // Basic verification - check key data points
      if (originalData.assumptions && rebuiltData.assumptions) {
        const origAssumptions = originalData.assumptions;
        const newAssumptions = rebuiltData.assumptions;
        
        if (origAssumptions.vacancyRate !== newAssumptions.vacancy_rate ||
            origAssumptions.managementFee !== newAssumptions.management_fee) {
          console.warn(`⚠ Data mismatch in property ${property.id} assumptions`);
          mismatchCount++;
        }
      }
      
    } catch (error) {
      console.error(`Error verifying property ${property.id}:`, error);
      mismatchCount++;
    }
  }
  
  if (mismatchCount === 0) {
    console.log('✓ All properties verified successfully!');
  } else {
    console.log(`⚠ Found ${mismatchCount} properties with data mismatches`);
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateToNormalizedStorage()
    .then(() => verifyMigration())
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}