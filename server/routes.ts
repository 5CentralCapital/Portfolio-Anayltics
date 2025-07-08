import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { kpiService } from "./kpi.service";
import { calculationService } from "./calculation.service";
import { 
  createLinkToken, 
  exchangePublicToken, 
  getAccountBalances, 
  getTransactions, 
  getAccountInfo 
} from './plaid';
import { federalReserveService } from './fed-api';
import { censusService } from './census-api';
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
    // Error broadcasting KPI update
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

      // Add timeout wrapper for database operations
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Database operation timeout')), 8000);
      });

      let user;
      try {
        user = await Promise.race([
          storage.getUserByEmail(email),
          timeoutPromise
        ]);
      } catch (dbError) {
        console.error('Database error during getUserByEmail:', dbError);
        return res.status(503).json({ error: "Service temporarily unavailable. Please try again." });
      }

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

      // Update last login (non-blocking, failures are logged but don't affect login)
      storage.updateUserLastLogin(user.id).catch(err => 
        console.error('Non-critical error updating last login:', err)
      );

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

  // Import property from Deal Analyzer with normalized database structure
  app.post('/api/properties/import-normalized', authenticateUser, async (req: any, res: any) => {
    try {
      const { dealData, entity, acquisitionDate, broker, legalNotes, address, city, state, zipCode } = req.body;
      
      if (!dealData) {
        return res.status(400).json({ error: 'Deal data is required' });
      }

      // Prepare additional property data
      const additionalPropertyData = {
        entity: entity || '5Central Capital',
        acquisitionDate,
        broker,
        legalNotes,
        address: address || dealData.propertyAddress || 'Unknown Address',
        city: city || 'Unknown City',
        state: state || 'Unknown State',
        zipCode: zipCode || ''
      };

      // Import using the new normalized database structure
      const newProperty = await storage.importFromDealAnalyzer(dealData, additionalPropertyData, req.user.id);
      
      // Calculate and store initial metrics using the enhanced calculation service
      await calculationService.updatePropertyMetrics(newProperty.id);
      
      // Broadcast KPI update
      await broadcastKPIUpdate(newProperty.id);
      
      res.status(201).json({
        property: newProperty,
        message: 'Property imported successfully with normalized data structure'
      });
    } catch (error) {
      console.error('Error importing property:', error);
      res.status(500).json({ error: 'Failed to import property' });
    }
  });

  // Sync existing property Deal Analyzer data to normalized tables
  app.post('/api/properties/:id/sync-normalized', authenticateUser, async (req: any, res: any) => {
    try {
      const propertyId = parseInt(req.params.id);
      
      await storage.syncDealAnalyzerToNormalized(propertyId);
      await calculationService.updatePropertyMetrics(propertyId);
      
      res.json({ message: 'Property data synchronized to normalized structure' });
    } catch (error) {
      console.error('Error syncing property data:', error);
      res.status(500).json({ error: 'Failed to sync property data' });
    }
  });

  // Dynamic property metrics endpoint
  app.get("/api/properties/:id/metrics", authenticateUser, async (req: any, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      const metrics = await calculationService.calculatePropertyMetrics(propertyId);
      res.json(metrics);
    } catch (error) {
      console.error("Error calculating property metrics:", error);
      res.status(500).json({ error: "Failed to calculate metrics" });
    }
  });

  // Dynamic portfolio metrics endpoint
  app.get("/api/portfolio/metrics", authenticateUser, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const portfolioMetrics = await calculationService.calculatePortfolioMetrics(userId);
      res.json(portfolioMetrics);
    } catch (error) {
      console.error("Error calculating portfolio metrics:", error);
      res.status(500).json({ error: "Failed to calculate portfolio metrics" });
    }
  });

  // Google Places API key endpoint for client
  app.get('/api/google-places-key', (req, res) => {
    try {
      // Return the API key for client-side use
      res.json({ apiKey: process.env.GOOGLE_PLACES_API_KEY });
    } catch (error) {
      console.error('Error fetching Google Places API key:', error);
      res.status(500).json({ error: 'Failed to fetch API key' });
    }
  });

  // Plaid API endpoints
  app.post('/api/plaid/create-link-token', authenticateUser, async (req: any, res) => {
    try {
      const userId = req.user.id.toString();
      const linkTokenData = await createLinkToken(userId);
      res.json(linkTokenData);
    } catch (error) {
      console.error('Error creating link token:', error);
      res.status(500).json({ error: 'Failed to create link token' });
    }
  });

  app.post('/api/plaid/exchange-public-token', authenticateUser, async (req: any, res) => {
    try {
      const { public_token, metadata } = req.body;
      const userId = req.user.id;
      
      // Exchange public token for access token
      const exchangeData = await exchangePublicToken(public_token);
      const { access_token, item_id } = exchangeData;
      
      // Get account information
      const accountInfo = await getAccountInfo(access_token);
      const accounts = accountInfo.accounts;
      
      // Save bank account information to database
      for (const account of accounts) {
        await storage.createBankAccount({
          userId: userId,
          entityId: null, // User can assign to entity later
          accessToken: access_token,
          itemId: item_id,
          accountId: account.account_id,
          accountName: account.name,
          accountType: account.type,
          accountSubtype: account.subtype,
          institutionName: metadata.institution.name,
          institutionId: metadata.institution.institution_id,
          mask: account.mask,
          currentBalance: account.balances.current,
          availableBalance: account.balances.available,
        });
      }
      
      res.json({ 
        access_token, 
        item_id, 
        accounts: accounts.length,
        institution: metadata.institution.name
      });
    } catch (error) {
      console.error('Error exchanging public token:', error);
      res.status(500).json({ error: 'Failed to exchange public token' });
    }
  });

  app.get('/api/plaid/accounts', authenticateUser, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const bankAccounts = await storage.getBankAccounts(userId);
      res.json(bankAccounts);
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
      res.status(500).json({ error: 'Failed to fetch bank accounts' });
    }
  });

  app.post('/api/plaid/refresh-balances', authenticateUser, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const bankAccounts = await storage.getBankAccounts(userId);
      
      for (const account of bankAccounts) {
        if (account.accessToken && account.isActive) {
          try {
            const balanceData = await getAccountBalances(account.accessToken);
            const updatedAccount = balanceData.accounts.find(acc => acc.account_id === account.accountId);
            
            if (updatedAccount) {
              await storage.updateBankAccountBalance(account.id, {
                currentBalance: updatedAccount.balances.current,
                availableBalance: updatedAccount.balances.available,
                lastUpdated: new Date(),
              });
            }
          } catch (error) {
            console.error(`Error updating balance for account ${account.accountId}:`, error);
          }
        }
      }
      
      const refreshedAccounts = await storage.getBankAccounts(userId);
      res.json(refreshedAccounts);
    } catch (error) {
      console.error('Error refreshing balances:', error);
      res.status(500).json({ error: 'Failed to refresh balances' });
    }
  });

  app.get('/api/plaid/transactions/:accountId', authenticateUser, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const accountId = req.params.accountId;
      const { start_date, end_date } = req.query;
      
      const account = await storage.getBankAccount(userId, parseInt(accountId));
      if (!account) {
        return res.status(404).json({ error: 'Bank account not found' });
      }
      
      const startDate = start_date as string || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const endDate = end_date as string || new Date().toISOString().split('T')[0];
      
      const transactionData = await getTransactions(account.accessToken, startDate, endDate);
      const accountTransactions = transactionData.transactions.filter(t => t.account_id === account.accountId);
      
      res.json({
        transactions: accountTransactions,
        total_transactions: accountTransactions.length
      });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  });

  // Dashboard data route with dynamic calculations
  app.get("/api/dashboard", authenticateUser, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const properties = await storage.getPropertiesForUser(userId);
      const latestMetrics = await storage.getLatestCompanyMetrics();
      const investorLeads = await storage.getInvestorLeads();

      // Calculate real-time portfolio statistics using calculation service
      const portfolioMetrics = await calculationService.calculatePortfolioMetrics(userId);
      
      const activeProperties = properties.filter(p => p.status === 'Cashflowing' || p.status === 'Rehabbing');
      const soldProperties = properties.filter(p => p.status === 'Sold');
      
      const totalProperties = properties.length;
      const totalUnits = portfolioMetrics.totalUnits;
      const totalValue = portfolioMetrics.totalAUM;
      const monthlyRent = portfolioMetrics.totalCashFlow / 12;
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

  // Public portfolio route (no authentication required)
  app.get("/api/public/portfolio", async (req, res) => {
    try {
      // Get all properties for public portfolio display
      const properties = await storage.getProperties();
      
      // Filter to only include properties that should be public
      const publicProperties = properties.filter(p => 
        p.status === 'Cashflowing' || p.status === 'Sold' || p.status === 'Rehabbing'
      );
      
      res.json(publicProperties);
    } catch (error) {
      console.error("Public portfolio error:", error);
      res.status(500).json({ error: "Failed to load portfolio data" });
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

  // Get featured properties (public endpoint)
  app.get("/api/properties/featured", async (req: any, res) => {
    try {
      const properties = await storage.getFeaturedProperties();
      res.json(properties);
    } catch (error) {
      console.error("Featured properties error:", error);
      res.status(500).json({ error: "Failed to load featured properties" });
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

  // Toggle property featured status
  app.patch("/api/properties/:id/featured", authenticateUser, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { isFeatured } = req.body;
      
      const property = await storage.updatePropertyFeatured(id, isFeatured);
      if (!property) {
        return res.status(404).json({ error: "Property not found" });
      }
      
      res.json(property);
    } catch (error) {
      console.error("Update property featured status error:", error);
      res.status(500).json({ error: "Failed to update property featured status" });
    }
  });

  app.delete("/api/properties/:id", authenticateUser, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Verify property exists and user has access
      const property = await storage.getProperty(id);
      if (!property) {
        return res.status(404).json({ error: "Property not found" });
      }
      
      // Check if user has access to this property through entity ownership
      const userEntities = await storage.getUserEntityOwnership(req.user.id);
      const userEntityNames = userEntities.map(e => e.entityName);
      
      if (!userEntityNames.includes(property.entity || '')) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const deleted = await storage.deleteProperty(id);
      if (!deleted) {
        return res.status(404).json({ error: "Property not found" });
      }
      
      res.json({ message: "Property deleted successfully" });
    } catch (error) {
      console.error("Delete property error:", error);
      res.status(500).json({ error: "Failed to delete property" });
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
  
  // Federal Reserve API endpoints
  app.get('/api/market-rates', async (req, res) => {
    try {
      const rates = await federalReserveService.getCurrentMarketRates();
      res.json(rates);
    } catch (error) {
      console.error('Market rates error:', error);
      res.status(500).json({ error: 'Failed to fetch market rates' });
    }
  });

  app.get('/api/recommended-lending-rates', async (req, res) => {
    try {
      const rates = await federalReserveService.getRecommendedLendingRates();
      res.json(rates);
    } catch (error) {
      console.error('Recommended lending rates error:', error);
      res.status(500).json({ error: 'Failed to fetch recommended lending rates' });
    }
  });

  // Census API endpoints
  app.get('/api/census/demographics', async (req, res) => {
    try {
      const { state, county, city } = req.query;
      
      if (!state) {
        return res.status(400).json({ error: 'State parameter is required' });
      }
      
      const demographicData = await censusService.getDemographicData(
        state as string, 
        county as string, 
        city as string
      );
      
      if (!demographicData) {
        return res.status(404).json({ error: 'Demographic data not found for specified location' });
      }
      
      res.json(demographicData);
    } catch (error) {
      console.error('Error fetching demographic data:', error);
      res.status(500).json({ error: 'Failed to fetch demographic data' });
    }
  });

  app.get('/api/census/investment-analysis', async (req, res) => {
    try {
      const { state, county, city } = req.query;
      
      if (!state) {
        return res.status(400).json({ error: 'State parameter is required' });
      }
      
      const demographicData = await censusService.getDemographicData(
        state as string, 
        county as string, 
        city as string
      );
      
      if (!demographicData) {
        return res.status(404).json({ error: 'Unable to perform analysis - demographic data not available' });
      }
      
      const investmentAnalysis = await censusService.getInvestmentRecommendations(demographicData);
      res.json(investmentAnalysis);
    } catch (error) {
      console.error('Error generating investment analysis:', error);
      res.status(500).json({ error: 'Failed to generate investment analysis' });
    }
  });

  return httpServer;
}
