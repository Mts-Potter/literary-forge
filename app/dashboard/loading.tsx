export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="animate-pulse">
          {/* Header Skeleton */}
          <div className="h-10 bg-[var(--card)] rounded w-1/3 mb-8"></div>

          {/* Stats Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
                <div className="h-4 bg-[var(--border)] rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-[var(--border)] rounded w-1/3"></div>
              </div>
            ))}
          </div>

          {/* Books Grid Skeleton */}
          <div className="h-6 bg-[var(--card)] rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
                <div className="h-6 bg-[var(--border)] rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-[var(--border)] rounded w-1/2 mb-4"></div>
                <div className="h-10 bg-[var(--border)] rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
