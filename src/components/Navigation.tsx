'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Camera, 
  Sun, 
  Moon, 
  User, 
  ChevronDown, 
  Settings, 
  LogOut, 
  BarChart3, 
  Key, 
  Image, 
  TrendingUp,
  BookOpen,
  CreditCard
} from 'lucide-react'

interface NavigationProps {
  user?: {
    username: string
    role: string
  }
  onLogout?: () => void
}

export default function Navigation({ user, onLogout }: NavigationProps) {
  const pathname = usePathname()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
    document.body.classList.toggle('dark')
    localStorage.setItem('theme', !isDarkMode ? 'dark' : 'light')
  }

  const navItems = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      active: pathname === '/dashboard'
    },
    {
      href: '/api-keys',
      label: 'API Keys',
      icon: Key,
      active: pathname === '/api-keys'
    },
    {
      href: '/screenshots',
      label: 'Screenshots',
      icon: Image,
      active: pathname === '/screenshots'
    },
    {
      href: '/analytics',
      label: 'Analytics',
      icon: TrendingUp,
      active: pathname === '/analytics'
    },
    {
      href: '/billing',
      label: 'Billing',
      icon: CreditCard,
      active: pathname === '/billing'
    },
    {
      href: '/docs',
      label: 'API Docs',
      icon: BookOpen,
      active: pathname === '/docs'
    }
  ]

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">NiceShot API</h1>
              <p className="text-sm text-slate-600">Admin Dashboard</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              {isDarkMode ? (
                <Moon className="w-4 h-4 text-slate-600" />
              ) : (
                <Sun className="w-4 h-4 text-slate-600" />
              )}
            </button>
            
            {/* User Menu */}
            <div className="relative">
              <button 
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-slate-700">
                  {user?.username || 'Admin'}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>
              
              {userMenuOpen && (
                <div className="absolute right-0 top-12 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-2">
                  <button className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                  <div className="h-px bg-slate-200 my-1"></div>
                  <button 
                    onClick={onLogout}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="mt-4 border-b border-slate-200">
          <div className="flex gap-2 sm:gap-6 overflow-x-auto scrollbar-hide pb-px">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-1 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
                    item.active
                      ? 'text-indigo-600 border-indigo-600'
                      : 'text-slate-600 border-transparent hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}