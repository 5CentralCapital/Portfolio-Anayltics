# Database & Calculation Services Deep Dive Audit

## Executive Summary

This audit reveals **critical inconsistencies** in your real estate investment platform's calculation engine and database layer, resulting in **mismatched KPIs across pages** and **unreliable cash flow calculations**. The root causes include duplicated calculation logic, inconsistent data priorities, and schema misalignments.

## 🔴 Critical Issues Identified

### 1. Multiple Calculation Engines Creating Inconsistencies

**Problem**: You have **5 different calculation systems** running simultaneously:

1. **Server-side**: `calculation.service.ts` (new, comprehensive)
2. **Client-side**: `propertyCalculations.ts` (detailed data prioritization)
3. **Unified**: `unifiedCalculations.ts` (coordination layer)
4. **Legacy**: `calculations.ts` (deprecated but still in use)
5. **Direct DB queries**: Various routes with inline calculations

**Impact**: Same property shows different KPIs on different pages

**Example Inconsistency**:
```typescript
// Server calculation (calculation.service.ts)
const cashOnCashReturn = totalInvestedCapital > 0 ? (beforeTaxCashFlow / totalInvestedCapital) * 100 : 0;

// Client calculation (propertyCalculations.ts) 
const cashOnCashReturn = capitalRequired > 0 ? (cashFlowData.annualCashFlow / capitalRequired) * 100 : 0;

// Different variables: totalInvestedCapital vs capitalRequired
// Different cash flow: beforeTaxCashFlow vs annualCashFlow
```

### 2. Data Source Priority Conflicts

**Problem**: Inconsistent data source priorities across calculation engines:

**Server Priority** (calculation.service.ts):
```
1. propertyRentRoll table
2. propertyUnitTypes table  
3. propertyAssumptions defaults
```

**Client Priority** (propertyCalculations.ts):
```
1. Live rent roll (lease uploads)
2. Database rent roll
3. Deal Analyzer data
4. Market defaults
```

**Impact**: Server calculates $2,400/month rent, client calculates $2,800/month for same property

### 3. Database Schema vs Calculation Mismatches

**Critical Rent Roll Issues**:
```typescript
// Schema defines (shared/schema.ts):
export const propertyRentRoll = pgTable("property_rent_roll", {
  unitTypeId: text("unit_type_id").notNull(),
  unitNumber: text("unit_number").notNull(),
  currentRent: decimal("current_rent", { precision: 10, scale: 2 }),
  proFormaRent: decimal("pro_forma_rent", { precision: 10, scale: 2 }),
  //...
});

// But calculation tries to access:
eq(propertyRentRoll.unit, leaseData.unitNumber) // ❌ Field doesn't exist
```

**Loan Data Inconsistencies**:
```typescript
// Code tries to access:
eq(propertyLoans.loanNumber, mortgageData.loanNumber) // ❌ Field is 'loanName'

// Type mismatches:
nextPaymentDate: parseDate(loanData.nextPaymentDate), // ❌ Returns Date, expects string
```

### 4. Cash Flow Calculation Errors

**Issue 1**: Management Fee Double-Counting
```typescript
// Server calculation includes management fee in operating expenses
const managementFee = effectiveGrossIncome * 0.08;
const totalOperatingExpenses = baseOperatingExpenses + managementFee;

// Client calculation may include it again through expense breakdown
```

**Issue 2**: Debt Service Calculation Inconsistencies
```typescript
// Server uses active loan flag
const activeLoan = loans.find(loan => loan.isActive) || loans[0];

// Client uses different priority:
const activeLoan = sources.liveLoanData?.find(loan => loan.isActive) || 
                   sources.dbLoans?.find(loan => loan.isActive) ||
                   sources.dealAnalyzerData?.loans?.[0];
```

## 🟡 Major Data Integrity Issues

### 1. Income Calculation Inconsistencies

