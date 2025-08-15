'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { 
  Camera, 
  Book,
  MessageCircle,
  Mail,
  Search,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ArrowRight,
  Twitter,
  Linkedin
} from 'lucide-react'

export default function SupportPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const faqs = [
    {
      question: 'How do I get started with NiceShot API?',
      answer: 'Getting started is simple! Sign up for a free account, create an API key in your dashboard, and make your first request. Check out our Quick Start guide in the documentation for a step-by-step walkthrough.'
    },
    {
      question: 'What image formats do you support?',
      answer: 'We support PNG, JPEG, WebP, and GIF formats. PNG is great for high quality images with transparency, JPEG for smaller file sizes, WebP for optimal compression, and GIF for animated scrolling captures.'
    },
    {
      question: 'How do I capture a full page screenshot?',
      answer: 'Set the "fullPage" parameter to true in your request. Our API will automatically capture the entire page height, not just the viewport. This works great for long pages and ensures no content is cut off.'
    },
    {
      question: 'What are the rate limits?',
      answer: 'Rate limits vary by plan: Free (10 requests/minute), Pro (100 requests/minute), Enterprise (custom limits). You can see your current usage and limits in your dashboard.'
    },
    {
      question: 'Can I capture screenshots of pages behind authentication?',
      answer: 'Yes! You can pass custom headers, cookies, and authentication tokens in your request. This allows you to capture screenshots of private pages or pages requiring login.'
    },
    {
      question: 'How long are screenshots stored?',
      answer: 'All screenshots are stored indefinitely across all plans. You can access your screenshots anytime through our CDN without worrying about expiration dates.'
    },
    {
      question: 'Do you offer webhooks?',
      answer: 'Yes! Pro and Enterprise plans include webhook support. You can configure webhook endpoints to receive notifications when screenshots are ready or if there are any errors.'
    },
    {
      question: 'Can I hide elements or customize the page before capture?',
      answer: 'Absolutely! You can hide elements using CSS selectors, block specific resources (ads, images, etc.), inject custom CSS, and wait for specific elements to load before capturing.'
    },
    {
      question: 'What happens if a screenshot fails?',
      answer: 'Failed screenshots return detailed error information including the reason for failure (timeout, invalid URL, etc.). Failed requests don\'t count against your monthly quota.'
    },
    {
      question: 'Do you have SDKs for different programming languages?',
      answer: 'We provide SDKs for popular languages including JavaScript/Node.js, Python, PHP, Ruby, and Go. You can also use any HTTP client to make requests to our REST API.'
    }
  ]

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const supportChannels = [
    {
      icon: Book,
      title: "Documentation",
      description: "Comprehensive guides, API reference, and examples",
      link: "/docs",
      linkText: "Browse Docs"
    },
    {
      icon: MessageCircle,
      title: "Community Forum",
      description: "Get help from the community and share your experiences",
      link: "#",
      linkText: "Join Forum"
    },
    {
      icon: Mail,
      title: "Email Support",
      description: "Direct support from our team for technical questions",
      link: "/contact",
      linkText: "Contact Support"
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
          Support Center<span className="text-indigo-500">.</span>
        </h1>
        <h2 className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-12">
          Find answers, get help, and learn how to make the most of NiceShot API
        </h2>
      </div>

      {/* Support Channels */}
      <div className="max-w-7xl mx-auto px-4 mt-16">
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {supportChannels.map((channel, index) => (
            <div key={index} className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl p-8 text-center hover:border-indigo-500/50 transition-all">
              <div className="w-16 h-16 bg-indigo-500/10 rounded-xl flex items-center justify-center mx-auto mb-6">
                <channel.icon className="w-8 h-8 text-indigo-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">{channel.title}</h3>
              <p className="text-slate-400 mb-6">{channel.description}</p>
              <Link 
                href={channel.link}
                className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
              >
                {channel.linkText}
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto px-4 mt-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-400 mb-8">
            Find quick answers to common questions about NiceShot API
          </p>
          
          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="space-y-4">
          {filteredFaqs.map((faq, index) => (
            <div key={index} className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-slate-800/50 transition-colors"
              >
                <span className="text-white font-semibold pr-4">{faq.question}</span>
                {expandedFaq === index ? (
                  <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                )}
              </button>
              {expandedFaq === index && (
                <div className="px-6 pb-4">
                  <p className="text-slate-400 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredFaqs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-400">No FAQs found matching your search.</p>
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="max-w-6xl mx-auto px-4 mt-32">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">
            Popular Resources
          </h2>
          <p className="text-slate-400">
            Most commonly accessed documentation and guides
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/docs" className="bg-slate-900/30 rounded-xl p-6 border border-slate-800 hover:border-indigo-500/50 transition-all group">
            <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-indigo-400 transition-colors">Getting Started Guide</h3>
            <p className="text-slate-400 text-sm">Step-by-step tutorial to make your first API request</p>
          </Link>
          
          <Link href="/docs" className="bg-slate-900/30 rounded-xl p-6 border border-slate-800 hover:border-indigo-500/50 transition-all group">
            <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-indigo-400 transition-colors">API Reference</h3>
            <p className="text-slate-400 text-sm">Complete documentation of all endpoints and parameters</p>
          </Link>
          
          <Link href="/docs" className="bg-slate-900/30 rounded-xl p-6 border border-slate-800 hover:border-indigo-500/50 transition-all group">
            <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-indigo-400 transition-colors">Code Examples</h3>
            <p className="text-slate-400 text-sm">Sample code in multiple programming languages</p>
          </Link>
          
          <Link href="/docs" className="bg-slate-900/30 rounded-xl p-6 border border-slate-800 hover:border-indigo-500/50 transition-all group">
            <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-indigo-400 transition-colors">Authentication Guide</h3>
            <p className="text-slate-400 text-sm">How to authenticate and manage your API keys</p>
          </Link>
          
          <Link href="/docs" className="bg-slate-900/30 rounded-xl p-6 border border-slate-800 hover:border-indigo-500/50 transition-all group">
            <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-indigo-400 transition-colors">Error Handling</h3>
            <p className="text-slate-400 text-sm">Understanding error codes and troubleshooting common issues</p>
          </Link>
          
          <Link href="/docs" className="bg-slate-900/30 rounded-xl p-6 border border-slate-800 hover:border-indigo-500/50 transition-all group">
            <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-indigo-400 transition-colors">Advanced Features</h3>
            <p className="text-slate-400 text-sm">Custom viewports, element selection, and batch processing</p>
          </Link>
        </div>
      </div>

      {/* Still Need Help */}
      <div className="max-w-4xl mx-auto px-4 mt-32">
        <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl border border-indigo-500/20 p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Still Need Help?
          </h2>
          <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
            Can't find what you're looking for? Our support team is here to help you get the most out of NiceShot API.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold">
              Contact Support
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/docs" className="px-6 py-3 bg-slate-800/80 backdrop-blur-sm text-white rounded-lg hover:bg-slate-700 transition-all font-semibold border border-slate-700">
              Browse Documentation
            </Link>
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
            Start capturing screenshots today with our free tier - no credit card required.
          </p>
          <Link href="/login" className="relative inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg font-semibold overflow-hidden group bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">
            <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-20 blur-lg transition-opacity" />
            <span className="relative">Start Free Trial</span>
            <ArrowRight className="w-4 h-4 relative" />
          </Link>
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