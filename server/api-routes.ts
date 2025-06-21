import { Router } from 'express';
import { storage } from './storage';
import bcrypt from 'bcrypt';

const router = Router();

// Simple session storage
const activeSessions = new Map<string, { userId: string; email: string; createdAt: Date }>();

// Authentication middleware
function authenticateUser(req: any, res: any, next: any) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const session = activeSessions.get(token);
  if (!session) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  req.user = session;
  next();
}

// Auth endpoints
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Get user by email
    const user = await storage.getUser(email); // Using email as ID for now
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // For testing, use simple password comparison
    const validPassword = password === 'test123';
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create session token
    const token = `${user.id}-${Date.now()}`;
    activeSessions.set(token, {
      userId: user.id,
      email: user.email || '',
      createdAt: new Date()
    });

    res.json({ token, user });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

router.post('/auth/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      activeSessions.delete(token);
    }
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Logout failed' });
  }
});

router.get('/auth/user', authenticateUser, async (req, res) => {
  try {
    const user = await storage.getUser(req.user.userId);
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

// Dashboard endpoint
router.get('/dashboard', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get user properties
    const properties = await storage.getPropertiesForUser(userId);
    
    // Calculate dashboard metrics
    const totalAUM = properties.reduce((sum, p) => sum + (parseFloat(p.arv || '0') || 0), 0);
    const totalUnits = properties.reduce((sum, p) => sum + (p.units || 0), 0);
    const totalCashFlow = properties.reduce((sum, p) => sum + (parseFloat(p.monthlyCashFlow || '0') || 0), 0);
    const totalProfit = properties.reduce((sum, p) => sum + (parseFloat(p.totalProfit || '0') || 0), 0);
    
    const dashboardData = {
      totalAUM,
      pricePerUnit: totalUnits > 0 ? totalAUM / totalUnits : 0,
      totalUnits,
      totalProperties: properties.length,
      equityMultiple: totalAUM > 0 ? (totalAUM + totalProfit) / totalAUM : 0,
      monthlyCashFlow: totalCashFlow,
      properties: properties.map(p => ({
        id: p.id,
        name: p.name,
        address: p.address,
        city: p.city,
        state: p.state,
        status: p.status,
        entityId: p.entityId,
        units: p.units,
        arv: parseFloat(p.arv || '0'),
        monthlyCashFlow: parseFloat(p.monthlyCashFlow || '0'),
        totalProfit: parseFloat(p.totalProfit || '0'),
        cashOnCashReturn: parseFloat(p.cashOnCashReturn || '0')
      }))
    };

    res.json(dashboardData);
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard data' });
  }
});

// Properties endpoint
router.get('/properties', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.userId;
    const properties = await storage.getPropertiesForUser(userId);
    res.json(properties);
  } catch (error) {
    console.error('Get properties error:', error);
    res.status(500).json({ message: 'Failed to fetch properties' });
  }
});

// Update property endpoint
router.put('/properties/:id', authenticateUser, async (req, res) => {
  try {
    const propertyId = parseInt(req.params.id);
    const updates = req.body;
    
    const updatedProperty = await storage.updateProperty(propertyId, updates);
    res.json(updatedProperty);
  } catch (error) {
    console.error('Update property error:', error);
    res.status(500).json({ message: 'Failed to update property' });
  }
});

// Import property from Deal Analyzer
router.post('/import-property', authenticateUser, async (req, res) => {
  try {
    const propertyData = req.body;
    const userId = req.user.userId;
    
    // Create property with user context
    const property = await storage.createProperty({
      ...propertyData,
      entityId: propertyData.entityId || 1, // Default to first entity
      status: 'Under Contract'
    });

    res.json(property);
  } catch (error) {
    console.error('Import property error:', error);
    res.status(500).json({ message: 'Failed to import property' });
  }
});

// Entities endpoint
router.get('/entities', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.userId;
    const entities = await storage.getEntitiesForUser(userId);
    res.json(entities);
  } catch (error) {
    console.error('Get entities error:', error);
    res.status(500).json({ message: 'Failed to fetch entities' });
  }
});

export { router as apiRouter };