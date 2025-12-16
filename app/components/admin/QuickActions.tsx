'use client'

import Link from 'next/link'
import { Plus, Upload, Mail, Settings } from 'lucide-react'

export default function QuickActions() {
  const actions = [
    {
      title: 'Create Event',
      description: 'Start a new photography event',
      href: '/admin/events/create',
      icon: Plus,
      color: 'from-purple-600 to-pink-600',
    },
    {
      title: 'Upload Photos',
      description: 'Add photos to existing events',
      href: '/admin/photos',
      icon: Upload,
      color: 'from-blue-600 to-cyan-600',
    },
    {
      title: 'View Messages',
      description: 'Check client inquiries',
      href: '/admin/messages',
      icon: Mail,
      color: 'from-green-600 to-emerald-600',
    },
    {
      title: 'Settings',
      description: 'Configure system settings',
      href: '/admin/settings',
      icon: Settings,
      color: 'from-gray-600 to-gray-700',
    },
  ]

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action) => (
          <Link
            key={action.title}
            href={action.href}
            className="group relative overflow-hidden rounded-lg border-2 border-gray-200 hover:border-transparent transition-all p-4 hover:shadow-lg"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
            <div className="relative">
              <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${action.color} mb-3`}>
                <action.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
              <p className="text-sm text-gray-600">{action.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
