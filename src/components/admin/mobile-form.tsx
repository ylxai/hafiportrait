import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MobileFormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  help?: string;
  children: ReactNode;
  className?: string;
}

export function MobileFormField({ 
  label, 
  required, 
  error, 
  help, 
  children, 
  className 
}: MobileFormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <label className="block">
        <span className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </span>
      </label>
      {children}
      {help && !error && (
        <p className="text-xs text-gray-500">{help}</p>
      )}
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}

interface MobileFormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function MobileFormSection({ 
  title, 
  description, 
  children, 
  className 
}: MobileFormSectionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {description && (
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        )}
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

interface MobileFormActionsProps {
  children: ReactNode;
  sticky?: boolean;
  className?: string;
}

export function MobileFormActions({ 
  children, 
  sticky = true, 
  className 
}: MobileFormActionsProps) {
  return (
    <div className={cn(
      "flex gap-3 p-4 bg-white border-t",
      sticky && [
        "sticky bottom-0 left-0 right-0 z-20",
        "shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]"
      ],
      className
    )}>
      {children}
    </div>
  );
}

// Input component yang mobile-friendly
interface MobileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
}

export function MobileInput({ 
  icon, 
  className, 
  ...props 
}: MobileInputProps) {
  return (
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          {icon}
        </div>
      )}
      <input
        className={cn(
          "w-full px-3 py-3 rounded-lg border border-gray-300",
          "text-base", // Larger text for mobile
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
          "placeholder:text-gray-400",
          "disabled:bg-gray-100 disabled:text-gray-500",
          icon && "pl-10",
          className
        )}
        {...props}
      />
    </div>
  );
}

// Textarea component yang mobile-friendly
interface MobileTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  resize?: boolean;
}

export function MobileTextarea({ 
  resize = true, 
  className, 
  ...props 
}: MobileTextareaProps) {
  return (
    <textarea
      className={cn(
        "w-full px-3 py-3 rounded-lg border border-gray-300",
        "text-base", // Larger text for mobile
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
        "placeholder:text-gray-400",
        "disabled:bg-gray-100 disabled:text-gray-500",
        !resize && "resize-none",
        className
      )}
      {...props}
    />
  );
}

// Select component yang mobile-friendly
interface MobileSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function MobileSelect({ 
  options, 
  placeholder, 
  className, 
  ...props 
}: MobileSelectProps) {
  return (
    <select
      className={cn(
        "w-full px-3 py-3 rounded-lg border border-gray-300",
        "text-base", // Larger text for mobile
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
        "disabled:bg-gray-100 disabled:text-gray-500",
        "appearance-none bg-white",
        "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20fill%3D%22none%22%20stroke%3D%22%23374151%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M3%204.5L6%207.5L9%204.5%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_12px_center] bg-no-repeat pr-10",
        className
      )}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}