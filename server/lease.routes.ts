import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { leaseProcessingService } from './lease-processing.service';
// Authentication middleware
function authenticateSession(req: any, res: any, next: any) {
  // First try session-based authentication
  if (req.session && req.session.userId) {
    req.session.user = { id: req.session.userId, email: req.session.userEmail };
    return next();
  }
  return res.status(401).json({ error: 'Authentication required' });
}

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `lease_${name}_${timestamp}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10 // Max 10 files per upload
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${ext} not supported. Allowed: ${allowedTypes.join(', ')}`));
    }
  }
});

/**
 * Upload and process lease documents
 */
router.post('/upload', upload.array('leases', 10), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    console.log(`Processing ${files.length} lease file(s):`, files.map(f => f.filename));

    // Process the lease files
    const results = await leaseProcessingService.processLeaseFiles(files);

    // Clean up uploaded files
    files.forEach(file => {
      try {
        fs.unlinkSync(file.path);
      } catch (error) {
        console.warn(`Failed to delete temporary file: ${file.path}`);
      }
    });

    res.json({
      success: results.success,
      message: `Processed ${results.parsed} lease(s), matched ${results.matched} to properties`,
      results: {
        fileName: results.fileName,
        parsed: results.parsed,
        matched: results.matched,
        unmatched: results.unmatched,
        updated: results.updated,
        errors: results.errors,
        warnings: results.warnings
      },
      data: results.data
    });

  } catch (error) {
    console.error('Lease upload error:', error);
    
    // Clean up files on error
    if (req.files) {
      const files = req.files as Express.Multer.File[];
      files.forEach(file => {
        try {
          fs.unlinkSync(file.path);
        } catch (cleanupError) {
          console.warn(`Failed to delete file on error: ${file.path}`);
        }
      });
    }

    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to process lease documents'
    });
  }
});

/**
 * Handle manual review of unmatched leases
 */
router.post('/manual-review', async (req, res) => {
  try {
    const { originalLease, editedLease, propertyId, manualReview } = req.body;

    if (!propertyId) {
      return res.status(400).json({
        success: false,
        message: 'Property ID is required'
      });
    }

    const result = await leaseProcessingService.saveManualReview({
      originalLease,
      editedLease: { ...editedLease, propertyId },
      propertyId,
      manualReview
    });

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        tenantName: editedLease.tenant
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message
      });
    }

  } catch (error) {
    console.error('Manual review save error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to save lease data'
    });
  }
});

/**
 * Get lease processing history
 */
router.get('/history', authenticateSession, async (req, res) => {
  try {
    // For now, return empty array - this would be implemented with a proper history table
    res.json([]);
  } catch (error) {
    console.error('Error fetching lease history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lease processing history'
    });
  }
});

export default router;