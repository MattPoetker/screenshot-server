import { NextRequest, NextResponse } from 'next/server'

// Liveness probe - simple check to see if the app is running
// This should be lightweight and not check external dependencies
export async function GET(request: NextRequest) {
    return NextResponse.json({
        alive: true,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        pid: process.pid,
        deployment_color: process.env.DEPLOYMENT_COLOR || 'default'
    }, { status: 200 })
}