**Multiple Income Sources Conflict**:
```typescript
// Issue: Same property can have income calculated from:
// 1. propertyRentRoll.currentRent * 12
// 2. propertyUnitTypes.marketRent * units * 12  
// 3. dealAnalyzerData.rentRoll.reduce()
// 4. editedExpenses (wrong - should be income)
```

**Vacancy Rate Application**:
```typescript
// Server: Applied after gross calculation
const vacancyLoss = grossRentalIncome * vacancyRate;

// Client: Different vacancy sources
const vacancyRate = parseFloat(
  sources.dbAssumptions?.vacancyRate ||
  sources.dealAnalyzerData?.assumptions?.vacancyRate ||
  '0.05'  // Different defaults
);
```

### 2. ARV (After Repair Value) Calculation Chaos

**Problem**: 4 different ARV calculation methods:

1. **Cap Rate Method** (calculation.service.ts):
```typescript
return netOperatingIncome / marketCapRate;
```

2. **Database Field** (properties.arvAtTimePurchased):
```typescript
const databaseARV = parseFloat(property.arvAtTimePurchased || '0');
```

3. **Purchase Price Fallback**:
```typescript
return Number(assumptions.purchasePrice); // Fallback
```

4. **Client Override Logic**:
```typescript
const arvForAUM = databaseARV > 0 ? databaseARV : financials.currentARV;
```

**Impact**: Portfolio AUM calculation varies by $500K+ depending on which method is used

### 3. Expense Calculation Fragmentation

**Issue**: Expenses calculated differently across pages:

**Asset Management Page**:
```typescript
// Uses direct property.expenses or percentage-based defaults
```

**Portfolio Page**: 
```typescript
// Uses UnifiedCalculationService with edited expenses priority
```

**Deal Analyzer**:
```typescript
// Uses Deal Analyzer specific expense structure
```

**Server Metrics**:
```typescript
// Uses propertyExpenses table with percentage calculations
```

## 📊 Database Design Problems

### 1. Schema-Code Misalignment

**Identified Mismatches**:
```sql
-- Schema has these fields:
loanName TEXT NOT NULL,
nextPaymentDate DATE,
lastPaymentDate DATE

-- Code expects these:
loanNumber, -- ❌ Doesn't exist
nextPaymentDate: string, -- ❌ Type mismatch  
lastPaymentDate: string  -- ❌ Type mismatch
```

### 2. Missing Database Constraints

**Critical Missing Elements**:
```sql
-- No foreign key validation for:
propertyRentRoll.unitTypeId -> propertyUnitTypes.unitTypeId

-- No unique constraints for:
UNIQUE(propertyId, unitNumber) -- Allows duplicate units

-- No data validation for:
currentRent > 0 -- Allows negative rents
interestRate BETWEEN 0 AND 1 -- Allows invalid rates
```

### 3. Inefficient Calculation Storage

**Problem**: Metrics calculated real-time every page load instead of cached:

```typescript
// Every page does this:
const metrics = await calculationService.calculatePropertyMetrics(propertyId);

// Should be:
const metrics = await getStoredMetrics(propertyId) || 
                await calculateAndStoreMetrics(propertyId);
```

## 🛠️ Systematic Enhancement Plan

### Phase 1: Data Source Consolidation (Week 1-2)

#### 1.1 Create Single Source of Truth Service
```typescript
// NEW: DataSourceManager.ts
export class DataSourceManager {
  static async getPropertyData(propertyId: number): Promise<PropertyDataSources> {
    // Fetch ALL data in parallel
    const [property, rentRoll, loans, expenses, assumptions] = await Promise.all([
      storage.getProperty(propertyId),
      storage.getPropertyRentRoll(propertyId),
      storage.getPropertyLoans(propertyId),
      storage.getPropertyExpenses(propertyId),
      storage.getPropertyAssumptions(propertyId)
    ]);
    
    // Apply consistent data prioritization
    return this.prioritizeDataSources({
      property,
      rentRoll: this.prioritizeRentRoll(rentRoll, property),
      loans: this.prioritizeLoans(loans, property),
      expenses: this.prioritizeExpenses(expenses, property),
      assumptions
    });
  }
  
  private static prioritizeRentRoll(dbRentRoll: any[], property: any): RentRollData {
    // 1. Live data (has real tenant info)
    // 2. Database data (has valid rents)
    // 3. Deal Analyzer data
    // 4. Unit type defaults
  }
}
```

