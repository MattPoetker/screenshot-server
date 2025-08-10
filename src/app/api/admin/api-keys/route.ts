import { NextRequest, NextResponse } from 'next/server'
import { initializeDatabase } from '@/lib/db/init'
import ApiKey from '@/lib/models/ApiKey'
import { authenticateAdmin } from '@/lib/auth/middleware'

export async function GET(request: NextRequest) {
    try {
        await initializeDatabase()
        
        // Authenticate admin user
        const authResult = await authenticateAdmin(request)
        if (!authResult.success) {
            return NextResponse.json(authResult, { status: 401 })
        }

        const keys = await ApiKey.findAll()
        
        // Add usage stats for each key
        const keysWithStats = await Promise.all(keys.map(async (key) => {
            const usage = await key.getTotalUsage()
            return {
                ...key.toJSON(),
                usage
            }
        }))

        return NextResponse.json({
            success: true,
            apiKeys: keysWithStats
        })
    } catch (error) {
        console.error('API Keys GET error:', error)
        return NextResponse.json({ 
            success: false,
            error: 'Failed to load API keys' 
        }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        await initializeDatabase()
        
        // Authenticate admin user
        const authResult = await authenticateAdmin(request)
        if (!authResult.success) {
            return NextResponse.json(authResult, { status: 401 })
        }

        const { name, description, rate_limit, expires_at } = await request.json()

        if (!name || !name.trim()) {
            return NextResponse.json({ 
                success: false,
                error: 'API key name is required' 
            }, { status: 400 })
        }

        const newKey = await ApiKey.create({
            name: name.trim(),
            description: description?.trim() || undefined,
            rate_limit: rate_limit || 1000,
            expires_at: expires_at || undefined,
            created_by: authResult.user!.id
        })

        return NextResponse.json({
            success: true,
            apiKey: newKey  // newKey is already in the correct format from the model
        })
    } catch (error) {
        console.error('API Keys POST error:', error)
        return NextResponse.json({ 
            success: false,
            error: 'Failed to create API key' 
        }, { status: 500 })
    }
}