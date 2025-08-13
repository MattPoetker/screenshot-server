import { NextRequest, NextResponse } from 'next/server'
import { initializeDatabase } from '@/lib/db/init'
import universalDb from '@/lib/db/universal'
import { checkImagesDir } from '@/lib/config/storage'

export async function GET(request: NextRequest) {
    try {
        // Initialize database first
        await initializeDatabase()
        
        // Check database health
        const dbHealthy = await universalDb.healthCheck()
        const connectionInfo = universalDb.getConnectionInfo()

        // Check if screenshots directory is writable
        const storageAccessible = checkImagesDir()

        // Get system info
        const systemInfo = {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            node_version: process.version,
            platform: process.platform,
            arch: process.arch
        }

        // Overall health status
        const healthy = dbHealthy && storageAccessible
        const status = healthy ? 200 : 503

        return NextResponse.json({
            status: healthy ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString(),
            database: {
                healthy: dbHealthy,
                dbType: universalDb.getDatabaseType(),
                ...connectionInfo
            },
            storage: {
                accessible: storageAccessible,
                status: storageAccessible ? 'ok' : 'error'
            },
            system: systemInfo,
            version: '2.0.0-nextjs-docker',
            services: {
                database: dbHealthy ? 'ok' : 'error',
                storage: storageAccessible ? 'ok' : 'error'
            }
        }, { status })

    } catch (error) {
        console.error('Health check failed:', error)
        
        return NextResponse.json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Health check failed',
            services: {
                database: 'error',
                storage: 'unknown'
            }
        }, { status: 503 })
    }
}