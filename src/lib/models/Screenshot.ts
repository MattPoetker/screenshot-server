import dbManager from '../db'
import type { Screenshot as ScreenshotType } from '../../types'

export class Screenshot implements ScreenshotType {
    id!: number
    api_key_id!: number
    url!: string
    image_path!: string // This maps to file_path in database
    format!: 'png' | 'jpeg' | 'webp'
    width?: number
    height?: number
    success!: boolean
    error_message?: string
    processing_time_ms?: number
    created_at!: string
    
    // Additional fields from existing schema
    request_id?: string
    capture_type?: string
    file_path!: string
    file_name!: string
    file_size?: number
    processing_time?: number
    user_agent?: string
    ip_address?: string
    metadata?: string

    constructor(data: any) {
        Object.assign(this, data)
        // Map file_path to image_path for interface compatibility
        if (data.file_path && !data.image_path) {
            this.image_path = data.file_path
        }
        // Map processing_time to processing_time_ms for interface compatibility
        if (data.processing_time && !data.processing_time_ms) {
            this.processing_time_ms = data.processing_time
        }
    }

    static async create(screenshotData: {
        api_key_id: number
        url: string
        image_path: string
        format?: 'png' | 'jpeg' | 'webp'
        width?: number
        height?: number
        success?: boolean
        error_message?: string
        processing_time_ms?: number
        metadata?: any
        request_id?: string
        file_name?: string
        file_size?: number
        user_agent?: string
        ip_address?: string
    }): Promise<Screenshot> {
        const result = await dbManager.run(`
            INSERT INTO screenshots (
                api_key_id, url, file_path, file_name, format, width, height, 
                success, error_message, processing_time, metadata, request_id,
                file_size, user_agent, ip_address, capture_type
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            screenshotData.api_key_id,
            screenshotData.url,
            screenshotData.image_path, // Maps to file_path
            screenshotData.file_name || 'screenshot.png',
            screenshotData.format || 'png',
            screenshotData.width || null,
            screenshotData.height || null,
            screenshotData.success !== undefined ? (screenshotData.success ? 1 : 0) : 1,
            screenshotData.error_message || null,
            screenshotData.processing_time_ms || null,
            screenshotData.metadata ? JSON.stringify(screenshotData.metadata) : '{}',
            screenshotData.request_id || null,
            screenshotData.file_size || null,
            screenshotData.user_agent || null,
            screenshotData.ip_address || null,
            'screenshot'
        ])

        const screenshot = await Screenshot.findById(result.id!)
        if (!screenshot) {
            throw new Error('Failed to create screenshot record')
        }
        return screenshot
    }

    static async findById(id: number): Promise<Screenshot | null> {
        const row = await dbManager.get('SELECT * FROM screenshots WHERE id = ?', [id])
        return row ? new Screenshot(row) : null
    }

    static async findAll(limit = 100, offset = 0): Promise<Screenshot[]> {
        const rows = await dbManager.all(`
            SELECT s.*, ak.name as api_key_name, u.username 
            FROM screenshots s
            LEFT JOIN api_keys ak ON s.api_key_id = ak.id
            LEFT JOIN users u ON ak.created_by = u.id
            ORDER BY s.created_at DESC 
            LIMIT ? OFFSET ?
        `, [limit, offset])
        
        return rows.map(row => new Screenshot(row))
    }

    static async findByApiKey(apiKeyId: number, limit = 100, offset = 0): Promise<Screenshot[]> {
        const rows = await dbManager.all(`
            SELECT * FROM screenshots 
            WHERE api_key_id = ? 
            ORDER BY created_at DESC 
            LIMIT ? OFFSET ?
        `, [apiKeyId, limit, offset])
        
        return rows.map(row => new Screenshot(row))
    }

    static async findByUrl(url: string, limit = 10): Promise<Screenshot[]> {
        const rows = await dbManager.all(`
            SELECT s.*, ak.name as api_key_name 
            FROM screenshots s
            LEFT JOIN api_keys ak ON s.api_key_id = ak.id
            WHERE s.url = ? 
            ORDER BY s.created_at DESC 
            LIMIT ?
        `, [url, limit])
        
        return rows.map(row => new Screenshot(row))
    }

    static async getStats(days = 30): Promise<{
        total: number
        successful: number
        failed: number
        avgProcessingTime: number
    }> {
        const result = await dbManager.get(`
            SELECT 
                COUNT(*) as total,
                SUM(success) as successful,
                SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed,
                AVG(processing_time_ms) as avg_processing_time
            FROM screenshots 
            WHERE created_at >= datetime('now', '-${days} days')
        `)
        
        return {
            total: result?.total || 0,
            successful: result?.successful || 0,
            failed: result?.failed || 0,
            avgProcessingTime: result?.avg_processing_time || 0
        }
    }

    static async getUsageByDate(days = 30): Promise<Array<{
        date: string
        total: number
        successful: number
        failed: number
        avgProcessingTime: number
    }>> {
        const rows = await dbManager.all(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as total,
                SUM(success) as successful,
                SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed,
                AVG(processing_time_ms) as avg_processing_time
            FROM screenshots 
            WHERE created_at >= datetime('now', '-${days} days')
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        `)
        
        return rows.map(row => ({
            date: row.date,
            total: row.total,
            successful: row.successful,
            failed: row.failed,
            avgProcessingTime: row.avg_processing_time || 0
        }))
    }

    static async getFormatDistribution(days = 30): Promise<Array<{
        format: string
        count: number
        percentage: number
    }>> {
        const rows = await dbManager.all(`
            SELECT 
                format,
                COUNT(*) as count,
                ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM screenshots WHERE created_at >= datetime('now', '-${days} days')), 2) as percentage
            FROM screenshots 
            WHERE created_at >= datetime('now', '-${days} days')
            GROUP BY format
            ORDER BY count DESC
        `)
        
        return rows
    }

    static async getRecentActivity(limit = 10): Promise<Array<{
        id: number
        url: string
        format: string
        success: boolean
        created_at: string
        api_key_name?: string
        username?: string
    }>> {
        const rows = await dbManager.all(`
            SELECT 
                s.id, s.url, s.format, s.success, s.created_at,
                ak.name as api_key_name, u.username
            FROM screenshots s
            LEFT JOIN api_keys ak ON s.api_key_id = ak.id
            LEFT JOIN users u ON ak.created_by = u.id
            ORDER BY s.created_at DESC 
            LIMIT ?
        `, [limit])
        
        return rows
    }

    static async delete(id: number): Promise<boolean> {
        const result = await dbManager.run('DELETE FROM screenshots WHERE id = ?', [id])
        return result.changes > 0
    }

    async update(updates: Partial<ScreenshotType>): Promise<void> {
        const allowedFields = ['success', 'error_message', 'processing_time_ms']
        const fields = Object.keys(updates).filter(key => allowedFields.includes(key))
        
        if (fields.length === 0) return

        const setClause = fields.map(field => `${field} = ?`).join(', ')
        const values = fields.map(field => (updates as any)[field])
        values.push(this.id)

        await dbManager.run(
            `UPDATE screenshots SET ${setClause} WHERE id = ?`,
            values
        )

        Object.assign(this, updates)
    }

    getMetadata(): any {
        try {
            return (this as any).metadata ? JSON.parse((this as any).metadata) : null
        } catch {
            return null
        }
    }

    toJSON(): ScreenshotType {
        const data = { ...this } as any
        if (data.metadata && typeof data.metadata === 'string') {
            try {
                data.metadata = JSON.parse(data.metadata)
            } catch {
                data.metadata = null
            }
        }
        return data
    }
}

export default Screenshot