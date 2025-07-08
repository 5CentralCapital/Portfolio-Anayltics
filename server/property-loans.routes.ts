/**
 * Property Loans API Routes
 * Handles CRUD operations for property loan data from PDF uploads
 */

import { Router } from 'express';
import { db } from './db';
import { propertyLoans, properties } from '@shared/schema';
import { eq, and, isNotNull, desc } from 'drizzle-orm';
// Authentication middleware
function authenticateSession(req: any, res: any, next: any) {
  // First try session-based authentication
  if (req.session && req.session.userId) {
    req.session.user = { id: req.session.userId, email: req.session.userEmail };
    return next();
  }

  return res.status(401).json({ error: 'Authentication required' });
}

const router = Router();

// Get all loans for a property
router.get('/property/:propertyId/loans', authenticateSession, async (req, res) => {
  try {
    const propertyId = parseInt(req.params.propertyId);
    const userId = req.session.user?.id;

    // Verify user owns the property - fix SQL syntax
    const property = await db.select()
      .from(properties)
      .where(and(
        eq(properties.id, propertyId), 
        eq(properties.userId, userId)
      ))
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

    // Verify user owns the property
    const property = await db.select()
      .from(properties)
      .where(and(eq(properties.id, propertyId), eq(properties.userId, userId)))
      .limit(1);

    if (property.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const loanData = {
      propertyId,
      loanName: req.body.loanName || 'New Loan',
      loanType: req.body.loanType || 'acquisition',
      originalAmount: req.body.originalAmount || '0',
      currentBalance: req.body.currentBalance || '0',
      interestRate: req.body.interestRate || '0',
      termYears: req.body.termYears || 30,
      monthlyPayment: req.body.monthlyPayment || '0',
      paymentType: req.body.paymentType || 'principal_and_interest',
      maturityDate: req.body.maturityDate || new Date(Date.now() + 30 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isActive: req.body.isActive || false,
      lender: req.body.lender || null,
      notes: req.body.notes || null,
      
      // Live data integration fields
      externalLoanId: req.body.externalLoanId || null,
      principalBalance: req.body.principalBalance || null,
      nextPaymentDate: req.body.nextPaymentDate || null,
      nextPaymentAmount: req.body.nextPaymentAmount || null,
      lastPaymentDate: req.body.lastPaymentDate || null,
      lastPaymentAmount: req.body.lastPaymentAmount || null,
      escrowBalance: req.body.escrowBalance || null,
      remainingTerm: req.body.remainingTerm || null,
      lastSyncDate: req.body.lastSyncDate || null,
      syncStatus: req.body.syncStatus || 'pending',
      syncError: req.body.syncError || null
    };

    const newLoan = await db.insert(propertyLoans)
      .values(loanData)
      .returning();

    res.json(newLoan[0]);
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

    // Verify user owns the property that owns this loan
    const loanWithProperty = await db.select({
      loanId: propertyLoans.id,
      propertyUserId: properties.userId
    })
      .from(propertyLoans)
      .innerJoin(properties, eq(propertyLoans.propertyId, properties.id))
      .where(eq(propertyLoans.id, loanId))
      .limit(1);

    if (loanWithProperty.length === 0 || loanWithProperty[0].propertyUserId !== userId) {
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

    // Verify user owns the property that owns this loan
    const loanWithProperty = await db.select({
      loanId: propertyLoans.id,
      propertyUserId: properties.userId
    })
      .from(propertyLoans)
      .innerJoin(properties, eq(propertyLoans.propertyId, properties.id))
      .where(eq(propertyLoans.id, loanId))
      .limit(1);

    if (loanWithProperty.length === 0 || loanWithProperty[0].propertyUserId !== userId) {
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

    // Verify user owns the property - fix SQL syntax
    const property = await db.select()
      .from(properties)
      .where(and(
        eq(properties.id, propertyId), 
        eq(properties.userId, userId)
      ))
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
          nextPaymentDate: loanData.nextPaymentDate || null,
          nextPaymentAmount: loanData.nextPaymentAmount?.toString() || null,
          lastPaymentDate: loanData.lastPaymentDate || null,
          lastPaymentAmount: loanData.lastPaymentAmount?.toString() || null,
          escrowBalance: loanData.escrowBalance?.toString() || null,
          remainingTerm: loanData.remainingTerm || null,
          lastSyncDate: new Date().toISOString(),
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
          maturityDate: new Date(Date.now() + 30 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          isActive: true, // First loan is active by default
          lender: loanData.lenderName,
          externalLoanId: loanData.loanId,
          principalBalance: loanData.principalBalance?.toString() || null,
          nextPaymentDate: loanData.nextPaymentDate || null,
          nextPaymentAmount: loanData.nextPaymentAmount?.toString() || null,
          lastPaymentDate: loanData.lastPaymentDate || null,
          lastPaymentAmount: loanData.lastPaymentAmount?.toString() || null,
          escrowBalance: loanData.escrowBalance?.toString() || null,
          remainingTerm: loanData.remainingTerm || null,
          lastSyncDate: new Date().toISOString(),
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