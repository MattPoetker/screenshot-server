'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { 
  Camera, 
  Mail,
  MessageSquare,
  Phone,
  MapPin,
  Send,
  Clock,
  CheckCircle,
  ArrowRight,
  Twitter,
  Linkedin
} from 'lucide-react'

export default function ContactPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    subject: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setIsSubmitting(false)
    setSubmitted(true)
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setSubmitted(false)
      setFormData({
        name: '',
        email: '',
        company: '',
        subject: '',
        message: ''
      })
    }, 3000)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const contactMethods = [
    {
      icon: Mail,
      title: "Email Support",
      description: "Get help from our support team",
      contact: "support@nice-shot.io",
      iconColor: "text-blue-600",
      iconBgColor: "bg-blue-100"
    },
    {
      icon: MessageSquare,
      title: "Sales Inquiries",
      description: "Questions about pricing or enterprise plans",
      contact: "sales@nice-shot.io",
      iconColor: "text-green-600",
      iconBgColor: "bg-green-100"
    },
    {
      icon: Phone,
      title: "Enterprise Support",
      description: "Priority support for enterprise customers",
      contact: "Schedule a call",
      iconColor: "text-purple-600",
      iconBgColor: "bg-purple-100"
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
          Contact Us<span className="text-indigo-500">.</span>
        </h1>
        <h2 className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-12">
          Have questions about NiceShot API? Need help with integration? Want to discuss enterprise plans? We're here to help.
        </h2>
      </div>

      {/* Contact Methods */}
      <div className="max-w-7xl mx-auto px-4 mt-16">
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {contactMethods.map((method, index) => (
            <div key={index} className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl p-8 text-center hover:border-indigo-500/50 transition-all">
              <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${method.iconBgColor} ${method.iconColor} mx-auto mb-6`}>
                <method.icon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">{method.title}</h3>
              <p className="text-slate-400 mb-4">{method.description}</p>
              <div className="text-indigo-400 font-semibold">{method.contact}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Form */}
      <div className="max-w-4xl mx-auto px-4 mt-16">
        <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl p-8 md:p-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Send us a Message</h2>
            <p className="text-slate-400">
              Fill out the form below and we'll get back to you within 24 hours
            </p>
          </div>

          {submitted ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-white mb-4">Message Sent!</h3>
              <p className="text-slate-400">
                Thank you for contacting us. We'll get back to you within 24 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-white mb-2">
                    Company
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Acme Corp"
                  />
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-white mb-2">
                    Subject *
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Select a subject</option>
                    <option value="general">General Inquiry</option>
                    <option value="support">Technical Support</option>
                    <option value="sales">Sales & Pricing</option>
                    <option value="enterprise">Enterprise Plans</option>
                    <option value="partnership">Partnership</option>
                    <option value="billing">Billing Question</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-white mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={6}
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Tell us how we can help you..."
                />
              </div>

              <div className="text-center">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Message
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto px-4 mt-32">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-400">
            Common questions about NiceShot API
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-3">How quickly do you respond to support requests?</h3>
            <p className="text-slate-400">We typically respond to all support requests within 24 hours. Enterprise customers receive priority support with faster response times.</p>
          </div>
          
          <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-3">Do you offer custom enterprise solutions?</h3>
            <p className="text-slate-400">Yes! We work with enterprise customers to create custom solutions, dedicated infrastructure, and volume pricing. Contact our sales team to discuss your requirements.</p>
          </div>
          
          <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-3">Can I schedule a demo or consultation?</h3>
            <p className="text-slate-400">Absolutely! We'd be happy to schedule a demo to show you how NiceShot API can work for your specific use case. Contact us using the form above or email sales@nice-shot.io.</p>
          </div>
        </div>
      </div>

      {/* Response Time */}
      <div className="max-w-4xl mx-auto px-4 mt-16">
        <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl border border-indigo-500/20 p-8 text-center">
          <Clock className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Quick Response Times</h3>
          <p className="text-slate-400">
            We pride ourselves on quick response times. Most inquiries are answered within a few hours during business hours.
          </p>
        </div>
      </div>

      {/* CTA Section */}
      <div className="mt-32 px-4 pb-24">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-slate-400 text-lg mb-8 max-w-2xl mx-auto">
            Don't have questions? Jump right in and start capturing screenshots with our free tier.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login" className="relative inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg font-semibold overflow-hidden group bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">
              <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-20 blur-lg transition-opacity" />
              <span className="relative">Start Free Trial</span>
              <ArrowRight className="w-4 h-4 relative" />
            </Link>
            <Link href="/docs" className="px-8 py-4 bg-slate-800/80 backdrop-blur-sm text-white rounded-lg hover:bg-slate-700 transition-all hover:scale-105 font-semibold border border-slate-700">
              View Documentation
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