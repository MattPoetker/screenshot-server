import { NextRequest, NextResponse } from 'next/server'
import { authenticateJWT } from '@/lib/auth/middleware'
import { getCurrentSubscription, getUserUsageStats, checkUsageLimit, getActualUsageForPeriod } from '@/lib/stripe/usage'
import { getPlanConfig, calculateOverageAmount } from '@/lib/stripe/client'

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateJWT(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(authResult, { status: 401 })
    }

    const { searchParams } = request.nextUrl
    const userId = authResult.user.id
    const days = parseInt(searchParams.get('days') || '30')

    // Get current subscription
    const subscription = await getCurrentSubscription(userId)
    
    // Get usage limit check
    const limitCheck = await checkUsageLimit(userId)
    
    // Get usage stats
    const usageStats = await getUserUsageStats(userId, days)

    // Calculate billing info from subscription
    let billingCycle = null
    if (subscription) {
      const planConfig = getPlanConfig(subscription.plan_type)
      const actualUsed = await getActualUsageForPeriod(
        userId,
        subscription.current_period_start,
        subscription.current_period_end
      )
      const overageCount = Math.max(0, actualUsed - planConfig.screenshots)
      const overageAmount = calculateOverageAmount(subscription.plan_type, overageCount)
      
      billingCycle = {
        id: subscription.id,
        planType: subscription.plan_type,
        includedScreenshots: planConfig.screenshots,
        usedScreenshots: actualUsed,
        overageScreenshots: overageCount,
        baseAmount: planConfig.price,
        overageAmount,
        totalAmount: planConfig.price + overageAmount,
        billingPeriodStart: subscription.current_period_start,
        billingPeriodEnd: subscription.current_period_end,
        status: 'active'
      }
    }

    return NextResponse.json({
      success: true,
      billingCycle,
      usage: limitCheck.usage,
      usageStats: usageStats.map(stat => ({
        date: stat.date,
        count: stat.screenshots_count
      }))
    })

  } catch (error) {
    console.error('Usage API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch usage data'
    }, { status: 500 })
  }
}