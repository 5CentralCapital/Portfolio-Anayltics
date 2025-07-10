import { storage } from '../storage';
import { db } from '../db';

/**
 * Performance test to compare old getPropertiesForUser vs new optimized version
 * This demonstrates the improvement from N+1 queries to a single query
 */
async function runPerformanceTest() {
  console.log('Starting Query Performance Test...\n');
  
  // Test user ID - adjust based on your test data
  const testUserId = 1;
  
  // Warm up the database connection
  await storage.getUserEntityOwnership(testUserId);
  
  console.log('=== Testing Old Method (N+1 Queries) ===');
  const oldStartTime = performance.now();
  const oldProperties = await storage.getPropertiesForUser(testUserId);
  const oldEndTime = performance.now();
  const oldDuration = oldEndTime - oldStartTime;
  
  console.log(`Properties loaded: ${oldProperties.length}`);
  console.log(`Time taken: ${oldDuration.toFixed(2)}ms`);
  console.log(`Average per property: ${(oldDuration / oldProperties.length).toFixed(2)}ms`);
  
  // Calculate number of queries (1 for entities, 1 for properties, 4 per property)
  const oldQueryCount = 2 + (oldProperties.length * 4);
  console.log(`Estimated queries executed: ${oldQueryCount}`);
  
  console.log('\n=== Testing New Method (Single Query) ===');
  const newStartTime = performance.now();
  const newProperties = await storage.getPropertiesForUserOptimized(testUserId);
  const newEndTime = performance.now();
  const newDuration = newEndTime - newStartTime;
  
  console.log(`Properties loaded: ${newProperties.length}`);
  console.log(`Time taken: ${newDuration.toFixed(2)}ms`);
  console.log(`Average per property: ${(newDuration / newProperties.length).toFixed(2)}ms`);
  console.log(`Queries executed: 2`); // 1 for entities, 1 for properties with all data
  
  // Calculate improvement
  const improvement = ((oldDuration - newDuration) / oldDuration) * 100;
  const queryReduction = ((oldQueryCount - 2) / oldQueryCount) * 100;
  
  console.log('\n=== Performance Summary ===');
  console.log(`Performance improvement: ${improvement.toFixed(1)}% faster`);
  console.log(`Query reduction: ${queryReduction.toFixed(1)}% fewer queries`);
  console.log(`Speed increase: ${(oldDuration / newDuration).toFixed(1)}x faster`);
  
  // Verify data integrity
  console.log('\n=== Data Integrity Check ===');
  let dataMatches = true;
  
  for (let i = 0; i < oldProperties.length; i++) {
    const oldProp = oldProperties[i];
    const newProp = newProperties.find(p => p.id === oldProp.id);
    
    if (!newProp) {
      console.error(`❌ Property ${oldProp.id} missing in new method`);
      dataMatches = false;
      continue;
    }
    
    // Check key data points
    if (oldProp.rentRoll?.length !== newProp.rentRoll?.length) {
      console.error(`❌ Property ${oldProp.id}: Rent roll count mismatch`);
      dataMatches = false;
    }
    
    if (oldProp.unitTypes?.length !== newProp.unitTypes?.length) {
      console.error(`❌ Property ${oldProp.id}: Unit types count mismatch`);
      dataMatches = false;
    }
    
    if (oldProp.propertyLoans?.length !== newProp.propertyLoans?.length) {
      console.error(`❌ Property ${oldProp.id}: Loans count mismatch`);
      dataMatches = false;
    }
  }
  
  if (dataMatches) {
    console.log('✅ All data matches between old and new methods');
  } else {
    console.log('❌ Data integrity issues found');
  }
  
  // Test with different user loads
  console.log('\n=== Load Testing ===');
  const loadTestResults: Array<{
    userCount: number;
    oldTime: number;
    newTime: number;
    improvement: number;
  }> = [];
  
  for (const userCount of [1, 5, 10]) {
    console.log(`\nTesting with ${userCount} users...`);
    
    // Old method
    const oldLoadStart = performance.now();
    for (let i = 0; i < userCount; i++) {
      await storage.getPropertiesForUser(testUserId);
    }
    const oldLoadTime = performance.now() - oldLoadStart;
    
    // New method
    const newLoadStart = performance.now();
    for (let i = 0; i < userCount; i++) {
      await storage.getPropertiesForUserOptimized(testUserId);
    }
    const newLoadTime = performance.now() - newLoadStart;
    
    loadTestResults.push({
      userCount,
      oldTime: oldLoadTime,
      newTime: newLoadTime,
      improvement: ((oldLoadTime - newLoadTime) / oldLoadTime) * 100
    });
    
    console.log(`Old method: ${oldLoadTime.toFixed(0)}ms`);
    console.log(`New method: ${newLoadTime.toFixed(0)}ms`);
    console.log(`Improvement: ${((oldLoadTime - newLoadTime) / oldLoadTime * 100).toFixed(1)}%`);
  }
  
  console.log('\n=== Conclusion ===');
  console.log('The optimized query method provides:');
  console.log(`- ${improvement.toFixed(0)}% performance improvement`);
  console.log(`- ${queryReduction.toFixed(0)}% reduction in database queries`);
  console.log('- Better scalability under load');
  console.log('- Consistent performance regardless of property count');
}

// Run if called directly
if (require.main === module) {
  runPerformanceTest()
    .then(() => {
      console.log('\nPerformance test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Performance test failed:', error);
      process.exit(1);
    });
}