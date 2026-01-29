export default function BooksLoading() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="animate-pulse">
          {/* Header Skeleton */}
          <div className="mb-8">
            <div className="h-10 bg-[#1a1a1a] rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-[#1a1a1a] rounded w-1/2"></div>
          </div>

          {/* Books Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
                <div className="h-6 bg-[#2a2a2a] rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-[#2a2a2a] rounded w-1/2 mb-6"></div>
                <div className="space-y-2 mb-4">
                  <div className="h-3 bg-[#2a2a2a] rounded w-2/3"></div>
                  <div className="h-3 bg-[#2a2a2a] rounded w-1/2"></div>
                </div>
                <div className="h-10 bg-[#2a2a2a] rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
