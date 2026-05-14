export default function TrainLoading() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex items-center justify-center">
      <div className="max-w-4xl w-full px-4">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-8 animate-pulse">
          {/* Header */}
          <div className="h-8 bg-[var(--border)] rounded w-1/3 mb-8"></div>

          {/* Reference Text Skeleton */}
          <div className="space-y-3 mb-8">
            <div className="h-4 bg-[var(--border)] rounded"></div>
            <div className="h-4 bg-[var(--border)] rounded"></div>
            <div className="h-4 bg-[var(--border)] rounded w-5/6"></div>
          </div>

          {/* Input Area Skeleton */}
          <div className="h-48 bg-[var(--border)] rounded mb-4"></div>

          {/* Button Skeleton */}
          <div className="h-12 bg-[var(--border)] rounded"></div>
        </div>
      </div>
    </div>
  )
}
