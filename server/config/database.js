const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
    constructor() {
        this.db = null;
        this.init();
    }

    init() {
        const dbPath = path.join(__dirname, '../data/analytics.db');
        
        // Ensure data directory exists
        const dataDir = path.dirname(dbPath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        this.db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error opening database:', err);
            } else {
                console.log('Connected to SQLite database');
                this.initializeSchema();
            }
        });

        // Enable foreign keys
        this.db.run('PRAGMA foreign_keys = ON');
    }

    initializeSchema() {
        const schemaPath = path.join(__dirname, '../database/schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        this.db.exec(schema, (err) => {
            if (err) {
                console.error('Error initializing schema:', err);
            } else {
                console.log('Database schema initialized');
                this.seedInitialData();
            }
        });
    }

    seedInitialData() {
        // Create default admin user
        const bcrypt = require('bcryptjs');
        const { v4: uuidv4 } = require('uuid');
        
        const adminId = uuidv4();
        const hashedPassword = bcrypt.hashSync('admin123', 10);
        
        this.db.run(
            `INSERT OR IGNORE INTO users (id, email, password_hash, role, first_name, last_name) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [adminId, 'admin@5central.capital', hashedPassword, 'admin', 'Admin', 'User'],
            (err) => {
                if (err) {
                    console.error('Error creating admin user:', err);
                } else {
                    console.log('Default admin user created');
                }
            }
        );

        // Seed sample data for demonstration
        this.seedSampleData();
    }

    seedSampleData() {
        // Sample company metrics for the last 12 months
        const currentDate = new Date();
        for (let i = 11; i >= 0; i--) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            const dateStr = date.toISOString().split('T')[0];
            
            const revenue = 50000 + Math.random() * 20000;
            const expenses = 30000 + Math.random() * 10000;
            const profitMargin = ((revenue - expenses) / revenue * 100);
            
            this.db.run(
                `INSERT OR IGNORE INTO company_metrics 
                 (id, metric_date, revenue, expenses, profit_margin, customer_acquisition_cost, customer_lifetime_value, monthly_recurring_revenue, churn_rate)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    require('uuid').v4(),
                    dateStr,
                    revenue,
                    expenses,
                    profitMargin,
                    150 + Math.random() * 50,
                    2500 + Math.random() * 500,
                    revenue * 0.8,
                    2 + Math.random() * 3
                ]
            );
        }

        // Sample properties data
        const properties = [
            {
                address: '3408 E Dr MLK BLVD',
                city: 'Tampa',
                state: 'FL',
                units: 10,
                acquisition_price: 750000,
                rehab_costs: 450000,
                arv: 2000000,
                current_value: 1800000,
                monthly_rent: 12000,
                cash_on_cash_return: 372.1,
                annualized_return: 372.1,
                status: 'active',
                acquisition_date: '2023-06-15'
            },
            {
                address: '157 Crystal Ave',
                city: 'New London',
                state: 'CT',
                units: 5,
                acquisition_price: 376000,
                rehab_costs: 10000,
                arv: 700000,
                current_value: 650000,
                monthly_rent: 6500,
                cash_on_cash_return: 381.1,
                annualized_return: 68.8,
                status: 'active',
                acquisition_date: '2022-03-20'
            }
        ];

        properties.forEach(property => {
            this.db.run(
                `INSERT OR IGNORE INTO properties 
                 (id, address, city, state, units, acquisition_price, rehab_costs, arv, current_value, monthly_rent, cash_on_cash_return, annualized_return, status, acquisition_date)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    require('uuid').v4(),
                    property.address,
                    property.city,
                    property.state,
                    property.units,
                    property.acquisition_price,
                    property.rehab_costs,
                    property.arv,
                    property.current_value,
                    property.monthly_rent,
                    property.cash_on_cash_return,
                    property.annualized_return,
                    property.status,
                    property.acquisition_date
                ]
            );
        });
    }

    getDb() {
        return this.db;
    }

    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err);
                } else {
                    console.log('Database connection closed');
                }
            });
        }
    }
}

module.exports = new Database();