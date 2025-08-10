'use client'

import React, { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import CreateApiKeyModal from '@/components/modals/CreateApiKeyModal'
import ApiKeySuccessModal from '@/components/modals/ApiKeySuccessModal'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/contexts/AuthContext'
import { Key, Plus, Edit, Trash2, Eye, EyeOff, Calendar, Zap, Copy, Check } from 'lucide-react'

interface ApiKey {
  id: number
  key_id: string
  name: string
  description?: string
  rate_limit: number
  is_active: boolean
  expires_at?: string
  created_at: string
  created_by_username?: string
  api_key?: string // Full key returned after creation
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [newApiKey, setNewApiKey] = useState<any>(null)
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null)
  const { addToast } = useToast()
  const { token } = useAuth()

  useEffect(() => {
    if (token) {
      loadApiKeys()
    }
  }, [token])

  const loadApiKeys = async () => {
    if (!token) {
      console.log('No token available for loadApiKeys')
      return
    }
    
    try {
      setLoading(true)
      console.log('Loading API keys...')
      const response = await fetch('/api/admin/api-keys', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      const data = await response.json()
      console.log('API keys response:', { status: response.status, data })
      
      if (response.ok) {
        console.log('Setting API keys:', data.apiKeys || [])
        setApiKeys(data.apiKeys || [])
      } else {
        console.error('Failed to load API keys:', data)
        addToast({
          type: 'error',
          title: 'Failed to load API keys',
          message: data.error || 'Unknown error occurred'
        })
      }
    } catch (error) {
      console.error('Error loading API keys:', error)
      addToast({
        type: 'error',
        title: 'Failed to load API keys',
        message: error instanceof Error ? error.message : 'Network error'
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string, keyId: string) => {
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
      } else {
        // Fallback for non-HTTPS environments
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        
        const successful = document.execCommand('copy')
        document.body.removeChild(textArea)
        
        if (!successful) {
          throw new Error('Fallback copy failed')
        }
      }
      
      setCopiedKeyId(keyId)
      setTimeout(() => setCopiedKeyId(null), 2000)
      
      addToast({
        type: 'success',
        title: 'Copied!',
        message: 'API key copied to clipboard'
      })
    } catch (error) {
      // Final fallback - show the text so user can manually copy
      prompt('Copy this API key (Ctrl+C):', text)
    }
  }

  const deleteApiKey = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete the API key "${name}"? This action cannot be undone.`)) {
      return
    }

    if (!token) return

    try {
      const response = await fetch(`/api/admin/api-keys/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        setApiKeys(prev => prev.filter(key => key.id !== id))
        addToast({
          type: 'success',
          title: 'API Key Deleted',
          message: `Successfully deleted "${name}"`
        })
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete API key')
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Failed to delete API key',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    }
  }


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const ApiKeyCard = ({ apiKey }: { apiKey: ApiKey }) => {
    const [showActions, setShowActions] = useState(false)
    const [showKey, setShowKey] = useState(false)

    return (
      <div 
        className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/50 hover:border-slate-300/50 transition-all duration-200 hover:shadow-lg"
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
              <Key className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-slate-900 truncate">{apiKey.name}</h3>
              {apiKey.description && (
                <p className="text-sm text-slate-600 mt-1 line-clamp-2">{apiKey.description}</p>
              )}
            </div>
          </div>
          
          <div className={`flex items-center gap-2 transition-opacity ${showActions ? 'opacity-100' : 'opacity-0'}`}>
            <button 
              onClick={() => copyToClipboard(apiKey.key_id, apiKey.key_id)}
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Copy API Key"
            >
              {copiedKeyId === apiKey.key_id ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
            <button 
              onClick={() => setShowKey(!showKey)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Toggle visibility"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <button 
              onClick={() => deleteApiKey(apiKey.id, apiKey.name)}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete API Key"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* API Key Display */}
        <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between">
            <code className="text-sm font-mono text-slate-700">
              {showKey ? apiKey.key_id : '••••••••••••••••••••••••••••••••'}
            </code>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Rate Limit</span>
            <div className="flex items-center gap-1 text-slate-900 font-medium">
              <Zap className="w-3 h-3" />
              {apiKey.rate_limit.toLocaleString()}/hr
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Created</span>
            <div className="flex items-center gap-1 text-slate-900">
              <Calendar className="w-3 h-3" />
              {formatDate(apiKey.created_at)}
            </div>
          </div>
          
          {apiKey.expires_at && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Expires</span>
              <span className="text-amber-600 font-medium">
                {formatDate(apiKey.expires_at)}
              </span>
            </div>
          )}
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Status</span>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              apiKey.is_active 
                ? 'bg-emerald-100 text-emerald-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {apiKey.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-100">
            <span className="text-slate-600">Created by</span>
            <span className="text-slate-900 font-medium">
              {apiKey.created_by_username || 'System'}
            </span>
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
          <h2 className="text-3xl font-bold text-slate-900 mb-2">API Keys</h2>
          <p className="text-slate-600">Manage your API keys and permissions</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create New Key
        </button>
      </div>

      {/* API Keys Grid */}
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white/70 rounded-2xl p-6 border border-slate-200/50">
              <div className="animate-pulse">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-slate-200 rounded-xl"></div>
                  <div className="flex-1">
                    <div className="h-5 bg-slate-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-slate-200 rounded w-full"></div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-slate-200 rounded"></div>
                  <div className="h-4 bg-slate-200 rounded"></div>
                  <div className="h-4 bg-slate-200 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : apiKeys.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {apiKeys.map((apiKey) => (
            <ApiKeyCard key={apiKey.id} apiKey={apiKey} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Key className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No API keys found</h3>
          <p className="text-slate-600 mb-6">Get started by creating your first API key</p>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors mx-auto"
          >
            <Plus className="w-4 h-4" />
            Create API Key
          </button>
        </div>
      )}

      {/* Create API Key Modal */}
      <CreateApiKeyModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={(apiKey) => {
          setNewApiKey(apiKey)
          setShowSuccessModal(true)
          loadApiKeys() // Reload the list
        }}
      />

      {/* API Key Success Modal */}
      <ApiKeySuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false)
          setNewApiKey(null)
        }}
        apiKey={newApiKey}
      />
    </DashboardLayout>
  )
}