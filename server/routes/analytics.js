const express = require('express');
const database = require('../config/database');
const { authenticateToken, authorizeRole, auditLog } = require('../middleware/auth');

const router = express.Router();

// Get dashboard overview metrics
router.get('/dashboard', authenticateToken, (req, res) => {
    const db = database.getDb();
    
    // Get latest company metrics
    db.get(
        `SELECT * FROM company_metrics 
         ORDER BY metric_date DESC LIMIT 1`,
        (err, latestMetrics) => {
            if (err) {
                console.error('Error fetching latest metrics:', err);
                return res.status(500).json({ error: 'Failed to fetch metrics' });
            }

            // Get previous month for comparison
            db.get(
                `SELECT * FROM company_metrics 
                 ORDER BY metric_date DESC LIMIT 1 OFFSET 1`,
                (err, previousMetrics) => {
                    if (err) {
                        console.error('Error fetching previous metrics:', err);
                        return res.status(500).json({ error: 'Failed to fetch metrics' });
                    }

                    // Get property portfolio metrics
                    db.all(
                        `SELECT 
                            COUNT(*) as total_properties,
                            SUM(units) as total_units,
                            SUM(current_value) as total_portfolio_value,
                            SUM(monthly_rent) as total_monthly_rent,
                            AVG(cash_on_cash_return) as avg_cash_on_cash,
                            AVG(annualized_return) as avg_annualized_return
                         FROM properties 
                         WHERE status = 'active'`,
                        (err, portfolioMetrics) => {
                            if (err) {
                                console.error('Error fetching portfolio metrics:', err);
                                return res.status(500).json({ error: 'Failed to fetch portfolio metrics' });
                            }

                            // Get customer metrics
                            db.get(
                                `SELECT 
                                    COUNT(*) as total_customers,
                                    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_customers,
                                    AVG(total_spent) as avg_customer_value
                                 FROM customers`,
                                (err, customerMetrics) => {
                                    if (err) {
                                        console.error('Error fetching customer metrics:', err);
                                        return res.status(500).json({ error: 'Failed to fetch customer metrics' });
                                    }

                                    // Calculate growth rates
                                    const calculateGrowth = (current, previous) => {
                                        if (!previous || previous === 0) return 0;
                                        return ((current - previous) / previous * 100).toFixed(2);
                                    };

                                    const dashboard = {
                                        financial: {
                                            revenue: latestMetrics?.revenue || 0,
                                            expenses: latestMetrics?.expenses || 0,
                                            profit: (latestMetrics?.revenue || 0) - (latestMetrics?.expenses || 0),
                                            profitMargin: latestMetrics?.profit_margin || 0,
                                            revenueGrowth: calculateGrowth(
                                                latestMetrics?.revenue,
                                                previousMetrics?.revenue
                                            ),
                                            monthlyRecurringRevenue: latestMetrics?.monthly_recurring_revenue || 0
                                        },
                                        portfolio: {
                                            totalProperties: portfolioMetrics[0]?.total_properties || 0,
                                            totalUnits: portfolioMetrics[0]?.total_units || 0,
                                            totalValue: portfolioMetrics[0]?.total_portfolio_value || 0,
                                            monthlyRent: portfolioMetrics[0]?.total_monthly_rent || 0,
                                            avgCashOnCash: portfolioMetrics[0]?.avg_cash_on_cash || 0,
                                            avgAnnualizedReturn: portfolioMetrics[0]?.avg_annualized_return || 0
                                        },
                                        customers: {
                                            total: customerMetrics?.total_customers || 0,
                                            active: customerMetrics?.active_customers || 0,
                                            averageValue: customerMetrics?.avg_customer_value || 0,
                                            acquisitionCost: latestMetrics?.customer_acquisition_cost || 0,
                                            lifetimeValue: latestMetrics?.customer_lifetime_value || 0,
                                            churnRate: latestMetrics?.churn_rate || 0
                                        },
                                        lastUpdated: latestMetrics?.metric_date || new Date().toISOString()
                                    };

                                    res.json(dashboard);
                                }
                            );
                        }
                    );
                }
            );
        }
    );
});

// Get revenue trends for charts
router.get('/revenue-trends', authenticateToken, (req, res) => {
    const { period = '12' } = req.query;
    
    database.getDb().all(
        `SELECT 
            metric_date,
            revenue,
            expenses,
            profit_margin,
            monthly_recurring_revenue
         FROM company_metrics 
         ORDER BY metric_date DESC 
         LIMIT ?`,
        [parseInt(period)],
        (err, trends) => {
            if (err) {
                console.error('Error fetching revenue trends:', err);
                return res.status(500).json({ error: 'Failed to fetch revenue trends' });
            }

            // Reverse to show chronological order
            res.json(trends.reverse());
        }
    );
});