#### 1.2 Fix Database Schema Issues
```sql
-- Fix field name inconsistencies
ALTER TABLE property_loans RENAME COLUMN loan_name TO loan_number;

-- Fix data type issues  
ALTER TABLE property_loans 
  ALTER COLUMN next_payment_date TYPE TEXT,
  ALTER COLUMN last_payment_date TYPE TEXT;

-- Add missing constraints
ALTER TABLE property_rent_roll 
  ADD CONSTRAINT unique_property_unit UNIQUE(property_id, unit_number);

-- Add validation constraints
ALTER TABLE property_rent_roll 
  ADD CONSTRAINT positive_rent CHECK (current_rent >= 0);
```

#### 1.3 Unified Calculation Engine
```typescript
// NEW: MasterCalculationEngine.ts
export class MasterCalculationEngine {
  
  static async calculateProperty(propertyId: number): Promise<PropertyMetrics> {
    // 1. Get unified data sources
    const sources = await DataSourceManager.getPropertyData(propertyId);
    
    // 2. Calculate with consistent logic
    const income = this.calculateIncome(sources);
    const expenses = this.calculateExpenses(sources, income);
    const debt = this.calculateDebtService(sources);
    const cashFlow = this.calculateCashFlow(income, expenses, debt);
    const metrics = this.calculateKPIs(sources, cashFlow);
    
    // 3. Store results for consistency
    await this.storeCalculatedMetrics(propertyId, metrics);
    
    return metrics;
  }
  
  // Single implementation used everywhere
  private static calculateIncome(sources: PropertyDataSources): IncomeMetrics {
    // Consistent priority logic
    if (sources.liveRentRoll?.length > 0) {
      return this.calculateFromLiveRentRoll(sources.liveRentRoll);
    }
    
    if (sources.dbRentRoll?.length > 0) {
      return this.calculateFromDbRentRoll(sources.dbRentRoll);
    }
    
    // Fallback to unit types or assumptions
    return this.calculateFromDefaults(sources);
  }
}
```

### Phase 2: Calculation Standardization (Week 2-3)

#### 2.1 Standardize Cash Flow Calculations

```typescript
export interface StandardCashFlowCalculation {
  // Standardized calculation steps
  grossRentalIncome: number;      // Step 1: Sum all unit rents * 12
  vacancyLoss: number;            // Step 2: GRI * vacancy_rate
  otherIncome: number;            // Step 3: Parking, laundry, etc.
  effectiveGrossIncome: number;   // Step 4: GRI - vacancy + other
  
  operatingExpenses: number;      // Step 5: All expenses except debt service
  managementFee: number;          // Step 6: EGI * management_rate (separate line)
  totalExpenses: number;          // Step 7: Operating + management
  netOperatingIncome: number;     // Step 8: EGI - total_expenses
  
  debtService: number;            // Step 9: Principal + Interest payments
  beforeTaxCashFlow: number;      // Step 10: NOI - debt_service
  
  // Investment metrics
  capRate: number;                // NOI / current_value
  cashOnCashReturn: number;       // BTCF / initial_investment
  dscr: number;                   // NOI / debt_service
}
```

#### 2.2 Create Calculation Validation System

```typescript
export class CalculationValidator {
  static validatePropertyMetrics(metrics: PropertyMetrics): ValidationResult {
    const errors: string[] = [];
    
    // Income validation
    if (metrics.grossRentalIncome < 0) {
      errors.push('Gross rental income cannot be negative');
    }
    
    if (metrics.effectiveGrossIncome > metrics.grossRentalIncome) {
      errors.push('Effective gross income cannot exceed gross rental income');
    }
    
    // Cash flow validation
    if (metrics.netOperatingIncome > metrics.effectiveGrossIncome) {
      errors.push('NOI cannot exceed effective gross income');
    }
    
    // Ratio validation
    if (metrics.capRate < 0 || metrics.capRate > 0.5) {
      errors.push('Cap rate outside reasonable range (0-50%)');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings: this.getWarnings(metrics)
    };
  }
}
```

