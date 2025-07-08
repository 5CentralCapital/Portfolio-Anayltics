/**
 * AI Document Processing API Routes
 * Handles upload and processing of property documents using OpenAI
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { aiDocumentProcessor, ProcessingResult } from '../ai-document-processor.service';
import { db } from '../db';
import { properties, propertyRentRoll, entityMemberships, propertyLoans, documentProcessingHistory } from '../../shared/schema';
import { eq, and, desc, isNotNull } from 'drizzle-orm';

const router = Router();

// Configure multer for document uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads/documents';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${timestamp}_${sanitizedName}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /\.(pdf|jpg|jpeg|png|gif|txt|csv|doc|docx)$/i;
    if (allowedTypes.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: PDF, images, text, CSV, Word documents'));
    }
  }
});

interface ProcessDocumentRequest extends Request {
  body: {
    propertyId?: number;
    entityId?: number;
    documentType?: string;
    autoApply?: boolean;
  };
}

/**
 * Upload and process document with AI extraction
 */
router.post('/process', upload.single('document'), async (req: ProcessDocumentRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { propertyId, entityId, documentType, autoApply } = req.body;
    const filePath = req.file.path;
    const fileName = req.file.originalname;

    console.log(`Processing document: ${fileName} for property: ${propertyId}`);

    // Process document with AI
    const result = await aiDocumentProcessor.processDocument(filePath, fileName);

    // Store processing result
    const processingRecord = await db.insert(documentProcessingHistory).values({
      fileName,
      filePath,
      documentType: result.documentType,
      extractedData: JSON.stringify(result.extractedData),
      confidence: result.confidence,
      success: result.success,
      errors: result.errors,
      warnings: result.warnings,
      suggestedActions: result.suggestedActions,
      propertyId: propertyId || null,
      entityId: entityId || null,
      userId: req.session?.userId || null,
      processedAt: new Date()
    }).returning();

    // Auto-apply updates if requested and confidence is high
    if (autoApply && result.success && result.confidence > 0.8) {
      const updateResult = await applyDocumentUpdates(result, propertyId, entityId);
      return res.json({
        ...result,
        processingId: processingRecord[0].id,
        updatesApplied: updateResult.success,
        updatedFields: updateResult.updatedFields
      });
    }

    // Return result for manual review
    res.json({
      ...result,
      processingId: processingRecord[0].id,
      requiresReview: !autoApply || result.confidence <= 0.8
    });

  } catch (error) {
    console.error('Document processing error:', error);
    res.status(500).json({ 
      error: 'Document processing failed',
      details: error.message 
    });
  }
});

/**
 * Get processing history for a property or entity
 */
router.get('/history', async (req: Request, res: Response) => {
  try {
    const { propertyId, entityId, limit = 20 } = req.query;
    
    let query = db.select().from(documentProcessingHistory);
    
    if (propertyId) {
      query = query.where(eq(documentProcessingHistory.propertyId, Number(propertyId)));
    } else if (entityId) {
      query = query.where(eq(documentProcessingHistory.entityId, Number(entityId)));
    }
    
    const history = await query
      .orderBy(desc(documentProcessingHistory.processedAt))
      .limit(Number(limit));

    res.json(history);
  } catch (error) {
    console.error('Error fetching processing history:', error);
    res.status(500).json({ error: 'Failed to fetch processing history' });
  }
});

/**
 * Apply extracted document data to property/entity records
 */
router.post('/apply-updates/:processingId', async (req: Request, res: Response) => {
  try {
    const { processingId } = req.params;
    const { approvedFields, propertyId, entityId } = req.body;

    // Get processing record
    const processingRecord = await db.select()
      .from(documentProcessingHistory)
      .where(eq(documentProcessingHistory.id, Number(processingId)))
      .limit(1);

    if (processingRecord.length === 0) {
      return res.status(404).json({ error: 'Processing record not found' });
    }

    const record = processingRecord[0];
    const extractedData = JSON.parse(record.extractedData);

    // Apply approved updates
    const updateResult = await applyDocumentUpdates(
      { 
        documentType: record.documentType, 
        extractedData,
        success: true,
        confidence: record.confidence
      }, 
      propertyId || record.propertyId,
      entityId || record.entityId,
      approvedFields
    );

    // Mark as applied
    await db.update(documentProcessingHistory)
      .set({ 
        appliedAt: new Date(),
        appliedBy: req.session?.userId || null
      })
      .where(eq(documentProcessingHistory.id, Number(processingId)));

    res.json(updateResult);
  } catch (error) {
    console.error('Error applying updates:', error);
    res.status(500).json({ error: 'Failed to apply updates' });
  }
});

/**
 * Helper function to apply document updates to database
 */
