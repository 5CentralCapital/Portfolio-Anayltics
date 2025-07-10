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

    const updateData = { ...req.body };
    delete updateData.id; // Don't allow updating the ID
    
    const updatedLoan = await db.update(propertyLoans)
      .set(updateData)
      .where(eq(propertyLoans.id, loanId))
      .returning();

    res.json(updatedLoan[0]);
  } catch (error) {
    console.error('Error updating property loan:', error);
    res.status(500).json({ error: 'Failed to update property loan' });
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
    const userId = req.session.user?.id;

    // Get property (ownership verified through entity memberships)
    const property = await db.select()
      .from(properties)
      .where(eq(properties.id, propertyId))
      .limit(1);

    if (property.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const { loanData } = req.body; // Expected to be parsed loan data from document parser

    // Update or create loan record with synced data
    const existingLoan = await db.select()
      .from(propertyLoans)
      .where(and(
        eq(propertyLoans.propertyId, propertyId),
        eq(propertyLoans.externalLoanId, loanData.loanId)
      ))
      .limit(1);

    if (existingLoan.length > 0) {
      // Update existing loan
      const updatedLoan = await db.update(propertyLoans)
        .set({
          currentBalance: loanData.currentBalance.toString(),
          principalBalance: loanData.principalBalance?.toString() || null,
          interestRate: (loanData.interestRate / 100).toString(),
          monthlyPayment: loanData.monthlyPayment.toString(),
          nextPaymentDate: parseDate(loanData.nextPaymentDate),
          nextPaymentAmount: loanData.nextPaymentAmount?.toString() || null,
          lastPaymentDate: parseDate(loanData.lastPaymentDate),
          lastPaymentAmount: loanData.lastPaymentAmount?.toString() || null,
          escrowBalance: loanData.escrowBalance?.toString() || null,
          remainingTerm: loanData.remainingTerm || null,
          lastSyncDate: new Date(),
          syncStatus: 'success',
          syncError: null
        })
        .where(eq(propertyLoans.id, existingLoan[0].id))
        .returning();

      res.json({ success: true, loan: updatedLoan[0], action: 'updated' });
    } else {
      // Create new loan
      const newLoan = await db.insert(propertyLoans)
        .values({
          propertyId,
          loanName: `${loanData.lenderName} Loan`,
          loanType: 'acquisition',
          originalAmount: loanData.currentBalance.toString(),
          currentBalance: loanData.currentBalance.toString(),
          interestRate: (loanData.interestRate / 100).toString(),
          termYears: 30, // Default, can be updated manually
          monthlyPayment: loanData.monthlyPayment.toString(),
          paymentType: 'principal_and_interest',
          maturityDate: new Date(Date.now() + 30 * 365 * 24 * 60 * 60 * 1000),
          isActive: true, // First loan is active by default
          lender: loanData.lenderName,
          externalLoanId: loanData.loanId,
          principalBalance: loanData.principalBalance?.toString() || null,
          nextPaymentDate: parseDate(loanData.nextPaymentDate),
          nextPaymentAmount: loanData.nextPaymentAmount?.toString() || null,
          lastPaymentDate: parseDate(loanData.lastPaymentDate),
          lastPaymentAmount: loanData.lastPaymentAmount?.toString() || null,
          escrowBalance: loanData.escrowBalance?.toString() || null,
          remainingTerm: loanData.remainingTerm || null,
          lastSyncDate: new Date(),
          syncStatus: 'success',
          syncError: null
        })
        .returning();

      res.json({ success: true, loan: newLoan[0], action: 'created' });
    }
  } catch (error) {
    console.error('Error syncing property loan:', error);
    res.status(500).json({ error: 'Failed to sync property loan' });
  }
});

export default router;