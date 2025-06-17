const jwt = require('jsonwebtoken');
const database = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = '24h';

// Generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        { 
            id: user.id, 
            email: user.email, 
            role: user.role 
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
};

// Verify JWT token middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }

        // Check if session exists in database
        database.getDb().get(
            'SELECT * FROM sessions WHERE token = ? AND expires_at > datetime("now")',
            [token],
            (err, session) => {
                if (err || !session) {
                    return res.status(403).json({ error: 'Invalid session' });
                }

                req.user = user;
                next();
            }
        );
    });
};

// Role-based authorization middleware
const authorizeRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        next();
    };
};

// Audit logging middleware
const auditLog = (action) => {
    return (req, res, next) => {
        const originalSend = res.send;
        
        res.send = function(data) {
            // Log the action after successful response
            if (res.statusCode < 400) {
                const logData = {
                    id: require('uuid').v4(),
                    user_id: req.user ? req.user.id : null,
                    action: action,
                    table_name: req.params.table || null,
                    record_id: req.params.id || null,
                    old_values: req.body.oldValues ? JSON.stringify(req.body.oldValues) : null,
                    new_values: req.body ? JSON.stringify(req.body) : null,
                    ip_address: req.ip,
                    user_agent: req.get('User-Agent')
                };

                database.getDb().run(
                    `INSERT INTO audit_log (id, user_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    Object.values(logData),
                    (err) => {
                        if (err) console.error('Audit log error:', err);
                    }
                );
            }
            
            originalSend.call(this, data);
        };
        
        next();
    };
};

module.exports = {
    generateToken,
    authenticateToken,
    authorizeRole,
    auditLog,
    JWT_SECRET
};