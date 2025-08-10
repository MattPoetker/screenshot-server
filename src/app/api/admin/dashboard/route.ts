import { NextRequest, NextResponse } from 'next/server'
import { initializeDatabase } from '@/lib/db/init'
import dbManager from '@/lib/db'
import { authenticateAdmin } from '@/lib/auth/middleware'

export async function GET(request: NextRequest) {
    try {
        await initializeDatabase()
        
        // Authenticate admin user
        const authResult = await authenticateAdmin(request)
        if (!authResult.success) {
            return NextResponse.json(authResult, { status: 401 })
        }

        // Get current period stats (last 7 days)
        const [totalScreenshots, activeApiKeys, successStats, avgTime, recentActivity, trendData] = await Promise.all([
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
            
            // Average processing time
            dbManager.get(`
                SELECT AVG(processing_time) as avg_time 
                FROM screenshots 
                WHERE processing_time IS NOT NULL 
                AND created_at >= datetime('now', '-30 days')
            `),
            
            // Recent activity
            dbManager.all(`
                SELECT 
                    s.id,
                    s.url,
                    s.format,
                    s.success,
                    s.created_at,
                    s.file_size,
                    ak.name as api_key_name,
                    u.username
                FROM screenshots s
                LEFT JOIN api_keys ak ON s.api_key_id = ak.id
                LEFT JOIN users u ON ak.created_by = u.id
                ORDER BY s.created_at DESC
                LIMIT 10
            `),
            
            // Trend data - compare current week to previous week
            dbManager.get(`
                SELECT 
                    (SELECT COUNT(*) FROM screenshots 
                     WHERE created_at >= datetime('now', '-7 days')) as current_week,
                    (SELECT COUNT(*) FROM screenshots 
                     WHERE created_at >= datetime('now', '-14 days') 
                     AND created_at < datetime('now', '-7 days')) as previous_week,
                    (SELECT COUNT(*) FROM screenshots 
                     WHERE success = 1 AND created_at >= datetime('now', '-7 days')) as current_week_success,
                    (SELECT COUNT(*) FROM screenshots 
                     WHERE success = 1 AND created_at >= datetime('now', '-14 days') 
                     AND created_at < datetime('now', '-7 days')) as previous_week_success,
                    (SELECT AVG(processing_time) FROM screenshots 
                     WHERE created_at >= datetime('now', '-7 days')) as current_avg_time,
                    (SELECT AVG(processing_time) FROM screenshots 
                     WHERE created_at >= datetime('now', '-14 days') 
                     AND created_at < datetime('now', '-7 days')) as previous_avg_time
            `)
        ])

        const successRate = successStats.total > 0 
            ? Math.round((successStats.successful / successStats.total) * 100) 
            : 0

        const avgProcessingTime = Math.round(avgTime?.avg_time || 0)
        
        // Calculate trends
        const requestsTrend = trendData.previous_week > 0 
            ? ((trendData.current_week - trendData.previous_week) / trendData.previous_week * 100).toFixed(1)
            : '0'
        
        const successRateTrend = (() => {
            const currentRate = trendData.current_week > 0 
                ? (trendData.current_week_success / trendData.current_week * 100) 
                : 0
            const previousRate = trendData.previous_week > 0 
                ? (trendData.previous_week_success / trendData.previous_week * 100) 
                : 0
            return previousRate > 0 ? (currentRate - previousRate).toFixed(1) : '0'
        })()
        
        const timeTrend = trendData.previous_avg_time > 0
            ? Math.round(trendData.current_avg_time - trendData.previous_avg_time)
            : 0

        return NextResponse.json({
            success: true,
            totalRequests: totalScreenshots.count,
            activeKeys: activeApiKeys.count,
            successRate,
            avgProcessingTime,
            trends: {
                requests: requestsTrend,
                successRate: successRateTrend,
                responseTime: timeTrend
            },
            recentActivity: recentActivity.map(activity => ({
                    id: activity.id,
                    url: activity.url,
                    format: activity.format,
                    success: activity.success === 1,
                    created_at: activity.created_at,
                    file_size: activity.file_size || 0,
                    api_key_name: activity.api_key_name || 'Unknown',
                    username: activity.username
                }))
        })
    } catch (error) {
        console.error('Dashboard API error:', error)
        return NextResponse.json({ 
            success: false,
            error: 'Failed to load dashboard data' 
        }, { status: 500 })
    }
}