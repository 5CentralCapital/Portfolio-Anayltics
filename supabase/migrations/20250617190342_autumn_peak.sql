-- Database Schema for 5Central Capital Analytics Dashboard
-- SQLite implementation for development (easily portable to PostgreSQL/MySQL)

-- Users table with role-based access control
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'viewer')),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    last_login DATETIME,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until DATETIME,
    password_reset_token TEXT,
    password_reset_expires DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table for secure session management
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Company metrics table for KPI tracking
CREATE TABLE IF NOT EXISTS company_metrics (
    id TEXT PRIMARY KEY,
    metric_date DATE NOT NULL,
    revenue DECIMAL(15,2) DEFAULT 0,
    expenses DECIMAL(15,2) DEFAULT 0,
    profit_margin DECIMAL(5,2) DEFAULT 0,
    customer_acquisition_cost DECIMAL(10,2) DEFAULT 0,
    customer_lifetime_value DECIMAL(10,2) DEFAULT 0,
    monthly_recurring_revenue DECIMAL(15,2) DEFAULT 0,
    churn_rate DECIMAL(5,2) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Sales performance tracking
CREATE TABLE IF NOT EXISTS sales_data (
    id TEXT PRIMARY KEY,
    sale_date DATE NOT NULL,
    sales_rep_id TEXT,
    customer_id TEXT,
    product_category TEXT,
    sale_amount DECIMAL(10,2) NOT NULL,
    commission DECIMAL(10,2) DEFAULT 0,
    region TEXT,
    channel TEXT CHECK (channel IN ('online', 'retail', 'partner', 'direct')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Customer data for acquisition metrics
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    first_name TEXT,
    last_name TEXT,
    acquisition_date DATE NOT NULL,
    acquisition_channel TEXT,
    total_spent DECIMAL(10,2) DEFAULT 0,
    last_purchase_date DATE,
    status TEXT CHECK (status IN ('active', 'inactive', 'churned')) DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Employee productivity tracking
CREATE TABLE IF NOT EXISTS employee_metrics (
    id TEXT PRIMARY KEY,
    employee_id TEXT NOT NULL,
    metric_date DATE NOT NULL,
    tasks_completed INTEGER DEFAULT 0,
    hours_worked DECIMAL(4,2) DEFAULT 0,
    productivity_score DECIMAL(5,2) DEFAULT 0,
    department TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Real estate specific tables
CREATE TABLE IF NOT EXISTS properties (
    id TEXT PRIMARY KEY,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    units INTEGER NOT NULL,
    acquisition_price DECIMAL(12,2) NOT NULL,
    rehab_costs DECIMAL(12,2) DEFAULT 0,
    arv DECIMAL(12,2),
    current_value DECIMAL(12,2),
    monthly_rent DECIMAL(10,2) DEFAULT 0,
    cash_on_cash_return DECIMAL(8,4) DEFAULT 0,
    annualized_return DECIMAL(8,4) DEFAULT 0,
    status TEXT CHECK (status IN ('active', 'sold', 'under_contract')) DEFAULT 'active',
    acquisition_date DATE NOT NULL,
    sold_date DATE,
    sold_price DECIMAL(12,2),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Investor leads tracking
CREATE TABLE IF NOT EXISTS investor_leads (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    investment_amount DECIMAL(12,2),
    accredited_status BOOLEAN DEFAULT 0,
    source TEXT,
    status TEXT CHECK (status IN ('new', 'contacted', 'qualified', 'invested', 'declined')) DEFAULT 'new',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Security audit log for compliance
CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    action TEXT NOT NULL,
    table_name TEXT,
    record_id TEXT,
    old_values TEXT,
    new_values TEXT,
    ip_address TEXT,
    user_agent TEXT,
    success BOOLEAN DEFAULT 1,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Login attempts tracking for security
CREATE TABLE IF NOT EXISTS login_attempts (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    ip_address TEXT NOT NULL,
    success BOOLEAN NOT NULL,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(password_reset_token);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_company_metrics_date ON company_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_sales_data_date ON sales_data(sale_date);
CREATE INDEX IF NOT EXISTS idx_customers_acquisition_date ON customers(acquisition_date);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_investor_leads_status ON investor_leads(status);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created ON login_attempts(created_at);