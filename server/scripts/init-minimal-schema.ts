import 'dotenv/config';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;
neonConfig.useSecureWebSocket = true;
neonConfig.pipelineConnect = false;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const pool = new Pool({ connectionString });

async function run(sql: string) {
  const client = await pool.connect();
  try {
    await client.query(sql);
  } finally {
    client.release();
  }
}

async function main() {
  // Core tables needed by API reads
  const ddlStatements: string[] = [
    // properties
    `CREATE TABLE IF NOT EXISTS properties (
      id SERIAL PRIMARY KEY,
      status TEXT,
      apartments INTEGER NOT NULL,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      zip_code TEXT,
      entity TEXT,
      acquisition_date DATE,
      acquisition_price NUMERIC(15,2) NOT NULL,
      rehab_costs NUMERIC(15,2) DEFAULT 0,
      arv_at_time_purchased NUMERIC(15,2),
      initial_capital_required NUMERIC(15,2) NOT NULL,
      cash_flow NUMERIC(15,2) NOT NULL,
      sale_price NUMERIC(15,2),
      sale_points NUMERIC(15,2),
      total_profits NUMERIC(15,2) NOT NULL DEFAULT 0,
      years_held NUMERIC(3,1),
      cash_on_cash_return NUMERIC(8,2) NOT NULL,
      annualized_return NUMERIC(8,2) NOT NULL,
      deal_analyzer_data TEXT,
      is_featured BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );`,

    // property_assumptions
    `CREATE TABLE IF NOT EXISTS property_assumptions (
      id SERIAL PRIMARY KEY,
      property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      unit_count INTEGER DEFAULT 1,
      purchase_price NUMERIC(15,2) DEFAULT 0,
      loan_percentage NUMERIC(5,4) DEFAULT 0.8,
      interest_rate NUMERIC(5,4) DEFAULT 0.07,
      loan_term_years INTEGER DEFAULT 30,
      vacancy_rate NUMERIC(5,4) DEFAULT 0.05,
      expense_ratio NUMERIC(5,4) DEFAULT 0.45,
      management_fee NUMERIC(5,4) DEFAULT 0.08,
      market_cap_rate NUMERIC(5,4) DEFAULT 0.055,
      refinance_ltv NUMERIC(5,4) DEFAULT 0.75,
      refinance_interest_rate NUMERIC(5,4) DEFAULT 0.065,
      refinance_closing_cost_percent NUMERIC(5,4) DEFAULT 0.02,
      dscr_threshold NUMERIC(5,2) DEFAULT 1.25,
      annual_rent_growth NUMERIC(5,4) DEFAULT 0.03,
      annual_expense_inflation NUMERIC(5,4) DEFAULT 0.025,
      property_appreciation_rate NUMERIC(5,4) DEFAULT 0.03,
      exit_cap_rate NUMERIC(5,4),
      hold_period_years NUMERIC(5,1) DEFAULT 5.0,
      business_plan TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );`,

    // property_unit_types
    `CREATE TABLE IF NOT EXISTS property_unit_types (
      id SERIAL PRIMARY KEY,
      property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      unit_type_id TEXT NOT NULL,
      name TEXT NOT NULL,
      bedrooms INTEGER DEFAULT 1,
      bathrooms NUMERIC(3,1) DEFAULT 1.0,
      square_feet INTEGER,
      market_rent NUMERIC(10,2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );`,

    // property_rent_roll
    `CREATE TABLE IF NOT EXISTS property_rent_roll (
      id SERIAL PRIMARY KEY,
      property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      unit_type_id TEXT NOT NULL,
      unit_number TEXT NOT NULL,
      current_rent NUMERIC(10,2) DEFAULT 0,
      pro_forma_rent NUMERIC(10,2) DEFAULT 0,
      is_vacant BOOLEAN DEFAULT FALSE,
      lease_start DATE,
      lease_end DATE,
      lease_end_date DATE,
      tenant_name TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );`,

    // property_loans
    `CREATE TABLE IF NOT EXISTS property_loans (
      id SERIAL PRIMARY KEY,
      property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      loan_name TEXT NOT NULL,
      loan_type TEXT NOT NULL,
      original_amount NUMERIC(15,2) NOT NULL,
      current_balance NUMERIC(15,2) NOT NULL,
      interest_rate NUMERIC(5,4) NOT NULL,
      term_years INTEGER NOT NULL,
      monthly_payment NUMERIC(12,2) NOT NULL,
      payment_type TEXT DEFAULT 'principal_and_interest',
      maturity_date DATE NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      lender TEXT,
      notes TEXT,
      principal_balance NUMERIC(15,2),
      next_payment_date DATE,
      next_payment_amount NUMERIC(12,2),
      last_payment_date DATE,
      last_payment_amount NUMERIC(12,2),
      escrow_balance NUMERIC(12,2),
      remaining_term INTEGER,
      last_sync_date TIMESTAMP,
      sync_status TEXT DEFAULT 'pending',
      sync_error TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );`,

    // bank_accounts (for Plaid integration)
    `CREATE TABLE IF NOT EXISTS bank_accounts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      entity_id INTEGER,
      access_token TEXT NOT NULL,
      item_id TEXT NOT NULL,
      account_id TEXT NOT NULL,
      account_name TEXT NOT NULL,
      account_type TEXT NOT NULL,
      account_subtype TEXT,
      institution_name TEXT NOT NULL,
      institution_id TEXT NOT NULL,
      mask TEXT,
      current_balance NUMERIC(15,2),
      available_balance NUMERIC(15,2),
      is_active BOOLEAN DEFAULT TRUE,
      last_updated TIMESTAMP DEFAULT NOW(),
      created_at TIMESTAMP DEFAULT NOW()
    );`,

    // transactions (for Plaid transactions)
    `CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      bank_account_id INTEGER NOT NULL,
      entity_id INTEGER,
      property_id INTEGER,
      plaid_transaction_id TEXT NOT NULL UNIQUE,
      account_id TEXT NOT NULL,
      amount NUMERIC(15,2) NOT NULL,
      date TEXT NOT NULL,
      name TEXT NOT NULL,
      merchant_name TEXT,
      category TEXT[],
      subcategory TEXT,
      transaction_type TEXT,
      pending BOOLEAN DEFAULT FALSE,
      account_owner TEXT,
      location TEXT,
      payment_meta TEXT,
      is_property_related BOOLEAN DEFAULT FALSE,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );`
  ];

  for (const ddl of ddlStatements) {
    await run(ddl);
  }

  // Seed one sample property if none exists
  await run(`INSERT INTO properties (
    status, apartments, address, city, state, zip_code, entity,
    acquisition_date, acquisition_price, rehab_costs, arv_at_time_purchased,
    initial_capital_required, cash_flow, sale_price, sale_points, total_profits,
    years_held, cash_on_cash_return, annualized_return, is_featured
  )
  SELECT 'Cashflowing', 10, '123 Sample St', 'Tampa', 'FL', '33602', '5Central Capital',
         CURRENT_DATE, 500000, 50000, 650000,
         150000, 30000, NULL, NULL, 0,
         1.0, 12.5, 15.0, TRUE
  WHERE NOT EXISTS (SELECT 1 FROM properties);`);

  console.log('Minimal schema created and sample data inserted (if empty).');
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


