'use client'

import React, { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { X, CreditCard, Lock, Check } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/Toast'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface PaymentMethodModalProps {
  isOpen: boolean
  onClose: () => void
  planType: string
  planName: string
  planPrice: string
  onSuccess: () => void
}

function PaymentForm({ planType, planName, planPrice, onSuccess, onClose }: Omit<PaymentMethodModalProps, 'isOpen'>) {
  const stripe = useStripe()
  const elements = useElements()
  const { token } = useAuth()
  const { addToast } = useToast()
  const [processing, setProcessing] = useState(false)
  const [clientSecret, setClientSecret] = useState('')

  useEffect(() => {
    // Create Setup Intent when component mounts
    const createSetupIntent = async () => {
      if (!token) return

      try {
        const response = await fetch('/api/billing/setup-intent', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        const data = await response.json()
        
        if (data.success) {
          setClientSecret(data.clientSecret)
        } else {
          addToast({
            type: 'error',
            title: 'Error',
            message: 'Failed to initialize payment setup'
          })
        }
      } catch (error) {
        console.error('Setup intent error:', error)
        addToast({
          type: 'error',
          title: 'Error',
          message: 'Failed to connect to payment service'
        })
      }
    }

    createSetupIntent()
  }, [token, addToast])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements || !clientSecret) {
      return
    }

    setProcessing(true)

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      setProcessing(false)
      return
    }

    // Confirm the setup intent
    const { error, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
      payment_method: {
        card: cardElement,
      },
    })

    if (error) {
      addToast({
        type: 'error',
        title: 'Payment Error',
        message: error.message || 'Failed to save payment method'
      })
      setProcessing(false)
      return
    }

    if (setupIntent && setupIntent.payment_method) {
      // Create subscription with the saved payment method
      try {
        const response = await fetch('/api/billing/create-subscription', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentMethodId: setupIntent.payment_method,
            planType: planType,
          }),
        })

        const data = await response.json()
        
        if (data.success) {
          addToast({
            type: 'success',
            title: 'Success!',
            message: `You've been upgraded to the ${planName} plan`
          })
          onSuccess()
          onClose()
        } else {
          addToast({
            type: 'error',
            title: 'Subscription Error',
            message: data.error || 'Failed to create subscription'
          })
        }
      } catch (error) {
        addToast({
          type: 'error',
          title: 'Error',
          message: 'Failed to complete subscription setup'
        })
      }
    }

    setProcessing(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Plan Summary */}
      <div className="bg-slate-50 rounded-lg p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-slate-600">Plan</span>
          <span className="font-semibold text-slate-900">{planName}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-600">Monthly Price</span>
          <span className="font-semibold text-slate-900">{planPrice}</span>
        </div>
      </div>

      {/* Card Input */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Card Information
        </label>
        <div className="border border-slate-300 rounded-lg p-3 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#1e293b',
                  '::placeholder': {
                    color: '#94a3b8',
                  },
                },
                invalid: {
                  color: '#ef4444',
                },
              },
            }}
          />
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Your card will be charged {planPrice} monthly starting today.
        </p>
      </div>

      {/* Security Notice */}
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <Lock className="w-4 h-4" />
        <span>Your payment info is secure and encrypted by Stripe</span>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {processing ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4" />
            Subscribe to {planName}
          </>
        )}
      </button>
    </form>
  )
}

export default function PaymentMethodModal({ isOpen, onClose, planType, planName, planPrice, onSuccess }: PaymentMethodModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Add Payment Method</h2>
            <p className="text-sm text-slate-600 mt-1">Enter your card details to start subscription</p>
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
          <Elements stripe={stripePromise}>
            <PaymentForm
              planType={planType}
              planName={planName}
              planPrice={planPrice}
              onSuccess={onSuccess}
              onClose={onClose}
            />
          </Elements>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <div className="space-y-2 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <Check className="w-3 h-3 text-green-500" />
              <span>Cancel anytime from your billing dashboard</span>
            </div>
            <div className="flex items-center gap-1">
              <Check className="w-3 h-3 text-green-500" />
              <span>30-day money-back guarantee</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}