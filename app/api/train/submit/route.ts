import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { submitTrainingSchema, submitReviewResultSchema, bedrockAnalysisSchema } from '@/lib/validation/api-schemas'
import { z } from 'zod'
import { logError } from '@/lib/utils/error-logger'
import { invokeGemini, GeminiError } from '@/lib/llm/gemini'
import { parseText, NlpServiceError, type StyleFeatures, type Language } from '@/lib/nlp/parser-client'
import { loadAuthorProfile } from '@/lib/nlp/author-profile'
import { computeStyleDistance, topDeviations } from '@/lib/scoring/style-distance'
import { calculateNextReview } from '@/lib/srs/fsrs'

// Node.js runtime erlaubt höhere maxDuration als Edge (für Render-Cold-Starts)
export const runtime = 'nodejs'
export const maxDuration = 60

interface OriginalRow {
  content: string
  language: string
  author_id: string | null
  metrics: Record<string, any> | null
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const forwardedFor = request.headers.get('x-forwarded-for')
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1'

    const body = await request.json()
    let validatedData
    try {
      validatedData = submitTrainingSchema.parse(body)
    } catch (err) {
      if (err instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: err.issues.map(e => `${e.path.join('.')}: ${e.message}`)
          },
          { status: 400 }
        )
      }
      throw err
    }

    const { text_id, user_text, idempotency_token } = validatedData

    // Idempotency check
    if (idempotency_token) {
      const { data: existingSubmission } = await supabase
        .from('review_history')
        .select('id, feedback_json, created_at')
        .eq('user_id', user.id)
        .eq('text_id', text_id)
        .eq('user_text', user_text)
        .gte('created_at', new Date(Date.now() - 60_000).toISOString())
        .single()

      if (existingSubmission) {
        console.log(`[Idempotency] Duplicate submission detected for token ${idempotency_token}`)
        return NextResponse.json({
          ...(existingSubmission.feedback_json as any),
          _cached: true,
          _cached_at: existingSubmission.created_at
        })
      }
    }

    // Fetch original chunk + author reference
    const { data: originalRaw, error: fetchError } = await supabase
      .from('source_texts')
      .select('content, language, author_id, metrics')
      .eq('id', text_id)
      .single()

    if (fetchError || !originalRaw) {
      return NextResponse.json({ error: 'Text not found' }, { status: 404 })
    }
    const original = originalRaw as OriginalRow

    const language: Language =
      original.language === 'en' || original.language === 'de' ? original.language : 'de'

    // PARALLEL: NLP-Features für User-Text + Author-Profile laden
    const [userFeaturesResult, authorProfile] = await Promise.allSettled([
      parseText(user_text, language),
      original.author_id ? loadAuthorProfile(supabase, original.author_id) : Promise.resolve(null)
    ])

    const userFeatures: StyleFeatures | null =
      userFeaturesResult.status === 'fulfilled' ? userFeaturesResult.value : null
    const profile = authorProfile.status === 'fulfilled' ? authorProfile.value : null

    // Berechne deterministische Style-Distance falls NLP + Profile verfügbar
    let styleScore: number | null = null
    let styleDistance: number | null = null
    let deviationsForPrompt: string = 'No author profile available for this text.'

    if (userFeatures && profile) {
      const dist = computeStyleDistance(
        userFeatures,
        profile.feature_means,
        profile.feature_stddevs
      )
      styleScore = dist.style_score
      styleDistance = dist.style_distance

      const top = topDeviations(dist, 3)
      if (top.length > 0) {
        deviationsForPrompt = top
          .map(d =>
            `- ${d.feature}: user=${d.user_value.toFixed(3)}, ` +
            `author mean=${d.author_mean.toFixed(3)} (σ=${d.author_stddev.toFixed(3)}), ` +
            `|z|=${d.z_score.toFixed(2)}`
          )
          .join('\n')
      }
    } else if (userFeaturesResult.status === 'rejected') {
      console.warn('[train/submit] NLP service unavailable:',
        userFeaturesResult.reason instanceof NlpServiceError
          ? userFeaturesResult.reason.message
          : 'unknown error'
      )
    }

    // Gemini-Prompt: qualitatives Feedback, referenziert die gemessenen Differenzen
    const prompt = `You are a literary critic providing qualitative feedback on a stylistic imitation exercise. The user is trying to imitate the style of the original text.

ORIGINAL TEXT:
${original.content}

USER ATTEMPT:
${user_text}

MEASURED STYLE DEVIATIONS (deterministic z-scores against author profile):
${deviationsForPrompt}

Your task:
1. Give 2-4 sentences of CONCRETE, ACTIONABLE feedback referring to the measured deviations above (e.g., "Your average sentence length is 12 words; the author averages 26 — try compounding more clauses").
2. Score each rubric 0-100 as your *qualitative* impression (these are NOT the main score, just intuition):
   - structure (sentence rhythm, parataxis vs hypotaxis)
   - vocabulary (register, time period, word choice)
   - rhythm (cadence, flow)
   - tone (emotional atmosphere, voice)

Respond on the user's language: if user_text appears German, German feedback; if English, English feedback.

Output ONLY the JSON below, nothing else:
{
  "feedback": "...",
  "scores": {
    "structure": 0-100,
    "vocabulary": 0-100,
    "rhythm": 0-100,
    "tone": 0-100
  },
  "overall_accuracy": 0-100
}`

    // Gemini call
    let analysis
    try {
      const responseText = await invokeGemini(prompt, {
        maxTokens: 1024,
        temperature: 0.3,
        jsonOutput: true
      })
      const rawAnalysis = JSON.parse(responseText)
      analysis = bedrockAnalysisSchema.parse(rawAnalysis)
    } catch (error) {
      logError('train/submit:gemini', error as Error)
      // Fallback: weiter ohne LLM-Feedback
      analysis = {
        feedback: 'Style analysis is temporarily unavailable. Your deterministic style score is still calculated.',
        scores: { structure: 50, vocabulary: 50, rhythm: 50, tone: 50 },
        overall_accuracy: 50
      }
    }

    // PRIMÄRER Score: deterministisches style_score, NICHT die LLM-Halluzination.
    // Fallback: wenn kein style_score verfügbar (NLP down / kein Profile), nimm LLM.
    const accuracyScore = styleScore ?? analysis.overall_accuracy

    const fullFeedback = {
      ...analysis,
      style_score: styleScore,
      style_distance: styleDistance,
      deterministic: styleScore !== null
    }

    // FSRS-Math: Aktuellen Progress laden + neuen State mit ts-fsrs berechnen
    const { data: currentProgress } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('text_id', text_id)
      .maybeSingle()

    const fsrs = calculateNextReview(currentProgress, accuracyScore)

    // Persist via neue record_review RPC (kein eigener SQL-Math)
    const { data: result, error: rpcError } = await supabase.rpc('record_review', {
      p_text_id: text_id,
      p_user_text: user_text,
      p_accuracy_score: accuracyScore,
      p_grade: fsrs.grade,
      p_new_difficulty: fsrs.card.difficulty,
      p_new_stability: fsrs.card.stability,
      p_new_state: fsrs.card.state,
      p_new_scheduled_days: fsrs.interval,
      p_next_review: fsrs.nextReview.toISOString(),
      p_duration_seconds: null,
      p_feedback_json: fullFeedback
    })

    if (rpcError) {
      logError('train/submit:rpc', rpcError)
      throw new Error('Failed to submit review')
    }
    if (!result) {
      logError('train/submit:rpc', 'record_review returned null')
      throw new Error('Database returned no scheduling data')
    }

    try {
      submitReviewResultSchema.parse(result)
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Invalid record_review result:', result)
        throw new Error('Database returned invalid scheduling data')
      }
      throw error
    }

    // Quota nach erfolgreichem Save consumen
    await supabase.rpc('check_and_consume_quota', {
      p_user_id: user.id,
      p_ip_address: clientIp
    })

    return NextResponse.json({
      ...fullFeedback,
      schedule: result
    })
  } catch (error: any) {
    logError('train/submit', error)
    const errorMessage = error?.message || ''

    if (errorMessage.includes('Rate limit') || errorMessage.includes('quota')) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait before trying again.' },
        { status: 429 }
      )
    }
    if (errorMessage.includes('Gemini') || errorMessage.includes('AI') ||
        errorMessage.includes('response format') || error instanceof GeminiError) {
      return NextResponse.json(
        { error: 'AI service temporarily unavailable. Your work is saved. Please try again.' },
        { status: 503 }
      )
    }
    if (errorMessage.includes('NLP') || error instanceof NlpServiceError) {
      return NextResponse.json(
        { error: 'Style analysis service warming up. Please retry in 30 seconds.' },
        { status: 503 }
      )
    }
    if (errorMessage.includes('submit_review') || errorMessage.includes('Database')) {
      return NextResponse.json(
        { error: 'Failed to save progress. Please check your connection and try again.' },
        { status: 500 }
      )
    }
    if (errorMessage.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Session expired. Please log in again.' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
