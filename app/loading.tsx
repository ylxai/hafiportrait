export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center">
        {/* Animated logo or spinner */}
        <div className="mb-6">
          <div className="relative w-20 h-20 mx-auto">
            {/* Outer spinning ring */}
            <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
            
            {/* Inner pulsing dot */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Loading text */}
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Memuat...
        </h2>
        <p className="text-gray-600 text-sm">
          Mohon tunggu sebentar
        </p>

        {/* Optional: Loading bars for visual feedback */}
        <div className="mt-8 flex gap-2 justify-center">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  )
}
