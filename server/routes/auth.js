const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const database = require('../config/database');
const { generateToken, authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Login endpoint
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

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
                    return res.status(500).json({ error: 'Internal server error' });
                }

                if (!user) {
                    return res.status(401).json({ error: 'Invalid credentials' });
                }

                // Verify password
                const isValidPassword = await bcrypt.compare(password, user.password_hash);
                if (!isValidPassword) {
                    return res.status(401).json({ error: 'Invalid credentials' });
                }

                // Generate JWT token
                const token = generateToken(user);

                // Create session in database
                const sessionId = uuidv4();
                const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

                database.getDb().run(
                    'INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
                    [sessionId, user.id, token, expiresAt.toISOString()],
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

module.exports = router;