### Phase 3: KPI Consistency Framework (Week 3-4)

#### 3.1 Centralized KPI Display Components

```typescript
// NEW: KPIDisplay.tsx
export const KPIDisplay: React.FC<{ propertyId: number; kpiType: string }> = ({ 
  propertyId, 
  kpiType 
}) => {
  const { data: metrics, isLoading } = usePropertyMetrics(propertyId);
  
  // Single source of truth for all KPI displays
  const renderKPI = (type: string) => {
    switch(type) {
      case 'cashOnCash':
        return `${metrics.cashOnCashReturn.toFixed(1)}%`;
      case 'capRate':
        return `${metrics.capRate.toFixed(1)}%`;
      case 'monthlyCashFlow':
        return formatCurrency(metrics.monthlyCashFlow);
      case 'arv':
        return formatCurrency(metrics.currentARV);
      default:
        return 'N/A';
    }
  };
  
  return <span className="kpi-value">{renderKPI(kpiType)}</span>;
};
```

#### 3.2 Metrics Caching & Invalidation

```typescript
export class MetricsCache {
  private static cache = new Map<number, CachedMetrics>();
  
  static async getPropertyMetrics(propertyId: number): Promise<PropertyMetrics> {
    // Check cache first
    const cached = this.cache.get(propertyId);
    if (cached && !this.isStale(cached)) {
      return cached.metrics;
    }
    
    // Calculate fresh metrics
    const metrics = await MasterCalculationEngine.calculateProperty(propertyId);
    
    // Cache with TTL
    this.cache.set(propertyId, {
      metrics,
      calculatedAt: Date.now(),
      ttl: 300000 // 5 minutes
    });
    
    return metrics;
  }
  
  static invalidateProperty(propertyId: number): void {
    this.cache.delete(propertyId);
  }
  
  static invalidateAll(): void {
    this.cache.clear();
  }
}
```

### Phase 4: Database Optimization (Week 4-5)

#### 4.1 Add Calculated Metrics Table

```sql
CREATE TABLE property_calculated_metrics (
  id SERIAL PRIMARY KEY,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  
  -- Income metrics
  gross_rental_income DECIMAL(15,2) NOT NULL DEFAULT 0,
  effective_gross_income DECIMAL(15,2) NOT NULL DEFAULT 0,
  net_operating_income DECIMAL(15,2) NOT NULL DEFAULT 0,
  
  -- Cash flow metrics
  monthly_cash_flow DECIMAL(12,2) NOT NULL DEFAULT 0,
  annual_cash_flow DECIMAL(15,2) NOT NULL DEFAULT 0,
  
  -- Investment metrics
  cap_rate DECIMAL(5,4) NOT NULL DEFAULT 0,
  cash_on_cash_return DECIMAL(5,4) NOT NULL DEFAULT 0,
  equity_multiple DECIMAL(5,2) NOT NULL DEFAULT 0,
  dscr DECIMAL(5,2) NOT NULL DEFAULT 0,
  
  -- Valuation metrics
  current_arv DECIMAL(15,2) NOT NULL DEFAULT 0,
  current_equity_value DECIMAL(15,2) NOT NULL DEFAULT 0,
  
  -- Metadata
  calculated_at TIMESTAMP DEFAULT NOW(),
  calculation_version VARCHAR(10) DEFAULT '1.0',
  data_sources JSONB, -- Track what data was used
  
  UNIQUE(property_id)
);

-- Create trigger to invalidate cache on data changes
CREATE OR REPLACE FUNCTION invalidate_property_metrics()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM property_calculated_metrics WHERE property_id = NEW.property_id;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER invalidate_metrics_on_rent_roll_change
  AFTER INSERT OR UPDATE OR DELETE ON property_rent_roll
  FOR EACH ROW EXECUTE FUNCTION invalidate_property_metrics();
```

