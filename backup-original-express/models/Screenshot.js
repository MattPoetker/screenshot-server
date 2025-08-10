const dbManager = require('../database/db-manager');

class Screenshot {
    constructor(data) {
        Object.assign(this, data);
    }

    static async create(screenshotData) {
        const result = await dbManager.run(`
            INSERT INTO screenshots (
                api_key_id, request_id, url, capture_type, file_path, file_name,
                file_size, width, height, format, processing_time, success,
                error_message, user_agent, ip_address, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            screenshotData.api_key_id,
            screenshotData.request_id,
            screenshotData.url,
            screenshotData.capture_type || 'screenshot',
            screenshotData.file_path,
            screenshotData.file_name,
            screenshotData.file_size || 0,
            screenshotData.width || 0,
            screenshotData.height || 0,
            screenshotData.format || 'png',
            screenshotData.processing_time || 0,
            screenshotData.success !== undefined ? screenshotData.success : true,
            screenshotData.error_message || null,
            screenshotData.user_agent || null,
            screenshotData.ip_address || null,
            JSON.stringify(screenshotData.metadata || {})
        ]);

        return await Screenshot.findById(result.id);
    }

    static async findById(id) {
        const row = await dbManager.get('SELECT * FROM screenshots WHERE id = ?', [id]);
        return row ? new Screenshot(row) : null;
    }

    static async findAll(filters = {}, limit = 50, offset = 0) {
        let query = `
            SELECT s.*, ak.name as api_key_name 
            FROM screenshots s 
            LEFT JOIN api_keys ak ON s.api_key_id = ak.id 
            WHERE 1=1
        `;
        const params = [];

        if (filters.api_key_id) {
            query += ' AND s.api_key_id = ?';
            params.push(filters.api_key_id);
        }

        if (filters.capture_type) {
            query += ' AND s.capture_type = ?';
            params.push(filters.capture_type);
        }

        if (filters.format) {
            query += ' AND s.format = ?';
            params.push(filters.format);
        }

        if (filters.success !== undefined) {
            query += ' AND s.success = ?';
            params.push(filters.success ? 1 : 0);
        }

        if (filters.url_contains) {
            query += ' AND s.url LIKE ?';
            params.push(`%${filters.url_contains}%`);
        }

        if (filters.date_from) {
            query += ' AND s.created_at >= ?';
            params.push(filters.date_from);
        }

        if (filters.date_to) {
            query += ' AND s.created_at <= ?';
            params.push(filters.date_to);
        }

        query += ' ORDER BY s.created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const rows = await dbManager.all(query, params);
        return rows.map(row => new Screenshot(row));
    }

    static async getRecentActivity(limit = 20) {
        const rows = await dbManager.all(`
            SELECT s.*, ak.name as api_key_name 
            FROM screenshots s 
            LEFT JOIN api_keys ak ON s.api_key_id = ak.id 
            ORDER BY s.created_at DESC 
            LIMIT ?
        `, [limit]);

        return rows.map(row => new Screenshot(row));
    }

    static async getStats(days = 30) {
        const stats = {};

        // Total counts
        const totalStats = await dbManager.get(`
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN success = 1 THEN 1 END) as successful,
                COUNT(CASE WHEN success = 0 THEN 1 END) as failed,
                AVG(processing_time) as avg_processing_time,
                SUM(file_size) as total_file_size
            FROM screenshots 
            WHERE created_at >= datetime('now', '-${days} days')
        `);

        stats.total = totalStats.total || 0;
        stats.successful = totalStats.successful || 0;
        stats.failed = totalStats.failed || 0;
        stats.success_rate = stats.total > 0 ? (stats.successful / stats.total) * 100 : 100;
        stats.avg_processing_time = Math.round(totalStats.avg_processing_time || 0);
        stats.total_file_size = totalStats.total_file_size || 0;

        // Daily breakdown
        const dailyStats = await dbManager.all(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as count,
                COUNT(CASE WHEN success = 1 THEN 1 END) as successful,
                AVG(processing_time) as avg_time
            FROM screenshots 
            WHERE created_at >= datetime('now', '-${days} days')
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        `);

        stats.daily = dailyStats;

        // Format breakdown
        const formatStats = await dbManager.all(`
            SELECT 
                format,
                COUNT(*) as count,
                SUM(file_size) as total_size
            FROM screenshots 
            WHERE created_at >= datetime('now', '-${days} days')
            GROUP BY format
            ORDER BY count DESC
        `);

        stats.by_format = formatStats;

        // Capture type breakdown
        const typeStats = await dbManager.all(`
            SELECT 
                capture_type,
                COUNT(*) as count
            FROM screenshots 
            WHERE created_at >= datetime('now', '-${days} days')
            GROUP BY capture_type
            ORDER BY count DESC
        `);

        stats.by_type = typeStats;

        return stats;
    }

    static async getUsageChart(days = 30) {
        const chartData = await dbManager.all(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as requests,
                COUNT(CASE WHEN success = 1 THEN 1 END) as successful,
                AVG(processing_time) as avg_time
            FROM screenshots 
            WHERE created_at >= datetime('now', '-${days} days')
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `);

        return chartData;
    }

    async delete() {
        const fs = require('fs');
        
        // Delete file from filesystem
        try {
            if (this.file_path && fs.existsSync(this.file_path)) {
                fs.unlinkSync(this.file_path);
            }
        } catch (error) {
            console.warn('Failed to delete file:', error.message);
        }

        // Delete from database
        await dbManager.run('DELETE FROM screenshots WHERE id = ?', [this.id]);
        return true;
    }

    getMetadata() {
        try {
            return JSON.parse(this.metadata || '{}');
        } catch {
            return {};
        }
    }

    getFileUrl() {
        // Assuming files are served from /images/ endpoint
        return `/images/${this.file_name}`;
    }

    getFormattedSize() {
        const bytes = this.file_size || 0;
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    getFormattedProcessingTime() {
        const time = this.processing_time || 0;
        if (time < 1000) return `${time}ms`;
        return `${(time / 1000).toFixed(1)}s`;
    }

    toJSON() {
        const data = { ...this };
        data.metadata = this.getMetadata();
        data.file_url = this.getFileUrl();
        data.formatted_size = this.getFormattedSize();
        data.formatted_processing_time = this.getFormattedProcessingTime();
        return data;
    }
}

module.exports = Screenshot;