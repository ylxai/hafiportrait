'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Loader2, 
  MessageCircle, 
  Home, 
  Camera,
  Calendar,
  MapPin,
  DollarSign,
  Sparkles,
  User
} from 'lucide-react'

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
    question: "Hai! Siapa nama Anda? 👋",
    subtitle: "Kami ingin mengenal Anda lebih baik",
    type: 'text',
    field: 'name',
    placeholder: 'Contoh: Budi & Sarah',
    validation: (value) => value.length >= 2,
    errorMessage: 'Mohon masukkan nama Anda',
    icon: User
  },
  {
    id: 'step-2',
    question: "Nomor WhatsApp Anda? 📱",
    subtitle: "Kami akan menghubungi Anda melalui WhatsApp",
    type: 'tel',
    field: 'whatsapp',
    placeholder: '0895 7005 03193',
    validation: (value) => /^[0-9+\s-()]{10,}$/.test(value),
    errorMessage: 'Mohon masukkan nomor WhatsApp yang valid',
    icon: MessageCircle
  },
  {
    id: 'step-3',
    question: "Jenis layanan apa yang Anda cari? 📸",
    subtitle: "Pilih satu yang paling sesuai dengan kebutuhan Anda",
    type: 'select',
    field: 'package',
    options: [
      'Fotografi Pernikahan',
      'Prewedding', 
      'Tasmiyah & Tasyakuran',
      'Ulang Tahun',
      'Studio Couple',
      'Event Lainnya'
    ],
    icon: Camera
  },
  {
    id: 'step-4',
    question: "Kapan tanggal acara Anda? 📅",
    subtitle: "Perkiraan tanggal juga tidak masalah",
    type: 'text',
    field: 'date',
    placeholder: 'Contoh: Desember 2024 atau 15 Juni 2025',
    validation: (value) => value.length >= 3,
    errorMessage: 'Mohon masukkan perkiraan tanggal',
    icon: Calendar
  },
  {
    id: 'step-5',
    question: "Di mana lokasi acara Anda? 📍",
    subtitle: "Lokasi membantu kami merencanakan lebih baik",
    type: 'text',
    field: 'location',
    placeholder: 'Contoh: Banjarmasin, Martapura, atau venue tertentu',
    validation: (value) => value.length >= 3,
    errorMessage: 'Mohon masukkan lokasi acara',
    icon: MapPin
  },
  {
    id: 'step-6',
    question: "Budget range Anda? 💰",
    subtitle: "Opsional - membantu kami memberikan rekomendasi terbaik",
    type: 'select',
    field: 'budget',
    options: [
      'Di bawah Rp 5 juta',
      'Rp 5 juta - Rp 10 juta',
      'Rp 10 juta - Rp 20 juta',
      'Di atas Rp 20 juta',
      'Belum yakin / Konsultasi dulu'
    ],
    optional: true,
    icon: DollarSign
  },
  {
    id: 'step-7',
    question: "Ceritakan visi Anda tentang sesi foto! ✨",
    subtitle: "Konsep, tema, inspirasi, atau pertanyaan - ceritakan semua!",
    type: 'textarea',
    field: 'message',
    placeholder: 'Contoh: Kami ingin sesi prewedding outdoor dengan tema natural dan candid. Kami suka gaya foto yang warm dan intimate...',
    validation: (value) => value.length >= 10,
    errorMessage: 'Mohon ceritakan lebih detail (minimal 10 karakter)',
    icon: Sparkles
  }
]

