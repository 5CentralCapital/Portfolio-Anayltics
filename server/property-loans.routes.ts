/**
 * Property Loans API Routes
 * Handles CRUD operations for property loan data from PDF uploads
 */

import { Router } from 'express';
import { db } from './db';
import { propertyLoans, properties } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { InferInsertModel } from 'drizzle-orm';
import { z } from 'zod';

// Helper function to safely convert dates for PostgreSQL
function parseDate(dateValue: any): Date | null {
  if (!dateValue) return null;
  if (dateValue instanceof Date) return dateValue;
  
  // Handle different date formats
  if (typeof dateValue === 'string') {
    const parsedDate = new Date(dateValue);
    return isNaN(parsedDate.getTime()) ? null : parsedDate;
  }
  
  return null;
}
// Authentication middleware
function authenticateSession(req: any, res: any, next: any) {
  // First try session-based authentication
  if (req.session && req.session.userId) {
    req.session.user = { id: req.session.userId, email: req.session.userEmail };
    return next();
  }

  return res.status(401).json({ error: 'Authentication required' });
}

// Drizzle inferred type for an insert row
type NewLoan = InferInsertModel<typeof propertyLoans>;

// Runtime validation schema (loosely mirrors table definition)
const loanInputSchema = z.object({
  loanName: z.string().default('New Loan'),
  loanType: z.enum(['acquisition', 'refinance', 'construction', 'bridge', 'mezzanine']).default('acquisition'),
  originalAmount: z.union([z.string(), z.number()]).default('0'),
  currentBalance: z.union([z.string(), z.number()]).default('0'),
  interestRate: z.union([z.string(), z.number()]).default('0'),
  termYears: z.number().int().default(30),
  monthlyPayment: z.union([z.string(), z.number()]).default('0'),
  paymentType: z.enum(['principal_and_interest', 'interest_only']).default('principal_and_interest'),
  maturityDate: z.preprocess((v) => typeof v === 'string' ? new Date(v) : v, z.date()).optional(),
  isActive: z.boolean().default(false),
  lender: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),

  // live-data optional fields
  externalLoanId: z.string().nullable().optional(),
  principalBalance: z.union([z.string(), z.number()]).nullable().optional(),
  nextPaymentDate: z.preprocess((v) => v ? new Date(v as string) : undefined, z.date()).nullable().optional(),
  nextPaymentAmount: z.union([z.string(), z.number()]).nullable().optional(),
  lastPaymentDate: z.preprocess((v)=> v ? new Date(v as string) : undefined, z.date()).nullable().optional(),
  lastPaymentAmount: z.union([z.string(), z.number()]).nullable().optional(),
  escrowBalance: z.union([z.string(), z.number()]).nullable().optional(),
  remainingTerm: z.number().int().nullable().optional(),
});

// Helper – convert validated input to a type-safe Drizzle row
function toNewLoan(propertyId: number, input: z.infer<typeof loanInputSchema>): NewLoan {
  return {
    propertyId,
    loanName: input.loanName,
    loanType: input.loanType,
    originalAmount: input.originalAmount.toString(),
    currentBalance: input.currentBalance.toString(),
    interestRate: (
      typeof input.interestRate === 'number' ? input.interestRate.toFixed(4) : input.interestRate
    ),
    termYears: input.termYears,
    monthlyPayment: input.monthlyPayment.toString(),
    paymentType: input.paymentType,
    maturityDate: input.maturityDate ?? new Date(Date.now() + 30 * 365 * 24 * 60 * 60 * 1000),
    isActive: input.isActive,
    lender: input.lender ?? null,
    notes: input.notes ?? null,

    externalLoanId: input.externalLoanId ?? null,
    principalBalance: input.principalBalance ? input.principalBalance.toString() : null,
    nextPaymentDate: input.nextPaymentDate ?? null,
    nextPaymentAmount: input.nextPaymentAmount ? input.nextPaymentAmount.toString() : null,
    lastPaymentDate: input.lastPaymentDate ?? null,
    lastPaymentAmount: input.lastPaymentAmount ? input.lastPaymentAmount.toString() : null,
    escrowBalance: input.escrowBalance ? input.escrowBalance.toString() : null,
    remainingTerm: input.remainingTerm ?? null,

    // sync fields
    lastSyncDate: null,
    syncStatus: 'pending',
    syncError: null,
  } as NewLoan;
}

