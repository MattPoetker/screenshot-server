import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { authenticateJWT } from '@/lib/auth/middleware'

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
    const authResult = await authenticateJWT(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(authResult, { status: 401 })
    }

    const user = authResult.user
    const body = await request.json()
    const { returnUrl } = body

    if (!user.stripe_customer_id) {
      return NextResponse.json({
        success: false,
        error: 'No billing account found'
      }, { status: 400 })
    }

    // Create customer portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
    })

    return NextResponse.json({
      success: true,
      url: portalSession.url
    })

  } catch (error) {
    console.error('Portal creation error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create portal session'
    }, { status: 500 })
  }
}