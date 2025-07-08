/**
 * Statement Upload Routes
 * Handles file upload and processing of lender statements
 */

import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { promises as fs } from 'fs';
import { documentParserService } from './document-parser.service';
// Authentication will be handled at route level if needed
import { db } from './db';
import { propertyLoans, properties } from '@shared/schema';
import { eq, isNotNull, desc } from 'drizzle-orm';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'statements');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const originalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${timestamp}-${originalName}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.csv', '.xlsx', '.xls', '.txt'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${fileExtension}. Allowed types: ${allowedTypes.join(', ')}`));
    }
  }
});

/**
 * Upload single statement file
 */
router.post('/upload', upload.single('statement'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const filePath = req.file.path;
    const fileName = req.file.originalname;

    // Parse the uploaded document
    const parseResult = await documentParserService.parseDocument(filePath, fileName);

    // Clean up uploaded file
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.warn('Failed to delete uploaded file:', error);
    }

    if (!parseResult.success) {
      return res.status(200).json({
        success: false,
        message: 'Document could not be processed',
        errors: parseResult.errors,
        warnings: parseResult.warnings,
        results: [{
          fileName: fileName,
          parsed: 0,
          matched: 0,
          unmatched: 0,
          updated: 0,
          errors: parseResult.errors || ['Parse failed']
        }]
      });
    }

    // Match parsed data to properties
    const { matched, unmatched } = await documentParserService.matchToProperties(parseResult.data || []);

    // Update database with matched data
    const updateResult = await documentParserService.updateLoanData(matched);

    res.json({
      success: true,
      message: 'Statement processed successfully',
      results: {
        fileName,
        parsed: parseResult.parsedCount,
        matched: matched.length,
        unmatched: unmatched.length,
        updated: updateResult.updated,
        errors: updateResult.errors,
        warnings: parseResult.warnings
      },
      data: {
        matched: matched.map(m => ({
          lender: m.loan.lenderName,
          property: m.property.address,
          balance: m.loan.currentBalance,
          payment: m.loan.monthlyPayment
        })),
        unmatched: unmatched.map(u => ({
          lender: u.lenderName,
          address: u.propertyAddress,
          balance: u.currentBalance,
          loanId: u.loanId,
          interestRate: u.interestRate,
          monthlyPayment: u.monthlyPayment,
          nextPaymentDate: u.nextPaymentDate,
          nextPaymentAmount: u.nextPaymentAmount,
          lastPaymentDate: u.lastPaymentDate,
          lastPaymentAmount: u.lastPaymentAmount,
          escrowBalance: u.escrowBalance,
          remainingTerm: u.remainingTerm,
          additionalInfo: u.additionalInfo
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to process statement',
      error: error.message
    });
  }
});

/**
 * Upload multiple statement files
 */
router.post('/upload-multiple', upload.array('statements', 10), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const results: any[] = [];
    let totalParsed = 0;
    let totalMatched = 0;
    let totalUpdated = 0;
    const allErrors: string[] = [];
    const allWarnings: string[] = [];

    for (const file of files) {
      try {
        const parseResult = await documentParserService.parseDocument(file.path, file.originalname);
        
        if (parseResult.success && parseResult.data) {
          const { matched, unmatched } = await documentParserService.matchToProperties(parseResult.data);
          const updateResult = await documentParserService.updateLoanData(matched);
          
          results.push({
            fileName: file.originalname,
            parsed: parseResult.parsedCount,
            matched: matched.length,
            unmatched: unmatched.length,
            updated: updateResult.updated,
            errors: updateResult.errors
          });
          
          totalParsed += parseResult.parsedCount;
          totalMatched += matched.length;
          totalUpdated += updateResult.updated;
          
          if (updateResult.errors.length > 0) {
            allErrors.push(...updateResult.errors);
          }
        } else {
          results.push({
            fileName: file.originalname,
            parsed: 0,
            matched: 0,
            unmatched: 0,
            updated: 0,
            errors: parseResult.errors || ['Parse failed']
          });
          
          if (parseResult.errors) {
            allErrors.push(...parseResult.errors);
          }
        }
        
        if (parseResult.warnings) {
          allWarnings.push(...parseResult.warnings);
        }
        
        // Clean up file
        try {
          await fs.unlink(file.path);
        } catch (error) {
          console.warn('Failed to delete uploaded file:', error);
        }
      } catch (error) {
        results.push({
          fileName: file.originalname,
          parsed: 0,
          matched: 0,
          unmatched: 0,
          updated: 0,
          errors: [error.message]
        });
        allErrors.push(error.message);
      }
    }

    res.json({
      success: totalUpdated > 0,
      message: `Processed ${files.length} files. Updated ${totalUpdated} loan records.`,
      summary: {
        filesProcessed: files.length,
        totalParsed,
        totalMatched,
        totalUpdated,
        totalErrors: allErrors.length,
        totalWarnings: allWarnings.length
      },
      results,
      errors: allErrors.length > 0 ? allErrors : undefined,
      warnings: allWarnings.length > 0 ? allWarnings : undefined
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to process statements',
      error: error.message
    });
  }
});

/**
 * Get upload history
 */
