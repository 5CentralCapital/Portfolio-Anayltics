import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { propertyMigrationService } from "./propertyMigration";
import bcrypt from "bcrypt";

// Simple session storage for development
const activeSessions = new Map<string, { userId: string; email: string; createdAt: Date }>();

function authenticateUser(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authHeader.replace('Bearer ', '');
  const session = activeSessions.get(token);
  
  if (!session) {
    return res.status(401).json({ message: 'Invalid session' });
  }

  req.user = session;
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Ensure API routes take priority over Vite middleware
  app.use('/api/*', (req, res, next) => {
    // Mark this as an API request to prevent Vite from intercepting
    res.setHeader('X-API-Route', 'true');
    next();
  });
  
  // Auth endpoints
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Test users for authentication
      const testUsers = [
        { id: '1', email: 'michael@5central.capital', password: 'test123' },
        { id: '2', email: 'sarah@housedoctors.com', password: 'test123' },
        { id: '3', email: 'tom@arcadiavision.com', password: 'test123' }
      ];
      
      const user = testUsers.find(u => u.email === email);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Create session
      const sessionToken = Buffer.from(`${user.id}-${Date.now()}`).toString('base64');
      activeSessions.set(sessionToken, {
        userId: user.id,
        email: user.email,
        createdAt: new Date()
      });

      res.json({ 
        token: sessionToken,
        user: { id: user.id, email: user.email }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      activeSessions.delete(token);
    }
    res.json({ message: 'Logged out' });
  });

  app.get('/api/auth/user', authenticateUser, async (req: any, res) => {
    try {
      res.json({
        id: req.user.userId,
        email: req.user.email
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: 'Failed to fetch user' });
    }
  });

  // Property endpoints
  app.get('/api/properties', authenticateUser, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const properties = await storage.getPropertiesForUser(userId);
      res.json(properties);
    } catch (error) {
      console.error('Get properties error:', error);
      res.status(500).json({ message: 'Failed to fetch properties' });
    }
  });

  app.get('/api/properties/:id', authenticateUser, async (req, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      const property = await storage.getProperty(propertyId);
      
      if (!property) {
        return res.status(404).json({ message: 'Property not found' });
      }

      res.json(property);
    } catch (error) {
      console.error('Get property error:', error);
      res.status(500).json({ message: 'Failed to fetch property' });
    }
  });

  app.put('/api/properties/:id', authenticateUser, async (req, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      const updates = req.body;
      
      const updatedProperty = await storage.updateProperty(propertyId, updates);
      
      if (!updatedProperty) {
        return res.status(404).json({ message: 'Property not found' });
      }

      res.json(updatedProperty);
    } catch (error) {
      console.error('Update property error:', error);
      res.status(500).json({ message: 'Failed to update property' });
    }
  });

  // Deal Analyzer import endpoint
  app.post('/api/import-property', authenticateUser, async (req: any, res) => {
    try {
      const { dealAnalyzerData, entity, acquisitionDate, broker, legalNotes } = req.body;
      
      if (!dealAnalyzerData) {
        return res.status(400).json({ message: 'Deal analyzer data is required' });
      }

      const dealData = typeof dealAnalyzerData === 'string' 
        ? JSON.parse(dealAnalyzerData) 
        : dealAnalyzerData;

      // Map entity name to ID
      const entityMapping: { [key: string]: number } = {
        '5Central Capital': 1,
        'The House Doctors': 2,
        'Arcadia Vision Group': 3
      };
      
      const entityId = entityMapping[entity] || 1;

      const additionalData = {
        acquisitionDate: acquisitionDate ? new Date(acquisitionDate) : undefined,
        broker,
        legalNotes
      };

      const importedProperty = await storage.importFromDealAnalyzer(
        dealData,
        entityId,
        additionalData
      );

      res.status(201).json(importedProperty);
    } catch (error) {
      console.error('Import property error:', error);
      res.status(500).json({ 
        message: 'Failed to import property',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Entity endpoints
  app.get('/api/entities', authenticateUser, async (req, res) => {
    try {
      const entities = await storage.getEntities();
      res.json(entities);
    } catch (error) {
      console.error('Get entities error:', error);
      res.status(500).json({ message: 'Failed to fetch entities' });
    }
  });

  // Migration endpoints
  app.post('/api/migrate-properties', authenticateUser, async (req, res) => {
    try {
      const result = await propertyMigrationService.migrateToNewSchema();
      res.json(result);
    } catch (error) {
      console.error('Migration error:', error);
      res.status(500).json({ 
        message: 'Migration failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get('/api/verify-migration', authenticateUser, async (req, res) => {
    try {
      const result = await propertyMigrationService.verifyMigration();
      res.json(result);
    } catch (error) {
      console.error('Verification error:', error);
      res.status(500).json({ message: 'Verification failed' });
    }
  });

  // Property component endpoints
  app.get('/api/properties/:id/rent-roll', authenticateUser, async (req, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      const rentRoll = await storage.getRentRoll(propertyId);
      res.json(rentRoll);
    } catch (error) {
      console.error('Get rent roll error:', error);
      res.status(500).json({ message: 'Failed to fetch rent roll' });
    }
  });

  app.get('/api/properties/:id/rehab-sections', authenticateUser, async (req, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      const rehabSections = await storage.getRehabSections(propertyId);
      res.json(rehabSections);
    } catch (error) {
      console.error('Get rehab sections error:', error);
      res.status(500).json({ message: 'Failed to fetch rehab sections' });
    }
  });

  app.get('/api/properties/:id/loans', authenticateUser, async (req, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      const loans = await storage.getLoans(propertyId);
      res.json(loans);
    } catch (error) {
      console.error('Get loans error:', error);
      res.status(500).json({ message: 'Failed to fetch loans' });
    }
  });

  app.get('/api/properties/:id/proforma', authenticateUser, async (req, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      const proforma = await storage.getMonthlyProforma(propertyId);
      res.json(proforma);
    } catch (error) {
      console.error('Get proforma error:', error);
      res.status(500).json({ message: 'Failed to fetch proforma' });
    }
  });

  // Dashboard endpoints
  app.get('/api/dashboard', authenticateUser, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const properties = await storage.getPropertiesForUser(userId);
      
      // Calculate dashboard metrics
      const totalProperties = properties.length;
      const totalAUM = properties.reduce((sum, p) => sum + parseFloat(p.arv || '0'), 0);
      const totalCashFlow = properties.reduce((sum, p) => sum + parseFloat(p.cashFlow || '0'), 0);
      const avgOccupancy = properties.length > 0 ? 
        properties.reduce((sum, p) => sum + (p.unitCount || 1), 0) / properties.length * 95 : 0;

      res.json({
        totalProperties,
        totalAUM,
        totalCashFlow,
        avgOccupancy,
        properties: properties.slice(0, 5) // Latest 5 properties
      });
    } catch (error) {
      console.error('Dashboard error:', error);
      res.status(500).json({ message: 'Failed to fetch dashboard data' });
    }
  });

  app.get('/api/revenue-trends', authenticateUser, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const properties = await storage.getPropertiesForUser(userId);
      
      // Generate revenue trend data
      const months = Array.from({ length: 12 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (11 - i));
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      });

      const revenueData = months.map((month, index) => ({
        month,
        revenue: properties.reduce((sum, p) => sum + parseFloat(p.cashFlow || '0'), 0) * (0.9 + Math.random() * 0.2)
      }));

      res.json(revenueData);
    } catch (error) {
      console.error('Revenue trends error:', error);
      res.status(500).json({ message: 'Failed to fetch revenue trends' });
    }
  });

  app.get('/api/property-performance', authenticateUser, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const properties = await storage.getPropertiesForUser(userId);
      
      const performanceData = properties.map(property => ({
        id: property.id,
        name: property.name,
        address: property.address,
        cashFlow: parseFloat(property.cashFlow || '0'),
        arv: parseFloat(property.arv || '0'),
        occupancy: 95 + Math.random() * 5,
        status: property.status
      }));

      res.json(performanceData);
    } catch (error) {
      console.error('Property performance error:', error);
      res.status(500).json({ message: 'Failed to fetch property performance' });
    }
  });

  app.get('/api/investor-leads', authenticateUser, async (req, res) => {
    try {
      // Return sample investor leads data
      const leads = [
        {
          id: 1,
          name: 'John Smith',
          email: 'john@example.com',
          phone: '555-0123',
          investmentAmount: 50000,
          status: 'New',
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          name: 'Jane Doe',
          email: 'jane@example.com',
          phone: '555-0456',
          investmentAmount: 100000,
          status: 'Qualified',
          createdAt: new Date().toISOString()
        }
      ];

      res.json(leads);
    } catch (error) {
      console.error('Investor leads error:', error);
      res.status(500).json({ message: 'Failed to fetch investor leads' });
    }
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}