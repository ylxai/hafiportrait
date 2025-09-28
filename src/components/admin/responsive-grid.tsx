import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveGridProps {
  children: ReactNode;
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ResponsiveGrid({ 
  children, 
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 'md',
  className 
}: ResponsiveGridProps) {
  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6'
  };

  return (
    <div className={cn(
      "grid",
      gapClasses[gap],
      `grid-cols-${columns.mobile || 1}`,
      `sm:grid-cols-${columns.tablet || 2}`,
      `lg:grid-cols-${columns.desktop || 3}`,
      className
    )}>
      {children}
    </div>
  );
}

// Komponen Card yang mobile-friendly
interface MobileCardProps {
  title: string;
  subtitle?: string;
  value?: string | number;
  icon?: ReactNode;
  children?: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function MobileCard({ 
  title, 
  subtitle, 
  value, 
  icon, 
  children, 
  onClick,
  className 
}: MobileCardProps) {
  const Component = onClick ? 'button' : 'div';
  
  return (
    <Component
      onClick={onClick}
      className={cn(
        "bg-white rounded-lg border border-gray-200 p-4",
        "transition-all duration-200",
        onClick && [
          "cursor-pointer touch-manipulation",
          "hover:border-gray-300 hover:shadow-md",
          "active:scale-[0.98] active:shadow-sm"
        ],
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 text-left">
          <h3 className="font-medium text-gray-900 text-sm sm:text-base">{title}</h3>
          {subtitle && (
            <p className="text-xs sm:text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
          {value !== undefined && (
            <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-2">{value}</p>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 text-gray-400">
            {icon}
          </div>
        )}
      </div>
      {children && (
        <div className="mt-4">
          {children}
        </div>
      )}
    </Component>
  );
}