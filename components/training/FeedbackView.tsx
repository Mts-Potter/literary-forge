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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header with overall score */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Review Feedback</h1>
            <div className={`px-6 py-3 rounded-lg font-bold text-3xl ${getGradeColor(overall_accuracy)}`}>
              {overall_accuracy.toFixed(0)}%
            </div>
          </div>

          {/* FSRS Schedule Info */}
          {schedule && (
            <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-4xl">📅</div>
              <div>
                <p className="font-semibold text-blue-900">{schedule.message}</p>
                <p className="text-sm text-blue-700 mt-1">
                  Grade: {schedule.grade}/4 • Next review: {new Date(schedule.next_review).toLocaleDateString('de-DE')}
                  {schedule.interval_days > 0 && ` (in ${schedule.interval_days} ${schedule.interval_days === 1 ? 'Tag' : 'Tagen'})`}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Detailed Scores */}
        {scores && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Detailed Analysis</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(scores).map(([category, score]: [string, any]) => (
                <div key={category} className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 capitalize mb-2">
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
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Expert Feedback</h2>
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {feedbackText}
            </p>
          </div>
        </div>

        {/* Text Comparison */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Text Comparison</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Original */}
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Original</h3>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-800 leading-relaxed font-serif">
                  {original}
                </p>
              </div>
            </div>

            {/* User Attempt */}
            <div>
              <h3 className="text-sm font-semibold text-purple-600 mb-2">Your Attempt</h3>
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-gray-800 leading-relaxed font-serif">
                  {user}
                </p>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <p className="text-gray-600">Original Words</p>
              <p className="text-lg font-bold text-gray-900">
                {original.split(/\s+/).filter(Boolean).length}
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-600">Your Words</p>
              <p className="text-lg font-bold text-purple-600">
                {user.split(/\s+/).filter(Boolean).length}
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-600">Original Sentences</p>
              <p className="text-lg font-bold text-gray-900">
                {original.split(/[.!?]+/).filter(Boolean).length}
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-600">Your Sentences</p>
              <p className="text-lg font-bold text-purple-600">
                {user.split(/[.!?]+/).filter(Boolean).length}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={onContinue}
            className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg
                       hover:bg-blue-700 transition-colors shadow-sm"
          >
            Continue to Next Review →
          </button>
        </div>
      </div>
    </div>
  )
}
