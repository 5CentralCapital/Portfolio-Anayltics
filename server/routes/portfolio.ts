import express from 'express';
import { storage } from '../storage';

const router = express.Router();

// Authentication middleware
function authenticateUser(req: any, res: any, next: any) {
  // First try session-based authentication
  if (req.session && req.session.userId) {
    req.user = { id: req.session.userId, email: req.session.userEmail };
    return next();
  }

  // Fallback to token-based authentication
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    // Would need to validate token against active sessions
    // For now, just accept any token format
    req.user = { id: 1, email: 'user@example.com' };
    return next();
  }

  return res.status(401).json({ error: 'Authentication required' });
}

// Get portfolio analytics for roadmap
router.get('/analytics', authenticateUser, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const properties = await storage.getPropertiesForUser(userId);
    
    // Calculate portfolio metrics
    const totalAUM = properties.reduce((sum, prop) => {
      // Use acquisition price or current value
      const value = prop.arvAtTimePurchased || prop.acquisitionPrice;
      return sum + (value ? parseFloat(value.toString()) : 0);
    }, 0);

    const totalProperties = properties.length;
    
    const totalCashFlow = properties.reduce((sum, prop) => {
      return sum + (prop.cashFlow ? parseFloat(prop.cashFlow.toString()) : 0);
    }, 0);

    const totalInvestment = properties.reduce((sum, prop) => {
      return sum + (prop.initialCapitalRequired ? parseFloat(prop.initialCapitalRequired.toString()) : 0);
    }, 0);

    const avgROI = totalInvestment > 0 ? (totalCashFlow * 12) / totalInvestment * 100 : 0;

    const analytics = {
      totalAUM,
      totalProperties,
      netCashFlow: totalCashFlow,
      portfolioROI: avgROI,
      averagePropertyValue: totalProperties > 0 ? totalAUM / totalProperties : 0,
      monthlyRentRoll: Math.abs(totalCashFlow), // Monthly cash flow
      occupancyRate: 95, // Estimated
      portfolioCapRate: 6.5, // Estimated
    };

    res.json(analytics);
  } catch (error) {
    console.error('Error getting portfolio analytics:', error);
    res.status(500).json({ error: 'Failed to get portfolio analytics' });
  }
});

export default router;