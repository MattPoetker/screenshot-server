import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import User from '@/lib/models/User'
import ApiKey from '@/lib/models/ApiKey'
import universalDb from '@/lib/db/universal'
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
        console.log(`[${new Date().toISOString()}] AuthMiddleware: Authenticating JWT request`)
        // Ensure database is initialized
        await initializeDatabase()
        
        const authHeader = request.headers.get('authorization')
        console.log(`[${new Date().toISOString()}] AuthMiddleware: Auth header:`, authHeader ? `Bearer ${authHeader.split(' ')[1]?.substring(0, 20)}...` : 'missing')
        const token = authHeader?.split(' ')[1]

        if (!token) {
            console.log(`[${new Date().toISOString()}] AuthMiddleware: No token provided`)
            return { success: false, error: 'No token provided' }
        }

        console.log(`[${new Date().toISOString()}] AuthMiddleware: Verifying token: ${token.substring(0, 20)}...`)
        const decoded = jwt.verify(token, JWT_SECRET) as any
        console.log(`[${new Date().toISOString()}] AuthMiddleware: Token decoded, userId: ${decoded.userId}`)
        
        const user = await User.findById(decoded.userId)
        console.log(`[${new Date().toISOString()}] AuthMiddleware: User lookup result:`, user ? `found user ${user.username}` : 'user not found')

        if (!user || !user.is_active) {
            console.log(`[${new Date().toISOString()}] AuthMiddleware: User not found or inactive`)
            return { success: false, error: 'User not found or inactive' }
        }

        console.log(`[${new Date().toISOString()}] AuthMiddleware: Authentication successful for user: ${user.username}`)
        return { success: true, user }
    } catch (error) {
        console.log(`[${new Date().toISOString()}] AuthMiddleware: JWT verification failed:`, error)
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
        // Check for X-API-Key header first (preferred), then Authorization header
        let token: string | null = request.headers.get('x-api-key')
        
        if (!token) {
            const authHeader = request.headers.get('authorization')
            token = authHeader?.split(' ')[1] || null
        }

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
        console.log(`[${new Date().toISOString()}] AuthMiddleware: Login attempt for username: ${username}`)
        const user = await User.authenticate(username, password)
        
        if (!user) {
            console.log(`[${new Date().toISOString()}] AuthMiddleware: Authentication failed for username: ${username}`)
            return { success: false, error: 'Invalid credentials' }
        }

        console.log(`[${new Date().toISOString()}] AuthMiddleware: User authenticated: ${user.username}, email_verified: ${user.email_verified}`)

        // Check if email is verified
        if (!user.email_verified) {
            console.log(`[${new Date().toISOString()}] AuthMiddleware: Email not verified for user: ${username}`)
            return { success: false, error: 'Please verify your email before logging in' }
        }

        const token = generateToken(user)
        console.log(`[${new Date().toISOString()}] AuthMiddleware: Token generated for user: ${user.username}, token: ${token.substring(0, 20)}...`)
        
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
        console.error(`[${new Date().toISOString()}] AuthMiddleware: Login error:`, error)
        return { success: false, error: 'Login failed' }
    }
}

// Rate limiting utilities (database-driven)

export async function checkRateLimit(apiKey: ApiKey): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    try {
        const windowStart = new Date()
        windowStart.setHours(windowStart.getHours() - 1) // 1-hour window

        // Count requests in the last hour from database
        const result = await universalDb.get(`
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