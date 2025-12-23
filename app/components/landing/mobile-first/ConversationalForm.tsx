'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckIcon,
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  HomeIcon,
  CameraIcon,
  CalendarDaysIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  SparklesIcon,
  UserIcon,
} from '@heroicons/react/24/outline'

interface FormStep {
  id: string
  question: string
  subtitle?: string
  type: 'text' | 'tel' | 'email' | 'select' | 'textarea' | 'date'
  field: string
  options?: string[]
  placeholder?: string
  validation?: (value: string) => boolean
  errorMessage?: string
  icon?: React.ComponentType<{ className?: string }>
  optional?: boolean
}

const formSteps: FormStep[] = [
  {
    id: 'step-1',
    question: 'Hai! Siapa nama Anda? 👋',
    subtitle: 'Kami ingin mengenal Anda lebih baik',
    type: 'text',
    field: 'name',
    placeholder: 'Contoh: Budi & Sarah',
    validation: (value) => value.length >= 2,
    errorMessage: 'Mohon masukkan nama Anda',
    icon: UserIcon,
  },
  {
    id: 'step-2',
    question: 'Nomor WhatsApp Anda? 📱',
    subtitle: 'Kami akan menghubungi Anda melalui WhatsApp',
    type: 'tel',
    field: 'whatsapp',
    placeholder: '0895 7005 03193',
    validation: (value) => /^[0-9+\s-()]{10,}$/.test(value),
    errorMessage: 'Mohon masukkan nomor WhatsApp yang valid',
    icon: ChatBubbleLeftRightIcon,
  },
  {
    id: 'step-3',
    question: 'Jenis layanan apa yang Anda cari? 📸',
    subtitle: 'Pilih satu yang paling sesuai dengan kebutuhan Anda',
    type: 'select',
    field: 'package',
    options: [
      'Fotografi Pernikahan',
      'Prewedding',
      'Tasmiyah & Tasyakuran',
      'Ulang Tahun',
      'Studio Couple',
      'Event Lainnya',
    ],
    icon: CameraIcon,
  },
  {
    id: 'step-4',
    question: 'Kapan tanggal acara Anda? 📅',
    subtitle: 'Perkiraan tanggal juga tidak masalah',
    type: 'text',
    field: 'date',
    placeholder: 'Contoh: Desember 2024 atau 15 Juni 2025',
    validation: (value) => value.length >= 3,
    errorMessage: 'Mohon masukkan perkiraan tanggal',
    icon: CalendarDaysIcon,
  },
  {
    id: 'step-5',
    question: 'Di mana lokasi acara Anda? 📍',
    subtitle: 'Lokasi membantu kami merencanakan lebih baik',
    type: 'text',
    field: 'location',
    placeholder: 'Contoh: Banjarmasin, Martapura, atau venue tertentu',
    validation: (value) => value.length >= 3,
    errorMessage: 'Mohon masukkan lokasi acara',
    icon: MapPinIcon,
  },
  {
    id: 'step-6',
    question: 'Budget range Anda? 💰',
    subtitle: 'Opsional - membantu kami memberikan rekomendasi terbaik',
    type: 'select',
    field: 'budget',
    options: [
      'Di bawah Rp 5 juta',
      'Rp 5 juta - Rp 10 juta',
      'Rp 10 juta - Rp 20 juta',
      'Di atas Rp 20 juta',
      'Belum yakin / Konsultasi dulu',
    ],
    optional: true,
    icon: CurrencyDollarIcon,
  },
  {
    id: 'step-7',
    question: 'Ceritakan visi Anda tentang sesi foto! ✨',
    subtitle: 'Konsep, tema, inspirasi, atau pertanyaan - ceritakan semua!',
    type: 'textarea',
    field: 'message',
    placeholder:
      'Contoh: Kami ingin sesi prewedding outdoor dengan tema natural dan candid. Kami suka gaya foto yang warm dan intimate...',
    validation: (value) => value.length >= 10,
    errorMessage: 'Mohon ceritakan lebih detail (minimal 10 karakter)',
    icon: SparklesIcon,
  },
]

