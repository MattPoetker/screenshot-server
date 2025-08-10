import { stripe, getPlanConfig, PlanType } from './client'
import dbManager from '@/lib/db'

export interface CreateCustomerParams {
  email: string
  name?: string
  userId: number
}

export interface CreateSubscriptionParams {
  customerId: string
  priceId: string
  userId: number
  planType: PlanType
}

export async function createStripeCustomer({ email, name, userId }: CreateCustomerParams) {
  try {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        userId: userId.toString(),
      },
    })

    // Update user with Stripe customer ID
    await dbManager.run(
      'UPDATE users SET stripe_customer_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [customer.id, userId]
    )

    return customer
  } catch (error) {
    console.error('Error creating Stripe customer:', error)
    throw error
  }
}

export async function createSubscription({ customerId, priceId, userId, planType }: CreateSubscriptionParams) {
  try {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        userId: userId.toString(),
        planType,
      },
    })

    // Save subscription to database
    await saveSubscriptionToDatabase(subscription, userId, planType)

    return subscription
  } catch (error) {
    console.error('Error creating subscription:', error)
    throw error
  }
}

export async function saveSubscriptionToDatabase(
  subscription: any,
  userId: number,
  planType: PlanType
) {
  try {
    const customerId = typeof subscription.customer === 'string' 
      ? subscription.customer 
      : subscription.customer.id

    await dbManager.run(`
      INSERT OR REPLACE INTO subscriptions (
        user_id,
        stripe_customer_id,
        stripe_subscription_id,
        plan_type,
        status,
        current_period_start,
        current_period_end,
        cancel_at_period_end,
        trial_end,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      userId,
      customerId,
      subscription.id,
      planType,
      subscription.status,
      new Date(subscription.current_period_start * 1000).toISOString(),
      new Date(subscription.current_period_end * 1000).toISOString(),
      subscription.cancel_at_period_end ? 1 : 0,
      subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
    ])

    // No billing cycle needed - usage calculated directly from screenshots
  } catch (error) {
    console.error('Error saving subscription to database:', error)
    throw error
  }
}

// createBillingCycle no longer needed - usage calculated directly from screenshots

export async function getUserSubscription(userId: number) {
  try {
    return await dbManager.get(`
      SELECT * FROM subscriptions 
      WHERE user_id = ? 
      AND status IN ('active', 'trialing', 'past_due')
      ORDER BY created_at DESC 
      LIMIT 1
    `, [userId])
  } catch (error) {
    console.error('Error getting user subscription:', error)
    throw error
  }
}

export async function cancelSubscription(subscriptionId: string, cancelAtPeriodEnd: boolean = true) {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: cancelAtPeriodEnd,
    })

    // Update database
    await dbManager.run(
      'UPDATE subscriptions SET cancel_at_period_end = ?, updated_at = CURRENT_TIMESTAMP WHERE stripe_subscription_id = ?',
      [cancelAtPeriodEnd ? 1 : 0, subscriptionId]
    )

    return subscription
  } catch (error) {
    console.error('Error canceling subscription:', error)
    throw error
  }
}

export async function reactivateSubscription(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    })

    // Update database
    await dbManager.run(
      'UPDATE subscriptions SET cancel_at_period_end = 0, updated_at = CURRENT_TIMESTAMP WHERE stripe_subscription_id = ?',
      [subscriptionId]
    )

    return subscription
  } catch (error) {
    console.error('Error reactivating subscription:', error)
    throw error
  }
}