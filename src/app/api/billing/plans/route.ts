import { NextRequest, NextResponse } from 'next/server'
import { STRIPE_PLANS, OVERAGE_PRICING } from '@/lib/stripe/client'
import { authenticateJWT } from '@/lib/auth/middleware'
import { getUserSubscription } from '@/lib/stripe/subscriptions'

export async function GET(request: NextRequest) {
  try {
    // Optional authentication - plans are public but subscription status requires auth
    let currentPlan = null
    
    const authResult = await authenticateJWT(request)
    if (authResult.success && authResult.user) {
      const subscription = await getUserSubscription(authResult.user.id)
      currentPlan = subscription?.plan_type || 'free'
    }

    // Convert plans to API format
    const plans = Object.entries(STRIPE_PLANS).map(([key, plan]) => ({
      id: key,
      name: plan.name,
      price: plan.price,
      priceFormatted: `$${(plan.price / 100).toFixed(2)}`,
      screenshots: plan.screenshots,
      features: getFeatures(key as keyof typeof STRIPE_PLANS),
      stripePriceId: plan.stripePriceId,
      isCurrent: currentPlan === key,
      overage: key === 'free' ? null : {
        price: OVERAGE_PRICING[key as keyof typeof OVERAGE_PRICING] || 0,
        priceFormatted: key === 'pro' 
          ? '$0.01 per screenshot' 
          : '$0.005 per screenshot'
      }
    }))

    return NextResponse.json({
      success: true,
      plans,
      currentPlan
    })

  } catch (error) {
    console.error('Plans API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch plans'
    }, { status: 500 })
  }
}

function getFeatures(planType: keyof typeof STRIPE_PLANS): string[] {
  const baseFeatures = {
    free: [
      '500 screenshots per month',
      'Basic API access',
      'PNG and JPEG formats',
      'Standard resolution up to 1920x1080',
      'Email support',
      '30-day screenshot retention'
    ],
    pro: [
      '5,000 screenshots per month',
      'All image formats (PNG, JPEG, WebP, GIF)',
      'Custom viewport dimensions',
      'Batch processing up to 10 URLs',
      'Webhook notifications',
      'Priority email support',
      '90-day screenshot retention',
      'Basic analytics dashboard',
      'Overage billing available'
    ],
    enterprise: [
      '100,000 screenshots per month',
      'All Pro features included',
      'Custom integrations',
      'Dedicated support manager',
      'SLA guarantees (99.9% uptime)',
      '1-year screenshot retention',
      'Advanced analytics & reporting',
      'White-label options available',
      'Unlimited concurrent requests',
      'Custom rate limits',
      'Lowest overage rates'
    ]
  }

  return baseFeatures[planType] || []
}