import dbManager from '@/lib/db'
import { getPlanConfig, calculateOverageAmount, PlanType } from './client'

// Usage tracking is now handled by direct queries to screenshots table
// This function is kept for API compatibility but does nothing
export interface UsageTrackingParams {
  userId: number
  apiKeyId: number
  screenshotCount?: number
}

export async function trackScreenshotUsage({ 
  userId, 
  apiKeyId, 
  screenshotCount = 1 
}: UsageTrackingParams) {
  // No-op: Usage is now tracked by direct screenshot queries
  // Screenshots are automatically tracked when saved to database
}

export async function getCurrentSubscription(userId: number) {
  try {
    const now = new Date().toISOString()
    
    return await dbManager.get(`
      SELECT * 
      FROM subscriptions 
      WHERE user_id = ? 
        AND status IN ('active', 'trialing', 'past_due')
        AND current_period_start <= ? 
        AND current_period_end >= ?
      ORDER BY created_at DESC
      LIMIT 1
    `, [userId, now, now])
  } catch (error) {
    console.error('Error getting current subscription:', error)
    return null
  }
}

// No longer needed - usage is calculated directly from screenshots table

export async function getActualUsageForPeriod(
  userId: number,
  periodStart: string,
  periodEnd: string
): Promise<number> {
  try {
    const result = await dbManager.get(`
      SELECT COUNT(*) as count
      FROM screenshots s
      JOIN api_keys ak ON s.api_key_id = ak.id
      WHERE ak.created_by = ?
        AND s.created_at >= ?
        AND s.created_at < ?
        AND s.success = 1
    `, [userId, periodStart, periodEnd])
    
    return result?.count || 0
  } catch (error) {
    console.error('Error getting actual usage for period:', error)
    return 0
  }
}

export async function getCurrentUsageForUser(userId: number): Promise<number> {
  try {
    const subscription = await getCurrentSubscription(userId)
    if (!subscription) {
      return 0
    }
    
    return await getActualUsageForPeriod(
      userId,
      subscription.current_period_start,
      subscription.current_period_end
    )
  } catch (error) {
    console.error('Error getting current usage for user:', error)
    return 0
  }
}

export async function checkUsageLimit(userId: number): Promise<{
  allowed: boolean
  usage: {
    used: number
    included: number
    overage: number
    remaining: number
  }
}> {
  try {
    let subscription = await getCurrentSubscription(userId)
    
    if (!subscription) {
      // Create a free tier subscription for new users
      console.log('No subscription found for user', userId, 'creating free tier subscription')
      try {
        await createFreeTierSubscription(userId)
        subscription = await getCurrentSubscription(userId)
      } catch (error) {
        console.error('Failed to create free tier subscription:', error)
        // Fallback to default free tier limits without database record
        return {
          allowed: true,
          usage: {
            used: 0,
            included: 500,
            overage: 0,
            remaining: 500
          }
        }
      }
    }

    if (!subscription) {
      // Still no subscription, use defaults
      return {
        allowed: true,
        usage: {
          used: 0,
          included: 500,
          overage: 0,
          remaining: 500
        }
      }
    }

    // Get plan config to determine included screenshots
    const planConfig = getPlanConfig(subscription.plan_type as PlanType)
    
    // Get actual usage from screenshots table
    const actualUsed = await getActualUsageForPeriod(
      userId,
      subscription.current_period_start,
      subscription.current_period_end
    )
    
    const included = planConfig.screenshots
    const overage = Math.max(0, actualUsed - included)
    const remaining = Math.max(0, included - actualUsed)
    const planType = subscription.plan_type
    
    // For free tier, enforce hard limits; for paid plans, allow overages
    const allowed = planType === 'free' ? remaining > 0 : true
    
    return {
      allowed,
      usage: {
        used: actualUsed,
        included,
        overage,
        remaining
      }
    }
  } catch (error) {
    console.error('Error checking usage limit:', error)
    return {
      allowed: false,
      usage: {
        used: 0,
        included: 0,
        overage: 0,
        remaining: 0
      }
    }
  }
}

export async function getUserUsageStats(userId: number, days: number = 30) {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    return await dbManager.all(`
      SELECT 
        DATE(s.created_at) as date,
        COUNT(*) as screenshots_count
      FROM screenshots s
      JOIN api_keys ak ON s.api_key_id = ak.id
      WHERE ak.created_by = ? 
        AND s.created_at >= ?
        AND s.success = 1
      GROUP BY DATE(s.created_at)
      ORDER BY date ASC
    `, [userId, startDate.toISOString()])
  } catch (error) {
    console.error('Error getting user usage stats:', error)
    return []
  }
}

export async function createFreeTierSubscription(userId: number) {
  try {
    // Create a free subscription record
    const result = await dbManager.run(`
      INSERT INTO subscriptions (
        user_id,
        plan_type,
        status,
        current_period_start,
        current_period_end,
        cancel_at_period_end
      ) VALUES (?, 'free', 'active', ?, ?, 0)
    `, [
      userId,
      new Date().toISOString(),
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
    ])

    if (!result.id) {
      throw new Error('Failed to create subscription record')
    }

    return result.id
  } catch (error) {
    console.error('Error creating free tier subscription:', error)
    throw error
  }
}