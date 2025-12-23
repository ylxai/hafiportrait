'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  MagnifyingGlassIcon as Search,
  BellIcon as Bell,
  ArrowLeftIcon as ArrowLeft,
  Bars3Icon as Menu,
} from '@heroicons/react/24/outline'
import Link from 'next/link'

interface MobileHeaderProps {
  title?: string
  showBack?: boolean
  showSearch?: boolean
  showNotifications?: boolean
  showMenu?: boolean
  onMenuClick?: () => void
  rightAction?: React.ReactNode
  notifications?: number
}

const getPageTitle = (pathname: string): string => {
  if (pathname === '/admin' || pathname === '/admin/dashboard') return 'Dashboard'
  if (pathname.startsWith('/admin/events')) {
    if (pathname.includes('/create')) return 'Create Event'
    if (pathname.includes('/photos')) return 'Event Photos'
    if (pathname.includes('/analytics')) return 'Event Analytics'
    if (pathname.match(/\/admin\/events\/[^/]+$/)) return 'Event Details'
    return 'Events'
  }
  if (pathname.startsWith('/admin/photos')) {
    if (pathname.includes('/trash')) return 'Deleted Photos'
    return 'Photos'
  }
  if (pathname.startsWith('/admin/messages')) return 'Client Messages'
  if (pathname.startsWith('/admin/settings')) return 'Settings'
  if (pathname.startsWith('/admin/pricing')) return 'Pricing'
  if (pathname.startsWith('/admin/portfolio')) return 'Portfolio'
  if (pathname.startsWith('/admin/landing-page')) {
    if (pathname.includes('hero-slideshow')) return 'Hero Slideshow'
    if (pathname.includes('bento-grid')) return 'Bento Grid'
    if (pathname.includes('form-submissions')) return 'Form Submissions'
    return 'Landing Page'
  }
  return 'Admin'
}

export default function MobileHeader({
  title,
  showBack = false,
  showSearch = true,
  showNotifications = true,
  showMenu = false,
  onMenuClick,
  rightAction,
  notifications = 0
}: MobileHeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const pageTitle = title || getPageTitle(pathname)
  const canGoBack = showBack || (pathname !== '/admin' && pathname !== '/admin/dashboard')

  const handleBack = () => {
    if (pathname.includes('/admin/events/') && !pathname.includes('/create')) {
      router.push('/admin/events')
    } else if (pathname.includes('/admin/photos/')) {
      router.push('/admin/photos')
    } else {
      router.back()
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Implement search logic based on current page
      setSearchOpen(false)
      setSearchQuery('')
    }
  }

  if (searchOpen) {
    return (
      <header className="md:hidden sticky top-0 z-40 bg-white border-b border-gray-200">
        <form onSubmit={handleSearch} className="flex items-center p-4 space-x-3">
          <button
            type="button"
            onClick={() => setSearchOpen(false)}
            className="p-2 -ml-2 text-gray-500 hover:text-gray-700 active:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <input
            type="text"
            placeholder="Search events, photos, clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 bg-gray-100 rounded-full text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-teal focus:bg-white"
            autoFocus
          />
        </form>
      </header>
    )
  }

  return (
    <header className="md:hidden sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between p-4">
        {/* Left Section */}
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {canGoBack && (
            <button
              onClick={handleBack}
              className="p-2 -ml-2 text-gray-500 hover:text-gray-700 active:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          {showMenu && (
            <button
              onClick={onMenuClick}
              className="p-2 -ml-2 text-gray-500 hover:text-gray-700 active:text-gray-900 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold text-gray-900 truncate">
              {pageTitle}
            </h1>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-1">
          {rightAction}

          {showSearch && (
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 text-gray-500 hover:text-gray-700 active:text-gray-900 transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>
          )}

          {showNotifications && (
            <Link
              href="/admin/messages"
              className="relative p-2 text-gray-500 hover:text-gray-700 active:text-gray-900 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {notifications > 9 ? '9+' : notifications}
                </span>
              )}
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}