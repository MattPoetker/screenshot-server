import { NextRequest, NextResponse } from 'next/server'
import { login } from '@/lib/auth/middleware'
import { initializeDatabase } from '@/lib/db/init'

export async function POST(request: NextRequest) {
    try {
        await initializeDatabase()
        
        const { username, password } = await request.json()

        if (!username || !password) {
            return NextResponse.json({ 
                success: false,
                error: 'Username and password are required' 
            }, { status: 400 })
        }

        const result = await login(username, password)
        
        if (result.success) {
            return NextResponse.json(result)
        } else {
            return NextResponse.json(result, { status: 401 })
        }
    } catch (error) {
        console.error('Login endpoint error:', error)
        return NextResponse.json({ 
            success: false,
            error: 'Internal server error' 
        }, { status: 500 })
    }
}