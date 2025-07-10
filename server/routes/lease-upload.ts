/**
 * Lease Upload API Routes
 * Handles CSV lease file uploads and processing
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { csvLeaseProcessor } from '../csv-lease-processor.service';

const router = Router();

// Configure multer for lease CSV uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads/leases';
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /\.(csv|xlsx|xls)$/i;
    if (allowedTypes.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV and Excel files are allowed for lease uploads.'));
    }
  }
});

interface LeaseUploadRequest extends Request {
  body: {
    autoSave?: boolean | 'true' | 'false';
  };
}

/**
 * Upload and process CSV lease file
 */
router.post('/upload', upload.single('leaseFile'), async (req: LeaseUploadRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: 'No file uploaded' 
      });
    }

    const { autoSave } = req.body;
    const filePath = req.file.path;
    const fileName = req.file.originalname;

    console.log(`Processing lease file: ${fileName}`);

    // Process the CSV lease file
    const processingResult = await csvLeaseProcessor.processLeaseCSV(filePath, fileName);

    if (!processingResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Failed to process lease file',
        details: processingResult.errors
      });
    }

    // If autoSave is enabled, save to database immediately
    let saveResult = null;
    const shouldAutoSave = autoSave === true || autoSave === 'true';
    if (shouldAutoSave) {
      saveResult = await csvLeaseProcessor.saveLeaseDataToDatabase(
        processingResult.leaseData,
        processingResult.propertyMatches
      );
    }

    // Clean up uploaded file
    try {
      fs.unlinkSync(filePath);
    } catch (error) {
      console.warn('Failed to delete uploaded file:', error);
    }

    res.json({
      success: true,
      message: `Successfully processed ${processingResult.processedCount} lease records`,
      data: {
        processedCount: processingResult.processedCount,
        leaseData: processingResult.leaseData,
        propertyMatches: processingResult.propertyMatches,
        warnings: processingResult.warnings,
        saveResult: saveResult
      }
    });

  } catch (error) {
    console.error('Error processing lease upload:', error);
    
    // Clean up file on error
    if (req.file?.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.warn('Failed to cleanup file on error:', cleanupError);
      }
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error processing lease file',
      details: error.message
    });
  }
});

/**
 * Manual save of processed lease data
 */
router.post('/save', async (req: Request, res: Response) => {
  try {
    const { leaseData, propertyMatches } = req.body;

    if (!leaseData || !propertyMatches) {
      return res.status(400).json({
        success: false,
        error: 'Missing lease data or property matches'
      });
    }

    const saveResult = await csvLeaseProcessor.saveLeaseDataToDatabase(leaseData, propertyMatches);

    res.json({
      success: true,
      message: `Successfully saved ${saveResult.saved} lease records`,
      data: saveResult
    });

  } catch (error) {
    console.error('Error saving lease data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save lease data',
      details: error.message
    });
  }
});

/**
 * Get CSV template for lease uploads
 */
router.get('/template', (req: Request, res: Response) => {
  try {
    const template = `Tenant name,Phone,Email,Address,Unit #,Lease from,Lease to,Monthly rent,Security Deposit,Pet Policy,Utilities,Parking
"Smith, John",(555)123-4567,john.smith@email.com,123 Main St,1,1/1/2025,12/31/2025,1500.00,1500.00,No pets without written consent,Electric,1 space
"Johnson, Mary",(555)987-6543,mary.johnson@email.com,123 Main St,2,2/1/2025,1/31/2026,1600.00,1600.00,Pets allowed with deposit,Electric and Gas,`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="lease_template.csv"');
    res.send(template);

  } catch (error) {
    console.error('Error generating template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate CSV template'
    });
  }
});

export default router;