import { NextRequest, NextResponse } from 'next/server'
import { initializeDatabase } from '@/lib/db/init'
import universalDb from '@/lib/db/universal'
import Screenshot from '@/lib/models/Screenshot'
import { authenticateJWT } from '@/lib/auth/middleware'

export const dynamic = 'force-dynamic'

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await initializeDatabase()
        
        // Authenticate user
        const authResult = await authenticateJWT(request)
        if (!authResult.success) {
            return NextResponse.json(authResult, { status: 401 })
        }

        const screenshotId = parseInt(params.id)
        if (isNaN(screenshotId)) {
            return NextResponse.json({ 
                success: false,
                error: 'Invalid screenshot ID' 
            }, { status: 400 })
        }

        // Verify screenshot belongs to user before deleting
        const screenshot = await Screenshot.findById(screenshotId)
        if (!screenshot) {
            return NextResponse.json({ 
                success: false,
                error: 'Screenshot not found' 
            }, { status: 404 })
        }

        // Check if screenshot belongs to user's API key
        const apiKeyCheck = await universalDb.get(
            'SELECT id FROM api_keys WHERE id = ? AND user_id = ?',
            [screenshot.api_key_id, authResult.user!.id]
        )
        
        if (!apiKeyCheck) {
            return NextResponse.json({ 
                success: false,
                error: 'Screenshot not found' 
            }, { status: 404 })
        }

        const deleted = await Screenshot.delete(screenshotId)
        
        if (!deleted) {
            return NextResponse.json({ 
                success: false,
                error: 'Screenshot not found' 
            }, { status: 404 })
        }

        return NextResponse.json({
            success: true,
            data: {
                message: 'Screenshot deleted successfully'
            }
        })
    } catch (error) {
        console.error('Screenshot deletion error:', error)
        return NextResponse.json({ 
            success: false,
            error: 'Failed to delete screenshot' 
        }, { status: 500 })
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await initializeDatabase()
        
        // Authenticate user
        const authResult = await authenticateJWT(request)
        if (!authResult.success) {
            return NextResponse.json(authResult, { status: 401 })
        }

        const screenshotId = parseInt(params.id)
        if (isNaN(screenshotId)) {
            return NextResponse.json({ 
                success: false,
                error: 'Invalid screenshot ID' 
            }, { status: 400 })
        }

        const screenshot = await Screenshot.findById(screenshotId)
        
        if (!screenshot) {
            return NextResponse.json({ 
                success: false,
                error: 'Screenshot not found' 
            }, { status: 404 })
        }

        // Check if screenshot belongs to user's API key
        const apiKeyCheck = await universalDb.get(
            'SELECT id FROM api_keys WHERE id = ? AND user_id = ?',
            [screenshot.api_key_id, authResult.user!.id]
        )
        
        if (!apiKeyCheck) {
            return NextResponse.json({ 
                success: false,
                error: 'Screenshot not found' 
            }, { status: 404 })
        }

        return NextResponse.json({
            success: true,
            data: screenshot
        })
    } catch (error) {
        console.error('Screenshot fetch error:', error)
        return NextResponse.json({ 
            success: false,
            error: 'Failed to fetch screenshot' 
        }, { status: 500 })
    }
}