// Partial builder for PATCH/PUT operations
function toLoanUpdate(input: Partial<z.infer<typeof loanInputSchema>>): Partial<NewLoan> {
  const out: Partial<NewLoan> = {};

  if (input.loanName !== undefined) out.loanName = input.loanName;
  if (input.loanType !== undefined) out.loanType = input.loanType;
  if (input.originalAmount !== undefined) out.originalAmount = input.originalAmount.toString();
  if (input.currentBalance !== undefined) out.currentBalance = input.currentBalance.toString();
  if (input.interestRate !== undefined) {
    out.interestRate = typeof input.interestRate === 'number' ? input.interestRate.toFixed(4) : input.interestRate;
  }
  if (input.termYears !== undefined) out.termYears = input.termYears;
  if (input.monthlyPayment !== undefined) out.monthlyPayment = input.monthlyPayment.toString();
  if (input.paymentType !== undefined) out.paymentType = input.paymentType;
  if (input.maturityDate !== undefined) out.maturityDate = input.maturityDate;
  if (input.isActive !== undefined) out.isActive = input.isActive;
  if (input.lender !== undefined) out.lender = input.lender ?? null;
  if (input.notes !== undefined) out.notes = input.notes ?? null;

  if (input.externalLoanId !== undefined) out.externalLoanId = input.externalLoanId ?? null;
  if (input.principalBalance !== undefined) out.principalBalance = input.principalBalance ? input.principalBalance.toString() : null;
  if (input.nextPaymentDate !== undefined) out.nextPaymentDate = input.nextPaymentDate;
  if (input.nextPaymentAmount !== undefined) out.nextPaymentAmount = input.nextPaymentAmount ? input.nextPaymentAmount.toString() : null;
  if (input.lastPaymentDate !== undefined) out.lastPaymentDate = input.lastPaymentDate;
  if (input.lastPaymentAmount !== undefined) out.lastPaymentAmount = input.lastPaymentAmount ? input.lastPaymentAmount.toString() : null;
  if (input.escrowBalance !== undefined) out.escrowBalance = input.escrowBalance ? input.escrowBalance.toString() : null;
  if (input.remainingTerm !== undefined) out.remainingTerm = input.remainingTerm;

  return out;
}

const router = Router();

// Get all loans for a property
router.get('/property/:propertyId/loans', authenticateSession, async (req, res) => {
  try {
    const propertyId = parseInt(req.params.propertyId);
    const userId = req.session.user?.id;

    // Get property (ownership verified through entity memberships)
    const property = await db.select()
      .from(properties)
      .where(eq(properties.id, propertyId))
      .limit(1);

    if (property.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const loans = await db.select()
      .from(propertyLoans)
      .where(eq(propertyLoans.propertyId, propertyId));

    res.json(loans);
  } catch (error) {
    console.error('Error fetching property loans:', error);
    res.status(500).json({ error: 'Failed to fetch property loans' });
  }
});

// Create a new loan for a property
router.post('/property/:propertyId/loans', authenticateSession, async (req, res) => {
  try {
    const propertyId = parseInt(req.params.propertyId);
    const userId = req.session.user?.id;

    // Get property (ownership verified through entity memberships)
    const property = await db.select()
      .from(properties)
      .where(eq(properties.id, propertyId))
      .limit(1);

    if (property.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Validate & build a type-safe object
    const parsed = loanInputSchema.parse(req.body);
    const newLoanData = toNewLoan(propertyId, parsed);

    const [newLoan] = await db.insert(propertyLoans)
      .values(newLoanData)
      .returning();
    res.json(newLoan);
  } catch (error) {
    console.error('Error creating property loan:', error);
    res.status(500).json({ error: 'Failed to create property loan' });
  }
});

// Update a loan
router.put('/loans/:loanId', authenticateSession, async (req, res) => {
  try {
    const loanId = parseInt(req.params.loanId);
    
    // Verify loan exists and belongs to user via property linkage (left as-is)
    const loanWithProperty = await db.select({
      loanId: propertyLoans.id,
      propertyEntity: properties.entity
    })
      .from(propertyLoans)
      .innerJoin(properties, eq(propertyLoans.propertyId, properties.id))
      .where(eq(propertyLoans.id, loanId))
      .limit(1);
 
    if (loanWithProperty.length === 0) {
      return res.status(404).json({ error: 'Loan not found' });
    }
 
    const parsed = loanInputSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.errors });
    }

    const updateData = toLoanUpdate(parsed.data);
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No updatable fields supplied' });
    }
 
    const [updatedLoan] = await db.update(propertyLoans)
      .set(updateData)
      .where(eq(propertyLoans.id, loanId))
      .returning();
 
    res.json(updatedLoan);
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    console.error('Error updating property loan:', err);
    res.status(500).json({ error: 'Failed to update property loan', details: err.message });
  }
});

