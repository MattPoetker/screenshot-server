import { NextRequest, NextResponse } from 'next/server'
import { authenticateJWT } from '@/lib/auth/middleware'
import { initializeDatabase } from '@/lib/db/init'

export async function POST(request: NextRequest) {
    try {
        await initializeDatabase()
        
        // Authenticate JWT token
        const authResult = await authenticateJWT(request)
        if (!authResult.success) {
            return NextResponse.json(authResult, { status: 401 })
        }

        // In a more sophisticated setup, you might want to blacklist the token
        // For now, we'll just return success and let the client handle token removal
        return NextResponse.json({ 
            success: true,
            message: 'Logged out successfully' 
        })
    } catch (error) {
        console.error('Logout endpoint error:', error)
        return NextResponse.json({ 
            success: false,
            error: 'Logout failed' 
        }, { status: 500 })
    }
}