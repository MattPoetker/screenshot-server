const express = require('express');
const router = express.Router();
const { authenticateJWT, requireAdmin, login } = require('../middleware/auth');
const User = require('../models/User');
const ApiKey = require('../models/ApiKey');
const Screenshot = require('../models/Screenshot');
const dbManager = require('../database/db-manager');

// Apply authentication middleware to all admin routes
router.use(authenticateJWT);
router.use(requireAdmin);

// Dashboard endpoints
router.get('/dashboard', async (req, res) => {
    try {
        const [totalScreenshots, activeApiKeys, successStats, avgTime] = await Promise.all([
            // Total screenshots count
            dbManager.get('SELECT COUNT(*) as count FROM screenshots'),
            
            // Active API keys count
            dbManager.get('SELECT COUNT(*) as count FROM api_keys WHERE is_active = 1'),
            
            // Success rate calculation
            dbManager.get(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful
                FROM screenshots 
                WHERE created_at >= datetime('now', '-30 days')
            `),
            
            // Average processing time (in ms)
            dbManager.get(`
                SELECT AVG(processing_time) as avg_time
                FROM screenshots 
                WHERE success = 1 AND created_at >= datetime('now', '-7 days')
            `)
        ]);

        const successRate = successStats.total > 0 
            ? (successStats.successful / successStats.total) * 100 
            : 100;

        res.json({
            totalScreenshots: totalScreenshots.count || 0,
            activeApiKeys: activeApiKeys.count || 0,
            successRate: successRate,
            avgProcessingTime: Math.round(avgTime.avg_time || 0)
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ error: 'Failed to load dashboard stats' });
    }
});

// Recent activity endpoint
router.get('/activity', async (req, res) => {
    try {
        const activities = await dbManager.all(`
            SELECT 
                s.*,
                ak.name as api_key_name
            FROM screenshots s
            LEFT JOIN api_keys ak ON s.api_key_id = ak.id
            ORDER BY s.created_at DESC
            LIMIT 20
        `);

        const formattedActivities = activities.map(activity => ({
            id: activity.id,
            url: activity.url,
            format: activity.format,
            capture_type: activity.capture_type || 'screenshot',
            file_size: activity.file_size || 0,
            success: activity.success === 1,
            created_at: activity.created_at,
            api_key_name: activity.api_key_name || 'Unknown'
        }));

        res.json(formattedActivities);
    } catch (error) {
        console.error('Recent activity error:', error);
        res.status(500).json({ error: 'Failed to load recent activity' });
    }
});

// Usage chart endpoint
router.get('/usage-chart', async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        
        const chartData = await dbManager.all(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as requests,
                SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful
            FROM screenshots 
            WHERE created_at >= datetime('now', '-${days} days')
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `);

        res.json(chartData);
    } catch (error) {
        console.error('Usage chart error:', error);
        res.status(500).json({ error: 'Failed to load usage chart data' });
    }
});

// API Keys management endpoints
router.get('/api-keys', async (req, res) => {
    try {
        const keys = await ApiKey.findAll();
        
        // Add usage stats for each key
        const keysWithStats = await Promise.all(keys.map(async (key) => {
            const usageStats = await dbManager.get(`
                SELECT 
                    COUNT(*) as total_requests,
                    MAX(created_at) as last_used
                FROM screenshots 
                WHERE api_key_id = ?
            `, [key.id]);

            return {
                ...key,
                total_requests: usageStats.total_requests || 0,
                last_used: usageStats.last_used
            };
        }));

        res.json(keysWithStats);
    } catch (error) {
        console.error('API Keys fetch error:', error);
        res.status(500).json({ error: 'Failed to load API keys' });
    }
});

router.post('/api-keys', async (req, res) => {
    try {
        const { name, description, rate_limit, permissions, expires_at } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'API key name is required' });
        }

        const keyData = {
            name: name.trim(),
            description: description || '',
            rate_limit: parseInt(rate_limit) || 1000,
            permissions: Array.isArray(permissions) ? permissions.join(',') : 'screenshot',
            expires_at: expires_at || null,
            created_by: req.user.id
        };

        const apiKey = await ApiKey.create(keyData);
        res.status(201).json(apiKey);
    } catch (error) {
        console.error('API Key creation error:', error);
        res.status(500).json({ error: 'Failed to create API key' });
    }
});

router.put('/api-keys/:id', async (req, res) => {
    try {
        const keyId = req.params.id;
        const updates = req.body;

        // Remove fields that shouldn't be updated directly
        delete updates.id;
        delete updates.key_id;
        delete updates.key_hash;
        delete updates.created_at;

        const updatedKey = await ApiKey.update(keyId, updates);
        
        if (!updatedKey) {
            return res.status(404).json({ error: 'API key not found' });
        }

        res.json(updatedKey);
    } catch (error) {
        console.error('API Key update error:', error);
        res.status(500).json({ error: 'Failed to update API key' });
    }
});