// Delete a loan
router.delete('/loans/:loanId', authenticateSession, async (req, res) => {
  try {
    const loanId = parseInt(req.params.loanId);
    const userId = req.session.user?.id;

    // Get loan with property info (ownership verified through entity memberships)
    const loanWithProperty = await db.select({
      loanId: propertyLoans.id,
      propertyEntity: properties.entity
    })
      .from(propertyLoans)
      .innerJoin(properties, eq(propertyLoans.propertyId, properties.id))
      .where(eq(propertyLoans.id, loanId))
      .limit(1);

    if (loanWithProperty.length === 0) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    await db.delete(propertyLoans)
      .where(eq(propertyLoans.id, loanId));

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting property loan:', error);
    res.status(500).json({ error: 'Failed to delete property loan' });
  }
});

// Sync loan data from uploaded statements
router.post('/property/:propertyId/loans/sync', authenticateSession, async (req, res) => {
  try {
    const propertyId = parseInt(req.params.propertyId);
 
    const property = await db.select()
      .from(properties)
      .where(eq(properties.id, propertyId))
      .limit(1);
 
    if (property.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }
 
    const { loanData } = req.body;
    if (!loanData) {
      return res.status(400).json({ error: 'loanData missing in request body' });
    }
 
    // Convert incoming lender numbers/strings to table-ready strings
    const toMoneyString = (v: any) => (v !== undefined && v !== null ? v.toString() : null);
 
    const existingLoan = await db.select()
      .from(propertyLoans)
      .where(and(
        eq(propertyLoans.propertyId, propertyId),
        eq(propertyLoans.externalLoanId, loanData.loanId)
      ))
      .limit(1);
 
    const commonFields = {
      currentBalance: toMoneyString(loanData.currentBalance),
      principalBalance: toMoneyString(loanData.principalBalance),
      interestRate: (loanData.interestRate / 100).toFixed(4),
      monthlyPayment: toMoneyString(loanData.monthlyPayment),
      nextPaymentDate: parseDate(loanData.nextPaymentDate),
      nextPaymentAmount: toMoneyString(loanData.nextPaymentAmount),
      lastPaymentDate: parseDate(loanData.lastPaymentDate),
      lastPaymentAmount: toMoneyString(loanData.lastPaymentAmount),
      escrowBalance: toMoneyString(loanData.escrowBalance),
      remainingTerm: loanData.remainingTerm ?? null,
      lastSyncDate: new Date(),
    } as Partial<NewLoan>;
 
    if (existingLoan.length > 0) {
      const [updatedLoan] = await db.update(propertyLoans)
        .set({ ...commonFields, syncStatus: 'success', syncError: null })
        .where(eq(propertyLoans.id, existingLoan[0].id))
        .returning();
 
      return res.json({ success: true, loan: updatedLoan, action: 'updated' });
    }
 
    const newLoan: NewLoan = {
      propertyId,
      loanName: `${loanData.lenderName} Loan`,
      loanType: 'acquisition',
      originalAmount: toMoneyString(loanData.currentBalance)!,
      currentBalance: toMoneyString(loanData.currentBalance)!,
      interestRate: (loanData.interestRate / 100).toFixed(4),
      termYears: 30,
      monthlyPayment: toMoneyString(loanData.monthlyPayment)!,
      paymentType: 'principal_and_interest',
      maturityDate: new Date(Date.now() + 30 * 365 * 24 * 60 * 60 * 1000),
      isActive: true,
      lender: loanData.lenderName,
      externalLoanId: loanData.loanId,
      ...commonFields,
      syncStatus: 'success',
      syncError: null,
    };
 
    const [created] = await db.insert(propertyLoans).values(newLoan).returning();
 
    return res.json({ success: true, loan: created, action: 'created' });
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    console.error('Error syncing property loan:', err);
    res.status(500).json({ error: 'Failed to sync property loan', details: err.message });
  }
});

export default router;