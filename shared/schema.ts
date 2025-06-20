import { pgTable, text, serial, integer, boolean, decimal, timestamp, date } from "drizzle-orm/pg-core";
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
  status: text("status").notNull(), // "Sold" or "Currently Own"
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
