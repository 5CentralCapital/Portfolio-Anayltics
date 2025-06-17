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

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Property = typeof properties.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type CompanyMetric = typeof companyMetrics.$inferSelect;
export type InsertCompanyMetric = z.infer<typeof insertCompanyMetricSchema>;
export type InvestorLead = typeof investorLeads.$inferSelect;
export type InsertInvestorLead = z.infer<typeof insertInvestorLeadSchema>;