router.delete('/api-keys/:id', async (req, res) => {
    try {
        const keyId = req.params.id;
        const deleted = await ApiKey.delete(keyId);
        
        if (!deleted) {
            return res.status(404).json({ error: 'API key not found' });
        }

        res.json({ message: 'API key deleted successfully' });
    } catch (error) {
        console.error('API Key deletion error:', error);
        res.status(500).json({ error: 'Failed to delete API key' });
    }
});

// Screenshots endpoints
router.get('/screenshots', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const offset = (page - 1) * limit;

        // Build WHERE clause based on filters
        let whereClause = '1=1';
        const params = [];

        if (req.query.format) {
            whereClause += ' AND format = ?';
            params.push(req.query.format);
        }

        if (req.query.success !== undefined) {
            whereClause += ' AND success = ?';
            params.push(req.query.success === 'true' ? 1 : 0);
        }

        if (req.query.start_date) {
            whereClause += ' AND created_at >= ?';
            params.push(req.query.start_date);
        }

        if (req.query.end_date) {
            whereClause += ' AND created_at <= ?';
            params.push(req.query.end_date);
        }

        // Get total count
        const totalResult = await dbManager.get(
            `SELECT COUNT(*) as total FROM screenshots s 
             LEFT JOIN api_keys ak ON s.api_key_id = ak.id 
             WHERE ${whereClause}`,
            params
        );

        // Get paginated results
        const screenshots = await dbManager.all(
            `SELECT 
                s.*,
                ak.name as api_key_name
             FROM screenshots s
             LEFT JOIN api_keys ak ON s.api_key_id = ak.id
             WHERE ${whereClause}
             ORDER BY s.created_at DESC
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        res.json({
            screenshots,
            pagination: {
                page,
                limit,
                total: totalResult.total,
                pages: Math.ceil(totalResult.total / limit)
            }
        });
    } catch (error) {
        console.error('Screenshots fetch error:', error);
        res.status(500).json({ error: 'Failed to load screenshots' });
    }
});

router.delete('/screenshots/:id', async (req, res) => {
    try {
        const screenshotId = req.params.id;
        const deleted = await Screenshot.delete(screenshotId);
        
        if (!deleted) {
            return res.status(404).json({ error: 'Screenshot not found' });
        }

        res.json({ message: 'Screenshot deleted successfully' });
    } catch (error) {
        console.error('Screenshot deletion error:', error);
        res.status(500).json({ error: 'Failed to delete screenshot' });
    }
});

// Analytics endpoints
router.get('/analytics', async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        
        const [usageStats, formatStats, errorStats] = await Promise.all([
            // Usage over time
            dbManager.all(`
                SELECT 
                    DATE(created_at) as date,
                    COUNT(*) as total_requests,
                    SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful_requests,
                    AVG(CASE WHEN success = 1 THEN processing_time END) as avg_processing_time
                FROM screenshots 
                WHERE created_at >= datetime('now', '-${days} days')
                GROUP BY DATE(created_at)
                ORDER BY date ASC
            `),
            
            // Format distribution
            dbManager.all(`
                SELECT 
                    format,
                    COUNT(*) as count,
                    ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM screenshots WHERE created_at >= datetime('now', '-${days} days'))), 2) as percentage
                FROM screenshots 
                WHERE created_at >= datetime('now', '-${days} days')
                GROUP BY format
                ORDER BY count DESC
            `),
            
            // Error analysis
            dbManager.all(`
                SELECT 
                    error_message,
                    COUNT(*) as count
                FROM screenshots 
                WHERE success = 0 AND created_at >= datetime('now', '-${days} days')
                GROUP BY error_message
                ORDER BY count DESC
                LIMIT 10
            `)
        ]);

        res.json({
            usage_stats: usageStats,
            format_distribution: formatStats,
            error_analysis: errorStats
        });
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ error: 'Failed to load analytics data' });
    }
});

router.get('/analytics/formats', async (req, res) => {
    try {
        const formatStats = await dbManager.all(`
            SELECT 
                format,
                COUNT(*) as total,
                SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful,
                AVG(file_size) as avg_size,
                AVG(CASE WHEN success = 1 THEN processing_time END) as avg_time
            FROM screenshots 
            WHERE created_at >= datetime('now', '-30 days')
            GROUP BY format
            ORDER BY total DESC
        `);

        res.json(formatStats);
    } catch (error) {
        console.error('Format stats error:', error);
        res.status(500).json({ error: 'Failed to load format statistics' });
    }
});

router.get('/analytics/usage', async (req, res) => {
    try {
        const usageStats = await dbManager.all(`
            SELECT 
                ak.name as api_key_name,
                ak.id as api_key_id,
                COUNT(s.id) as total_requests,
                SUM(CASE WHEN s.success = 1 THEN 1 ELSE 0 END) as successful_requests,
                MAX(s.created_at) as last_used,
                SUM(s.file_size) as total_bandwidth
            FROM api_keys ak
            LEFT JOIN screenshots s ON ak.id = s.api_key_id 
                AND s.created_at >= datetime('now', '-30 days')
            GROUP BY ak.id, ak.name
            ORDER BY total_requests DESC
        `);

        res.json(usageStats);
    } catch (error) {
        console.error('Usage stats error:', error);
        res.status(500).json({ error: 'Failed to load usage statistics' });
    }
});

module.exports = router;