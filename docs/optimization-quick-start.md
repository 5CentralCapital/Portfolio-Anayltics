# Optimization Quick Start Guide

## Task 1: Query Optimization (Days 1-4)

### Day 1: Create the optimized query function
```bash
# 1. Add new method to storage.ts
# 2. Use JSON aggregation to fetch all data in one query
# 3. Test with sample data
```

### Day 2: Create database view
```sql
-- Run migration
supabase migration new create_properties_with_data_view
-- Add the CREATE VIEW statement
-- Deploy: supabase db push
```

### Day 3: Update API routes
- Replace `getPropertiesForUser` with `getPropertiesForUserOptimized`
- Update all property endpoints
- Test API responses

### Day 4: Performance testing
- Benchmark: Before = 41 queries, After = 1 query
- Verify data integrity
- Monitor query plans with EXPLAIN ANALYZE

## Task 2: Normalized Tables (Days 5-10)

### Days 5-6: Migration script
```bash
# Create migration script
npm run migrate:normalized
# Test on sample properties first
```

### Day 7: Update import process
- Remove `dealAnalyzerData` from imports
- Use `importNormalizedData` directly
- Update all import endpoints

### Days 8-9: Remove JSON dependencies
- Update calculation engine
- Remove all `parseDealAnalyzerData` calls
- Test calculations

### Day 10: Archive JSON column
```sql
-- Safe archival, not deletion
ALTER TABLE properties RENAME COLUMN deal_analyzer_data TO deal_analyzer_data_archived;
```

## Task 3: Database Indexes (Days 11-13)

### Day 11: Create indexes migration
```bash
supabase migration new add_performance_indexes
# Add all CREATE INDEX statements
supabase db push
```

### Day 12: Add composite indexes
- Focus on multi-column queries
- Add partial indexes for filtered queries

### Day 13: Monitor performance
```sql
-- Check slow queries
SELECT * FROM pg_stat_statements WHERE mean_exec_time > 100;
```

## Task 4: Caching Layer (Days 14-20)

### Day 14: Setup Redis
```bash
# Local development
docker run -d -p 6379:6379 redis:alpine

# Production
# Use Redis Cloud or AWS ElastiCache
```

### Days 15-16: Implement cache service
- Create `CalculationCache` class
- Add get/set/invalidate methods
- Test with sample properties

### Day 17: Integrate with calculations
- Wrap `calculatePropertyMetrics` with cache
- Add cache warming for frequently accessed properties

### Day 18: Cache invalidation
- Setup event emitters
- Invalidate on property/rent roll/assumptions updates
- Test cache consistency

### Days 19-20: Portfolio caching
- Cache user portfolio metrics
- 30-minute TTL for aggregated data
- Invalidate on any property change

## Quick Win Implementations

### 1. Add Indexes NOW (30 minutes)
```sql
-- These will have immediate impact
CREATE INDEX idx_entity_memberships_user_entity ON entity_memberships(user_id, entity_name);
CREATE INDEX idx_properties_entity ON properties(entity);
CREATE INDEX idx_property_rent_roll_property ON property_rent_roll(property_id);
```

### 2. Simple In-Memory Cache (2 hours)
```typescript
// Quick in-memory cache before Redis
const calculationCache = new Map<string, { data: any, expires: number }>();

function getCached(key: string): any | null {
  const cached = calculationCache.get(key);
  if (!cached || cached.expires < Date.now()) {
    return null;
  }
  return cached.data;
}

function setCached(key: string, data: any, ttl: number = 3600000) {
  calculationCache.set(key, {
    data,
    expires: Date.now() + ttl
  });
}
```

### 3. Query Batching (1 day)
```typescript
// Batch multiple property queries
async function getPropertiesWithDataBatched(propertyIds: number[]) {
  const [rentRolls, unitTypes, loans, assumptions] = await Promise.all([
    db.select().from(propertyRentRoll).where(inArray(propertyRentRoll.propertyId, propertyIds)),
    db.select().from(propertyUnitTypes).where(inArray(propertyUnitTypes.propertyId, propertyIds)),
    db.select().from(propertyLoans).where(inArray(propertyLoans.propertyId, propertyIds)),
    db.select().from(propertyAssumptions).where(inArray(propertyAssumptions.propertyId, propertyIds))
  ]);
  
  // Group by propertyId
  return groupByPropertyId({ rentRolls, unitTypes, loans, assumptions });
}
```

## Monitoring & Rollback

### Monitor These Metrics
1. **Query count per request** - Should drop by 80%+
2. **Response time P95** - Target < 500ms
3. **Cache hit rate** - Target > 80%
4. **Database CPU** - Should decrease significantly

### Rollback Plan
1. **Feature flags** for each optimization
2. **Database backups** before migrations
3. **Keep old methods** for 30 days
4. **Monitor error rates** closely

### Success Criteria
- [ ] Properties load in < 500ms
- [ ] Single query for property data
- [ ] 80%+ cache hit rate
- [ ] Zero data inconsistencies
- [ ] 50% reduction in database load