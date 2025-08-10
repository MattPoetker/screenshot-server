'use client'

import React, { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import ProtectedRoute from '@/components/ProtectedRoute'
import StatsCard from '@/components/StatsCard'
import UsageChart from '@/components/UsageChart'
import RecentActivity from '@/components/RecentActivity'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Camera, Key, TrendingUp, Clock, BarChart3, Activity } from 'lucide-react'

interface DashboardStats {
  totalRequests: number
  activeKeys: number
  successRate: number
  avgTime: number
  recentActivity: any[]
  trends?: {
    requests: string
    successRate: string
    responseTime: number
  }
}

function DashboardContent() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const { token } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (token) {
      loadDashboardData()
    }
  }, [token])

  const loadDashboardData = async () => {
    if (!token) return
    
    try {
      setLoading(true)
      
      // Load dashboard stats
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      const data = await response.json()
      
      if (response.ok) {
        setStats({
          totalRequests: data.totalRequests || 0,
          activeKeys: data.activeKeys || 0,
          successRate: data.successRate || 0,
          avgTime: data.avgProcessingTime || 0,
          recentActivity: data.recentActivity || [],
          trends: data.trends
        })
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      // Set default values on error
      setStats({
        totalRequests: 0,
        activeKeys: 0,
        successRate: 0,
        avgTime: 0,
        recentActivity: []
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">API Dashboard</h2>
          <p className="text-slate-600 font-medium">Monitor your screenshot API usage and performance</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => router.push('/api-keys')}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Key className="w-4 h-4" />
            Manage Keys
          </button>
          <button 
            onClick={() => router.push('/analytics')}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            View Analytics
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Requests"
          value={stats?.totalRequests || '-'}
          icon={Camera}
          iconColor="text-indigo-600"
          iconBgColor="bg-indigo-100"
          trend={stats?.trends ? { 
            value: `${parseFloat(stats.trends.requests) >= 0 ? '+' : ''}${stats.trends.requests}%`, 
            isPositive: parseFloat(stats.trends.requests) >= 0 
          } : undefined}
          loading={loading}
        />
        
        <StatsCard
          title="Active API Keys"
          value={stats?.activeKeys || '-'}
          icon={Key}
          iconColor="text-emerald-600"
          iconBgColor="bg-emerald-100"
          loading={loading}
        />
        
        <StatsCard
          title="Success Rate"
          value={stats ? `${stats.successRate}%` : '-'}
          icon={TrendingUp}
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
          trend={stats?.trends ? { 
            value: `${parseFloat(stats.trends.successRate) >= 0 ? '+' : ''}${stats.trends.successRate}%`, 
            isPositive: parseFloat(stats.trends.successRate) >= 0 
          } : undefined}
          loading={loading}
        />
        
        <StatsCard
          title="Avg Response Time"
          value={stats ? `${stats.avgTime}ms` : '-'}
          icon={Clock}
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
          trend={stats?.trends ? { 
            value: `${stats.trends.responseTime >= 0 ? '+' : ''}${stats.trends.responseTime}ms`, 
            isPositive: stats.trends.responseTime <= 0 
          } : undefined}
          loading={loading}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Usage Chart */}
          <UsageChart token={token} />

          {/* Recent Activity */}
          <RecentActivity 
            activities={stats?.recentActivity || []} 
            loading={loading} 
          />
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Quick Actions */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-900">Quick Actions</h3>
            </div>
            <div className="space-y-3">
              <button 
                onClick={() => router.push('/api-keys')}
                className="w-full flex items-center gap-3 p-3 text-left border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
                  <Key className="w-4 h-4" />
                </div>
                Create API Key
              </button>
              
              <button className="w-full flex items-center gap-3 p-3 text-left border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                <div className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
                Test API
              </button>
              
              <button className="w-full flex items-center gap-3 p-3 text-left border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-4 h-4" />
                </div>
                Download Report
              </button>
            </div>
          </div>

          {/* API Health */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-500" />
                API Health
              </h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">Uptime</span>
                <span className="text-sm font-semibold text-emerald-600">99.9%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">Rate Limit</span>
                <span className="text-sm font-semibold text-slate-900">1000/hr</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">Cache Hit Rate</span>
                <span className="text-sm font-semibold text-indigo-600">87%</span>
              </div>
              
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2 text-sm text-emerald-600">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  All systems operational
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}