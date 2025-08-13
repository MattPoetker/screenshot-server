import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { saveSubscriptionToDatabase } from '@/lib/stripe/subscriptions'
import universalDb from '@/lib/db/universal'
import Stripe from 'stripe'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')!

    let event: Stripe.Event

    try {
      if (!stripe) {
        return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
      }
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break

      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  try {
    const userId = parseInt(subscription.metadata.userId)
    const planType = subscription.metadata.planType as 'pro' | 'enterprise'

    if (!userId || !planType) {
      console.error('Missing metadata in subscription:', subscription.id)
      return
    }

    await saveSubscriptionToDatabase(subscription, userId, planType)
    console.log('Subscription created:', subscription.id)
  } catch (error) {
    console.error('Error handling subscription created:', error)
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    await universalDb.run(`
      UPDATE subscriptions SET
        status = ?,
        current_period_start = ?,
        current_period_end = ?,
        cancel_at_period_end = ?,
        updated_at = ${universalDb.queryBuilder.getCurrentTimestamp()}
      WHERE stripe_subscription_id = ?
    `, [
      subscription.status,
      new Date((subscription as any).current_period_start * 1000).toISOString(),
      new Date((subscription as any).current_period_end * 1000).toISOString(),
      universalDb.queryBuilder.convertBoolean(subscription.cancel_at_period_end),
      subscription.id
    ])

    console.log('Subscription updated:', subscription.id)
  } catch (error) {
    console.error('Error handling subscription updated:', error)
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    await universalDb.run(`
      UPDATE subscriptions SET
        status = 'canceled',
        updated_at = ${universalDb.queryBuilder.getCurrentTimestamp()}
      WHERE stripe_subscription_id = ?
    `, [subscription.id])

    console.log('Subscription canceled:', subscription.id)
  } catch (error) {
    console.error('Error handling subscription deleted:', error)
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    const subscriptionId = (invoice as any).subscription
    if (!subscriptionId) return

    // Mark billing cycle as paid
    await universalDb.run(`
      UPDATE billing_cycles SET
        status = 'paid',
        stripe_invoice_id = ?,
        updated_at = ${universalDb.queryBuilder.getCurrentTimestamp()}
      WHERE subscription_id = (
        SELECT id FROM subscriptions 
        WHERE stripe_subscription_id = ?
      )
      AND billing_period_start <= ?
      AND billing_period_end >= ?
    `, [
      invoice.id,
      subscriptionId,
      new Date(invoice.period_start * 1000).toISOString(),
      new Date(invoice.period_end * 1000).toISOString()
    ])

    console.log('Invoice payment succeeded:', invoice.id)
  } catch (error) {
    console.error('Error handling invoice payment succeeded:', error)
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  try {
    const subscriptionId = (invoice as any).subscription
    if (!subscriptionId) return

    // Update subscription status if needed
    await universalDb.run(`
      UPDATE subscriptions SET
        status = 'past_due',
        updated_at = ${universalDb.queryBuilder.getCurrentTimestamp()}
      WHERE stripe_subscription_id = ?
    `, [subscriptionId])

    console.log('Invoice payment failed:', invoice.id)
  } catch (error) {
    console.error('Error handling invoice payment failed:', error)
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    if (session.mode !== 'subscription') return

    const userId = parseInt(session.metadata?.userId || '')
    const planType = session.metadata?.planType

    if (!userId || !planType) {
      console.error('Missing metadata in checkout session:', session.id)
      return
    }

    // The subscription should already be created, but we can ensure it's properly set up
    if (session.subscription && stripe) {
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
      await saveSubscriptionToDatabase(subscription, userId, planType as 'pro' | 'enterprise')
    }

    console.log('Checkout completed:', session.id)
  } catch (error) {
    console.error('Error handling checkout completed:', error)
  }
}