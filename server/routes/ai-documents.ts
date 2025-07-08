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

    const { propertyId, entityId, documentType, autoApply, model } = req.body;
    const filePath = req.file.path;
    const fileName = req.file.originalname;

    console.log(`Processing document: ${fileName} for property: ${propertyId} using model: ${model || 'gpt-4o'}`);

    // Process document with AI
    const result = await aiDocumentProcessor.processDocument(filePath, fileName, model || 'gpt-4o');

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

// Download original document from processing history
router.get('/download/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const [record] = await db.select()
      .from(documentProcessingHistory)
      .where(eq(documentProcessingHistory.id, Number(id)));
    
    if (!record) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    const filePath = record.filePath;
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Original file not found' });
    }
    
    // Set appropriate headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="${record.fileName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Failed to download document:', error);
    res.status(500).json({ error: 'Failed to download document' });
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

    // Update or create rent roll entry with correct field mapping for property modal
    const rentRollData = {
      propertyId,
      unit: leaseData.unitNumber || '1',
      currentRent: leaseData.monthlyRent,
      proFormaRent: leaseData.monthlyRent,
      tenantName: Array.isArray(leaseData.tenantNames) ? leaseData.tenantNames[0] : leaseData.tenantNames,
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



// Save manual review and integrate with property records
router.post('/manual-review', async (req, res) => {
  try {
    const { processingResult, extractedData, propertyId, manualReview, confidence } = req.body;
    
    console.log('Saving manual review:', { processingResult, extractedData, propertyId });
    
    if (!propertyId) {
      return res.status(400).json({
        success: false,
        message: 'Property ID is required'
      });
    }

    // Get the property to update
    const [property] = await db.select().from(properties).where(eq(properties.id, propertyId));
    
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    let updatedProperty = { ...property };
    let integrationResults: string[] = [];

    // Integrate extracted data based on document type
    switch (processingResult.documentType) {
      case 'lease':
        // Update rent roll with lease data - handle comprehensive lease information
        const existingDealData = property.dealAnalyzerData ? JSON.parse(property.dealAnalyzerData) : {};
        const rentRoll = existingDealData.rentRoll || [];
        
        // Extract tenant and lease information from various possible field structures
        let tenantName = '';
        let monthlyRent = 0;
        let leaseStart = '';
        let leaseEnd = '';
        let securityDeposit = 0;
        let unitNumber = '';
        let propertyAddress = '';
        
        // Handle different data structures from comprehensive extraction
        if (extractedData.tenant?.name) {
          tenantName = extractedData.tenant.name;
        } else if (extractedData.tenantNames) {
          tenantName = Array.isArray(extractedData.tenantNames) ? extractedData.tenantNames.join(', ') : extractedData.tenantNames;
        }
        
        if (extractedData.lease_details?.monthly_rent) {
          monthlyRent = extractedData.lease_details.monthly_rent;
        } else if (extractedData.financial_details?.monthly_rent) {
          monthlyRent = extractedData.financial_details.monthly_rent;
        } else if (extractedData.monthlyRent) {
          monthlyRent = extractedData.monthlyRent;
        }
        
        if (extractedData.lease_details?.lease_start_date) {
          leaseStart = extractedData.lease_details.lease_start_date;
        } else if (extractedData.lease?.start_date) {
          leaseStart = extractedData.lease.start_date;
        } else if (extractedData.leaseStartDate) {
          leaseStart = extractedData.leaseStartDate;
        }
        
        if (extractedData.lease_details?.lease_end_date) {
          leaseEnd = extractedData.lease_details.lease_end_date;
        } else if (extractedData.lease?.end_date) {
          leaseEnd = extractedData.lease.end_date;
        } else if (extractedData.leaseEndDate) {
          leaseEnd = extractedData.leaseEndDate;
        }
        
        if (extractedData.lease_details?.security_deposit) {
          securityDeposit = extractedData.lease_details.security_deposit;
        } else if (extractedData.financial_details?.security_deposit) {
          securityDeposit = extractedData.financial_details.security_deposit;
        } else if (extractedData.securityDeposit) {
          securityDeposit = extractedData.securityDeposit;
        }
        
        if (extractedData.tenant?.address) {
          propertyAddress = extractedData.tenant.address;
        } else if (extractedData.propertyAddress) {
          propertyAddress = extractedData.propertyAddress;
        }
        
        // Extract unit number from property address if available
        if (propertyAddress && propertyAddress.includes('#')) {
          const unitMatch = propertyAddress.match(/#(\w+)/);
          if (unitMatch) {
            unitNumber = `Unit ${unitMatch[1]}`;
          }
        }
        
        if (tenantName && monthlyRent > 0) {
          // Find existing rent roll entry for this unit or create new one
          let existingEntryIndex = -1;
          if (unitNumber) {
            existingEntryIndex = rentRoll.findIndex(entry => 
              entry.unit === unitNumber || 
              entry.unit === unitNumber.replace('Unit ', '#')
            );
          }
          
          const rentEntry = {
            id: existingEntryIndex >= 0 ? rentRoll[existingEntryIndex].id : rentRoll.length + 1,
            unit: unitNumber || `Unit ${rentRoll.length + 1}`,
            unitNumber: unitNumber || `Unit ${rentRoll.length + 1}`,
            unitTypeId: rentRoll[existingEntryIndex]?.unitTypeId || 1,
            tenantName: tenantName, // Use tenantName field that property modal expects
            leaseFrom: leaseStart || '',
            leaseTo: leaseEnd || '',
            currentRent: monthlyRent,
            proFormaRent: monthlyRent, // Use proFormaRent field expected by modal
            marketRent: monthlyRent,
            sqft: extractedData.squareFootage || 0,
            deposit: securityDeposit,
            isRealData: true // Mark as real data to override assumptions
          };
          
          if (existingEntryIndex >= 0) {
            rentRoll[existingEntryIndex] = rentEntry;
            integrationResults.push(`Updated rent roll for ${rentEntry.unit}: ${tenantName} - $${monthlyRent}/month`);
          } else {
            rentRoll.push(rentEntry);
            integrationResults.push(`Added tenant ${tenantName} to rent roll - $${monthlyRent}/month`);
          }
          
          existingDealData.rentRoll = rentRoll;
          updatedProperty.dealAnalyzerData = JSON.stringify(existingDealData);
        }
        break;

      case 'mortgage_statement':
        // Update loan information
        if (extractedData.lenderName && extractedData.currentBalance) {
          const existingDealData = property.dealAnalyzerData ? JSON.parse(property.dealAnalyzerData) : {};
          const loans = existingDealData.loans || [];
          
          // Find existing loan or create new one
          let loanIndex = loans.findIndex(loan => 
            loan.name?.toLowerCase().includes(extractedData.lenderName?.toLowerCase()) ||
            loan.lender?.toLowerCase().includes(extractedData.lenderName?.toLowerCase())
          );
          
          if (loanIndex === -1) {
            // Create new loan
            const newLoan = {
              id: loans.length + 1,
              name: `${extractedData.lenderName} Loan`,
              lender: extractedData.lenderName,
              amount: extractedData.currentBalance,
              currentBalance: extractedData.currentBalance,
              interestRate: extractedData.interestRate || 0,
              monthlyPayment: extractedData.monthlyPayment || 0,
              loanNumber: extractedData.loanNumber || '',
              isActive: true,
              loanType: 'acquisition'
            };
            loans.push(newLoan);
            integrationResults.push(`Added new loan from ${extractedData.lenderName}`);
          } else {
            // Update existing loan
            loans[loanIndex] = {
              ...loans[loanIndex],
              currentBalance: extractedData.currentBalance,
              interestRate: extractedData.interestRate || loans[loanIndex].interestRate,
              monthlyPayment: extractedData.monthlyPayment || loans[loanIndex].monthlyPayment,
              loanNumber: extractedData.loanNumber || loans[loanIndex].loanNumber
            };
            integrationResults.push(`Updated loan from ${extractedData.lenderName}`);
          }
          
          existingDealData.loans = loans;
          updatedProperty.dealAnalyzerData = JSON.stringify(existingDealData);
        }
        break;

      case 'llc_document':
        // Update entity information if relevant
        if (extractedData.entityName) {
          integrationResults.push(`Documented entity: ${extractedData.entityName}`);
        }
        break;

      default:
        // For unknown/other document types, store in notes or custom field
        integrationResults.push(`Stored ${Object.keys(extractedData).length} data fields from document`);
    }

    // Update property with new data
    if (integrationResults.length > 0) {
      await db.update(properties)
        .set(updatedProperty)
        .where(eq(properties.id, propertyId));
    }

    // Store the document processing record for history
    const documentRecord = {
      propertyId,
      documentType: processingResult.documentType,
      extractedData: JSON.stringify(extractedData),
      confidence,
      manualReview: true,
      integrationResults: integrationResults.join('; '),
      processedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'Document data integrated successfully',
      integrationResults,
      updatedFields: Object.keys(extractedData).length
    });

  } catch (error) {
    console.error('Manual review save error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save manual review',
      error: error.message
    });
  }
});

/**
 * Delete a processed document and its file
 */
router.delete('/delete/:id', async (req: Request, res: Response) => {
  try {
    const processingId = parseInt(req.params.id);
    
    if (isNaN(processingId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid processing ID'
      });
    }

    // Get the document record to find the file path
    const [document] = await db.select()
      .from(documentProcessingHistory)
      .where(eq(documentProcessingHistory.id, processingId));

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Delete the file from uploads directory
    const fs = require('fs').promises;
    const path = require('path');
    const filePath = path.join(process.cwd(), 'uploads', document.fileName);
    
    try {
      await fs.unlink(filePath);
    } catch (fileError) {
      console.warn('File deletion warning:', fileError.message);
      // Continue with database deletion even if file doesn't exist
    }

    // Delete the database record
    await db.delete(documentProcessingHistory)
      .where(eq(documentProcessingHistory.id, processingId));

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('Document deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete document',
      error: error.message
    });
  }
});

export default router;