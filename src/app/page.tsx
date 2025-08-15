'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import CountUp from 'react-countup'
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
  CheckCircle,
  ArrowRight,
  BarChart3,
  Clock,
  Cloud,
  Terminal,
  Copy,
  Check,
  Twitter,
  Linkedin
} from 'lucide-react'

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const copyToClipboard = () => {
    const codeText = `# Capture a screenshot with a simple POST request
curl -X POST https://nice-shot.io/api/screenshot \\\\
  -H "Authorization: Bearer YOUR_API_KEY" \\\\
  -H "Content-Type: application/json" \\\\
  -d '{
    "url": "https://example.com",
    "format": "png",
    "width": 1920,
    "height": 1080
  }'`
    navigator.clipboard.writeText(codeText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 relative">
      {/* Animated gradient background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-pink-500/10 animate-gradient-shift" />
      </div>

      {/* Navigation */}
      <nav className="relative px-4 py-6 z-10">
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
            <Link href="/login" className="px-6 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 transition-colors font-semibold">
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden pt-12 md:pt-24 px-4 text-center">
        {/* Spotlight gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.3),transparent_50%)]" />
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-6 relative z-10"
        >
          Screenshots as a Service<span className="text-indigo-500">.</span>
        </motion.h1>
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-8 relative z-10"
        >
          Professional thumbnail and website capture API with advanced features. 
          Perfect for social media previews, content generation, and automated testing.
        </motion.h2>
        
        {/* Feature badges with glassmorphism */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-wrap gap-3 justify-center mb-8 relative z-10"
        >
          <div className="flex items-center gap-2 text-sm text-slate-300 px-4 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10">
            <Zap className="w-4 h-4 text-yellow-500" />
            Lightning Fast
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-300 px-4 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10">
            <Shield className="w-4 h-4 text-green-500" />
            Secure & Reliable
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-300 px-4 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10">
            <Globe className="w-4 h-4 text-blue-500" />
            Global CDN
          </div>
        </motion.div>
        
        {/* CTA Buttons with glow effect */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center relative z-10"
        >
          <Link href="/login" className="relative inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg font-semibold overflow-hidden group bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">
            <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-20 blur-lg transition-opacity" />
            <span className="relative">Get Started Free</span>
            <ArrowRight className="w-4 h-4 relative" />
          </Link>
          <Link href="#features" className="px-8 py-4 bg-slate-800/80 backdrop-blur-sm text-white rounded-lg hover:bg-slate-700 transition-all hover:scale-105 font-semibold flex items-center justify-center gap-2 border border-slate-700">
            View Features
            <ChevronRight className="w-4 h-4" />
          </Link>
        </motion.div>

        {/* Stats with count-up animation */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto relative z-10"
        >
          <div className="text-center group hover:scale-110 transition-transform">
            <div className="text-3xl font-bold text-white bg-gradient-to-br from-white/10 to-transparent backdrop-blur-sm rounded-lg p-4 border border-white/5">
              {isVisible && <CountUp end={10} duration={2} suffix="M+" />}
            </div>
            <div className="text-sm text-slate-400 mt-2">Screenshots Captured</div>
          </div>
          <div className="text-center group hover:scale-110 transition-transform">
            <div className="text-3xl font-bold text-white bg-gradient-to-br from-white/10 to-transparent backdrop-blur-sm rounded-lg p-4 border border-white/5">
              {isVisible && <CountUp end={99.9} duration={2} decimals={1} suffix="%" />}
            </div>
            <div className="text-sm text-slate-400 mt-2">Uptime SLA</div>
          </div>
          <div className="text-center group hover:scale-110 transition-transform">
            <div className="text-3xl font-bold text-white bg-gradient-to-br from-white/10 to-transparent backdrop-blur-sm rounded-lg p-4 border border-white/5">
              &lt;2s
            </div>
            <div className="text-sm text-slate-400 mt-2">Average Response</div>
          </div>
          <div className="text-center group hover:scale-110 transition-transform">
            <div className="text-3xl font-bold text-white bg-gradient-to-br from-white/10 to-transparent backdrop-blur-sm rounded-lg p-4 border border-white/5">
              {isVisible && <CountUp end={50} duration={2} suffix="+" />}
            </div>
            <div className="text-sm text-slate-400 mt-2">Global Regions</div>
          </div>
        </motion.div>
      </div>

      {/* Code Example with copy button */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="mt-24 max-w-4xl mx-auto px-4 relative z-10"
      >
        <div className="bg-slate-900/80 backdrop-blur-md rounded-xl border border-slate-800 p-6 relative group">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-slate-400" />
              <span className="text-sm text-slate-400">Quick Start</span>
            </div>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-2 px-3 py-1 rounded-md bg-slate-800 hover:bg-slate-700 transition-colors text-slate-400 hover:text-white"
            >
              {copied ? (
                <><Check className="w-4 h-4" /> Copied!</>
              ) : (
                <><Copy className="w-4 h-4" /> Copy</>
              )}
            </button>
          </div>
          <pre className="text-sm text-slate-300 overflow-x-auto">
            <code>{`# Capture a screenshot with a simple POST request
curl -X POST `}<span className="text-emerald-400">https://nice-shot.io/api/screenshot</span>{` \\
  -H `}<span className="text-pink-400">"Authorization: Bearer YOUR_API_KEY"</span>{` \\
  -H `}<span className="text-pink-400">"Content-Type: application/json"</span>{` \\
  -d '{
    `}<span className="text-cyan-400">"url"</span>{`: "https://example.com",
    `}<span className="text-cyan-400">"format"</span>{`: "png",
    `}<span className="text-cyan-400">"width"</span>{`: 1920,
    `}<span className="text-cyan-400">"height"</span>{`: 1080
  }'

# Response
{
  `}<span className="text-cyan-400">"image"</span>{`: "screenshot-123456.png",
  `}<span className="text-cyan-400">"url"</span>{`: "https://images.nice-shot.io/images/screenshot-123456.png",
  `}<span className="text-cyan-400">"metadata"</span>{`: {
    "width": 1920,
    "height": 1080,
    "format": "png",
    "size": 245632
  }
}`}</code>
          </pre>
        </div>
      </motion.div>

      {/* Section Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent my-16" />

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
          <motion.div 
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-xl p-6 hover:border-indigo-500/50 transition-all hover:shadow-xl hover:shadow-indigo-500/20 group"
          >
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-tr from-indigo-500 to-purple-500 animate-pulse-slow mb-4">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Full Page Capture</h3>
            <p className="text-slate-400 text-sm">
              Capture entire web pages, including content below the fold, with automatic scrolling and stitching.
            </p>
          </motion.div>

          {/* Feature 2 */}
          <motion.div 
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-xl p-6 hover:border-green-500/50 transition-all hover:shadow-xl hover:shadow-green-500/20 group"
          >
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-tr from-green-500 to-emerald-500 animate-pulse-slow mb-4">
              <FileImage className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Multiple Formats</h3>
            <p className="text-slate-400 text-sm">
              Export in PNG, JPEG, WebP, or animated GIF formats with customizable quality and compression.
            </p>
          </motion.div>

          {/* Feature 3 */}
          <motion.div 
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-xl p-6 hover:border-yellow-500/50 transition-all hover:shadow-xl hover:shadow-yellow-500/20 group"
          >
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-tr from-yellow-500 to-orange-500 animate-pulse-slow mb-4">
              <Gauge className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Lightning Fast</h3>
            <p className="text-slate-400 text-sm">
              Optimized rendering engine with intelligent caching delivers screenshots in seconds.
            </p>
          </motion.div>

          {/* Feature 4 */}
          <motion.div 
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-xl p-6 hover:border-purple-500/50 transition-all hover:shadow-xl hover:shadow-purple-500/20 group"
          >
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-tr from-purple-500 to-pink-500 animate-pulse-slow mb-4">
              <Code className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Developer Friendly</h3>
            <p className="text-slate-400 text-sm">
              RESTful API with comprehensive documentation, SDKs for popular languages, and webhook support.
            </p>
          </motion.div>

          {/* Feature 5 */}
          <motion.div 
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-xl p-6 hover:border-blue-500/50 transition-all hover:shadow-xl hover:shadow-blue-500/20 group"
          >
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-tr from-blue-500 to-cyan-500 animate-pulse-slow mb-4">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Global CDN</h3>
            <p className="text-slate-400 text-sm">
              Screenshots delivered through a global CDN network for blazing fast access worldwide.
            </p>
          </motion.div>

          {/* Feature 6 */}
          <motion.div 
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-xl p-6 hover:border-red-500/50 transition-all hover:shadow-xl hover:shadow-red-500/20 group"
          >
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-tr from-red-500 to-rose-500 animate-pulse-slow mb-4">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Secure & Private</h3>
            <p className="text-slate-400 text-sm">
              Enterprise-grade security with encrypted connections, API key authentication, and rate limiting.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Section Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent my-16" />

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

      {/* Section Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent my-16" />

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
            <FileImage className="w-10 h-10 text-purple-500 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-3">Thumbnail Generation</h3>
            <p className="text-slate-400 mb-4">
              Generate perfect thumbnails and social media previews for websites, blogs, and applications. All thumbnails stored indefinitely.
            </p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm text-slate-300">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Social media cards
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-300">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Website previews
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-300">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Permanent storage
              </li>
            </ul>
          </div>

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

      {/* Section Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent my-16" />

      {/* CTA Section */}
      <div className="mt-32 px-4 pb-24 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-4xl font-bold text-white mb-6"
          >
            Ready to Get Started?
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-slate-400 text-lg mb-8 max-w-2xl mx-auto"
          >
            Join thousands of developers using our API to capture perfect screenshots. 
            Start free with 500 screenshots per month.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/login" className="relative inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg font-semibold overflow-hidden group bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">
              <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-20 blur-lg transition-opacity animate-pulse" />
              <span className="relative">Start Free Trial</span>
              <ArrowRight className="w-4 h-4 relative" />
            </Link>
            <Link href="/docs" className="px-8 py-4 bg-slate-800/80 backdrop-blur-sm text-white rounded-lg hover:bg-slate-700 transition-all hover:scale-105 font-semibold border border-slate-700">
              Read Documentation
            </Link>
          </motion.div>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-sm text-slate-500 mt-6"
          >
            No credit card required • Free tier available • Cancel anytime
          </motion.p>
        </div>
      </div>

      {/* Footer with gradient */}
      <footer className="relative border-t border-slate-800 px-4 py-12">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
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
          
          <div className="border-t border-slate-800 mt-12 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <p className="text-sm text-slate-400">
                © {new Date().getFullYear()} NiceShotAPI. All rights reserved.
              </p>
              <div className="flex gap-4 mt-4 md:mt-0">
                <Link href="https://twitter.com" className="text-slate-400 hover:text-indigo-400 transition-colors">
                  <Twitter className="w-5 h-5" />
                </Link>
                <Link href="https://linkedin.com" className="text-slate-400 hover:text-indigo-400 transition-colors">
                  <Linkedin className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}