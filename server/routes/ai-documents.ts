/**
 * AI Document Processing API Routes
 * Handles upload and processing of property documents using OpenAI
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { aiDocumentProcessor, ProcessingResult } from '../ai-document-processor.service';
import { csvLeaseProcessor } from '../csv-lease-processor.service';
import { db } from '../db';
import { properties, propertyRentRoll, entityMemberships, propertyLoans, documentProcessingHistory, tenantDetails } from '../../shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import Decimal from 'decimal.js-light';
import { safeJson, toDateString } from '@shared/utils';

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
    autoApply?: boolean | 'true' | 'false';
    model?: string;
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

    let result: ProcessingResult;

    // Check if it's a CSV file for lease processing
    const isCSV = fileName.toLowerCase().endsWith('.csv');
    const hasLeaseKeyword = fileName.toLowerCase().includes('lease');
    const hasTenantKeyword = fileName.toLowerCase().includes('tenant');
    
    console.log(`CSV Detection - isCSV: ${isCSV}, hasLeaseKeyword: ${hasLeaseKeyword}, hasTenantKeyword: ${hasTenantKeyword}`);
    
    if (isCSV && (hasLeaseKeyword || hasTenantKeyword)) {
      console.log('✓ Detected CSV lease file, using CSV processor');
      
      try {
        console.log('🔄 Starting CSV lease processing...');
        const csvResult = await csvLeaseProcessor.processLeaseCSV(filePath, fileName);
        console.log('📊 CSV processing result:', csvResult);
        
        if (csvResult.success) {
          console.log(`✓ CSV processed successfully: ${csvResult.processedCount} records found`);
          
          // Convert CSV result to ProcessingResult format
          result = {
            success: true,
            documentType: 'lease',
            // cast to any to satisfy ProcessingResult structure
            extractedData: {
              tenantNames: csvResult.leaseData.map(lease => lease.tenantName),
              propertyAddress: csvResult.leaseData[0]?.address || '',
              leaseData: csvResult.leaseData,
              propertyMatches: csvResult.propertyMatches
            } as any,
            confidence: 0.95,
            warnings: csvResult.warnings,
            suggestedActions: [
              'CSV lease data processed successfully',
              'Review property matches before applying',
              'Check tenant details for completeness'
            ]
          };

          console.log(`📝 Auto-apply setting: ${autoApply}`);

          // Normalise autoApply to a boolean
          const shouldAutoApply = autoApply === true || autoApply === 'true';

          // Auto-save to database if requested
          if (shouldAutoApply) {
            console.log('💾 Auto-saving to database...');
            const saveResult = await csvLeaseProcessor.saveLeaseDataToDatabase(
              csvResult.leaseData,
              csvResult.propertyMatches
            );
            console.log('💾 Save result:', saveResult);
            result.suggestedActions?.push(`Saved ${saveResult.saved} lease records to database`);
            if (saveResult.errors.length > 0) {
              result.warnings = [...(result.warnings || []), ...saveResult.errors];
            }
          }
        } else {
          console.log('❌ CSV processing failed:', csvResult.errors);
          result = {
            success: false,
            documentType: 'lease',
            extractedData: null,
            confidence: 0,
            errors: csvResult.errors
          };
        }
      } catch (error) {
        console.error('CSV processing error:', error);
        result = {
          success: false,
          documentType: 'lease',
          extractedData: null,
          confidence: 0,
          errors: [`CSV processing failed: ${error.message}`]
        };
      }
    } else {
      console.log('📄 Processing with AI (not CSV lease file)');
      // Process with AI for non-CSV files
      result = await aiDocumentProcessor.processDocument(filePath, fileName, model || 'gpt-4o');
    }

    // Store processing result
    const processingRecord = await db.insert(documentProcessingHistory).values({
      fileName,
      filePath,
      documentType: result.documentType || 'unknown',
      extractedData: JSON.stringify(result.extractedData ?? {}),
      confidence: new Decimal(result.confidence ?? 0).toFixed(2),
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
    const shouldAutoApply = autoApply === true || autoApply === 'true';

    if (shouldAutoApply && result.success && result.confidence > 0.8) {
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
      requiresReview: !shouldAutoApply || result.confidence <= 0.8
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
    
    let historyQuery = db.select().from(documentProcessingHistory);

    if (propertyId) {
      historyQuery = historyQuery.where(eq(documentProcessingHistory.propertyId, Number(propertyId))) as typeof historyQuery;
    } else if (entityId) {
      historyQuery = historyQuery.where(eq(documentProcessingHistory.entityId, Number(entityId))) as typeof historyQuery;
    }

    const history = await historyQuery
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
    
    const filePath: string | null = record.filePath;
    if (!filePath || !fs.existsSync(filePath)) {
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
    const extractedData = safeJson<any>(record.extractedData);

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
      unitTypeId: 'generic',
      unitNumber: leaseData.unitNumber || '1',
      currentRent: leaseData.monthlyRent?.toString() || '0',
      proFormaRent: leaseData.monthlyRent?.toString() || '0',
      tenantName: Array.isArray(leaseData.tenantNames) ? leaseData.tenantNames[0] : leaseData.tenantNames,
      leaseStart: toDateString(leaseData.leaseStartDate),
      leaseEnd: toDateString(leaseData.leaseEndDate)
    };

    if (existingRentRoll.length > 0) {
      await db.update(propertyRentRoll)
        .set(rentRollData)
        .where(and(
          eq(propertyRentRoll.propertyId, propertyId),
          eq(propertyRentRoll.unitNumber, leaseData.unitNumber || '1')
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
    await db.delete(entityMemberships as any).where(eq((entityMemberships as any).entity_id, entityId));

    // Insert new memberships
    for (const member of llcData.members) {
      await db.insert(entityMemberships as any).values({
        entity_id: entityId,
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
      loanName: mortgageData.loanNumber || mortgageData.lenderName || 'Loan',
      loanType: 'acquisition' as const,
      originalAmount: mortgageData.currentBalance?.toString() || '0',
      currentBalance: mortgageData.currentBalance?.toString() || '0',
      interestRate: new Decimal(mortgageData.interestRate || 0).toFixed(4),
      termYears: 30,
      monthlyPayment: mortgageData.monthlyPayment?.toString() || '0',
      paymentType: 'principal_and_interest' as const,
      maturityDate: toDateString(mortgageData.maturityDate) || toDateString(new Date()),
      isActive: true,
      lender: mortgageData.lenderName,
      escrowBalance: mortgageData.escrowBalance?.toString() || null,
      nextPaymentDate: toDateString(mortgageData.nextPaymentDate),
      statementDate: toDateString(mortgageData.statementDate),
      syncStatus: 'success' as const,
      lastSyncDate: new Date()
    };

    // Check if loan record exists
    const existingLoan = await db.select()
      .from(propertyLoans)
      .where(and(
        eq(propertyLoans.propertyId, propertyId),
        eq(propertyLoans.loanName, mortgageData.loanNumber || mortgageData.lenderName)
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
        
        // Extract unit number from various sources
        if (extractedData.unitNumber) {
          unitNumber = extractedData.unitNumber;
        } else if (propertyAddress && propertyAddress.includes('#')) {
          const unitMatch = propertyAddress.match(/#(\w+)/);
          if (unitMatch) {
            unitNumber = unitMatch[1];
          }
        } else if (propertyAddress && propertyAddress.toLowerCase().includes('unit')) {
          const unitMatch = propertyAddress.match(/unit\s*(\w+)/i);
          if (unitMatch) {
            unitNumber = unitMatch[1];
          }
        }
        
        // If no unit number found, generate one based on existing rent roll
        if (!unitNumber) {
          const existingUnits = rentRoll
            .map((entry: { unitNumber?: string; unit?: string }) => {
              const raw = entry.unitNumber ?? entry.unit ?? '';
              const digits = raw.replace(/\D/g, '');
              return Number.parseInt(digits) || 0;
            })
            .filter((num: number) => num > 0);
          const maxUnit = Math.max(0, ...existingUnits);
          unitNumber = `${maxUnit + 1}`;
        }
        
        if (tenantName && monthlyRent > 0) {
          // Create comprehensive tenant details record
          const tenantDetailsData = {
            propertyId: propertyId,
            unitNumber: unitNumber,
            tenantName: tenantName,
            tenantAddress: extractedData.tenant?.address || '',
            tenantPhone: extractedData.tenant?.phone || '',
            tenantEmail: extractedData.tenant?.email || '',
            leaseStartDate: leaseStart ? new Date(leaseStart) : null,
            leaseEndDate: leaseEnd ? new Date(leaseEnd) : null,
            monthlyRent: monthlyRent.toString(),
            securityDeposit: securityDeposit?.toString() || '0',
            totalMoveInCost: (extractedData.lease_details?.total_move_in_cost || extractedData.financial_details?.total_move_in_cost)?.toString() || '0',
            rentDueDate: extractedData.lease_details?.rent_due_date || 'First of each month',
            lateFee: (extractedData.lease_details?.late_fee || extractedData.financial_details?.late_fee)?.toString() || '0',
            utilitiesResponsibility: extractedData.rules_and_policies?.utilities_responsibility || '',
            petPolicy: extractedData.rules_and_policies?.pet_policy || '',
            smokingPolicy: extractedData.rules_and_policies?.smoking_policy || '',
            guestPolicy: extractedData.rules_and_policies?.guest_policy || '',
            alterationPolicy: extractedData.rules_and_policies?.alteration_policy || '',
            movingOutNotice: extractedData.moving_out?.notice_period || '',
            lockOutCharge: (extractedData.lease_details?.lock_out_charge)?.toString() || '0',
            maintenancePolicy: extractedData.maintenance_and_repairs?.tenant_responsibility || '',
            paymentMethods: extractedData.payment_methods || [],
            automaticPaymentAuth: extractedData.authorization?.automatic_payments === 'Authorized' || false,
            governingLaw: extractedData.legal_information?.governing_law || '',
            fullLeaseData: extractedData,
            sourceDocumentId: null // Will be set when document processing is complete
          };

          try {
            // Save comprehensive tenant details to database
            const [createdTenantDetails] = await db.insert(tenantDetails).values(tenantDetailsData).returning();
            
            // Find existing rent roll entry for this tenant or unit
            let existingEntryIndex = rentRoll.findIndex((entry: any) => 
              entry.tenantName?.toLowerCase() === tenantName.toLowerCase() ||
              entry.unitNumber === unitNumber ||
              entry.unit === unitNumber
            );
            
            const rentEntry = {
              id: existingEntryIndex >= 0 ? rentRoll[existingEntryIndex].id : (rentRoll.length + 1),
              unitNumber: unitNumber,
              unitTypeId: rentRoll[existingEntryIndex]?.unitTypeId || '1br',
              tenantName: tenantName,
              leaseFrom: leaseStart || '',
              leaseTo: leaseEnd || '',
              currentRent: monthlyRent,
              proFormaRent: monthlyRent,
              marketRent: monthlyRent,
              sqft: extractedData.squareFootage || 0,
              deposit: securityDeposit || 0,
              isRealData: true,
              tenantDetailsId: createdTenantDetails.id
            };
            
            if (existingEntryIndex >= 0) {
              rentRoll[existingEntryIndex] = { ...rentRoll[existingEntryIndex], ...rentEntry };
              integrationResults.push(`Updated unit ${unitNumber}: ${tenantName} - $${monthlyRent}/month with full lease details`);
            } else {
              rentRoll.push(rentEntry);
              integrationResults.push(`Added tenant ${tenantName} to unit ${unitNumber} - $${monthlyRent}/month with comprehensive lease data`);
            }
            
            existingDealData.rentRoll = rentRoll;
            updatedProperty.dealAnalyzerData = JSON.stringify(existingDealData);
            
          } catch (dbError) {
            console.warn('Failed to save tenant details to database:', dbError);
            // Continue with basic rent roll entry
            const rentEntry = {
              id: rentRoll.length + 1,
              unitNumber: unitNumber,
              unitTypeId: '1br',
              tenantName: tenantName,
              leaseFrom: leaseStart || '',
              leaseTo: leaseEnd || '',
              currentRent: monthlyRent,
              proFormaRent: monthlyRent,
              marketRent: monthlyRent,
              isRealData: true
            };
            
            rentRoll.push(rentEntry);
            existingDealData.rentRoll = rentRoll;
            updatedProperty.dealAnalyzerData = JSON.stringify(existingDealData);
            integrationResults.push(`Added tenant ${tenantName} to unit ${unitNumber} - $${monthlyRent}/month (basic data only)`);
          }
        }
        break;

      case 'mortgage_statement':
        // Update loan information
        if (extractedData.lenderName && extractedData.currentBalance) {
          const existingDealData = property.dealAnalyzerData ? JSON.parse(property.dealAnalyzerData) : {};
          const loans = existingDealData.loans || [];
          
          // Find existing loan or create new one
          let loanIndex = loans.findIndex((loan: any) => 
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
    const filePath = path.join(process.cwd(), 'uploads', document.fileName);
    
    try {
      await fs.promises.unlink(filePath);
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