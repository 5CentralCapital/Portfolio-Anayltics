import { 
  properties, 
  propertyAssumptions,
  unitTypes,
  rentRoll,
  rehabSections,
  closingCosts,
  holdingCosts,
  propertyExpenses,
  propertyIncome,
  loans,
  exitAnalysis,
  monthlyProforma,
  entities,
  entityMemberships,
  users,
  complianceRequirements,
  type Property,
  type InsertProperty,
  type PropertyAssumptions,
  type InsertPropertyAssumptions,
  type UnitType,
  type InsertUnitType,
  type RentRoll,
  type InsertRentRoll,
  type RehabSection,
  type InsertRehabSection,
  type ClosingCost,
  type InsertClosingCost,
  type HoldingCost,
  type InsertHoldingCost,
  type PropertyExpense,
  type InsertPropertyExpense,
  type PropertyIncome,
  type InsertPropertyIncome,
  type Loan,
  type InsertLoan,
  type ExitAnalysis,
  type InsertExitAnalysis,
  type MonthlyProforma,
  type InsertMonthlyProforma,
  type Entity,
  type InsertEntity,
  type EntityMembership,
  type InsertEntityMembership,
  type User,
  type UpsertUser,
  type ComplianceRequirement,
  type InsertComplianceRequirement
} from "@shared/schema-new";
import { db } from "./db";
import { eq, and, desc, asc } from "drizzle-orm";

export interface PropertyWithRelations extends Property {
  assumptions?: PropertyAssumptions;
  unitTypes?: UnitType[];
  rentRoll?: RentRoll[];
  rehabSections?: RehabSection[];
  closingCosts?: ClosingCost[];
  holdingCosts?: HoldingCost[];
  expenses?: PropertyExpense[];
  income?: PropertyIncome[];
  loans?: Loan[];
  exitAnalysis?: ExitAnalysis;
  proforma?: MonthlyProforma[];
}

