'use client';

import { useState } from 'react';
import { Button } from './button';
import { Badge } from './badge';
import { X, ExternalLink, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';

export interface EnhancedToastProps {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  icon?: string;
  duration?: number;
  persistent?: boolean;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  action?: {
    label: string;
    callback: () => void;
  };
  secondaryAction?: {
    label: string;
    callback: () => void;
  };
  onDismiss: (id: string) => void;
}

export function EnhancedToast({
  id,
  type,
  title,
  message,
  icon,
  duration = 5000,
  persistent = false,
  priority = 'medium',
  action,
  secondaryAction,
  onDismiss
}: EnhancedToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [timeLeft, setTimeLeft] = useState(duration);

  // Auto dismiss after duration (unless persistent)
  useState(() => {
    if (persistent) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 100) {
          setIsVisible(false);
          setTimeout(() => onDismiss(id), 300);
          return 0;
        }
        return prev - 100;
      });
    }, 100);

    return () => clearInterval(interval);
  });

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => onDismiss(id), 300);
  };

  const getTypeStyles = () => {
    const styles = {
      success: {
        bg: 'bg-green-50 border-green-200',
        icon: <CheckCircle className="w-5 h-5 text-green-600" />,
        titleColor: 'text-green-900',
        messageColor: 'text-green-700'
      },
      warning: {
        bg: 'bg-yellow-50 border-yellow-200',
        icon: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
        titleColor: 'text-yellow-900',
        messageColor: 'text-yellow-700'
      },
      error: {
        bg: 'bg-red-50 border-red-200',
        icon: <XCircle className="w-5 h-5 text-red-600" />,
        titleColor: 'text-red-900',
        messageColor: 'text-red-700'
      },
      info: {
        bg: 'bg-blue-50 border-blue-200',
        icon: <Info className="w-5 h-5 text-blue-600" />,
        titleColor: 'text-blue-900',
        messageColor: 'text-blue-700'
      }
    };
    return styles[type];
  };

  const getPriorityBadge = () => {
    if (priority === 'low') return null;
    
    const badges = {
      urgent: <Badge variant="destructive" className="text-xs animate-pulse">Urgent</Badge>,
      high: <Badge variant="destructive" className="text-xs bg-orange-500">High</Badge>,
      medium: <Badge variant="secondary" className="text-xs">Medium</Badge>
    };
    return badges[priority as keyof typeof badges];
  };

  const typeStyles = getTypeStyles();
  const progressPercentage = persistent ? 100 : (timeLeft / duration) * 100;

  if (!isVisible) return null;

  return (
    <div className={`
      relative w-full max-w-md p-4 rounded-lg border shadow-lg
      transform transition-all duration-300 ease-in-out
      ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      ${typeStyles.bg}
    `}>
      {/* Progress bar */}
      {!persistent && (
        <div className="absolute top-0 left-0 h-1 bg-gray-200 rounded-t-lg w-full overflow-hidden">
          <div 
            className="h-full bg-current transition-all duration-100 ease-linear"
            style={{ 
              width: `${progressPercentage}%`,
              backgroundColor: type === 'error' ? '#ef4444' : 
                             type === 'warning' ? '#f59e0b' :
                             type === 'success' ? '#10b981' : '#3b82f6'
            }}
          />
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {icon ? (
            <span className="text-lg">{icon}</span>
          ) : (
            typeStyles.icon
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={`font-semibold text-sm ${typeStyles.titleColor}`}>
              {title}
            </h4>
            {getPriorityBadge()}
          </div>
          
          <p className={`text-sm ${typeStyles.messageColor} mb-3`}>
            {message}
          </p>

          {/* Actions */}
          {(action || secondaryAction) && (
            <div className="flex items-center gap-2">
              {action && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    action.callback();
                    handleDismiss();
                  }}
                  className="text-xs h-7"
                >
                  {action.label}
                  <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              )}
              
              {secondaryAction && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    secondaryAction.callback();
                    handleDismiss();
                  }}
                  className="text-xs h-7"
                >
                  {secondaryAction.label}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Dismiss button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="h-6 w-6 p-0 flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// Enhanced Toast Container
export function EnhancedToastContainer({ 
  toasts, 
  onDismiss 
}: { 
  toasts: EnhancedToastProps[]; 
  onDismiss: (id: string) => void;
}) {
  // Sort toasts by priority
  const sortedToasts = [...toasts].sort((a, b) => {
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
    const aPriority = priorityOrder[a.priority || 'medium'];
    const bPriority = priorityOrder[b.priority || 'medium'];
    return bPriority - aPriority;
  });

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
      {sortedToasts.map((toast) => (
        <EnhancedToast
          key={toast.id}
          {...toast}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
}