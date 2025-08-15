import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Log all requests with timestamps
  console.log(`[${new Date().toISOString()}] ${request.method} ${request.url}`)
  
  // Log headers for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    console.log(`[${new Date().toISOString()}] Headers:`, Object.fromEntries(request.headers.entries()))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}