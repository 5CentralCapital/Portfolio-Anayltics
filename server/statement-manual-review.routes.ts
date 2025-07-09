import { Router } from 'express';
import { db } from './db';
import { propertyLoans } from '../shared/schema';

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

const router = Router();

// Save manual review
router.post('/manual-review', async (req, res) => {
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
      maturityDate: parseDate(editedLoan.nextPaymentDate) || new Date(Date.now() + 30 * 365 * 24 * 60 * 60 * 1000),
      isActive: true,
      lender: editedLoan.lender,
      externalLoanId: editedLoan.loanId,
      principalBalance: editedLoan.balance.toString(),
      nextPaymentDate: parseDate(editedLoan.nextPaymentDate),
      nextPaymentAmount: editedLoan.monthlyPayment?.toString() || '0',
      escrowBalance: '0',
      lastSyncDate: new Date(),
      syncStatus: 'success',
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