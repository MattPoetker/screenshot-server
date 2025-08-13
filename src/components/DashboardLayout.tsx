'use client'

import React, { ReactNode } from 'react'
import Navigation from './Navigation'
import ProtectedRoute from './ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'

interface DashboardLayoutProps {
  children: ReactNode
  requireAdmin?: boolean
}

export default function DashboardLayout({ children, requireAdmin = false }: DashboardLayoutProps) {
  const { user, logout } = useAuth()

  return (
    <ProtectedRoute requireAdmin={requireAdmin}>
      <Navigation user={user || undefined} onLogout={logout} />
      <main className="max-w-7xl mx-auto p-6">
        {children}
      </main>
    </ProtectedRoute>
  )
}