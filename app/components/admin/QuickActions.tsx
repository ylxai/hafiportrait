'use client'

import Link from 'next/link'
import {
  PlusIcon,
  ArrowUpTrayIcon,
  EnvelopeIcon,
  CogIcon,
} from '@heroicons/react/24/outline'

export default function QuickActions() {
  const actions = [
    {
      title: 'Create Event',
      description: 'Start a new photography event',
      href: '/admin/events/create',
      icon: PlusIcon,
      color: 'from-purple-600 to-pink-600',
    },
    {
      title: 'Upload Photos',
      description: 'Add photos to existing events',
      href: '/admin/photos',
      icon: ArrowUpTrayIcon,
      color: 'from-blue-600 to-cyan-600',
    },
    {
      title: 'View Messages',
      description: 'Check client inquiries',
      href: '/admin/messages',
      icon: EnvelopeIcon,
      color: 'from-green-600 to-emerald-600',
    },
    {
      title: 'Settings',
      description: 'Configure system settings',
      href: '/admin/settings',
      icon: CogIcon,
      color: 'from-gray-600 to-gray-700',
    },
  ]

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">
        Quick Actions
      </h2>
      <div className="grid grid-cols-2 gap-4">
        {actions.map((action) => (
          <Link
            key={action.title}
            href={action.href}
            className="group relative overflow-hidden rounded-lg border-2 border-gray-200 p-4 transition-all hover:border-transparent hover:shadow-lg"
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 transition-opacity group-hover:opacity-10`}
            />
            <div className="relative flex items-center gap-4">
              <div
                className={`inline-flex rounded-lg bg-gradient-to-br p-3 ${action.color} shrink-0`}
              >
                <action.icon className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">
                  {action.title}
                </h3>
                <p className="text-sm text-gray-600 truncate">{action.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
