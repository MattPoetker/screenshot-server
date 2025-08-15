'use client'

import React from 'react'
import Link from 'next/link'
import { 
  Camera, 
  Zap, 
  Shield, 
  Globe,
  Users,
  Target,
  Heart,
  Award,
  ArrowRight,
  CheckCircle,
  Twitter,
  Linkedin
} from 'lucide-react'

export default function AboutPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  const values = [
    {
      icon: Zap,
      title: "Speed & Performance",
      description: "We obsess over performance, delivering sub-2 second response times and 99.9% uptime.",
      iconColor: "text-yellow-600",
      iconBgColor: "bg-yellow-100"
    },
    {
      icon: Shield,
      title: "Security First",
      description: "Enterprise-grade security with SOC 2 compliance, encrypted connections, and private infrastructure.",
      iconColor: "text-green-600", 
      iconBgColor: "bg-green-100"
    },
    {
      icon: Users,
      title: "Developer Experience",
      description: "Built by developers, for developers. Simple APIs, comprehensive docs, and excellent support.",
      iconColor: "text-blue-600",
      iconBgColor: "bg-blue-100"
    },
    {
      icon: Globe,
      title: "Global Scale",
      description: "Serving millions of screenshots monthly with global CDN and infrastructure across 50+ regions.",
      iconColor: "text-purple-600",
      iconBgColor: "bg-purple-100"
    }
  ]

  const stats = [
    { number: "10M+", label: "Screenshots Captured" },
    { number: "99.9%", label: "Uptime SLA" },
    { number: "< 2s", label: "Average Response" },
    { number: "50+", label: "Global Regions" }
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
            <Link href="/features" className="text-slate-300 hover:text-white px-4 py-2 rounded hover:bg-slate-700 md:hover:bg-transparent transition-colors">
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
          About NiceShot<span className="text-indigo-500">API</span>
        </h1>
        <h2 className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-12">
          We're building the world's most reliable screenshot API service, empowering developers and businesses to capture perfect screenshots at scale.
        </h2>
      </div>

      {/* Stats */}
      <div className="max-w-6xl mx-auto px-4 mt-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center group hover:scale-110 transition-transform">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/5">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">{stat.number}</div>
                <div className="text-sm text-slate-400">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mission */}
      <div className="mt-32 max-w-4xl mx-auto px-4 text-center">
        <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl border border-indigo-500/20 p-8 md:p-12">
          <Target className="w-16 h-16 text-indigo-400 mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Our Mission</h2>
          <p className="text-lg text-slate-300 leading-relaxed">
            To provide developers and businesses with the most reliable, fast, and feature-rich screenshot API service. 
            We believe that capturing web content should be simple, scalable, and secure - enabling innovation without the complexity.
          </p>
        </div>
      </div>

      {/* Values */}
      <div className="mt-32 max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Our Values
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            The principles that guide everything we do
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {values.map((value, index) => (
            <div key={index} className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl p-8 hover:border-indigo-500/50 transition-all">
              <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${value.iconBgColor} ${value.iconColor} mb-6`}>
                <value.icon className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">{value.title}</h3>
              <p className="text-slate-400">{value.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Story */}
      <div className="mt-32 max-w-4xl mx-auto px-4">
        <div className="bg-slate-900/30 rounded-2xl p-8 md:p-12 border border-slate-800">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Our Story</h2>
          <div className="prose prose-lg prose-invert max-w-none">
            <p className="text-slate-300 leading-relaxed mb-6">
              NiceShot API was born from a simple frustration: existing screenshot services were either unreliable, 
              slow, or lacking essential features that modern applications require. As developers ourselves, we knew there had to be a better way.
            </p>
            <p className="text-slate-300 leading-relaxed mb-6">
              We started with a vision to create the screenshot service we wished existed - one that was lightning fast, 
              incredibly reliable, and powerful enough to handle any use case. From social media previews to automated testing, 
              from monitoring to content generation.
            </p>
            <p className="text-slate-300 leading-relaxed">
              Today, NiceShot API serves millions of screenshots monthly for thousands of developers and businesses worldwide. 
              We're proud to be the infrastructure that powers visual content generation across the web.
            </p>
          </div>
        </div>
      </div>

      {/* Why Choose Us */}
      <div className="mt-32 max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Why Choose NiceShot API?
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            We're not just another screenshot service - we're your reliable partner for visual content generation
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-indigo-500/10 rounded-lg flex items-center justify-center mx-auto mb-6">
              <Award className="w-8 h-8 text-indigo-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">Industry Leading</h3>
            <p className="text-slate-400">Best-in-class performance, reliability, and feature set trusted by industry leaders.</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500/10 rounded-lg flex items-center justify-center mx-auto mb-6">
              <Heart className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">Developer First</h3>
            <p className="text-slate-400">Built by developers who understand your needs. Simple APIs, great docs, responsive support.</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-500/10 rounded-lg flex items-center justify-center mx-auto mb-6">
              <Globe className="w-8 h-8 text-purple-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">Global Scale</h3>
            <p className="text-slate-400">Enterprise-grade infrastructure that scales with your business, from startup to IPO.</p>
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
            <Link href="/contact" className="px-8 py-4 bg-slate-800/80 backdrop-blur-sm text-white rounded-lg hover:bg-slate-700 transition-all hover:scale-105 font-semibold border border-slate-700">
              Contact Us
            </Link>
          </div>
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