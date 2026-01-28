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
  if (pathname === '/admin' || pathname === '/admin/dashboard')
    return 'Dashboard'
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
  notifications = 0,
}: MobileHeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const pageTitle = title || getPageTitle(pathname)
  const canGoBack =
    showBack || (pathname !== '/admin' && pathname !== '/admin/dashboard')

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
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white md:hidden">
        <form
          onSubmit={handleSearch}
          className="flex items-center space-x-3 p-4"
        >
          <button
            type="button"
            onClick={() => setSearchOpen(false)}
            className="-ml-2 p-2 text-gray-500 hover:text-gray-700 active:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <input
            type="text"
            placeholder="Search events, photos, clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 rounded-full bg-gray-100 px-4 py-2 text-sm placeholder-gray-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-detra-gold"
            autoFocus
          />
        </form>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white md:hidden">
      <div className="flex items-center justify-between p-4">
        {/* Left Section */}
        <div className="flex min-w-0 flex-1 items-center space-x-3">
          {canGoBack && (
            <button
              onClick={handleBack}
              className="-ml-2 p-2 text-gray-500 transition-colors hover:text-gray-700 active:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          {showMenu && (
            <button
              onClick={onMenuClick}
              className="-ml-2 p-2 text-gray-500 transition-colors hover:text-gray-700 active:text-gray-900"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold text-gray-900">
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
              className="p-2 text-gray-500 transition-colors hover:text-gray-700 active:text-gray-900"
            >
              <Search className="h-5 w-5" />
            </button>
          )}

          {showNotifications && (
            <Link
              href="/admin/messages"
              className="relative p-2 text-gray-500 transition-colors hover:text-gray-700 active:text-gray-900"
            >
              <Bell className="h-5 w-5" />
              {notifications > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
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
