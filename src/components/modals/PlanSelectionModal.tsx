'use client'

import React, { useState } from 'react'
import { X, Check, Zap, Star, ArrowRight, CreditCard } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/Toast'
import PaymentMethodModal from './PaymentMethodModal'

interface Plan {
  id: string
  name: string
  price: number
  priceFormatted: string
  screenshots: number
  features: string[]
  popular?: boolean
  overage?: {
    price: number
    priceFormatted: string
  }
}

interface PlanSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  currentPlan?: string
}

export default function PlanSelectionModal({ isOpen, onClose, currentPlan }: PlanSelectionModalProps) {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const { token } = useAuth()
  const { addToast } = useToast()

  React.useEffect(() => {
    if (isOpen) {
      loadPlans()
    }
  }, [isOpen])

  const loadPlans = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/billing/plans', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      const data = await response.json()
      
      if (data.success) {
        // Filter out free plan for upgrade modal
        setPlans(data.plans.filter((plan: Plan) => plan.id !== 'free'))
      }
    } catch (error) {
      console.error('Failed to load plans:', error)
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to load pricing plans'
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePlanSelect = (plan: Plan) => {
    if (!token) {
      addToast({
        type: 'error',
        title: 'Authentication Required',
        message: 'Please log in to upgrade your plan'
      })
      return
    }

    setSelectedPlan(plan)
    setShowPaymentModal(true)
  }

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false)
    setSelectedPlan(null)
    onClose()
    // Reload the page to refresh subscription status
    window.location.reload()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Upgrade Your Plan</h2>
            <p className="text-slate-600 mt-1">Choose the plan that fits your needs</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative bg-slate-50 border-2 rounded-xl p-6 transition-all ${
                    plan.popular
                      ? 'border-indigo-500 ring-1 ring-indigo-500/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        Most Popular
                      </div>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                    <div className="flex items-center justify-center mb-2">
                      <span className="text-3xl font-bold text-slate-900">{plan.priceFormatted}</span>
                      <span className="text-slate-600 ml-2">/month</span>
                    </div>
                    <p className="text-sm text-slate-600">
                      {plan.screenshots.toLocaleString()} screenshots included
                    </p>
                  </div>

                  {/* Features */}
                  <div className="space-y-3 mb-6">
                    {plan.features.slice(0, 6).map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-slate-700">{feature}</span>
                      </div>
                    ))}
                    
                    {plan.overage && (
                      <div className="flex items-start gap-3">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-slate-700">
                          Overage billing at {plan.overage.priceFormatted}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => handlePlanSelect(plan)}
                    disabled={currentPlan === plan.id}
                    className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
                      currentPlan === plan.id
                        ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                        : plan.popular
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-white'
                    }`}
                  >
                    {currentPlan === plan.id ? (
                      'Current Plan'
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        Upgrade to {plan.name}
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>30-day money-back guarantee</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>Cancel anytime from your billing dashboard</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Check className="w-4 h-4 text-green-500" />
              <span>Secure payments powered by Stripe</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Method Modal */}
      {selectedPlan && (
        <PaymentMethodModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false)
            setSelectedPlan(null)
          }}
          planType={selectedPlan.id}
          planName={selectedPlan.name}
          planPrice={selectedPlan.priceFormatted + '/month'}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  )
}