# Database & Calculation Services: Specific Examples

## What's Done Well ✅

### 1. **Unified Calculation Engine Implementation**

**Before**: 5 different calculation systems with conflicting logic
```typescript
// Server-side (old)
const capRate = noi / arvAtTimePurchased; // Wrong! Using ARV

// Client-side (old)  
const capRate = noi / purchasePrice; // Correct but inconsistent
```

**After**: Single unified engine
```typescript
// shared/calculations/calculation-engine.ts
const capRate = purchasePrice > 0 ? noi.annualNOI / purchasePrice : 0;
// Always consistent, always uses purchase price
```

### 2. **Smart Data Source Prioritization**

**Example**: Income calculation with intelligent fallbacks
```typescript
// Priority 1: Live rent roll with tenant data
if (property.rentRoll && property.rentRoll.length > 0) {
  const hasLiveData = property.rentRoll.some(unit => 
    unit.tenantName || unit.leaseStart || unit.leaseEnd
  );
  // Uses actual rent if tenants exist
}

// Priority 2: Unit types from database
if (monthlyGrossRent === 0 && property.unitTypes) {
  // Falls back to market rents
}

// Priority 3: Deal Analyzer data
if (monthlyGrossRent === 0 && property.dealAnalyzerData) {
  // Last resort fallback
}
```

### 3. **Comprehensive Database Schema**

**Property Assumptions Table**: Well-structured with all needed fields
```typescript
export const propertyAssumptions = pgTable("property_assumptions", {
  vacancyRate: decimal("vacancy_rate", { precision: 5, scale: 4 }).default("0.05"),
  expenseRatio: decimal("expense_ratio", { precision: 5, scale: 4 }).default("0.45"),
  managementFee: decimal("management_fee", { precision: 5, scale: 4 }).default("0.08"),
  // All fields properly defined with appropriate precision
});
```

### 4. **Proper Decimal Storage**

**Cash-on-Cash Return**: Now stored correctly
```typescript
// Before: Would store 13.1% as 0.13 (capped at 0.9999)
cashOnCashReturn: Math.min(metrics.cashOnCashReturn * 100, 9.9999).toString()

// After: Stores as proper decimal
cashOnCashReturn: Math.min(metrics.cashOnCashReturn, 0.9999).toString()
// 0.131 stored for 13.1%
```

### 5. **Type-Safe Property Data Loading**

```typescript
// getPropertiesForUser now includes all related data
const [rentRoll, unitTypes, propertyLoansData, assumptions] = await Promise.all([
  db.select().from(propertyRentRoll).where(eq(propertyRentRoll.propertyId, property.id)),
  db.select().from(propertyUnitTypes).where(eq(propertyUnitTypes.propertyId, property.id)),
  db.select().from(propertyLoans).where(eq(propertyLoans.propertyId, property.id)),
  db.select().from(propertyAssumptions).where(eq(propertyAssumptions.propertyId, property.id))
]);
```

## Remaining Issues ⚠️

### 1. **N+1 Query Problem**

**Current Issue**: Loading 10 properties = 41 database queries!
```typescript
// getPropertiesForUser
const allProperties = await db.select().from(properties); // 1 query
const userProperties = allProperties.filter(...);

// Then for EACH property:
userProperties.map(async (property) => {
  const [rentRoll, unitTypes, loans, assumptions] = await Promise.all([
    db.select()..., // 4 queries per property
    db.select()...,
    db.select()...,
    db.select()...
  ]);
});
```

### 2. **Data Redundancy Example**

**Same data stored twice**:
```typescript
// In properties table
dealAnalyzerData: JSON.stringify({
  assumptions: { vacancyRate: 0.05, managementFee: 0.08 },
  rentRoll: [{ unitNumber: "101", currentRent: 1200 }]
})

// Also in normalized tables
property_assumptions: { vacancy_rate: 0.05, management_fee: 0.08 }
property_rent_roll: { unit_number: "101", current_rent: 1200 }
```

### 3. **Manual Calculations in Import**

**Problem**: Not using unified engine
```typescript
// importFromDealAnalyzer does manual calculations
private calculateGrossRentalIncome(dealData: any): number {
  // Manual calculation instead of using unified engine
  let monthlyRent = 0;
  if (dealData.rentRoll) {
    dealData.rentRoll.forEach((unit: any) => {
      monthlyRent += parseFloat(unit.currentRent || 0);
    });
  }
  return monthlyRent * 12;
}
```

### 4. **Type Safety Issues**

**Excessive use of `any`**:
```typescript
// Too many any types
const data = this.parseDealAnalyzerData(property.dealAnalyzerData);
if (data?.rentRoll?.length > 0) {
  monthlyGrossRent = data.rentRoll.reduce((sum: number, unit: any) => {
    // Lost type safety
    const rent = this.parseNumber(unit.currentRent || unit.marketRent || 0);
    return sum + rent;
  }, 0);
}
```

### 5. **Missing Calculations**

**Other Income hardcoded to 0**:
```typescript
private static calculateOtherIncome(property: PropertyData): number {
  // TODO: Implement other income calculation from property.incomeOther table
  return 0; // Always returns 0!
}
```

### 6. **Debug Logs in Production**

```typescript
// Debug log for property 50
if (property.id === 50) {
  console.log(`Property 50 rent roll from DB:`, rentRoll.length, 'units');
  if (rentRoll.length > 0) {
    console.log('First unit:', rentRoll[0]);
  }
}
```

### 7. **String/Number Type Confusion**

**Database returns strings, calculations expect numbers**:
```typescript
// Schema defines as decimal (returns string)
acquisitionPrice: decimal("acquisition_price", { precision: 15, scale: 2 })

// But interface expects string | number
acquisitionPrice: string | number;

// Leading to repeated parsing
const purchasePrice = this.parseNumber(property.acquisitionPrice || 0);
```

### 8. **Silent Failures**

**Error swallowed without logging**:
```typescript
try {
  await this.importNormalizedData(property.id, dealData);
} catch (error) {
  console.error(`Error importing normalized data for property ${property.id}:`, error);
  // Continue with property creation even if normalized import fails
  // But what if this causes data inconsistency?
}
```

## Real-World Impact Examples

### Before Unified Engine
- Property #50: Cap Rate shows 9.0% on Portfolio, 8.3% on Details, 7.6% on Asset Management
- Cash-on-Cash: Shows 0.13% instead of 13.1%
- ARV: $850,000 vs $1,636,363 for same property

### After Unified Engine
- All pages show consistent 8.3% Cap Rate
- Cash-on-Cash correctly shows 13.1%
- ARV consistently calculated at $1,090,909

### Performance Impact
- Loading 20 properties: 81 database queries
- Each property load parses ~50KB JSON blob
- Initial page load: ~2-3 seconds on average connection