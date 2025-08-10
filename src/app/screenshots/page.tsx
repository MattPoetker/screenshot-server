'use client'

import React, { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Image as ImageIcon, Filter, Grid3X3, List, Calendar, Clock, ExternalLink, Download, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { IMAGES_DIR } from '@/lib/config/storage'

interface Screenshot {
  id: number
  url: string
  file_path: string
  file_name: string
  format: 'png' | 'jpeg' | 'webp' | 'gif'
  width?: number
  height?: number
  success: boolean
  file_size?: number
  created_at: string
  api_key_name?: string
  username?: string
  processing_time?: number
  error_message?: string
}

type ViewMode = 'grid' | 'list'

function ScreenshotsPageContent() {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const { token } = useAuth()
  const limit = 20

  useEffect(() => {
    if (token) {
      loadScreenshots()
    }
  }, [page, token])

  const loadScreenshots = async () => {
    try {
      setLoading(true)
      
      const response = await fetch(`/api/admin/screenshots?page=${page}&limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const result = await response.json()
      
      if (response.ok && result.success) {
        setScreenshots(result.data.screenshots)
        setTotalPages(result.data.pagination.pages)
        setTotal(result.data.pagination.total)
      } else {
        console.error('Failed to load screenshots:', result.error)
      }
    } catch (error) {
      console.error('Failed to load screenshots:', error)
    } finally {
      setLoading(false)
    }
  }


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown'
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const ScreenshotCard = ({ screenshot }: { screenshot: Screenshot }) => {
    const imageUrl = `https://images.sitelaunch.io/images/${screenshot.file_name}`
    
    return (
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/50 hover:border-slate-300/50 transition-all duration-200 hover:shadow-lg group">
        {/* Image Preview */}
        <div className="relative aspect-video bg-slate-100 rounded-t-2xl overflow-hidden">
          <img 
            src={imageUrl} 
            alt={screenshot.url}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
              e.currentTarget.nextElementSibling?.classList.remove('hidden')
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center hidden">
            <ImageIcon className="w-12 h-12 text-slate-400" />
          </div>
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex gap-1">
              <a 
                href={imageUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 bg-white/90 hover:bg-white rounded-lg shadow-sm transition-colors"
              >
                <ExternalLink className="w-4 h-4 text-slate-600" />
              </a>
              <a 
                href={imageUrl} 
                download={screenshot.file_name}
                className="p-2 bg-white/90 hover:bg-white rounded-lg shadow-sm transition-colors"
              >
                <Download className="w-4 h-4 text-slate-600" />
              </a>
            </div>
          </div>
          
          {/* Status Badge */}
          <div className="absolute top-2 left-2">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              screenshot.success 
                ? 'bg-emerald-100 text-emerald-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {screenshot.success ? 'Success' : 'Failed'}
            </span>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-4">
          <div className="mb-3">
            <h3 className="font-semibold text-slate-900 text-sm truncate mb-1">
              {screenshot.url}
            </h3>
            <div className="flex items-center gap-4 text-xs text-slate-600">
              <span className="flex items-center gap-1">
                <ImageIcon className="w-3 h-3" />
                {screenshot.format.toUpperCase()}
              </span>
              {screenshot.width && screenshot.height && (
                <span>
                  {screenshot.width}×{screenshot.height}
                </span>
              )}
              {screenshot.file_size && (
                <span>
                  {formatFileSize(screenshot.file_size)}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Created</span>
              <div className="flex items-center gap-1 text-slate-900">
                <Calendar className="w-3 h-3" />
                {formatDate(screenshot.created_at)}
              </div>
            </div>
            
            {screenshot.api_key_name && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">API Key</span>
                <span className="text-slate-900 font-medium truncate max-w-24">
                  {screenshot.api_key_name}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const ScreenshotRow = ({ screenshot }: { screenshot: Screenshot }) => {
    const imageUrl = `https://images.sitelaunch.io/images/${screenshot.file_name}`
    
    return (
      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-slate-200/50 hover:border-slate-300/50 transition-all duration-200 hover:shadow-md group">
        <div className="flex items-center gap-4">
          {/* Thumbnail */}
          <div className="w-16 h-12 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
            <img 
              src={imageUrl} 
              alt={screenshot.url}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                e.currentTarget.nextElementSibling?.classList.remove('hidden')
              }}
            />
            <ImageIcon className="w-6 h-6 text-slate-400 hidden" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-slate-900 truncate mb-1">
                  {screenshot.url}
                </h3>
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <span className="flex items-center gap-1">
                    <ImageIcon className="w-3 h-3" />
                    {screenshot.format.toUpperCase()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(screenshot.created_at)}
                  </span>
                  {screenshot.api_key_name && (
                    <span className="text-indigo-600">
                      {screenshot.api_key_name}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  screenshot.success 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {screenshot.success ? 'Success' : 'Failed'}
                </span>
                
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a 
                    href={imageUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 text-slate-600" />
                  </a>
                  <a 
                    href={imageUrl} 
                    download={screenshot.file_name}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4 text-slate-600" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Screenshots</h2>
          <p className="text-slate-600">Browse and manage your screenshots</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <button 
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            {viewMode === 'grid' ? (
              <>
                <List className="w-4 h-4" />
                List View
              </>
            ) : (
              <>
                <Grid3X3 className="w-4 h-4" />
                Grid View
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Format</label>
              <select className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                <option value="">All formats</option>
                <option value="png">PNG</option>
                <option value="jpeg">JPEG</option>
                <option value="webp">WebP</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
              <select className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                <option value="">All statuses</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Date Range</label>
              <select className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                <option value="">All time</option>
                <option value="today">Today</option>
                <option value="week">This week</option>
                <option value="month">This month</option>
              </select>
            </div>
            <div className="flex items-end">
              <button className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm">
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Screenshots Grid/List */}
      {loading ? (
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          : "space-y-4"
        }>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-white/70 rounded-2xl border border-slate-200/50">
              <div className="animate-pulse">
                {viewMode === 'grid' ? (
                  <>
                    <div className="aspect-video bg-slate-200 rounded-t-2xl"></div>
                    <div className="p-4">
                      <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/2 mb-3"></div>
                      <div className="space-y-2">
                        <div className="h-3 bg-slate-200 rounded"></div>
                        <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-4 flex items-center gap-4">
                    <div className="w-16 h-12 bg-slate-200 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : screenshots.length > 0 ? (
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          : "space-y-4"
        }>
          {screenshots.map((screenshot) => (
            viewMode === 'grid' ? (
              <ScreenshotCard key={screenshot.id} screenshot={screenshot} />
            ) : (
              <ScreenshotRow key={screenshot.id} screenshot={screenshot} />
            )
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No screenshots found</h3>
          <p className="text-slate-600">Screenshots will appear here once you start using the NiceShot API</p>
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between">
          <div className="text-sm text-slate-600">
            Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} screenshots
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber
                if (totalPages <= 5) {
                  pageNumber = i + 1
                } else if (page <= 3) {
                  pageNumber = i + 1
                } else if (page >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i
                } else {
                  pageNumber = page - 2 + i
                }
                
                return (
                  <button
                    key={pageNumber}
                    onClick={() => setPage(pageNumber)}
                    className={`px-3 py-1 rounded-lg transition-colors ${
                      page === pageNumber
                        ? 'bg-indigo-600 text-white'
                        : 'border border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {pageNumber}
                  </button>
                )
              })}
            </div>
            
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default function ScreenshotsPage() {
  return (
    <ProtectedRoute>
      <ScreenshotsPageContent />
    </ProtectedRoute>
  )
}