import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { invokeGemini } from '@/lib/llm/gemini'
import { parseText, type Language } from '@/lib/nlp/parser-client'
import { computeStyleDistance } from '@/lib/scoring/style-distance'
import { logError, getSafeErrorMessage } from '@/lib/utils/error-logger'

export const runtime = 'nodejs'
export const maxDuration = 60

const demoSchema = z.object({
  chunk_id: z.string().min(1),
  original_text: z.string().min(20).max(2000),
  user_text: z.string().min(20).max(5000),
  language: z.enum(['de', 'en']),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const forwardedFor = request.headers.get('x-forwarded-for')
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1'

    const { data: hasQuota } = await supabase.rpc('check_and_consume_quota', {
      p_user_id: null,
      p_ip_address: clientIp,
    })
    if (!hasQuota) {
      return NextResponse.json(
        { error: 'Demo-Limit für diese IP erreicht. Versuche es morgen oder leg ein Konto an.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const data = demoSchema.parse(body)

    let styleScore: number | null = null
    let styleDistance: number | null = null
    let deterministic = false
    try {
      const userFeatures = await parseText(data.user_text, data.language as Language)
      // Demo uses Kafka's author profile (chunk is Die Verwandlung).
      const KAFKA_AUTHOR_ID = '550e8400-e29b-41d4-a716-446655440001'
      const { data: profile } = await supabase
        .from('author_style_profiles')
        .select('feature_means, feature_stddevs')
        .eq('author_id', KAFKA_AUTHOR_ID)
        .single()
      if (profile?.feature_means && profile?.feature_stddevs) {
        const result = computeStyleDistance(
          userFeatures,
          profile.feature_means as Record<string, number>,
          profile.feature_stddevs as Record<string, number>
        )
        styleDistance = result.style_distance
        styleScore = Math.round(result.style_score)
        deterministic = true
      }
    } catch (e) {
      logError('demo/analyze:nlp', e as Error)
    }

    let llmFeedback = ''
    try {
      const prompt = `Du bist ein Lektor. Vergleiche den User-Versuch mit dem Original.

Original (${data.language}):
${data.original_text}

User-Versuch:
${data.user_text}

Gib in 3-5 Sätzen Rückmeldung zu Stil, Rhythmus, Wortwahl. Konkret, nicht generisch.
Wenn der User-Versuch in messbaren Punkten (Satzlänge, Komma-Dichte, lexikalische
Vielfalt) deutlich vom Original abweicht, benenne es.`
      llmFeedback = (await invokeGemini(prompt, { maxTokens: 400, temperature: 0.4 })).trim()
    } catch (e) {
      logError('demo/analyze:gemini', e as Error)
      llmFeedback = 'KI-Lektorat aktuell nicht verfügbar — dein Stilabstand ist trotzdem berechnet.'
    }

    if (styleScore === null) styleScore = 50

    return NextResponse.json({
      style_score: styleScore,
      style_distance: styleDistance,
      deterministic,
      llm_feedback: llmFeedback,
    })
  } catch (e: any) {
    logError('demo/analyze:fatal', e)
    return NextResponse.json({ error: getSafeErrorMessage(e) }, { status: 500 })
  }
}
