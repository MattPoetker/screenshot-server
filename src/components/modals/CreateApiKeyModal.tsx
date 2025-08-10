'use client'
import React, { useState } from 'react'
import Modal from './Modal'
import { useToast } from '../ui/Toast'
import { useAuth } from '@/contexts/AuthContext'

interface CreateApiKeyModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (apiKey: any) => void
}

export default function CreateApiKeyModal({ isOpen, onClose, onSuccess }: CreateApiKeyModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    rateLimit: '1000',
    permissions: ['screenshot'],
    expiresAt: ''
  })
  const { addToast } = useToast()
  const { token } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (!token) {
      addToast({
        type: 'error',
        title: 'Authentication Error',
        message: 'You must be logged in to create API keys'
      })
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          rate_limit: parseInt(formData.rateLimit),
          permissions: formData.permissions,
          expires_at: formData.expiresAt || null
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create API key')
      }

      const result = await response.json()
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        rateLimit: '1000',
        permissions: ['screenshot'],
        expiresAt: ''
      })

      // Close this modal and show success modal with the created API key
      onClose()
      onSuccess(result.apiKey)
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Failed to create API key',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
    }
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title="Create New API Key"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Name *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="My API Key"
            disabled={loading}
          />
        </div>

        {/* Description Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Description of what this API key is used for..."
            disabled={loading}
          />
        </div>

        {/* Rate Limit Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rate Limit (requests/hour)
          </label>
          <input
            type="number"
            min="1"
            max="10000"
            value={formData.rateLimit}
            onChange={(e) => setFormData({ ...formData, rateLimit: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
        </div>

        {/* Permissions Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Permissions
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.permissions.includes('screenshot')}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFormData({ 
                      ...formData, 
                      permissions: [...formData.permissions, 'screenshot'] 
                    })
                  } else {
                    setFormData({ 
                      ...formData, 
                      permissions: formData.permissions.filter(p => p !== 'screenshot') 
                    })
                  }
                }}
                className="mr-2"
                disabled={loading}
              />
              <span className="text-sm text-gray-700">Screenshot capture</span>
            </label>
          </div>
        </div>

        {/* Expiration Date Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Expiration Date (optional)
          </label>
          <input
            type="date"
            value={formData.expiresAt}
            onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !formData.name.trim()}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create API Key'}
          </button>
        </div>
      </form>
    </Modal>
  )
}