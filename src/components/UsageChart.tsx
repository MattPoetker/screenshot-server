'use client'

import React, { useEffect, useState } from 'react'
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react'

interface ChartData {
  date: string
  requests: number
  successful: number
  failed: number
  avgProcessingTime: number
}

interface UsageChartProps {
  token: string | null
}

export default function UsageChart({ token }: UsageChartProps) {
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState(7) // Default to 7 days

  useEffect(() => {
    if (token) {
      loadChartData()
    }
  }, [token, period])

  const loadChartData = async () => {
    if (!token) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/usage-chart?days=${period}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const result = await response.json()
      
      if (response.ok && result.success) {
        setChartData(result.data)
      }
    } catch (error) {
      console.error('Failed to load chart data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate max value for scaling
  const maxValue = Math.max(...chartData.map(d => d.requests), 10)
  
  // Calculate trends
  const totalRequests = chartData.reduce((sum, d) => sum + d.requests, 0)
  const totalSuccessful = chartData.reduce((sum, d) => sum + d.successful, 0)
  const avgSuccessRate = totalRequests > 0 ? (totalSuccessful / totalRequests * 100).toFixed(1) : '0'
  
  // Compare with previous period
  const currentPeriodRequests = chartData.slice(-Math.ceil(period/2)).reduce((sum, d) => sum + d.requests, 0)
  const previousPeriodRequests = chartData.slice(0, Math.floor(period/2)).reduce((sum, d) => sum + d.requests, 0)
  const trend = previousPeriodRequests > 0 
    ? ((currentPeriodRequests - previousPeriodRequests) / previousPeriodRequests * 100).toFixed(1)
    : '0'

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Usage Over Time</h3>
          <p className="text-sm text-slate-600 mt-1">API requests and performance metrics</p>
        </div>
        
        <div className="flex gap-2">
          {[7, 14, 30].map((days) => (
            <button
              key={days}
              onClick={() => setPeriod(days)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                period === days
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {days}D
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-64 bg-slate-100 rounded-lg animate-pulse"></div>
      ) : chartData.length > 0 ? (
        <>
          {/* Chart */}
          <div className="h-64 relative">
            <div className="absolute inset-0 flex items-end justify-between gap-1 px-2">
              {chartData.map((data, index) => (
                <div 
                  key={index}
                  className="flex-1 flex flex-col items-center"
                  style={{ maxWidth: `${100 / chartData.length}%` }}
                >
                  <div className="w-full flex flex-col justify-end h-56 gap-1">
                    {/* Failed requests (red) */}
                    <div 
                      className="w-full bg-red-500 rounded-t transition-all duration-300 hover:bg-red-600"
                      style={{ 
                        height: `${(data.failed / maxValue) * 100}%`,
                        minHeight: data.failed > 0 ? '2px' : '0'
                      }}
                      title={`${data.failed} failed`}
                    />
                    {/* Successful requests (green) */}
                    <div 
                      className="w-full bg-emerald-500 rounded-t transition-all duration-300 hover:bg-emerald-600"
                      style={{ 
                        height: `${(data.successful / maxValue) * 100}%`,
                        minHeight: data.successful > 0 ? '2px' : '0'
                      }}
                      title={`${data.successful} successful`}
                    />
                  </div>
                  <div className="text-xs text-slate-600 mt-2 rotate-45 origin-left whitespace-nowrap">
                    {new Date(data.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 h-56 flex flex-col justify-between text-xs text-slate-500">
              <span>{maxValue}</span>
              <span>{Math.round(maxValue * 0.75)}</span>
              <span>{Math.round(maxValue * 0.5)}</span>
              <span>{Math.round(maxValue * 0.25)}</span>
              <span>0</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-200">
            <div>
              <div className="text-sm text-slate-600">Total Requests</div>
              <div className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                {totalRequests}
                {parseFloat(trend) > 0 ? (
                  <span className="text-xs text-emerald-600 flex items-center">
                    <TrendingUp className="w-3 h-3" />
                    {trend}%
                  </span>
                ) : parseFloat(trend) < 0 ? (
                  <span className="text-xs text-red-600 flex items-center">
                    <TrendingDown className="w-3 h-3" />
                    {Math.abs(parseFloat(trend))}%
                  </span>
                ) : null}
              </div>
            </div>
            
            <div>
              <div className="text-sm text-slate-600">Success Rate</div>
              <div className="text-xl font-semibold text-slate-900">
                {avgSuccessRate}%
              </div>
            </div>
            
            <div>
              <div className="text-sm text-slate-600">Failed</div>
              <div className="text-xl font-semibold text-slate-900">
                {chartData.reduce((sum, d) => sum + d.failed, 0)}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex gap-4 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-emerald-500 rounded"></div>
              <span className="text-slate-600">Successful</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-slate-600">Failed</span>
            </div>
          </div>
        </>
      ) : (
        <div className="h-64 bg-slate-100 rounded-lg flex items-center justify-center">
          <div className="text-slate-500 text-center">
            <BarChart3 className="w-12 h-12 mx-auto mb-2 text-slate-400" />
            <p>No usage data available</p>
            <p className="text-sm">Start making API requests to see metrics</p>
          </div>
        </div>
      )}
    </div>
  )
}