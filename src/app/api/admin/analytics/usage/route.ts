import { NextRequest, NextResponse } from 'next/server'
import { initializeDatabase } from '@/lib/db/init'
import dbManager from '@/lib/db'
import { authenticateAdmin } from '@/lib/auth/middleware'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        await initializeDatabase()
        
        // Authenticate admin user
        const authResult = await authenticateAdmin(request)
        if (!authResult.success) {
            return NextResponse.json(authResult, { status: 401 })
        }

        const { searchParams } = request.nextUrl
        const days = parseInt(searchParams.get('days') || '30')

        const usageStats = await dbManager.all(`
            SELECT 
                ak.name as api_key_name,
                ak.id as api_key_id,
                ak.rate_limit,
                COUNT(s.id) as total_requests,
                SUM(CASE WHEN s.success = 1 THEN 1 ELSE 0 END) as successful_requests,
                MAX(s.created_at) as last_used,
                SUM(COALESCE(s.file_size, 0)) as total_bandwidth,
                AVG(CASE WHEN s.success = 1 THEN s.processing_time_ms END) as avg_processing_time
            FROM api_keys ak
            LEFT JOIN screenshots s ON ak.id = s.api_key_id 
                AND s.created_at >= datetime('now', '-${days} days')
            WHERE ak.is_active = 1
            GROUP BY ak.id, ak.name, ak.rate_limit
            ORDER BY total_requests DESC
        `)

        return NextResponse.json({
            success: true,
            data: usageStats.map(row => ({
                api_key_name: row.api_key_name,
                api_key_id: row.api_key_id,
                rate_limit: row.rate_limit,
                total_requests: row.total_requests || 0,
                successful_requests: row.successful_requests || 0,
                success_rate: row.total_requests > 0 ? Math.round((row.successful_requests / row.total_requests) * 100) : 0,
                last_used: row.last_used,
                total_bandwidth: row.total_bandwidth || 0,
                avg_processing_time: Math.round(row.avg_processing_time || 0),
                utilization: row.rate_limit > 0 ? Math.round(((row.total_requests || 0) / row.rate_limit) * 100) : 0
            }))
        })
    } catch (error) {
        console.error('Usage stats API error:', error)
        return NextResponse.json({ 
            success: false,
            error: 'Failed to load usage statistics' 
        }, { status: 500 })
    }
}