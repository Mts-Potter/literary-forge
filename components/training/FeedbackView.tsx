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
    <div className="bg-[#0a0a0a] p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header with overall score */}
        <div className="bg-[#171717] border border-[#262626] rounded-lg p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-white">Review Feedback</h1>
            <div className={`px-6 py-3 rounded-lg font-bold text-3xl ${getGradeColor(overall_accuracy)}`}>
              {overall_accuracy.toFixed(0)}%
            </div>
          </div>

          {/* FSRS Schedule Info */}
          {schedule && (
            <div className="flex items-center gap-4 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
              <div className="text-3xl">📅</div>
              <div>
                <p className="font-semibold text-white text-sm mb-1">{schedule.message}</p>
                <p className="text-sm text-gray-300">
                  Grade: {schedule.grade}/4 • Next: {new Date(schedule.next_review).toLocaleDateString('de-DE')}
                  {schedule.interval_days > 0 && ` (in ${schedule.interval_days} ${schedule.interval_days === 1 ? 'Tag' : 'Tagen'})`}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Detailed Scores */}
        {scores && (
          <div className="bg-[#171717] border border-[#262626] rounded-lg p-5 mb-4">
            <h2 className="text-base font-semibold text-white mb-4">Detailed Analysis</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(scores).map(([category, score]: [string, any]) => (
                <div key={category} className="text-center p-4 bg-[#0a0a0a] rounded-lg border border-[#262626]">
                  <p className="text-sm text-gray-400 capitalize mb-2">
                    {category.replace('_', ' ')}
                  </p>
                  <p className={`text-2xl font-bold ${getGradeColor(score)}`}>
                    {score}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LLM Feedback */}
        <div className="bg-[#171717] border border-[#262626] rounded-lg p-5 mb-4">
          <h2 className="text-base font-semibold text-white mb-4">Expert Feedback</h2>
          <div className="text-sm text-white leading-relaxed whitespace-pre-wrap">
            {feedbackText}
          </div>
        </div>

        {/* Text Comparison */}
        <div className="bg-[#171717] border border-[#262626] rounded-lg p-5 mb-4">
          <h2 className="text-base font-semibold text-white mb-4">Text Comparison</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Original */}
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-3">Original</h3>
              <div className="p-4 bg-[#0a0a0a] rounded-lg border border-[#262626]">
                <p className="text-white text-sm leading-relaxed font-serif">
                  {original}
                </p>
              </div>
            </div>

            {/* User Attempt */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">Your Attempt</h3>
              <div className="p-4 bg-blue-900/10 rounded-lg border border-blue-700">
                <p className="text-white text-sm leading-relaxed font-serif">
                  {user}
                </p>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-[#0a0a0a] rounded-lg border border-[#262626]">
              <p className="text-sm text-gray-400 mb-1">Original Words</p>
              <p className="text-xl font-bold text-white">
                {original.split(/\s+/).filter(Boolean).length}
              </p>
            </div>
            <div className="text-center p-3 bg-[#0a0a0a] rounded-lg border border-[#262626]">
              <p className="text-sm text-gray-400 mb-1">Your Words</p>
              <p className="text-xl font-bold text-white">
                {user.split(/\s+/).filter(Boolean).length}
              </p>
            </div>
            <div className="text-center p-3 bg-[#0a0a0a] rounded-lg border border-[#262626]">
              <p className="text-sm text-gray-400 mb-1">Original Sentences</p>
              <p className="text-xl font-bold text-white">
                {original.split(/[.!?]+/).filter(Boolean).length}
              </p>
            </div>
            <div className="text-center p-3 bg-[#0a0a0a] rounded-lg border border-[#262626]">
              <p className="text-sm text-gray-400 mb-1">Your Sentences</p>
              <p className="text-xl font-bold text-white">
                {user.split(/\s+/).filter(Boolean).length}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={onContinue}
            className="flex-1 px-6 py-3 bg-white text-black text-base font-semibold rounded-lg
                       hover:bg-gray-200 transition-colors"
          >
            Continue to Next Review →
          </button>
        </div>
      </div>
    </div>
  )
}
