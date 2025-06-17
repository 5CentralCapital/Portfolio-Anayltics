-- 5Central Capital Analytics Database Schema
-- PostgreSQL-compatible schema with proper data types

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'manager', 'viewer')),
    first_name TEXT,
    last_name TEXT,
    is_active BOOLEAN DEFAULT true,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table for secure authentication
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Company metrics for financial tracking
CREATE TABLE IF NOT EXISTS company_metrics (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    metric_date DATE NOT NULL UNIQUE,
    revenue DECIMAL(15,2) NOT NULL DEFAULT 0,
    expenses DECIMAL(15,2) NOT NULL DEFAULT 0,
    profit_margin DECIMAL(5,2) DEFAULT 0,
    customer_acquisition_cost DECIMAL(10,2) DEFAULT 0,
    customer_lifetime_value DECIMAL(10,2) DEFAULT 0,
    monthly_recurring_revenue DECIMAL(15,2) DEFAULT 0,
    churn_rate DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Properties table for real estate portfolio
CREATE TABLE IF NOT EXISTS properties (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip_code TEXT,
    units INTEGER NOT NULL DEFAULT 1,
    acquisition_price DECIMAL(15,2) NOT NULL,
    rehab_costs DECIMAL(15,2) DEFAULT 0,
    current_value DECIMAL(15,2),
    arv DECIMAL(15,2),
    monthly_rent DECIMAL(10,2) DEFAULT 0,
    cash_on_cash_return DECIMAL(8,2) DEFAULT 0,
    annualized_return DECIMAL(8,2) DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'under_contract')),
    acquisition_date DATE,
    sale_date DATE,
    sale_price DECIMAL(15,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Investor leads for CRM
CREATE TABLE IF NOT EXISTS investor_leads (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    investment_amount DECIMAL(15,2),
    accredited_status BOOLEAN DEFAULT false,
    source TEXT DEFAULT 'website',
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'inactive')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customers table for business metrics
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'churned')),
    total_spent DECIMAL(15,2) DEFAULT 0,
    acquisition_date DATE,
    last_purchase_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sales data for analytics
CREATE TABLE IF NOT EXISTS sales_data (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    sale_date DATE NOT NULL,
    sale_amount DECIMAL(15,2) NOT NULL,
    customer_id TEXT,
    channel TEXT DEFAULT 'direct',
    region TEXT,
    product_category TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

-- Login attempts for security tracking
CREATE TABLE IF NOT EXISTS login_attempts (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    email TEXT NOT NULL,
    ip_address TEXT,
    success BOOLEAN NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit log for compliance and security
CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT,
    action TEXT NOT NULL,
    table_name TEXT,
    record_id TEXT,
    old_values TEXT,
    new_values TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_company_metrics_date ON company_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_city_state ON properties(city, state);
CREATE INDEX IF NOT EXISTS idx_investor_leads_status ON investor_leads(status);
CREATE INDEX IF NOT EXISTS idx_investor_leads_email ON investor_leads(email);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_sales_data_date ON sales_data(sale_date);
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at);