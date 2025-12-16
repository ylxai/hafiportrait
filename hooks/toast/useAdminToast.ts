/**
 * Custom Admin Toast Hook
 * Provides toast functions specifically untuk admin operations
 */

import { TOAST_MESSAGES } from '@/lib/toast/toast-config'
import {
  showSuccessToast,
  showErrorToast,
  showLoadingToast,
  updateToast,
  handleApiError,
  showPromiseToast,
} from '@/lib/toast/toast-utils'

export function useAdminToast() {
  return {
    // Authentication toasts
    auth: {
      loginSuccess: () => showSuccessToast(TOAST_MESSAGES.auth.loginSuccess),
      loginError: () => showErrorToast(TOAST_MESSAGES.auth.loginError),
      logoutSuccess: () => showSuccessToast(TOAST_MESSAGES.auth.logoutSuccess),
      sessionExpired: () => showErrorToast(TOAST_MESSAGES.auth.sessionExpired),
      unauthorized: () => showErrorToast(TOAST_MESSAGES.auth.unauthorized),
    },

    // Event toasts
    event: {
      createSuccess: (name: string) => 
        showSuccessToast(TOAST_MESSAGES.event.createSuccess(name)),
      createError: () => 
        showErrorToast(TOAST_MESSAGES.event.createError),
      updateSuccess: (name: string) => 
        showSuccessToast(TOAST_MESSAGES.event.updateSuccess(name)),
      updateError: () => 
        showErrorToast(TOAST_MESSAGES.event.updateError),
      deleteSuccess: (name: string) => 
        showSuccessToast(TOAST_MESSAGES.event.deleteSuccess(name)),
      deleteError: () => 
        showErrorToast(TOAST_MESSAGES.event.deleteError),
      qrGenerateSuccess: () => 
        showSuccessToast(TOAST_MESSAGES.event.qrGenerateSuccess),
      qrGenerateError: () => 
        showErrorToast(TOAST_MESSAGES.event.qrGenerateError),
      statusChangeSuccess: (status: string) => 
        showSuccessToast(TOAST_MESSAGES.event.statusChangeSuccess(status)),
    },

    // Photo toasts
    photo: {
      uploadStart: (count: number) => 
        showLoadingToast(TOAST_MESSAGES.photo.uploadStart(count)),
      uploadProgress: (current: number, total: number) => 
        showLoadingToast(TOAST_MESSAGES.photo.uploadProgress(current, total)),
      uploadSuccess: (count: number) => 
        showSuccessToast(TOAST_MESSAGES.photo.uploadSuccess(count)),
      uploadError: (filename: string) => 
        showErrorToast(TOAST_MESSAGES.photo.uploadError(filename)),
      deleteSuccess: (count: number) => 
        showSuccessToast(TOAST_MESSAGES.photo.deleteSuccess(count)),
      deletePermanentSuccess: (count: number) => 
        showSuccessToast(TOAST_MESSAGES.photo.deletePermanentSuccess(count)),
      restoreSuccess: (count: number) => 
        showSuccessToast(TOAST_MESSAGES.photo.restoreSuccess(count)),
      setCoverSuccess: () => 
        showSuccessToast(TOAST_MESSAGES.photo.setCoverSuccess),
      metadataUpdateSuccess: () => 
        showSuccessToast(TOAST_MESSAGES.photo.metadataUpdateSuccess),
      reorderSuccess: () => 
        showSuccessToast(TOAST_MESSAGES.photo.reorderSuccess),
      optimizingStart: (count: number) => 
        showLoadingToast(TOAST_MESSAGES.photo.optimizingStart(count)),
    },

    // Package toasts
    package: {
      createSuccess: (name: string) => 
        showSuccessToast(TOAST_MESSAGES.package.createSuccess(name)),
      updateSuccess: (name: string) => 
        showSuccessToast(TOAST_MESSAGES.package.updateSuccess(name)),
      deleteSuccess: (name: string) => 
        showSuccessToast(TOAST_MESSAGES.package.deleteSuccess(name)),
      deleteError: () => 
        showErrorToast(TOAST_MESSAGES.package.deleteError),
      toggleActiveSuccess: (name: string, isActive: boolean) => 
        showSuccessToast(TOAST_MESSAGES.package.toggleActiveSuccess(name, isActive)),
      toggleBestSellerSuccess: (name: string, isBest: boolean) => 
        showSuccessToast(TOAST_MESSAGES.package.toggleBestSellerSuccess(name, isBest)),
    },

    // Category toasts
    category: {
      createSuccess: (name: string) => 
        showSuccessToast(TOAST_MESSAGES.category.createSuccess(name)),
      updateSuccess: (name: string) => 
        showSuccessToast(TOAST_MESSAGES.category.updateSuccess(name)),
      deleteSuccess: (name: string) => 
        showSuccessToast(TOAST_MESSAGES.category.deleteSuccess(name)),
      deleteError: (hasPackages: boolean) => 
        showErrorToast(TOAST_MESSAGES.category.deleteError(hasPackages)),
    },

    // Message toasts
    message: {
      statusUpdateSuccess: (status: string) => 
        showSuccessToast(TOAST_MESSAGES.message.statusUpdateSuccess(status)),
      deleteSuccess: () => 
        showSuccessToast(TOAST_MESSAGES.message.deleteSuccess),
      replySuccess: (clientName: string) => 
        showSuccessToast(TOAST_MESSAGES.message.replySuccess(clientName)),
    },

    // Hero slideshow toasts
    hero: {
      uploadSuccess: (count: number) => 
        showSuccessToast(TOAST_MESSAGES.hero.uploadSuccess(count)),
      deleteSuccess: () => 
        showSuccessToast(TOAST_MESSAGES.hero.deleteSuccess),
      reorderSuccess: () => 
        showSuccessToast(TOAST_MESSAGES.hero.reorderSuccess),
      settingsUpdateSuccess: () => 
        showSuccessToast(TOAST_MESSAGES.hero.settingsUpdateSuccess),
    },

    // Bento grid toasts
    bentoGrid: {
      updateSuccess: () => 
        showSuccessToast(TOAST_MESSAGES.bentoGrid.updateSuccess),
      imageUploadSuccess: () => 
        showSuccessToast(TOAST_MESSAGES.bentoGrid.imageUploadSuccess),
    },

    // Portfolio toasts
    portfolio: {
      uploadSuccess: (count: number) => 
        showSuccessToast(TOAST_MESSAGES.portfolio.uploadSuccess(count)),
      deleteSuccess: () => 
        showSuccessToast(TOAST_MESSAGES.portfolio.deleteSuccess),
      updateSuccess: () => 
        showSuccessToast(TOAST_MESSAGES.portfolio.updateSuccess),
    },

    // Form submission toasts
    formSubmission: {
      statusUpdateSuccess: () => 
        showSuccessToast(TOAST_MESSAGES.formSubmission.statusUpdateSuccess),
      deleteSuccess: () => 
        showSuccessToast(TOAST_MESSAGES.formSubmission.deleteSuccess),
    },

    // Additional service toasts
    additionalService: {
      createSuccess: (name: string) => 
        showSuccessToast(TOAST_MESSAGES.additionalService.createSuccess(name)),
      updateSuccess: (name: string) => 
        showSuccessToast(TOAST_MESSAGES.additionalService.updateSuccess(name)),
      deleteSuccess: (name: string) => 
        showSuccessToast(TOAST_MESSAGES.additionalService.deleteSuccess(name)),
    },

    // Comment toasts
    comment: {
      approveSuccess: (count: number) => 
        showSuccessToast(TOAST_MESSAGES.comment.approveSuccess(count)),
      rejectSuccess: (count: number) => 
        showSuccessToast(TOAST_MESSAGES.comment.rejectSuccess(count)),
      deleteSuccess: (count: number) => 
        showSuccessToast(TOAST_MESSAGES.comment.deleteSuccess(count)),
    },

    // Generic toasts
    generic: {
      saveSuccess: () => 
        showSuccessToast(TOAST_MESSAGES.generic.saveSuccess),
      saveError: () => 
        showErrorToast(TOAST_MESSAGES.generic.saveError),
      loadError: () => 
        showErrorToast(TOAST_MESSAGES.generic.loadError),
      networkError: () => 
        showErrorToast(TOAST_MESSAGES.generic.networkError),
      copySuccess: () => 
        showSuccessToast(TOAST_MESSAGES.generic.copySuccess),
    },

    // Utility functions
    showPromise: showPromiseToast,
    showLoading: showLoadingToast,
    updateToast: updateToast,
    handleApiError: handleApiError,
  }
}
