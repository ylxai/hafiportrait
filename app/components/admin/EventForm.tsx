'use client'

import { useState, useEffect } from 'react'
import { generateSlug } from '@/lib/utils/slug'
import { Calendar, Loader2 } from 'lucide-react'

interface EventFormData {
  name: string
  slug: string
  clientEmail: string
  clientPhone: string
  eventDate: string
  description: string
  location: string
  coupleName: string
  storageDurationDays: number
  autoGenerateAccessCode: boolean
}

interface EventFormProps {
  onSubmit: (data: EventFormData) => Promise<void>
  initialData?: Partial<EventFormData>
  isEdit?: boolean
}

export default function EventForm({
  onSubmit,
  initialData,
  isEdit = false,
}: EventFormProps) {
  const [formData, setFormData] = useState<EventFormData>({
    name: initialData?.name || '',
    slug: initialData?.slug || '',
    clientEmail: initialData?.clientEmail || '',
    clientPhone: initialData?.clientPhone || '',
    eventDate: initialData?.eventDate || '',
    description: initialData?.description || '',
    location: initialData?.location || '',
    coupleName: initialData?.coupleName || '',
    storageDurationDays: initialData?.storageDurationDays || 30,
    autoGenerateAccessCode: true,
  })
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Auto-generate slug from event name
  useEffect(() => {
    if (!slugManuallyEdited && formData.name && !isEdit) {
      setFormData((prev) => ({
        ...prev,
        slug: generateSlug(formData.name),
      }))
    }
  }, [formData.name, slugManuallyEdited, isEdit])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target
    
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value,
    }))

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlugManuallyEdited(true)
    handleChange(e)
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.checked,
    }))
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Event name is required'
    } else if (formData.name.length > 100) {
      newErrors.name = 'Event name must be less than 100 characters'
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'Slug is required'
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'Slug must contain only lowercase letters, numbers, and hyphens'
    }

    if (!formData.clientEmail.trim()) {
      newErrors.clientEmail = 'Client email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.clientEmail)) {
      newErrors.clientEmail = 'Invalid email format'
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters'
    }

    if (formData.storageDurationDays < 30 || formData.storageDurationDays > 365) {
      newErrors.storageDurationDays = 'Storage duration must be between 30 and 365 days'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    setLoading(true)
    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Event Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
          Event Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g., Sarah & John Wedding"
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-transparent ${
            errors.name ? 'border-red-500' : 'border-gray-300'
          }`}
          maxLength={100}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-500">{errors.name}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          {formData.name.length}/100 characters
        </p>
      </div>

      {/* Event Slug */}
      <div>
        <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
          Event Slug <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="slug"
          name="slug"
          value={formData.slug}
          onChange={handleSlugChange}
          placeholder="sarah-john-wedding"
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-transparent font-mono text-sm ${
            errors.slug ? 'border-red-500' : 'border-gray-300'
          }`}
          disabled={isEdit}
        />
        {errors.slug && (
          <p className="mt-1 text-sm text-red-500">{errors.slug}</p>
        )}
        {formData.slug && !errors.slug && (
          <p className="mt-1 text-xs text-gray-500">
            Gallery URL: <span className="font-mono">/{formData.slug}</span>
          </p>
        )}
      </div>

      {/* Client Email */}
      <div>
        <label htmlFor="clientEmail" className="block text-sm font-medium text-gray-700 mb-2">
          Client Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          id="clientEmail"
          name="clientEmail"
          value={formData.clientEmail}
          onChange={handleChange}
          placeholder="client@example.com"
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-transparent ${
            errors.clientEmail ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.clientEmail && (
          <p className="mt-1 text-sm text-red-500">{errors.clientEmail}</p>
        )}
      </div>

      {/* Client Phone */}
      <div>
        <label htmlFor="clientPhone" className="block text-sm font-medium text-gray-700 mb-2">
          Client Phone
        </label>
        <input
          type="tel"
          id="clientPhone"
          name="clientPhone"
          value={formData.clientPhone}
          onChange={handleChange}
          placeholder="+62895-7005-03193"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-transparent"
        />
      </div>

      {/* Couple Name */}
      <div>
        <label htmlFor="coupleName" className="block text-sm font-medium text-gray-700 mb-2">
          Couple Name
        </label>
        <input
          type="text"
          id="coupleName"
          name="coupleName"
          value={formData.coupleName}
          onChange={handleChange}
          placeholder="Sarah & John"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-transparent"
          maxLength={200}
        />
        <p className="mt-1 text-xs text-gray-500">
          {formData.coupleName.length}/200 characters
        </p>
      </div>

      {/* Event Date */}
      <div>
        <label htmlFor="eventDate" className="block text-sm font-medium text-gray-700 mb-2">
          Event Date
        </label>
        <div className="relative">
          <input
            type="date"
            id="eventDate"
            name="eventDate"
            value={formData.eventDate}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-transparent"
          />
          <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Location */}
      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
          Location
        </label>
        <input
          type="text"
          id="location"
          name="location"
          value={formData.location}
          onChange={handleChange}
          placeholder="e.g., Ballroom Hotel, Banjarmasin"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-transparent"
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          placeholder="Brief description of the event..."
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-transparent ${
            errors.description ? 'border-red-500' : 'border-gray-300'
          }`}
          maxLength={500}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-500">{errors.description}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          {formData.description.length}/500 characters
        </p>
      </div>

      {/* Storage Duration */}
      <div>
        <label htmlFor="storageDurationDays" className="block text-sm font-medium text-gray-700 mb-2">
          Storage Duration (days)
        </label>
        <input
          type="number"
          id="storageDurationDays"
          name="storageDurationDays"
          value={formData.storageDurationDays}
          onChange={handleChange}
          min={30}
          max={365}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-transparent ${
            errors.storageDurationDays ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.storageDurationDays && (
          <p className="mt-1 text-sm text-red-500">{errors.storageDurationDays}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Photos will be stored for {formData.storageDurationDays} days after event date
        </p>
      </div>

      {/* Auto-generate Access Code */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="autoGenerateAccessCode"
          name="autoGenerateAccessCode"
          checked={formData.autoGenerateAccessCode}
          onChange={handleCheckboxChange}
          className="h-4 w-4 text-brand-teal focus:ring-brand-teal border-gray-300 rounded"
        />
        <label htmlFor="autoGenerateAccessCode" className="ml-2 text-sm text-gray-700">
          Auto-generate access code (6-digit alphanumeric)
        </label>
      </div>

      {/* Submit Button */}
      <div className="flex items-center space-x-4 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>{isEdit ? 'Update Event' : 'Create Event'}</span>
        </button>
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