async function applyDocumentUpdates(
  result: ProcessingResult, 
  propertyId?: number, 
  entityId?: number,
  approvedFields?: string[]
): Promise<{ success: boolean; updatedFields: string[]; errors: string[] }> {
  const updatedFields: string[] = [];
  const errors: string[] = [];

  try {
    switch (result.documentType) {
      case 'lease':
        if (propertyId) {
          const updatedLeaseFields = await updatePropertyFromLease(propertyId, result.extractedData, approvedFields);
          updatedFields.push(...updatedLeaseFields);
        }
        break;

      case 'llc_document':
        if (entityId) {
          const updatedEntityFields = await updateEntityFromLLC(entityId, result.extractedData, approvedFields);
          updatedFields.push(...updatedEntityFields);
        }
        break;

      case 'mortgage_statement':
        if (propertyId) {
          const updatedMortgageFields = await updatePropertyFromMortgage(propertyId, result.extractedData, approvedFields);
          updatedFields.push(...updatedMortgageFields);
        }
        break;
    }

    return { success: true, updatedFields, errors };
  } catch (error) {
    errors.push(`Update failed: ${error.message}`);
    return { success: false, updatedFields, errors };
  }
}

/**
 * Update property records from lease data
 */
async function updatePropertyFromLease(propertyId: number, leaseData: any, approvedFields?: string[]): Promise<string[]> {
  const updatedFields: string[] = [];

  // Update rent roll
  if (leaseData.tenantNames && leaseData.monthlyRent) {
    // Find existing rent roll entries or create new ones
    const existingRentRoll = await db.select()
      .from(propertyRentRoll)
      .where(eq(propertyRentRoll.propertyId, propertyId));

    // Update or create rent roll entry
    const rentRollData = {
      propertyId,
      unit: leaseData.unitNumber || '1',
      currentRent: leaseData.monthlyRent,
      proFormaRent: leaseData.monthlyRent,
      tenantName: leaseData.tenantNames[0],
      leaseStart: leaseData.leaseStartDate,
      leaseEnd: leaseData.leaseEndDate
    };

    if (existingRentRoll.length > 0) {
      await db.update(propertyRentRoll)
        .set(rentRollData)
        .where(and(
          eq(propertyRentRoll.propertyId, propertyId),
          eq(propertyRentRoll.unit, leaseData.unitNumber || '1')
        ));
    } else {
      await db.insert(propertyRentRoll).values(rentRollData);
    }

    updatedFields.push('rent_roll', 'tenant_information');
  }

  return updatedFields;
}

/**
 * Update entity records from LLC document data  
 */
async function updateEntityFromLLC(entityId: number, llcData: any, approvedFields?: string[]): Promise<string[]> {
  const updatedFields: string[] = [];

  // Update entity memberships
  if (llcData.members && Array.isArray(llcData.members)) {
    // Clear existing memberships
    await db.delete(entityMemberships).where(eq(entityMemberships.entityId, entityId));

    // Insert new memberships
    for (const member of llcData.members) {
      await db.insert(entityMemberships).values({
        entityId,
        memberName: member.name,
        ownershipPercentage: member.ownershipPercentage,
        role: member.role,
        address: member.address
      });
    }

    updatedFields.push('entity_memberships', 'ownership_structure');
  }

  return updatedFields;
}

/**
 * Update property loan records from mortgage statement
 */
async function updatePropertyFromMortgage(propertyId: number, mortgageData: any, approvedFields?: string[]): Promise<string[]> {
  const updatedFields: string[] = [];

  // Update property loan data
  if (mortgageData.currentBalance && mortgageData.lenderName) {
    const loanData = {
      propertyId,
      lenderName: mortgageData.lenderName,
      loanNumber: mortgageData.loanNumber,
      currentBalance: mortgageData.currentBalance,
      monthlyPayment: mortgageData.monthlyPayment,
      interestRate: mortgageData.interestRate,
      escrowBalance: mortgageData.escrowBalance,
      nextPaymentDate: mortgageData.nextPaymentDate,
      statementDate: mortgageData.statementDate,
      maturityDate: mortgageData.maturityDate,
      syncStatus: 'success' as const,
      lastSyncDate: new Date()
    };

    // Check if loan record exists
    const existingLoan = await db.select()
      .from(propertyLoans)
      .where(and(
        eq(propertyLoans.propertyId, propertyId),
        eq(propertyLoans.loanNumber, mortgageData.loanNumber)
      ))
      .limit(1);

    if (existingLoan.length > 0) {
      await db.update(propertyLoans)
        .set(loanData)
        .where(eq(propertyLoans.id, existingLoan[0].id));
    } else {
      await db.insert(propertyLoans).values(loanData);
    }

    updatedFields.push('loan_balance', 'payment_information', 'escrow_balance');
  }

  return updatedFields;
}



export default router;