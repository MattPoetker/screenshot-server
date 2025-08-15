import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import User from '@/lib/models/User'
import { initializeDatabase } from '@/lib/db/init'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function POST(request: NextRequest) {
    try {
        console.log(`[${new Date().toISOString()}] POST /api/auth - login request`)
        await initializeDatabase()
        
        const { username, password } = await request.json()
        console.log(`[${new Date().toISOString()}] Login attempt for username: ${username}`)

        if (!username || !password) {
            console.log(`[${new Date().toISOString()}] Missing username or password`)
            return NextResponse.json({ 
                success: false,
                error: 'Username and password are required' 
            }, { status: 400 })
        }

        const user = await User.authenticate(username, password)
        
        if (!user) {
            console.log(`[${new Date().toISOString()}] Authentication failed for username: ${username}`)
            return NextResponse.json({ 
                success: false,
                error: 'Invalid credentials' 
            }, { status: 401 })
        }

        console.log(`[${new Date().toISOString()}] User authenticated: ${user.username}, email_verified: ${user.email_verified}`)

        // Check if email is verified
        if (!user.email_verified) {
            console.log(`[${new Date().toISOString()}] Email not verified for user: ${username}`)
            return NextResponse.json({ 
                success: false,
                error: 'Please verify your email before logging in' 
            }, { status: 401 })
        }

        const token = jwt.sign(
            {
                userId: user.id,
                username: user.username,
                role: user.role
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        )
        
        console.log(`[${new Date().toISOString()}] Token generated for user: ${user.username}, token: ${token.substring(0, 20)}...`)
        
        return NextResponse.json({
            success: true,
            token,
            user: user.toJSON()
        })
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Login endpoint error:`, error)
        return NextResponse.json({ 
            success: false,
            error: 'Internal server error' 
        }, { status: 500 })
    }
}

export async function GET(request: NextRequest) {
    try {
        console.log(`[${new Date().toISOString()}] GET /api/auth - token verification request`)
        await initializeDatabase()
        
        const authHeader = request.headers.get('authorization')
        console.log(`[${new Date().toISOString()}] Auth header:`, authHeader ? `Bearer ${authHeader.split(' ')[1]?.substring(0, 20)}...` : 'missing')
        const token = authHeader?.split(' ')[1]

        if (!token) {
            console.log(`[${new Date().toISOString()}] No token provided`)
            return NextResponse.json({ 
                success: false,
                error: 'No token provided' 
            }, { status: 401 })
        }

        console.log(`[${new Date().toISOString()}] Verifying token: ${token.substring(0, 20)}...`)
        const decoded = jwt.verify(token, JWT_SECRET) as any
        console.log(`[${new Date().toISOString()}] Token decoded, userId: ${decoded.userId}`)
        
        const user = await User.findById(decoded.userId)
        console.log(`[${new Date().toISOString()}] User lookup result:`, user ? `found user ${user.username}` : 'user not found')

        if (!user) {
            console.log(`[${new Date().toISOString()}] User not found for userId: ${decoded.userId}`)
            return NextResponse.json({ 
                success: false,
                error: 'User not found' 
            }, { status: 404 })
        }

        console.log(`[${new Date().toISOString()}] Token verification successful for user: ${user.username}`)
        return NextResponse.json({
            success: true,
            user: user.toJSON()
        })
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Token verification error:`, error)
        return NextResponse.json({ 
            success: false,
            error: 'Invalid token' 
        }, { status: 401 })
    }
}