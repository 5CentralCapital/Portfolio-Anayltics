/**
 * Lender API Routes
 * Endpoints for managing lender integrations and debt synchronization
 */

import { Router } from 'express';
import { lenderIntegrationService } from './lender-integration.service';
import { debtSyncScheduler } from './debt-sync.scheduler';
import { db } from './db';
import { propertyLoans } from '@shared/schema';
import { eq } from 'drizzle-orm';

const router = Router();

/**
 * Manual debt sync trigger
 */
router.post('/sync', async (req, res) => {
  try {
    const result = await lenderIntegrationService.syncAllLenders();
    
    res.json({
      success: result.success,
      message: result.success ? 'Debt data synchronized successfully' : 'Sync completed with errors',
      results: Object.fromEntries(result.results),
      errors: result.errors
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to sync debt data',
      error: error.message
    });
  }
});

/**
 * Get debt sync status
 */
router.get('/sync/status', async (req, res) => {
  try {
    const schedulerStatus = debtSyncScheduler.getStatus();
    
    // Get recent sync results from database
    const recentLoans = await db.select()
      .from(propertyLoans)
      .where(eq(propertyLoans.lastSyncDate, new Date().toISOString().split('T')[0]))
      .limit(10);
    
    res.json({
      success: true,
      scheduler: schedulerStatus,
      recentSyncs: recentLoans.length,
      lastSyncDate: recentLoans[0]?.lastSyncDate || null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get sync status',
      error: error.message
    });
  }
});

/**
 * Start automated debt sync
 */
router.post('/sync/start', async (req, res) => {
  try {
    const { intervalHours = 24 } = req.body;
    
    debtSyncScheduler.start(intervalHours);
    
    res.json({
      success: true,
      message: `Debt sync scheduler started with ${intervalHours} hour intervals`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to start debt sync scheduler',
      error: error.message
    });
  }
});

/**
 * Stop automated debt sync
 */
router.post('/sync/stop', async (req, res) => {
  try {
    debtSyncScheduler.stop();
    
    res.json({
      success: true,
      message: 'Debt sync scheduler stopped'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to stop debt sync scheduler',
      error: error.message
    });
  }
});

/**
 * Get loan data for specific property
 */
router.get('/loans/:propertyId', async (req, res) => {
  try {
    const { propertyId } = req.params;
    
    const loans = await db.select()
      .from(propertyLoans)
      .where(eq(propertyLoans.propertyId, parseInt(propertyId)));
    
    res.json({
      success: true,
      loans: loans.map(loan => ({
        id: loan.id,
        loanName: loan.loanName,
        lender: loan.lender,
        currentBalance: loan.currentBalance,
        monthlyPayment: loan.monthlyPayment,
        interestRate: loan.interestRate,
        nextPaymentDate: loan.nextPaymentDate,
        nextPaymentAmount: loan.nextPaymentAmount,
        lastSyncDate: loan.lastSyncDate,
        syncStatus: loan.syncStatus,
        isActive: loan.isActive
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch loan data',
      error: error.message
    });
  }
});

/**
 * Get lender integration health check
 */
router.get('/health', async (req, res) => {
  try {
    // Check if lender credentials are configured
    const hasQuicken = !!process.env.QUICKEN_LOANS_API_KEY;
    const hasWells = !!(process.env.WELLS_FARGO_CLIENT_ID && process.env.WELLS_FARGO_CLIENT_SECRET);
    const hasChase = !!process.env.CHASE_API_KEY;
    const hasLocal = !!process.env.LOCAL_BANK_API_KEY;
    
    res.json({
      success: true,
      integrations: {
        quicken_loans: {
          configured: hasQuicken,
          status: hasQuicken ? 'ready' : 'missing_credentials'
        },
        wells_fargo: {
          configured: hasWells,
          status: hasWells ? 'ready' : 'missing_credentials'
        },
        chase_bank: {
          configured: hasChase,
          status: hasChase ? 'ready' : 'missing_credentials'
        },
        local_bank: {
          configured: hasLocal,
          status: hasLocal ? 'ready' : 'missing_credentials'
        }
      },
      scheduler: debtSyncScheduler.getStatus()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
});

export default router;