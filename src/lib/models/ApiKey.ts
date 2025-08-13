import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { v4 as uuidv4 } from 'uuid'
import universalDb from '../db/universal'
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
        // Map PostgreSQL column names to our interface
        if (data.user_id) data.created_by = data.user_id
        if (data.key_name) data.name = data.key_name
        if (data.api_key) data.key_id = data.api_key
        if (data.rate_limit_per_hour) data.rate_limit = data.rate_limit_per_hour
        
        Object.assign(this, data)
    }

    static async create(keyData: CreateApiKeyRequest): Promise<CreateApiKeyResponse> {
        const keyId = uuidv4()
        const rawKey = `sk_${crypto.randomBytes(32).toString('hex')}`
        const keyHash = await bcrypt.hash(rawKey, 12)

        const result = await universalDb.run(`
            INSERT INTO api_keys (user_id, key_name, api_key, key_hash, rate_limit_per_hour, expires_at) 
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            keyData.created_by,
            keyData.name,
            keyId, // Store keyId as api_key for now
            keyHash,
            keyData.rate_limit || 1000,
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
        const row = await universalDb.get('SELECT * FROM api_keys WHERE id = ?', [id])
        return row ? new ApiKey(row) : null
    }

    static async findByKeyId(keyId: string): Promise<ApiKey | null> {
        const row = await universalDb.get('SELECT * FROM api_keys WHERE api_key = ?', [keyId])
        return row ? new ApiKey(row) : null
    }

    static async findAll(limit = 100, offset = 0): Promise<ApiKey[]> {
        const isActive = universalDb.queryBuilder.convertBoolean(true)
        const rows = await universalDb.all(`
            SELECT ak.*, u.username as created_by_username 
            FROM api_keys ak
            LEFT JOIN users u ON ak.user_id = u.id
            WHERE ak.is_active = ? 
            ORDER BY ak.created_at DESC 
            LIMIT ? OFFSET ?
        `, [isActive, limit, offset])
        
        return rows.map(row => new ApiKey(row))
    }

    static async findByUser(userId: number): Promise<ApiKey[]> {
        const isActive = universalDb.queryBuilder.convertBoolean(true)
        const rows = await universalDb.all(`
            SELECT * FROM api_keys 
            WHERE user_id = ? AND is_active = ? 
            ORDER BY created_at DESC
        `, [userId, isActive])
        
        return rows.map(row => new ApiKey(row))
    }

    static async validateKey(rawKey: string): Promise<ApiKey | null> {
        const isActive = universalDb.queryBuilder.convertBoolean(true)
        const allKeys = await universalDb.all('SELECT * FROM api_keys WHERE is_active = ?', [isActive])
        
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
        const isActive = universalDb.queryBuilder.convertBoolean(false)
        const result = await universalDb.run(
            'UPDATE api_keys SET is_active = ? WHERE id = ?',
            [isActive, id]
        )
        return (result.changes || 0) > 0
    }

    async update(updates: Partial<ApiKeyType>): Promise<void> {
        const allowedFields = ['name', 'description', 'rate_limit', 'expires_at']
        const fields = Object.keys(updates).filter(key => allowedFields.includes(key))
        
        if (fields.length === 0) return

        const setClause = fields.map(field => `${field} = ?`).join(', ')
        const values = fields.map(field => (updates as any)[field])
        values.push(this.id)

        await universalDb.run(
            `UPDATE api_keys SET ${setClause}, updated_at = ${universalDb.queryBuilder.getCurrentTimestamp()} WHERE id = ?`,
            values
        )

        Object.assign(this, updates)
    }

    async deactivate(): Promise<void> {
        const isActive = universalDb.queryBuilder.convertBoolean(false)
        await universalDb.run('UPDATE api_keys SET is_active = ? WHERE id = ?', [isActive, this.id])
        this.is_active = false
    }

    isExpired(): boolean {
        if (!this.expires_at) return false
        return new Date() > new Date(this.expires_at)
    }

    async getUsageStats(days = 30): Promise<any> {
        return await universalDb.all(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as requests,
                SUM(CASE WHEN width IS NOT NULL THEN 1 ELSE 0 END) as successful,
                AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) * 1000) as avg_processing_time
            FROM screenshots 
            WHERE api_key_id = ? AND created_at >= ${universalDb.queryBuilder.getNowFunction()} - INTERVAL '${days} days'
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        `, [this.id])
    }

    async getTotalUsage(): Promise<{total: number, successful: number, failed: number}> {
        const result = await universalDb.get(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN width IS NOT NULL THEN 1 ELSE 0 END) as successful,
                SUM(CASE WHEN width IS NULL THEN 1 ELSE 0 END) as failed
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