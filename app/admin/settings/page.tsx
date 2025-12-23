'use client'

import { useState } from 'react'
import AdminLayout from '@/app/components/admin/AdminLayout'
import { 
  CogIcon as SettingsIcon, 
  UserIcon as User, 
  BuildingOfficeIcon as Building 
} from '@heroicons/react/24/outline'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'business', name: 'Business Info', icon: Building },
    { id: 'social', name: 'Social Links', icon: Building },
  ]

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Settings
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your account and business settings
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          {/* Tabs */}
          <div className="border-b">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-brand-teal text-brand-teal'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.name}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            <div className="text-center py-12">
              <SettingsIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Settings Coming Soon
              </h3>
              <p className="text-gray-600">
                Configure your profile, business information, and social media links
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
