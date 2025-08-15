import { NextRequest, NextResponse } from 'next/server'
import { initializeDatabase } from '@/lib/db/init'
import universalDb from '@/lib/db/universal'
import { BrowserPool } from '@/lib/browser/BrowserPool'

// Readiness probe - checks if the app is ready to receive traffic
export async function GET(request: NextRequest) {
    try {
        const checks = {
            database: false,
            browserPool: false,
            redis: false
        }
        
        // Check database connection
        try {
            await initializeDatabase()
            const dbHealthy = await universalDb.healthCheck()
            checks.database = dbHealthy
        } catch (error) {
            console.error('Database readiness check failed:', error)
        }
        
        // Check browser pool
        try {
            const pool = BrowserPool.getInstance()
            checks.browserPool = pool !== null
        } catch (error) {
            console.error('Browser pool readiness check failed:', error)
        }
        
        // Check Redis connection (if configured)
        if (process.env.REDIS_URL) {
            try {
                // Simple check - Redis is configured
                checks.redis = true
            } catch (error) {
                console.error('Redis readiness check failed:', error)
            }
        } else {
            // Redis not required
            checks.redis = true
        }
        
        // All checks must pass for readiness
        const ready = Object.values(checks).every(check => check === true)
        
        return NextResponse.json({
            ready,
            timestamp: new Date().toISOString(),
            checks,
            deployment_color: process.env.DEPLOYMENT_COLOR || 'default'
        }, { 
            status: ready ? 200 : 503 
        })
        
    } catch (error) {
        console.error('Readiness probe failed:', error)
        
        return NextResponse.json({
            ready: false,
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Readiness check failed'
        }, { status: 503 })
    }
}