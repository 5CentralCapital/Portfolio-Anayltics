import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { kpiService } from "./kpi.service";
import { dealAnalyzerService } from "./dealAnalyzerService";
import { migratePropertyData } from "./migration";
import { 
  insertUserSchema, insertPropertySchema, insertCompanyMetricSchema, insertInvestorLeadSchema,
  insertDealSchema, insertDealRehabSchema, insertDealUnitsSchema, insertDealExpensesSchema,
  insertDealClosingCostsSchema, insertDealHoldingCostsSchema, insertDealLoansSchema,
  insertDealOtherIncomeSchema, insertDealCompsSchema
} from "@shared/schema";
import { z } from "zod";

// Simple session storage (in production, use Redis or database)
const activeSessions = new Map<string, { userId: number; email: string; createdAt: Date }>();

// Middleware to authenticate users
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
    const session = activeSessions.get(token);
    
    if (session) {
      req.user = { id: session.userId, email: session.email };
      return next();
    }
  }

  return res.status(401).json({ error: 'Authentication required' });
}

// WebSocket connections for real-time KPI updates
const dealConnections = new Map<number, Set<WebSocket>>();

// Helper function to broadcast KPI updates
async function broadcastKPIUpdate(dealId: number) {
  const connections = dealConnections.get(dealId);
  if (!connections || connections.size === 0) return;

  try {
    const kpis = await kpiService.calculateKPIs(dealId);
    const message = JSON.stringify({ type: 'kpi_update', dealId, kpis });
    
    connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  } catch (error) {
    console.error('Error broadcasting KPI update:', error);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isValidPassword = await storage.validatePassword(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      if (!user.isActive) {
        return res.status(401).json({ error: "Account is disabled" });
      }

      await storage.updateUserLastLogin(user.id);

      // Set up session data
      (req as any).session.userId = user.id;
      (req as any).session.userEmail = user.email;

      // Also create session token for backward compatibility
      const sessionToken = `session_${user.id}_${Date.now()}_${Math.random().toString(36)}`;
      activeSessions.set(sessionToken, {
        userId: user.id,
        email: user.email,
        createdAt: new Date()
      });

      const userWithoutPassword = {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      };

      res.json({ 
        user: userWithoutPassword,
        token: sessionToken
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", async (req: any, res) => {
    // Clear session data
    if (req.session) {
      req.session.destroy((err: any) => {
        if (err) {
          console.error('Session destruction error:', err);
        }
      });
    }

    // Also clean up token-based sessions for backward compatibility
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      activeSessions.delete(token);
    }
    
    res.json({ message: "Logged out successfully" });
  });

  // User registration route
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName, entities } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }

      // Create user account
      const hashedPassword = await storage.hashPassword(password);
      const newUser = await storage.createUser({
        email,
        passwordHash: hashedPassword,
        firstName,
        lastName,
        role: "viewer"
      });

      // Create entity ownership records
      if (entities && Array.isArray(entities)) {
        for (const entity of entities) {
          await storage.createEntityOwnership({
            userId: newUser.id,
            entityName: entity.entityName,
            assetType: entity.assetType,
            ownershipPercentage: entity.ownershipPercentage,
            currentValue: entity.currentValue || "0",
            description: entity.description
          });
        }
      }

      const userWithoutPassword = {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
      };

      res.status(201).json({ 
        user: userWithoutPassword,
        message: "Account created successfully"
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get user entity ownership
  app.get("/api/user/:userId/entities", authenticateUser, async (req: any, res) => {
    try {
      const requestedUserId = parseInt(req.params.userId);
      const authenticatedUserId = req.user.id;
      
      // Users can only access their own entity ownership data
      if (requestedUserId !== authenticatedUserId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const entities = await storage.getUserEntityOwnership(authenticatedUserId);
      res.json(entities);
    } catch (error) {
      console.error("Error fetching user entities:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Dashboard data route
  app.get("/api/dashboard", authenticateUser, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const properties = await storage.getPropertiesForUser(userId);
      const latestMetrics = await storage.getLatestCompanyMetrics();
      const investorLeads = await storage.getInvestorLeads();

      // Calculate portfolio statistics
      const activeProperties = properties.filter(p => p.status === 'Currently Own');
      const soldProperties = properties.filter(p => p.status === 'Sold');
      
      const totalProperties = properties.length;
      const totalUnits = properties.reduce((sum, p) => sum + (p.apartments || 0), 0);
      const totalValue = activeProperties.reduce((sum, p) => sum + Number(p.arvAtTimePurchased || p.acquisitionPrice || 0), 0);
      const monthlyRent = activeProperties.reduce((sum, p) => sum + Number(p.cashFlow || 0), 0);
      const avgCashOnCash = properties.length > 0 
        ? properties.reduce((sum, p) => sum + Number(p.cashOnCashReturn || 0), 0) / properties.length 
        : 0;
      const avgAnnualizedReturn = properties.length > 0
        ? properties.reduce((sum, p) => sum + Number(p.annualizedReturn || 0), 0) / properties.length 
        : 0;

      const dashboardData = {
        financial: {
          revenue: Number(latestMetrics?.revenue || 0),
          expenses: Number(latestMetrics?.expenses || 0),
          profit: Number(latestMetrics?.revenue || 0) - Number(latestMetrics?.expenses || 0),
          profitMargin: Number(latestMetrics?.profitMargin || 0),
          revenueGrowth: 15.2, // Mock data
          monthlyRecurringRevenue: Number(latestMetrics?.monthlyRecurringRevenue || monthlyRent),
        },
        portfolio: {
          totalProperties,
          totalUnits,
          totalValue,
          monthlyRent,
          avgCashOnCash,
          avgAnnualizedReturn,
        },
        customers: {
          total: investorLeads.length,
          active: investorLeads.filter(l => l.status === 'qualified' || l.status === 'converted').length,
          averageValue: 250000, // Mock data
          acquisitionCost: Number(latestMetrics?.customerAcquisitionCost || 0),
          lifetimeValue: Number(latestMetrics?.customerLifetimeValue || 0),
          churnRate: Number(latestMetrics?.churnRate || 0),
        },
        lastUpdated: new Date().toISOString(),
      };

      res.json(dashboardData);
    } catch (error) {
      console.error("Dashboard error:", error);
      res.status(500).json({ error: "Failed to load dashboard data" });
    }
  });

  // Revenue trends route
  app.get("/api/revenue-trends", async (req, res) => {
    try {
      const { period = "12" } = req.query;
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - parseInt(period as string));

      const metrics = await storage.getCompanyMetrics(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );

      res.json(metrics);
    } catch (error) {
      console.error("Revenue trends error:", error);
      res.status(500).json({ error: "Failed to load revenue trends" });
    }
  });

  // Property performance route
  app.get("/api/property-performance", authenticateUser, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const properties = await storage.getPropertiesForUser(userId);
      
      // Transform properties to match the expected format
      const transformedProperties = properties.map(p => ({
        id: p.id.toString(),
        address: p.address,
        city: p.city,
        state: p.state,
        units: p.apartments,
        acquisition_price: Number(p.acquisitionPrice),
        rehab_costs: Number(p.rehabCosts || 0),
        current_value: p.salePrice ? Number(p.salePrice) : Number(p.arvAtTimePurchased || p.acquisitionPrice),
        monthly_rent: Number(p.cashFlow || 0),
        cash_on_cash_return: Number(p.cashOnCashReturn),
        annualized_return: Number(p.annualizedReturn),
        status: p.status === "Currently Own" ? "active" : "sold",
        equity_created: Number(p.totalProfits || 0),
        total_profits: Number(p.totalProfits || 0),
        years_held: Number(p.yearsHeld || 1),
        initial_capital: Number(p.initialCapitalRequired),
        rental_yield: p.cashFlow && p.acquisitionPrice 
          ? (Number(p.cashFlow) * 12 / Number(p.acquisitionPrice)) * 100 
          : 0,
      }));

      res.json(transformedProperties);
    } catch (error) {
      console.error("Property performance error:", error);
      res.status(500).json({ error: "Failed to load property performance" });
    }
  });

  // Investor leads routes
  app.get("/api/investor-leads", async (req, res) => {
    try {
      const { status, limit } = req.query;
      const leads = await storage.getInvestorLeads(
        status as string, 
        limit ? parseInt(limit as string) : 50
      );
      res.json(leads);
    } catch (error) {
      console.error("Investor leads error:", error);
      res.status(500).json({ error: "Failed to load investor leads" });
    }
  });

  app.post("/api/investor-leads", async (req, res) => {
    try {
      const leadData = insertInvestorLeadSchema.parse(req.body);
      const lead = await storage.createInvestorLead(leadData);
      res.status(201).json(lead);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid lead data", details: error.errors });
      }
      console.error("Create investor lead error:", error);
      res.status(500).json({ error: "Failed to create investor lead" });
    }
  });

  // Properties routes
  app.get("/api/properties", authenticateUser, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const properties = await storage.getPropertiesForUser(userId);
      res.json(properties);
    } catch (error) {
      console.error("Properties error:", error);
      res.status(500).json({ error: "Failed to load properties" });
    }
  });

  app.post("/api/properties", authenticateUser, async (req: any, res) => {
    try {
      const propertyData = insertPropertySchema.parse(req.body);
      const property = await storage.createProperty(propertyData);
      res.status(201).json(property);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid property data", details: error.errors });
      }
      console.error("Create property error:", error);
      res.status(500).json({ error: "Failed to create property" });
    }
  });

  app.patch("/api/properties/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      
      const property = await storage.updateProperty(id, updateData);
      if (!property) {
        return res.status(404).json({ error: "Property not found" });
      }
      
      res.json(property);
    } catch (error) {
      console.error("Update property error:", error);
      res.status(500).json({ error: "Failed to update property" });
    }
  });

  app.put("/api/properties/:id", authenticateUser, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      
      const property = await storage.updateProperty(id, updateData);
      if (!property) {
        return res.status(404).json({ error: "Property not found" });
      }
      
      res.json(property);
    } catch (error) {
      console.error("Update property error:", error);
      res.status(500).json({ error: "Failed to update property" });
    }
  });

  // Company metrics routes
  app.post("/api/metrics", async (req, res) => {
    try {
      const metricData = insertCompanyMetricSchema.parse(req.body);
      const metric = await storage.createCompanyMetric(metricData);
      res.status(201).json(metric);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid metric data", details: error.errors });
      }
      console.error("Create metric error:", error);
      res.status(500).json({ error: "Failed to create metric" });
    }
  });

  // Data export route
  app.get("/api/export", async (req, res) => {
    try {
      const { type, format = "json" } = req.query;
      
      let data;
      switch (type) {
        case "properties":
          data = await storage.getProperties();
          break;
        case "metrics":
          data = await storage.getCompanyMetrics();
          break;
        case "leads":
          data = await storage.getInvestorLeads();
          break;
        default:
          return res.status(400).json({ error: "Invalid export type" });
      }

      if (format === "csv") {
        // Basic CSV conversion (in production, use a proper CSV library)
        if (data.length === 0) {
          return res.status(200).send("");
        }
        
        const headers = Object.keys(data[0]).join(",");
        const rows = data.map(item => 
          Object.values(item).map(val => 
            typeof val === 'string' && val.includes(',') ? `"${val}"` : val
          ).join(",")
        );
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${type}.csv"`);
        res.send([headers, ...rows].join("\n"));
      } else {
        res.json(data);
      }
    } catch (error) {
      console.error("Export error:", error);
      res.status(500).json({ error: "Failed to export data" });
    }
  });

  // Deal Analysis Routes
  
  // Get all deals
  app.get("/api/deals", async (req, res) => {
    try {
      const deals = await storage.getDeals();
      res.json(deals);
    } catch (error) {
      console.error("Get deals error:", error);
      res.status(500).json({ error: "Failed to fetch deals" });
    }
  });

  // Get single deal with KPIs
  app.get("/api/deals/:id", async (req, res) => {
    try {
      const dealId = parseInt(req.params.id);
      const deal = await storage.getDeal(dealId);
      
      if (!deal) {
        return res.status(404).json({ error: "Deal not found" });
      }

      const kpis = await kpiService.calculateKPIs(dealId);
      
      // Get all related data
      const [rehabItems, units, expenses, closingCosts, holdingCosts, loans, otherIncome, comps] = await Promise.all([
        storage.getDealRehab(dealId),
        storage.getDealUnits(dealId),
        storage.getDealExpenses(dealId),
        storage.getDealClosingCosts(dealId),
        storage.getDealHoldingCosts(dealId),
        storage.getDealLoans(dealId),
        storage.getDealOtherIncome(dealId),
        storage.getDealComps(dealId)
      ]);

      res.json({
        deal,
        kpis,
        rehabItems,
        units,
        expenses,
        closingCosts,
        holdingCosts,
        loans,
        otherIncome,
        comps
      });
    } catch (error) {
      console.error("Get deal error:", error);
      res.status(500).json({ error: "Failed to fetch deal" });
    }
  });

  // Create new deal
  app.post("/api/deals", async (req, res) => {
    try {
      const dealData = insertDealSchema.parse(req.body);
      const deal = await storage.createDeal(dealData);
      res.status(201).json(deal);
    } catch (error) {
      console.error("Create deal error:", error);
      res.status(500).json({ error: "Failed to create deal" });
    }
  });

  // Update deal
  app.put("/api/deals/:id", async (req, res) => {
    try {
      const dealId = parseInt(req.params.id);
      const dealData = insertDealSchema.partial().parse(req.body);
      const deal = await storage.updateDeal(dealId, dealData);
      
      if (!deal) {
        return res.status(404).json({ error: "Deal not found" });
      }

      await broadcastKPIUpdate(dealId);
      res.json(deal);
    } catch (error) {
      console.error("Update deal error:", error);
      res.status(500).json({ error: "Failed to update deal" });
    }
  });

  // Rehab routes
  app.post("/api/deals/:dealId/rehab", async (req, res) => {
    try {
      const dealId = parseInt(req.params.dealId);
      const rehabData = insertDealRehabSchema.parse({ ...req.body, dealId });
      const rehab = await storage.createDealRehab(rehabData);
      
      await broadcastKPIUpdate(dealId);
      res.status(201).json(rehab);
    } catch (error) {
      console.error("Create rehab error:", error);
      res.status(500).json({ error: "Failed to create rehab item" });
    }
  });

  app.put("/api/deals/:dealId/rehab/:id", async (req, res) => {
    try {
      const dealId = parseInt(req.params.dealId);
      const id = parseInt(req.params.id);
      const rehabData = insertDealRehabSchema.partial().parse(req.body);
      const rehab = await storage.updateDealRehab(id, rehabData);
      
      if (!rehab) {
        return res.status(404).json({ error: "Rehab item not found" });
      }

      await broadcastKPIUpdate(dealId);
      res.json(rehab);
    } catch (error) {
      console.error("Update rehab error:", error);
      res.status(500).json({ error: "Failed to update rehab item" });
    }
  });

  app.delete("/api/deals/:dealId/rehab/:id", async (req, res) => {
    try {
      const dealId = parseInt(req.params.dealId);
      const id = parseInt(req.params.id);
      const success = await storage.deleteDealRehab(id);
      
      if (!success) {
        return res.status(404).json({ error: "Rehab item not found" });
      }

      await broadcastKPIUpdate(dealId);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete rehab error:", error);
      res.status(500).json({ error: "Failed to delete rehab item" });
    }
  });

  // Units routes
  app.post("/api/deals/:dealId/units", async (req, res) => {
    try {
      const dealId = parseInt(req.params.dealId);
      const unitData = insertDealUnitsSchema.parse({ ...req.body, dealId });
      const unit = await storage.createDealUnits(unitData);
      
      await broadcastKPIUpdate(dealId);
      res.status(201).json(unit);
    } catch (error) {
      console.error("Create unit error:", error);
      res.status(500).json({ error: "Failed to create unit" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server for real-time KPI updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws, req) => {
    console.log('WebSocket client connected');

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'subscribe_deal' && data.dealId) {
          const dealId = parseInt(data.dealId);
          
          if (!dealConnections.has(dealId)) {
            dealConnections.set(dealId, new Set());
          }
          
          dealConnections.get(dealId)!.add(ws);
          console.log(`Client subscribed to deal ${dealId}`);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      dealConnections.forEach((connections, dealId) => {
        connections.delete(ws);
        if (connections.size === 0) {
          dealConnections.delete(dealId);
        }
      });
      console.log('WebSocket client disconnected');
    });
  });

  // Migration endpoint to move from JSON to normalized tables
  app.post('/api/migrate-deal-data', authenticateUser, async (req, res) => {
    try {
      console.log('Starting Deal Analyzer data migration...');
      await migratePropertyData();
      res.json({ message: 'Migration completed successfully' });
    } catch (error) {
      console.error('Migration failed:', error);
      res.status(500).json({ error: 'Migration failed' });
    }
  });

  // Get normalized deal analyzer data for a property
  app.get('/api/properties/:id/deal-data', authenticateUser, async (req, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      const dealData = await dealAnalyzerService.getPropertyDealData(propertyId);
      res.json(dealData);
    } catch (error) {
      console.error('Error fetching deal data:', error);
      res.status(500).json({ error: 'Failed to fetch deal data' });
    }
  });

  // Save deal analyzer data to normalized tables
  app.post('/api/properties/:id/deal-data', authenticateUser, async (req, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      const dealData = req.body;
      
      // Save to normalized tables
      await dealAnalyzerService.saveFromJSON(propertyId, dealData);
      
      // Also update the JSON column for backward compatibility
      await storage.updateProperty(propertyId, {
        dealAnalyzerData: JSON.stringify(dealData)
      });
      
      res.json({ message: 'Deal data saved successfully' });
    } catch (error) {
      console.error('Error saving deal data:', error);
      res.status(500).json({ error: 'Failed to save deal data' });
    }
  });
  
  return httpServer;
}
