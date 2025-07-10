# Database and Calculation Service Audit Report

## Executive Summary

The codebase has significant issues with calculation consistency, data synchronization, and KPI accuracy. There are duplicate calculation engines on the server and client sides that use different formulas, resulting in mismatched KPIs across different pages. Additionally, critical data is not being loaded properly, leading to incorrect calculations.

## Critical Issues Found

### 1. **Duplicate Calculation Engines with Different Logic**

**Server-side:** `server/calculation.service.ts`
**Client-side:** `client/src/services/unifiedCalculations.ts` and `propertyCalculations.ts`

#### Issues:
- **Cash-on-Cash Return:**
  - Server: Multiplies by 100 to get percentage (line 119), then divides by 100 when storing (line 312)
  - This causes values to be stored incorrectly (e.g., 10% becomes 0.1%)
  
- **Cap Rate:**
  - Server: Uses `currentARV` as denominator
  - Client: Uses `purchasePrice` as denominator
  - Results in completely different cap rates for the same property

- **ARV Calculation:**
  - Server: `NOI / marketCapRate`
  - Client: `NOI / exitCapRate` + special logic for AUM using database `arvAtTimePurchased`
  - Causes ARV to differ between portfolio view and property details

### 2. **Missing Property Assumptions Data**

In `server/storage.ts` lines 264-340, when fetching properties:
```typescript
// Properties are fetched with rentRoll, unitTypes, and propertyLoans
// BUT propertyAssumptions is NOT fetched!
```

This causes the calculation service to create default assumptions for every calculation, ignoring any saved assumptions.

### 3. **Management Fee Field Missing from Schema**

Server calculation references `assumptions.managementFee` (line 94) but this field doesn't exist in the `propertyAssumptions` table schema.

### 4. **Data Source Priority Inconsistencies**

Client has complex priority system:
1. Live data (lease uploads, mortgage statements)
2. Database normalized data
3. Deal Analyzer data
4. Defaults

Server doesn't implement the same priority system, causing different data to be used for calculations.

### 5. **Income Calculation Discrepancies**

- **Field name confusion:** `currentRent` vs `rent` vs `proFormaRent`
- **Monthly vs Annual confusion:** Some calculations multiply by 12, others don't
- **Unit count issues:** Not properly accounting for multiple units of same type

### 6. **Expense Calculation Issues**

- Server adds management fee separately to total expenses
- Client includes management fee in expense breakdown
- Percentage-based expenses calculated differently
- No validation that percentages sum to reasonable amounts

### 7. **Equity Multiple Calculation Inconsistency**

Different formulas for sold vs active properties:
- Sold: `totalProfits / capitalRequired`
- Active: `(ARV - allInCost) / capitalRequired`

But `totalProfits` field may not be accurate for sold properties.

### 8. **Database Storage Issues**

When storing metrics in `propertyPerformanceMetrics`:
- Percentages are divided by 100 and capped at 9.9999
- This loses precision and causes display issues
- Some calculations expect percentages, others decimals

## Specific Examples of KPI Mismatches

### Example 1: Cash-on-Cash Return
- Server calculates: 15% 
- Server stores: 0.15 (after dividing by 100)
- Client displays: 0.15% (showing stored value as percentage)

### Example 2: Cap Rate
- Property purchase price: $1,000,000
- NOI: $60,000
- Server ARV (using 5.5% cap): $1,090,909
- Server cap rate: 5.5% (NOI/ARV)
- Client cap rate: 6% (NOI/Purchase Price)

### Example 3: Portfolio AUM
- Individual property ARV: $1,090,909 (calculated)
- Portfolio view ARV: $850,000 (using database `arvAtTimePurchased`)
- Causes total AUM to be understated

## Recommendations for Systematic Enhancement

### 1. **Consolidate Calculation Logic**

Create a single source of truth for calculations:

```typescript
// shared/calculations/engine.ts
export class UnifiedCalculationEngine {
  // All calculation logic in one place
  // Can be used by both server and client
}
```

### 2. **Fix Data Loading**

Update `getPropertiesForUser` to include all necessary data:

```typescript
async getPropertiesForUser(userId: number): Promise<Property[]> {
  // ... existing code ...
  
  const propertiesWithData = await Promise.all(
    userProperties.map(async (property) => {
      const [rentRoll, unitTypes, propertyLoansData, assumptions, expenses] = await Promise.all([
        db.select().from(propertyRentRoll).where(eq(propertyRentRoll.propertyId, property.id)),
        db.select().from(propertyUnitTypes).where(eq(propertyUnitTypes.propertyId, property.id)),
        db.select().from(propertyLoans).where(eq(propertyLoans.propertyId, property.id)),
        db.select().from(propertyAssumptions).where(eq(propertyAssumptions.propertyId, property.id)),
        db.select().from(propertyExpenses).where(eq(propertyExpenses.propertyId, property.id))
      ]);
      
      return {
        ...property,
        rentRoll,
        unitTypes,
        propertyLoans: propertyLoansData,
        assumptions: assumptions[0], // Include assumptions
        expenses
      };
    })
  );
}
```

### 3. **Standardize Percentage Storage**

Always store as decimals, display as percentages:

```typescript
// Store
const capRateDecimal = 0.055; // 5.5%

// Display
const capRateDisplay = (capRateDecimal * 100).toFixed(2) + '%'; // "5.50%"
```

