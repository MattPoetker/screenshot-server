const express = require('express');
const router = express.Router();
const { login, authenticateJWT } = require('../middleware/auth');
const User = require('../models/User');

// Login endpoint
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ 
                success: false,
                error: 'Username and password are required' 
            });
        }

        const result = await login(username, password);
        
        if (result.success) {
            res.json(result);
        } else {
            res.status(401).json(result);
        }
    } catch (error) {
        console.error('Login endpoint error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Internal server error' 
        });
    }
});

// Get current user info (protected route)
router.get('/me', authenticateJWT, async (req, res) => {
    try {
        res.json({
            success: true,
            user: req.user.toJSON()
        });
    } catch (error) {
        console.error('Get user info error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to get user information' 
        });
    }
});

// Logout endpoint (client-side mainly, but we can track it)
router.post('/logout', authenticateJWT, async (req, res) => {
    try {
        // In a more sophisticated setup, you might want to blacklist the token
        // For now, we'll just return success and let the client handle token removal
        res.json({ 
            success: true,
            message: 'Logged out successfully' 
        });
    } catch (error) {
        console.error('Logout endpoint error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Logout failed' 
        });
    }
});

// Health check for auth system
router.get('/health', (req, res) => {
    res.json({ 
        success: true,
        message: 'Auth system is healthy',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;