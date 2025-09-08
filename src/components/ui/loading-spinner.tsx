import { cn } from "@/lib/utils"

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {}

export default function LoadingSpinner({ className, ...props }: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-gray-300 border-t-gray-900 h-8 w-8",
        className
      )}
      {...props}
    />
  )
}
