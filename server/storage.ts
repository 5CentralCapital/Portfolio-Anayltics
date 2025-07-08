import { db } from "./db";
import { 
  users, properties, companyMetrics, investorLeads, sessions, entityOwnership,
  deals, dealRehab, dealUnits, dealExpenses, dealClosingCosts, 
  dealHoldingCosts, dealLoans, dealOtherIncome, dealComps,
  propertyAssumptions, propertyUnitTypes, propertyRentRoll, propertyExpenses,
  propertyRehabBudget, propertyClosingCosts, propertyHoldingCosts,
  propertyExitAnalysis, propertyIncomeOther, propertyLoans,
  bankAccountsTable, transactionsTable
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
  EntityOwnership,
  InsertEntityOwnership,
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
  PropertyAssumptions,
  InsertPropertyAssumptions,
  PropertyUnitTypes,
  InsertPropertyUnitTypes,
  PropertyRentRoll,
  InsertPropertyRentRoll,
  PropertyExpenses,
  InsertPropertyExpenses,
  PropertyRehabBudget,
  InsertPropertyRehabBudget,
  PropertyClosingCosts,
  InsertPropertyClosingCosts,
  PropertyHoldingCosts,
  InsertPropertyHoldingCosts,
  PropertyExitAnalysis,
  InsertPropertyExitAnalysis,
  PropertyIncomeOther,
  InsertPropertyIncomeOther,
  BankAccount,
  NewBankAccount,
  Transaction,
  NewTransaction
} from "@shared/schema";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserLastLogin(id: number): Promise<void>;
  
  // Property operations
  getProperties(): Promise<Property[]>;
  getPropertiesForUser(userId: number): Promise<Property[]>;
  getFeaturedProperties(): Promise<Property[]>;
  getProperty(id: number): Promise<Property | undefined>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(id: number, property: Partial<InsertProperty>): Promise<Property | undefined>;
  updatePropertyFeatured(id: number, isFeatured: boolean): Promise<Property | undefined>;
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
  
  // Bank account operations
  getBankAccounts(userId: number): Promise<BankAccount[]>;
  getBankAccount(userId: number, accountId: number): Promise<BankAccount | undefined>;
  createBankAccount(bankAccount: NewBankAccount): Promise<BankAccount>;
  updateBankAccountBalance(accountId: number, balanceData: any): Promise<BankAccount | undefined>;
  
  // Transaction operations
  getTransactions(userId: number, accountId?: number): Promise<Transaction[]>;
  createTransaction(transaction: NewTransaction): Promise<Transaction>;
  
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
  
  // Entity ownership operations
  getUserEntityOwnership(userId: number): Promise<EntityOwnership[]>;
  createEntityOwnership(ownership: InsertEntityOwnership): Promise<EntityOwnership>;
  updateEntityOwnership(id: number, ownership: Partial<InsertEntityOwnership>): Promise<EntityOwnership | undefined>;
  deleteEntityOwnership(id: number): Promise<boolean>;

  // Deal Analyzer import operations
  importFromDealAnalyzer(dealData: any, additionalPropertyData: any, userId: number): Promise<Property>;
  syncDealAnalyzerToNormalized(propertyId: number): Promise<void>;
  
  // Property Deal Analyzer normalized data operations
  getPropertyAssumptions(propertyId: number): Promise<PropertyAssumptions | undefined>;
  createPropertyAssumptions(assumptions: InsertPropertyAssumptions): Promise<PropertyAssumptions>;
  updatePropertyAssumptions(propertyId: number, assumptions: Partial<InsertPropertyAssumptions>): Promise<PropertyAssumptions | undefined>;
  
  getPropertyUnitTypes(propertyId: number): Promise<PropertyUnitTypes[]>;
  createPropertyUnitTypes(unitType: InsertPropertyUnitTypes): Promise<PropertyUnitTypes>;
  updatePropertyUnitTypes(id: number, unitType: Partial<InsertPropertyUnitTypes>): Promise<PropertyUnitTypes | undefined>;
  deletePropertyUnitTypes(id: number): Promise<boolean>;
  
  getPropertyRentRoll(propertyId: number): Promise<PropertyRentRoll[]>;
  createPropertyRentRoll(rentRoll: InsertPropertyRentRoll): Promise<PropertyRentRoll>;
  updatePropertyRentRoll(id: number, rentRoll: Partial<InsertPropertyRentRoll>): Promise<PropertyRentRoll | undefined>;
  deletePropertyRentRoll(id: number): Promise<boolean>;
  
  getPropertyExpenses(propertyId: number): Promise<PropertyExpenses[]>;
  createPropertyExpenses(expense: InsertPropertyExpenses): Promise<PropertyExpenses>;
  updatePropertyExpenses(id: number, expense: Partial<InsertPropertyExpenses>): Promise<PropertyExpenses | undefined>;
  deletePropertyExpenses(id: number): Promise<boolean>;
  
  getPropertyRehabBudget(propertyId: number): Promise<PropertyRehabBudget[]>;
  createPropertyRehabBudget(rehabItem: InsertPropertyRehabBudget): Promise<PropertyRehabBudget>;
  updatePropertyRehabBudget(id: number, rehabItem: Partial<InsertPropertyRehabBudget>): Promise<PropertyRehabBudget | undefined>;
  deletePropertyRehabBudget(id: number): Promise<boolean>;
  
  getPropertyClosingCosts(propertyId: number): Promise<PropertyClosingCosts[]>;
  createPropertyClosingCosts(closingCost: InsertPropertyClosingCosts): Promise<PropertyClosingCosts>;
  updatePropertyClosingCosts(id: number, closingCost: Partial<InsertPropertyClosingCosts>): Promise<PropertyClosingCosts | undefined>;
  deletePropertyClosingCosts(id: number): Promise<boolean>;
  
  getPropertyHoldingCosts(propertyId: number): Promise<PropertyHoldingCosts[]>;
  createPropertyHoldingCosts(holdingCost: InsertPropertyHoldingCosts): Promise<PropertyHoldingCosts>;
  updatePropertyHoldingCosts(id: number, holdingCost: Partial<InsertPropertyHoldingCosts>): Promise<PropertyHoldingCosts | undefined>;
  deletePropertyHoldingCosts(id: number): Promise<boolean>;
  
  getPropertyExitAnalysis(propertyId: number): Promise<PropertyExitAnalysis | undefined>;
  createPropertyExitAnalysis(exitAnalysis: InsertPropertyExitAnalysis): Promise<PropertyExitAnalysis>;
  updatePropertyExitAnalysis(propertyId: number, exitAnalysis: Partial<InsertPropertyExitAnalysis>): Promise<PropertyExitAnalysis | undefined>;
  
  getPropertyIncomeOther(propertyId: number): Promise<PropertyIncomeOther[]>;
  createPropertyIncomeOther(income: InsertPropertyIncomeOther): Promise<PropertyIncomeOther>;
  updatePropertyIncomeOther(id: number, income: Partial<InsertPropertyIncomeOther>): Promise<PropertyIncomeOther | undefined>;
  deletePropertyIncomeOther(id: number): Promise<boolean>;
  
  // Helper method to sync JSON data to normalized tables
  syncDealAnalyzerDataToTables(propertyId: number, dealAnalyzerData: string): Promise<void>;
  
  // Helper method to build JSON from normalized tables
  buildDealAnalyzerDataFromTables(propertyId: number): Promise<string | null>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error fetching user by email:', error);
      // Try once more after a brief delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      try {
        const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
        return result[0];
      } catch (retryError) {
        console.error('Retry failed for getUserByEmail:', retryError);
        throw retryError;
      }
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUserLastLogin(id: number): Promise<void> {
    try {
      await db.update(users)
        .set({ lastLogin: new Date(), updatedAt: new Date() })
        .where(eq(users.id, id));
    } catch (error) {
      console.error('Error updating user last login:', error);
      // This is not critical for login flow, so don't throw
    }
  }

  // Property operations
  async getProperties(): Promise<Property[]> {
    return await db.select().from(properties).orderBy(desc(properties.createdAt));
  }

  async getPropertiesForUser(userId: number): Promise<Property[]> {
    // Get user's entity ownerships
    const userEntities = await this.getUserEntityOwnership(userId);
    const userEntityNames = userEntities.map(e => e.entityName);
    
    if (userEntityNames.length === 0) {
      return [];
    }
    
    // Get all properties and filter by user's entities
    const allProperties = await db.select().from(properties).orderBy(desc(properties.createdAt));
    return allProperties.filter(property => userEntityNames.includes(property.entity || ''));
  }

  async getFeaturedProperties(): Promise<Property[]> {
    return await db.select().from(properties)
      .where(eq(properties.isFeatured, true))
      .limit(6) // Limit to 6 featured properties
      .orderBy(desc(properties.createdAt));
  }

  async getProperty(id: number): Promise<Property | undefined> {
    const result = await db.select().from(properties).where(eq(properties.id, id)).limit(1);
    return result[0];
  }

  async createProperty(property: InsertProperty): Promise<Property> {
    // Handle dealAnalyzerData serialization if it exists
    const propertyData = { ...property };
    if (propertyData.dealAnalyzerData && typeof propertyData.dealAnalyzerData === 'object') {
      propertyData.dealAnalyzerData = JSON.stringify(propertyData.dealAnalyzerData);
    }
    
    const result = await db.insert(properties).values(propertyData).returning();
    return result[0];
  }

  async updateProperty(id: number, property: Partial<InsertProperty>): Promise<Property | undefined> {
    // Clean the update data and handle date conversion
    const updateData = { ...property };
    
    // Remove fields that shouldn't be updated
    delete (updateData as any).createdAt;
    delete (updateData as any).id;
    
    const result = await db.update(properties)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(properties.id, id))
      .returning();
    return result[0];
  }

  async updatePropertyFeatured(id: number, isFeatured: boolean): Promise<Property | undefined> {
    const result = await db.update(properties)
      .set({ isFeatured, updatedAt: new Date() })
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
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      console.error('Error validating password:', error);
      return false;
    }
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
    return (result.rowCount ?? 0) > 0;
  }

  // Entity ownership operations
  async getUserEntityOwnership(userId: number): Promise<EntityOwnership[]> {
    return await db.select().from(entityOwnership).where(eq(entityOwnership.userId, userId));
  }

  async createEntityOwnership(ownership: InsertEntityOwnership): Promise<EntityOwnership> {
    const [newOwnership] = await db
      .insert(entityOwnership)
      .values(ownership)
      .returning();
    return newOwnership;
  }

  async updateEntityOwnership(id: number, ownership: Partial<InsertEntityOwnership>): Promise<EntityOwnership | undefined> {
    const [updated] = await db
      .update(entityOwnership)
      .set(ownership)
      .where(eq(entityOwnership.id, id))
      .returning();
    return updated;
  }

  async deleteEntityOwnership(id: number): Promise<boolean> {
    const result = await db.delete(entityOwnership).where(eq(entityOwnership.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Property Deal Analyzer normalized data operations
  async getPropertyAssumptions(propertyId: number): Promise<PropertyAssumptions | undefined> {
    const [assumptions] = await db.select().from(propertyAssumptions).where(eq(propertyAssumptions.propertyId, propertyId));
    return assumptions;
  }

  async createPropertyAssumptions(assumptions: InsertPropertyAssumptions): Promise<PropertyAssumptions> {
    const [created] = await db.insert(propertyAssumptions).values(assumptions).returning();
    return created;
  }

  async updatePropertyAssumptions(propertyId: number, assumptions: Partial<InsertPropertyAssumptions>): Promise<PropertyAssumptions | undefined> {
    const [updated] = await db.update(propertyAssumptions)
      .set({ ...assumptions, updatedAt: new Date() })
      .where(eq(propertyAssumptions.propertyId, propertyId))
      .returning();
    return updated;
  }

  async getPropertyUnitTypes(propertyId: number): Promise<PropertyUnitTypes[]> {
    return await db.select().from(propertyUnitTypes).where(eq(propertyUnitTypes.propertyId, propertyId));
  }

  async createPropertyUnitTypes(unitType: InsertPropertyUnitTypes): Promise<PropertyUnitTypes> {
    const [created] = await db.insert(propertyUnitTypes).values(unitType).returning();
    return created;
  }

  async updatePropertyUnitTypes(id: number, unitType: Partial<InsertPropertyUnitTypes>): Promise<PropertyUnitTypes | undefined> {
    const [updated] = await db.update(propertyUnitTypes)
      .set({ ...unitType, updatedAt: new Date() })
      .where(eq(propertyUnitTypes.id, id))
      .returning();
    return updated;
  }

  async deletePropertyUnitTypes(id: number): Promise<boolean> {
    const result = await db.delete(propertyUnitTypes).where(eq(propertyUnitTypes.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getPropertyRentRoll(propertyId: number): Promise<PropertyRentRoll[]> {
    return await db.select().from(propertyRentRoll).where(eq(propertyRentRoll.propertyId, propertyId));
  }

  async createPropertyRentRoll(rentRoll: InsertPropertyRentRoll): Promise<PropertyRentRoll> {
    const [created] = await db.insert(propertyRentRoll).values(rentRoll).returning();
    return created;
  }

  async updatePropertyRentRoll(id: number, rentRoll: Partial<InsertPropertyRentRoll>): Promise<PropertyRentRoll | undefined> {
    const [updated] = await db.update(propertyRentRoll)
      .set({ ...rentRoll, updatedAt: new Date() })
      .where(eq(propertyRentRoll.id, id))
      .returning();
    return updated;
  }

  async deletePropertyRentRoll(id: number): Promise<boolean> {
    const result = await db.delete(propertyRentRoll).where(eq(propertyRentRoll.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getPropertyExpenses(propertyId: number): Promise<PropertyExpenses[]> {
    return await db.select().from(propertyExpenses).where(eq(propertyExpenses.propertyId, propertyId));
  }

  async createPropertyExpenses(expense: InsertPropertyExpenses): Promise<PropertyExpenses> {
    const [created] = await db.insert(propertyExpenses).values(expense).returning();
    return created;
  }

  async updatePropertyExpenses(id: number, expense: Partial<InsertPropertyExpenses>): Promise<PropertyExpenses | undefined> {
    const [updated] = await db.update(propertyExpenses)
      .set({ ...expense, updatedAt: new Date() })
      .where(eq(propertyExpenses.id, id))
      .returning();
    return updated;
  }

  async deletePropertyExpenses(id: number): Promise<boolean> {
    const result = await db.delete(propertyExpenses).where(eq(propertyExpenses.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getPropertyRehabBudget(propertyId: number): Promise<PropertyRehabBudget[]> {
    return await db.select().from(propertyRehabBudget).where(eq(propertyRehabBudget.propertyId, propertyId));
  }

  async createPropertyRehabBudget(rehabItem: InsertPropertyRehabBudget): Promise<PropertyRehabBudget> {
    const [created] = await db.insert(propertyRehabBudget).values(rehabItem).returning();
    return created;
  }

  async updatePropertyRehabBudget(id: number, rehabItem: Partial<InsertPropertyRehabBudget>): Promise<PropertyRehabBudget | undefined> {
    const [updated] = await db.update(propertyRehabBudget)
      .set({ ...rehabItem, updatedAt: new Date() })
      .where(eq(propertyRehabBudget.id, id))
      .returning();
    return updated;
  }

  async deletePropertyRehabBudget(id: number): Promise<boolean> {
    const result = await db.delete(propertyRehabBudget).where(eq(propertyRehabBudget.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getPropertyClosingCosts(propertyId: number): Promise<PropertyClosingCosts[]> {
    return await db.select().from(propertyClosingCosts).where(eq(propertyClosingCosts.propertyId, propertyId));
  }

  async createPropertyClosingCosts(closingCost: InsertPropertyClosingCosts): Promise<PropertyClosingCosts> {
    const [created] = await db.insert(propertyClosingCosts).values(closingCost).returning();
    return created;
  }

  async updatePropertyClosingCosts(id: number, closingCost: Partial<InsertPropertyClosingCosts>): Promise<PropertyClosingCosts | undefined> {
    const [updated] = await db.update(propertyClosingCosts)
      .set({ ...closingCost, updatedAt: new Date() })
      .where(eq(propertyClosingCosts.id, id))
      .returning();
    return updated;
  }

  async deletePropertyClosingCosts(id: number): Promise<boolean> {
    const result = await db.delete(propertyClosingCosts).where(eq(propertyClosingCosts.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getPropertyHoldingCosts(propertyId: number): Promise<PropertyHoldingCosts[]> {
    return await db.select().from(propertyHoldingCosts).where(eq(propertyHoldingCosts.propertyId, propertyId));
  }

  async createPropertyHoldingCosts(holdingCost: InsertPropertyHoldingCosts): Promise<PropertyHoldingCosts> {
    const [created] = await db.insert(propertyHoldingCosts).values(holdingCost).returning();
    return created;
  }

  async updatePropertyHoldingCosts(id: number, holdingCost: Partial<InsertPropertyHoldingCosts>): Promise<PropertyHoldingCosts | undefined> {
    const [updated] = await db.update(propertyHoldingCosts)
      .set({ ...holdingCost, updatedAt: new Date() })
      .where(eq(propertyHoldingCosts.id, id))
      .returning();
    return updated;
  }

  async deletePropertyHoldingCosts(id: number): Promise<boolean> {
    const result = await db.delete(propertyHoldingCosts).where(eq(propertyHoldingCosts.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getPropertyExitAnalysis(propertyId: number): Promise<PropertyExitAnalysis | undefined> {
    const [analysis] = await db.select().from(propertyExitAnalysis).where(eq(propertyExitAnalysis.propertyId, propertyId));
    return analysis;
  }

  async createPropertyExitAnalysis(exitAnalysis: InsertPropertyExitAnalysis): Promise<PropertyExitAnalysis> {
    const [created] = await db.insert(propertyExitAnalysis).values(exitAnalysis).returning();
    return created;
  }

  async updatePropertyExitAnalysis(propertyId: number, exitAnalysis: Partial<InsertPropertyExitAnalysis>): Promise<PropertyExitAnalysis | undefined> {
    const [updated] = await db.update(propertyExitAnalysis)
      .set({ ...exitAnalysis, updatedAt: new Date() })
      .where(eq(propertyExitAnalysis.propertyId, propertyId))
      .returning();
    return updated;
  }

  async getPropertyIncomeOther(propertyId: number): Promise<PropertyIncomeOther[]> {
    return await db.select().from(propertyIncomeOther).where(eq(propertyIncomeOther.propertyId, propertyId));
  }

  async createPropertyIncomeOther(income: InsertPropertyIncomeOther): Promise<PropertyIncomeOther> {
    const [created] = await db.insert(propertyIncomeOther).values(income).returning();
    return created;
  }

  async updatePropertyIncomeOther(id: number, income: Partial<InsertPropertyIncomeOther>): Promise<PropertyIncomeOther | undefined> {
    const [updated] = await db.update(propertyIncomeOther)
      .set({ ...income, updatedAt: new Date() })
      .where(eq(propertyIncomeOther.id, id))
      .returning();
    return updated;
  }

  async deletePropertyIncomeOther(id: number): Promise<boolean> {
    const result = await db.delete(propertyIncomeOther).where(eq(propertyIncomeOther.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Helper method to sync JSON data to normalized tables
  async syncDealAnalyzerDataToTables(propertyId: number, dealAnalyzerData: string): Promise<void> {
    try {
      const data = JSON.parse(dealAnalyzerData);
      
      // Sync assumptions
      if (data.assumptions) {
        const existingAssumptions = await this.getPropertyAssumptions(propertyId);
        if (existingAssumptions) {
          await this.updatePropertyAssumptions(propertyId, { ...data.assumptions, propertyId });
        } else {
          await this.createPropertyAssumptions({ ...data.assumptions, propertyId });
        }
      }

      // Sync unit types
      if (data.unitTypes && Array.isArray(data.unitTypes)) {
        const existing = await this.getPropertyUnitTypes(propertyId);
        for (const unit of existing) {
          await this.deletePropertyUnitTypes(unit.id);
        }
        for (const unitType of data.unitTypes) {
          await this.createPropertyUnitTypes({ ...unitType, propertyId });
        }
      }

      // Sync rent roll
      if (data.rentRoll && Array.isArray(data.rentRoll)) {
        const existing = await this.getPropertyRentRoll(propertyId);
        for (const rent of existing) {
          await this.deletePropertyRentRoll(rent.id);
        }
        for (const rentItem of data.rentRoll) {
          await this.createPropertyRentRoll({ ...rentItem, propertyId });
        }
      }

      // Sync expenses
      if (data.expenses && Array.isArray(data.expenses)) {
        const existing = await this.getPropertyExpenses(propertyId);
        for (const expense of existing) {
          await this.deletePropertyExpenses(expense.id);
        }
        for (const expenseItem of data.expenses) {
          await this.createPropertyExpenses({ ...expenseItem, propertyId });
        }
      }

      // Sync rehab budget
      if (data.rehabBudget) {
        const existing = await this.getPropertyRehabBudget(propertyId);
        for (const item of existing) {
          await this.deletePropertyRehabBudget(item.id);
        }
        
        const sections = ['exterior', 'kitchens', 'bathrooms', 'generalInterior', 'finishings'];
        for (const section of sections) {
          if (data.rehabBudget[section] && Array.isArray(data.rehabBudget[section])) {
            for (const item of data.rehabBudget[section]) {
              await this.createPropertyRehabBudget({ 
                ...item, 
                propertyId, 
                section: section 
              });
            }
          }
        }
      }

      // Sync exit analysis
      if (data.exitAnalysis) {
        const existing = await this.getPropertyExitAnalysis(propertyId);
        if (existing) {
          await this.updatePropertyExitAnalysis(propertyId, { ...data.exitAnalysis, propertyId });
        } else {
          await this.createPropertyExitAnalysis({ ...data.exitAnalysis, propertyId });
        }
      }

    } catch (error) {
      console.error('Error syncing deal analyzer data to tables:', error);
    }
  }

  // Helper method to build JSON from normalized tables
  async buildDealAnalyzerDataFromTables(propertyId: number): Promise<string | null> {
    try {
      const data: any = {};

      // Get assumptions
      const assumptions = await this.getPropertyAssumptions(propertyId);
      if (assumptions) {
        data.assumptions = assumptions;
      }

      // Get unit types
      const unitTypes = await this.getPropertyUnitTypes(propertyId);
      if (unitTypes.length > 0) {
        data.unitTypes = unitTypes;
      }

      // Get rent roll
      const rentRoll = await this.getPropertyRentRoll(propertyId);
      if (rentRoll.length > 0) {
        data.rentRoll = rentRoll;
      }

      // Get expenses
      const expenses = await this.getPropertyExpenses(propertyId);
      if (expenses.length > 0) {
        data.expenses = expenses;
      }

      // Get rehab budget organized by section
      const rehabItems = await this.getPropertyRehabBudget(propertyId);
      if (rehabItems.length > 0) {
        data.rehabBudget = {
          exterior: rehabItems.filter(item => item.section === 'exterior'),
          kitchens: rehabItems.filter(item => item.section === 'kitchens'),
          bathrooms: rehabItems.filter(item => item.section === 'bathrooms'),
          generalInterior: rehabItems.filter(item => item.section === 'generalInterior'),
          finishings: rehabItems.filter(item => item.section === 'finishings')
        };
      }

      // Get exit analysis
      const exitAnalysis = await this.getPropertyExitAnalysis(propertyId);
      if (exitAnalysis) {
        data.exitAnalysis = exitAnalysis;
      }

      return Object.keys(data).length > 0 ? JSON.stringify(data) : null;
    } catch (error) {
      console.error('Error building deal analyzer data from tables:', error);
      return null;
    }
  }

  /**
   * Import Deal Analyzer data into normalized database structure with enhanced rent roll and rehab tracking
   */
  async importFromDealAnalyzer(dealData: any, additionalPropertyData: any, userId: number): Promise<Property> {
    // Calculate KPIs from Deal Analyzer data
    const totalRehabCosts = this.calculateTotalRehabCosts(dealData);
    const grossRentalIncome = this.calculateGrossRentalIncome(dealData);
    const totalOperatingExpenses = this.calculateTotalOperatingExpenses(dealData, grossRentalIncome);
    const noi = grossRentalIncome - totalOperatingExpenses;
    const arv = dealData.assumptions?.marketCapRate ? noi / dealData.assumptions.marketCapRate : 0;
    const initialCapital = this.calculateInitialCapital(dealData, totalRehabCosts);
    const annualCashFlow = this.calculateAnnualCashFlow(dealData, noi);

    // Create property with calculated data structure
    const propertyData = {
      status: "Under Contract" as const,
      apartments: dealData.assumptions?.unitCount || dealData.assumptions?.units || 1,
      address: dealData.propertyAddress || additionalPropertyData.address,
      city: additionalPropertyData.city || "",
      state: additionalPropertyData.state || "",
      zipCode: additionalPropertyData.zipCode || "",
      entity: additionalPropertyData.entity || "5Central Capital",
      acquisitionDate: additionalPropertyData.acquisitionDate,
      acquisitionPrice: dealData.assumptions?.purchasePrice?.toString() || "0",
      rehabCosts: totalRehabCosts.toString(),
      arvAtTimePurchased: arv.toString(),
      initialCapitalRequired: initialCapital.toString(),
      cashFlow: annualCashFlow.toString(),
      totalProfits: "0",
      cashOnCashReturn: initialCapital > 0 ? ((annualCashFlow / initialCapital) * 100).toFixed(2) : "0",
      annualizedReturn: "0",
      dealAnalyzerData: JSON.stringify(dealData) // Keep for backward compatibility
    };

    const property = await this.createProperty(propertyData);
    
    // Import to normalized tables
    try {
      await this.importNormalizedData(property.id, dealData);
    } catch (error) {
      console.error(`Error importing normalized data for property ${property.id}:`, error);
      // Continue with property creation even if normalized import fails
    }
    
    return property;
  }

  private calculateTotalRehabCosts(dealData: any): number {
    if (!dealData.rehabBudgetSections) return 0;
    
    let total = 0;
    Object.values(dealData.rehabBudgetSections).forEach((section: any) => {
      if (Array.isArray(section)) {
        section.forEach((item: any) => {
          total += item.totalCost || 0;
        });
      }
    });
    return total;
  }

  private calculateGrossRentalIncome(dealData: any): number {
    if (!dealData.rentRoll || !Array.isArray(dealData.rentRoll)) return 0;
    
    return dealData.rentRoll.reduce((total: number, unit: any) => {
      return total + ((unit.proFormaRent || unit.currentRent || 0) * 12);
    }, 0);
  }

  private calculateTotalOperatingExpenses(dealData: any, grossIncome: number): number {
    if (!dealData.expenses) return 0;
    
    let total = 0;
    Object.entries(dealData.expenses).forEach(([key, value]: [string, any]) => {
      if (key === 'managementFee' && dealData.assumptions?.managementFeePercent) {
        total += grossIncome * (dealData.assumptions.managementFeePercent / 100);
      } else {
        total += value || 0;
      }
    });
    return total;
  }

  private calculateInitialCapital(dealData: any, totalRehabCosts: number): number {
    const purchasePrice = dealData.assumptions?.purchasePrice || 0;
    const loanPercentage = dealData.assumptions?.loanPercentage || 0.8;
    const downPayment = purchasePrice * (1 - loanPercentage);
    
    let closingCosts = 0;
    if (dealData.closingCosts) {
      closingCosts = Object.values(dealData.closingCosts).reduce((sum: number, cost: any) => sum + (cost || 0), 0);
    }
    
    return downPayment + totalRehabCosts + closingCosts;
  }

  private calculateAnnualCashFlow(dealData: any, noi: number): number {
    const purchasePrice = dealData.assumptions?.purchasePrice || 0;
    const rehabCosts = this.calculateTotalRehabCosts(dealData);
    const loanAmount = (purchasePrice + rehabCosts) * (dealData.assumptions?.loanPercentage || 0.8);
    const interestRate = dealData.assumptions?.interestRate || 0.07;
    const loanTermYears = dealData.assumptions?.loanTermYears || 30;
    
    // Calculate monthly payment using loan formula
    const monthlyRate = interestRate / 12;
    const numPayments = loanTermYears * 12;
    const monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
    const annualDebtService = monthlyPayment * 12;
    
    return noi - annualDebtService;
  }

  /**
   * Sync existing Deal Analyzer JSON data to normalized tables
   */
  async syncDealAnalyzerToNormalized(propertyId: number): Promise<void> {
    const [property] = await db.select().from(properties).where(eq(properties.id, propertyId));
    if (!property?.dealAnalyzerData) return;

    try {
      const dealData = JSON.parse(property.dealAnalyzerData);
      
      // Clear existing normalized data for clean sync
      await this.clearNormalizedPropertyData(propertyId);
      
      // Re-import using the same logic as fresh import
      await this.importNormalizedData(propertyId, dealData);
    } catch (error) {
      console.error(`Failed to sync property ${propertyId}:`, error);
      throw error;
    }
  }

  /**
   * Helper method to categorize expenses
   */
  private getExpenseCategory(expenseKey: string): string {
    const categoryMap: { [key: string]: string } = {
      propertyTax: "taxes",
      insurance: "insurance", 
      maintenance: "maintenance",
      managementFee: "management",
      waterSewerTrash: "utilities",
      capitalReserves: "reserves",
      utilities: "utilities",
      other: "other"
    };
    return categoryMap[expenseKey] || "other";
  }

  /**
   * Helper method to format expense names
   */
  private formatExpenseName(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  /**
   * Clear normalized property data for clean sync
   */
  private async clearNormalizedPropertyData(propertyId: number): Promise<void> {
    await Promise.all([
      db.delete(propertyAssumptions).where(eq(propertyAssumptions.propertyId, propertyId)),
      db.delete(propertyUnitTypes).where(eq(propertyUnitTypes.propertyId, propertyId)),
      db.delete(propertyRentRoll).where(eq(propertyRentRoll.propertyId, propertyId)),
      db.delete(propertyExpenses).where(eq(propertyExpenses.propertyId, propertyId)),
      db.delete(propertyRehabBudget).where(eq(propertyRehabBudget.propertyId, propertyId)),
      db.delete(propertyClosingCosts).where(eq(propertyClosingCosts.propertyId, propertyId)),
      db.delete(propertyHoldingCosts).where(eq(propertyHoldingCosts.propertyId, propertyId)),
      db.delete(propertyLoans).where(eq(propertyLoans.propertyId, propertyId))
    ]);
  }

  /**
   * Import normalized data components for a property
   */
  private async importNormalizedDataComponents(propertyId: number, dealData: any): Promise<void> {
    try {
      // Import property assumptions
      if (dealData.assumptions) {
        await this.createPropertyAssumptions({
          propertyId,
          unitCount: dealData.assumptions.unitCount || 1,
          purchasePrice: dealData.assumptions.purchasePrice?.toString() || "0",
          loanPercentage: dealData.assumptions.loanPercentage?.toString() || "0.8",
          interestRate: dealData.assumptions.interestRate?.toString() || "0.07",
          loanTermYears: dealData.assumptions.loanTermYears || 30,
          vacancyRate: dealData.assumptions.vacancyRate?.toString() || "0.05",
          expenseRatio: dealData.assumptions.expenseRatio?.toString() || "0.45",
          marketCapRate: dealData.assumptions.marketCapRate?.toString() || "0.055",
          refinanceLTV: dealData.assumptions.refinanceLTV?.toString() || "0.75",
          refinanceInterestRate: dealData.assumptions.refinanceInterestRate?.toString() || "0.065",
          refinanceClosingCostPercent: dealData.assumptions.refinanceClosingCostPercent?.toString() || "0.02",
          dscrThreshold: dealData.assumptions.dscrThreshold?.toString() || "1.25"
        });
      }

      // Import rent roll data with enhanced tenant and lease information
      if (dealData.rentRoll && Array.isArray(dealData.rentRoll)) {
        for (const unit of dealData.rentRoll) {
          await this.createPropertyRentRoll({
            propertyId,
            unitTypeId: unit.unitTypeId?.toString() || "1",
            unitNumber: unit.unit || unit.unitNumber || unit.id?.toString(),
            currentRent: unit.currentRent?.toString() || "0",
            proFormaRent: unit.proFormaRent?.toString() || "0",
            isVacant: unit.currentRent === 0 || unit.currentRent === null,
            tenantName: unit.tenantName || null,
            leaseStart: unit.leaseFrom || null,
            leaseEnd: unit.leaseTo || null
          });
        }
      }

      // Import expenses data
      if (dealData.expenses) {
        for (const [expenseKey, expenseValue] of Object.entries(dealData.expenses)) {
          if (typeof expenseValue === 'number' && expenseValue > 0) {
            await this.createPropertyExpenses({
              propertyId,
              expenseType: this.getExpenseCategory(expenseKey),
              expenseName: this.formatExpenseName(expenseKey),
              annualAmount: expenseValue.toString(),
              isPercentage: false
            });
          }
        }
      }

      // Import rehab budget data
      if (dealData.rehabBudgetSections) {
        for (const [sectionName, items] of Object.entries(dealData.rehabBudgetSections)) {
          if (Array.isArray(items)) {
            for (const item of items) {
              await this.createPropertyRehabBudget({
                propertyId,
                section: sectionName,
                category: item.category || "Uncategorized",
                perUnitCost: item.perUnitCost?.toString() || "0",
                quantity: item.quantity || 1,
                totalCost: item.totalCost?.toString() || "0",
                spentAmount: item.spentAmount?.toString() || "0",
                completionStatus: item.spentAmount > 0 ? "In Progress" : "Not Started"
              });
            }
          }
        }
      }

      // Import closing costs
      if (dealData.closingCosts) {
        for (const [costKey, costValue] of Object.entries(dealData.closingCosts)) {
          if (typeof costValue === 'number') {
            await this.createPropertyClosingCosts({
              propertyId,
              costType: this.formatExpenseName(costKey),
              amount: costValue.toString(),
              description: `${this.formatExpenseName(costKey)} from Deal Analyzer import`
            });
          }
        }
      }

      // Import holding costs
      if (dealData.holdingCosts) {
        for (const [costKey, costValue] of Object.entries(dealData.holdingCosts)) {
          if (typeof costValue === 'number' && costValue > 0) {
            await this.createPropertyHoldingCosts({
              propertyId,
              costType: this.formatExpenseName(costKey),
              amount: costValue.toString(),
              description: `${this.formatExpenseName(costKey)} during holding period`
            });
          }
        }
      }
    } catch (error) {
      console.error(`Error importing normalized data for property ${propertyId}:`, error);
      throw error;
    }
  }

  /**
   * Calculate rehab completion status based on spent amount and total cost
   */
  private getRehabCompletionStatus(item: any): "Not Started" | "In Progress" | "Completed" {
    const spentAmount = parseFloat(item.spentAmount?.toString() || "0");
    const totalCost = parseFloat(item.totalCost?.toString() || "0");
    
    // Use explicit completion status if provided and valid
    if (item.completionStatus && ["Not Started", "In Progress", "Completed"].includes(item.completionStatus)) {
      return item.completionStatus as "Not Started" | "In Progress" | "Completed";
    }
    
    // Calculate based on spent amount vs total cost
    if (spentAmount <= 0) {
      return "Not Started";
    } else if (spentAmount >= totalCost) {
      return "Completed";
    } else {
      return "In Progress";
    }
  }

  /**
   * Import normalized data for existing property
   */
  private async importNormalizedData(propertyId: number, dealData: any): Promise<void> {
    try {
      // Import property assumptions
      if (dealData.assumptions) {
        await this.createPropertyAssumptions({
          propertyId,
          unitCount: dealData.assumptions.unitCount || dealData.assumptions.units || 1,
          purchasePrice: dealData.assumptions.purchasePrice?.toString() || "0",
          loanPercentage: dealData.assumptions.loanPercentage?.toString() || "0.8",
          interestRate: dealData.assumptions.interestRate?.toString() || "0.07",
          loanTermYears: dealData.assumptions.loanTermYears || 30,
          vacancyRate: dealData.assumptions.vacancyRate?.toString() || "0.05",
          expenseRatio: dealData.assumptions.expenseRatio?.toString() || "0.45",
          marketCapRate: dealData.assumptions.marketCapRate?.toString() || "0.055",
          refinanceLTV: dealData.assumptions.refinanceLTV?.toString() || "0.75",
          refinanceInterestRate: dealData.assumptions.refinanceInterestRate?.toString() || "0.065",
          refinanceClosingCostPercent: dealData.assumptions.refinanceClosingCostPercent?.toString() || "0.02",
          dscrThreshold: dealData.assumptions.dscrThreshold?.toString() || "1.25"
        });
      }

      // Import rent roll data
      if (dealData.rentRoll && Array.isArray(dealData.rentRoll)) {
        for (const unit of dealData.rentRoll) {
          await this.createPropertyRentRoll({
            propertyId,
            unitTypeId: unit.unitTypeId?.toString() || "1",
            unitNumber: unit.unit || unit.unitNumber || unit.id?.toString(),
            currentRent: unit.currentRent?.toString() || "0",
            proFormaRent: unit.proFormaRent?.toString() || "0",
            isVacant: unit.currentRent === 0 || unit.currentRent === null,
            tenantName: unit.tenantName || null,
            leaseStart: unit.leaseFrom || null,
            leaseEnd: unit.leaseTo || null
          });
        }
      }

      // Import expenses data
      if (dealData.expenses) {
        for (const [expenseKey, expenseValue] of Object.entries(dealData.expenses)) {
          if (typeof expenseValue === 'number' && expenseValue > 0) {
            await this.createPropertyExpenses({
              propertyId,
              expenseType: this.getExpenseCategory(expenseKey),
              expenseName: this.formatExpenseName(expenseKey),
              annualAmount: expenseValue.toString(),
              isPercentage: false
            });
          }
        }
      }

      // Import rehab budget data
      if (dealData.rehabBudgetSections) {
        for (const [sectionName, items] of Object.entries(dealData.rehabBudgetSections)) {
          if (Array.isArray(items)) {
            for (const item of items) {
              await this.createPropertyRehabBudget({
                propertyId,
                section: sectionName,
                category: item.category || "Uncategorized",
                perUnitCost: item.perUnitCost?.toString() || "0",
                quantity: item.quantity || 1,
                totalCost: item.totalCost?.toString() || "0",
                spentAmount: item.spentAmount?.toString() || "0",
                completionStatus: this.getRehabCompletionStatus(item)
              });
            }
          }
        }
      }

      // Import closing costs
      if (dealData.closingCosts) {
        for (const [costKey, costValue] of Object.entries(dealData.closingCosts)) {
          if (typeof costValue === 'number') {
            await this.createPropertyClosingCosts({
              propertyId,
              costType: this.formatExpenseName(costKey),
              amount: costValue.toString(),
              description: `${this.formatExpenseName(costKey)} from Deal Analyzer import`
            });
          }
        }
      }

      // Import holding costs
      if (dealData.holdingCosts) {
        for (const [costKey, costValue] of Object.entries(dealData.holdingCosts)) {
          if (typeof costValue === 'number' && costValue > 0) {
            await this.createPropertyHoldingCosts({
              propertyId,
              costType: this.formatExpenseName(costKey),
              amount: costValue.toString(),
              description: `${this.formatExpenseName(costKey)} during holding period`
            });
          }
        }
      }
    } catch (error) {
      console.error(`Error importing normalized data for property ${propertyId}:`, error);
      throw error;
    }
  }

  // Bank account operations
  async getBankAccounts(userId: number): Promise<BankAccount[]> {
    return await db.select().from(bankAccountsTable).where(eq(bankAccountsTable.userId, userId));
  }

  async getBankAccount(userId: number, accountId: number): Promise<BankAccount | undefined> {
    const result = await db.select().from(bankAccountsTable)
      .where(and(eq(bankAccountsTable.userId, userId), eq(bankAccountsTable.id, accountId)));
    return result[0];
  }

  async createBankAccount(bankAccount: NewBankAccount): Promise<BankAccount> {
    const result = await db.insert(bankAccountsTable).values(bankAccount).returning();
    return result[0];
  }

  async updateBankAccountBalance(accountId: number, balanceData: any): Promise<BankAccount | undefined> {
    const result = await db.update(bankAccountsTable)
      .set({
        currentBalance: balanceData.currentBalance,
        availableBalance: balanceData.availableBalance,
        lastUpdated: balanceData.lastUpdated || new Date()
      })
      .where(eq(bankAccountsTable.id, accountId))
      .returning();
    return result[0];
  }

  // Transaction operations
  async getTransactions(userId: number, accountId?: number): Promise<Transaction[]> {
    let query = db.select().from(transactionsTable).where(eq(transactionsTable.userId, userId));
    
    if (accountId) {
      query = query.where(eq(transactionsTable.bankAccountId, accountId));
    }
    
    return await query.orderBy(desc(transactionsTable.date));
  }

  async createTransaction(transaction: NewTransaction): Promise<Transaction> {
    const result = await db.insert(transactionsTable).values(transaction).returning();
    return result[0];
  }
}

export const storage = new DatabaseStorage();
