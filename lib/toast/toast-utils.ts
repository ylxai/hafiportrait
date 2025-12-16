import toast from 'react-hot-toast'

// Toast messages constants
export const TOAST_MESSAGES = {
  photo: {
    uploadSuccess: (count: number) => 
      `${count} photo${count > 1 ? 's' : ''} uploaded successfully`,
    uploadError: (filename: string) => 
      `Failed to upload ${filename}`,
    uploadFileSizeError: (filename: string, maxSize: string) =>
      `${filename} exceeds maximum size of ${maxSize}`,
    uploadFileTypeError: (filename: string) =>
      `${filename} has invalid file type`,
    deleteSuccess: 'Photo deleted successfully',
    deleteError: 'Failed to delete photo',
    downloadSuccess: 'Photo downloaded successfully',
    downloadError: 'Failed to download photo',
  },
  event: {
    createSuccess: 'Event created successfully',
    createError: 'Failed to create event',
    updateSuccess: 'Event updated successfully',
    updateError: 'Failed to update event',
    deleteSuccess: 'Event deleted successfully',
    deleteError: 'Failed to delete event',
  },
  message: {
    sendSuccess: 'Message sent successfully',
    sendError: 'Failed to send message',
    deleteSuccess: 'Message deleted successfully',
    deleteError: 'Failed to delete message',
  },
  auth: {
    loginSuccess: 'Logged in successfully',
    loginError: 'Invalid credentials',
    logoutSuccess: 'Logged out successfully',
    logoutError: 'Failed to logout',
  },
  general: {
    saveSuccess: 'Saved successfully',
    saveError: 'Failed to save',
    deleteSuccess: 'Deleted successfully',
    deleteError: 'Failed to delete',
    updateSuccess: 'Updated successfully',
    updateError: 'Failed to update',
  }
}

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
  showSuccessToast(TOAST_MESSAGES.photo.uploadSuccess(count))
}

export const showPhotoUploadError = (filename: string) => {
  showErrorToast(TOAST_MESSAGES.photo.uploadError(filename))
}

export const showPhotoUploadValidationError = (
  filename: string,
  error: 'size' | 'type',
  maxSize?: string
) => {
  if (error === 'size') {
    showErrorToast(
      TOAST_MESSAGES.photo.uploadFileSizeError(filename, maxSize || '50MB')
    )
  } else {
    showErrorToast(
      TOAST_MESSAGES.photo.uploadFileTypeError(filename)
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
  options?: any
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
export const handleApiError = (error: any, defaultMessage: string = 'An error occurred') => {
  const message = error?.response?.data?.error || error?.message || defaultMessage
  showErrorToast(message)
}

// Show promise toast with loading, success, and error states
export const showPromiseToast = async <T>(
  promise: Promise<T>,
  messages: {
    loading: string
    success: string | ((data: T) => string)
    error: string | ((error: any) => string)
  },
  options?: any
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
