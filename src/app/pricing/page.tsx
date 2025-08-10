'use client'

import React from 'react'
import Link from 'next/link'
import { 
  Camera, 
  Check, 
  X,
  Zap, 
  Shield, 
  Globe,
  Star,
  ArrowRight,
  ChevronRight,
  Github,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

const pricingTiers = [
  {
    name: 'Free',
    price: 0,
    description: 'Perfect for getting started and small projects',
    features: [
      '500 screenshots per month',
      'Basic API access',
      'PNG and JPEG formats',
      'Standard resolution up to 1920x1080',
      'Email support',
      '30-day screenshot retention'
    ],
    limitations: [
      'No GIF animations',
      'No batch processing', 
      'No webhook notifications',
      'Community support only'
    ],
    cta: 'Get Started Free',
    ctaLink: '/login',
    popular: false,
    planId: 'free' as const
  },
  {
    name: 'Pro',
    price: 29,
    description: 'For professional developers and growing teams',
    features: [
      '5,000 screenshots per month',
      'All image formats (PNG, JPEG, WebP, GIF)',
      'Custom viewport dimensions',
      'Batch processing up to 10 URLs',
      'Webhook notifications',
      'Priority email support',
      '90-day screenshot retention',
      'Basic analytics dashboard'
    ],
    limitations: [
      'Limited to 10 concurrent requests',
      'No white-label options'
    ],
    cta: 'Start Pro Trial',
    ctaLink: '/login',
    popular: true,
    planId: 'pro' as const
  },
  {
    name: 'Enterprise',
    price: 99,
    description: 'For large-scale applications and businesses',
    features: [
      '100,000 screenshots per month',
      'All Pro features included',
      'Custom integrations',
      'Dedicated support manager',
      'SLA guarantees (99.9% uptime)',
      '1-year screenshot retention',
      'Advanced analytics & reporting',
      'White-label options available',
      'Unlimited concurrent requests',
      'Custom rate limits'
    ],
    limitations: [],
    cta: 'Contact Sales',
    ctaLink: '/contact',
    popular: false,
    planId: 'enterprise' as const
  }
]

const faqs = [
  {
    question: 'How does the screenshot limit work?',
    answer: 'Screenshot limits reset monthly on your billing cycle date. If you exceed your limit, additional screenshots are charged at $0.01 per screenshot for Pro plans and $0.005 for Enterprise plans.'
  },
  {
    question: 'What happens if I need more screenshots?',
    answer: 'You can upgrade your plan at any time, and the change will take effect immediately. Overage charges are automatically applied if you exceed your monthly limit.'
  },
  {
    question: 'Do you offer refunds?',
    answer: 'Yes, we offer a 30-day money-back guarantee for all paid plans. If you\'re not satisfied, contact us within 30 days of your purchase for a full refund.'
  },
  {
    question: 'Can I change my plan anytime?',
    answer: 'Absolutely! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and billing is prorated accordingly.'
  },
  {
    question: 'What formats do you support?',
    answer: 'We support PNG, JPEG, WebP, and GIF formats. Free plans include PNG and JPEG, while paid plans include all formats including animated GIFs for scrolling captures.'
  },
  {
    question: 'Is there an API rate limit?',
    answer: 'Yes, rate limits vary by plan: Free (10 requests/minute), Pro (100 requests/minute), Enterprise (custom limits). These limits ensure fair usage and optimal performance.'
  },
  {
    question: 'Do you offer enterprise discounts?',
    answer: 'Yes! We offer volume discounts for Enterprise customers with high-volume requirements. Contact our sales team to discuss custom pricing.'
  },
  {
    question: 'How long are screenshots stored?',
    answer: 'Screenshot retention varies by plan: Free (30 days), Pro (90 days), Enterprise (1 year). You can also download and store screenshots on your own infrastructure.'
  }
]

export default function PricingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const [expandedFaq, setExpandedFaq] = React.useState<number | null>(null)
  const [loadingPlan, setLoadingPlan] = React.useState<string | null>(null)

  const handlePlanSelection = async (planId: string) => {
    if (planId === 'free') {
      // Redirect to signup for free plan
      window.location.href = '/login'
      return
    }

    if (planId === 'enterprise') {
      // Redirect to contact for enterprise
      window.location.href = '/contact'
      return
    }

    // Handle Pro plan with Stripe Checkout
    setLoadingPlan(planId)
    
    try {
      const response = await fetch('/api/billing/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planType: planId,
          successUrl: `${window.location.origin}/billing?success=true`,
          cancelUrl: `${window.location.origin}/pricing?canceled=true`
        })
      })

      const data = await response.json()
      
      if (data.success && data.url) {
        window.location.href = data.url
      } else if (response.status === 503) {
        // Stripe not configured
        alert('Stripe billing is not yet configured. Please contact support to set up payments.')
      } else {
        // If not authenticated, redirect to login
        window.location.href = '/login'
      }
    } catch (error) {
      console.error('Error creating checkout:', error)
      alert('Unable to process payment at this time. Please try again later.')
    } finally {
      setLoadingPlan(null)
    }
  }

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
            <Link href="/pricing" className="text-white px-4 py-2 rounded bg-indigo-600 md:bg-transparent md:text-indigo-400 transition-colors">
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
          Simple, Transparent Pricing<span className="text-indigo-500">.</span>
        </h1>
        <h2 className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-8">
          Choose the perfect plan for your screenshot needs. Start free and scale as you grow.
        </h2>
        
        {/* Feature badges */}
        <div className="flex flex-wrap gap-3 justify-center mb-12">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <Zap className="w-4 h-4 text-yellow-500" />
            No Setup Fees
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <Shield className="w-4 h-4 text-green-500" />
            30-Day Money Back
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <Globe className="w-4 h-4 text-blue-500" />
            Cancel Anytime
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 mt-16">
        <div className="grid lg:grid-cols-3 gap-8">
          {pricingTiers.map((tier, index) => (
            <div key={index} className={`relative bg-slate-900/50 backdrop-blur border rounded-2xl p-8 ${
              tier.popular 
                ? 'border-indigo-500/50 ring-1 ring-indigo-500/20' 
                : 'border-slate-800 hover:border-slate-700'
            } transition-colors`}>
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    Most Popular
                  </div>
                </div>
              )}
              
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">{tier.name}</h3>
                <div className="flex items-center justify-center mb-4">
                  <span className="text-4xl font-bold text-white">${tier.price}</span>
                  <span className="text-slate-400 ml-2">/month</span>
                </div>
                <p className="text-slate-400 text-sm">{tier.description}</p>
              </div>

              {/* Features */}
              <div className="space-y-4 mb-8">
                {tier.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-300 text-sm">{feature}</span>
                  </div>
                ))}
                {tier.limitations.map((limitation, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <X className="w-5 h-5 text-slate-500 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-500 text-sm">{limitation}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <button
                onClick={() => handlePlanSelection(tier.planId)}
                disabled={loadingPlan === tier.planId}
                className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 ${
                  tier.popular
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-white'
                }`}
              >
                {loadingPlan === tier.planId ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {tier.cta}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Enterprise Features */}
      <div className="mt-32 max-w-7xl mx-auto px-4">
        <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl border border-indigo-500/20 p-8 md:p-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Need Something Custom?
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              We work with enterprise customers to build custom solutions tailored to your specific needs.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-indigo-500" />
              </div>
              <h4 className="text-white font-semibold mb-2">Custom SLAs</h4>
              <p className="text-slate-400 text-sm">Guaranteed uptime and performance metrics</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Globe className="w-6 h-6 text-green-500" />
              </div>
              <h4 className="text-white font-semibold mb-2">Dedicated Infrastructure</h4>
              <p className="text-slate-400 text-sm">Private servers in your preferred regions</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-purple-500" />
              </div>
              <h4 className="text-white font-semibold mb-2">Volume Discounts</h4>
              <p className="text-slate-400 text-sm">Special pricing for high-volume usage</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Star className="w-6 h-6 text-yellow-500" />
              </div>
              <h4 className="text-white font-semibold mb-2">White Label</h4>
              <p className="text-slate-400 text-sm">Branded API endpoints and documentation</p>
            </div>
          </div>
          
          <div className="text-center mt-8">
            <Link href="/contact" className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold">
              Contact Sales
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mt-32 max-w-4xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-400">
            Everything you need to know about our pricing and plans
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-slate-800/50 transition-colors"
              >
                <span className="text-white font-semibold">{faq.question}</span>
                {expandedFaq === index ? (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </button>
              {expandedFaq === index && (
                <div className="px-6 pb-4">
                  <p className="text-slate-400">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="mt-32 px-4 pb-24">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-slate-400 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of developers using our API. Start with our free plan and upgrade as you grow.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login" className="px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold flex items-center justify-center gap-2">
              Start Free Trial
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/contact" className="px-8 py-4 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors font-semibold">
              Talk to Sales
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