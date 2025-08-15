'use client'

import React from 'react'
import Link from 'next/link'
import { 
  Camera, 
  Zap, 
  Shield, 
  Globe,
  Code,
  FileImage,
  Gauge,
  Lock,
  Server,
  Cloud,
  Activity,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Twitter,
  Linkedin
} from 'lucide-react'

export default function FeaturesPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  const features = [
    {
      icon: Camera,
      title: "Full Page Capture",
      description: "Capture entire web pages, including content below the fold, with automatic scrolling and stitching.",
      iconColor: "text-indigo-600",
      iconBgColor: "bg-indigo-100",
      details: [
        "Automatic viewport detection",
        "Smart scrolling technology", 
        "Perfect content stitching",
        "No content cutoffs"
      ]
    },
    {
      icon: FileImage,
      title: "Multiple Formats",
      description: "Export in PNG, JPEG, WebP, or animated GIF formats with customizable quality and compression.",
      iconColor: "text-green-600",
      iconBgColor: "bg-green-100",
      details: [
        "PNG with transparency support",
        "JPEG with quality control",
        "WebP for optimal compression",
        "Animated GIF for scrolling pages"
      ]
    },
    {
      icon: Gauge,
      title: "Lightning Fast",
      description: "Optimized rendering engine with intelligent caching delivers screenshots in seconds.",
      iconColor: "text-yellow-600",
      iconBgColor: "bg-yellow-100",
      details: [
        "Sub-2 second response times",
        "Intelligent caching system",
        "Optimized browser pool",
        "Global CDN delivery"
      ]
    },
    {
      icon: Code,
      title: "Developer Friendly",
      description: "RESTful API with comprehensive documentation, SDKs for popular languages, and webhook support.",
      iconColor: "text-purple-600",
      iconBgColor: "bg-purple-100",
      details: [
        "Simple REST API",
        "Comprehensive documentation",
        "Multiple SDKs available",
        "Webhook notifications"
      ]
    },
    {
      icon: Globe,
      title: "Global CDN",
      description: "Screenshots delivered through a global CDN network for blazing fast access worldwide.",
      iconColor: "text-blue-600",
      iconBgColor: "bg-blue-100",
      details: [
        "50+ global regions",
        "99.9% uptime guarantee",
        "Automatic failover",
        "Edge caching"
      ]
    },
    {
      icon: Lock,
      title: "Secure & Private",
      description: "Enterprise-grade security with encrypted connections, API key authentication, and rate limiting.",
      iconColor: "text-red-600",
      iconBgColor: "bg-red-100",
      details: [
        "SSL/TLS encryption",
        "API key authentication",
        "Rate limiting protection",
        "SOC 2 compliance"
      ]
    }
  ]

  const advancedFeatures = [
    {
      title: "Custom Viewport Sizes",
      description: "Test responsive designs with any viewport dimension from mobile to ultra-wide displays."
    },
    {
      title: "JavaScript Execution",
      description: "Wait for dynamic content to load, execute custom JavaScript, and handle SPAs perfectly."
    },
    {
      title: "Element Selection",
      description: "Capture specific elements with CSS selectors, hide unwanted content, and customize the output."
    },
    {
      title: "Batch Processing",
      description: "Capture multiple URLs in a single request for efficient bulk screenshot generation."
    },
    {
      title: "Webhook Notifications",
      description: "Get notified when screenshots are ready with configurable webhook endpoints."
    },
    {
      title: "Device Simulation",
      description: "Simulate mobile devices, tablets, and desktops with proper user agents and touch events."
    }
  ]

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
            <Link href="/" className="text-slate-300 hover:text-white px-4 py-2 rounded hover:bg-slate-700 md:hover:bg-transparent transition-colors">
              Home
            </Link>
            <Link href="/docs" className="text-slate-300 hover:text-white px-4 py-2 rounded hover:bg-slate-700 md:hover:bg-transparent transition-colors">
              Documentation
            </Link>
            <Link href="/pricing" className="text-slate-300 hover:text-white px-4 py-2 rounded hover:bg-slate-700 md:hover:bg-transparent transition-colors">
              Pricing
            </Link>
            <Link href="/features" className="text-white px-4 py-2 rounded bg-indigo-600 md:bg-transparent md:text-indigo-400 transition-colors">
              Features
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
          Powerful Features<span className="text-indigo-500">.</span>
        </h1>
        <h2 className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-8">
          Everything you need to capture, process, and deliver perfect screenshots at scale with enterprise-grade reliability.
        </h2>
        
        {/* Feature badges */}
        <div className="flex flex-wrap gap-3 justify-center mb-12">
          <div className="flex items-center gap-2 text-sm text-slate-300 px-4 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10">
            <Zap className="w-4 h-4 text-yellow-500" />
            Lightning Fast
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-300 px-4 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10">
            <Shield className="w-4 h-4 text-green-500" />
            Enterprise Grade
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-300 px-4 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10">
            <Globe className="w-4 h-4 text-blue-500" />
            Global Scale
          </div>
        </div>
      </div>

      {/* Core Features Grid */}
      <div className="max-w-7xl mx-auto px-4 mt-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl p-8 hover:border-indigo-500/50 transition-all hover:shadow-xl hover:shadow-indigo-500/20">
              <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${feature.iconBgColor} ${feature.iconColor} mb-6`}>
                <feature.icon className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">{feature.title}</h3>
              <p className="text-slate-400 mb-6">{feature.description}</p>
              <ul className="space-y-2">
                {feature.details.map((detail, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Advanced Features */}
      <div className="mt-32 max-w-7xl mx-auto px-4">
        <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl border border-indigo-500/20 p-8 md:p-12">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-6 h-6 text-indigo-400" />
              <span className="text-indigo-400 font-semibold">Advanced Capabilities</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Built for Developers
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Advanced features and customization options for complex use cases and enterprise requirements.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {advancedFeatures.map((feature, index) => (
              <div key={index} className="bg-slate-900/30 rounded-xl p-6 border border-slate-800">
                <h4 className="text-lg font-semibold text-white mb-3">{feature.title}</h4>
                <p className="text-slate-400 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Use Cases Preview */}
      <div className="mt-32 max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Perfect For Every Use Case
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            From automated testing to content generation, our API powers thousands of applications
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-900/30 rounded-xl p-6 border border-slate-800 text-center">
            <FileImage className="w-12 h-12 text-purple-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Thumbnail Generation</h3>
            <p className="text-slate-400 text-sm">Social media previews and website thumbnails</p>
          </div>
          <div className="bg-slate-900/30 rounded-xl p-6 border border-slate-800 text-center">
            <Activity className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Website Monitoring</h3>
            <p className="text-slate-400 text-sm">Visual regression testing and monitoring</p>
          </div>
          <div className="bg-slate-900/30 rounded-xl p-6 border border-slate-800 text-center">
            <Server className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Automated Testing</h3>
            <p className="text-slate-400 text-sm">CI/CD pipeline integration</p>
          </div>
          <div className="bg-slate-900/30 rounded-xl p-6 border border-slate-800 text-center">
            <Cloud className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">SaaS Applications</h3>
            <p className="text-slate-400 text-sm">White-label screenshot capabilities</p>
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
            Join thousands of developers using our API to capture perfect screenshots. Start free with 500 screenshots per month.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login" className="relative inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg font-semibold overflow-hidden group bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">
              <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-20 blur-lg transition-opacity" />
              <span className="relative">Start Free Trial</span>
              <ArrowRight className="w-4 h-4 relative" />
            </Link>
            <Link href="/docs" className="px-8 py-4 bg-slate-800/80 backdrop-blur-sm text-white rounded-lg hover:bg-slate-700 transition-all hover:scale-105 font-semibold border border-slate-700">
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