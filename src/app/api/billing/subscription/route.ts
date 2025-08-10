import { NextRequest, NextResponse } from 'next/server'
import { authenticateJWT } from '@/lib/auth/middleware'
import { getUserSubscription, cancelSubscription, reactivateSubscription } from '@/lib/stripe/subscriptions'
import dbManager from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateJWT(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(authResult, { status: 401 })
    }

    let subscription = null
    try {
      subscription = await getUserSubscription(authResult.user.id)
    } catch (error) {
      console.warn('Failed to get user subscription:', error.message)
    }
    
    if (!subscription) {
      return NextResponse.json({
        success: true,
        subscription: null
      })
    }

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        planType: subscription.plan_type,
        status: subscription.status,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end === 1,
        trialEnd: subscription.trial_end,
        stripeSubscriptionId: subscription.stripe_subscription_id,
        stripeCustomerId: subscription.stripe_customer_id
      }
    })

  } catch (error) {
    console.error('Subscription API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch subscription'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateJWT(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(authResult, { status: 401 })
    }

    const { action } = await request.json()

    const subscription = await getUserSubscription(authResult.user.id)
    if (!subscription?.stripe_subscription_id) {
      return NextResponse.json({
        success: false,
        error: 'No active subscription found'
      }, { status: 404 })
    }

    let result
    switch (action) {
      case 'cancel':
        result = await cancelSubscription(subscription.stripe_subscription_id, true)
        break
      case 'reactivate':
        result = await reactivateSubscription(subscription.stripe_subscription_id)
        break
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      subscription: {
        id: result.id,
        status: result.status,
        cancelAtPeriodEnd: result.cancel_at_period_end
      }
    })

  } catch (error) {
    console.error('Subscription action error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update subscription'
    }, { status: 500 })
  }
}