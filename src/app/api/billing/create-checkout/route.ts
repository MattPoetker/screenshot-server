import { NextRequest, NextResponse } from 'next/server'
import { stripe, getPlanConfig, PlanType } from '@/lib/stripe/client'
import { authenticateAdmin } from '@/lib/auth/middleware'
import { createStripeCustomer } from '@/lib/stripe/subscriptions'
import dbManager from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!stripe) {
      return NextResponse.json({
        success: false,
        error: 'Stripe is not configured. Please set up your Stripe keys in environment variables.'
      }, { status: 503 })
    }

    // Authenticate user
    const authResult = await authenticateAdmin(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(authResult, { status: 401 })
    }

    const body = await request.json()
    const { planType, successUrl, cancelUrl } = body

    if (!planType || !['pro', 'enterprise'].includes(planType)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid plan type'
      }, { status: 400 })
    }

    const user = authResult.user
    const planConfig = getPlanConfig(planType as PlanType)

    if (!planConfig.stripePriceId) {
      return NextResponse.json({
        success: false,
        error: 'Plan not configured for billing'
      }, { status: 400 })
    }

    // Get or create Stripe customer
    let customerId = user.stripe_customer_id
    
    if (!customerId) {
      const customer = await createStripeCustomer({
        email: user.email || `${user.username}@localhost`,
        name: user.username,
        userId: user.id
      })
      customerId = customer.id
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: planConfig.stripePriceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=true`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=true`,
      metadata: {
        userId: user.id.toString(),
        planType: planType,
      },
      subscription_data: {
        metadata: {
          userId: user.id.toString(),
          planType: planType,
        },
      },
      allow_promotion_codes: true,
    })

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url
    })

  } catch (error) {
    console.error('Checkout creation error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create checkout session'
    }, { status: 500 })
  }
}