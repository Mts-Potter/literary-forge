'use client'

export function FeedbackView({
  original,
  user,
  feedback,
  onContinue
}: {
  original: string
  user: string
  feedback: any
  onContinue: () => void
}) {
  const { scores, overall_accuracy, feedback: feedbackText, schedule } = feedback

  // Calculate grade color
  const getGradeColor = (score: number) => {
    if (score >= 92) return 'text-green-600 bg-green-50'
    if (score >= 78) return 'text-blue-600 bg-blue-50'
    if (score >= 55) return 'text-orange-600 bg-orange-50'
    return 'text-red-600 bg-red-50'
  }

  return (
    <div className="bg-[#0a0a0a] p-3">
      <div className="max-w-5xl mx-auto">
        {/* Header with overall score */}
        <div className="bg-[#171717] border border-[#262626] rounded-lg p-4 mb-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-white">Review Feedback</h1>
            <div className={`px-4 py-2 rounded-lg font-bold text-2xl ${getGradeColor(overall_accuracy)}`}>
              {overall_accuracy.toFixed(0)}%
            </div>
          </div>

          {/* FSRS Schedule Info */}
          {schedule && (
            <div className="flex items-center gap-3 p-3 bg-blue-900/20 border border-blue-700 rounded-lg">
              <div className="text-2xl">📅</div>
              <div>
                <p className="font-semibold text-blue-300 text-sm">{schedule.message}</p>
                <p className="text-xs text-blue-400 mt-0.5">
                  Grade: {schedule.grade}/4 • Next: {new Date(schedule.next_review).toLocaleDateString('de-DE')}
                  {schedule.interval_days > 0 && ` (in ${schedule.interval_days} ${schedule.interval_days === 1 ? 'Tag' : 'Tagen'})`}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Detailed Scores */}
        {scores && (
          <div className="bg-[#171717] border border-[#262626] rounded-lg p-4 mb-3">
            <h2 className="text-base font-bold text-white mb-3">Detailed Analysis</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(scores).map(([category, score]: [string, any]) => (
                <div key={category} className="text-center p-3 bg-[#0a0a0a] rounded-lg">
                  <p className="text-xs text-gray-400 capitalize mb-1">
                    {category.replace('_', ' ')}
                  </p>
                  <p className={`text-xl font-bold ${getGradeColor(score)}`}>
                    {score}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LLM Feedback */}
        <div className="bg-[#171717] border border-[#262626] rounded-lg p-4 mb-3">
          <h2 className="text-base font-bold text-white mb-3">Expert Feedback</h2>
          <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
            {feedbackText}
          </div>
        </div>

        {/* Text Comparison */}
        <div className="bg-[#171717] border border-[#262626] rounded-lg p-4 mb-3">
          <h2 className="text-base font-bold text-white mb-3">Text Comparison</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {/* Original */}
            <div>
              <h3 className="text-xs font-semibold text-gray-400 mb-2">Original</h3>
              <div className="p-3 bg-[#0a0a0a] rounded-lg border border-[#262626]">
                <p className="text-gray-300 text-sm leading-relaxed font-serif">
                  {original}
                </p>
              </div>
            </div>

            {/* User Attempt */}
            <div>
              <h3 className="text-xs font-semibold text-blue-400 mb-2">Your Attempt</h3>
              <div className="p-3 bg-blue-900/10 rounded-lg border border-blue-700">
                <p className="text-gray-300 text-sm leading-relaxed font-serif">
                  {user}
                </p>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="text-center">
              <p className="text-gray-500">Original Words</p>
              <p className="text-base font-bold text-white">
                {original.split(/\s+/).filter(Boolean).length}
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-500">Your Words</p>
              <p className="text-base font-bold text-blue-400">
                {user.split(/\s+/).filter(Boolean).length}
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-500">Original Sentences</p>
              <p className="text-base font-bold text-white">
                {original.split(/[.!?]+/).filter(Boolean).length}
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-500">Your Sentences</p>
              <p className="text-base font-bold text-blue-400">
                {user.split(/[.!?]+/).filter(Boolean).length}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onContinue}
            className="flex-1 px-4 py-2 bg-white text-black text-sm font-semibold rounded-lg
                       hover:bg-gray-200 transition-colors"
          >
            Continue to Next Review →
          </button>
        </div>
      </div>
    </div>
  )
}
