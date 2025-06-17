import { db } from "./db";
import { users, properties, companyMetrics, investorLeads, sessions } from "@shared/schema";
import type { 
  User, 
  InsertUser, 
  Property, 
  InsertProperty, 
  CompanyMetric, 
  InsertCompanyMetric,
  InvestorLead,
  InsertInvestorLead 
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
    let query = db.select().from(companyMetrics);
    
    if (startDate && endDate) {
      query = query.where(
        and(
          gte(companyMetrics.metricDate, startDate),
          lte(companyMetrics.metricDate, endDate)
        )
      );
    }
    
    return await query.orderBy(desc(companyMetrics.metricDate));
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
    let query = db.select().from(investorLeads);
    
    if (status) {
      query = query.where(eq(investorLeads.status, status as any));
    }
    
    return await query.orderBy(desc(investorLeads.createdAt)).limit(limit);
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
}

export const storage = new DatabaseStorage();
