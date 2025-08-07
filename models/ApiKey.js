const dbManager = require('../database/db-manager');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

class ApiKey {
    constructor(data) {
        Object.assign(this, data);
    }

    static async create(keyData) {
        const keyId = uuidv4();
        const rawKey = `sk_${crypto.randomBytes(32).toString('hex')}`;
        const keyHash = await bcrypt.hash(rawKey, 12);

        const result = await dbManager.run(`
            INSERT INTO api_keys (
                key_id, key_hash, name, description, created_by, 
                expires_at, rate_limit, permissions
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            keyId,
            keyHash,
            keyData.name,
            keyData.description || '',
            keyData.created_by,
            keyData.expires_at || null,
            keyData.rate_limit || 1000,
            JSON.stringify(keyData.permissions || ['screenshot'])
        ]);

        const apiKey = await ApiKey.findById(result.id);
        
        // Return the raw key only once during creation
        return {
            ...apiKey,
            raw_key: rawKey
        };
    }

    static async findById(id) {
        const row = await dbManager.get('SELECT * FROM api_keys WHERE id = ?', [id]);
        return row ? new ApiKey(row) : null;
    }

    static async findByKeyId(keyId) {
        const row = await dbManager.get('SELECT * FROM api_keys WHERE key_id = ?', [keyId]);
        return row ? new ApiKey(row) : null;
    }

    static async findAll(limit = 100, offset = 0) {
        const rows = await dbManager.all(`
            SELECT ak.*, u.username as created_by_username 
            FROM api_keys ak 
            LEFT JOIN users u ON ak.created_by = u.id 
            ORDER BY ak.created_at DESC 
            LIMIT ? OFFSET ?
        `, [limit, offset]);
        
        return rows.map(row => new ApiKey(row));
    }

    static async findActive() {
        const rows = await dbManager.all(`
            SELECT ak.*, u.username as created_by_username 
            FROM api_keys ak 
            LEFT JOIN users u ON ak.created_by = u.id 
            WHERE ak.is_active = 1 
            AND (ak.expires_at IS NULL OR ak.expires_at > datetime('now'))
            ORDER BY ak.created_at DESC
        `);
        
        return rows.map(row => new ApiKey(row));
    }

    static async validateKey(rawKey) {
        if (!rawKey || !rawKey.startsWith('sk_')) {
            return null;
        }

        const keyId = rawKey.split('_')[1]?.substring(0, 36); // Extract potential key ID
        const allKeys = await dbManager.all('SELECT * FROM api_keys WHERE is_active = 1');
        
        for (const keyData of allKeys) {
            const isValid = await bcrypt.compare(rawKey, keyData.key_hash);
            if (isValid) {
                // Update last used
                await dbManager.run(
                    'UPDATE api_keys SET last_used = CURRENT_TIMESTAMP WHERE id = ?',
                    [keyData.id]
                );
                
                return new ApiKey(keyData);
            }
        }
        
        return null;
    }

    async update(updates) {
        const allowedFields = ['name', 'description', 'is_active', 'rate_limit', 'permissions', 'expires_at'];
        const fields = [];
        const values = [];

        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key)) {
                fields.push(`${key} = ?`);
                if (key === 'permissions') {
                    values.push(JSON.stringify(value));
                } else {
                    values.push(value);
                }
            }
        }

        if (fields.length === 0) return false;

        values.push(this.id);
        await dbManager.run(`
            UPDATE api_keys SET ${fields.join(', ')} WHERE id = ?
        `, values);

        return true;
    }

    async delete() {
        await dbManager.run('UPDATE api_keys SET is_active = 0 WHERE id = ?', [this.id]);
        return true;
    }

    async getUsageStats(days = 30) {
        const stats = await dbManager.all(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as total_requests,
                COUNT(CASE WHEN success = 1 THEN 1 END) as successful_requests,
                COUNT(CASE WHEN success = 0 THEN 1 END) as failed_requests,
                AVG(processing_time) as avg_processing_time,
                SUM(file_size) as total_file_size
            FROM screenshots 
            WHERE api_key_id = ? 
            AND created_at >= datetime('now', '-${days} days')
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        `, [this.id]);

        return stats;
    }

    async getTotalUsage() {
        const usage = await dbManager.get(`
            SELECT 
                COUNT(*) as total_requests,
                COUNT(CASE WHEN success = 1 THEN 1 END) as successful_requests,
                COUNT(CASE WHEN success = 0 THEN 1 END) as failed_requests,
                AVG(processing_time) as avg_processing_time,
                SUM(file_size) as total_file_size,
                MAX(created_at) as last_request
            FROM screenshots 
            WHERE api_key_id = ?
        `, [this.id]);

        return usage || {
            total_requests: 0,
            successful_requests: 0,
            failed_requests: 0,
            avg_processing_time: 0,
            total_file_size: 0,
            last_request: null
        };
    }

    getPermissions() {
        try {
            return JSON.parse(this.permissions || '[]');
        } catch {
            return ['screenshot'];
        }
    }

    hasPermission(permission) {
        const perms = this.getPermissions();
        return perms.includes('*') || perms.includes(permission);
    }

    isExpired() {
        if (!this.expires_at) return false;
        return new Date(this.expires_at) < new Date();
    }

    toJSON() {
        const data = { ...this };
        delete data.key_hash; // Never expose the hash
        data.permissions = this.getPermissions();
        data.is_expired = this.isExpired();
        return data;
    }
}

module.exports = ApiKey;