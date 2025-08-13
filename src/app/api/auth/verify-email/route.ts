import { NextRequest, NextResponse } from 'next/server'
import universalDb from '@/lib/db/universal'
import { initializeDatabase } from '@/lib/db/init'
import { sendWelcomeEmail } from '@/lib/email/postmark'
import { generateToken } from '@/lib/auth/middleware'
import { User } from '@/lib/models/User'

export async function POST(request: NextRequest) {
  try {
    // Initialize database
    await initializeDatabase()
    
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ 
        error: 'Verification token is required' 
      }, { status: 400 })
    }

    // Find user with this verification token
    const userData = await universalDb.get(`
      SELECT * FROM users 
      WHERE email_verification_token = ? 
      AND email_verification_expires > ${universalDb.queryBuilder.getNowFunction()}
    `, [token])

    if (!userData) {
      return NextResponse.json({ 
        error: 'Invalid or expired verification token' 
      }, { status: 400 })
    }

    // Mark email as verified
    await universalDb.run(`
      UPDATE users 
      SET 
        email_verified = ?,
        email_verification_token = NULL,
        email_verification_expires = NULL
      WHERE id = ?
    `, [universalDb.queryBuilder.convertBoolean(true), userData.id])

    // Send welcome email
    await sendWelcomeEmail({
      email: userData.email,
      username: userData.username
    })

    // Create session token
    const user = new User(userData)
    const authToken = generateToken(user)

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully!',
      token: authToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    })

  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json({ 
      error: 'Verification failed. Please try again.' 
    }, { status: 500 })
  }
}

// GET endpoint for verification link
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  
  if (!token) {
    return NextResponse.json({ 
      error: 'Verification token is required' 
    }, { status: 400 })
  }

  // Verify the token
  try {
    await initializeDatabase()
    
    const userData = await universalDb.get(`
      SELECT * FROM users 
      WHERE email_verification_token = ? 
      AND email_verification_expires > ${universalDb.queryBuilder.getNowFunction()}
    `, [token])

    if (!userData) {
      return NextResponse.json({ 
        error: 'Invalid or expired verification token' 
      }, { status: 400 })
    }

    return NextResponse.json({
      valid: true,
      username: userData.username
    })
  } catch (error) {
    console.error('Token validation error:', error)
    return NextResponse.json({ 
      error: 'Token validation failed' 
    }, { status: 500 })
  }
}