export default function ConversationalForm() {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const currentStepData = formSteps[currentStep]

  const handleInputChange = (value: string) => {
    if (!currentStepData) return
    setFormData({ ...formData, [currentStepData.field]: value })
    setError('')
  }

  const validateStep = () => {
    if (!currentStepData) return false
    const value = formData[currentStepData.field] || ''

    // Skip validation for optional fields
    if (currentStepData.optional && !value.trim()) {
      return true
    }

    if (!value.trim() && currentStepData.validation) {
      setError(currentStepData.errorMessage || 'Field ini wajib diisi')
      return false
    }

    if (currentStepData.validation && !currentStepData.validation(value)) {
      setError(currentStepData.errorMessage || 'Input tidak valid')
      return false
    }

    return true
  }

  const handleNext = () => {
    if (!validateStep()) return

    if (!currentStepData) return
    if (currentStep < formSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleSubmit()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      setError('')
    }
  }

  const handleSkip = () => {
    if (!currentStepData) return
    if (currentStepData.optional) {
      setFormData({ ...formData, [currentStepData.field]: 'Tidak disebutkan' })
      if (currentStep < formSteps.length - 1) {
        setCurrentStep(currentStep + 1)
      } else {
        handleSubmit()
      }
    }
  }

  const handleSubmit = async () => {
    if (!currentStepData) return
    if (!validateStep()) return

    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/public/contact-form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setIsSubmitted(true)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Gagal mengirim form. Silakan coba lagi.')
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      setError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (
      e.key === 'Enter' &&
      currentStepData &&
      currentStepData.type !== 'textarea'
    ) {
      e.preventDefault()
      handleNext()
    }
  }

  const handleWhatsAppDirect = () => {
    window.open('https://kirimwa.id/hafiportraits', '_blank')
  }

  const handleBackToHome = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleViewPortfolio = () => {
    const portfolioSection =
      document.getElementById('portfolio') || document.getElementById('gallery')
    if (portfolioSection) {
      portfolioSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Success Screen
  if (isSubmitted) {
    return (
      <section
        id="contact"
        className="bg-gradient-to-br from-purple-50 via-white to-pink-50 px-4 py-16 md:py-24"
      >
        <div className="mx-auto max-w-2xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl bg-white p-8 shadow-2xl md:p-12"
          >
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-lg"
            >
              <CheckIcon className="h-12 w-12 text-white" strokeWidth={3} />
            </motion.div>

            {/* Success Message */}
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-4 text-center text-3xl font-bold text-gray-900 md:text-4xl"
            >
              Terima Kasih, {formData.name?.split(' ')[0] || 'Kak'}! 🎉
            </motion.h3>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-3 text-center text-lg text-gray-600"
            >
              ✅ Informasi Anda sudah kami terima dengan baik
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mb-8 rounded-2xl bg-purple-50 p-6"
            >
              <h4 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
                <CameraIcon className="h-5 w-5 text-purple-600" />
                Langkah Selanjutnya:
              </h4>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-purple-600">🔹</span>
                  <span>
                    Tim kami akan menghubungi Anda dalam <strong>24 jam</strong>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-purple-600">🔹</span>
                  <span>
                    Kami akan mendiskusikan detail acara dan memberikan
                    penawaran terbaik
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-purple-600">🔹</span>
                  <span>
                    Atau <strong>hubungi langsung</strong> untuk konsultasi
                    segera!
                  </span>
                </li>
              </ul>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-3"
            >
              {/* Primary CTA - WhatsApp Direct */}
              <button
                onClick={handleWhatsAppDirect}
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 px-6 py-4 text-lg font-semibold text-white transition-all hover:scale-[1.02] hover:shadow-xl"
              >
                <ChatBubbleLeftRightIcon className="h-6 w-6" />
                Hubungi Langsung via WhatsApp
              </button>

              {/* Secondary Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleViewPortfolio}
                  className="flex items-center justify-center gap-2 rounded-xl border-2 border-purple-200 px-4 py-3 font-medium text-purple-700 transition-all hover:bg-purple-50"
                >
                  <CameraIcon className="h-5 w-5" />
                  Lihat Portfolio
                </button>
                <button
                  onClick={handleBackToHome}
                  className="flex items-center justify-center gap-2 rounded-xl border-2 border-gray-200 px-4 py-3 font-medium text-gray-700 transition-all hover:bg-gray-50"
                >
                  <HomeIcon className="h-5 w-5" />
                  Kembali ke Beranda
                </button>
              </div>
            </motion.div>

            {/* Contact Info */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-6 text-center text-sm text-gray-500"
            >
              Butuh bantuan? Hubungi kami kapan saja! 💬
            </motion.p>
          </motion.div>
        </div>
      </section>
    )
  }
  // Form Steps
  // Guard against invalid step data
  if (!currentStepData) {
    return null
  }

  return (
    <section
      id="contact"
      className="bg-gradient-to-br from-purple-50 via-white to-pink-50 px-4 py-16 md:py-24"
    >
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <h2 className="mb-3 text-3xl font-bold text-gray-900 md:text-4xl">
            Konsultasi Gratis 💬
          </h2>
          <p className="text-lg text-gray-600">
            Ceritakan momen spesial Anda, kami siap membantu!
          </p>
        </motion.div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Langkah {currentStep + 1} dari {formSteps.length}
            </span>
            <span className="text-sm font-semibold text-purple-600">
              {Math.round(((currentStep + 1) / formSteps.length) * 100)}%
              selesai
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-gray-200 shadow-inner">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 via-purple-600 to-pink-500"
              initial={{ width: 0 }}
              animate={{
                width: `${((currentStep + 1) / formSteps.length) * 100}%`,
              }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Form Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl md:p-10"
          >
            {/* Icon */}
            {currentStepData?.icon && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100"
              >
                <currentStepData.icon className="h-8 w-8 text-purple-600" />
              </motion.div>
            )}

            {/* Question */}
            <h3 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">
              {currentStepData?.question}
            </h3>
            {currentStepData?.subtitle && (
              <p className="mb-6 text-gray-600">{currentStepData.subtitle}</p>
            )}

            {/* Input Field */}
            {currentStepData?.type === 'select' ? (
              <div className="space-y-3">
                {currentStepData?.options?.map((option, index) => (
                  <motion.button
                    key={option}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => {
                      if (!currentStepData) return
                      handleInputChange(option)
                      setTimeout(() => handleNext(), 300)
                    }}
                    className={`w-full rounded-xl border-2 p-4 text-left font-medium transition-all ${
                      formData[currentStepData.field] === option
                        ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 shadow-md'
                        : 'border-gray-200 text-gray-700 hover:border-purple-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      {formData[currentStepData.field] === option && (
                        <CheckIcon className="h-5 w-5 text-purple-600" />
                      )}
                      {option}
                    </span>
                  </motion.button>
                ))}
              </div>
            ) : currentStepData?.type === 'textarea' ? (
              <textarea
                value={formData[currentStepData.field] || ''}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder={currentStepData.placeholder}
                className="w-full resize-none rounded-xl border-2 border-gray-200 px-6 py-4 text-lg transition-all focus:border-purple-500 focus:outline-none focus:ring-4 focus:ring-purple-100"
                rows={6}
                autoFocus
              />
            ) : (
              <input
                type={currentStepData.type}
                value={formData[currentStepData.field] || ''}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={currentStepData.placeholder}
                className="w-full rounded-xl border-2 border-gray-200 px-6 py-4 text-lg transition-all focus:border-purple-500 focus:outline-none focus:ring-4 focus:ring-purple-100"
                autoFocus
              />
            )}

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3"
                >
                  <span className="text-sm font-medium text-red-600">
                    ⚠️ {error}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            {currentStepData?.type !== 'select' && (
              <div className="mt-6 flex gap-3">
                {currentStep > 0 && (
                  <button
                    onClick={handleBack}
                    className="flex items-center gap-2 rounded-xl border-2 border-gray-200 px-5 py-3 font-medium text-gray-700 transition-all hover:bg-gray-50"
                  >
                    <ArrowLeftIcon className="h-5 w-5" />
                    Kembali
                  </button>
                )}

                {currentStepData.optional && (
                  <button
                    onClick={handleSkip}
                    className="px-5 py-3 font-medium text-gray-500 transition-colors hover:text-gray-700"
                  >
                    Lewati
                  </button>
                )}

                <button
                  onClick={handleNext}
                  disabled={isSubmitting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 text-lg font-semibold text-white transition-all hover:scale-[1.02] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <ArrowPathIcon className="h-5 w-5 animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    <>
                      {currentStep === formSteps.length - 1
                        ? 'Dapatkan Penawaran'
                        : 'Lanjut'}
                      <ArrowRightIcon className="h-5 w-5" />
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Direct Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 text-center"
        >
          <p className="mb-3 text-gray-600">Ingin konsultasi langsung? 🤝</p>
          <button
            onClick={handleWhatsAppDirect}
            className="inline-flex items-center gap-2 rounded-xl border-2 border-green-500 bg-white px-6 py-3 font-semibold text-green-700 shadow-md transition-all hover:bg-green-50 hover:shadow-lg"
          >
            <ChatBubbleLeftRightIcon className="h-5 w-5" />
            Hubungi Langsung via WhatsApp
          </button>
        </motion.div>
      </div>
    </section>
  )
}
