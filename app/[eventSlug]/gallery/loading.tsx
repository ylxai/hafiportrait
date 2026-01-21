export default function GalleryLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header Skeleton */}
      <div className="bg-white border-b border-gray-200 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded-lg w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded-lg w-64"></div>
          </div>
        </div>
      </div>

      {/* Gallery Grid Skeleton */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Generate 12 skeleton cards */}
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square bg-gray-200 rounded-lg"></div>
              <div className="mt-2 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Loading text */}
        <div className="text-center mt-8">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-white rounded-full shadow-sm">
            <div className="relative w-5 h-5">
              <div className="absolute inset-0 border-2 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <span className="text-gray-600 font-medium">Memuat foto...</span>
          </div>
        </div>
      </div>
    </div>
  )
}