// Get sales performance data
router.get('/sales-performance', authenticateToken, (req, res) => {
    const { period = '30' } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));
    
    database.getDb().all(
        `SELECT 
            DATE(sale_date) as date,
            SUM(sale_amount) as total_sales,
            COUNT(*) as transaction_count,
            AVG(sale_amount) as avg_transaction_value,
            channel,
            region
         FROM sales_data 
         WHERE sale_date >= ?
         GROUP BY DATE(sale_date), channel, region
         ORDER BY sale_date DESC`,
        [startDate.toISOString().split('T')[0]],
        (err, salesData) => {
            if (err) {
                console.error('Error fetching sales performance:', err);
                return res.status(500).json({ error: 'Failed to fetch sales performance' });
            }

            res.json(salesData);
        }
    );
});

// Get property performance data
router.get('/property-performance', authenticateToken, (req, res) => {
    database.getDb().all(
        `SELECT 
            id,
            address,
            city,
            state,
            units,
            acquisition_price,
            current_value,
            monthly_rent,
            cash_on_cash_return,
            annualized_return,
            status,
            acquisition_date,
            (current_value - acquisition_price) as equity_created,
            (monthly_rent * 12 / acquisition_price * 100) as rental_yield
         FROM properties 
         ORDER BY cash_on_cash_return DESC`,
        (err, properties) => {
            if (err) {
                console.error('Error fetching property performance:', err);
                return res.status(500).json({ error: 'Failed to fetch property performance' });
            }

            res.json(properties);
        }
    );
});

// Get investor leads data
router.get('/investor-leads', authenticateToken, authorizeRole(['admin', 'manager']), (req, res) => {
    const { status, limit = 50 } = req.query;
    
    let query = `SELECT * FROM investor_leads`;
    let params = [];
    
    if (status) {
        query += ` WHERE status = ?`;
        params.push(status);
    }
    
    query += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(parseInt(limit));
    
    database.getDb().all(query, params, (err, leads) => {
        if (err) {
            console.error('Error fetching investor leads:', err);
            return res.status(500).json({ error: 'Failed to fetch investor leads' });
        }

        res.json(leads);
    });
});

// Add new company metrics
router.post('/metrics', authenticateToken, authorizeRole(['admin', 'manager']), auditLog('CREATE_METRICS'), (req, res) => {
    const {
        metric_date,
        revenue,
        expenses,
        customer_acquisition_cost,
        customer_lifetime_value,
        monthly_recurring_revenue,
        churn_rate
    } = req.body;

    const profit_margin = revenue > 0 ? ((revenue - expenses) / revenue * 100) : 0;

    database.getDb().run(
        `INSERT INTO company_metrics 
         (id, metric_date, revenue, expenses, profit_margin, customer_acquisition_cost, customer_lifetime_value, monthly_recurring_revenue, churn_rate)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            require('uuid').v4(),
            metric_date,
            revenue,
            expenses,
            profit_margin,
            customer_acquisition_cost,
            customer_lifetime_value,
            monthly_recurring_revenue,
            churn_rate
        ],
        function(err) {
            if (err) {
                console.error('Error adding metrics:', err);
                return res.status(500).json({ error: 'Failed to add metrics' });
            }

            res.json({ 
                message: 'Metrics added successfully',
                id: this.lastID 
            });
        }
    );
});

// Export data endpoint
router.get('/export/:type', authenticateToken, authorizeRole(['admin', 'manager']), (req, res) => {
    const { type } = req.params;
    const { format = 'json', startDate, endDate } = req.query;

    let query = '';
    let params = [];

    switch (type) {
        case 'metrics':
            query = `SELECT * FROM company_metrics`;
            if (startDate && endDate) {
                query += ` WHERE metric_date BETWEEN ? AND ?`;
                params = [startDate, endDate];
            }
            query += ` ORDER BY metric_date DESC`;
            break;
        case 'properties':
            query = `SELECT * FROM properties ORDER BY acquisition_date DESC`;
            break;
        case 'leads':
            query = `SELECT * FROM investor_leads ORDER BY created_at DESC`;
            break;
        default:
            return res.status(400).json({ error: 'Invalid export type' });
    }

    database.getDb().all(query, params, (err, data) => {
        if (err) {
            console.error('Error exporting data:', err);
            return res.status(500).json({ error: 'Failed to export data' });
        }

        if (format === 'csv') {
            // Convert to CSV format
            if (data.length === 0) {
                return res.status(404).json({ error: 'No data to export' });
            }

            const headers = Object.keys(data[0]).join(',');
            const rows = data.map(row => Object.values(row).join(',')).join('\n');
            const csv = `${headers}\n${rows}`;

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${type}_export.csv"`);
            res.send(csv);
        } else {
            res.json(data);
        }
    });
});

module.exports = router;