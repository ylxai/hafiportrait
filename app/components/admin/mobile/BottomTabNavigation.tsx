'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  RectangleGroupIcon as LayoutDashboard,
  CalendarIcon as Calendar,
  PhotoIcon as Image,
  UsersIcon as Users,
  Bars3Icon as MenuIcon,
} from '@heroicons/react/24/outline'
import { useState } from 'react'
import MobileMoreMenu from './MobileMoreMenu'

interface TabItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
}

const primaryTabs: TabItem[] = [
  {
    name: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Events',
    href: '/admin/events',
    icon: Calendar,
  },
  {
    name: 'Photos',
    href: '/admin/photos',
    icon: Image,
  },
  {
    name: 'Clients',
    href: '/admin/messages',
    icon: Users,
  },
]

interface BottomTabNavigationProps {
  newMessagesCount?: number
}

export default function BottomTabNavigation({
  newMessagesCount,
}: BottomTabNavigationProps) {
  const pathname = usePathname()
  const [showMoreMenu, setShowMoreMenu] = useState(false)

  // Update badge count for clients tab
  const tabsWithBadges = primaryTabs.map((tab) => ({
    ...tab,
    badge: tab.href === '/admin/messages' ? newMessagesCount : undefined,
  }))

  const isTabActive = (href: string) => {
    if (href === '/admin/dashboard') {
      return pathname === '/admin' || pathname === '/admin/dashboard'
    }
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Bottom Navigation Bar - Mobile Only */}
      <div className="safe-area-pb fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white md:hidden">
        <div className="grid h-16 grid-cols-5">
          {tabsWithBadges.map((tab) => {
            const Icon = tab.icon
            const active = isTabActive(tab.href)

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
                  active
                    ? 'text-detra-gold'
                    : 'text-gray-500 active:text-detra-gold'
                }`}
              >
                <div className="relative">
                  <Icon
                    className={`h-6 w-6 ${active ? 'text-detra-gold' : 'text-gray-500'}`}
                  />
                  {tab.badge && tab.badge > 0 && (
                    <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                      {tab.badge > 9 ? '9+' : tab.badge}
                    </span>
                  )}
                </div>
                <span
                  className={`text-xs font-medium ${active ? 'text-detra-gold' : 'text-gray-500'}`}
                >
                  {tab.name}
                </span>
              </Link>
            )
          })}

          {/* More Menu Button */}
          <button
            onClick={() => setShowMoreMenu(true)}
            className="flex flex-col items-center justify-center space-y-1 text-gray-500 transition-colors active:text-detra-gold"
          >
            <MenuIcon className="h-6 w-6" />
            <span className="text-xs font-medium">More</span>
          </button>
        </div>
      </div>

      {/* More Menu Modal */}
      <MobileMoreMenu
        isOpen={showMoreMenu}
        onClose={() => setShowMoreMenu(false)}
      />

      {/* Bottom padding untuk konten agar tidak tertutup bottom nav */}
      <div className="h-16 md:hidden" />
    </>
  )
}