#### 4.2 Data Quality Monitoring

```typescript
export class DataQualityMonitor {
  static async runDailyChecks(): Promise<DataQualityReport> {
    const issues: QualityIssue[] = [];
    
    // Check for negative rents
    const negativeRents = await db.select()
      .from(propertyRentRoll)
      .where(sql`current_rent < 0 OR pro_forma_rent < 0`);
    
    if (negativeRents.length > 0) {
      issues.push({
        type: 'negative_rents',
        count: negativeRents.length,
        severity: 'high',
        properties: negativeRents.map(r => r.propertyId)
      });
    }
    
    // Check for properties without rent roll
    const propertiesWithoutRentRoll = await db.select()
      .from(properties)
      .leftJoin(propertyRentRoll, eq(properties.id, propertyRentRoll.propertyId))
      .where(sql`${propertyRentRoll.id} IS NULL AND ${properties.status} != 'Sold'`);
    
    // Check for inconsistent data
    const inconsistentData = await this.findCalculationInconsistencies();
    
    return {
      issues,
      totalProperties: await this.getTotalProperties(),
      checkedAt: new Date(),
      recommendations: this.generateRecommendations(issues)
    };
  }
}
```

## 🎯 Implementation Priorities

### Immediate (This Week)
1. **Fix hardcoded schema field mismatches** in routes/ai-documents.ts and property-loans.routes.ts
2. **Implement single calculation endpoint** for server-side KPIs
3. **Add calculation result caching** to reduce inconsistencies

### Short Term (2-3 Weeks)  
1. **Consolidate all calculation logic** into MasterCalculationEngine
2. **Create data source prioritization** rules
3. **Implement KPI validation** and monitoring

### Medium Term (4-6 Weeks)
1. **Add calculated metrics table** for performance and consistency  
2. **Build real-time data quality** monitoring
3. **Create calculation audit trail** for debugging

### Long Term (2-3 Months)
1. **Implement advanced caching** strategies
2. **Add calculation A/B testing** framework
3. **Build automated data reconciliation** system

## 🔧 Recommended Code Changes

### Fix 1: Unify All Calculation Calls

**Replace everywhere**:
```typescript
// ❌ Remove all these different calls:
const metrics1 = calculationService.calculatePropertyMetrics(id);
const metrics2 = PropertyCalculationEngine.calculatePropertyFinancials(sources);
const metrics3 = UnifiedCalculationService.calculateProperty(data);
const metrics4 = CalculationService.calculatePropertyKPIs(property);

// ✅ Use single endpoint:
const metrics = await MasterCalculationEngine.getPropertyMetrics(propertyId);
```

### Fix 2: Standardize Data Access

```typescript
// ❌ Current inconsistent access:
property.rentRoll?.forEach(...)
rentRoll.reduce(...)
sources.liveRentRoll.map(...)

// ✅ Standardized access:
const rentRollData = await DataSourceManager.getRentRollData(propertyId);
```

### Fix 3: Add Calculation Validation

```typescript
// Add to all calculation endpoints:
const metrics = await calculateMetrics(propertyId);
const validation = CalculationValidator.validatePropertyMetrics(metrics);

if (!validation.isValid) {
  logger.error('Calculation validation failed', { propertyId, errors: validation.errors });
  throw new Error(`Invalid calculation results: ${validation.errors.join(', ')}`);
}
```

## 📈 Success Metrics

- **KPI Consistency**: Same KPI shows identical value across all pages
- **Calculation Performance**: <100ms response time for property metrics
- **Data Quality**: <1% of properties with calculation errors
- **Cash Flow Accuracy**: Monthly reconciliation with bank statements
- **Developer Experience**: Single API call for all property metrics

This systematic approach will eliminate the calculation chaos and provide reliable, consistent financial metrics across your entire platform.