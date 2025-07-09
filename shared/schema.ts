import { pgTable, text, serial, integer, boolean, decimal, timestamp, date, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["admin", "manager", "viewer"] }).notNull().default("viewer"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  isActive: boolean("is_active").default(true),
  failedLoginAttempts: integer("failed_login_attempts").default(0),
  lockedUntil: timestamp("locked_until"),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sessions table for secure authentication
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Company metrics for financial tracking
export const companyMetrics = pgTable("company_metrics", {
  id: serial("id").primaryKey(),
  metricDate: date("metric_date").notNull().unique(),
  revenue: decimal("revenue", { precision: 15, scale: 2 }).notNull().default("0"),
  expenses: decimal("expenses", { precision: 15, scale: 2 }).notNull().default("0"),
  profitMargin: decimal("profit_margin", { precision: 5, scale: 2 }).default("0"),
  customerAcquisitionCost: decimal("customer_acquisition_cost", { precision: 10, scale: 2 }).default("0"),
  customerLifetimeValue: decimal("customer_lifetime_value", { precision: 10, scale: 2 }).default("0"),
  monthlyRecurringRevenue: decimal("monthly_recurring_revenue", { precision: 15, scale: 2 }).default("0"),
  churnRate: decimal("churn_rate", { precision: 5, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Properties table for real estate portfolio
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  status: text("status", { enum: ["Under Contract", "Rehabbing", "Cashflowing", "Sold"] }).notNull().default("Under Contract"),
  apartments: integer("apartments").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code"),
  entity: text("entity").default("5Central Capital LLC"), // Entity assignment
  acquisitionDate: date("acquisition_date"),
  acquisitionPrice: decimal("acquisition_price", { precision: 15, scale: 2 }).notNull(),
  rehabCosts: decimal("rehab_costs", { precision: 15, scale: 2 }).default("0"),
  arvAtTimePurchased: decimal("arv_at_time_purchased", { precision: 15, scale: 2 }),
  initialCapitalRequired: decimal("initial_capital_required", { precision: 15, scale: 2 }).notNull(),
  cashFlow: decimal("cash_flow", { precision: 15, scale: 2 }).notNull(),
  salePrice: decimal("sale_price", { precision: 15, scale: 2 }),
  salePoints: decimal("sale_points", { precision: 15, scale: 2 }),
  totalProfits: decimal("total_profits", { precision: 15, scale: 2 }).notNull(),
  yearsHeld: decimal("years_held", { precision: 3, scale: 1 }),
  cashOnCashReturn: decimal("cash_on_cash_return", { precision: 8, scale: 2 }).notNull(),
  annualizedReturn: decimal("annualized_return", { precision: 8, scale: 2 }).notNull(),
  dealAnalyzerData: text("deal_analyzer_data"), // Legacy JSON field - kept for backward compatibility
  isFeatured: boolean("is_featured").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Property Assumptions - Core deal assumptions and market data
export const propertyAssumptions = pgTable("property_assumptions", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  unitCount: integer("unit_count").default(1),
  purchasePrice: decimal("purchase_price", { precision: 15, scale: 2 }).default("0"),
  loanPercentage: decimal("loan_percentage", { precision: 5, scale: 4 }).default("0.8"),
  interestRate: decimal("interest_rate", { precision: 5, scale: 4 }).default("0.07"),
  loanTermYears: integer("loan_term_years").default(30),
  vacancyRate: decimal("vacancy_rate", { precision: 5, scale: 4 }).default("0.05"),
  expenseRatio: decimal("expense_ratio", { precision: 5, scale: 4 }).default("0.45"),
  marketCapRate: decimal("market_cap_rate", { precision: 5, scale: 4 }).default("0.055"),
  refinanceLTV: decimal("refinance_ltv", { precision: 5, scale: 4 }).default("0.75"),
  refinanceInterestRate: decimal("refinance_interest_rate", { precision: 5, scale: 4 }).default("0.065"),
  refinanceClosingCostPercent: decimal("refinance_closing_cost_percent", { precision: 5, scale: 4 }).default("0.02"),
  dscrThreshold: decimal("dscr_threshold", { precision: 5, scale: 2 }).default("1.25"),
  
  // Enhanced market assumptions for better KPI calculations
  annualRentGrowth: decimal("annual_rent_growth", { precision: 5, scale: 4 }).default("0.03"),
  annualExpenseInflation: decimal("annual_expense_inflation", { precision: 5, scale: 4 }).default("0.025"),
  propertyAppreciationRate: decimal("property_appreciation_rate", { precision: 5, scale: 4 }).default("0.03"),
  exitCapRate: decimal("exit_cap_rate", { precision: 5, scale: 4 }),
  
  // Investment horizon and strategy
  holdPeriodYears: decimal("hold_period_years", { precision: 5, scale: 1 }).default("5.0"),
  businessPlan: text("business_plan", { enum: ["buy_and_hold", "value_add", "opportunistic", "ground_up"] }).default("value_add"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Property Unit Types - Defines different unit configurations
export const propertyUnitTypes = pgTable("property_unit_types", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  unitTypeId: text("unit_type_id").notNull(), // Internal reference ID for the property
  name: text("name").notNull(),
  bedrooms: integer("bedrooms").default(1),
  bathrooms: decimal("bathrooms", { precision: 3, scale: 1 }).default("1.0"),
  squareFeet: integer("square_feet"),
  marketRent: decimal("market_rent", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Property Rent Roll - Individual unit rental data
export const propertyRentRoll = pgTable("property_rent_roll", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  unitTypeId: text("unit_type_id").notNull(),
  unitNumber: text("unit_number").notNull(),
  currentRent: decimal("current_rent", { precision: 10, scale: 2 }).default("0"),
  proFormaRent: decimal("pro_forma_rent", { precision: 10, scale: 2 }).default("0"),
  isVacant: boolean("is_vacant").default(false),
  leaseStart: date("lease_start"),
  leaseEnd: date("lease_end"),
  leaseEndDate: date("lease_end_date"), // Keep for backward compatibility
  tenantName: text("tenant_name"),
  tenantDetailsId: integer("tenant_details_id").references(() => tenantDetails.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tenant Details - Full lease information
export const tenantDetails = pgTable("tenant_details", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  unitNumber: text("unit_number").notNull(),
  
  // Tenant Information
  tenantName: text("tenant_name").notNull(),
  tenantAddress: text("tenant_address"),
  tenantPhone: text("tenant_phone"),
  tenantEmail: text("tenant_email"),
  
  // Lease Details
  leaseStartDate: date("lease_start_date"),
  leaseEndDate: date("lease_end_date"),
  monthlyRent: decimal("monthly_rent", { precision: 10, scale: 2 }),
  securityDeposit: decimal("security_deposit", { precision: 10, scale: 2 }),
  totalMoveInCost: decimal("total_move_in_cost", { precision: 10, scale: 2 }),
  rentDueDate: text("rent_due_date"),
  lateFee: decimal("late_fee", { precision: 10, scale: 2 }),
  
  // Property Rules
  utilitiesResponsibility: text("utilities_responsibility"),
  petPolicy: text("pet_policy"),
  smokingPolicy: text("smoking_policy"),
  guestPolicy: text("guest_policy"),
  alterationPolicy: text("alteration_policy"),
  
  // Moving & Maintenance
  movingOutNotice: text("moving_out_notice"),
  lockOutCharge: decimal("lock_out_charge", { precision: 10, scale: 2 }),
  maintenancePolicy: text("maintenance_policy"),
  
  // Payment Methods
  paymentMethods: jsonb("payment_methods"),
  automaticPaymentAuth: boolean("automatic_payment_auth").default(false),
  
  // Legal
  governingLaw: text("governing_law"),
  
  // Full lease document data (JSON)
  fullLeaseData: jsonb("full_lease_data"),
  
  // Document reference
  sourceDocumentId: integer("source_document_id").references(() => documentProcessingHistory.id, { onDelete: "set null" }),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Property Expenses - Operating expense breakdown
export const propertyExpenses = pgTable("property_expenses", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  expenseType: text("expense_type").notNull(), // taxes, insurance, utilities, etc.
  expenseName: text("expense_name").notNull(),
  annualAmount: decimal("annual_amount", { precision: 12, scale: 2 }).default("0"),
  isPercentage: boolean("is_percentage").default(false),
  percentageBase: text("percentage_base"), // gross_income, noi, etc.
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Property Rehab Budget - Detailed rehab line items
export const propertyRehabBudget = pgTable("property_rehab_budget", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  section: text("section").notNull(), // exterior, kitchens, bathrooms, generalInterior, finishings
  category: text("category").notNull(),
  perUnitCost: decimal("per_unit_cost", { precision: 12, scale: 2 }).default("0"),
  quantity: integer("quantity").default(1),
  totalCost: decimal("total_cost", { precision: 12, scale: 2 }).default("0"),
  spentAmount: decimal("spent_amount", { precision: 12, scale: 2 }).default("0"),
  completionStatus: text("completion_status", { enum: ["Not Started", "In Progress", "Completed"] }).default("Not Started"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Property Closing Costs - Acquisition closing cost breakdown
export const propertyClosingCosts = pgTable("property_closing_costs", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  costType: text("cost_type").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).default("0"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Property Holding Costs - Costs during rehab/holding period
export const propertyHoldingCosts = pgTable("property_holding_costs", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  costType: text("cost_type").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).default("0"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Property Exit Analysis - Hold vs sell scenarios
export const propertyExitAnalysis = pgTable("property_exit_analysis", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  holdPeriodYears: decimal("hold_period_years", { precision: 5, scale: 1 }).default("3.0"),
  saleFactor: decimal("sale_factor", { precision: 5, scale: 2 }).default("1.0"),
  saleCostsPercent: decimal("sale_costs_percent", { precision: 5, scale: 4 }).default("0.06"),
  annualRentGrowth: decimal("annual_rent_growth", { precision: 5, scale: 4 }).default("0.03"),
  annualExpenseGrowth: decimal("annual_expense_growth", { precision: 5, scale: 4 }).default("0.03"),
  exitCapRate: decimal("exit_cap_rate", { precision: 5, scale: 4 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Property Income Sources - Other income beyond rent
export const propertyIncomeOther = pgTable("property_income_other", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  incomeType: text("income_type").notNull(),
  incomeName: text("income_name").notNull(),
  annualAmount: decimal("annual_amount", { precision: 12, scale: 2 }).default("0"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Property Loans - Multi-loan tracking with loan-specific terms and live data integration
export const propertyLoans = pgTable("property_loans", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  loanName: text("loan_name").notNull(),
  loanType: text("loan_type", { enum: ["acquisition", "refinance", "construction", "bridge", "mezzanine"] }).notNull(),
  originalAmount: decimal("original_amount", { precision: 15, scale: 2 }).notNull(),
  currentBalance: decimal("current_balance", { precision: 15, scale: 2 }).notNull(),
  interestRate: decimal("interest_rate", { precision: 5, scale: 4 }).notNull(),
  termYears: integer("term_years").notNull(),
  monthlyPayment: decimal("monthly_payment", { precision: 12, scale: 2 }).notNull(),
  paymentType: text("payment_type", { enum: ["principal_and_interest", "interest_only"] }).default("principal_and_interest"),
  maturityDate: date("maturity_date").notNull(),
  isActive: boolean("is_active").default(true), // Active loan for debt service calculations
  lender: text("lender"),
  notes: text("notes"),
  
  // Live data integration fields
  externalLoanId: text("external_loan_id"), // Lender's loan ID
  principalBalance: decimal("principal_balance", { precision: 15, scale: 2 }),
  nextPaymentDate: date("next_payment_date"),
  nextPaymentAmount: decimal("next_payment_amount", { precision: 12, scale: 2 }),
  lastPaymentDate: date("last_payment_date"),
  lastPaymentAmount: decimal("last_payment_amount", { precision: 12, scale: 2 }),
  escrowBalance: decimal("escrow_balance", { precision: 12, scale: 2 }),
  remainingTerm: integer("remaining_term"), // Remaining months
  lastSyncDate: timestamp("last_sync_date"), // When data was last synced from lender
  syncStatus: text("sync_status", { enum: ["pending", "syncing", "success", "failed"] }).default("pending"),
  syncError: text("sync_error"), // Error message if sync fails
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Property Cash Flow History - Monthly cash flow tracking
export const propertyCashFlow = pgTable("property_cash_flow", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  cashFlowDate: date("cash_flow_date").notNull(),
  grossRentalIncome: decimal("gross_rental_income", { precision: 12, scale: 2 }).default("0"),
  vacancyLoss: decimal("vacancy_loss", { precision: 12, scale: 2 }).default("0"),
  otherIncome: decimal("other_income", { precision: 12, scale: 2 }).default("0"),
  effectiveGrossIncome: decimal("effective_gross_income", { precision: 12, scale: 2 }).default("0"),
  totalOperatingExpenses: decimal("total_operating_expenses", { precision: 12, scale: 2 }).default("0"),
  netOperatingIncome: decimal("net_operating_income", { precision: 12, scale: 2 }).default("0"),
  debtService: decimal("debt_service", { precision: 12, scale: 2 }).default("0"),
  beforeTaxCashFlow: decimal("before_tax_cash_flow", { precision: 12, scale: 2 }).default("0"),
  capitalExpenditures: decimal("capital_expenditures", { precision: 12, scale: 2 }).default("0"),
  netCashFlow: decimal("net_cash_flow", { precision: 12, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Property Performance Metrics - Calculated KPIs stored for historical tracking
export const propertyPerformanceMetrics = pgTable("property_performance_metrics", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  calculationDate: date("calculation_date").notNull(),
  
  // Core financial metrics
  grossRentalIncome: decimal("gross_rental_income", { precision: 15, scale: 2 }).default("0"),
  netOperatingIncome: decimal("net_operating_income", { precision: 15, scale: 2 }).default("0"),
  annualCashFlow: decimal("annual_cash_flow", { precision: 15, scale: 2 }).default("0"),
  
  // Investment ratios
  capRate: decimal("cap_rate", { precision: 5, scale: 4 }).default("0"),
  cashOnCashReturn: decimal("cash_on_cash_return", { precision: 5, scale: 4 }).default("0"),
  dscr: decimal("dscr", { precision: 5, scale: 2 }).default("0"),
  equityMultiple: decimal("equity_multiple", { precision: 5, scale: 2 }).default("0"),
  irr: decimal("irr", { precision: 5, scale: 4 }).default("0"),
  
  // Property valuation
  currentArv: decimal("current_arv", { precision: 15, scale: 2 }).default("0"),
  totalInvestedCapital: decimal("total_invested_capital", { precision: 15, scale: 2 }).default("0"),
  currentEquityValue: decimal("current_equity_value", { precision: 15, scale: 2 }).default("0"),
  
  // Risk metrics
  breakEvenOccupancy: decimal("break_even_occupancy", { precision: 5, scale: 4 }).default("0"),
  operatingExpenseRatio: decimal("operating_expense_ratio", { precision: 5, scale: 4 }).default("0"),
  
  // Debt metrics
  loanToValue: decimal("loan_to_value", { precision: 5, scale: 4 }).default("0"),
  debtYield: decimal("debt_yield", { precision: 5, scale: 4 }).default("0"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Property Workflow Steps - Project management integration
export const propertyWorkflowSteps = pgTable("property_workflow_steps", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  stepName: text("step_name").notNull(),
  stepCategory: text("step_category"), // Links to rehab budget section
  status: text("status", { enum: ["pending", "in_progress", "completed", "on_hold"] }).default("pending"),
  startDate: date("start_date"),
  completedDate: date("completed_date"),
  budgetItemId: integer("budget_item_id").references(() => propertyRehabBudget.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Investor leads for CRM
export const investorLeads = pgTable("investor_leads", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  phone: text("phone"),
  investmentAmount: decimal("investment_amount", { precision: 15, scale: 2 }),
  accreditedStatus: boolean("accredited_status").default(false),
  source: text("source").default("website"),
  status: text("status", { enum: ["new", "contacted", "qualified", "converted", "inactive"] }).default("new"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Deal analysis tables for comprehensive property underwriting
export const deals = pgTable("deals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code"),
  units: integer("units").notNull(),
  status: text("status", { enum: ["underwriting", "active", "closed", "archived"] }).default("underwriting"),
  
  // Acquisition details
  purchasePrice: decimal("purchase_price", { precision: 15, scale: 2 }).notNull(),
  loanPercentage: decimal("loan_percentage", { precision: 5, scale: 4 }).default("0.80"),
  marketCapRate: decimal("market_cap_rate", { precision: 5, scale: 4 }).notNull(),
  exitCapRate: decimal("exit_cap_rate", { precision: 5, scale: 4 }),
  
  // Operating assumptions
  vacancyRate: decimal("vacancy_rate", { precision: 5, scale: 4 }).default("0.05"),
  badDebtRate: decimal("bad_debt_rate", { precision: 5, scale: 4 }).default("0.02"),
  annualRentGrowth: decimal("annual_rent_growth", { precision: 5, scale: 4 }).default("0.03"),
  annualExpenseInflation: decimal("annual_expense_inflation", { precision: 5, scale: 4 }).default("0.03"),
  
  // Reserves
  capexReservePerUnit: decimal("capex_reserve_per_unit", { precision: 10, scale: 2 }).default("500"),
  operatingReserveMonths: integer("operating_reserve_months").default(6),
  
  // Timeline
  startToStabilizationMonths: integer("start_to_stabilization_months").default(12),
  projectedRefiMonth: integer("projected_refi_month").default(24),
  
  // Refinance settings
  refinanceLTV: decimal("refinance_ltv", { precision: 5, scale: 4 }).default("0.75"),
  
  // Team
  assignedPM: text("assigned_pm"),
  assignedGC: text("assigned_gc"),
  underwritingOwner: text("underwriting_owner"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const dealRehab = pgTable("deal_rehab", {
  id: serial("id").primaryKey(),
  dealId: integer("deal_id").notNull().references(() => deals.id, { onDelete: "cascade" }),
  category: text("category").notNull(), // "flooring", "kitchen", "bath", etc.
  description: text("description").notNull(),
  costPerUnit: decimal("cost_per_unit", { precision: 10, scale: 2 }),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }).notNull(),
  bidStatus: text("bid_status", { enum: ["estimated", "bid_received", "contracted"] }).default("estimated"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const dealUnits = pgTable("deal_units", {
  id: serial("id").primaryKey(),
  dealId: integer("deal_id").notNull().references(() => deals.id, { onDelete: "cascade" }),
  unitNumber: text("unit_number").notNull(),
  bedrooms: integer("bedrooms").notNull(),
  bathrooms: decimal("bathrooms", { precision: 3, scale: 1 }).notNull(),
  sqft: integer("sqft"),
  currentRent: decimal("current_rent", { precision: 10, scale: 2 }).default("0"),
  marketRent: decimal("market_rent", { precision: 10, scale: 2 }).notNull(),
  isOccupied: boolean("is_occupied").default(false),
  leaseExpiry: date("lease_expiry"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const dealExpenses = pgTable("deal_expenses", {
  id: serial("id").primaryKey(),
  dealId: integer("deal_id").notNull().references(() => deals.id, { onDelete: "cascade" }),
  category: text("category").notNull(), // "management", "maintenance", "insurance", etc.
  description: text("description").notNull(),
  monthlyAmount: decimal("monthly_amount", { precision: 10, scale: 2 }).notNull(),
  isPercentOfRent: boolean("is_percent_of_rent").default(false),
  percentage: decimal("percentage", { precision: 5, scale: 4 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const dealClosingCosts = pgTable("deal_closing_costs", {
  id: serial("id").primaryKey(),
  dealId: integer("deal_id").notNull().references(() => deals.id, { onDelete: "cascade" }),
  category: text("category").notNull(), // "title", "inspection", "legal", etc.
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const dealHoldingCosts = pgTable("deal_holding_costs", {
  id: serial("id").primaryKey(),
  dealId: integer("deal_id").notNull().references(() => deals.id, { onDelete: "cascade" }),
  category: text("category").notNull(), // "insurance", "utilities", "security", etc.
  description: text("description").notNull(),
  monthlyAmount: decimal("monthly_amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const dealLoans = pgTable("deal_loans", {
  id: serial("id").primaryKey(),
  dealId: integer("deal_id").notNull().references(() => deals.id, { onDelete: "cascade" }),
  loanType: text("loan_type", { enum: ["acquisition", "refinance", "construction"] }).notNull(),
  loanAmount: decimal("loan_amount", { precision: 15, scale: 2 }).notNull(),
  interestRate: decimal("interest_rate", { precision: 5, scale: 4 }).notNull(),
  termYears: integer("term_years").notNull(),
  amortizationYears: integer("amortization_years").notNull(),
  ioMonths: integer("io_months").default(0),
  ltcPercent: decimal("ltc_percent", { precision: 5, scale: 4 }),
  ltvPercent: decimal("ltv_percent", { precision: 5, scale: 4 }),
  points: decimal("points", { precision: 5, scale: 4 }).default("0"),
  lenderFees: decimal("lender_fees", { precision: 10, scale: 2 }).default("0"),
  appraisalCost: decimal("appraisal_cost", { precision: 10, scale: 2 }).default("0"),
  legalCost: decimal("legal_cost", { precision: 10, scale: 2 }).default("0"),
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const dealOtherIncome = pgTable("deal_other_income", {
  id: serial("id").primaryKey(),
  dealId: integer("deal_id").notNull().references(() => deals.id, { onDelete: "cascade" }),
  category: text("category").notNull(), // "laundry", "parking", "rubs", etc.
  description: text("description").notNull(),
  monthlyAmount: decimal("monthly_amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const dealComps = pgTable("deal_comps", {
  id: serial("id").primaryKey(),
  dealId: integer("deal_id").notNull().references(() => deals.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["sale", "rent"] }).notNull(),
  address: text("address").notNull(),
  units: integer("units"),
  pricePerUnit: decimal("price_per_unit", { precision: 10, scale: 2 }),
  capRate: decimal("cap_rate", { precision: 5, scale: 4 }),
  rentPerSqft: decimal("rent_per_sqft", { precision: 10, scale: 2 }),
  distance: decimal("distance", { precision: 5, scale: 2 }), // miles
  adjustments: text("adjustments"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Entity memberships table for user access control
export const entityMemberships = pgTable("entity_memberships", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  entityName: text("entity_name").notNull(),
  equityPercentage: decimal("equity_percentage", { precision: 5, scale: 2 }).default("0.00"),
  role: text("role", { enum: ["owner", "manager", "member"] }).default("member"),
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Entity compliance table
export const entityCompliance = pgTable("entity_compliance", {
  id: serial("id").primaryKey(),
  entityName: text("entity_name").notNull(),
  complianceType: text("compliance_type").notNull(), // tax_filing, annual_report, operating_agreement, etc.
  status: text("status", { enum: ["pending", "completed", "overdue", "not_required"] }).default("pending"),
  dueDate: timestamp("due_date"),
  completedDate: timestamp("completed_date"),
  description: text("description"),
  filingEntity: text("filing_entity"), // Who is responsible for filing
  priority: text("priority", { enum: ["low", "medium", "high", "critical"] }).default("medium"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Entity ownership table for user-defined entities and asset allocation
export const entityOwnership = pgTable("entity_ownership", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  entityName: text("entity_name").notNull(),
  assetType: text("asset_type", { enum: ["real_estate", "cash", "stocks", "bonds", "business", "other"] }).notNull(),
  ownershipPercentage: decimal("ownership_percentage", { precision: 5, scale: 2 }).notNull(),
  currentValue: decimal("current_value", { precision: 15, scale: 2 }).default("0"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  passwordHash: true,
  role: true,
  firstName: true,
  lastName: true,
});

export const insertPropertySchema = createInsertSchema(properties).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  dealAnalyzerData: z.union([z.string(), z.object({}).passthrough()]).optional()
});

export const insertCompanyMetricSchema = createInsertSchema(companyMetrics).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInvestorLeadSchema = createInsertSchema(investorLeads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDealSchema = createInsertSchema(deals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDealRehabSchema = createInsertSchema(dealRehab).omit({
  id: true,
  createdAt: true,
});

export const insertDealUnitsSchema = createInsertSchema(dealUnits).omit({
  id: true,
  createdAt: true,
});

export const insertDealExpensesSchema = createInsertSchema(dealExpenses).omit({
  id: true,
  createdAt: true,
});

export const insertDealClosingCostsSchema = createInsertSchema(dealClosingCosts).omit({
  id: true,
  createdAt: true,
});

export const insertDealHoldingCostsSchema = createInsertSchema(dealHoldingCosts).omit({
  id: true,
  createdAt: true,
});

export const insertDealLoansSchema = createInsertSchema(dealLoans).omit({
  id: true,
  createdAt: true,
});

export const insertDealOtherIncomeSchema = createInsertSchema(dealOtherIncome).omit({
  id: true,
  createdAt: true,
});

export const insertDealCompsSchema = createInsertSchema(dealComps).omit({
  id: true,
  createdAt: true,
});

export const insertEntityMembershipSchema = createInsertSchema(entityMemberships).omit({
  id: true,
  joinedAt: true,
});

export const insertEntityComplianceSchema = createInsertSchema(entityCompliance).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEntityOwnershipSchema = createInsertSchema(entityOwnership).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Property Deal Analyzer normalized table insert schemas
export const insertPropertyAssumptionsSchema = createInsertSchema(propertyAssumptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPropertyUnitTypesSchema = createInsertSchema(propertyUnitTypes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPropertyRentRollSchema = createInsertSchema(propertyRentRoll).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTenantDetailsSchema = createInsertSchema(tenantDetails).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPropertyExpensesSchema = createInsertSchema(propertyExpenses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPropertyRehabBudgetSchema = createInsertSchema(propertyRehabBudget).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPropertyClosingCostsSchema = createInsertSchema(propertyClosingCosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPropertyHoldingCostsSchema = createInsertSchema(propertyHoldingCosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPropertyExitAnalysisSchema = createInsertSchema(propertyExitAnalysis).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPropertyIncomeOtherSchema = createInsertSchema(propertyIncomeOther).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Property = typeof properties.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type CompanyMetric = typeof companyMetrics.$inferSelect;
export type InsertCompanyMetric = z.infer<typeof insertCompanyMetricSchema>;
export type InvestorLead = typeof investorLeads.$inferSelect;
export type InsertInvestorLead = z.infer<typeof insertInvestorLeadSchema>;
export type EntityMembership = typeof entityMemberships.$inferSelect;
export type InsertEntityMembership = z.infer<typeof insertEntityMembershipSchema>;
export type EntityCompliance = typeof entityCompliance.$inferSelect;
export type InsertEntityCompliance = z.infer<typeof insertEntityComplianceSchema>;
export type EntityOwnership = typeof entityOwnership.$inferSelect;
export type InsertEntityOwnership = z.infer<typeof insertEntityOwnershipSchema>;

// Property Deal Analyzer normalized table types
export type PropertyAssumptions = typeof propertyAssumptions.$inferSelect;
export type InsertPropertyAssumptions = z.infer<typeof insertPropertyAssumptionsSchema>;
export type PropertyUnitTypes = typeof propertyUnitTypes.$inferSelect;
export type InsertPropertyUnitTypes = z.infer<typeof insertPropertyUnitTypesSchema>;
export type PropertyRentRoll = typeof propertyRentRoll.$inferSelect;
export type InsertPropertyRentRoll = z.infer<typeof insertPropertyRentRollSchema>;
export type TenantDetails = typeof tenantDetails.$inferSelect;
export type InsertTenantDetails = z.infer<typeof insertTenantDetailsSchema>;
export type PropertyExpenses = typeof propertyExpenses.$inferSelect;
export type InsertPropertyExpenses = z.infer<typeof insertPropertyExpensesSchema>;
export type PropertyRehabBudget = typeof propertyRehabBudget.$inferSelect;
export type InsertPropertyRehabBudget = z.infer<typeof insertPropertyRehabBudgetSchema>;
export type PropertyClosingCosts = typeof propertyClosingCosts.$inferSelect;
export type InsertPropertyClosingCosts = z.infer<typeof insertPropertyClosingCostsSchema>;
export type PropertyHoldingCosts = typeof propertyHoldingCosts.$inferSelect;
export type InsertPropertyHoldingCosts = z.infer<typeof insertPropertyHoldingCostsSchema>;
export type PropertyExitAnalysis = typeof propertyExitAnalysis.$inferSelect;
export type InsertPropertyExitAnalysis = z.infer<typeof insertPropertyExitAnalysisSchema>;
export type PropertyIncomeOther = typeof propertyIncomeOther.$inferSelect;
export type InsertPropertyIncomeOther = z.infer<typeof insertPropertyIncomeOtherSchema>;

// Deal analysis types
export type Deal = typeof deals.$inferSelect;
export type InsertDeal = z.infer<typeof insertDealSchema>;
export type DealRehab = typeof dealRehab.$inferSelect;
export type InsertDealRehab = z.infer<typeof insertDealRehabSchema>;
export type DealUnits = typeof dealUnits.$inferSelect;
export type InsertDealUnits = z.infer<typeof insertDealUnitsSchema>;
export type DealExpenses = typeof dealExpenses.$inferSelect;
export type InsertDealExpenses = z.infer<typeof insertDealExpensesSchema>;
export type DealClosingCosts = typeof dealClosingCosts.$inferSelect;
export type InsertDealClosingCosts = z.infer<typeof insertDealClosingCostsSchema>;
export type DealHoldingCosts = typeof dealHoldingCosts.$inferSelect;
export type InsertDealHoldingCosts = z.infer<typeof insertDealHoldingCostsSchema>;
export type DealLoans = typeof dealLoans.$inferSelect;
export type InsertDealLoans = z.infer<typeof insertDealLoansSchema>;
export type DealOtherIncome = typeof dealOtherIncome.$inferSelect;
export type InsertDealOtherIncome = z.infer<typeof insertDealOtherIncomeSchema>;
export type DealComps = typeof dealComps.$inferSelect;
export type InsertDealComps = z.infer<typeof insertDealCompsSchema>;

// Document Processing History - AI-powered document processing
export const documentProcessingHistory = pgTable('document_processing_history', {
  id: serial('id').primaryKey(),
  fileName: text('file_name').notNull(),
  filePath: text('file_path'),
  documentType: text('document_type'),
  extractedData: text('extracted_data'),
  confidence: decimal('confidence', { precision: 3, scale: 2 }),
  success: boolean('success').default(false),
  errors: text('errors').array(),
  warnings: text('warnings').array(),
  suggestedActions: text('suggested_actions').array(),
  propertyId: integer('property_id').references(() => properties.id),
  entityId: integer('entity_id'),
  userId: integer('user_id').references(() => users.id),
  processedAt: timestamp('processed_at').defaultNow(),
  appliedAt: timestamp('applied_at'),
  appliedBy: integer('applied_by').references(() => users.id)
});

// Bank Accounts and Transactions
export const bankAccountsTable = pgTable('bank_accounts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  entityId: integer('entity_id'),
  accessToken: text('access_token').notNull(),
  itemId: text('item_id').notNull(),
  accountId: text('account_id').notNull(),
  accountName: text('account_name').notNull(),
  accountType: text('account_type').notNull(),
  accountSubtype: text('account_subtype'),
  institutionName: text('institution_name').notNull(),
  institutionId: text('institution_id').notNull(),
  mask: text('mask'),
  currentBalance: decimal('current_balance', { precision: 15, scale: 2 }),
  availableBalance: decimal('available_balance', { precision: 15, scale: 2 }),
  isActive: boolean('is_active').default(true),
  lastUpdated: timestamp('last_updated').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const transactionsTable = pgTable('transactions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  bankAccountId: integer('bank_account_id').notNull(),
  entityId: integer('entity_id'),
  propertyId: integer('property_id'),
  plaidTransactionId: text('plaid_transaction_id').notNull().unique(),
  accountId: text('account_id').notNull(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  date: text('date').notNull(),
  name: text('name').notNull(),
  merchantName: text('merchant_name'),
  category: text('category').array(),
  subcategory: text('subcategory'),
  transactionType: text('transaction_type'),
  pending: boolean('pending').default(false),
  accountOwner: text('account_owner'),
  location: text('location'),
  paymentMeta: text('payment_meta'),
  isPropertyRelated: boolean('is_property_related').default(false),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type BankAccount = typeof bankAccountsTable.$inferSelect;
export type Transaction = typeof transactionsTable.$inferSelect;
export type NewBankAccount = typeof bankAccountsTable.$inferInsert;
export type NewTransaction = typeof transactionsTable.$inferInsert;

// Document Processing types
export type DocumentProcessingHistory = typeof documentProcessingHistory.$inferSelect;
export type InsertDocumentProcessingHistory = typeof documentProcessingHistory.$inferInsert;
