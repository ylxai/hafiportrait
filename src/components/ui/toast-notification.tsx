'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { X, CheckCircle, XCircle, AlertCircle, Info, Camera, Upload, Bell } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'upload' | 'camera';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  persistent?: boolean;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = {
      id,
      duration: 5000,
      ...toast,
    };

    setToasts(prev => [...prev, newToast]);

    // Auto remove toast after duration (unless persistent)
    if (!newToast.persistent && newToast.duration) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const clearAllToasts = () => {
    setToasts([]);
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearAllToasts }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

function ToastContainer() {
  const { toasts } = useToast();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

function ToastItem({ toast }: { toast: Toast }) {
  const { removeToast } = useToast();
  const [isVisible, setIsVisible] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const handleRemove = () => {
    setIsRemoving(true);
    setTimeout(() => {
      removeToast(toast.id);
    }, 200);
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'upload':
        return <Upload className="h-5 w-5 text-purple-500" />;
      case 'camera':
        return <Camera className="h-5 w-5 text-indigo-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      case 'upload':
        return 'bg-purple-50 border-purple-200';
      case 'camera':
        return 'bg-indigo-50 border-indigo-200';
      default:
        return 'bg-white border-gray-200';
    }
  };

  return (
    <div
      className={`
        relative overflow-hidden rounded-lg border shadow-lg backdrop-blur-sm
        transform transition-all duration-200 ease-out
        ${isVisible && !isRemoving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${getBackgroundColor()}
        touch-feedback
      `}
      style={{
        animation: isVisible && !isRemoving ? 'slideInRight 0.2s ease-out' : undefined
      }}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">
              {toast.title}
            </p>
            {toast.message && (
              <p className="text-sm text-gray-600 mt-1">
                {toast.message}
              </p>
            )}
            
            {toast.action && (
              <button
                onClick={toast.action.onClick}
                className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-500 touch-feedback"
              >
                {toast.action.label}
              </button>
            )}
          </div>
          
          <button
            onClick={handleRemove}
            className="flex-shrink-0 p-1 rounded-md hover:bg-gray-100 touch-feedback"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </div>
      
      {/* Progress bar for timed toasts */}
      {!toast.persistent && toast.duration && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
          <div
            className="h-full bg-current opacity-30"
            style={{
              animation: `shrink ${toast.duration}ms linear forwards`
            }}
          />
        </div>
      )}
    </div>
  );
}

// Predefined toast helpers
export const toast = {
  success: (title: string, message?: string, options?: Partial<Toast>) => ({
    type: 'success' as ToastType,
    title,
    message,
    ...options,
  }),
  
  error: (title: string, message?: string, options?: Partial<Toast>) => ({
    type: 'error' as ToastType,
    title,
    message,
    ...options,
  }),
  
  warning: (title: string, message?: string, options?: Partial<Toast>) => ({
    type: 'warning' as ToastType,
    title,
    message,
    ...options,
  }),
  
  info: (title: string, message?: string, options?: Partial<Toast>) => ({
    type: 'info' as ToastType,
    title,
    message,
    ...options,
  }),
  
  upload: (title: string, message?: string, options?: Partial<Toast>) => ({
    type: 'upload' as ToastType,
    title,
    message,
    ...options,
  }),
  
  camera: (title: string, message?: string, options?: Partial<Toast>) => ({
    type: 'camera' as ToastType,
    title,
    message,
    ...options,
  }),
};

// CSS animations (add to globals.css)
const toastStyles = `
@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes shrink {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}

/* Mobile optimizations */
@media (max-width: 640px) {
  .toast-container {
    top: 1rem;
    right: 1rem;
    left: 1rem;
    max-width: none;
  }
}
`;

export { toastStyles };