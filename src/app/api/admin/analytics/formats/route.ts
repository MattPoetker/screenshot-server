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

        const formatStats = await dbManager.all(`
            SELECT 
                format,
                COUNT(*) as total,
                SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful,
                AVG(file_size) as avg_size,
                AVG(CASE WHEN success = 1 THEN processing_time_ms END) as avg_time
            FROM screenshots 
            WHERE created_at >= datetime('now', '-${days} days')
            GROUP BY format
            ORDER BY total DESC
        `)

        return NextResponse.json({
            success: true,
            data: formatStats.map(row => ({
                format: row.format,
                total: row.total,
                successful: row.successful,
                success_rate: row.total > 0 ? Math.round((row.successful / row.total) * 100) : 0,
                avg_size: Math.round(row.avg_size || 0),
                avg_time: Math.round(row.avg_time || 0)
            }))
        })
    } catch (error) {
        console.error('Format stats API error:', error)
        return NextResponse.json({ 
            success: false,
            error: 'Failed to load format statistics' 
        }, { status: 500 })
    }
}