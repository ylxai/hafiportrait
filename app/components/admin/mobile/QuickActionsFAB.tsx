'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  Plus,
  Camera,
  Calendar,
  Upload,
  Users,
  MessageSquare,
  X
} from 'lucide-react'

interface QuickAction {
  label: string
  icon: any
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
        icon: Calendar,
        href: '/admin/events/create',
        color: 'bg-brand-teal'
      },
      {
        label: 'Upload Photos',
        icon: Upload,
        onClick: () => {
          // Check if we're in an event context
          if (pathname.includes('/admin/events/') && pathname.match(/\/admin\/events\/[^/]+$/)) {
            const event_id = pathname.split('/').pop()
            router.push(`/admin/events/${event_id}/photos/upload`)
          } else {
            router.push('/admin/photos')
          }
        },
        color: 'bg-blue-500'
      },
    ]

    // Context-specific actions based on current page
    if (pathname.startsWith('/admin/events')) {
      if (pathname.includes('/photos')) {
        return [
          {
            label: 'Upload Photos',
            icon: Upload,
            href: pathname.replace('/photos', '/photos/upload'),
            color: 'bg-green-500'
          },
          ...baseActions.filter(a => a.label !== 'Upload Photos')
        ]
      }
    }

    if (pathname.startsWith('/admin/photos')) {
      return [
        {
          label: 'Upload to Portfolio',
          icon: Camera,
          href: '/admin/portfolio',
          color: 'bg-purple-500'
        },
        ...baseActions
      ]
    }

    if (pathname.startsWith('/admin/messages')) {
      return [
        {
          label: 'New Message',
          icon: MessageSquare,
          onClick: () => {
            // Implement new message creation
          },
          color: 'bg-orange-500'
        },
        ...baseActions
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
    <div className="md:hidden fixed bottom-20 right-4 z-40">
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
                  className="flex items-center space-x-3 animate-in slide-in-from-right duration-200"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Action Label */}
                  <div className="bg-black/80 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap">
                    {action.label}
                  </div>
                  
                  {/* Action Button */}
                  <button
                    onClick={() => handleActionClick(action)}
                    className={`w-12 h-12 rounded-full ${action.color || 'bg-gray-600'} text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center`}
                  >
                    <Icon className="w-6 h-6" />
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
        className={`w-14 h-14 rounded-full bg-brand-teal text-white shadow-lg hover:shadow-xl transform transition-all duration-200 flex items-center justify-center ${
          isOpen ? 'rotate-45 bg-gray-600' : 'hover:scale-105'
        }`}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Plus className="w-6 h-6" />
        )}
      </button>
    </div>
  )
}
