import { stripe, getPlanConfig, PlanType } from './client'
import universalDb from '@/lib/db/universal'

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
    if (!stripe) {
      throw new Error('Stripe client not initialized')
    }
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        userId: userId.toString(),
      },
    })

    // Update user with Stripe customer ID
    await universalDb.run(
      `UPDATE users SET stripe_customer_id = ?, updated_at = ${universalDb.queryBuilder.getCurrentTimestamp()} WHERE id = ?`,
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
    if (!stripe) {
      throw new Error('Stripe client not initialized')
    }
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

    // Use UPSERT syntax that works for both SQLite and PostgreSQL
    await universalDb.run(`
      INSERT INTO subscriptions (
        user_id,
        stripe_customer_id,
        stripe_subscription_id,
        plan_id,
        status,
        current_period_start,
        current_period_end,
        cancel_at_period_end,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ${universalDb.queryBuilder.getCurrentTimestamp()})
      ON CONFLICT (stripe_subscription_id) DO UPDATE SET
        stripe_customer_id = excluded.stripe_customer_id,
        plan_id = excluded.plan_id,
        status = excluded.status,
        current_period_start = excluded.current_period_start,
        current_period_end = excluded.current_period_end,
        cancel_at_period_end = excluded.cancel_at_period_end,
        updated_at = excluded.updated_at
    `, [
      userId,
      customerId,
      subscription.id,
      planType,
      subscription.status,
      new Date(subscription.current_period_start * 1000).toISOString(),
      new Date(subscription.current_period_end * 1000).toISOString(),
      universalDb.queryBuilder.convertBoolean(subscription.cancel_at_period_end),
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
    return await universalDb.get(`
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
    if (!stripe) {
      throw new Error('Stripe client not initialized')
    }
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: cancelAtPeriodEnd,
    })

    // Update database
    await universalDb.run(
      `UPDATE subscriptions SET cancel_at_period_end = ?, updated_at = ${universalDb.queryBuilder.getCurrentTimestamp()} WHERE stripe_subscription_id = ?`,
      [universalDb.queryBuilder.convertBoolean(cancelAtPeriodEnd), subscriptionId]
    )

    return subscription
  } catch (error) {
    console.error('Error canceling subscription:', error)
    throw error
  }
}

export async function reactivateSubscription(subscriptionId: string) {
  try {
    if (!stripe) {
      throw new Error('Stripe client not initialized')
    }
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    })

    // Update database
    await universalDb.run(
      `UPDATE subscriptions SET cancel_at_period_end = ${universalDb.queryBuilder.convertBoolean(false)}, updated_at = ${universalDb.queryBuilder.getCurrentTimestamp()} WHERE stripe_subscription_id = ?`,
      [subscriptionId]
    )

    return subscription
  } catch (error) {
    console.error('Error reactivating subscription:', error)
    throw error
  }
}