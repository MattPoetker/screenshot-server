/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  images: {
    domains: ['localhost'],
  },
  // Allow API routes to handle larger payloads for screenshots
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
    responseLimit: '10mb',
  },
}