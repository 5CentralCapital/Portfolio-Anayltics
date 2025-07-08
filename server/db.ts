import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure Neon for serverless environment
neonConfig.webSocketConstructor = ws;
neonConfig.useSecureWebSocket = true;
neonConfig.pipelineConnect = false;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create pool with proper configuration for Neon
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 20000,
  connectionTimeoutMillis: 5000,
  maxUses: 7500,
  allowExitOnIdle: true,
});

export const db = drizzle({ client: pool, schema });

// Add connection error handling
pool.on('error', (err) => {
  console.error('Database pool error:', err);
});

// Test connection on startup
export async function testDatabaseConnection() {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    // Database connection successful
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}
