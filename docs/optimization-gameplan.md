# Database & Calculation Optimization Game Plan

## Overview
This document provides a step-by-step implementation plan for 4 critical optimization tasks. Estimated timeline: 3-4 weeks total.

## Task 1: Optimize Database Queries (Week 1)

### Problem
Current N+1 pattern: 1 property query + 4 queries per property = 41 queries for 10 properties

### Solution: Single Optimized Query with JSON Aggregation

#### Step 1: Create New Query Function (Day 1-2)

```typescript
// server/storage.ts - Add new optimized method
async getPropertiesForUserOptimized(userId: number): Promise<Property[]> {
  // First, get user's entities
  const userEntities = await this.getUserEntityOwnership(userId);
  const entityNames = userEntities.map(e => e.entityName);
  
  if (entityNames.length === 0) return [];
  
  // Single query with all related data
  const query = sql`
    WITH user_entities AS (
      SELECT unnest(${entityNames}::text[]) as entity_name
    )
    SELECT 
      p.*,
      COALESCE(
        json_agg(DISTINCT jsonb_build_object(
          'id', rr.id,
          'unitNumber', rr.unit_number,
          'currentRent', rr.current_rent,
          'proFormaRent', rr.pro_forma_rent,
          'isVacant', rr.is_vacant,
          'leaseStart', rr.lease_start,
          'leaseEnd', rr.lease_end,
          'tenantName', rr.tenant_name
        )) FILTER (WHERE rr.id IS NOT NULL), 
        '[]'::json
      ) as rent_roll,
      COALESCE(
        json_agg(DISTINCT jsonb_build_object(
          'id', ut.id,
          'unitTypeId', ut.unit_type_id,
          'name', ut.name,
          'units', ut.units,
          'marketRent', ut.market_rent
        )) FILTER (WHERE ut.id IS NOT NULL),
        '[]'::json
      ) as unit_types,
      COALESCE(
        json_agg(DISTINCT jsonb_build_object(
          'id', pl.id,
          'loanName', pl.loan_name,
          'monthlyPayment', pl.monthly_payment,
          'currentBalance', pl.current_balance,
          'originalAmount', pl.original_amount,
          'interestRate', pl.interest_rate,
          'isActive', pl.is_active
        )) FILTER (WHERE pl.id IS NOT NULL),
        '[]'::json
      ) as property_loans,
      COALESCE(
        (SELECT row_to_json(pa.*) 
         FROM property_assumptions pa 
         WHERE pa.property_id = p.id 
         LIMIT 1),
        null
      ) as assumptions,
      COALESCE(
        json_agg(DISTINCT jsonb_build_object(
          'id', pe.id,
          'expenseType', pe.expense_type,
          'expenseName', pe.expense_name,
          'annualAmount', pe.annual_amount
        )) FILTER (WHERE pe.id IS NOT NULL),
        '[]'::json
      ) as expenses
    FROM properties p
    INNER JOIN user_entities ue ON p.entity = ue.entity_name
    LEFT JOIN property_rent_roll rr ON rr.property_id = p.id
    LEFT JOIN property_unit_types ut ON ut.property_id = p.id
    LEFT JOIN property_loans pl ON pl.property_id = p.id
    LEFT JOIN property_expenses pe ON pe.property_id = p.id
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `;

  const result = await db.execute(query);
  
  return result.rows.map(row => ({
    ...row,
    rentRoll: row.rent_roll || [],
    unitTypes: row.unit_types || [],
    propertyLoans: row.property_loans || [],
    assumptions: row.assumptions || null,
    expenses: row.expenses || [],
    dealAnalyzerData: this.safeParseDealAnalyzerData(row.deal_analyzer_data)
  }));
}

private safeParseDealAnalyzerData(data: any): any {
  if (!data) return null;
  if (typeof data === 'object') return data;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}
```

#### Step 2: Create Database View (Day 2)

```sql
-- supabase/migrations/create_properties_with_data_view.sql
CREATE OR REPLACE VIEW properties_with_data AS
SELECT 
  p.*,
  COALESCE(
    json_agg(DISTINCT jsonb_build_object(
      'id', rr.id,
      'unitNumber', rr.unit_number,
      'currentRent', rr.current_rent,
      'proFormaRent', rr.pro_forma_rent,
      'isVacant', rr.is_vacant,
      'tenantName', rr.tenant_name
    )) FILTER (WHERE rr.id IS NOT NULL), 
    '[]'::json
  ) as rent_roll_data,
  -- ... other aggregations
FROM properties p
LEFT JOIN property_rent_roll rr ON rr.property_id = p.id
-- ... other joins
GROUP BY p.id;
```

