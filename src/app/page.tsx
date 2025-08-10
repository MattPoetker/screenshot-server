'use client'

import React from 'react'
import Link from 'next/link'
import { 
  Camera, 
  Zap, 
  Shield, 
  Code, 
  Globe, 
  Gauge, 
  Lock,
  Server,
  FileImage,
  Sparkles,
  ChevronRight,
  Github,
  CheckCircle,
  ArrowRight,
  BarChart3,
  Clock,
  Cloud,
  Terminal
} from 'lucide-react'

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      {/* Navigation */}
      <nav className="relative px-4 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Camera className="w-8 h-8 text-indigo-500" />
            <span className="text-2xl font-bold text-white">NiceShot<span className="text-indigo-500">API</span></span>
          </Link>
          
          <div className="flex-1"></div>
          
          {/* Mobile menu button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white p-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
          
          {/* Desktop menu */}
          <div className={`${mobileMenuOpen ? 'flex' : 'hidden'} md:flex flex-col md:flex-row absolute md:relative top-full right-0 bg-slate-800 md:bg-transparent w-48 md:w-auto mt-2 md:mt-0 rounded md:rounded-none p-2 md:p-0 z-50 md:gap-4`}>
            <Link href="/docs" className="text-slate-300 hover:text-white px-4 py-2 rounded hover:bg-slate-700 md:hover:bg-transparent transition-colors">
              Documentation
            </Link>
            <Link href="/pricing" className="text-slate-300 hover:text-white px-4 py-2 rounded hover:bg-slate-700 md:hover:bg-transparent transition-colors">
              Pricing
            </Link>
            <Link href="https://github.com" className="text-slate-300 hover:text-white px-4 py-2 rounded hover:bg-slate-700 md:hover:bg-transparent transition-colors flex items-center gap-2">
              <Github className="w-4 h-4" />
              GitHub
            </Link>
            <Link href="/login" className="px-6 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 transition-colors font-semibold">
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="text-center pt-12 md:pt-24 px-4">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-6">
          Screenshots as a Service<span className="text-indigo-500">.</span>
        </h1>
        <h2 className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-8">
          Professional screenshot and website capture API with advanced features. 
          Perfect for documentation, testing, and monitoring.
        </h2>
        
        {/* Feature badges */}
        <div className="flex flex-wrap gap-3 justify-center mb-8">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <Zap className="w-4 h-4 text-yellow-500" />
            Lightning Fast
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <Shield className="w-4 h-4 text-green-500" />
            Secure & Reliable
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <Globe className="w-4 h-4 text-blue-500" />
            Global CDN
          </div>
        </div>
        
        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/login" className="px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold flex items-center justify-center gap-2">
            Get Started Free
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="#features" className="px-8 py-4 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors font-semibold flex items-center justify-center gap-2">
            View Features
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-3xl font-bold text-white">10M+</div>
            <div className="text-sm text-slate-400">Screenshots Captured</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white">99.9%</div>
            <div className="text-sm text-slate-400">Uptime SLA</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white">&lt;2s</div>
            <div className="text-sm text-slate-400">Average Response</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white">50+</div>
            <div className="text-sm text-slate-400">Global Regions</div>
          </div>
        </div>
      </div>

      {/* Code Example */}
      <div className="mt-24 max-w-4xl mx-auto px-4">
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Terminal className="w-5 h-5 text-slate-400" />
            <span className="text-sm text-slate-400">Quick Start</span>
          </div>
          <pre className="text-sm text-slate-300 overflow-x-auto">
            <code>{`# Capture a screenshot with a simple POST request
curl -X POST https://api.screenshot.io/capture \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://example.com",
    "format": "png",
    "width": 1920,
    "height": 1080
  }'

# Response
{
  "image": "screenshot-123456.png",
  "url": "https://images.sitelaunch.io/images/screenshot-123456.png",
  "metadata": {
    "width": 1920,
    "height": 1080,
    "format": "png",
    "size": 245632
  }
}`}</code>
          </pre>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="mt-32 max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Powerful Features
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Everything you need to capture, process, and deliver perfect screenshots at scale
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-xl p-6 hover:border-indigo-500/50 transition-colors">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-lg flex items-center justify-center mb-4">
              <Camera className="w-6 h-6 text-indigo-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Full Page Capture</h3>
            <p className="text-slate-400 text-sm">
              Capture entire web pages, including content below the fold, with automatic scrolling and stitching.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-xl p-6 hover:border-indigo-500/50 transition-colors">
            <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mb-4">
              <FileImage className="w-6 h-6 text-green-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Multiple Formats</h3>
            <p className="text-slate-400 text-sm">
              Export in PNG, JPEG, WebP, or animated GIF formats with customizable quality and compression.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-xl p-6 hover:border-indigo-500/50 transition-colors">
            <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center mb-4">
              <Gauge className="w-6 h-6 text-yellow-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Lightning Fast</h3>
            <p className="text-slate-400 text-sm">
              Optimized rendering engine with intelligent caching delivers screenshots in seconds.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-xl p-6 hover:border-indigo-500/50 transition-colors">
            <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-4">
              <Code className="w-6 h-6 text-purple-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Developer Friendly</h3>
            <p className="text-slate-400 text-sm">
              RESTful API with comprehensive documentation, SDKs for popular languages, and webhook support.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-xl p-6 hover:border-indigo-500/50 transition-colors">
            <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4">
              <Globe className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Global CDN</h3>
            <p className="text-slate-400 text-sm">
              Screenshots delivered through a global CDN network for blazing fast access worldwide.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-xl p-6 hover:border-indigo-500/50 transition-colors">
            <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Secure & Private</h3>
            <p className="text-slate-400 text-sm">
              Enterprise-grade security with encrypted connections, API key authentication, and rate limiting.
            </p>
          </div>
        </div>
      </div>

      {/* Advanced Features */}
      <div className="mt-32 max-w-7xl mx-auto px-4">
        <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl border border-indigo-500/20 p-8 md:p-12">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <span className="text-indigo-400 font-semibold">Advanced Features</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-6">
              Built for Scale & Performance
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <div className="text-white font-semibold">Custom Viewport Sizes</div>
                  <div className="text-slate-400 text-sm">Test responsive designs with any viewport dimension</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <div className="text-white font-semibold">JavaScript Execution</div>
                  <div className="text-slate-400 text-sm">Wait for dynamic content to load before capturing</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <div className="text-white font-semibold">Batch Processing</div>
                  <div className="text-slate-400 text-sm">Capture multiple URLs in a single request</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <div className="text-white font-semibold">Webhook Notifications</div>
                  <div className="text-slate-400 text-sm">Get notified when screenshots are ready</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Use Cases */}
      <div className="mt-32 max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Perfect For Every Use Case
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            From automated testing to content generation, our API powers thousands of applications
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-slate-900/30 rounded-xl p-8 border border-slate-800">
            <BarChart3 className="w-10 h-10 text-indigo-500 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-3">Website Monitoring</h3>
            <p className="text-slate-400 mb-4">
              Monitor website changes, track competitor updates, and detect visual regressions automatically.
            </p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm text-slate-300">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Scheduled captures
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-300">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Visual diff detection
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-300">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Alert notifications
              </li>
            </ul>
          </div>

          <div className="bg-slate-900/30 rounded-xl p-8 border border-slate-800">
            <FileImage className="w-10 h-10 text-purple-500 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-3">Content Generation</h3>
            <p className="text-slate-400 mb-4">
              Generate social media previews, PDF reports, and documentation screenshots programmatically.
            </p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm text-slate-300">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Social card generation
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-300">
                <CheckCircle className="w-4 h-4 text-green-500" />
                PDF conversion
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-300">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Batch processing
              </li>
            </ul>
          </div>

          <div className="bg-slate-900/30 rounded-xl p-8 border border-slate-800">
            <Server className="w-10 h-10 text-green-500 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-3">Automated Testing</h3>
            <p className="text-slate-400 mb-4">
              Integrate visual testing into your CI/CD pipeline for consistent quality assurance.
            </p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm text-slate-300">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Cross-browser testing
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-300">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Responsive testing
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-300">
                <CheckCircle className="w-4 h-4 text-green-500" />
                CI/CD integration
              </li>
            </ul>
          </div>

          <div className="bg-slate-900/30 rounded-xl p-8 border border-slate-800">
            <Cloud className="w-10 h-10 text-blue-500 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-3">SaaS Applications</h3>
            <p className="text-slate-400 mb-4">
              Power your SaaS with screenshot capabilities for user-generated content and previews.
            </p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm text-slate-300">
                <CheckCircle className="w-4 h-4 text-green-500" />
                White-label solution
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-300">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Custom branding
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-300">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Usage analytics
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="mt-32 px-4 pb-24">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-slate-400 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of developers using our API to capture perfect screenshots. 
            Start free with 500 screenshots per month.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login" className="px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold flex items-center justify-center gap-2">
              Start Free Trial
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/docs" className="px-8 py-4 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors font-semibold">
              Read Documentation
            </Link>
          </div>
          <p className="text-sm text-slate-500 mt-6">
            No credit card required • Free tier available • Cancel anytime
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Camera className="w-6 h-6 text-indigo-500" />
                <span className="text-lg font-bold text-white">NiceShotAPI</span>
              </div>
              <p className="text-sm text-slate-400">
                Professional screenshot capture service for developers and businesses.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><Link href="/features" className="text-slate-400 hover:text-white text-sm">Features</Link></li>
                <li><Link href="/pricing" className="text-slate-400 hover:text-white text-sm">Pricing</Link></li>
                <li><Link href="/docs" className="text-slate-400 hover:text-white text-sm">Documentation</Link></li>
                <li><Link href="/api" className="text-slate-400 hover:text-white text-sm">API Reference</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-slate-400 hover:text-white text-sm">About</Link></li>
                <li><Link href="/blog" className="text-slate-400 hover:text-white text-sm">Blog</Link></li>
                <li><Link href="/contact" className="text-slate-400 hover:text-white text-sm">Contact</Link></li>
                <li><Link href="/support" className="text-slate-400 hover:text-white text-sm">Support</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="text-slate-400 hover:text-white text-sm">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-slate-400 hover:text-white text-sm">Terms of Service</Link></li>
                <li><Link href="/sla" className="text-slate-400 hover:text-white text-sm">SLA</Link></li>
                <li><Link href="/security" className="text-slate-400 hover:text-white text-sm">Security</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 mt-12 pt-8 text-center">
            <p className="text-sm text-slate-400">
              © {new Date().getFullYear()} NiceShotAPI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}