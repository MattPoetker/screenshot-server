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

        const chartData = await dbManager.all(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as requests,
                SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful,
                SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed,
                AVG(CASE WHEN success = 1 THEN processing_time END) as avg_processing_time
            FROM screenshots 
            WHERE created_at >= datetime('now', '-${days} days')
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `)

        return NextResponse.json({
            success: true,
            data: chartData.map(row => ({
                date: row.date,
                requests: row.requests,
                successful: row.successful,
                failed: row.failed,
                avgProcessingTime: Math.round(row.avg_processing_time || 0)
            }))
        })
    } catch (error) {
        console.error('Usage chart API error:', error)
        return NextResponse.json({ 
            success: false,
            error: 'Failed to load usage chart data' 
        }, { status: 500 })
    }
}