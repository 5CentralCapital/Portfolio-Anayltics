import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  integer,
  decimal,
  boolean,
  serial
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (keep existing)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (keep existing)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Entity system (keep existing)
export const entities = pgTable("entities", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const entityMemberships = pgTable("entity_memberships", {
  id: serial("id").primaryKey(),
  entityId: integer("entity_id").references(() => entities.id),
  userId: varchar("user_id").references(() => users.id),
  role: varchar("role", { length: 50 }).notNull(),
  equityPercentage: decimal("equity_percentage", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const complianceRequirements = pgTable("compliance_requirements", {
  id: serial("id").primaryKey(),
  entityId: integer("entity_id").references(() => entities.id),
  requirement: varchar("requirement", { length: 200 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default('pending'),
  dueDate: timestamp("due_date"),
  priority: varchar("priority", { length: 20 }).notNull().default('medium'),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// NEW PROPERTY DATABASE STRUCTURE

// Main properties table
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  entityId: integer("entity_id").references(() => entities.id),
  name: varchar("name", { length: 200 }).notNull(),
  address: varchar("address", { length: 300 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 50 }).notNull(),
  zipCode: varchar("zip_code", { length: 10 }),
  status: varchar("status", { length: 50 }).notNull().default('Under Contract'),
  
  // Financial data
  purchasePrice: decimal("purchase_price", { precision: 12, scale: 2 }),
  unitCount: integer("unit_count").notNull(),
  arv: decimal("arv", { precision: 12, scale: 2 }),
  rehabBudget: decimal("rehab_budget", { precision: 12, scale: 2 }),
  initialCapital: decimal("initial_capital", { precision: 12, scale: 2 }),
  cashOnCashReturn: decimal("cash_on_cash_return", { precision: 5, scale: 2 }),
  monthlyCashFlow: decimal("monthly_cash_flow", { precision: 10, scale: 2 }),
  annualCashFlow: decimal("annual_cash_flow", { precision: 10, scale: 2 }),
  
  // Sale data (for sold properties)
  salePrice: decimal("sale_price", { precision: 12, scale: 2 }),
  saleDate: timestamp("sale_date"),
  totalProfit: decimal("total_profit", { precision: 12, scale: 2 }),
  equityMultiple: decimal("equity_multiple", { precision: 5, scale: 2 }),
  
  // Metadata
  acquisitionDate: timestamp("acquisition_date"),
  broker: varchar("broker", { length: 200 }),
  legalNotes: text("legal_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Property assumptions
export const propertyAssumptions = pgTable("property_assumptions", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").references(() => properties.id).notNull(),
  loanPercentage: decimal("loan_percentage", { precision: 3, scale: 2 }),
  interestRate: decimal("interest_rate", { precision: 4, scale: 3 }),
  termYears: integer("term_years"),
  vacancyRate: decimal("vacancy_rate", { precision: 3, scale: 2 }),
  expenseRatio: decimal("expense_ratio", { precision: 3, scale: 2 }),
  marketCapRate: decimal("market_cap_rate", { precision: 4, scale: 3 }),
  refinanceLTV: decimal("refinance_ltv", { precision: 3, scale: 2 }),
  refinanceInterestRate: decimal("refinance_interest_rate", { precision: 4, scale: 3 }),
  refinanceClosingCostPercent: decimal("refinance_closing_cost_percent", { precision: 3, scale: 2 }),
  dscrThreshold: decimal("dscr_threshold", { precision: 3, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Unit types
export const unitTypes = pgTable("unit_types", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").references(() => properties.id).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  marketRent: decimal("market_rent", { precision: 7, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Rent roll
export const rentRoll = pgTable("rent_roll", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").references(() => properties.id).notNull(),
  unitTypeId: integer("unit_type_id").references(() => unitTypes.id),
  unit: varchar("unit", { length: 20 }).notNull(),
  currentRent: decimal("current_rent", { precision: 7, scale: 2 }),
  proFormaRent: decimal("pro_forma_rent", { precision: 7, scale: 2 }),
  squareFootage: integer("square_footage"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Rehab sections
export const rehabSections = pgTable("rehab_sections", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").references(() => properties.id).notNull(),
  section: varchar("section", { length: 100 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  perUnitCost: decimal("per_unit_cost", { precision: 10, scale: 2 }),
  quantity: integer("quantity"),
  totalCost: decimal("total_cost", { precision: 12, scale: 2 }),
  spentAmount: decimal("spent_amount", { precision: 12, scale: 2 }).default('0'),
  completed: boolean("completed").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Closing costs
export const closingCosts = pgTable("closing_costs", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").references(() => properties.id).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }),
  percentage: decimal("percentage", { precision: 3, scale: 2 }),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Holding costs
export const holdingCosts = pgTable("holding_costs", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").references(() => properties.id).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  monthlyAmount: decimal("monthly_amount", { precision: 8, scale: 2 }),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Property expenses
export const propertyExpenses = pgTable("property_expenses", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").references(() => properties.id).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  annualAmount: decimal("annual_amount", { precision: 10, scale: 2 }),
  monthlyAmount: decimal("monthly_amount", { precision: 8, scale: 2 }),
  percentage: decimal("percentage", { precision: 3, scale: 2 }),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Property income
export const propertyIncome = pgTable("property_income", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").references(() => properties.id).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  annualAmount: decimal("annual_amount", { precision: 10, scale: 2 }),
  monthlyAmount: decimal("monthly_amount", { precision: 8, scale: 2 }),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Loans
export const loans = pgTable("loans", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").references(() => properties.id).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }),
  interestRate: decimal("interest_rate", { precision: 4, scale: 3 }),
  termYears: integer("term_years"),
  monthlyPayment: decimal("monthly_payment", { precision: 8, scale: 2 }),
  loanType: varchar("loan_type", { length: 50 }).notNull(),
  paymentType: varchar("payment_type", { length: 20 }).notNull().default('amortizing'),
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Exit analysis
export const exitAnalysis = pgTable("exit_analysis", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").references(() => properties.id).notNull(),
  salesCapRate: decimal("sales_cap_rate", { precision: 4, scale: 3 }),
  saleFactor: decimal("sale_factor", { precision: 3, scale: 1 }),
  saleCostsPercent: decimal("sale_costs_percent", { precision: 3, scale: 2 }),
  holdPeriodYears: integer("hold_period_years"),
  projectedSalePrice: decimal("projected_sale_price", { precision: 12, scale: 2 }),
  refinanceAmount: decimal("refinance_amount", { precision: 12, scale: 2 }),
  cashOutAmount: decimal("cash_out_amount", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 12-month proforma
export const monthlyProforma = pgTable("monthly_proforma", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").references(() => properties.id).notNull(),
  month: integer("month").notNull(), // 1-12
  grossRent: decimal("gross_rent", { precision: 8, scale: 2 }),
  vacancy: decimal("vacancy", { precision: 8, scale: 2 }),
  effectiveIncome: decimal("effective_income", { precision: 8, scale: 2 }),
  operatingExpenses: decimal("operating_expenses", { precision: 8, scale: 2 }),
  noi: decimal("noi", { precision: 8, scale: 2 }),
  debtService: decimal("debt_service", { precision: 8, scale: 2 }),
  cashFlow: decimal("cash_flow", { precision: 8, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// RELATIONS
export const propertiesRelations = relations(properties, ({ one, many }) => ({
  entity: one(entities, {
    fields: [properties.entityId],
    references: [entities.id],
  }),
  assumptions: one(propertyAssumptions, {
    fields: [properties.id],
    references: [propertyAssumptions.propertyId],
  }),
  unitTypes: many(unitTypes),
  rentRoll: many(rentRoll),
  rehabSections: many(rehabSections),
  closingCosts: many(closingCosts),
  holdingCosts: many(holdingCosts),
  expenses: many(propertyExpenses),
  income: many(propertyIncome),
  loans: many(loans),
  exitAnalysis: one(exitAnalysis, {
    fields: [properties.id],
    references: [exitAnalysis.propertyId],
  }),
  proforma: many(monthlyProforma),
}));

export const propertyAssumptionsRelations = relations(propertyAssumptions, ({ one }) => ({
  property: one(properties, {
    fields: [propertyAssumptions.propertyId],
    references: [properties.id],
  }),
}));

export const unitTypesRelations = relations(unitTypes, ({ one, many }) => ({
  property: one(properties, {
    fields: [unitTypes.propertyId],
    references: [properties.id],
  }),
  rentRollUnits: many(rentRoll),
}));

export const rentRollRelations = relations(rentRoll, ({ one }) => ({
  property: one(properties, {
    fields: [rentRoll.propertyId],
    references: [properties.id],
  }),
  unitType: one(unitTypes, {
    fields: [rentRoll.unitTypeId],
    references: [unitTypes.id],
  }),
}));

export const rehabSectionsRelations = relations(rehabSections, ({ one }) => ({
  property: one(properties, {
    fields: [rehabSections.propertyId],
    references: [properties.id],
  }),
}));

export const closingCostsRelations = relations(closingCosts, ({ one }) => ({
  property: one(properties, {
    fields: [closingCosts.propertyId],
    references: [properties.id],
  }),
}));

export const holdingCostsRelations = relations(holdingCosts, ({ one }) => ({
  property: one(properties, {
    fields: [holdingCosts.propertyId],
    references: [properties.id],
  }),
}));

export const propertyExpensesRelations = relations(propertyExpenses, ({ one }) => ({
  property: one(properties, {
    fields: [propertyExpenses.propertyId],
    references: [properties.id],
  }),
}));

export const propertyIncomeRelations = relations(propertyIncome, ({ one }) => ({
  property: one(properties, {
    fields: [propertyIncome.propertyId],
    references: [properties.id],
  }),
}));

export const loansRelations = relations(loans, ({ one }) => ({
  property: one(properties, {
    fields: [loans.propertyId],
    references: [properties.id],
  }),
}));

export const exitAnalysisRelations = relations(exitAnalysis, ({ one }) => ({
  property: one(properties, {
    fields: [exitAnalysis.propertyId],
    references: [properties.id],
  }),
}));

export const monthlyProformaRelations = relations(monthlyProforma, ({ one }) => ({
  property: one(properties, {
    fields: [monthlyProforma.propertyId],
    references: [properties.id],
  }),
}));

// Export types
export type Property = typeof properties.$inferSelect;
export type InsertProperty = typeof properties.$inferInsert;
export type PropertyAssumptions = typeof propertyAssumptions.$inferSelect;
export type InsertPropertyAssumptions = typeof propertyAssumptions.$inferInsert;
export type UnitType = typeof unitTypes.$inferSelect;
export type InsertUnitType = typeof unitTypes.$inferInsert;
export type RentRoll = typeof rentRoll.$inferSelect;
export type InsertRentRoll = typeof rentRoll.$inferInsert;
export type RehabSection = typeof rehabSections.$inferSelect;
export type InsertRehabSection = typeof rehabSections.$inferInsert;
export type ClosingCost = typeof closingCosts.$inferSelect;
export type InsertClosingCost = typeof closingCosts.$inferInsert;
export type HoldingCost = typeof holdingCosts.$inferSelect;
export type InsertHoldingCost = typeof holdingCosts.$inferInsert;
export type PropertyExpense = typeof propertyExpenses.$inferSelect;
export type InsertPropertyExpense = typeof propertyExpenses.$inferInsert;
export type PropertyIncome = typeof propertyIncome.$inferSelect;
export type InsertPropertyIncome = typeof propertyIncome.$inferInsert;
export type Loan = typeof loans.$inferSelect;
export type InsertLoan = typeof loans.$inferInsert;
export type ExitAnalysis = typeof exitAnalysis.$inferSelect;
export type InsertExitAnalysis = typeof exitAnalysis.$inferInsert;
export type MonthlyProforma = typeof monthlyProforma.$inferSelect;
export type InsertMonthlyProforma = typeof monthlyProforma.$inferInsert;

// Zod schemas for validation
export const insertPropertySchema = createInsertSchema(properties);
export const selectPropertySchema = createSelectSchema(properties);
export const insertPropertyAssumptionsSchema = createInsertSchema(propertyAssumptions);
export const insertUnitTypeSchema = createInsertSchema(unitTypes);
export const insertRentRollSchema = createInsertSchema(rentRoll);
export const insertRehabSectionSchema = createInsertSchema(rehabSections);
export const insertClosingCostSchema = createInsertSchema(closingCosts);
export const insertHoldingCostSchema = createInsertSchema(holdingCosts);
export const insertPropertyExpenseSchema = createInsertSchema(propertyExpenses);
export const insertPropertyIncomeSchema = createInsertSchema(propertyIncome);
export const insertLoanSchema = createInsertSchema(loans);
export const insertExitAnalysisSchema = createInsertSchema(exitAnalysis);
export const insertMonthlyProformaSchema = createInsertSchema(monthlyProforma);

// Entity-related exports (keep existing)
export type Entity = typeof entities.$inferSelect;
export type InsertEntity = typeof entities.$inferInsert;
export type EntityMembership = typeof entityMemberships.$inferSelect;
export type InsertEntityMembership = typeof entityMemberships.$inferInsert;
export type ComplianceRequirement = typeof complianceRequirements.$inferSelect;
export type InsertComplianceRequirement = typeof complianceRequirements.$inferInsert;

export const insertEntitySchema = createInsertSchema(entities);
export const insertEntityMembershipSchema = createInsertSchema(entityMemberships);
export const insertComplianceRequirementSchema = createInsertSchema(complianceRequirements);