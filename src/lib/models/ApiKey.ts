import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { v4 as uuidv4 } from 'uuid'
import dbManager from '../db'
import type { ApiKey as ApiKeyType, CreateApiKeyRequest, CreateApiKeyResponse } from '../../types'

export class ApiKey implements ApiKeyType {
    id!: number
    key_id!: string
    name!: string
    description?: string
    rate_limit!: number
    is_active!: boolean
    created_by!: number
    expires_at?: string
    created_at!: string
    updated_at!: string

    constructor(data: any) {
        Object.assign(this, data)
    }

    static async create(keyData: CreateApiKeyRequest): Promise<CreateApiKeyResponse> {
        const keyId = uuidv4()
        const rawKey = `sk_${crypto.randomBytes(32).toString('hex')}`
        const keyHash = await bcrypt.hash(rawKey, 12)

        const result = await dbManager.run(`
            INSERT INTO api_keys (key_id, name, description, key_hash, rate_limit, created_by, expires_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            keyId,
            keyData.name,
            keyData.description || null,
            keyHash,
            keyData.rate_limit || 1000,
            keyData.created_by,
            keyData.expires_at || null
        ])

        return {
            id: result.id!,
            key_id: keyId,
            name: keyData.name,
            raw_key: rawKey,
            rate_limit: keyData.rate_limit || 1000,
            expires_at: keyData.expires_at
        }
    }

    static async findById(id: number): Promise<ApiKey | null> {
        const row = await dbManager.get('SELECT * FROM api_keys WHERE id = ?', [id])
        return row ? new ApiKey(row) : null
    }

    static async findByKeyId(keyId: string): Promise<ApiKey | null> {
        const row = await dbManager.get('SELECT * FROM api_keys WHERE key_id = ?', [keyId])
        return row ? new ApiKey(row) : null
    }

    static async findAll(limit = 100, offset = 0): Promise<ApiKey[]> {
        const rows = await dbManager.all(`
            SELECT ak.*, u.username as created_by_username 
            FROM api_keys ak
            LEFT JOIN users u ON ak.created_by = u.id
            WHERE ak.is_active = 1 
            ORDER BY ak.created_at DESC 
            LIMIT ? OFFSET ?
        `, [limit, offset])
        
        return rows.map(row => new ApiKey(row))
    }

    static async findByUser(userId: number): Promise<ApiKey[]> {
        const rows = await dbManager.all(`
            SELECT * FROM api_keys 
            WHERE created_by = ? AND is_active = 1 
            ORDER BY created_at DESC
        `, [userId])
        
        return rows.map(row => new ApiKey(row))
    }

    static async validateKey(rawKey: string): Promise<ApiKey | null> {
        const allKeys = await dbManager.all('SELECT * FROM api_keys WHERE is_active = 1')
        
        for (const keyData of allKeys) {
            const isValid = await bcrypt.compare(rawKey, keyData.key_hash)
            if (isValid) {
                const apiKey = new ApiKey(keyData)
                if (apiKey.isExpired()) {
                    return null
                }
                return apiKey
            }
        }
        return null
    }

    static async delete(id: number): Promise<boolean> {
        const result = await dbManager.run(
            'UPDATE api_keys SET is_active = 0 WHERE id = ?',
            [id]
        )
        return result.changes > 0
    }

    async update(updates: Partial<ApiKeyType>): Promise<void> {
        const allowedFields = ['name', 'description', 'rate_limit', 'expires_at']
        const fields = Object.keys(updates).filter(key => allowedFields.includes(key))
        
        if (fields.length === 0) return

        const setClause = fields.map(field => `${field} = ?`).join(', ')
        const values = fields.map(field => (updates as any)[field])
        values.push(this.id)

        await dbManager.run(
            `UPDATE api_keys SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            values
        )

        Object.assign(this, updates)
    }

    async deactivate(): Promise<void> {
        await dbManager.run('UPDATE api_keys SET is_active = 0 WHERE id = ?', [this.id])
        this.is_active = false
    }

    isExpired(): boolean {
        if (!this.expires_at) return false
        return new Date() > new Date(this.expires_at)
    }

    async getUsageStats(days = 30): Promise<any> {
        return await dbManager.all(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as requests,
                SUM(success) as successful,
                AVG(processing_time_ms) as avg_processing_time
            FROM screenshots 
            WHERE api_key_id = ? AND created_at >= datetime('now', '-${days} days')
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        `, [this.id])
    }

    async getTotalUsage(): Promise<{total: number, successful: number, failed: number}> {
        const result = await dbManager.get(`
            SELECT 
                COUNT(*) as total,
                SUM(success) as successful,
                SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed
            FROM screenshots 
            WHERE api_key_id = ?
        `, [this.id])
        
        return {
            total: result?.total || 0,
            successful: result?.successful || 0,
            failed: result?.failed || 0
        }
    }

    toJSON(): Omit<ApiKeyType, 'key_hash'> {
        const data = { ...this } as any
        delete data.key_hash // Never expose key hash
        return data
    }
}

export default ApiKey