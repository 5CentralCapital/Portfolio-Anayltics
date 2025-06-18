import { db } from "./db";
import { 
  users, properties, companyMetrics, investorLeads, sessions,
  deals, dealRehab, dealUnits, dealExpenses, dealClosingCosts, 
  dealHoldingCosts, dealLoans, dealOtherIncome, dealComps, savedDeals
} from "@shared/schema";
import type { 
  User, 
  InsertUser, 
  Property, 
  InsertProperty, 
  CompanyMetric, 
  InsertCompanyMetric,
  InvestorLead,
  InsertInvestorLead,
  Deal,
  InsertDeal,
  DealRehab,
  InsertDealRehab,
  DealUnits,
  InsertDealUnits,
  DealExpenses,
  InsertDealExpenses,
  DealClosingCosts,
  InsertDealClosingCosts,
  DealHoldingCosts,
  InsertDealHoldingCosts,
  DealLoans,
  InsertDealLoans,
  DealOtherIncome,
  InsertDealOtherIncome,
  DealComps,
  InsertDealComps,
  SavedDeal,
  InsertSavedDeal
} from "@shared/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserLastLogin(id: number): Promise<void>;
  
  // Property operations
  getProperties(): Promise<Property[]>;
  getProperty(id: number): Promise<Property | undefined>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(id: number, property: Partial<InsertProperty>): Promise<Property | undefined>;
  deleteProperty(id: number): Promise<boolean>;
  
  // Company metrics operations
  getCompanyMetrics(startDate?: string, endDate?: string): Promise<CompanyMetric[]>;
  getLatestCompanyMetrics(): Promise<CompanyMetric | undefined>;
  createCompanyMetric(metric: InsertCompanyMetric): Promise<CompanyMetric>;
  
  // Investor leads operations
  getInvestorLeads(status?: string, limit?: number): Promise<InvestorLead[]>;
  createInvestorLead(lead: InsertInvestorLead): Promise<InvestorLead>;
  updateInvestorLead(id: number, lead: Partial<InsertInvestorLead>): Promise<InvestorLead | undefined>;
  
  // Authentication helpers
  validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean>;
  hashPassword(password: string): Promise<string>;
  
  // Deal analysis operations
  getDeals(): Promise<Deal[]>;
  getDeal(id: number): Promise<Deal | undefined>;
  createDeal(deal: InsertDeal): Promise<Deal>;
  updateDeal(id: number, deal: Partial<InsertDeal>): Promise<Deal | undefined>;
  deleteDeal(id: number): Promise<boolean>;
  
  // Deal rehab operations
  getDealRehab(dealId: number): Promise<DealRehab[]>;
  createDealRehab(rehab: InsertDealRehab): Promise<DealRehab>;
  updateDealRehab(id: number, rehab: Partial<InsertDealRehab>): Promise<DealRehab | undefined>;
  deleteDealRehab(id: number): Promise<boolean>;
  
  // Deal units operations
  getDealUnits(dealId: number): Promise<DealUnits[]>;
  createDealUnits(unit: InsertDealUnits): Promise<DealUnits>;
  updateDealUnits(id: number, unit: Partial<InsertDealUnits>): Promise<DealUnits | undefined>;
  deleteDealUnits(id: number): Promise<boolean>;
  
  // Deal expenses operations
  getDealExpenses(dealId: number): Promise<DealExpenses[]>;
  createDealExpenses(expense: InsertDealExpenses): Promise<DealExpenses>;
  updateDealExpenses(id: number, expense: Partial<InsertDealExpenses>): Promise<DealExpenses | undefined>;
  deleteDealExpenses(id: number): Promise<boolean>;
  
  // Deal closing costs operations
  getDealClosingCosts(dealId: number): Promise<DealClosingCosts[]>;
  createDealClosingCosts(cost: InsertDealClosingCosts): Promise<DealClosingCosts>;
  updateDealClosingCosts(id: number, cost: Partial<InsertDealClosingCosts>): Promise<DealClosingCosts | undefined>;
  deleteDealClosingCosts(id: number): Promise<boolean>;
  
  // Deal holding costs operations
  getDealHoldingCosts(dealId: number): Promise<DealHoldingCosts[]>;
  createDealHoldingCosts(cost: InsertDealHoldingCosts): Promise<DealHoldingCosts>;
  updateDealHoldingCosts(id: number, cost: Partial<InsertDealHoldingCosts>): Promise<DealHoldingCosts | undefined>;
  deleteDealHoldingCosts(id: number): Promise<boolean>;
  
  // Deal loans operations
  getDealLoans(dealId: number): Promise<DealLoans[]>;
  createDealLoans(loan: InsertDealLoans): Promise<DealLoans>;
  updateDealLoans(id: number, loan: Partial<InsertDealLoans>): Promise<DealLoans | undefined>;
  deleteDealLoans(id: number): Promise<boolean>;
  
  // Deal other income operations
  getDealOtherIncome(dealId: number): Promise<DealOtherIncome[]>;
  createDealOtherIncome(income: InsertDealOtherIncome): Promise<DealOtherIncome>;
  updateDealOtherIncome(id: number, income: Partial<InsertDealOtherIncome>): Promise<DealOtherIncome | undefined>;
  deleteDealOtherIncome(id: number): Promise<boolean>;
  
  // Deal comps operations
  getDealComps(dealId: number): Promise<DealComps[]>;
  createDealComps(comp: InsertDealComps): Promise<DealComps>;
  updateDealComps(id: number, comp: Partial<InsertDealComps>): Promise<DealComps | undefined>;
  deleteDealComps(id: number): Promise<boolean>;
  
  // Saved deals operations
  getSavedDeals(): Promise<SavedDeal[]>;
  getSavedDeal(id: number): Promise<SavedDeal | undefined>;
  createSavedDeal(savedDeal: InsertSavedDeal): Promise<SavedDeal>;
  updateSavedDeal(id: number, savedDeal: Partial<InsertSavedDeal>): Promise<SavedDeal | undefined>;
  deleteSavedDeal(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUserLastLogin(id: number): Promise<void> {
    await db.update(users)
      .set({ lastLogin: new Date(), updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  // Property operations
  async getProperties(): Promise<Property[]> {
    return await db.select().from(properties).orderBy(desc(properties.createdAt));
  }

  async getProperty(id: number): Promise<Property | undefined> {
    const result = await db.select().from(properties).where(eq(properties.id, id)).limit(1);
    return result[0];
  }

  async createProperty(property: InsertProperty): Promise<Property> {
    const result = await db.insert(properties).values(property).returning();
    return result[0];
  }

  async updateProperty(id: number, property: Partial<InsertProperty>): Promise<Property | undefined> {
    const result = await db.update(properties)
      .set({ ...property, updatedAt: new Date() })
      .where(eq(properties.id, id))
      .returning();
    return result[0];
  }

  async deleteProperty(id: number): Promise<boolean> {
    const result = await db.delete(properties).where(eq(properties.id, id)).returning();
    return result.length > 0;
  }

  // Company metrics operations
  async getCompanyMetrics(startDate?: string, endDate?: string): Promise<CompanyMetric[]> {
    if (startDate && endDate) {
      return await db.select().from(companyMetrics)
        .where(
          and(
            gte(companyMetrics.metricDate, startDate),
            lte(companyMetrics.metricDate, endDate)
          )
        )
        .orderBy(desc(companyMetrics.metricDate));
    }
    
    return await db.select().from(companyMetrics).orderBy(desc(companyMetrics.metricDate));
  }

  async getLatestCompanyMetrics(): Promise<CompanyMetric | undefined> {
    const result = await db.select()
      .from(companyMetrics)
      .orderBy(desc(companyMetrics.metricDate))
      .limit(1);
    return result[0];
  }

  async createCompanyMetric(metric: InsertCompanyMetric): Promise<CompanyMetric> {
    const result = await db.insert(companyMetrics).values(metric).returning();
    return result[0];
  }

  // Investor leads operations
  async getInvestorLeads(status?: string, limit: number = 50): Promise<InvestorLead[]> {
    if (status) {
      return await db.select().from(investorLeads)
        .where(eq(investorLeads.status, status as any))
        .orderBy(desc(investorLeads.createdAt))
        .limit(limit);
    }
    
    return await db.select().from(investorLeads)
      .orderBy(desc(investorLeads.createdAt))
      .limit(limit);
  }

  async createInvestorLead(lead: InsertInvestorLead): Promise<InvestorLead> {
    const result = await db.insert(investorLeads).values(lead).returning();
    return result[0];
  }

  async updateInvestorLead(id: number, lead: Partial<InsertInvestorLead>): Promise<InvestorLead | undefined> {
    const result = await db.update(investorLeads)
      .set({ ...lead, updatedAt: new Date() })
      .where(eq(investorLeads.id, id))
      .returning();
    return result[0];
  }

  // Authentication helpers
  async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 12);
  }

  // Deal analysis operations
  async getDeals(): Promise<Deal[]> {
    return await db.select().from(deals).orderBy(desc(deals.createdAt));
  }

  async getDeal(id: number): Promise<Deal | undefined> {
    const [deal] = await db.select().from(deals).where(eq(deals.id, id));
    return deal || undefined;
  }

  async createDeal(deal: InsertDeal): Promise<Deal> {
    const [result] = await db.insert(deals).values(deal).returning();
    return result;
  }

  async updateDeal(id: number, deal: Partial<InsertDeal>): Promise<Deal | undefined> {
    const [result] = await db.update(deals)
      .set({ ...deal, updatedAt: new Date() })
      .where(eq(deals.id, id))
      .returning();
    return result || undefined;
  }

  async deleteDeal(id: number): Promise<boolean> {
    const result = await db.delete(deals).where(eq(deals.id, id));
    return result.rowCount > 0;
  }

  // Deal rehab operations
  async getDealRehab(dealId: number): Promise<DealRehab[]> {
    return await db.select().from(dealRehab).where(eq(dealRehab.dealId, dealId));
  }

  async createDealRehab(rehab: InsertDealRehab): Promise<DealRehab> {
    const [result] = await db.insert(dealRehab).values(rehab).returning();
    return result;
  }

  async updateDealRehab(id: number, rehab: Partial<InsertDealRehab>): Promise<DealRehab | undefined> {
    const [result] = await db.update(dealRehab)
      .set(rehab)
      .where(eq(dealRehab.id, id))
      .returning();
    return result || undefined;
  }

  async deleteDealRehab(id: number): Promise<boolean> {
    const result = await db.delete(dealRehab).where(eq(dealRehab.id, id));
    return result.rowCount > 0;
  }

  // Deal units operations
  async getDealUnits(dealId: number): Promise<DealUnits[]> {
    return await db.select().from(dealUnits).where(eq(dealUnits.dealId, dealId));
  }

  async createDealUnits(unit: InsertDealUnits): Promise<DealUnits> {
    const [result] = await db.insert(dealUnits).values(unit).returning();
    return result;
  }

  async updateDealUnits(id: number, unit: Partial<InsertDealUnits>): Promise<DealUnits | undefined> {
    const [result] = await db.update(dealUnits)
      .set(unit)
      .where(eq(dealUnits.id, id))
      .returning();
    return result || undefined;
  }

  async deleteDealUnits(id: number): Promise<boolean> {
    const result = await db.delete(dealUnits).where(eq(dealUnits.id, id));
    return result.rowCount > 0;
  }

  // Deal expenses operations
  async getDealExpenses(dealId: number): Promise<DealExpenses[]> {
    return await db.select().from(dealExpenses).where(eq(dealExpenses.dealId, dealId));
  }

  async createDealExpenses(expense: InsertDealExpenses): Promise<DealExpenses> {
    const [result] = await db.insert(dealExpenses).values(expense).returning();
    return result;
  }

  async updateDealExpenses(id: number, expense: Partial<InsertDealExpenses>): Promise<DealExpenses | undefined> {
    const [result] = await db.update(dealExpenses)
      .set(expense)
      .where(eq(dealExpenses.id, id))
      .returning();
    return result || undefined;
  }

  async deleteDealExpenses(id: number): Promise<boolean> {
    const result = await db.delete(dealExpenses).where(eq(dealExpenses.id, id));
    return result.rowCount > 0;
  }

  // Deal closing costs operations
  async getDealClosingCosts(dealId: number): Promise<DealClosingCosts[]> {
    return await db.select().from(dealClosingCosts).where(eq(dealClosingCosts.dealId, dealId));
  }

  async createDealClosingCosts(cost: InsertDealClosingCosts): Promise<DealClosingCosts> {
    const [result] = await db.insert(dealClosingCosts).values(cost).returning();
    return result;
  }

  async updateDealClosingCosts(id: number, cost: Partial<InsertDealClosingCosts>): Promise<DealClosingCosts | undefined> {
    const [result] = await db.update(dealClosingCosts)
      .set(cost)
      .where(eq(dealClosingCosts.id, id))
      .returning();
    return result || undefined;
  }

  async deleteDealClosingCosts(id: number): Promise<boolean> {
    const result = await db.delete(dealClosingCosts).where(eq(dealClosingCosts.id, id));
    return result.rowCount > 0;
  }

  // Deal holding costs operations
  async getDealHoldingCosts(dealId: number): Promise<DealHoldingCosts[]> {
    return await db.select().from(dealHoldingCosts).where(eq(dealHoldingCosts.dealId, dealId));
  }

  async createDealHoldingCosts(cost: InsertDealHoldingCosts): Promise<DealHoldingCosts> {
    const [result] = await db.insert(dealHoldingCosts).values(cost).returning();
    return result;
  }

  async updateDealHoldingCosts(id: number, cost: Partial<InsertDealHoldingCosts>): Promise<DealHoldingCosts | undefined> {
    const [result] = await db.update(dealHoldingCosts)
      .set(cost)
      .where(eq(dealHoldingCosts.id, id))
      .returning();
    return result || undefined;
  }

  async deleteDealHoldingCosts(id: number): Promise<boolean> {
    const result = await db.delete(dealHoldingCosts).where(eq(dealHoldingCosts.id, id));
    return result.rowCount > 0;
  }

  // Deal loans operations
  async getDealLoans(dealId: number): Promise<DealLoans[]> {
    return await db.select().from(dealLoans).where(eq(dealLoans.dealId, dealId));
  }

  async createDealLoans(loan: InsertDealLoans): Promise<DealLoans> {
    const [result] = await db.insert(dealLoans).values(loan).returning();
    return result;
  }

  async updateDealLoans(id: number, loan: Partial<InsertDealLoans>): Promise<DealLoans | undefined> {
    const [result] = await db.update(dealLoans)
      .set(loan)
      .where(eq(dealLoans.id, id))
      .returning();
    return result || undefined;
  }

  async deleteDealLoans(id: number): Promise<boolean> {
    const result = await db.delete(dealLoans).where(eq(dealLoans.id, id));
    return result.rowCount > 0;
  }

  // Deal other income operations
  async getDealOtherIncome(dealId: number): Promise<DealOtherIncome[]> {
    return await db.select().from(dealOtherIncome).where(eq(dealOtherIncome.dealId, dealId));
  }

  async createDealOtherIncome(income: InsertDealOtherIncome): Promise<DealOtherIncome> {
    const [result] = await db.insert(dealOtherIncome).values(income).returning();
    return result;
  }

  async updateDealOtherIncome(id: number, income: Partial<InsertDealOtherIncome>): Promise<DealOtherIncome | undefined> {
    const [result] = await db.update(dealOtherIncome)
      .set(income)
      .where(eq(dealOtherIncome.id, id))
      .returning();
    return result || undefined;
  }

  async deleteDealOtherIncome(id: number): Promise<boolean> {
    const result = await db.delete(dealOtherIncome).where(eq(dealOtherIncome.id, id));
    return result.rowCount > 0;
  }

  // Deal comps operations
  async getDealComps(dealId: number): Promise<DealComps[]> {
    return await db.select().from(dealComps).where(eq(dealComps.dealId, dealId));
  }

  async createDealComps(comp: InsertDealComps): Promise<DealComps> {
    const [result] = await db.insert(dealComps).values(comp).returning();
    return result;
  }

  async updateDealComps(id: number, comp: Partial<InsertDealComps>): Promise<DealComps | undefined> {
    const [result] = await db.update(dealComps)
      .set(comp)
      .where(eq(dealComps.id, id))
      .returning();
    return result || undefined;
  }

  async deleteDealComps(id: number): Promise<boolean> {
    const result = await db.delete(dealComps).where(eq(dealComps.id, id));
    return result.rowCount > 0;
  }

  // Saved deals operations
  async getSavedDeals(): Promise<SavedDeal[]> {
    return db.select().from(savedDeals).orderBy(desc(savedDeals.createdAt));
  }

  async getSavedDeal(id: number): Promise<SavedDeal | undefined> {
    const result = await db.select().from(savedDeals).where(eq(savedDeals.id, id)).limit(1);
    return result[0];
  }

  async createSavedDeal(savedDeal: InsertSavedDeal): Promise<SavedDeal> {
    const [result] = await db.insert(savedDeals).values(savedDeal).returning();
    return result;
  }

  async updateSavedDeal(id: number, savedDeal: Partial<InsertSavedDeal>): Promise<SavedDeal | undefined> {
    const [result] = await db
      .update(savedDeals)
      .set({ ...savedDeal, updatedAt: new Date() })
      .where(eq(savedDeals.id, id))
      .returning();
    return result || undefined;
  }

  async deleteSavedDeal(id: number): Promise<boolean> {
    const result = await db.delete(savedDeals).where(eq(savedDeals.id, id));
    return result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();
