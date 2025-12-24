/**
 * Reusable Error Alert Component
 * Consistent error display across admin dashboard
 */

import { XCircleIcon } from '@heroicons/react/24/outline';

interface ErrorAlertProps {
  error: string | null | undefined;
  title?: string;
  onDismiss?: () => void;
  className?: string;
}

export function ErrorAlert({ 
  error, 
  title = 'Error', 
  onDismiss,
  className = ''
}: ErrorAlertProps) {
  if (!error) return null;
  
  return (
    <div className={`bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 ${className}`}>
      <div className="flex items-start">
        <XCircleIcon className="w-5 h-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-medium text-sm">{title}</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-3 text-red-400 hover:text-red-600 transition-colors"
            aria-label="Dismiss error"
          >
            <XCircleIcon className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}

export default ErrorAlert;
