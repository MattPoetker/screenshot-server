import { NextRequest, NextResponse } from 'next/server'
import { authenticateJWT } from '@/lib/auth/middleware'
import { initializeDatabase } from '@/lib/db/init'

export async function GET(request: NextRequest) {
    try {
        await initializeDatabase()
        
        // Authenticate JWT token
        const authResult = await authenticateJWT(request)
        if (!authResult.success) {
            return NextResponse.json(authResult, { status: 401 })
        }

        return NextResponse.json({
            success: true,
            user: {
                id: authResult.user!.id,
                username: authResult.user!.username,
                role: authResult.user!.role,
                is_active: authResult.user!.is_active,
                created_at: authResult.user!.created_at
            }
        })
    } catch (error) {
        console.error('Get user info error:', error)
        return NextResponse.json({ 
            success: false,
            error: 'Failed to get user information' 
        }, { status: 500 })
    }
}