export interface DealAnalyzerImportData {
  propertyName: string;
  propertyAddress: string;
  assumptions: {
    unitCount: number;
    purchasePrice: number;
    loanPercentage: number;
    interestRate: number;
    loanTermYears: number;
    vacancyRate: number;
    expenseRatio: number;
    marketCapRate: number;
    refinanceLTV: number;
    refinanceInterestRate: number;
    refinanceClosingCostPercent: number;
    dscrThreshold: number;
  };
  rehabBudgetSections: {
    [sectionName: string]: Array<{
      id: number;
      category: string;
      perUnitCost: string;
      quantity: string;
      totalCost: number;
      spentAmount?: number;
    }>;
  };
  closingCosts?: Array<{
    category: string;
    amount: number;
    percentage?: number;
  }>;
  holdingCosts?: Array<{
    category: string;
    monthlyAmount: number;
    totalAmount: number;
  }>;
  rentRoll?: Array<{
    unit: string;
    unitType: string;
    currentRent: number;
    proFormaRent: number;
    squareFootage?: number;
  }>;
  incomeAndExpenses?: {
    operatingExpenses: Array<{
      category: string;
      annualAmount: number;
      monthlyAmount: number;
    }>;
    otherIncome?: Array<{
      category: string;
      annualAmount: number;
      monthlyAmount: number;
    }>;
  };
  financing?: {
    loans: Array<{
      id: number;
      name: string;
      amount: number;
      interestRate: number;
      termYears: number;
      monthlyPayment: number;
      loanType: string;
      paymentType: string;
      isActive: boolean;
    }>;
  };
  exitAnalysis?: {
    salesCapRate: number;
    saleFactor: number;
    saleCostsPercent: number;
    holdPeriodYears: number;
  };
  proforma?: Array<{
    month: number;
    grossRent: number;
    vacancy: number;
    effectiveIncome: number;
    operatingExpenses: number;
    noi: number;
    debtService: number;
    cashFlow: number;
  }>;
}

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Entity operations
  getEntities(): Promise<Entity[]>;
  getEntity(id: number): Promise<Entity | undefined>;
  createEntity(entity: InsertEntity): Promise<Entity>;
  updateEntity(id: number, entity: Partial<InsertEntity>): Promise<Entity | undefined>;
  deleteEntity(id: number): Promise<void>;

  // Entity membership operations
  getEntityMemberships(entityId: number): Promise<EntityMembership[]>;
  getUserEntityMemberships(userId: string): Promise<EntityMembership[]>;
  createEntityMembership(membership: InsertEntityMembership): Promise<EntityMembership>;
  updateEntityMembership(id: number, membership: Partial<InsertEntityMembership>): Promise<EntityMembership | undefined>;
  deleteEntityMembership(id: number): Promise<void>;

  // Compliance operations
  getComplianceRequirements(entityId: number): Promise<ComplianceRequirement[]>;
  createComplianceRequirement(requirement: InsertComplianceRequirement): Promise<ComplianceRequirement>;
  updateComplianceRequirement(id: number, requirement: Partial<InsertComplianceRequirement>): Promise<ComplianceRequirement | undefined>;
  deleteComplianceRequirement(id: number): Promise<void>;

  // Property operations
  getProperties(): Promise<Property[]>;
  getPropertiesForUser(userId: string): Promise<Property[]>;
  getProperty(id: number): Promise<PropertyWithRelations | undefined>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(id: number, property: Partial<InsertProperty>): Promise<Property | undefined>;
  deleteProperty(id: number): Promise<void>;

  // Property component operations
  createPropertyAssumptions(assumptions: InsertPropertyAssumptions): Promise<PropertyAssumptions>;
  updatePropertyAssumptions(propertyId: number, assumptions: Partial<InsertPropertyAssumptions>): Promise<PropertyAssumptions | undefined>;
  
  createUnitType(unitType: InsertUnitType): Promise<UnitType>;
  getUnitTypes(propertyId: number): Promise<UnitType[]>;
  updateUnitType(id: number, unitType: Partial<InsertUnitType>): Promise<UnitType | undefined>;
  deleteUnitType(id: number): Promise<void>;

  createRentRoll(rentRoll: InsertRentRoll): Promise<RentRoll>;
  getRentRoll(propertyId: number): Promise<RentRoll[]>;
  updateRentRoll(id: number, rentRoll: Partial<InsertRentRoll>): Promise<RentRoll | undefined>;
  deleteRentRoll(id: number): Promise<void>;

  createRehabSection(rehabSection: InsertRehabSection): Promise<RehabSection>;
  getRehabSections(propertyId: number): Promise<RehabSection[]>;
  updateRehabSection(id: number, rehabSection: Partial<InsertRehabSection>): Promise<RehabSection | undefined>;
  deleteRehabSection(id: number): Promise<void>;

  createClosingCost(closingCost: InsertClosingCost): Promise<ClosingCost>;
  getClosingCosts(propertyId: number): Promise<ClosingCost[]>;
  updateClosingCost(id: number, closingCost: Partial<InsertClosingCost>): Promise<ClosingCost | undefined>;
  deleteClosingCost(id: number): Promise<void>;

  createHoldingCost(holdingCost: InsertHoldingCost): Promise<HoldingCost>;
  getHoldingCosts(propertyId: number): Promise<HoldingCost[]>;
  updateHoldingCost(id: number, holdingCost: Partial<InsertHoldingCost>): Promise<HoldingCost | undefined>;
  deleteHoldingCost(id: number): Promise<void>;

  createPropertyExpense(expense: InsertPropertyExpense): Promise<PropertyExpense>;
  getPropertyExpenses(propertyId: number): Promise<PropertyExpense[]>;
  updatePropertyExpense(id: number, expense: Partial<InsertPropertyExpense>): Promise<PropertyExpense | undefined>;
  deletePropertyExpense(id: number): Promise<void>;

  createPropertyIncome(income: InsertPropertyIncome): Promise<PropertyIncome>;
  getPropertyIncome(propertyId: number): Promise<PropertyIncome[]>;
  updatePropertyIncome(id: number, income: Partial<InsertPropertyIncome>): Promise<PropertyIncome | undefined>;
  deletePropertyIncome(id: number): Promise<void>;

  createLoan(loan: InsertLoan): Promise<Loan>;
  getLoans(propertyId: number): Promise<Loan[]>;
  updateLoan(id: number, loan: Partial<InsertLoan>): Promise<Loan | undefined>;
  deleteLoan(id: number): Promise<void>;

  createExitAnalysis(exitAnalysis: InsertExitAnalysis): Promise<ExitAnalysis>;
  updateExitAnalysis(propertyId: number, exitAnalysis: Partial<InsertExitAnalysis>): Promise<ExitAnalysis | undefined>;

  createMonthlyProforma(proforma: InsertMonthlyProforma): Promise<MonthlyProforma>;
  getMonthlyProforma(propertyId: number): Promise<MonthlyProforma[]>;
  updateMonthlyProforma(id: number, proforma: Partial<InsertMonthlyProforma>): Promise<MonthlyProforma | undefined>;
  deleteMonthlyProforma(id: number): Promise<void>;

  // Deal Analyzer import
  importFromDealAnalyzer(dealData: DealAnalyzerImportData, entityId: number, additionalData?: {
    acquisitionDate?: Date;
    broker?: string;
    legalNotes?: string;
  }): Promise<PropertyWithRelations>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Entity operations
  async getEntities(): Promise<Entity[]> {
    return await db.select().from(entities).orderBy(asc(entities.name));
  }

  async getEntity(id: number): Promise<Entity | undefined> {
    const [entity] = await db.select().from(entities).where(eq(entities.id, id));
    return entity;
  }

  async createEntity(entity: InsertEntity): Promise<Entity> {
    const [newEntity] = await db.insert(entities).values(entity).returning();
    return newEntity;
  }

  async updateEntity(id: number, entity: Partial<InsertEntity>): Promise<Entity | undefined> {
    const [updatedEntity] = await db
      .update(entities)
      .set({ ...entity, updatedAt: new Date() })
      .where(eq(entities.id, id))
      .returning();
    return updatedEntity;
  }

  async deleteEntity(id: number): Promise<void> {
    await db.delete(entities).where(eq(entities.id, id));
  }

  // Entity membership operations
  async getEntityMemberships(entityId: number): Promise<EntityMembership[]> {
    return await db.select().from(entityMemberships).where(eq(entityMemberships.entityId, entityId));
  }

  async getUserEntityMemberships(userId: string): Promise<EntityMembership[]> {
    return await db.select().from(entityMemberships).where(eq(entityMemberships.userId, userId));
  }

  async createEntityMembership(membership: InsertEntityMembership): Promise<EntityMembership> {
    const [newMembership] = await db.insert(entityMemberships).values(membership).returning();
    return newMembership;
  }

  async updateEntityMembership(id: number, membership: Partial<InsertEntityMembership>): Promise<EntityMembership | undefined> {
    const [updatedMembership] = await db
      .update(entityMemberships)
      .set(membership)
      .where(eq(entityMemberships.id, id))
      .returning();
    return updatedMembership;
  }

  async deleteEntityMembership(id: number): Promise<void> {
    await db.delete(entityMemberships).where(eq(entityMemberships.id, id));
  }

  // Compliance operations
  async getComplianceRequirements(entityId: number): Promise<ComplianceRequirement[]> {
    return await db.select().from(complianceRequirements).where(eq(complianceRequirements.entityId, entityId));
  }

  async createComplianceRequirement(requirement: InsertComplianceRequirement): Promise<ComplianceRequirement> {
    const [newRequirement] = await db.insert(complianceRequirements).values(requirement).returning();
    return newRequirement;
  }

  async updateComplianceRequirement(id: number, requirement: Partial<InsertComplianceRequirement>): Promise<ComplianceRequirement | undefined> {
    const [updatedRequirement] = await db
      .update(complianceRequirements)
      .set({ ...requirement, updatedAt: new Date() })
      .where(eq(complianceRequirements.id, id))
      .returning();
    return updatedRequirement;
  }

  async deleteComplianceRequirement(id: number): Promise<void> {
    await db.delete(complianceRequirements).where(eq(complianceRequirements.id, id));
  }

  // Property operations
  async getProperties(): Promise<Property[]> {
    return await db.select().from(properties).orderBy(desc(properties.createdAt));
  }

  async getPropertiesForUser(userId: string): Promise<Property[]> {
    // Get user's entity memberships first
    const memberships = await this.getUserEntityMemberships(userId);
    const entityIds = memberships.map(m => m.entityId).filter(Boolean) as number[];
    
    if (entityIds.length === 0) {
      return [];
    }

    // Get properties for user's entities
    const userProperties = await db.select()
      .from(properties)
      .where(
        entityIds.length === 1 
          ? eq(properties.entityId, entityIds[0])
          : eq(properties.entityId, entityIds[0]) // TODO: Add proper IN clause support
      )
      .orderBy(desc(properties.createdAt));

    return userProperties;
  }

  async getProperty(id: number): Promise<PropertyWithRelations | undefined> {
    const [property] = await db.select().from(properties).where(eq(properties.id, id));
    if (!property) return undefined;

    // Load all related data
    const [assumptions] = await db.select().from(propertyAssumptions).where(eq(propertyAssumptions.propertyId, id));
    const unitTypesData = await db.select().from(unitTypes).where(eq(unitTypes.propertyId, id));
    const rentRollData = await db.select().from(rentRoll).where(eq(rentRoll.propertyId, id));
    const rehabSectionsData = await db.select().from(rehabSections).where(eq(rehabSections.propertyId, id));
    const closingCostsData = await db.select().from(closingCosts).where(eq(closingCosts.propertyId, id));
    const holdingCostsData = await db.select().from(holdingCosts).where(eq(holdingCosts.propertyId, id));
    const expensesData = await db.select().from(propertyExpenses).where(eq(propertyExpenses.propertyId, id));
    const incomeData = await db.select().from(propertyIncome).where(eq(propertyIncome.propertyId, id));
    const loansData = await db.select().from(loans).where(eq(loans.propertyId, id));
    const [exitAnalysisData] = await db.select().from(exitAnalysis).where(eq(exitAnalysis.propertyId, id));
    const proformaData = await db.select().from(monthlyProforma).where(eq(monthlyProforma.propertyId, id)).orderBy(asc(monthlyProforma.month));

    return {
      ...property,
      assumptions,
      unitTypes: unitTypesData,
      rentRoll: rentRollData,
      rehabSections: rehabSectionsData,
      closingCosts: closingCostsData,
      holdingCosts: holdingCostsData,
      expenses: expensesData,
      income: incomeData,
      loans: loansData,
      exitAnalysis: exitAnalysisData,
      proforma: proformaData,
    };
  }

  async createProperty(property: InsertProperty): Promise<Property> {
    const [newProperty] = await db.insert(properties).values(property).returning();
    return newProperty;
  }

  async updateProperty(id: number, property: Partial<InsertProperty>): Promise<Property | undefined> {
    const updateData = { ...property };
    delete (updateData as any).createdAt;
    delete (updateData as any).id;

    const [updatedProperty] = await db
      .update(properties)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(properties.id, id))
      .returning();
    return updatedProperty;
  }

  async deleteProperty(id: number): Promise<void> {
    // Delete all related data first
    await db.delete(propertyAssumptions).where(eq(propertyAssumptions.propertyId, id));
    await db.delete(unitTypes).where(eq(unitTypes.propertyId, id));
    await db.delete(rentRoll).where(eq(rentRoll.propertyId, id));
    await db.delete(rehabSections).where(eq(rehabSections.propertyId, id));
    await db.delete(closingCosts).where(eq(closingCosts.propertyId, id));
    await db.delete(holdingCosts).where(eq(holdingCosts.propertyId, id));
    await db.delete(propertyExpenses).where(eq(propertyExpenses.propertyId, id));
    await db.delete(propertyIncome).where(eq(propertyIncome.propertyId, id));
    await db.delete(loans).where(eq(loans.propertyId, id));
    await db.delete(exitAnalysis).where(eq(exitAnalysis.propertyId, id));
    await db.delete(monthlyProforma).where(eq(monthlyProforma.propertyId, id));
    
    // Finally delete the property
    await db.delete(properties).where(eq(properties.id, id));
  }

  // Property assumptions
  async createPropertyAssumptions(assumptions: InsertPropertyAssumptions): Promise<PropertyAssumptions> {
    const [newAssumptions] = await db.insert(propertyAssumptions).values(assumptions).returning();
    return newAssumptions;
  }

  async updatePropertyAssumptions(propertyId: number, assumptions: Partial<InsertPropertyAssumptions>): Promise<PropertyAssumptions | undefined> {
    const [updatedAssumptions] = await db
      .update(propertyAssumptions)
      .set({ ...assumptions, updatedAt: new Date() })
      .where(eq(propertyAssumptions.propertyId, propertyId))
      .returning();
    return updatedAssumptions;
  }

  // Unit types
  async createUnitType(unitType: InsertUnitType): Promise<UnitType> {
    const [newUnitType] = await db.insert(unitTypes).values(unitType).returning();
    return newUnitType;
  }

  async getUnitTypes(propertyId: number): Promise<UnitType[]> {
    return await db.select().from(unitTypes).where(eq(unitTypes.propertyId, propertyId));
  }

  async updateUnitType(id: number, unitType: Partial<InsertUnitType>): Promise<UnitType | undefined> {
    const [updatedUnitType] = await db
      .update(unitTypes)
      .set(unitType)
      .where(eq(unitTypes.id, id))
      .returning();
    return updatedUnitType;
  }

  async deleteUnitType(id: number): Promise<void> {
    await db.delete(unitTypes).where(eq(unitTypes.id, id));
  }

  // Rent roll
  async createRentRoll(rentRollData: InsertRentRoll): Promise<RentRoll> {
    const [newRentRoll] = await db.insert(rentRoll).values(rentRollData).returning();
    return newRentRoll;
  }

  async getRentRoll(propertyId: number): Promise<RentRoll[]> {
    return await db.select().from(rentRoll).where(eq(rentRoll.propertyId, propertyId));
  }

  async updateRentRoll(id: number, rentRollData: Partial<InsertRentRoll>): Promise<RentRoll | undefined> {
    const [updatedRentRoll] = await db
      .update(rentRoll)
      .set({ ...rentRollData, updatedAt: new Date() })
      .where(eq(rentRoll.id, id))
      .returning();
    return updatedRentRoll;
  }

  async deleteRentRoll(id: number): Promise<void> {
    await db.delete(rentRoll).where(eq(rentRoll.id, id));
  }

  // Rehab sections
  async createRehabSection(rehabSection: InsertRehabSection): Promise<RehabSection> {
    const [newRehabSection] = await db.insert(rehabSections).values(rehabSection).returning();
    return newRehabSection;
  }

  async getRehabSections(propertyId: number): Promise<RehabSection[]> {
    return await db.select().from(rehabSections).where(eq(rehabSections.propertyId, propertyId));
  }

  async updateRehabSection(id: number, rehabSection: Partial<InsertRehabSection>): Promise<RehabSection | undefined> {
    const [updatedRehabSection] = await db
      .update(rehabSections)
      .set({ ...rehabSection, updatedAt: new Date() })
      .where(eq(rehabSections.id, id))
      .returning();
    return updatedRehabSection;
  }

  async deleteRehabSection(id: number): Promise<void> {
    await db.delete(rehabSections).where(eq(rehabSections.id, id));
  }

  // Closing costs
  async createClosingCost(closingCost: InsertClosingCost): Promise<ClosingCost> {
    const [newClosingCost] = await db.insert(closingCosts).values(closingCost).returning();
    return newClosingCost;
  }

  async getClosingCosts(propertyId: number): Promise<ClosingCost[]> {
    return await db.select().from(closingCosts).where(eq(closingCosts.propertyId, propertyId));
  }

  async updateClosingCost(id: number, closingCost: Partial<InsertClosingCost>): Promise<ClosingCost | undefined> {
    const [updatedClosingCost] = await db
      .update(closingCosts)
      .set(closingCost)
      .where(eq(closingCosts.id, id))
      .returning();
    return updatedClosingCost;
  }

  async deleteClosingCost(id: number): Promise<void> {
    await db.delete(closingCosts).where(eq(closingCosts.id, id));
  }

  // Holding costs
  async createHoldingCost(holdingCost: InsertHoldingCost): Promise<HoldingCost> {
    const [newHoldingCost] = await db.insert(holdingCosts).values(holdingCost).returning();
    return newHoldingCost;
  }

  async getHoldingCosts(propertyId: number): Promise<HoldingCost[]> {
    return await db.select().from(holdingCosts).where(eq(holdingCosts.propertyId, propertyId));
  }

  async updateHoldingCost(id: number, holdingCost: Partial<InsertHoldingCost>): Promise<HoldingCost | undefined> {
    const [updatedHoldingCost] = await db
      .update(holdingCosts)
      .set(holdingCost)
      .where(eq(holdingCosts.id, id))
      .returning();
    return updatedHoldingCost;
  }

  async deleteHoldingCost(id: number): Promise<void> {
    await db.delete(holdingCosts).where(eq(holdingCosts.id, id));
  }

  // Property expenses
  async createPropertyExpense(expense: InsertPropertyExpense): Promise<PropertyExpense> {
    const [newExpense] = await db.insert(propertyExpenses).values(expense).returning();
    return newExpense;
  }

  async getPropertyExpenses(propertyId: number): Promise<PropertyExpense[]> {
    return await db.select().from(propertyExpenses).where(eq(propertyExpenses.propertyId, propertyId));
  }

  async updatePropertyExpense(id: number, expense: Partial<InsertPropertyExpense>): Promise<PropertyExpense | undefined> {
    const [updatedExpense] = await db
      .update(propertyExpenses)
      .set({ ...expense, updatedAt: new Date() })
      .where(eq(propertyExpenses.id, id))
      .returning();
    return updatedExpense;
  }

  async deletePropertyExpense(id: number): Promise<void> {
    await db.delete(propertyExpenses).where(eq(propertyExpenses.id, id));
  }

  // Property income
  async createPropertyIncome(income: InsertPropertyIncome): Promise<PropertyIncome> {
    const [newIncome] = await db.insert(propertyIncome).values(income).returning();
    return newIncome;
  }

  async getPropertyIncome(propertyId: number): Promise<PropertyIncome[]> {
    return await db.select().from(propertyIncome).where(eq(propertyIncome.propertyId, propertyId));
  }

  async updatePropertyIncome(id: number, income: Partial<InsertPropertyIncome>): Promise<PropertyIncome | undefined> {
    const [updatedIncome] = await db
      .update(propertyIncome)
      .set({ ...income, updatedAt: new Date() })
      .where(eq(propertyIncome.id, id))
      .returning();
    return updatedIncome;
  }

  async deletePropertyIncome(id: number): Promise<void> {
    await db.delete(propertyIncome).where(eq(propertyIncome.id, id));
  }

  // Loans
  async createLoan(loan: InsertLoan): Promise<Loan> {
    const [newLoan] = await db.insert(loans).values(loan).returning();
    return newLoan;
  }

  async getLoans(propertyId: number): Promise<Loan[]> {
    return await db.select().from(loans).where(eq(loans.propertyId, propertyId));
  }

  async updateLoan(id: number, loan: Partial<InsertLoan>): Promise<Loan | undefined> {
    const [updatedLoan] = await db
      .update(loans)
      .set({ ...loan, updatedAt: new Date() })
      .where(eq(loans.id, id))
      .returning();
    return updatedLoan;
  }

  async deleteLoan(id: number): Promise<void> {
    await db.delete(loans).where(eq(loans.id, id));
  }

  // Exit analysis
  async createExitAnalysis(exitAnalysisData: InsertExitAnalysis): Promise<ExitAnalysis> {
    const [newExitAnalysis] = await db.insert(exitAnalysis).values(exitAnalysisData).returning();
    return newExitAnalysis;
  }

  async updateExitAnalysis(propertyId: number, exitAnalysisData: Partial<InsertExitAnalysis>): Promise<ExitAnalysis | undefined> {
    const [updatedExitAnalysis] = await db
      .update(exitAnalysis)
      .set({ ...exitAnalysisData, updatedAt: new Date() })
      .where(eq(exitAnalysis.propertyId, propertyId))
      .returning();
    return updatedExitAnalysis;
  }

  // Monthly proforma
  async createMonthlyProforma(proforma: InsertMonthlyProforma): Promise<MonthlyProforma> {
    const [newProforma] = await db.insert(monthlyProforma).values(proforma).returning();
    return newProforma;
  }

  async getMonthlyProforma(propertyId: number): Promise<MonthlyProforma[]> {
    return await db.select().from(monthlyProforma).where(eq(monthlyProforma.propertyId, propertyId)).orderBy(asc(monthlyProforma.month));
  }

  async updateMonthlyProforma(id: number, proforma: Partial<InsertMonthlyProforma>): Promise<MonthlyProforma | undefined> {
    const [updatedProforma] = await db
      .update(monthlyProforma)
      .set({ ...proforma, updatedAt: new Date() })
      .where(eq(monthlyProforma.id, id))
      .returning();
    return updatedProforma;
  }

  async deleteMonthlyProforma(id: number): Promise<void> {
    await db.delete(monthlyProforma).where(eq(monthlyProforma.id, id));
  }

  // Deal Analyzer import
  async importFromDealAnalyzer(
    dealData: DealAnalyzerImportData, 
    entityId: number, 
    additionalData?: {
      acquisitionDate?: Date;
      broker?: string;
      legalNotes?: string;
    }
  ): Promise<PropertyWithRelations> {
    // Calculate financial metrics from deal data
    const totalRehabCost = Object.values(dealData.rehabBudgetSections || {})
      .flat()
      .reduce((sum, item) => sum + (item.totalCost || 0), 0);

    const totalClosingCosts = (dealData.closingCosts || [])
      .reduce((sum, cost) => sum + (cost.amount || 0), 0);

    const initialCapital = dealData.assumptions.purchasePrice + totalRehabCost + totalClosingCosts;

    // Calculate ARV from exit analysis or use default
    let arv = dealData.assumptions.purchasePrice * 1.3; // Default 30% uplift
    if (dealData.exitAnalysis?.salesCapRate) {
      // Calculate NOI from proforma or rent roll
      let annualNOI = 0;
      if (dealData.proforma && dealData.proforma.length > 0) {
        annualNOI = dealData.proforma.reduce((sum, month) => sum + (month.noi || 0), 0);
      }
      if (annualNOI > 0) {
        arv = annualNOI / (dealData.exitAnalysis.salesCapRate / 100);
      }
    }

    // Calculate cash flow from proforma
    let monthlyCashFlow = 0;
    let annualCashFlow = 0;
    if (dealData.proforma && dealData.proforma.length > 0) {
      annualCashFlow = dealData.proforma.reduce((sum, month) => sum + (month.cashFlow || 0), 0);
      monthlyCashFlow = annualCashFlow / 12;
    }

    // Calculate cash-on-cash return
    const cashOnCashReturn = initialCapital > 0 ? (annualCashFlow / initialCapital) * 100 : 0;

    // Create the main property record
    const propertyData: InsertProperty = {
      entityId,
      name: dealData.propertyName,
      address: dealData.propertyAddress,
      city: dealData.propertyAddress.split(' ').slice(-2, -1)[0] || '',
      state: dealData.propertyAddress.split(' ').slice(-1)[0] || '',
      unitCount: dealData.assumptions.unitCount,
      purchasePrice: dealData.assumptions.purchasePrice.toString(),
      arv: arv.toString(),
      rehabBudget: totalRehabCost.toString(),
      initialCapital: initialCapital.toString(),
      monthlyCashFlow: monthlyCashFlow.toString(),
      annualCashFlow: annualCashFlow.toString(),
      cashOnCashReturn: cashOnCashReturn.toString(),
      status: 'Under Contract',
      acquisitionDate: additionalData?.acquisitionDate,
      broker: additionalData?.broker,
      legalNotes: additionalData?.legalNotes,
    };

    const property = await this.createProperty(propertyData);

    // Create assumptions
    await this.createPropertyAssumptions({
      propertyId: property.id,
      loanPercentage: dealData.assumptions.loanPercentage.toString(),
      interestRate: dealData.assumptions.interestRate.toString(),
      termYears: dealData.assumptions.loanTermYears,
      vacancyRate: dealData.assumptions.vacancyRate.toString(),
      expenseRatio: dealData.assumptions.expenseRatio.toString(),
      marketCapRate: dealData.assumptions.marketCapRate.toString(),
      refinanceLTV: dealData.assumptions.refinanceLTV.toString(),
      refinanceInterestRate: dealData.assumptions.refinanceInterestRate.toString(),
      refinanceClosingCostPercent: dealData.assumptions.refinanceClosingCostPercent.toString(),
      dscrThreshold: dealData.assumptions.dscrThreshold.toString(),
    });

    // Create unit types and rent roll
    if (dealData.rentRoll && dealData.rentRoll.length > 0) {
      const unitTypeMap = new Map<string, number>();
      
      // Create unique unit types
      const uniqueUnitTypes = [...new Set(dealData.rentRoll.map(unit => unit.unitType))];
      for (const unitTypeName of uniqueUnitTypes) {
        const sampleUnit = dealData.rentRoll.find(unit => unit.unitType === unitTypeName);
        const unitType = await this.createUnitType({
          propertyId: property.id,
          name: unitTypeName,
          marketRent: sampleUnit?.proFormaRent?.toString() || '0',
        });
        unitTypeMap.set(unitTypeName, unitType.id);
      }

      // Create rent roll entries
      for (const unit of dealData.rentRoll) {
        const unitTypeId = unitTypeMap.get(unit.unitType);
        await this.createRentRoll({
          propertyId: property.id,
          unitTypeId,
          unit: unit.unit,
          currentRent: unit.currentRent.toString(),
          proFormaRent: unit.proFormaRent.toString(),
          squareFootage: unit.squareFootage,
        });
      }
    }

    // Create rehab sections
    if (dealData.rehabBudgetSections) {
      for (const [sectionName, items] of Object.entries(dealData.rehabBudgetSections)) {
        for (const item of items) {
          await this.createRehabSection({
            propertyId: property.id,
            section: sectionName,
            category: item.category,
            perUnitCost: item.perUnitCost,
            quantity: parseInt(item.quantity),
            totalCost: item.totalCost.toString(),
            spentAmount: (item.spentAmount || 0).toString(),
            completed: (item.spentAmount || 0) >= item.totalCost,
          });
        }
      }
    }

    // Create closing costs
    if (dealData.closingCosts) {
      for (const cost of dealData.closingCosts) {
        await this.createClosingCost({
          propertyId: property.id,
          category: cost.category,
          amount: cost.amount.toString(),
          percentage: cost.percentage?.toString(),
        });
      }
    }

    // Create holding costs
    if (dealData.holdingCosts) {
      for (const cost of dealData.holdingCosts) {
        await this.createHoldingCost({
          propertyId: property.id,
          category: cost.category,
          monthlyAmount: cost.monthlyAmount.toString(),
          totalAmount: cost.totalAmount.toString(),
        });
      }
    }

    // Create expenses
    if (dealData.incomeAndExpenses?.operatingExpenses) {
      for (const expense of dealData.incomeAndExpenses.operatingExpenses) {
        await this.createPropertyExpense({
          propertyId: property.id,
          category: expense.category,
          annualAmount: expense.annualAmount.toString(),
          monthlyAmount: expense.monthlyAmount.toString(),
        });
      }
    }

    // Create other income
    if (dealData.incomeAndExpenses?.otherIncome) {
      for (const income of dealData.incomeAndExpenses.otherIncome) {
        await this.createPropertyIncome({
          propertyId: property.id,
          category: income.category,
          annualAmount: income.annualAmount.toString(),
          monthlyAmount: income.monthlyAmount.toString(),
        });
      }
    }

    // Create loans
    if (dealData.financing?.loans) {
      for (const loan of dealData.financing.loans) {
        await this.createLoan({
          propertyId: property.id,
          name: loan.name,
          amount: loan.amount.toString(),
          interestRate: loan.interestRate.toString(),
          termYears: loan.termYears,
          monthlyPayment: loan.monthlyPayment.toString(),
          loanType: loan.loanType,
          paymentType: loan.paymentType,
          isActive: loan.isActive,
        });
      }
    }

    // Create exit analysis
    if (dealData.exitAnalysis) {
      await this.createExitAnalysis({
        propertyId: property.id,
        salesCapRate: dealData.exitAnalysis.salesCapRate.toString(),
        saleFactor: dealData.exitAnalysis.saleFactor.toString(),
        saleCostsPercent: dealData.exitAnalysis.saleCostsPercent.toString(),
        holdPeriodYears: dealData.exitAnalysis.holdPeriodYears,
        projectedSalePrice: arv.toString(),
      });
    }

    // Create 12-month proforma
    if (dealData.proforma) {
      for (const monthData of dealData.proforma) {
        await this.createMonthlyProforma({
          propertyId: property.id,
          month: monthData.month,
          grossRent: monthData.grossRent.toString(),
          vacancy: monthData.vacancy.toString(),
          effectiveIncome: monthData.effectiveIncome.toString(),
          operatingExpenses: monthData.operatingExpenses.toString(),
          noi: monthData.noi.toString(),
          debtService: monthData.debtService.toString(),
          cashFlow: monthData.cashFlow.toString(),
        });
      }
    }

    // Return the complete property with relations
    return this.getProperty(property.id) as Promise<PropertyWithRelations>;
  }
}

export const storage = new DatabaseStorage();