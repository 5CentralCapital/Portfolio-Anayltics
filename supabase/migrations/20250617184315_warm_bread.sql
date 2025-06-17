-- Database Schema for 5Central Capital Analytics Dashboard

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'viewer' CHECK (role IN ('admin', 'manager', 'viewer')),
    first_name TEXT,
    last_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    is_active BOOLEAN DEFAULT 1
);

-- Properties table
CREATE TABLE IF NOT EXISTS properties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    units INTEGER NOT NULL,
    acquisition_price DECIMAL(12,2) NOT NULL,
    rehab_costs DECIMAL(12,2) DEFAULT 0,
    arv DECIMAL(12,2),
    sold_price DECIMAL(12,2),
    cash_rents_collected DECIMAL(12,2) DEFAULT 0,
    years_held DECIMAL(4,2),
    cash_on_cash_return DECIMAL(8,2),
    annualized_return DECIMAL(8,2),
    status TEXT CHECK (status IN ('current', 'sold')) DEFAULT 'current',
    acquisition_date DATE,
    sold_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Financial metrics table
CREATE TABLE IF NOT EXISTS financial_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    metric_name TEXT NOT NULL,
    metric_value DECIMAL(15,2) NOT NULL,
    metric_type TEXT NOT NULL, -- 'currency', 'percentage', 'count', etc.
    period_start DATE,
    period_end DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- KPI tracking table
CREATE TABLE IF NOT EXISTS kpi_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kpi_name TEXT NOT NULL,
    kpi_value DECIMAL(15,2) NOT NULL,
    target_value DECIMAL(15,2),
    unit TEXT, -- '%', '$', 'units', etc.
    category TEXT, -- 'financial', 'operational', 'growth', etc.
    recorded_date DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table for user session management
CREATE TABLE IF NOT EXISTS user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    table_name TEXT,
    record_id INTEGER,
    old_values TEXT, -- JSON string
    new_values TEXT, -- JSON string
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Insert default admin user (password: admin123)
INSERT OR IGNORE INTO users (email, password_hash, role, first_name, last_name) 
VALUES ('admin@5central.capital', '$2b$10$rQZ8kHp4mF7LGVxZxvH.4eK9mF7LGVxZxvH.4eK9mF7LGVxZxvH.4e', 'admin', 'Admin', 'User');

-- Insert sample property data
INSERT OR IGNORE INTO properties (address, city, state, units, acquisition_price, rehab_costs, arv, status, cash_on_cash_return, annualized_return) VALUES
('3408 E Dr MLK BLVD', 'Tampa', 'FL', 10, 750000, 450000, 2000000, 'current', 372.10, 372.10),
('157 Crystal Ave', 'New London', 'CT', 5, 376000, 10000, 700000, 'current', 381.10, 68.80),
('1 Harmony St', 'Stonington', 'CT', 4, 1075000, 80000, 1500000, 'current', 222.60, 222.60),
('41 Stuart Ave', 'New London', 'CT', 3, 195000, 20000, 375000, 'sold', 1400.00, 96.80),
('52 Summit Ave', 'New London', 'CT', 2, 315000, 10000, 375000, 'sold', 326.70, 78.70);

-- Insert sample KPI data
INSERT OR IGNORE INTO kpi_metrics (kpi_name, kpi_value, target_value, unit, category, recorded_date) VALUES
('Total Portfolio Value', 4200000, 5000000, '$', 'financial', date('now')),
('Total Units', 37, 50, 'units', 'operational', date('now')),
('Total Equity Created', 2420000, 3000000, '$', 'financial', date('now')),
('Average Cash-on-Cash Return', 458.8, 400, '%', 'financial', date('now')),
('Average Annualized Return', 115.6, 100, '%', 'financial', date('now'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_kpi_recorded_date ON kpi_metrics(recorded_date);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);