### 4. **Add Database Migration**

Add missing `managementFee` field:

```sql
ALTER TABLE property_assumptions 
ADD COLUMN management_fee DECIMAL(5, 4) DEFAULT 0.08;
```

### 5. **Implement Calculation Caching**

```typescript
// Cache calculations to avoid recalculating on every request
interface CalculationCache {
  propertyId: number;
  timestamp: Date;
  metrics: PropertyMetrics;
}

class CalculationCacheService {
  private cache = new Map<number, CalculationCache>();
  private CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  
  get(propertyId: number): PropertyMetrics | null {
    const cached = this.cache.get(propertyId);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp.getTime() > this.CACHE_TTL) {
      this.cache.delete(propertyId);
      return null;
    }
    
    return cached.metrics;
  }
  
  set(propertyId: number, metrics: PropertyMetrics): void {
    this.cache.set(propertyId, {
      propertyId,
      timestamp: new Date(),
      metrics
    });
  }
}
```

### 6. **Create Data Validation Layer**

```typescript
class PropertyDataValidator {
  static validateRentRoll(rentRoll: any[]): ValidationResult {
    const errors = [];
    
    for (const unit of rentRoll) {
      if (!unit.currentRent && !unit.proFormaRent) {
        errors.push(`Unit ${unit.unitNumber} has no rent data`);
      }
      
      const rent = parseFloat(unit.currentRent || unit.proFormaRent || '0');
      if (rent < 0 || rent > 50000) {
        errors.push(`Unit ${unit.unitNumber} has invalid rent: ${rent}`);
      }
    }
    
    return { valid: errors.length === 0, errors };
  }
}
```

### 7. **Implement Calculation Audit Trail**

```typescript
// New table for calculation history
export const calculationAuditLog = pgTable("calculation_audit_log", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull(),
  calculationType: text("calculation_type").notNull(),
  inputData: jsonb("input_data"),
  outputData: jsonb("output_data"),
  calculationVersion: text("calculation_version"),
  userId: integer("user_id"),
  createdAt: timestamp("created_at").defaultNow()
});
```

### 8. **Add Unit Tests for Calculations**

```typescript
describe('PropertyCalculations', () => {
  it('should calculate cash-on-cash return correctly', () => {
    const input = {
      annualCashFlow: 50000,
      totalInvestedCapital: 250000
    };
    
    const result = calculateCashOnCashReturn(input);
    expect(result).toBe(20); // 20%, not 0.2
  });
  
  it('should calculate cap rate using NOI and purchase price', () => {
    const input = {
      netOperatingIncome: 60000,
      purchasePrice: 1000000
    };
    
    const result = calculateCapRate(input);
    expect(result).toBe(6); // 6%
  });
});
```

### 9. **Create KPI Documentation**

Document exactly how each KPI should be calculated:

```typescript
/**
 * KPI Calculation Standards
 * 
 * Cash-on-Cash Return = (Annual Cash Flow / Total Invested Capital) * 100
 * - Annual Cash Flow = NOI - Debt Service
 * - Total Invested Capital = Down Payment + Closing Costs + Out-of-pocket Rehab
 * 
 * Cap Rate = (NOI / Property Value) * 100
 * - For acquisition: Use Purchase Price
 * - For current: Use Current ARV
 * 
 * DSCR = NOI / Annual Debt Service
 * - Must be > 1.0 for positive cash flow
 * 
 * Equity Multiple = Total Profit / Initial Investment
 * - For active: (Current Equity + Cash Flow to Date) / Initial Investment
 * - For sold: (Sale Proceeds + Total Cash Flow) / Initial Investment
 */
```

### 10. **Implement Real-time Calculation Updates**

```typescript
// When data changes, recalculate and broadcast updates
async function handleDataChange(propertyId: number, changeType: string) {
  // Invalidate cache
  calculationCache.delete(propertyId);
  
  // Recalculate metrics
  const newMetrics = await calculationService.calculatePropertyMetrics(propertyId);
  
  // Store in database
  await calculationService.storePropertyMetrics(propertyId, newMetrics);
  
  // Broadcast to connected clients
  io.to(`property-${propertyId}`).emit('metrics-updated', {
    propertyId,
    metrics: newMetrics,
    timestamp: new Date()
  });
}
```

## Implementation Priority

1. **Immediate (Week 1):**
   - Fix cash-on-cash return calculation and storage
   - Add propertyAssumptions to data fetching
   - Standardize percentage handling

2. **Short-term (Week 2-3):**
   - Consolidate calculation engines
   - Add missing database fields
   - Implement data validation

3. **Medium-term (Month 2):**
   - Add calculation caching
   - Implement audit trail
   - Create comprehensive unit tests

4. **Long-term (Month 3+):**
   - Real-time calculation updates
   - Performance optimization
   - Advanced analytics features

## Conclusion

The current system has fundamental issues that cause incorrect and inconsistent calculations. By implementing these recommendations systematically, you can achieve:

- **Accurate KPIs** across all views
- **Consistent calculations** between server and client
- **Better performance** through caching
- **Easier debugging** through audit trails
- **Higher confidence** through testing

The most critical fixes should be implemented immediately to restore user confidence in the displayed metrics.