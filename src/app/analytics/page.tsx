'use client'

import React, { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { TrendingUp, BarChart3, PieChart, Calendar, Download, Users, Zap } from 'lucide-react'

interface AnalyticsData {
  usageByDate: Array<{
    date: string
    total: number
    successful: number
    failed: number
    avgProcessingTime: number
  }>
  formatDistribution: Array<{
    format: string
    count: number
    percentage: number
  }>
  topApiKeys: Array<{
    name: string
    requests: number
    successRate: number
  }>
  performanceMetrics: {
    avgResponseTime: number
    p95ResponseTime: number
    errorRate: number
    throughput: number
  }
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30')

  useEffect(() => {
    loadAnalyticsData()
  }, [timeRange])

  const loadAnalyticsData = async () => {
    try {
      setLoading(true)
      
      // Simulate API call with mock data for now
      // In a real implementation, this would fetch from your analytics API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setAnalyticsData({
        usageByDate: [
          { date: '2024-01-01', total: 150, successful: 145, failed: 5, avgProcessingTime: 1200 },
          { date: '2024-01-02', total: 200, successful: 192, failed: 8, avgProcessingTime: 1150 },
          { date: '2024-01-03', total: 180, successful: 175, failed: 5, avgProcessingTime: 1300 },
          { date: '2024-01-04', total: 220, successful: 210, failed: 10, avgProcessingTime: 1100 },
          { date: '2024-01-05', total: 190, successful: 185, failed: 5, avgProcessingTime: 1250 },
        ],
        formatDistribution: [
          { format: 'png', count: 450, percentage: 65.2 },
          { format: 'jpeg', count: 180, percentage: 26.1 },
          { format: 'webp', count: 60, percentage: 8.7 }
        ],
        topApiKeys: [
          { name: 'Production API', requests: 340, successRate: 98.5 },
          { name: 'Development Key', requests: 180, successRate: 95.2 },
          { name: 'Testing Environment', requests: 120, successRate: 96.8 }
        ],
        performanceMetrics: {
          avgResponseTime: 1180,
          p95ResponseTime: 2100,
          errorRate: 3.2,
          throughput: 24.5
        }
      })
    } catch (error) {
      console.error('Failed to load analytics data:', error)
    } finally {
      setLoading(false)
    }
  }


  const MetricCard = ({ 
    title, 
    value, 
    unit, 
    icon: Icon, 
    trend, 
    trendColor,
    loading 
  }: {
    title: string
    value: string | number
    unit?: string
    icon: any
    trend?: string
    trendColor?: string
    loading?: boolean
  }) => (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span className={`text-sm font-medium ${trendColor || 'text-emerald-600'}`}>
            {trend}
          </span>
        )}
      </div>
      <div>
        <h3 className="text-sm font-medium text-slate-600 mb-1">{title}</h3>
        <div className="text-2xl font-bold text-slate-900">
          {loading ? (
            <div className="w-16 h-8 bg-slate-200 animate-pulse rounded"></div>
          ) : (
            <>
              {value}
              {unit && <span className="text-sm font-normal text-slate-600 ml-1">{unit}</span>}
            </>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Analytics</h2>
          <p className="text-slate-600">Detailed usage analytics and insights</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Avg Response Time"
          value={analyticsData?.performanceMetrics.avgResponseTime || 0}
          unit="ms"
          icon={Zap}
          trend="-5.2%"
          trendColor="text-emerald-600"
          loading={loading}
        />
        <MetricCard
          title="95th Percentile"
          value={analyticsData?.performanceMetrics.p95ResponseTime || 0}
          unit="ms"
          icon={TrendingUp}
          trend="+2.1%"
          trendColor="text-amber-600"
          loading={loading}
        />
        <MetricCard
          title="Error Rate"
          value={analyticsData?.performanceMetrics.errorRate || 0}
          unit="%"
          icon={BarChart3}
          trend="-0.8%"
          trendColor="text-emerald-600"
          loading={loading}
        />
        <MetricCard
          title="Throughput"
          value={analyticsData?.performanceMetrics.throughput || 0}
          unit="req/min"
          icon={Users}
          trend="+12.5%"
          trendColor="text-emerald-600"
          loading={loading}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* Usage Trends Chart */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Usage Trends</h3>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <span className="text-slate-600">Success</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-slate-600">Failed</span>
              </div>
            </div>
          </div>
          
          {loading ? (
            <div className="h-64 bg-slate-100 animate-pulse rounded-lg"></div>
          ) : (
            <div className="h-64 flex items-end justify-between gap-2">
              {analyticsData?.usageByDate.map((day, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-slate-100 rounded-t flex flex-col justify-end" style={{ height: '200px' }}>
                    <div 
                      className="bg-emerald-500 rounded-t w-full"
                      style={{ height: `${(day.successful / day.total) * 180}px` }}
                    ></div>
                    <div 
                      className="bg-red-500 w-full"
                      style={{ height: `${(day.failed / day.total) * 180}px` }}
                    ></div>
                  </div>
                  <span className="text-xs text-slate-600 font-medium">
                    {new Date(day.date).getDate()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Format Distribution */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Format Distribution</h3>
          </div>
          
          {loading ? (
            <div className="h-64 bg-slate-100 animate-pulse rounded-lg"></div>
          ) : (
            <div className="space-y-4">
              {analyticsData?.formatDistribution.map((format, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-16 text-sm font-medium text-slate-700 uppercase">
                    {format.format}
                  </div>
                  <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        index === 0 ? 'bg-indigo-500' :
                        index === 1 ? 'bg-emerald-500' :
                        'bg-amber-500'
                      }`}
                      style={{ width: `${format.percentage}%` }}
                    ></div>
                  </div>
                  <div className="w-16 text-sm text-slate-600 text-right">
                    {format.percentage}%
                  </div>
                  <div className="w-12 text-sm text-slate-900 font-medium text-right">
                    {format.count}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top API Keys */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-slate-900">Top API Keys</h3>
          <p className="text-sm text-slate-600 mt-1">Performance by API key over the selected time period</p>
        </div>
        
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center gap-4 p-4 border border-slate-200 rounded-lg">
                  <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                  <div className="flex-1 h-4 bg-slate-200 rounded"></div>
                  <div className="h-4 bg-slate-200 rounded w-16"></div>
                  <div className="h-4 bg-slate-200 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {analyticsData?.topApiKeys.map((apiKey, index) => (
              <div key={index} className="flex items-center gap-4 p-4 border border-slate-200 rounded-lg hover:bg-slate-50/50 transition-colors">
                <div className="flex-1">
                  <h4 className="font-medium text-slate-900">{apiKey.name}</h4>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-slate-900">{apiKey.requests.toLocaleString()}</div>
                  <div className="text-xs text-slate-600">requests</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-emerald-600">{apiKey.successRate}%</div>
                  <div className="text-xs text-slate-600">success rate</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}