#### Step 3: Update API Routes (Day 3)

```typescript
// server/routes.ts
router.get("/api/properties", async (req, res) => {
  const userId = req.session.userId;
  
  // Use new optimized method
  const properties = await storage.getPropertiesForUserOptimized(userId);
  
  res.json(properties);
});
```

#### Step 4: Performance Testing (Day 4)
- Benchmark old vs new query performance
- Monitor query execution plans
- Ensure data integrity

## Task 2: Choose Primary Storage (Week 1-2)

### Decision: Use Normalized Tables as Primary Storage

#### Why Normalized Tables?
1. Better query performance for specific data
2. Easier to maintain data integrity
3. Supports partial updates
4. Better for reporting and analytics

#### Implementation Plan

#### Step 1: Migration Strategy (Day 1-2)

```typescript
// server/migrations/migrate-to-normalized.ts
export async function migrateToNormalizedStorage() {
  // Get all properties with dealAnalyzerData
  const properties = await db.select()
    .from(properties)
    .where(isNotNull(properties.dealAnalyzerData));
  
  for (const property of properties) {
    if (property.dealAnalyzerData) {
      // Sync to normalized tables
      await storage.syncDealAnalyzerDataToTables(
        property.id, 
        property.dealAnalyzerData
      );
      
      // Mark as migrated
      await db.update(properties)
        .set({ 
          dealAnalyzerDataMigrated: true,
          updatedAt: new Date() 
        })
        .where(eq(properties.id, property.id));
    }
  }
}
```

#### Step 2: Update Import Process (Day 3)

```typescript
// server/storage.ts - Update importFromDealAnalyzer
async importFromDealAnalyzer(dealData: any, additionalPropertyData: any, userId: number): Promise<Property> {
  // Create property without dealAnalyzerData
  const propertyData = {
    status: "Under Contract" as const,
    apartments: dealData.assumptions?.unitCount || 1,
    address: dealData.propertyAddress || additionalPropertyData.address,
    // ... other fields
    // Remove: dealAnalyzerData: JSON.stringify(dealData)
  };

  const property = await this.createProperty(propertyData);
  
  // Import directly to normalized tables
  await this.importNormalizedData(property.id, dealData);
  
  // Calculate metrics using unified engine
  const propertyWithData = await this.getPropertyWithData(property.id);
  const metrics = calculateProperty(propertyWithData);
  
  // Store calculated metrics
  await calculationService.storePropertyMetrics(property.id, metrics);
  
  return property;
}
```

#### Step 3: Remove JSON Dependencies (Day 4-5)

```typescript
// shared/calculations/calculation-engine.ts
// Remove all dealAnalyzerData parsing logic
private static calculateIncome(property: PropertyData) {
  let monthlyGrossRent = 0;
  
  // Priority 1: Live rent roll
  if (property.rentRoll && property.rentRoll.length > 0) {
    const hasLiveData = property.rentRoll.some(unit => 
      unit.tenantName || unit.leaseStart || unit.leaseEnd
    );
    
    if (hasLiveData || property.rentRoll.some(unit => this.parseNumber(unit.currentRent) > 0)) {
      monthlyGrossRent = property.rentRoll.reduce((sum, unit) => {
        const rent = this.parseNumber(unit.currentRent || unit.proFormaRent || 0);
        return sum + rent;
      }, 0);
    }
  }
  
  // Priority 2: Unit types
  if (monthlyGrossRent === 0 && property.unitTypes && property.unitTypes.length > 0) {
    monthlyGrossRent = property.unitTypes.reduce((sum, unitType) => {
      const units = this.parseNumber(unitType.units || 1);
      const rent = this.parseNumber(unitType.marketRent || 0);
      return sum + (units * rent);
    }, 0);
  }
  
  // Remove Priority 3 (Deal Analyzer data)
  
  const annualGrossRent = monthlyGrossRent * 12;
  // ... rest of calculation
}
```

#### Step 4: Archive JSON Column (Day 6)

```sql
-- supabase/migrations/archive_deal_analyzer_data.sql
-- Rename column instead of dropping (safety measure)
ALTER TABLE properties 
RENAME COLUMN deal_analyzer_data TO deal_analyzer_data_archived;

-- Add migration status column
ALTER TABLE properties 
ADD COLUMN deal_analyzer_data_migrated BOOLEAN DEFAULT FALSE;
```

