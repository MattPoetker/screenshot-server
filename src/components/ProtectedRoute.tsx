'use client'
import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Camera } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, isAuthenticated, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/login')
        return
      }

      if (requireAdmin && user?.role !== 'admin') {
        router.push('/unauthorized')
        return
      }
    }
  }, [isAuthenticated, loading, user, router, requireAdmin])

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Camera className="w-8 h-8 text-white animate-pulse" />
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render children if not authenticated or unauthorized
  if (!isAuthenticated) {
    return null
  }

  if (requireAdmin && user?.role !== 'admin') {
    return null
  }

  return <>{children}</>
}