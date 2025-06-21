import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

// Simple session storage for development
const activeSessions = new Map<string, { userId: number; email: string; createdAt: Date }>();

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
      
      // Test user credentials with numeric IDs
      const testUsers: Record<string, number> = {
        'michael@5central.capital': 1,
        'sarah@housedoctors.com': 2, 
        'tom@arcadiavision.com': 3
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
      const session = Array.from(activeSessions.values()).find(s => s.userId === userId);
      res.json({ id: userId, email: session?.email || `user${userId}@example.com` });
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

  // Revenue trends endpoint - calculate from actual property data
  app.get('/api/revenue-trends', authenticateUser, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const properties = await storage.getPropertiesForUser(userId);
      
      // Calculate monthly trends based on actual property cash flows
      const totalMonthlyCashFlow = properties.reduce((sum, prop) => {
        const monthly = parseFloat(prop.monthlyCashFlow?.toString() || '0');
        return sum + monthly;
      }, 0);
      
      // Generate 12-month trend data
      const trends = [];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      for (let i = 0; i < 12; i++) {
        // Simulate slight monthly variations
        const variation = 0.9 + (Math.random() * 0.2); // 90% to 110%
        trends.push({
          month: months[i],
          revenue: Math.round(totalMonthlyCashFlow * variation),
          expenses: Math.round(totalMonthlyCashFlow * 0.7 * variation) // Assume 70% expense ratio
        });
      }
      
      res.json({ trends });
    } catch (error) {
      console.error('Revenue trends error:', error);
      res.status(500).json({ message: 'Failed to fetch revenue trends' });
    }
  });

  // Property performance endpoint - use actual property data
  app.get('/api/property-performance', authenticateUser, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const properties = await storage.getPropertiesForUser(userId);
      
      // Get top performing properties
      const performance = properties
        .filter(prop => prop.status === 'Cashflowing')
        .map(prop => ({
          property: prop.name,
          cashFlow: parseFloat(prop.monthlyCashFlow?.toString() || '0'),
          cashOnCash: parseFloat(prop.cashOnCashReturn?.toString() || '0')
        }))
        .sort((a, b) => b.cashFlow - a.cashFlow)
        .slice(0, 10);
      
      res.json({ performance });
    } catch (error) {
      console.error('Property performance error:', error);
      res.status(500).json({ message: 'Failed to fetch property performance' });
    }
  });

  // Investor leads endpoint - return empty array for now
  app.get('/api/investor-leads', authenticateUser, async (req, res) => {
    try {
      // Return empty leads array since this is not implemented yet
      const leads: any[] = [];
      res.json({ leads });
    } catch (error) {
      console.error('Investor leads error:', error);
      res.status(500).json({ message: 'Failed to fetch investor leads' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}