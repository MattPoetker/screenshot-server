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

        const formatStats = await universalDb.all(`
            SELECT 
                s.format,
                COUNT(*) as total,
                SUM(CASE WHEN s.success = ${universalDb.queryBuilder.convertBoolean(true)} THEN 1 ELSE 0 END) as successful,
                AVG(s.file_size) as avg_size,
                AVG(CASE WHEN s.success = ${universalDb.queryBuilder.convertBoolean(true)} THEN s.processing_time_ms END) as avg_time
            FROM screenshots s
            JOIN api_keys ak ON s.api_key_id = ak.id
            WHERE s.created_at >= ${universalDb.queryBuilder.getNowFunction()} - INTERVAL '${days} days'
                AND ak.user_id = ?
            GROUP BY s.format
            ORDER BY total DESC
        `, [authResult.user!.id])

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