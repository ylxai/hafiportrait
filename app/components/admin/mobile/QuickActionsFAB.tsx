'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  PlusIcon,
  CameraIcon,
  CalendarDaysIcon,
  ArrowUpTrayIcon,
  ChatBubbleLeftIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

interface QuickAction {
  label: string
  icon: React.ComponentType<{ className?: string }>
  href?: string
  onClick?: () => void
  color?: string
}

export default function QuickActionsFAB() {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  const getQuickActions = (): QuickAction[] => {
    const baseActions = [
      {
        label: 'Create Event',
        icon: CalendarDaysIcon,
        href: '/admin/events/create',
        color: 'bg-brand-teal',
      },
      {
        label: 'Upload Photos',
        icon: ArrowUpTrayIcon,
        onClick: () => {
          // Check if we're in an event context
          if (
            pathname.includes('/admin/events/') &&
            pathname.match(/\/admin\/events\/[^/]+$/)
          ) {
            const event_id = pathname.split('/').pop()
            router.push(`/admin/events/${event_id}/photos/upload`)
          } else {
            router.push('/admin/photos')
          }
        },
        color: 'bg-blue-500',
      },
    ]

    // Context-specific actions based on current page
    if (pathname.startsWith('/admin/events')) {
      if (pathname.includes('/photos')) {
        return [
          {
            label: 'Upload Photos',
            icon: ArrowUpTrayIcon,
            href: pathname.replace('/photos', '/photos/upload'),
            color: 'bg-green-500',
          },
          ...baseActions.filter((a) => a.label !== 'Upload Photos'),
        ]
      }
    }

    if (pathname.startsWith('/admin/photos')) {
      return [
        {
          label: 'Upload to Portfolio',
          icon: CameraIcon,
          href: '/admin/portfolio',
          color: 'bg-purple-500',
        },
        ...baseActions,
      ]
    }

    if (pathname.startsWith('/admin/messages')) {
      return [
        {
          label: 'New Message',
          icon: ChatBubbleLeftIcon,
          onClick: () => {
            // Implement new message creation
          },
          color: 'bg-orange-500',
        },
        ...baseActions,
      ]
    }

    return baseActions
  }

  const quickActions = getQuickActions()

  const handleActionClick = (action: QuickAction) => {
    setIsOpen(false)
    if (action.onClick) {
      action.onClick()
    } else if (action.href) {
      router.push(action.href)
    }
  }

  return (
    <div className="fixed bottom-20 right-4 z-40 md:hidden">
      {/* Action Menu */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 -z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Actions */}
          <div className="absolute bottom-16 right-0 space-y-3">
            {quickActions.map((action, index) => {
              const Icon = action.icon
              return (
                <div
                  key={action.label}
                  className="animate-in slide-in-from-right flex items-center space-x-3 duration-200"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Action Label */}
                  <div className="whitespace-nowrap rounded-lg bg-black/80 px-3 py-2 text-sm text-white">
                    {action.label}
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => handleActionClick(action)}
                    className={`h-12 w-12 rounded-full ${action.color || 'bg-gray-600'} flex transform items-center justify-center text-white shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl`}
                  >
                    <Icon className="h-6 w-6" />
                  </button>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Main FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-14 w-14 transform items-center justify-center rounded-full bg-brand-teal text-white shadow-lg transition-all duration-200 hover:shadow-xl ${
          isOpen ? 'rotate-45 bg-gray-600' : 'hover:scale-105'
        }`}
      >
        {isOpen ? (
          <XMarkIcon className="h-6 w-6" />
        ) : (
          <PlusIcon className="h-6 w-6" />
        )}
      </button>
    </div>
  )
}
