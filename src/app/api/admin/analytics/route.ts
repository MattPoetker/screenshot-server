import { NextRequest, NextResponse } from 'next/server'
import { initializeDatabase } from '@/lib/db/init'
import universalDb from '@/lib/db/universal'
import { authenticateJWT } from '@/lib/auth/middleware'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        await initializeDatabase()
        
        // Authenticate user
        const authResult = await authenticateJWT(request)
        if (!authResult.success) {
            return NextResponse.json(authResult, { status: 401 })
        }

        const { searchParams } = request.nextUrl
        const days = parseInt(searchParams.get('days') || '30')

        const [usageStats, formatStats, errorStats] = await Promise.all([
            // Usage over time
            universalDb.all(`
                SELECT 
                    DATE(s.created_at) as date,
                    COUNT(*) as total_requests,
                    SUM(CASE WHEN s.success = ${universalDb.queryBuilder.convertBoolean(true)} THEN 1 ELSE 0 END) as successful_requests,
                    AVG(CASE WHEN s.success = ${universalDb.queryBuilder.convertBoolean(true)} THEN s.processing_time_ms END) as avg_processing_time
                FROM screenshots s
                JOIN api_keys ak ON s.api_key_id = ak.id
                WHERE s.created_at >= ${universalDb.queryBuilder.getNowFunction()} - INTERVAL '${days} days'
                    AND ak.user_id = ?
                GROUP BY DATE(s.created_at)
                ORDER BY date ASC
            `, [authResult.user!.id]),
            
            // Format distribution
            universalDb.all(`
                SELECT 
                    s.format,
                    COUNT(*) as count,
                    ROUND((COUNT(*) * 100.0 / (
                        SELECT COUNT(*) 
                        FROM screenshots s2 
                        JOIN api_keys ak2 ON s2.api_key_id = ak2.id 
                        WHERE s2.created_at >= ${universalDb.queryBuilder.getNowFunction()} - INTERVAL '${days} days'
                            AND ak2.user_id = ?
                    )), 2) as percentage
                FROM screenshots s
                JOIN api_keys ak ON s.api_key_id = ak.id
                WHERE s.created_at >= ${universalDb.queryBuilder.getNowFunction()} - INTERVAL '${days} days'
                    AND ak.user_id = ?
                GROUP BY s.format
                ORDER BY count DESC
            `, [authResult.user!.id, authResult.user!.id]),
            
            // Error analysis
            universalDb.all(`
                SELECT 
                    s.error_message,
                    COUNT(*) as count
                FROM screenshots s
                JOIN api_keys ak ON s.api_key_id = ak.id
                WHERE s.success = ${universalDb.queryBuilder.convertBoolean(false)} 
                    AND s.created_at >= ${universalDb.queryBuilder.getNowFunction()} - INTERVAL '${days} days'
                    AND s.error_message IS NOT NULL
                    AND ak.user_id = ?
                GROUP BY s.error_message
                ORDER BY count DESC
                LIMIT 10
            `, [authResult.user!.id])
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