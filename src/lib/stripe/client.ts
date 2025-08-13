import Stripe from 'stripe'

// For development mode, use a placeholder if no key is provided
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder_for_development'

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('STRIPE_SECRET_KEY not found - running in development mode with limited functionality')
}

export const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia' as Stripe.LatestApiVersion,
      typescript: true,
    })
  : null

// Plan configurations matching our pricing
export const STRIPE_PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    screenshots: 500,
    stripeProductId: null, // Free tier doesn't need Stripe product
    stripePriceId: null,
  },
  pro: {
    id: 'pro', 
    name: 'Pro',
    price: 2900, // $29.00 in cents
    screenshots: 5000,
    stripeProductId: process.env.STRIPE_PRO_PRODUCT_ID,
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID,
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise', 
    price: 9900, // $99.00 in cents
    screenshots: 100000,
    stripeProductId: process.env.STRIPE_ENTERPRISE_PRODUCT_ID,
    stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
  }
} as const

export type PlanType = keyof typeof STRIPE_PLANS

// Overage pricing per screenshot in cents
export const OVERAGE_PRICING = {
  pro: 1, // $0.01 per screenshot
  enterprise: 0.5, // $0.005 per screenshot (0.5 cents)
} as const

export function getPlanConfig(planType: PlanType) {
  return STRIPE_PLANS[planType]
}

export function getOveragePrice(planType: PlanType): number {
  if (planType === 'free') return 0
  return OVERAGE_PRICING[planType as keyof typeof OVERAGE_PRICING] || 0
}

export function calculateOverageAmount(planType: PlanType, overageCount: number): number {
  const pricePerScreenshot = getOveragePrice(planType)
  return Math.round(overageCount * pricePerScreenshot)
}