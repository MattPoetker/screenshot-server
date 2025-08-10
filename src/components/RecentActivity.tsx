'use client'

import React from 'react'
import { CheckCircle, XCircle, Clock, FileImage, User } from 'lucide-react'

interface Activity {
  id: number
  url: string
  format: string
  success: boolean
  created_at: string
  file_size: number
  api_key_name: string
  username?: string
}

interface RecentActivityProps {
  activities: Activity[]
  loading: boolean
}

export default function RecentActivity({ activities, loading }: RecentActivityProps) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const truncateUrl = (url: string, maxLength: number = 40) => {
    if (url.length <= maxLength) return url
    
    try {
      const urlObj = new URL(url)
      const domain = urlObj.hostname
      const path = urlObj.pathname + urlObj.search
      
      if (domain.length + path.length <= maxLength) {
        return `${domain}${path}`
      }
      
      const availableForPath = maxLength - domain.length - 3 // 3 for "..."
      if (availableForPath > 0) {
        return `${domain}${path.substring(0, availableForPath)}...`
      }
      
      return `${domain.substring(0, maxLength - 3)}...`
    } catch {
      return url.substring(0, maxLength - 3) + '...'
    }
  }

  if (loading) {
    return (
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-slate-900">Recent Activity</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
              <div className="w-8 h-8 bg-slate-200 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50">
      <div className="mb-6 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-900">Recent Activity</h3>
        <span className="text-sm text-slate-500">Last 10 requests</span>
      </div>
      
      {activities.length > 0 ? (
        <div className="space-y-2">
          {activities.map((activity) => (
            <div 
              key={activity.id}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group"
            >
              {/* Status Icon */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                activity.success 
                  ? 'bg-emerald-100 text-emerald-600' 
                  : 'bg-red-100 text-red-600'
              }`}>
                {activity.success ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 truncate" title={activity.url}>
                      {truncateUrl(activity.url)}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-600">
                      <span className="flex items-center gap-1">
                        <FileImage className="w-3 h-3" />
                        {activity.format.toUpperCase()}
                      </span>
                      <span>{formatFileSize(activity.file_size)}</span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {activity.api_key_name}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-xs text-slate-500 whitespace-nowrap flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTime(activity.created_at)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-slate-500">
          <FileImage className="w-12 h-12 mx-auto mb-2 text-slate-400" />
          <p>No recent activity</p>
          <p className="text-sm mt-1">API requests will appear here</p>
        </div>
      )}
    </div>
  )
}