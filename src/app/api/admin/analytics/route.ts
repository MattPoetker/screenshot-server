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

        const [usageStats, formatStats, errorStats] = await Promise.all([
            // Usage over time
            dbManager.all(`
                SELECT 
                    DATE(created_at) as date,
                    COUNT(*) as total_requests,
                    SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful_requests,
                    AVG(CASE WHEN success = 1 THEN processing_time_ms END) as avg_processing_time
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
                AND error_message IS NOT NULL
                GROUP BY error_message
                ORDER BY count DESC
                LIMIT 10
            `)
        ])

        return NextResponse.json({
            success: true,
            data: {
                usage_stats: usageStats.map(row => ({
                    date: row.date,
                    total_requests: row.total_requests,
                    successful_requests: row.successful_requests,
                    avg_processing_time: Math.round(row.avg_processing_time || 0)
                })),
                format_distribution: formatStats,
                error_analysis: errorStats
            }
        })
    } catch (error) {
        console.error('Analytics API error:', error)
        return NextResponse.json({ 
            success: false,
            error: 'Failed to load analytics data' 
        }, { status: 500 })
    }
}