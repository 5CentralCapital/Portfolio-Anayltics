import { Router } from 'express';
import { db } from './db';
import { propertyLoans } from '../shared/schema';
import { requireAuth } from './auth';

const router = Router();

// Save manual review
router.post('/manual-review', requireAuth, async (req, res) => {
  try {
    const { originalLoan, editedLoan, propertyId, manualReview } = req.body;
    
    // Create or update the loan record
    const loanData = {
      propertyId: propertyId,
      loanName: `${editedLoan.lender} Loan`,
      loanType: 'acquisition',
      originalAmount: editedLoan.balance.toString(),
      currentBalance: editedLoan.balance.toString(),
      interestRate: editedLoan.interestRate?.toString() || '0',
      termYears: 30,
      monthlyPayment: editedLoan.monthlyPayment?.toString() || '0',
      paymentType: 'principal_and_interest',
      maturityDate: editedLoan.nextPaymentDate || new Date().toISOString().split('T')[0],
      isActive: true,
      lender: editedLoan.lender,
      externalLoanId: editedLoan.loanId,
      principalBalance: editedLoan.balance.toString(),
      nextPaymentDate: editedLoan.nextPaymentDate || null,
      nextPaymentAmount: editedLoan.monthlyPayment?.toString() || '0',
      escrowBalance: '0',
      lastSyncDate: new Date().toISOString(),
      syncStatus: 'manual_review_complete',
      syncError: null
    };

    await db.insert(propertyLoans).values(loanData);

    res.json({
      success: true,
      message: 'Manual review saved successfully',
      loanId: loanData.externalLoanId
    });

  } catch (error) {
    console.error('Manual review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save manual review',
      error: error.message
    });
  }
});

export default router;