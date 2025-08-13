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

        const chartData = await universalDb.all(`
            SELECT 
                DATE(s.created_at) as date,
                COUNT(*) as requests,
                SUM(CASE WHEN s.success = ${universalDb.queryBuilder.convertBoolean(true)} THEN 1 ELSE 0 END) as successful,
                SUM(CASE WHEN s.success = ${universalDb.queryBuilder.convertBoolean(false)} THEN 1 ELSE 0 END) as failed,
                AVG(CASE WHEN s.success = ${universalDb.queryBuilder.convertBoolean(true)} THEN s.processing_time END) as avg_processing_time
            FROM screenshots s
            JOIN api_keys ak ON s.api_key_id = ak.id
            WHERE s.created_at >= ${universalDb.queryBuilder.getNowFunction()} - INTERVAL '${days} days'
                AND ak.user_id = ?
            GROUP BY DATE(s.created_at)
            ORDER BY date ASC
        `, [authResult.user!.id])

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