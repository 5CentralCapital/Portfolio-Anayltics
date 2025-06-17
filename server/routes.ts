import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertPropertySchema, insertCompanyMetricSchema, insertInvestorLeadSchema } from "@shared/schema";
import { z } from "zod";

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

      // In a real app, you'd create a JWT token or session here
      const userWithoutPassword = {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      };

      res.json({ 
        user: userWithoutPassword,
        token: `mock_token_${user.id}` // Mock token for demo
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    // In a real app, you'd invalidate the session/token here
    res.json({ message: "Logged out successfully" });
  });

  // Dashboard data route
  app.get("/api/dashboard", async (req, res) => {
    try {
      const properties = await storage.getProperties();
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
  app.get("/api/property-performance", async (req, res) => {
    try {
      const properties = await storage.getProperties();
      
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
        cash_on_cash_return: Number(p.cashOnCashReturn), // Static values from database
        annualized_return: Number(p.annualizedReturn), // Static values from database
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
  app.get("/api/properties", async (req, res) => {
    try {
      const properties = await storage.getProperties();
      res.json(properties);
    } catch (error) {
      console.error("Properties error:", error);
      res.status(500).json({ error: "Failed to load properties" });
    }
  });

  app.post("/api/properties", async (req, res) => {
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

  const httpServer = createServer(app);
  return httpServer;
}
