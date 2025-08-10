'use client'

import React, { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import ProtectedRoute from '@/components/ProtectedRoute'
import PlanSelectionModal from '@/components/modals/PlanSelectionModal'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/Toast'
import { 
  CreditCard, 
  Calendar, 
  TrendingUp, 
  AlertCircle,
  ExternalLink,
  Zap,
  CheckCircle,
  XCircle,
  Clock,
  ArrowUpCircle,
  DollarSign
} from 'lucide-react'

interface Subscription {
  id: number
  planType: string
  status: string
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  trialEnd?: string
  stripeSubscriptionId?: string
}

interface BillingCycle {
  id: number
  planType: string
  includedScreenshots: number
  usedScreenshots: number
  overageScreenshots: number
  baseAmount: number
  overageAmount: number
  totalAmount: number
  billingPeriodStart: string
  billingPeriodEnd: string
  status: string
}

interface Usage {
  used: number
  included: number
  overage: number
  remaining: number
}

function BillingContent() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [billingCycle, setBillingCycle] = useState<BillingCycle | null>(null)
  const [usage, setUsage] = useState<Usage | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showPlanModal, setShowPlanModal] = useState(false)
  const { token } = useAuth()
  const { addToast } = useToast()

  useEffect(() => {
    if (token) {
      loadBillingData()
    }
  }, [token])

  const loadBillingData = async () => {
    if (!token) return
    
    try {
      setLoading(true)
      
      // Load subscription and usage data
      const [subscriptionRes, usageRes] = await Promise.all([
        fetch('/api/billing/subscription', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/billing/usage', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      const subscriptionData = await subscriptionRes.json()
      const usageData = await usageRes.json()

      if (subscriptionData.success) {
        setSubscription(subscriptionData.subscription)
      }

      if (usageData.success) {
        setBillingCycle(usageData.billingCycle)
        setUsage(usageData.usage)
      }

    } catch (error) {
      console.error('Failed to load billing data:', error)
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to load billing information'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubscriptionAction = async (action: 'cancel' | 'reactivate') => {
    if (!token || !subscription) return

    try {
      setActionLoading(true)
      
      const response = await fetch('/api/billing/subscription', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action })
      })

      const data = await response.json()
      
      if (data.success) {
        addToast({
          type: 'success',
          title: 'Success',
          message: action === 'cancel' 
            ? 'Subscription will be canceled at the end of the billing period'
            : 'Subscription has been reactivated'
        })
        await loadBillingData()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: `Failed to ${action} subscription`
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleCustomerPortal = async () => {
    if (!token) return

    try {
      const response = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/billing`
        })
      })

      const data = await response.json()
      
      if (data.success) {
        window.location.href = data.url
      } else if (response.status === 503) {
        addToast({
          type: 'error',
          title: 'Service Unavailable',
          message: 'Stripe billing is not configured yet. Please contact support.'
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to open customer portal'
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'trialing':
        return <Clock className="w-5 h-5 text-blue-500" />
      case 'past_due':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
      case 'canceled':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`
  }

  const getUsagePercentage = () => {
    if (!usage || usage.included === 0) return 0
    return Math.min((usage.used / usage.included) * 100, 100)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Billing & Usage</h2>
          <p className="text-slate-600 font-medium">Manage your subscription and track API usage</p>
        </div>
        
        <div className="flex gap-3">
          {(!subscription || subscription.planType === 'free') && (
            <button
              onClick={() => setShowPlanModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <ArrowUpCircle className="w-4 h-4" />
              Upgrade Plan
            </button>
          )}
          {subscription && subscription.planType !== 'free' && (
            <>
              <button
                onClick={() => setShowPlanModal(true)}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <ArrowUpCircle className="w-4 h-4" />
                Change Plan
              </button>
              <button 
                onClick={handleCustomerPortal}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <CreditCard className="w-4 h-4" />
                Manage Billing
                <ExternalLink className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Current Plan Card */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-slate-900">Current Plan</h3>
          {subscription && getStatusIcon(subscription.status)}
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <div className="text-2xl font-bold text-slate-900 capitalize">
              {subscription?.planType || 'Free'}
            </div>
            <div className="text-sm text-slate-600">
              Status: <span className="capitalize">{subscription?.status || 'Active'}</span>
            </div>
          </div>
          
          {subscription && (
            <div>
              <div className="text-sm text-slate-600 mb-1">Billing Period</div>
              <div className="font-medium">
                {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
              </div>
            </div>
          )}
          
          {billingCycle && (
            <div>
              <div className="text-sm text-slate-600 mb-1">Monthly Cost</div>
              <div className="font-medium text-xl">
                {formatCurrency(billingCycle.totalAmount)}
                {billingCycle.overageAmount > 0 && (
                  <span className="text-sm text-slate-600 ml-2">
                    (includes {formatCurrency(billingCycle.overageAmount)} overage)
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {subscription && subscription.cancelAtPeriodEnd && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">
                Your subscription will be canceled on {formatDate(subscription.currentPeriodEnd)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Usage Card */}
      {usage && (
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-6 mb-8">
          <h3 className="text-xl font-semibold text-slate-900 mb-6">Usage This Month</h3>
          
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-600">Screenshots Used</span>
              <span className="text-sm font-medium text-slate-900">
                {usage.used.toLocaleString()} / {usage.included.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${getUsagePercentage()}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="text-2xl font-bold text-slate-900">{usage.used.toLocaleString()}</div>
              <div className="text-sm text-slate-600">Used</div>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{usage.remaining.toLocaleString()}</div>
              <div className="text-sm text-slate-600">Remaining</div>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{usage.overage.toLocaleString()}</div>
              <div className="text-sm text-slate-600">Overage</div>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <div className="text-2xl font-bold text-slate-900">{usage.included.toLocaleString()}</div>
              <div className="text-sm text-slate-600">Included</div>
            </div>
          </div>

          {usage.overage > 0 && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2 text-orange-800">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">
                  You've used {usage.overage} screenshots beyond your plan limit this month
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Cards */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Upgrade Card */}
        {(!subscription || subscription.planType === 'free') && (
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
                <ArrowUpCircle className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Upgrade Your Plan</h3>
            </div>
            <p className="text-slate-600 mb-4">
              Get more screenshots, advanced features, and priority support with a paid plan.
            </p>
            <button
              onClick={() => setShowPlanModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Zap className="w-4 h-4" />
              Upgrade Now
            </button>
          </div>
        )}

        {/* Customer Portal Card */}
        {subscription && (
          <div className="bg-white/70 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Billing Management</h3>
            </div>
            <p className="text-slate-600 mb-4">
              Update payment methods, download invoices, and manage your subscription.
            </p>
            <div className="flex gap-2">
              <button 
                onClick={handleCustomerPortal}
                className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Open Portal
              </button>
              
              {subscription.cancelAtPeriodEnd ? (
                <button 
                  onClick={() => handleSubscriptionAction('reactivate')}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {actionLoading ? 'Processing...' : 'Reactivate'}
                </button>
              ) : (
                <button 
                  onClick={() => handleSubscriptionAction('cancel')}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {actionLoading ? 'Processing...' : 'Cancel'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Plan Selection Modal */}
      <PlanSelectionModal
        isOpen={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        currentPlan={subscription?.planType}
      />
    </DashboardLayout>
  )
}

export default function BillingPage() {
  return (
    <ProtectedRoute>
      <BillingContent />
    </ProtectedRoute>
  )
}