/**
 * Tenant Details API Routes
 * Handles tenant detail data for property rent rolls
 */

import { Router, Request, Response } from 'express';
import { db } from '../db';
import { tenantDetails } from '../../shared/schema';
import { eq } from 'drizzle-orm';

const router = Router();

/**
 * Get tenant details by rent roll entry
 */
router.get('/property/:propertyId/unit/:unitNumber', async (req: Request, res: Response) => {
  try {
    const { propertyId, unitNumber } = req.params;
    
    const tenantDetail = await db.select()
      .from(tenantDetails)
      .where(
        eq(tenantDetails.propertyId, parseInt(propertyId))
      )
      .execute();

    // Find the tenant by unit number
    const tenant = tenantDetail.find(t => t.unitNumber === unitNumber);
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant details not found' });
    }

    res.json(tenant);
  } catch (error) {
    console.error('Error fetching tenant details:', error);
    res.status(500).json({ error: 'Failed to fetch tenant details' });
  }
});

/**
 * Get tenant details by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const [tenant] = await db.select()
      .from(tenantDetails)
      .where(eq(tenantDetails.id, parseInt(id)))
      .execute();
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    res.json(tenant);
  } catch (error) {
    console.error('Error fetching tenant details:', error);
    res.status(500).json({ error: 'Failed to fetch tenant details' });
  }
});

export default router;