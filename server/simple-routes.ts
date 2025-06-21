import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

// Simple session storage for development
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

  req.user = { id: session.userId };
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth endpoints
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Test user credentials
      const testUsers = {
        'michael@5central.capital': 'michael-id',
        'sarah@housedoctors.com': 'sarah-id', 
        'tom@arcadiavision.com': 'tom-id'
      };

      const userId = testUsers[email as keyof typeof testUsers];
      if (!userId || password !== 'test123') {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Create session token
      const token = `${userId}-${Date.now()}`;
      activeSessions.set(token, {
        userId,
        email,
        createdAt: new Date()
      });

      res.json({ 
        token, 
        user: { id: userId, email }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  });

  app.post('/api/auth/logout', async (req, res) => {
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

  app.get('/api/auth/user', authenticateUser, async (req, res) => {
    try {
      const userId = req.user.id;
      res.json({ id: userId, email: `${userId}@example.com` });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: 'Failed to fetch user' });
    }
  });

  // Dashboard endpoint
  app.get('/api/dashboard', authenticateUser, async (req, res) => {
    try {
      const userId = req.user.id;
      
      // Get user properties
      const properties = await storage.getPropertiesForUser(userId);
      
      // Calculate dashboard metrics
      const totalAUM = properties.reduce((sum, p) => {
        const arv = parseFloat(p.arv || '0');
        return sum + (isNaN(arv) ? 0 : arv);
      }, 0);
      
      const totalUnits = properties.reduce((sum, p) => {
        const units = parseInt(p.units?.toString() || '0');
        return sum + (isNaN(units) ? 0 : units);
      }, 0);
      
      const totalCashFlow = properties.reduce((sum, p) => {
        const cashFlow = parseFloat(p.monthlyCashFlow || '0');
        return sum + (isNaN(cashFlow) ? 0 : cashFlow);
      }, 0);
      
      const totalProfit = properties.reduce((sum, p) => {
        const profit = parseFloat(p.totalProfit || '0');
        return sum + (isNaN(profit) ? 0 : profit);
      }, 0);
      
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
          units: parseInt(p.units?.toString() || '0'),
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
  app.get('/api/properties', authenticateUser, async (req, res) => {
    try {
      const userId = req.user.id;
      const properties = await storage.getPropertiesForUser(userId);
      res.json(properties);
    } catch (error) {
      console.error('Get properties error:', error);
      res.status(500).json({ message: 'Failed to fetch properties' });
    }
  });

  // Update property endpoint
  app.put('/api/properties/:id', authenticateUser, async (req, res) => {
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
  app.post('/api/import-property', authenticateUser, async (req, res) => {
    try {
      const propertyData = req.body;
      
      // Create property with user context
      const property = await storage.createProperty({
        ...propertyData,
        entityId: propertyData.entityId || 1,
        status: 'Under Contract'
      });

      res.json(property);
    } catch (error) {
      console.error('Import property error:', error);
      res.status(500).json({ message: 'Failed to import property' });
    }
  });

  // Entities endpoint
  app.get('/api/entities', authenticateUser, async (req, res) => {
    try {
      const entities = await storage.getEntities();
      res.json(entities);
    } catch (error) {
      console.error('Get entities error:', error);
      res.status(500).json({ message: 'Failed to fetch entities' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}