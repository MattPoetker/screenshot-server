'use client'
import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: number
  username: string
  role: string
  is_active: boolean
  created_at: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  loading: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check for stored auth data on mount
    const storedToken = localStorage.getItem('auth_token')
    const storedUser = localStorage.getItem('user')

    console.log(`[${new Date().toISOString()}] AuthContext: Initializing, stored token: ${storedToken ? `${storedToken.substring(0, 20)}...` : 'none'}`)

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        console.log(`[${new Date().toISOString()}] AuthContext: Found stored session for user: ${parsedUser.username}`)
        setToken(storedToken)
        setUser(parsedUser)
        
        // Verify the token is still valid
        verifyToken(storedToken)
      } catch (error) {
        console.error(`[${new Date().toISOString()}] AuthContext: Error parsing stored user data:`, error)
        logout()
      }
    }
    
    setLoading(false)
  }, [])

  const verifyToken = async (tokenToVerify: string) => {
    try {
      console.log(`[${new Date().toISOString()}] AuthContext: Verifying token: ${tokenToVerify.substring(0, 20)}...`)
      const response = await fetch('/api/auth', {
        headers: {
          'Authorization': `Bearer ${tokenToVerify}`
        }
      })

      console.log(`[${new Date().toISOString()}] AuthContext: Token verification response status: ${response.status}`)

      if (!response.ok) {
        // Only logout for authentication errors (401), not server errors
        if (response.status === 401) {
          console.log(`[${new Date().toISOString()}] AuthContext: Token expired or invalid, logging out`)
          logout()
        } else {
          console.warn(`[${new Date().toISOString()}] AuthContext: Token verification failed with status: ${response.status}`)
          // Don't logout for server errors, network issues, etc.
        }
      } else {
        const data = await response.json()
        if (data.success && data.user) {
          console.log(`[${new Date().toISOString()}] AuthContext: Token verification successful for user: ${data.user.username}`)
          setUser(data.user)
        }
      }
    } catch (error) {
      // Network errors, server down, etc. - don't logout immediately
      console.warn(`[${new Date().toISOString()}] AuthContext: Token verification network error:`, error)
      // Only logout if this is a parsing error or similar client-side issue
      if (error instanceof SyntaxError) {
        console.log(`[${new Date().toISOString()}] AuthContext: Invalid response format, logging out`)
        logout()
      }
    }
  }

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setToken(data.token)
        setUser(data.user)
        localStorage.setItem('auth_token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        return true
      } else {
        return false
      }
    } catch (error) {
      console.error('Login error:', error)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    loading,
    isAuthenticated: !!user && !!token
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}