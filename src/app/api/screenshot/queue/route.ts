import { NextRequest, NextResponse } from 'next/server'
import { initializeDatabase } from '@/lib/db/init'
import { authenticateApiKey, checkRateLimit } from '@/lib/auth/middleware'
import { checkUsageLimit } from '@/lib/stripe/usage'
import { getScreenshotQueue, ScreenshotJobData } from '@/lib/queue/ScreenshotQueue'
import queueService from '@/lib/queue/QueueService'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
    const startTime = Date.now()

    try {
        await initializeDatabase()
        
        // Initialize queue service if not already done
        await queueService.initialize()
        
        // Authenticate API key
        const authResult = await authenticateApiKey(request)
        if (!authResult.success) {
            return NextResponse.json({ 
                error: authResult.error 
            }, { status: 401 })
        }

        const apiKey = authResult.apiKey!

        // Check rate limits
        const rateLimitResult = await checkRateLimit(apiKey)
        if (!rateLimitResult.allowed) {
            return NextResponse.json({ 
                error: 'Rate limit exceeded',
                details: 'Too many requests. Please try again later.',
                rateLimit: {
                    limit: apiKey.rate_limit,
                    remaining: rateLimitResult.remaining,
                    resetTime: new Date(rateLimitResult.resetTime).toISOString()
                }
            }, { 
                status: 429,
                headers: {
                    'X-RateLimit-Limit': apiKey.rate_limit.toString(),
                    'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
                    'X-RateLimit-Reset': Math.floor(rateLimitResult.resetTime / 1000).toString()
                }
            })
        }

        // Check usage limits
        const usageLimitResult = await checkUsageLimit(apiKey.created_by)
        if (!usageLimitResult.allowed) {
            return NextResponse.json({ 
                error: 'Usage limit exceeded',
                details: 'Monthly screenshot limit reached. Please upgrade your plan or wait for the next billing cycle.',
                usage: usageLimitResult.usage
            }, { status: 429 })
        }

        // Parse request body
        const config = await request.json()

        // Validate required fields
        if (!config.url) {
            return NextResponse.json({ 
                error: 'URL is required',
                jobId: null
            }, { status: 400 })
        }

        // Validate URL format
        try {
            new URL(config.url)
        } catch {
            return NextResponse.json({ 
                error: 'Invalid URL format',
                jobId: null
            }, { status: 400 })
        }

        // Validate format
        const validFormats = ['png', 'jpg', 'jpeg', 'webp', 'gif']
        if (config.format && !validFormats.includes(config.format)) {
            return NextResponse.json({ 
                error: `Format must be one of: ${validFormats.join(', ')}`,
                jobId: null
            }, { status: 400 })
        }

        // Prepare job data
        const jobId = uuidv4()
        const jobData: ScreenshotJobData = {
            id: jobId,
            url: config.url,
            options: {
                width: config.width,
                height: config.height,
                deviceType: config.deviceType || 'desktop',
                format: config.format || 'png',
                fullPage: config.fullPage || false,
                waitTime: config.waitTime || 0
            },
            userId: apiKey.created_by,
            apiKeyId: apiKey.id,
            metadata: {
                userAgent: request.headers.get('user-agent') || undefined,
                ipAddress: request.headers.get('x-forwarded-for') || 
                          request.headers.get('x-real-ip') || undefined,
                requestTime: new Date().toISOString(),
                apiVersion: '2.0'
            }
        }

        // Determine job priority and options
        const priority = config.priority === 'high' ? 10 : 1
        const delay = config.delay || 0

        // Add job to queue
        const screenshotQueue = getScreenshotQueue()
        const job = await screenshotQueue.addJob(jobData, {
            priority,
            delay,
            attempts: 3
        })

        // Handle case where queue is unavailable
        if (!job) {
            return NextResponse.json({ 
                error: 'Queue service unavailable',
                details: 'Screenshot queue is temporarily unavailable. Please try the synchronous endpoint.',
                jobId: null
            }, { status: 503 })
        }

        // Return job information
        const response = {
            jobId: job.id,
            status: 'queued',
            estimatedWaitTime: await estimateWaitTime(),
            statusUrl: `/api/screenshot/status/${job.id}`,
            queuePosition: await getQueuePosition(job.id),
            metadata: {
                queuedAt: new Date().toISOString(),
                processingTime: Date.now() - startTime
            }
        }

        return NextResponse.json(response, {
            status: 202, // Accepted
            headers: {
                'X-RateLimit-Limit': apiKey.rate_limit.toString(),
                'X-RateLimit-Remaining': Math.max(0, rateLimitResult.remaining - 1).toString(),
                'X-RateLimit-Reset': Math.floor(rateLimitResult.resetTime / 1000).toString()
            }
        })

    } catch (error) {
        console.error('Screenshot queue API error:', error)
        
        return NextResponse.json({ 
            error: 'Internal server error',
            details: 'Failed to queue screenshot job',
            jobId: null
        }, { status: 500 })
    }
}

// Estimate wait time based on queue length
async function estimateWaitTime(): Promise<number> {
    try {
        const screenshotQueue = getScreenshotQueue()
        const stats = await screenshotQueue.getStats()
        const avgProcessingTime = 10000 // 10 seconds average
        const concurrency = parseInt(process.env.QUEUE_CONCURRENCY || '5')
        
        return Math.ceil((stats.waiting + stats.active) / concurrency) * avgProcessingTime
    } catch (error) {
        return 30000 // Default 30 seconds
    }
}

// Get position in queue
async function getQueuePosition(jobId: string | number): Promise<number> {
    try {
        const screenshotQueue = getScreenshotQueue()
        const queue = screenshotQueue.getQueue()
        if (!queue) {
            return 0
        }
        const waitingJobs = await queue.getWaiting()
        const position = waitingJobs.findIndex((job: any) => job.id?.toString() === jobId.toString())
        return position >= 0 ? position + 1 : 0
    } catch (error) {
        console.warn('Could not get queue position:', error)
        return 0
    }
}

// GET endpoint to check queue status
export async function GET(request: NextRequest) {
    try {
        const screenshotQueue = getScreenshotQueue()
        const stats = await screenshotQueue.getStats()
        const health = await queueService.getHealthStatus()
        
        return NextResponse.json({
            queue: stats,
            health: health.healthy,
            browserPool: health.browserPool,
            timestamp: new Date().toISOString()
        })
    } catch (error) {
        console.error('Queue status error:', error)
        
        return NextResponse.json({
            error: 'Failed to get queue status'
        }, { status: 500 })
    }
}