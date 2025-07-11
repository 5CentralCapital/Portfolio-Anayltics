import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import propertyLoansRoutes from "./property-loans.routes";
import leaseRoutes from "./lease.routes";
import aiDocumentRoutes from "./routes/ai-documents";
import tenantDetailsRoutes from "./routes/tenant-details";
import openaiModelsRoutes from "./routes/openai-models";
import geminiModelsRoutes from "./routes/gemini-models";
import portfolioRoutes from "./routes/portfolio";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Register property loans routes
app.use('/api', propertyLoansRoutes);

// Register lease processing routes
app.use('/api/leases', leaseRoutes);

// Register AI document processing routes
app.use('/api/ai-documents', aiDocumentRoutes);

// Register tenant details routes
app.use('/api/tenant-details', tenantDetailsRoutes);

// Register OpenAI models routes  
app.use('/api/openai/models', openaiModelsRoutes);

// Register Gemini models routes
app.use('/api/gemini', geminiModelsRoutes);

// Register portfolio routes
app.use('/api/portfolio', portfolioRoutes);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Test database connection before starting server
    const { testDatabaseConnection } = await import("./db");
    const dbConnected = await testDatabaseConnection();
    
    if (!dbConnected) {
      log("Warning: Database connection failed, but continuing with server startup");
    }

    const server = await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      
      log(`Error ${status}: ${message}`);
      res.status(status).json({ message });
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // ALWAYS serve the app on port 5000
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = 5000;
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`serving on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
})();
