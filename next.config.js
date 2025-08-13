/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove standalone output for now - use standard build
  experimental: {
    serverActions: true,
  },
  images: {
    domains: ['localhost'],
  },
  // Ensure server-side rendering for dynamic routes
  trailingSlash: false,
  // Allow API routes to handle larger payloads for screenshots
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
    responseLimit: '10mb',
  },
}