## Task 3: Add Missing Database Indexes (Week 2)

### Analysis: Identify High-Traffic Queries

#### Step 1: Create Performance Indexes (Day 1)

```sql
-- supabase/migrations/add_performance_indexes.sql

-- Entity membership queries (most frequent)
CREATE INDEX idx_entity_memberships_user_entity 
ON entity_memberships(user_id, entity_name);

-- Property entity filtering
CREATE INDEX idx_properties_entity 
ON properties(entity);

-- Property status filtering
CREATE INDEX idx_properties_status 
ON properties(status);

-- Property date sorting
CREATE INDEX idx_properties_created_at 
ON properties(created_at DESC);

-- Rent roll property lookup
CREATE INDEX idx_property_rent_roll_property 
ON property_rent_roll(property_id);

-- Unit types property lookup
CREATE INDEX idx_property_unit_types_property 
ON property_unit_types(property_id);

-- Loans active status
CREATE INDEX idx_property_loans_property_active 
ON property_loans(property_id, is_active);

-- Assumptions property lookup (unique)
CREATE UNIQUE INDEX idx_property_assumptions_property 
ON property_assumptions(property_id);

-- Performance metrics date queries
CREATE INDEX idx_property_performance_metrics_property_date 
ON property_performance_metrics(property_id, calculation_date DESC);
```

#### Step 2: Composite Indexes for Complex Queries (Day 2)

```sql
-- Composite index for user property access pattern
CREATE INDEX idx_properties_entity_status_created 
ON properties(entity, status, created_at DESC);

-- Composite for loan calculations
CREATE INDEX idx_property_loans_active_property 
ON property_loans(is_active, property_id) 
WHERE is_active = true;
```

#### Step 3: Monitor and Optimize (Day 3)

```typescript
// server/monitoring/query-performance.ts
export async function analyzeQueryPerformance() {
  const slowQueries = await db.execute(sql`
    SELECT 
      query,
      mean_exec_time,
      calls,
      total_exec_time
    FROM pg_stat_statements
    WHERE mean_exec_time > 100 -- queries taking > 100ms
    ORDER BY mean_exec_time DESC
    LIMIT 20
  `);
  
  return slowQueries.rows;
}
```

## Task 4: Implement Caching Layer (Week 2-3)

### Redis-Based Caching for Calculated Metrics

#### Step 1: Setup Redis Infrastructure (Day 1)

```bash
# Install dependencies
npm install redis @types/redis
```

```typescript
// server/cache/redis-client.ts
import { createClient } from 'redis';

export const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redis.on('error', err => console.error('Redis Client Error', err));

export async function initializeRedis() {
  await redis.connect();
}
```

#### Step 2: Create Caching Service (Day 2-3)

```typescript
// server/cache/calculation-cache.ts
import { redis } from './redis-client';
import { calculateProperty } from '@shared/calculations/calculation-engine';

export class CalculationCache {
  private static TTL = 3600; // 1 hour cache
  
  static getCacheKey(propertyId: number): string {
    return `calc:property:${propertyId}`;
  }
  
  static getVersionKey(propertyId: number): string {
    return `calc:version:${propertyId}`;
  }
  
  async getCalculatedMetrics(propertyId: number): Promise<CalculationResult | null> {
    const cached = await redis.get(this.getCacheKey(propertyId));
    if (!cached) return null;
    
    try {
      return JSON.parse(cached);
    } catch {
      return null;
    }
  }
  
  async setCalculatedMetrics(
    propertyId: number, 
    metrics: CalculationResult
  ): Promise<void> {
    await redis.setex(
      this.getCacheKey(propertyId),
      this.TTL,
      JSON.stringify(metrics)
    );
  }
  
  async invalidateProperty(propertyId: number): Promise<void> {
    await redis.del(this.getCacheKey(propertyId));
    await redis.incr(this.getVersionKey(propertyId));
  }
  
  async invalidateMultiple(propertyIds: number[]): Promise<void> {
    if (propertyIds.length === 0) return;
    
    const keys = propertyIds.map(id => this.getCacheKey(id));
    await redis.del(...keys);
  }
}

export const calculationCache = new CalculationCache();
```

#### Step 3: Integrate Caching with Calculation Service (Day 4)

