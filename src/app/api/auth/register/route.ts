import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import universalDb from '@/lib/db/universal'
import { initializeDatabase } from '@/lib/db/init'
import { generateVerificationToken, sendVerificationEmail } from '@/lib/email/postmark'

interface RegisterRequest {
  username: string
  email: string
  password: string
}

export async function POST(request: NextRequest) {
  try {
    // Initialize database
    await initializeDatabase()
    
    const body: RegisterRequest = await request.json()
    const { username, email, password } = body

    // Validate input
    if (!username || !email || !password) {
      return NextResponse.json({ 
        error: 'Username, email, and password are required' 
      }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ 
        error: 'Invalid email format' 
      }, { status: 400 })
    }

    // Validate username (alphanumeric and underscore only, 3-20 chars)
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
    if (!usernameRegex.test(username)) {
      return NextResponse.json({ 
        error: 'Username must be 3-20 characters and contain only letters, numbers, and underscores' 
      }, { status: 400 })
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json({ 
        error: 'Password must be at least 8 characters long' 
      }, { status: 400 })
    }

    // Check if username already exists
    const existingUsername = await universalDb.get(
      'SELECT id FROM users WHERE username = ?',
      [username.toLowerCase()]
    )
    
    if (existingUsername) {
      return NextResponse.json({ 
        error: 'Username already taken' 
      }, { status: 409 })
    }

    // Check if email already exists
    const existingEmail = await universalDb.get(
      'SELECT id FROM users WHERE email = ?',
      [email.toLowerCase()]
    )
    
    if (existingEmail) {
      return NextResponse.json({ 
        error: 'Email already registered' 
      }, { status: 409 })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Generate verification token
    const verificationToken = generateVerificationToken()
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Create user
    const result = await universalDb.run(`
      INSERT INTO users (
        username, 
        email, 
        password_hash, 
        role, 
        is_active,
        email_verified,
        email_verification_token,
        email_verification_expires
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      username.toLowerCase(),
      email.toLowerCase(),
      passwordHash,
      'user',
      universalDb.queryBuilder.convertBoolean(true), // Active but not verified
      universalDb.queryBuilder.convertBoolean(false), // Not verified
      verificationToken,
      verificationExpires.toISOString()
    ])

    // Send verification email
    await sendVerificationEmail({
      email,
      username,
      verificationToken
    })

    return NextResponse.json({
      success: true,
      message: 'Registration successful! Please check your email to verify your account.',
      userId: result.id
    }, { status: 201 })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ 
      error: 'Registration failed. Please try again.' 
    }, { status: 500 })
  }
}