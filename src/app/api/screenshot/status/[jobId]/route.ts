import { NextRequest, NextResponse } from 'next/server'
import { getScreenshotQueue } from '@/lib/queue/ScreenshotQueue'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ jobId: string }> }
) {
    try {
        const { jobId } = await params
        
        if (!jobId) {
            return NextResponse.json({
                error: 'Job ID is required'
            }, { status: 400 })
        }

        // Get job from queue
        const screenshotQueue = getScreenshotQueue()
        const job = await screenshotQueue.getJob(jobId)
        
        if (!job) {
            return NextResponse.json({
                error: 'Job not found',
                jobId
            }, { status: 404 })
        }

        // Get job state and progress
        const state = await job.getState()
        const progress = job.progress()
        const data = job.data
        const result = job.returnvalue
        
        // Build response based on job state
        const response: any = {
            jobId: job.id,
            status: state,
            progress: typeof progress === 'number' ? progress : 0,
            createdAt: new Date(job.timestamp).toISOString(),
            data: {
                url: data.url,
                options: data.options
            }
        }

        // Add state-specific information
        switch (state) {
            case 'waiting':
                const position = await getQueuePosition(jobId)
                response.queuePosition = position
                response.estimatedWaitTime = position * 10000 // 10s per position
                break
                
            case 'active':
                response.message = 'Screenshot is being processed'
                if (job.processedOn) {
                    response.startedAt = new Date(job.processedOn).toISOString()
                }
                break
                
            case 'completed':
                if (result) {
                    response.result = {
                        success: result.success,
                        filePath: result.filePath,
                        fileName: result.fileName,
                        fileSize: result.fileSize,
                        processingTime: result.processingTime,
                        url: result.metadata?.publicUrl || null
                    }
                }
                if (job.finishedOn) {
                    response.completedAt = new Date(job.finishedOn).toISOString()
                }
                break
                
            case 'failed':
                response.error = job.failedReason || 'Unknown error'
                response.attempts = job.attemptsMade
                response.maxAttempts = job.opts.attempts
                if (job.finishedOn) {
                    response.failedAt = new Date(job.finishedOn).toISOString()
                }
                break
                
            case 'delayed':
                response.delay = job.opts.delay
                response.message = 'Job is delayed'
                break
                
            case 'paused':
                response.message = 'Job is paused'
                break
        }

        return NextResponse.json(response)

    } catch (error) {
        console.error('Job status error:', error)
        
        return NextResponse.json({
            error: 'Failed to get job status',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}

// Get position in queue for waiting jobs
async function getQueuePosition(jobId: string): Promise<number> {
    try {
        const screenshotQueue = getScreenshotQueue()
        const queue = screenshotQueue.getQueue()
        if (!queue) {
            return 0
        }
        const waitingJobs = await queue.getWaiting()
        const position = waitingJobs.findIndex((job: any) => job.id === jobId)
        return position >= 0 ? position + 1 : 0
    } catch (error) {
        return 0
    }
}

// DELETE endpoint to cancel a job
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ jobId: string }> }
) {
    try {
        const { jobId } = await params
        
        if (!jobId) {
            return NextResponse.json({
                error: 'Job ID is required'
            }, { status: 400 })
        }

        // Get job
        const screenshotQueue = getScreenshotQueue()
        const job = await screenshotQueue.getJob(jobId)
        
        if (!job) {
            return NextResponse.json({
                error: 'Job not found',
                jobId
            }, { status: 404 })
        }

        // Check if job can be cancelled
        const state = await job.getState()
        
        if (['completed', 'failed'].includes(state)) {
            return NextResponse.json({
                error: 'Cannot cancel completed or failed job',
                jobId,
                status: state
            }, { status: 400 })
        }

        // Remove job
        await job.remove()
        
        return NextResponse.json({
            jobId,
            status: 'cancelled',
            message: 'Job cancelled successfully'
        })

    } catch (error) {
        console.error('Job cancellation error:', error)
        
        return NextResponse.json({
            error: 'Failed to cancel job',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}