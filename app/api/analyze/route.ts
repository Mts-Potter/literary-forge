import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'

// AWS Bedrock Client Configuration
const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

// Anthropic Client mit AWS Bedrock
const anthropic = new Anthropic({
  apiKey: process.env.AWS_ACCESS_KEY_ID!, // Bedrock nutzt AWS Credentials
  baseURL: `https://bedrock-runtime.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com`,
})

/**
 * Wrapper für Bedrock Model Invocation
 * Nutzt direkt den BedrockRuntimeClient für Edge-Kompatibilität
 */
async function invokeBedrockModel(prompt: string, maxTokens: number = 1024) {
  const modelId = process.env.BEDROCK_MODEL_ID || 'us.anthropic.claude-4-5-haiku-20250110-v1:0'

  const payload = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: maxTokens,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  }

  const command = new InvokeModelCommand({
    modelId,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify(payload),
  })

  const response = await bedrockClient.send(command)
  const responseBody = JSON.parse(new TextDecoder().decode(response.body))

  return responseBody
}

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

    // Request Body
    const body = await request.json()
    const { type, text, textId } = body

    if (type === 'destyle') {
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

      const response = await invokeBedrockModel(prompt, 1024)

      // Bedrock Response Format: { content: [{ text: "..." }] }
      const contentText = response.content?.[0]?.text
      if (!contentText) {
        throw new Error('Unexpected Bedrock response format')
      }

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
      // Phase 2: Stilfeedback für User-Text
      const { userText, originalText, styleMetrics } = body

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

      const response = await invokeBedrockModel(prompt, 2048)

      const contentText = response.content?.[0]?.text
      if (!contentText) {
        throw new Error('Unexpected Bedrock response format')
      }

      return NextResponse.json({ feedback: contentText })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })

  } catch (error: any) {
    console.error('Analyze API Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
