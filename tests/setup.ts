import { db } from '../server/db';
import { 
  properties, 
  propertyAssumptions, 
  propertyRentRoll, 
  propertyExpenses,
  propertyRehabBudget,
  propertyClosingCosts,
  propertyHoldingCosts,
  propertyLoans,
  propertyPerformanceMetrics,
  users,
  sessions
} from '../shared/schema';

/**
 * Test Database Setup and Cleanup
 */
export class TestDatabase {
  
  /**
   * Clean all test data before each test
   */
  async cleanup(): Promise<void> {
    // Delete in reverse dependency order to avoid FK constraint violations
    await db.delete(propertyPerformanceMetrics);
    await db.delete(propertyLoans);
    await db.delete(propertyHoldingCosts);
    await db.delete(propertyClosingCosts);
    await db.delete(propertyRehabBudget);
    await db.delete(propertyExpenses);
    await db.delete(propertyRentRoll);
    await db.delete(propertyAssumptions);
    await db.delete(properties);
    await db.delete(sessions);
    await db.delete(users);
  }

  /**
   * Create a test user for authentication
   */
  async createTestUser(): Promise<any> {
    const [user] = await db.insert(users).values({
      email: 'test@example.com',
      passwordHash: 'test-password-hash',
      firstName: 'Test',
      lastName: 'User',
      profileImageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    return user;
  }

  /**
   * Verify database is empty (for test isolation)
   */
  async verifyEmpty(): Promise<void> {
    const propertyCount = await db.select().from(properties);
    const assumptionCount = await db.select().from(propertyAssumptions);
    const rentRollCount = await db.select().from(propertyRentRoll);
    const expenseCount = await db.select().from(propertyExpenses);
    
    if (propertyCount.length > 0 || assumptionCount.length > 0 || 
        rentRollCount.length > 0 || expenseCount.length > 0) {
      throw new Error('Database not clean before test');
    }
  }
}

// Global test database instance
export const testDb = new TestDatabase();

// Setup and teardown hooks
beforeEach(async () => {
  await testDb.cleanup();
  await testDb.verifyEmpty();
});

afterAll(async () => {
  await testDb.cleanup();
});