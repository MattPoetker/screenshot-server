import { NextResponse } from 'next/server'
import { BrowserPool } from '@/lib/browser/BrowserPool'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const browserPool = BrowserPool.getInstance()
        const stats = browserPool.getStats()
        
        return NextResponse.json({
            success: true,
            data: {
                ...stats,
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                nodeMemory: {
                    heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                    heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
                    external: Math.round(process.memoryUsage().external / 1024 / 1024),
                    rss: Math.round(process.memoryUsage().rss / 1024 / 1024)
                }
            }
        })
    } catch (error) {
        console.error('Browser stats API error:', error)
        return NextResponse.json(
            { 
                success: false,
                error: 'Failed to retrieve browser statistics',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}