```typescript
// server/calculation.service.ts
import { calculationCache } from './cache/calculation-cache';

export class CalculationService {
  async calculatePropertyMetrics(propertyId: number): Promise<PropertyMetrics> {
    // Check cache first
    const cached = await calculationCache.getCalculatedMetrics(propertyId);
    if (cached) {
      return cached;
    }
    
    // Get property with all related data
    const property = await this.getPropertyWithData(propertyId);
    if (!property) throw new Error('Property not found');

    // Calculate using unified engine
    const metrics = calculateProperty(property);
    
    // Cache the results
    await calculationCache.setCalculatedMetrics(propertyId, metrics);
    
    return metrics;
  }
  
  // Invalidate cache on updates
  async updatePropertyMetrics(propertyId: number): Promise<void> {
    await calculationCache.invalidateProperty(propertyId);
    
    const metrics = await this.calculatePropertyMetrics(propertyId);
    await this.storePropertyMetrics(propertyId, metrics);
  }
}
```

#### Step 4: Cache Invalidation Strategy (Day 5)

```typescript
// server/events/property-events.ts
import { EventEmitter } from 'events';
import { calculationCache } from '../cache/calculation-cache';

export const propertyEvents = new EventEmitter();

// Invalidate cache on property updates
propertyEvents.on('property:updated', async (propertyId: number) => {
  await calculationCache.invalidateProperty(propertyId);
});

propertyEvents.on('rentRoll:updated', async (propertyId: number) => {
  await calculationCache.invalidateProperty(propertyId);
});

propertyEvents.on('assumptions:updated', async (propertyId: number) => {
  await calculationCache.invalidateProperty(propertyId);
});

// Update storage methods to emit events
export class DatabaseStorage {
  async updateProperty(id: number, property: Partial<InsertProperty>) {
    const result = await db.update(properties)
      .set({ ...property, updatedAt: new Date() })
      .where(eq(properties.id, id))
      .returning();
    
    if (result[0]) {
      propertyEvents.emit('property:updated', id);
    }
    
    return result[0];
  }
}
```

#### Step 5: Portfolio-Level Caching (Day 6)

```typescript
// server/cache/portfolio-cache.ts
export class PortfolioCache {
  static getTTL = 1800; // 30 minutes
  
  static getCacheKey(userId: number): string {
    return `portfolio:user:${userId}`;
  }
  
  async getPortfolioMetrics(userId: number): Promise<PortfolioMetrics | null> {
    const cached = await redis.get(this.getCacheKey(userId));
    if (!cached) return null;
    
    try {
      return JSON.parse(cached);
    } catch {
      return null;
    }
  }
  
  async setPortfolioMetrics(
    userId: number, 
    metrics: PortfolioMetrics
  ): Promise<void> {
    await redis.setex(
      this.getCacheKey(userId),
      this.TTL,
      JSON.stringify(metrics)
    );
  }
  
  async invalidateUser(userId: number): Promise<void> {
    await redis.del(this.getCacheKey(userId));
  }
}
```

## Implementation Timeline

### Week 1
- **Days 1-4**: Complete Query Optimization (Task 1)
- **Days 5-6**: Start Primary Storage Decision (Task 2)

### Week 2  
- **Days 1-3**: Complete Storage Migration (Task 2)
- **Days 4-5**: Add Database Indexes (Task 3)
- **Day 6**: Begin Caching Implementation (Task 4)

### Week 3
- **Days 1-4**: Complete Caching Layer (Task 4)
- **Days 5-6**: Testing & Performance Monitoring

### Week 4 (Buffer)
- Performance testing
- Bug fixes
- Documentation updates
- Rollback planning

## Success Metrics

1. **Query Performance**
   - Reduce property load from 41 queries to 1-2 queries
   - Page load time < 500ms for 20 properties

2. **Storage Efficiency**
   - Eliminate JSON parsing overhead
   - Reduce storage by ~40% (no duplicate data)

3. **Cache Hit Rate**
   - Target 80%+ cache hit rate
   - Reduce calculation time by 90%

4. **Overall Performance**
   - API response time < 200ms (cached)
   - API response time < 800ms (uncached)

## Risk Mitigation

1. **Data Migration Risks**
   - Keep JSON data as backup for 30 days
   - Implement rollback procedures
   - Test migration on staging first

2. **Cache Consistency**
   - Implement proper cache invalidation
   - Monitor cache/database divergence
   - Add cache warming for critical data

3. **Performance Regression**
   - Benchmark before/after each change
   - Implement feature flags for gradual rollout
   - Monitor production metrics closely