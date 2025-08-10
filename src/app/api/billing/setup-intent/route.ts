import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { authenticateJWT } from '@/lib/auth/middleware'
import dbManager from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!stripe) {
      return NextResponse.json({
        success: false,
        error: 'Stripe is not configured. Please set up your Stripe keys.'
      }, { status: 503 })
    }

    // Authenticate user
    const authResult = await authenticateJWT(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(authResult, { status: 401 })
    }

    const user = authResult.user

    // Get or create Stripe customer
    let customerId = user.stripe_customer_id

    if (!customerId) {
      // Create a new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email && user.email.includes('@') && !user.email.includes('@localhost') 
          ? user.email 
          : `${user.username}@example.com`,
        name: user.username,
        metadata: {
          userId: user.id.toString(),
        },
      })

      customerId = customer.id

      // Save customer ID to database
      await dbManager.run(
        'UPDATE users SET stripe_customer_id = ? WHERE id = ?',
        [customerId, user.id]
      )
    }

    // Create a Setup Intent for collecting payment method
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      usage: 'off_session', // For recurring payments
      metadata: {
        userId: user.id.toString(),
      },
    })

    return NextResponse.json({
      success: true,
      clientSecret: setupIntent.client_secret,
      customerId: customerId,
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    })

  } catch (error) {
    console.error('Setup Intent creation error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create setup intent'
    }, { status: 500 })
  }
}