export default function ConversationalForm() {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const currentStepData = formSteps[currentStep]

  const handleInputChange = (value: string) => {
    setFormData({ ...formData, [currentStepData.field]: value })
    setError('')
  }

  const validateStep = () => {
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
    if (e.key === 'Enter' && currentStepData.type !== 'textarea') {
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
    const portfolioSection = document.getElementById('portfolio') || document.getElementById('gallery')
    if (portfolioSection) {
      portfolioSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Success Screen
  if (isSubmitted) {
    return (
      <section id="contact" className="py-16 md:py-24 px-4 bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl p-8 md:p-12"
          >
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
            >
              <Check className="w-12 h-12 text-white" strokeWidth={3} />
            </motion.div>

            {/* Success Message */}
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-center"
            >
              Terima Kasih, {formData.name?.split(' ')[0] || 'Kak'}! 🎉
            </motion.h3>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg text-gray-600 mb-3 text-center"
            >
              ✅ Informasi Anda sudah kami terima dengan baik
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-purple-50 rounded-2xl p-6 mb-8"
            >
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Camera className="w-5 h-5 text-purple-600" />
                Langkah Selanjutnya:
              </h4>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">🔹</span>
                  <span>Tim kami akan menghubungi Anda dalam <strong>24 jam</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">🔹</span>
                  <span>Kami akan mendiskusikan detail acara dan memberikan penawaran terbaik</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">🔹</span>
                  <span>Atau <strong>hubungi langsung</strong> untuk konsultasi segera!</span>
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
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold text-lg hover:shadow-xl hover:scale-[1.02] transition-all"
              >
                <MessageCircle className="w-6 h-6" />
                Hubungi Langsung via WhatsApp
              </button>

              {/* Secondary Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleViewPortfolio}
                  className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-purple-200 text-purple-700 rounded-xl font-medium hover:bg-purple-50 transition-all"
                >
                  <Camera className="w-5 h-5" />
                  Lihat Portfolio
                </button>
                <button
                  onClick={handleBackToHome}
                  className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all"
                >
                  <Home className="w-5 h-5" />
                  Kembali ke Beranda
                </button>
              </div>
            </motion.div>

            {/* Contact Info */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-center text-sm text-gray-500 mt-6"
            >
              Butuh bantuan? Hubungi kami kapan saja! 💬
            </motion.p>
          </motion.div>
        </div>
      </section>
  )

  }
  // Form Steps
  return (
    <section id="contact" className="py-16 md:py-24 px-4 bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Konsultasi Gratis 💬
          </h2>
          <p className="text-gray-600 text-lg">
            Ceritakan momen spesial Anda, kami siap membantu!
          </p>
        </motion.div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-gray-700">
              Langkah {currentStep + 1} dari {formSteps.length}
            </span>
            <span className="text-sm font-semibold text-purple-600">
              {Math.round(((currentStep + 1) / formSteps.length) * 100)}% selesai
            </span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 via-purple-600 to-pink-500"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / formSteps.length) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
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
            className="bg-white rounded-3xl shadow-2xl p-6 md:p-10 border border-gray-100"
          >
            {/* Icon */}
            {currentStepData.icon && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mb-6"
              >
                <currentStepData.icon className="w-8 h-8 text-purple-600" />
              </motion.div>
            )}

            {/* Question */}
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              {currentStepData.question}
            </h3>
            {currentStepData.subtitle && (
              <p className="text-gray-600 mb-6">
                {currentStepData.subtitle}
              </p>
            )}

            {/* Input Field */}
            {currentStepData.type === 'select' ? (
              <div className="space-y-3">
                {currentStepData.options?.map((option, index) => (
                  <motion.button
                    key={option}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => {
                      handleInputChange(option)
                      setTimeout(() => handleNext(), 300)
                    }}
                    className={`w-full p-4 text-left rounded-xl border-2 transition-all font-medium ${
                      formData[currentStepData.field] === option
                        ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 shadow-md'
                        : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      {formData[currentStepData.field] === option && (
                        <Check className="w-5 h-5 text-purple-600" />
                      )}
                      {option}
                    </span>
                  </motion.button>
                ))}
              </div>
            ) : currentStepData.type === 'textarea' ? (
              <textarea
                value={formData[currentStepData.field] || ''}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder={currentStepData.placeholder}
                className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl text-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-100 focus:outline-none transition-all resize-none"
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
                className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl text-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-100 focus:outline-none transition-all"
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
                  className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2"
                >
                  <span className="text-red-600 text-sm font-medium">
                    ⚠️ {error}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            {currentStepData.type !== 'select' && (
              <div className="flex gap-3 mt-6">
                {currentStep > 0 && (
                  <button
                    onClick={handleBack}
                    className="flex items-center gap-2 px-5 py-3 border-2 border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-all"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Kembali
                  </button>
                )}
                
                {currentStepData.optional && (
                  <button
                    onClick={handleSkip}
                    className="px-5 py-3 text-gray-500 hover:text-gray-700 font-medium transition-colors"
                  >
                    Lewati
                  </button>
                )}

                <button
                  onClick={handleNext}
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold text-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    <>
                      {currentStep === formSteps.length - 1 ? 'Dapatkan Penawaran' : 'Lanjut'}
                      <ArrowRight className="w-5 h-5" />
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
          <p className="text-gray-600 mb-3">
            Ingin konsultasi langsung? 🤝
          </p>
          <button
            onClick={handleWhatsAppDirect}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-green-500 text-green-700 rounded-xl font-semibold hover:bg-green-50 transition-all shadow-md hover:shadow-lg"
          >
            <MessageCircle className="w-5 h-5" />
            Hubungi Langsung via WhatsApp
          </button>
        </motion.div>
      </div>
    </section>
  )
}
