const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const database = require('../config/database');
const { 
    generateToken, 
    authenticateToken, 
    trackLoginAttempt,
    isUserLockedOut,
    lockUserAccount,
    resetFailedAttempts,
    incrementFailedAttempts,
    MAX_LOGIN_ATTEMPTS
} = require('../middleware/auth');

const router = express.Router();

// Login endpoint
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const ipAddress = req.ip;
        const userAgent = req.get('User-Agent');

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user by email
        database.getDb().get(
            'SELECT * FROM users WHERE email = ? AND is_active = 1',
            [email],
            async (err, user) => {
                if (err) {
                    console.error('Database error:', err);
                    trackLoginAttempt(email, ipAddress, false, userAgent);
                    return res.status(500).json({ error: 'Internal server error' });
                }

                if (!user) {
                    trackLoginAttempt(email, ipAddress, false, userAgent);
                    return res.status(401).json({ error: 'Invalid credentials' });
                }

                // Check if user is locked out
                if (isUserLockedOut(user)) {
                    trackLoginAttempt(email, ipAddress, false, userAgent);
                    return res.status(423).json({ 
                        error: 'Account temporarily locked due to multiple failed login attempts. Please try again later.' 
                    });
                }

                // Verify password
                const isValidPassword = await bcrypt.compare(password, user.password_hash);
                if (!isValidPassword) {
                    trackLoginAttempt(email, ipAddress, false, userAgent);
                    incrementFailedAttempts(user.id);
                    
                    // Check if we should lock the account
                    const newFailedAttempts = (user.failed_login_attempts || 0) + 1;
                    if (newFailedAttempts >= MAX_LOGIN_ATTEMPTS) {
                        lockUserAccount(user.id);
                        return res.status(423).json({ 
                            error: 'Account locked due to multiple failed login attempts. Please try again later.' 
                        });
                    }
                    
                    return res.status(401).json({ error: 'Invalid credentials' });
                }

                // Reset failed attempts on successful login
                resetFailedAttempts(user.id);
                trackLoginAttempt(email, ipAddress, true, userAgent);

                // Generate JWT token
                const token = generateToken(user);

                // Create session in database
                const sessionId = uuidv4();
                const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

                database.getDb().run(
                    'INSERT INTO sessions (id, user_id, token, expires_at, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
                    [sessionId, user.id, token, expiresAt.toISOString(), ipAddress, userAgent],
                    (err) => {
                        if (err) {
                            console.error('Session creation error:', err);
                            return res.status(500).json({ error: 'Failed to create session' });
                        }

                        // Update last login
                        database.getDb().run(
                            'UPDATE users SET last_login = datetime("now") WHERE id = ?',
                            [user.id]
                        );

                        // Return user data (without password)
                        const { password_hash, ...userData } = user;
                        res.json({
                            user: userData,
                            token,
                            expiresAt: expiresAt.toISOString()
                        });
                    }
                );
            }
        );
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Logout endpoint
router.post('/logout', authenticateToken, (req, res) => {
    const token = req.headers['authorization'].split(' ')[1];

    database.getDb().run(
        'DELETE FROM sessions WHERE token = ?',
        [token],
        (err) => {
            if (err) {
                console.error('Logout error:', err);
                return res.status(500).json({ error: 'Failed to logout' });
            }

            res.json({ message: 'Logged out successfully' });
        }
    );
});

// Get current user endpoint
router.get('/me', authenticateToken, (req, res) => {
    database.getDb().get(
        'SELECT id, email, role, first_name, last_name, last_login, created_at FROM users WHERE id = ?',
        [req.user.id],
        (err, user) => {
            if (err) {
                console.error('Get user error:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json({ user });
        }
    );
});

// Change password endpoint
router.post('/change-password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current and new passwords are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters' });
        }

        // Get current user
        database.getDb().get(
            'SELECT password_hash FROM users WHERE id = ?',
            [req.user.id],
            async (err, user) => {
                if (err || !user) {
                    return res.status(500).json({ error: 'User not found' });
                }

                // Verify current password
                const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
                if (!isValidPassword) {
                    return res.status(401).json({ error: 'Current password is incorrect' });
                }

                // Hash new password
                const hashedNewPassword = await bcrypt.hash(newPassword, 10);

                // Update password
                database.getDb().run(
                    'UPDATE users SET password_hash = ?, updated_at = datetime("now") WHERE id = ?',
                    [hashedNewPassword, req.user.id],
                    (err) => {
                        if (err) {
                            console.error('Password update error:', err);
                            return res.status(500).json({ error: 'Failed to update password' });
                        }

                        res.json({ message: 'Password updated successfully' });
                    }
                );
            }
        );
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Password reset request endpoint (for future implementation)
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        
        // In a real implementation, this would:
        // 1. Generate a secure reset token
        // 2. Store it in the database with expiration
        // 3. Send an email with reset link
        
        // For demo purposes, just return success
        res.json({ message: 'Password reset instructions sent to your email' });
        
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;