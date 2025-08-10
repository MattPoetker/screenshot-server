'use client'

import React from 'react'
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  iconColor: string
  iconBgColor: string
  trend?: {
    value: string
    isPositive: boolean
  }
  loading?: boolean
}

export default function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  iconColor, 
  iconBgColor, 
  trend, 
  loading = false 
}: StatsCardProps) {
  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 hover:border-slate-300/50 transition-all duration-200 hover:shadow-lg hover:bg-white/80">
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 ${iconBgColor} ${iconColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      
      <div className="mt-4">
        <h3 className="text-sm font-medium text-slate-600 mb-1">{title}</h3>
        <div className="text-2xl font-bold text-slate-900 mb-2">
          {loading ? (
            <div className="w-16 h-8 bg-slate-200 animate-pulse rounded"></div>
          ) : (
            value
          )}
        </div>
        
        {trend && !loading && (
          <div className={`flex items-center gap-1 text-xs ${
            trend.isPositive ? 'text-emerald-600' : 'text-red-600'
          }`}>
            {trend.isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>{trend.value}</span>
          </div>
        )}
      </div>
    </div>
  )
}