router.get('/history', async (req, res) => {
  try {
    // This would typically come from a database table tracking uploads
    // For now, return recent loan sync dates
    const recentSyncs = await db.select({
      lender: propertyLoans.lender,
      property: properties.address,
      lastSync: propertyLoans.lastSyncDate,
      syncStatus: propertyLoans.syncStatus
    })
    .from(propertyLoans)
    .innerJoin(properties, eq(propertyLoans.propertyId, properties.id))
    .where(isNotNull(propertyLoans.lastSyncDate))
    .orderBy(desc(propertyLoans.lastSyncDate))
    .limit(50);

    res.json({
      success: true,
      history: recentSyncs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch upload history',
      error: error.message
    });
  }
});

/**
 * Download template files
 */
router.get('/templates/:type', async (req, res) => {
  try {
    const { type } = req.params;
    
    const templates = {
      csv: {
        headers: ['Lender', 'Property Address', 'Loan ID', 'Current Balance', 'Monthly Payment', 'Interest Rate', 'Next Payment Date', 'Statement Date'],
        filename: 'loan-statement-template.csv'
      },
      excel: {
        headers: ['Lender', 'Property Address', 'Loan ID', 'Current Balance', 'Monthly Payment', 'Interest Rate', 'Next Payment Date', 'Statement Date'],
        filename: 'loan-statement-template.xlsx'
      }
    };

    const template = templates[type];
    if (!template) {
      return res.status(400).json({
        success: false,
        message: 'Invalid template type'
      });
    }

    if (type === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${template.filename}`);
      res.send(template.headers.join(',') + '\n');
    } else if (type === 'excel') {
      const XLSX = require('xlsx');
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet([template.headers]);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Loan Data');
      
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${template.filename}`);
      res.send(buffer);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate template',
      error: error.message
    });
  }
});

// Manual review endpoint - Enhanced to handle comprehensive mortgage data
router.post('/manual-review', async (req, res) => {
  try {
    const { originalLoan, editedLoan, propertyId, manualReview } = req.body;
    
    if (!propertyId || !editedLoan) {
      return res.status(400).json({ error: 'Property ID and edited loan data are required' });
    }

    // Extract additional info from enhanced parsing
    const additionalInfo = editedLoan.additionalInfo || {};
    
    // Create comprehensive loan record with enhanced data
    const loanData = {
      propertyId: propertyId,
      loanName: `${editedLoan.lender} Loan`,
      loanType: (additionalInfo.loanType?.toLowerCase() || 'acquisition') as any,
      originalAmount: (additionalInfo.originalLoanAmount || editedLoan.balance || 0).toString(),
      currentBalance: (editedLoan.balance || editedLoan.currentBalance || 0).toString(),
      interestRate: (editedLoan.interestRate || 0).toString(),
      termYears: Math.floor((editedLoan.remainingTerm || 360) / 12),
      monthlyPayment: (editedLoan.monthlyPayment || 0).toString(),
      paymentType: 'principal_and_interest' as const,
      maturityDate: additionalInfo.maturityDate || '2055-01-01',
      isActive: true,
      lender: editedLoan.lender,
      externalLoanId: editedLoan.loanId,
      principalBalance: (editedLoan.balance || editedLoan.currentBalance || 0).toString(),
      nextPaymentDate: editedLoan.nextPaymentDate ? editedLoan.nextPaymentDate.split('T')[0] : null,
      nextPaymentAmount: (editedLoan.nextPaymentAmount || editedLoan.monthlyPayment || 0).toString(),
      escrowBalance: (editedLoan.escrowBalance || additionalInfo.escrowBalance || 0).toString(),
      remainingTerm: editedLoan.remainingTerm || null,
      lastPaymentDate: editedLoan.lastPaymentDate ? editedLoan.lastPaymentDate.split('T')[0] : null,
      lastPaymentAmount: (editedLoan.lastPaymentAmount || 0).toString(),
      syncStatus: 'success',
      syncError: null,
      notes: `Manual review completed: ${JSON.stringify({ 
        originalLoan, 
        editedLoan: {
          ...editedLoan,
          additionalInfo: {
            ...additionalInfo,
            // Enhanced mortgage-specific fields
            pastDueAmount: additionalInfo.pastDueAmount || 0,
            unappliedFunds: additionalInfo.unappliedFunds || 0,
            deferredBalance: additionalInfo.deferredBalance || 0,
            replacementReserveBalance: additionalInfo.replacementReserveBalance || 0,
            lateFeeAfterDate: additionalInfo.lateFeeAfterDate,
            maxLateFee: additionalInfo.maxLateFee || 0,
            prepaymentPenalty: additionalInfo.prepaymentPenalty || 'None',
            totalAmountDue: additionalInfo.totalAmountDue || 0,
            parseMethod: 'enhanced_mortgage_statement'
          }
        },
        reviewedAt: new Date().toISOString() 
      })}`
    };

    await db.insert(propertyLoans).values(loanData);

    res.json({
      success: true,
      message: 'Manual review saved successfully with enhanced data',
      loanId: loanData.externalLoanId,
      enhancedFields: Object.keys(additionalInfo).length
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