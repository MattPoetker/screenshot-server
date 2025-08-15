import { NextRequest, NextResponse } from 'next/server'
import { authenticateJWT } from '@/lib/auth/middleware'
import { sendTestEmail } from '@/lib/email'
import { initializeDatabase } from '@/lib/db/init'

export async function POST(request: NextRequest) {
    try {
        console.log(`[${new Date().toISOString()}] POST /api/admin/test-email request`)
        await initializeDatabase()
        
        // Authenticate user (admin access required for testing emails)
        const authResult = await authenticateJWT(request)
        if (!authResult.success) {
            console.log(`[${new Date().toISOString()}] Authentication failed: ${authResult.error}`)
            return NextResponse.json(authResult, { status: 401 })
        }

        const { email } = await request.json()
        
        if (!email) {
            return NextResponse.json({ 
                success: false,
                error: 'Email address is required' 
            }, { status: 400 })
        }

        console.log(`[${new Date().toISOString()}] Sending test email to: ${email}`)
        
        const result = await sendTestEmail(email)
        
        console.log(`[${new Date().toISOString()}] Test email sent successfully`)
        
        return NextResponse.json({
            success: true,
            message: `Test email sent to ${email}`,
            result
        })
        
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Test email failed:`, error)
        
        let errorMessage = 'Failed to send test email'
        if (error instanceof Error) {
            errorMessage = error.message
        }
        
        return NextResponse.json({ 
            success: false,
            error: errorMessage 
        }, { status: 500 })
    }
}