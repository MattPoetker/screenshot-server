import { NextRequest, NextResponse } from 'next/server'
import { initializeDatabase } from '@/lib/db/init'
import dbManager from '@/lib/db'
import { checkImagesDir } from '@/lib/config/storage'

export async function GET(request: NextRequest) {
    try {
        await initializeDatabase()
        
        // Test database connectivity
        const result = await dbManager.get('SELECT 1 as test')
        
        // Check if screenshots directory is writable
        const storageAccessible = checkImagesDir()
        
        return NextResponse.json({
            status: 'up',
            timestamp: new Date().toISOString(),
            database: {
                connected: !!result,
                test: result?.test === 1
            },
            storage: storageAccessible ? 'accessible' : 'inaccessible',
            version: '2.0.0-nextjs'
        })
    } catch (error) {
        return NextResponse.json({
            status: 'error',
            timestamp: new Date().toISOString(),
            database: {
                connected: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            }
        }, { status: 500 })
    }
}