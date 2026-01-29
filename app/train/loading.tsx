export default function TrainLoading() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
      <div className="max-w-4xl w-full px-4">
        <div className="bg-[#171717] border border-[#262626] rounded-lg p-8 animate-pulse">
          {/* Header */}
          <div className="h-8 bg-[#2a2a2a] rounded w-1/3 mb-8"></div>

          {/* Reference Text Skeleton */}
          <div className="space-y-3 mb-8">
            <div className="h-4 bg-[#2a2a2a] rounded"></div>
            <div className="h-4 bg-[#2a2a2a] rounded"></div>
            <div className="h-4 bg-[#2a2a2a] rounded w-5/6"></div>
          </div>

          {/* Input Area Skeleton */}
          <div className="h-48 bg-[#2a2a2a] rounded mb-4"></div>

          {/* Button Skeleton */}
          <div className="h-12 bg-[#2a2a2a] rounded"></div>
        </div>
      </div>
    </div>
  )
}
