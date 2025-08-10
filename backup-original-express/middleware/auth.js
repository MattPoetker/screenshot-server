const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiKey = require('../models/ApiKey');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// JWT Authentication middleware
const authenticateJWT = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId);
        
        if (!user || !user.is_active) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

// Admin-only middleware
const requireAdmin = (req, res, next) => {
    if (!req.user || !req.user.isAdmin()) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// API Key authentication middleware (for screenshot API)
const authenticateAPIKey = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'API key required' });
    }

    try {
        const apiKey = await ApiKey.validateKey(token);
        
        if (!apiKey) {
            return res.status(401).json({ error: 'Invalid API key' });
        }

        if (!apiKey.is_active) {
            return res.status(401).json({ error: 'API key is inactive' });
        }

        if (apiKey.isExpired()) {
            return res.status(401).json({ error: 'API key has expired' });
        }

        req.apiKey = apiKey;
        next();
    } catch (error) {
        console.error('API key authentication error:', error);
        return res.status(500).json({ error: 'Authentication error' });
    }
};

// Rate limiting middleware
const checkRateLimit = async (req, res, next) => {
    if (!req.apiKey) {
        return res.status(401).json({ error: 'API key required for rate limiting' });
    }

    try {
        const dbManager = require('../database/db-manager');
        const windowStart = new Date();
        windowStart.setHours(windowStart.getHours() - 1); // 1-hour window

        // Count requests in the last hour
        const requestCount = await dbManager.get(`
            SELECT COUNT(*) as count 
            FROM screenshots 
            WHERE api_key_id = ? AND created_at >= ?
        `, [req.apiKey.id, windowStart.toISOString()]);

        const currentCount = requestCount.count || 0;
        const limit = req.apiKey.rate_limit || 1000;

        if (currentCount >= limit) {
            return res.status(429).json({ 
                error: 'Rate limit exceeded',
                limit: limit,
                current: currentCount,
                reset_at: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
            });
        }

        // Add rate limit headers
        res.set({
            'X-RateLimit-Limit': limit,
            'X-RateLimit-Remaining': Math.max(0, limit - currentCount),
            'X-RateLimit-Reset': new Date(Date.now() + 3600000).toISOString()
        });

        next();
    } catch (error) {
        console.error('Rate limit check error:', error);
        next(); // Continue on error, don't block requests
    }
};

// Permission checking middleware
const requirePermission = (permission) => {
    return (req, res, next) => {
        if (!req.apiKey) {
            return res.status(401).json({ error: 'API key required' });
        }

        if (!req.apiKey.hasPermission(permission)) {
            return res.status(403).json({ 
                error: `Permission '${permission}' required`,
                available_permissions: req.apiKey.getPermissions()
            });
        }

        next();
    };
};

// Generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        { 
            userId: user.id, 
            username: user.username,
            role: user.role 
        },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
};

// Login function
const login = async (username, password) => {
    try {
        const user = await User.authenticate(username, password);
        
        if (!user) {
            return { success: false, error: 'Invalid credentials' };
        }

        const token = generateToken(user);
        
        return {
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        };
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: 'Login failed' };
    }
};

module.exports = {
    authenticateJWT,
    requireAdmin,
    authenticateAPIKey,
    checkRateLimit,
    requirePermission,
    generateToken,
    login,
    JWT_SECRET
};