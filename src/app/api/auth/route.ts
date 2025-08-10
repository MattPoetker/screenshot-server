import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import User from '@/lib/models/User'
import { initializeDatabase } from '@/lib/db/init'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

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

        const user = await User.authenticate(username, password)
        
        if (!user) {
            return NextResponse.json({ 
                success: false,
                error: 'Invalid credentials' 
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
        
        return NextResponse.json({
            success: true,
            token,
            user: user.toJSON()
        })
    } catch (error) {
        console.error('Login endpoint error:', error)
        return NextResponse.json({ 
            success: false,
            error: 'Internal server error' 
        }, { status: 500 })
    }
}

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')
        const token = authHeader?.split(' ')[1]

        if (!token) {
            return NextResponse.json({ 
                success: false,
                error: 'No token provided' 
            }, { status: 401 })
        }

        const decoded = jwt.verify(token, JWT_SECRET) as any
        const user = await User.findById(decoded.userId)

        if (!user) {
            return NextResponse.json({ 
                success: false,
                error: 'User not found' 
            }, { status: 404 })
        }

        return NextResponse.json({
            success: true,
            user: user.toJSON()
        })
    } catch (error) {
        return NextResponse.json({ 
            success: false,
            error: 'Invalid token' 
        }, { status: 401 })
    }
}