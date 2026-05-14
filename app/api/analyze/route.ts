import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { logError, getSafeErrorMessage } from '@/lib/utils/error-logger'
import { invokeGemini } from '@/lib/llm/gemini'
import { analyzeSchema } from '@/lib/validation/api-schemas'

export const runtime = 'edge'

/**
 * POST /api/analyze
 *
 * Generiert De-Styled Metadaten für Source Texts
 * oder gibt Feedback zu User-Texten
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Auth Check
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id

    // IP Extraction (x-forwarded-for kann CSV sein, erste IP nehmen)
    const forwardedFor = request.headers.get('x-forwarded-for')
    const clientIp = forwardedFor
      ? forwardedFor.split(',')[0].trim()
      : request.headers.get('x-real-ip') || '127.0.0.1'

    // Rate Limiting Check
    const { data: hasQuota, error: quotaError } = await supabase.rpc(
      'check_and_consume_quota',
      {
        p_user_id: userId || null,
        p_ip_address: userId ? null : clientIp
      }
    )

    if (quotaError || !hasQuota) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: 'Du hast dein Tageslimit erreicht. Versuche es morgen erneut.'
        },
        { status: 429 }
      )
    }

    // SECURITY M-1: Validate request body
    const body = await request.json()

    let validatedData
    try {
      validatedData = analyzeSchema.parse(body)
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

    const { type, text, textId, userText, originalText, styleMetrics } = validatedData

    if (type === 'destyle') {
      // Validate required fields for destyle
      if (!text) {
        return NextResponse.json(
          { error: 'Missing required field: text' },
          { status: 400 }
        )
      }
      // Phase 1: De-Styling für Source Text
      const prompt = `Du bist ein Literaturanalyst. Extrahiere aus folgendem Text:
1. Eine neutrale Inhaltsangabe (Plot) ohne Stilelemente
2. Das grundlegende Sentiment (z.B. "melancholisch", "dringlich")
3. Strukturelle Constraints (z.B. "Dialog-lastig", "lange Sätze")

Text:
${text}

Antworte als JSON:
{
  "plot_summary": "...",
  "sentiment": "...",
  "constraints": ["...", "..."]
}`

      const contentText = await invokeGemini(prompt, {
        maxTokens: 1024,
        jsonOutput: true
      })

      // Parse JSON aus Response
      const metadata = JSON.parse(contentText)

      // Cache in DB
      if (textId) {
        await supabase
          .from('source_texts')
          .update({
            metadata,
            updated_at: new Date().toISOString()
          })
          .eq('id', textId)
      }

      return NextResponse.json({ metadata })

    } else if (type === 'feedback') {
      // Validate required fields for feedback
      if (!userText || !originalText || !styleMetrics) {
        return NextResponse.json(
          { error: 'Missing required fields: userText, originalText, styleMetrics' },
          { status: 400 }
        )
      }

      // Phase 2: Stilfeedback für User-Text

      const prompt = `Du bist ein Stilcoach. Der Nutzer versucht, den Stil des Originals zu imitieren.

ORIGINAL:
${originalText}

USER-VERSUCH:
${userText}

METRIKEN (User vs. Original):
- Dependency Distance: ${styleMetrics.userDD} vs. ${styleMetrics.originalDD}
- Adjektiv/Verb-Ratio: ${styleMetrics.userAVR} vs. ${styleMetrics.originalAVR}

Gib konstruktives Feedback:
1. Was funktioniert gut?
2. Wo weicht der Stil ab? (Nutze die Metriken als Beweis)
3. Konkrete Verbesserungsvorschläge

Antworte auf Deutsch, freundlich aber präzise.`

      const contentText = await invokeGemini(prompt, { maxTokens: 2048 })

      return NextResponse.json({ feedback: contentText })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })

  } catch (error: any) {
    // SECURITY M-4: Secure error handling - log full details server-side, return generic message
    logError('analyze', error)
    return NextResponse.json(
      { error: getSafeErrorMessage(error) },
      { status: 500 }
    )
  }
}
