import { NextRequest, NextResponse } from 'next/server'
import { initializeDatabase } from '@/lib/db/init'
import universalDb from '@/lib/db/universal'
import User from '@/lib/models/User'

export async function GET(request: NextRequest) {
    try {
        await initializeDatabase()
        
        // Test database connectivity and find admin user
        const user = await User.findByUsername('admin')
        
        // Test write permissions
        let writeTest = false
        try {
            if (user) {
                await universalDb.run(`UPDATE users SET last_login = ${universalDb.queryBuilder.getCurrentTimestamp()} WHERE id = ?`, [user.id])
                writeTest = true
            }
        } catch (writeError: any) {
            console.log('Write test failed:', writeError.message)
        }
        
        return NextResponse.json({ 
            success: true,
            message: 'Auth system is healthy',
            timestamp: new Date().toISOString(),
            database: {
                connected: true,
                adminUserExists: !!user,
                adminUserId: user ? user.id : null,
                writePermissions: writeTest
            }
        })
    } catch (error: any) {
        return NextResponse.json({ 
            success: false,
            message: 'Database connection issue',
            error: error.message,
            timestamp: new Date().toISOString()
        })
    }
}