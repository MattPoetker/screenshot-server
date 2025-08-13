import { NextRequest, NextResponse } from 'next/server'
import { stripe, getPlanConfig, PlanType } from '@/lib/stripe/client'
import { authenticateJWT } from '@/lib/auth/middleware'
import { saveSubscriptionToDatabase } from '@/lib/stripe/subscriptions'
import universalDb from '@/lib/db/universal'

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!stripe) {
      return NextResponse.json({
        success: false,
        error: 'Stripe is not configured.'
      }, { status: 503 })
    }

    // Authenticate user
    const authResult = await authenticateJWT(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(authResult, { status: 401 })
    }

    const user = authResult.user
    const { paymentMethodId, planType } = await request.json()

    if (!paymentMethodId || !planType) {
      return NextResponse.json({
        success: false,
        error: 'Payment method and plan type are required'
      }, { status: 400 })
    }

    if (!['pro', 'enterprise'].includes(planType)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid plan type'
      }, { status: 400 })
    }

    const planConfig = getPlanConfig(planType as PlanType)
    
    if (!planConfig.stripePriceId) {
      return NextResponse.json({
        success: false,
        error: 'Plan pricing not configured'
      }, { status: 400 })
    }

    // Ensure customer exists
    if (!user.stripe_customer_id) {
      return NextResponse.json({
        success: false,
        error: 'Customer account not found. Please set up payment method first.'
      }, { status: 400 })
    }

    // Attach payment method to customer (skip if already attached)
    try {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: user.stripe_customer_id,
      })
    } catch (error) {
      // If payment method is already attached, continue
      if (error && typeof error === 'object' && 'code' in error && error.code !== 'resource_already_exists') {
        throw error
      }
      console.log('Payment method already attached to customer')
    }

    // Set as default payment method
    await stripe.customers.update(user.stripe_customer_id, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    })

    // Check if user already has an active subscription
    const existingSubscription = await universalDb.get(
      'SELECT * FROM subscriptions WHERE user_id = ? AND status IN ("active", "trialing")',
      [user.id]
    )

    if (existingSubscription && existingSubscription.stripe_subscription_id) {
      // Update existing Stripe subscription
      const stripeSubscription = await stripe.subscriptions.update(
        existingSubscription.stripe_subscription_id,
        {
          items: [{
            id: (await stripe.subscriptions.retrieve(existingSubscription.stripe_subscription_id)).items.data[0].id,
            price: planConfig.stripePriceId,
          }],
          proration_behavior: 'create_prorations',
        }
      )

      // Update database
      await universalDb.run(
        `UPDATE subscriptions SET plan_type = ?, updated_at = ${universalDb.queryBuilder.getCurrentTimestamp()} WHERE id = ?`,
        [planType, existingSubscription.id]
      )

      return NextResponse.json({
        success: true,
        subscription: {
          id: stripeSubscription.id,
          status: stripeSubscription.status,
          planType: planType,
        },
        message: 'Subscription updated successfully'
      })
    } else {
      // Handle existing subscription without Stripe ID (like free plan)
      if (existingSubscription) {
        // Update the existing local subscription to the new plan
        await universalDb.run(
          `UPDATE subscriptions SET plan_type = ?, updated_at = ${universalDb.queryBuilder.getCurrentTimestamp()} WHERE id = ?`,
          [planType, existingSubscription.id]
        )
      }
      
      // Create new Stripe subscription
      const subscription = await stripe.subscriptions.create({
        customer: user.stripe_customer_id,
        items: [{ price: planConfig.stripePriceId }],
        default_payment_method: paymentMethodId,
        metadata: {
          userId: user.id.toString(),
          planType: planType,
        },
        expand: ['latest_invoice.payment_intent'],
      })

      // Save to database (update existing or create new)
      if (existingSubscription) {
        // Update existing subscription record with Stripe details
        await universalDb.run(
          `UPDATE subscriptions SET stripe_subscription_id = ?, stripe_customer_id = ?, status = ?, current_period_start = ?, current_period_end = ?, updated_at = ${universalDb.queryBuilder.getCurrentTimestamp()} WHERE id = ?`,
          [
            subscription.id,
            subscription.customer,
            subscription.status,
            new Date((subscription as any).current_period_start * 1000).toISOString(),
            new Date((subscription as any).current_period_end * 1000).toISOString(),
            existingSubscription.id
          ]
        )
        
        // No billing cycle updates needed - usage calculated directly from subscription
      } else {
        // Create completely new subscription record
        await saveSubscriptionToDatabase(subscription, user.id, planType as PlanType)
      }

      return NextResponse.json({
        success: true,
        subscription: {
          id: subscription.id,
          status: subscription.status,
          planType: planType,
        },
        message: 'Subscription created successfully'
      })
    }

  } catch (error) {
    console.error('Subscription creation error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create subscription'
    }, { status: 500 })
  }
}