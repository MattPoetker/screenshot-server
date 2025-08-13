import { NextRequest, NextResponse } from 'next/server'
import { initializeDatabase } from '@/lib/db/init'
import ApiKey from '@/lib/models/ApiKey'
import { authenticateJWT } from '@/lib/auth/middleware'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        await initializeDatabase()
        
        // Authenticate user
        const authResult = await authenticateJWT(request)
        if (!authResult.success) {
            return NextResponse.json(authResult, { status: 401 })
        }

        const keyId = parseInt(params.id)
        const updates = await request.json()

        // Remove fields that shouldn't be updated directly
        const allowedUpdates = ['name', 'description', 'rate_limit', 'expires_at']
        const filteredUpdates = Object.keys(updates)
            .filter(key => allowedUpdates.includes(key))
            .reduce((obj, key) => {
                (obj as any)[key] = updates[key]
                return obj
            }, {})

        const apiKey = await ApiKey.findById(keyId)
        if (!apiKey) {
            return NextResponse.json({ 
                success: false,
                error: 'API key not found' 
            }, { status: 404 })
        }

        // Verify API key belongs to the authenticated user
        if (apiKey.created_by !== authResult.user!.id) {
            return NextResponse.json({ 
                success: false,
                error: 'API key not found' 
            }, { status: 404 })
        }

        await apiKey.update(filteredUpdates)

        return NextResponse.json({
            success: true,
            data: apiKey.toJSON()
        })
    } catch (error) {
        console.error('API Keys PUT error:', error)
        return NextResponse.json({ 
            success: false,
            error: 'Failed to update API key' 
        }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        await initializeDatabase()
        
        // Authenticate user
        const authResult = await authenticateJWT(request)
        if (!authResult.success) {
            return NextResponse.json(authResult, { status: 401 })
        }

        const keyId = parseInt(params.id)
        
        // Verify API key belongs to the authenticated user before deleting
        const apiKey = await ApiKey.findById(keyId)
        if (!apiKey || apiKey.created_by !== authResult.user!.id) {
            return NextResponse.json({ 
                success: false,
                error: 'API key not found' 
            }, { status: 404 })
        }
        
        const deleted = await ApiKey.delete(keyId)
        
        if (!deleted) {
            return NextResponse.json({ 
                success: false,
                error: 'API key not found' 
            }, { status: 404 })
        }

        return NextResponse.json({
            success: true,
            message: 'API key deleted successfully'
        })
    } catch (error) {
        console.error('API Keys DELETE error:', error)
        return NextResponse.json({ 
            success: false,
            error: 'Failed to delete API key' 
        }, { status: 500 })
    }
}