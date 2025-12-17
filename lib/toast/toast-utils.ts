/**
 * Toast Utility Functions
 * Helper functions for showing toast notifications
 * Uses react-hot-toast library
 */

import toast from 'react-hot-toast'

// Toast helper functions
export const showSuccessToast = (message: string) => {
  toast.success(message, {
    duration: 3000,
    position: 'top-center',
  })
}

export const showErrorToast = (message: string) => {
  toast.error(message, {
    duration: 4000,
    position: 'top-center',
  })
}

export const showLoadingToast = (message: string) => {
  return toast.loading(message, {
    position: 'top-center',
  })
}

export const dismissToast = (toastId: string) => {
  toast.dismiss(toastId)
}

// Photo upload toast helpers
export const showPhotoUploadSuccess = (count: number) => {
  showSuccessToast(`${count} photo${count > 1 ? 's' : ''} uploaded successfully`)
}

export const showPhotoUploadError = (filename: string) => {
  showErrorToast(`Failed to upload ${filename}`)
}

export const showPhotoUploadValidationError = (
  filename: string,
  error: 'size' | 'type',
  maxSize?: string
) => {
  if (error === 'size') {
    showErrorToast(
      `${filename} exceeds maximum size of ${maxSize || '50MB'}`
    )
  } else {
    showErrorToast(
      `${filename} has invalid file type`
    )
  }
}

// File validation error helper (alias for showPhotoUploadValidationError)
export const showFileValidationError = showPhotoUploadValidationError

// Update toast function
export const updateToast = (
  toastId: string, 
  type: 'success' | 'error' | 'warning' | 'info', 
  message: string,
  options?: Record<string, unknown>
) => {
  toast.dismiss(toastId)
  
  switch (type) {
    case 'success':
      toast.success(message, { id: toastId, ...options })
      break
    case 'error':
      toast.error(message, { id: toastId, ...options })
      break
    case 'warning':
      toast(message, { 
        id: toastId, 
        icon: '⚠️',
        style: {
          background: '#FEF3C7',
          color: '#92400E',
        },
        ...options 
      })
      break
    case 'info':
      toast(message, { 
        id: toastId, 
        icon: 'ℹ️',
        style: {
          background: '#DBEAFE',
          color: '#1E40AF',
        },
        ...options 
      })
      break
  }
}

// Handle API errors with toast
export const handleApiError = (error: unknown, defaultMessage: string = 'An error occurred') => {
  const errorObj = error as { response?: { data?: { error?: string } }; message?: string }
  let message = defaultMessage
  
  // Extract string message from various error formats
  if (errorObj?.response?.data?.error) {
    message = typeof errorObj.response.data.error === 'string' 
      ? errorObj.response.data.error 
      : JSON.stringify(errorObj.response.data.error)
  } else if (errorObj?.message) {
    message = typeof errorObj.message === 'string' 
      ? errorObj.message 
      : JSON.stringify(errorObj.message)
  }
  
  showErrorToast(message)
}

// Show promise toast with loading, success, and error states
export const showPromiseToast = async <T>(
  promise: Promise<T>,
  messages: {
    loading: string
    success: string | ((data: T) => string)
    error: string | ((error: unknown) => string)
  },
  options?: Record<string, unknown>
): Promise<T> => {
  return toast.promise(
    promise,
    {
      loading: messages.loading,
      success: (data) => 
        typeof messages.success === 'function' 
          ? messages.success(data) 
          : messages.success,
      error: (error) =>
        typeof messages.error === 'function'
          ? messages.error(error)
          : messages.error,
    },
    {
      position: 'top-center',
      ...options,
    }
  )
}

// Copy to clipboard with toast notification
export const copyToClipboardWithToast = async (text: string, label: string = 'Text') => {
  try {
    await navigator.clipboard.writeText(text)
    showSuccessToast(`${label} copied to clipboard`)
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    showErrorToast(`Failed to copy ${label.toLowerCase()}`)
  }
}
