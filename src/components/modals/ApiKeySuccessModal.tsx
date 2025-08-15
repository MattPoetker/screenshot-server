'use client'
import React, { useState } from 'react'
import Modal from './Modal'
import { useToast } from '../ui/Toast'
import { Key, Copy, Check, AlertTriangle, Download } from 'lucide-react'

interface ApiKeySuccessModalProps {
  isOpen: boolean
  onClose: () => void
  apiKey: {
    id: number
    key_id: string
    name: string
    raw_key: string
    rate_limit: number
    expires_at?: string
  } | null
}

export default function ApiKeySuccessModal({ isOpen, onClose, apiKey }: ApiKeySuccessModalProps) {
  const [copied, setCopied] = useState(false)
  const { addToast } = useToast()

  const copyToClipboard = async (text: string) => {
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
      
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      
      addToast({
        type: 'success',
        title: 'Copied!',
        message: 'API key copied to clipboard'
      })
    } catch (error) {
      // Final fallback - show the text in a prompt so user can manually copy
      const userAgent = navigator.userAgent.toLowerCase()
      const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent)
      
      if (isMobile) {
        // On mobile, create a text input that user can select from
        const modal = document.createElement('div')
        modal.style.cssText = `
          position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
          background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          z-index: 10000; max-width: 90%; width: 400px;
        `
        modal.innerHTML = `
          <h3 style="margin: 0 0 15px 0; font-size: 18px;">Copy API Key</h3>
          <input type="text" value="${text}" readonly 
                 style="width: 100%; padding: 8px; font-family: monospace; font-size: 12px; border: 1px solid #ccc; border-radius: 4px;"
                 id="copy-input">
          <div style="margin-top: 15px; text-align: right;">
            <button onclick="document.body.removeChild(this.closest('div'))" 
                    style="padding: 8px 16px; background: #6366f1; color: white; border: none; border-radius: 4px; cursor: pointer;">
              Done
            </button>
          </div>
          <p style="margin: 10px 0 0 0; font-size: 12px; color: #666;">
            Select the text above and copy it manually
          </p>
        `
        document.body.appendChild(modal)
        setTimeout(() => {
          const input = document.getElementById('copy-input') as HTMLInputElement
          input.select()
        }, 100)
      } else {
        // On desktop, use prompt as final fallback
        prompt('Copy this API key (Ctrl+C):', text)
      }
    }
  }

  const downloadAsText = () => {
    if (!apiKey) return
    
    const content = `API Key: ${apiKey.name}
Key ID: ${apiKey.key_id}
Secret Key: ${apiKey.raw_key}
Rate Limit: ${apiKey.rate_limit} requests/hour
Created: ${new Date().toLocaleString()}
${apiKey.expires_at ? `Expires: ${new Date(apiKey.expires_at).toLocaleString()}` : ''}

⚠️  IMPORTANT: Save this key securely. You won't be able to see it again!`

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `api-key-${apiKey.name.toLowerCase().replace(/\s+/g, '-')}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    addToast({
      type: 'success',
      title: 'Downloaded',
      message: 'API key saved as text file'
    })
  }

  if (!apiKey) return null

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="🎉 API Key Created Successfully"
      size="lg"
      showCloseButton={false}
    >
      <div className="space-y-6">
        {/* Warning Banner */}
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-amber-900">Important Security Notice</h4>
            <p className="text-sm text-amber-800 mt-1">
              This is the only time you'll see the full API key. Make sure to copy and store it securely before closing this dialog.
            </p>
          </div>
        </div>

        {/* API Key Details */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Key Name
            </label>
            <div className="p-3 bg-gray-50 rounded-lg border">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-900">{apiKey.name}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Key ID
            </label>
            <div className="p-3 bg-gray-50 rounded-lg border">
              <code className="text-sm text-gray-800 font-mono">{apiKey.key_id}</code>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Secret Key
            </label>
            <div className="p-3 bg-gray-50 rounded-lg border">
              <div className="flex items-center justify-between gap-2">
                <code className="text-sm text-gray-800 font-mono flex-1 break-all">{apiKey.raw_key}</code>
                <button
                  onClick={() => copyToClipboard(apiKey.raw_key)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rate Limit
              </label>
              <div className="p-3 bg-gray-50 rounded-lg border">
                <span className="text-sm text-gray-800">{apiKey.rate_limit.toLocaleString()} requests/hour</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expires
              </label>
              <div className="p-3 bg-gray-50 rounded-lg border">
                <span className="text-sm text-gray-800">
                  {apiKey.expires_at ? new Date(apiKey.expires_at).toLocaleDateString() : 'Never'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Example */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Usage Example
          </label>
          <div className="p-3 bg-slate-900 rounded-lg border">
            <code className="text-sm text-green-400 font-mono block">
              curl -X POST https://nice-shot.io/api/screenshot \<br/>
              &nbsp;&nbsp;-H "Authorization: Bearer {apiKey.raw_key}" \<br/>
              &nbsp;&nbsp;-H "Content-Type: application/json" \<br/>
              &nbsp;&nbsp;-d '{`{"url": "https://example.com"}`}'
            </code>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            onClick={downloadAsText}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Download as Text File
          </button>
          <button
            onClick={() => copyToClipboard(apiKey.raw_key)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied to Clipboard!' : 'Copy Secret Key'}
          </button>
          <button
            onClick={onClose}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            I've Saved the Key
          </button>
        </div>
      </div>
    </Modal>
  )
}