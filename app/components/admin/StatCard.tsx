'use client'

import { ComponentType, SVGProps } from 'react'

type HeroIcon = ComponentType<SVGProps<SVGSVGElement>>

interface StatCardProps {
  title: string
  value: number | string
  subtitle?: string
  icon: HeroIcon
  color?: 'purple' | 'pink' | 'blue' | 'green' | 'yellow'
}

const colorClasses = {
  purple: 'bg-purple-50 text-purple-600',
  pink: 'bg-pink-50 text-pink-600',
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  yellow: 'bg-yellow-50 text-yellow-600',
}

export default function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color = 'purple' 
}: StatCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  )
}
