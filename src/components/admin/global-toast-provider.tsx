'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info, 
  X,
  Loader2
} from 'lucide-react';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'loading';
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
  action?: {
    label: string;
    callback: () => void;
  };
}

interface ToastContextType {
  showToast: (toast: Omit<Toast, 'id'>) => void;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showWarning: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
  showLoading: (title: string, message?: string) => string;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

export function GlobalToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? (toast.persistent ? undefined : 5000)
    };

    setToasts(prev => [newToast, ...prev].slice(0, 5)); // Max 5 toasts

    // Auto-dismiss if not persistent
    if (!toast.persistent && newToast.duration) {
      setTimeout(() => {
        hideToast(id);
      }, newToast.duration);
    }

    return id;
  };

  const hideToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const showSuccess = (title: string, message?: string) => {
    return showToast({ type: 'success', title, message });
  };

  const showError = (title: string, message?: string) => {
    return showToast({ type: 'error', title, message, persistent: true });
  };

  const showWarning = (title: string, message?: string) => {
    return showToast({ type: 'warning', title, message });
  };

  const showInfo = (title: string, message?: string) => {
    return showToast({ type: 'info', title, message });
  };

  const showLoading = (title: string, message?: string) => {
    return showToast({ type: 'loading', title, message, persistent: true });
  };

  const getToastIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info': return <Info className="w-5 h-5 text-blue-500" />;
      case 'loading': return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      default: return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const getToastColors = (type: string) => {
    switch (type) {
      case 'success': return 'border-green-200 bg-green-50';
      case 'error': return 'border-red-200 bg-red-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      case 'info': return 'border-blue-200 bg-blue-50';
      case 'loading': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <ToastContext.Provider value={{
      showToast,
      showSuccess,
      showError,
      showWarning,
      showInfo,
      showLoading,
      hideToast
    }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
        {toasts.map((toast) => (
          <Card 
            key={toast.id}
            className={`p-4 shadow-lg border-l-4 ${getToastColors(toast.type)} animate-in slide-in-from-right duration-300`}
          >
            <div className="flex items-start gap-3">
              {getToastIcon(toast.type)}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm">{toast.title}</h4>
                {toast.message && (
                  <p className="text-xs text-gray-600 mt-1">{toast.message}</p>
                )}
                {toast.action && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 h-7 px-2 text-xs"
                    onClick={() => {
                      toast.action?.callback();
                      hideToast(toast.id);
                    }}
                  >
                    {toast.action.label}
                  </Button>
                )}
              </div>
              {!toast.persistent && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 hover:bg-gray-200"
                  onClick={() => hideToast(toast.id)}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// Global toast utilities for use anywhere
export const globalToast = {
  success: (title: string, message?: string) => {
    window.dispatchEvent(new CustomEvent('global-toast', {
      detail: { type: 'success', title, message }
    }));
  },
  
  error: (title: string, message?: string) => {
    window.dispatchEvent(new CustomEvent('global-toast', {
      detail: { type: 'error', title, message }
    }));
  },
  
  warning: (title: string, message?: string) => {
    window.dispatchEvent(new CustomEvent('global-toast', {
      detail: { type: 'warning', title, message }
    }));
  },
  
  info: (title: string, message?: string) => {
    window.dispatchEvent(new CustomEvent('global-toast', {
      detail: { type: 'info', title, message }
    }));
  },
  
  loading: (title: string, message?: string) => {
    window.dispatchEvent(new CustomEvent('global-toast', {
      detail: { type: 'loading', title, message }
    }));
  }
};