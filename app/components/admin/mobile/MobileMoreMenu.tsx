'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  XMarkIcon as X,
  ArrowRightOnRectangleIcon as LogOut,
  CogIcon as Settings,
  CubeIcon as Package,
  ChatBubbleLeftEllipsisIcon as MessageSquare,
  ChartBarIcon as BarChart3,
  DocumentTextIcon as FileText,
  HomeIcon as Home,
  SwatchIcon as Palette,
  Squares2X2Icon as Grid3x3,
  PresentationChartBarIcon as Slideshow,
} from '@heroicons/react/24/outline'
import { useAuth } from '@/hooks/useAuth'

interface MenuItem {
  name: string
  href?: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  subItems?: {
    name: string
    href: string
    icon: React.ComponentType<{ className?: string }>
  }[]
}

interface MobileMoreMenuProps {
  isOpen: boolean
  onClose: () => void
}

export default function MobileMoreMenu({
  isOpen,
  onClose,
}: MobileMoreMenuProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const secondaryMenuItems: MenuItem[] = [
    {
      name: 'Landing Page',
      icon: Home,
      description: 'Kelola halaman utama',
      subItems: [
        {
          name: 'Hero Slideshow',
          href: '/admin/landing-page/hero-slideshow',
          icon: Slideshow,
        },
        {
          name: 'Bento Grid',
          href: '/admin/landing-page/bento-grid',
          icon: Grid3x3,
        },
        {
          name: 'Form Submissions',
          href: '/admin/landing-page/form-submissions',
          icon: FileText,
        },
      ],
    },
    {
      name: 'Packages',
      icon: Package,
      description: 'Manajemen paket layanan',
      subItems: [
        { name: 'All Packages', href: '/admin/packages', icon: Package },
        {
          name: 'Categories',
          href: '/admin/packages/categories',
          icon: Grid3x3,
        },
      ],
    },
    {
      name: 'Messages',
      href: '/admin/messages',
      icon: MessageSquare,
      description: 'Pesan dari klien',
    },
    {
      name: 'Additional Services',
      href: '/admin/additional-services',
      icon: Palette,
      description: 'Layanan tambahan',
    },
    {
      name: 'Pricing',
      href: '/admin/pricing',
      icon: BarChart3,
      description: 'Pengaturan harga',
    },
    {
      name: 'Settings',
      href: '/admin/settings',
      icon: Settings,
      description: 'Pengaturan sistem',
    },
  ]

  const toggleExpanded = (itemName: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(itemName)) {
      newExpanded.delete(itemName)
    } else {
      newExpanded.add(itemName)
    }
    setExpandedItems(newExpanded)
  }

  const isItemActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/')
  }

  const handleLogout = async () => {
    await logout()
    router.push('/admin/login')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Menu Panel */}
      <div className="absolute right-0 top-0 h-full w-80 overflow-hidden bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-detra-gold to-detra-gray p-6">
          <h2 className="text-xl font-bold text-white">More Menu</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-white/80 transition-all hover:bg-white/10 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* User Info */}
        {user && (
          <div className="border-b border-gray-100 bg-gray-50 p-6">
            <div className="flex items-center space-x-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-detra-gold">
                <span className="text-lg font-bold text-white">
                  {user.username?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">{user.username}</p>
                <p className="text-xs capitalize text-detra-gold">
                  {user.role}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Menu Items */}
        <div className="flex-1 space-y-2 overflow-y-auto p-6">
          {secondaryMenuItems.map((item) => {
            const Icon = item.icon
            const hasSubItems = item.subItems && item.subItems.length > 0
            const isExpanded = expandedItems.has(item.name)
            const is_active = item.href ? isItemActive(item.href) : false
            const isParentActive =
              hasSubItems &&
              item.subItems?.some((sub) => isItemActive(sub.href))

            if (hasSubItems) {
              return (
                <div key={item.name} className="space-y-1">
                  <button
                    onClick={() => toggleExpanded(item.name)}
                    className={`flex w-full items-center justify-between rounded-xl p-4 transition-all ${
                      isParentActive
                        ? 'bg-detra-gold/10 text-detra-gold'
                        : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <Icon className="h-6 w-6" />
                      <div className="text-left">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-500">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="ml-6 space-y-1">
                      {item.subItems?.map((subItem) => {
                        const SubIcon = subItem.icon
                        const isSubActive = isItemActive(subItem.href)
                        return (
                          <button
                            key={subItem.href}
                            onClick={() => {
                              router.push(subItem.href)
                              onClose()
                            }}
                            className={`flex w-full items-center space-x-4 rounded-lg p-3 transition-all ${
                              isSubActive
                                ? 'bg-detra-gold/10 text-detra-gold'
                                : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200'
                            }`}
                          >
                            <SubIcon className="h-5 w-5" />
                            <span className="font-medium">{subItem.name}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            }

            return (
              <button
                key={item.href}
                onClick={() => {
                  if (item.href) {
                    router.push(item.href)
                    onClose()
                  }
                }}
                className={`flex w-full items-center space-x-4 rounded-xl p-4 transition-all ${
                  is_active
                    ? 'bg-detra-gold/10 text-detra-gold'
                    : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
                }`}
              >
                <Icon className="h-6 w-6" />
                <div className="text-left">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </div>
              </button>
            )
          })}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex w-full items-center space-x-4 rounded-xl p-4 text-red-600 transition-all hover:bg-red-50 active:bg-red-100"
          >
            <LogOut className="h-6 w-6" />
            <div className="text-left">
              <p className="font-medium">Logout</p>
              <p className="text-sm text-red-500">Sign out dari akun</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
