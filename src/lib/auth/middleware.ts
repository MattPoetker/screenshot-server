import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import User from '@/lib/models/User'
import ApiKey from '@/lib/models/ApiKey'
import dbManager from '@/lib/db'
import { initializeDatabase } from '@/lib/db/init'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export interface AuthResult {
    success: boolean
    user?: User
    error?: string
}

export interface ApiKeyAuthResult {
    success: boolean
    apiKey?: ApiKey
    error?: string
}

export async function authenticateJWT(request: NextRequest): Promise<AuthResult> {
    try {
        // Ensure database is initialized
        await initializeDatabase()
        
        const authHeader = request.headers.get('authorization')
        const token = authHeader?.split(' ')[1]

        if (!token) {
            return { success: false, error: 'No token provided' }
        }

        const decoded = jwt.verify(token, JWT_SECRET) as any
        const user = await User.findById(decoded.userId)

        if (!user || !user.is_active) {
            return { success: false, error: 'User not found or inactive' }
        }

        return { success: true, user }
    } catch (error) {
        return { success: false, error: 'Invalid token' }
    }
}

export async function authenticateAdmin(request: NextRequest): Promise<AuthResult> {
    const authResult = await authenticateJWT(request)
    
    if (!authResult.success) {
        return authResult
    }

    if (authResult.user?.role !== 'admin') {
        return { success: false, error: 'Admin access required' }
    }

    return authResult
}

export async function authenticateApiKey(request: NextRequest): Promise<ApiKeyAuthResult> {
    try {
        const authHeader = request.headers.get('authorization')
        const token = authHeader?.split(' ')[1]

        if (!token) {
            return { success: false, error: 'API key required' }
        }

        const apiKey = await ApiKey.validateKey(token)
        
        if (!apiKey) {
            return { success: false, error: 'Invalid API key' }
        }

        if (!apiKey.is_active) {
            return { success: false, error: 'API key is inactive' }
        }

        if (apiKey.isExpired()) {
            return { success: false, error: 'API key has expired' }
        }

        return { success: true, apiKey }
    } catch (error) {
        console.error('API key authentication error:', error)
        return { success: false, error: 'Authentication error' }
    }
}

export function generateToken(user: User): string {
    return jwt.sign(
        {
            userId: user.id,
            username: user.username,
            role: user.role
        },
        JWT_SECRET,
        { expiresIn: '24h' }
    )
}

export interface LoginResult {
    success: boolean
    token?: string
    user?: {
        id: number
        username: string
        role: string
    }
    error?: string
}

export async function login(username: string, password: string): Promise<LoginResult> {
    try {
        const user = await User.authenticate(username, password)
        
        if (!user) {
            return { success: false, error: 'Invalid credentials' }
        }

        const token = generateToken(user)
        
        return {
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        }
    } catch (error) {
        console.error('Login error:', error)
        return { success: false, error: 'Login failed' }
    }
}

// Rate limiting utilities (database-driven)

export async function checkRateLimit(apiKey: ApiKey): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    try {
        const windowStart = new Date()
        windowStart.setHours(windowStart.getHours() - 1) // 1-hour window

        // Count requests in the last hour from database
        const result = await dbManager.get(`
            SELECT COUNT(*) as count 
            FROM screenshots 
            WHERE api_key_id = ? AND created_at >= ?
        `, [apiKey.id, windowStart.toISOString()])

        const currentCount = result?.count || 0
        const limit = apiKey.rate_limit || 1000
        const resetTime = Date.now() + 3600000 // 1 hour from now

        if (currentCount >= limit) {
            // Rate limit exceeded
            return { allowed: false, remaining: 0, resetTime }
        }

        return { 
            allowed: true, 
            remaining: Math.max(0, limit - currentCount), 
            resetTime 
        }
    } catch (error) {
        console.error('Rate limit check error:', error)
        // On error, allow the request to continue (fail open)
        return { allowed: true, remaining: 999, resetTime: Date.now() + 3600000 }
    }
}