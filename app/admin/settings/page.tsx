'use client'

import { useState } from 'react'
import Link from 'next/link'
import AdminLayout from '@/app/components/admin/AdminLayout'
import ErrorAlert from '@/components/ui/ErrorAlert'
import { 
  CogIcon as SettingsIcon, 
  UserIcon as User, 
  BuildingOfficeIcon as Building,
  KeyIcon as Key
} from '@heroicons/react/24/outline'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [error, setError] = useState<string | null>(null)

  const settingsCards = [
    {
      id: 'api-keys',
      name: 'API Keys',
      description: 'Manage API keys for programmatic access',
      icon: Key,
      href: '/admin/api-keys',
      color: 'purple'
    },
    {
      id: 'profile',
      name: 'Profile Settings',
      description: 'Update your personal information',
      icon: User,
      color: 'blue',
      comingSoon: true
    },
    {
      id: 'business',
      name: 'Business Info',
      description: 'Configure business details',
      icon: Building,
      color: 'green',
      comingSoon: true
    },
  ]

  return (
    <AdminLayout>
      <div className="space-y-6">
        <ErrorAlert error={error} onDismiss={() => setError(null)} />
        
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Settings
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your account and business settings
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {settingsCards.map((card) => {
            const Icon = card.icon
            const content = (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 rounded-lg bg-${card.color}-100 flex items-center justify-center mb-4`}>
                  <Icon className={`w-6 h-6 text-${card.color}-600`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {card.name}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {card.description}
                </p>
                {card.comingSoon && (
                  <span className="inline-block px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
                    Coming Soon
                  </span>
                )}
              </div>
            )

            return card.href && !card.comingSoon ? (
              <Link key={card.id} href={card.href}>
                {content}
              </Link>
            ) : (
              <div key={card.id} className="cursor-not-allowed opacity-60">
                {content}
              </div>
            )
          })}
        </div>
      </div>
    </AdminLayout>
  )
}
