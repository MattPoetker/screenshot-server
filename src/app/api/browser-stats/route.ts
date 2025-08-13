import { NextRequest, NextResponse } from 'next/server'
import { BrowserPool } from '@/lib/browser/BrowserPool'
import queueService from '@/lib/queue/QueueService'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        // Get browser pool stats
        const browserPool = BrowserPool.getInstance()
        const browserStats = browserPool.getStats()
        
        // Get queue service health if available
        let queueHealth = null
        try {
            if (queueService.isInitialized()) {
                queueHealth = await queueService.getHealthStatus()
            }
        } catch (error) {
            console.warn('Queue service not available:', error)
        }
        
        // Get system memory info
        const memoryUsage = process.memoryUsage()
        const memoryInfo = {
            rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
            heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
            heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
            external: Math.round(memoryUsage.external / 1024 / 1024), // MB
            arrayBuffers: Math.round(memoryUsage.arrayBuffers / 1024 / 1024) // MB
        }
        
        const response = {
            success: true,
            data: {
                browserPool: {
                    ...browserStats,
                    memoryUsageMB: Math.round(browserStats.memoryUsage),
                    config: browserPool.config
                },
                system: {
                    memory: memoryInfo,
                    uptime: Math.round(process.uptime()),
                    nodeVersion: process.version,
                    platform: process.platform
                },
                queue: queueHealth && queueHealth.queue ? {
                    healthy: queueHealth.healthy,
                    stats: queueHealth.queue.stats
                } : { available: false },
                timestamp: new Date().toISOString()
            }
        }
        
        return NextResponse.json(response)
        
    } catch (error) {
        console.error('Browser stats API error:', error)
        return NextResponse.json({
            success: false,
            error: 'Failed to retrieve browser statistics',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}