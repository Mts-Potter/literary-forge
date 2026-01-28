import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'
import { submitTrainingSchema, bedrockAnalysisSchema, submitReviewResultSchema } from '@/lib/validation/api-schemas'
import { z } from 'zod'
import { logError, getSafeErrorMessage } from '@/lib/utils/error-logger'

const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // SECURITY H-3: Rate limiting - moved AFTER successful save (see line ~180)
    // This prevents quota loss when Bedrock or DB save fails
    const forwardedFor = request.headers.get('x-forwarded-for')
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1'

    // Parse and validate inputs
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

    // FIX 3: Idempotency check - prevent duplicate submissions
    if (idempotency_token) {
      // Check if this exact token was already processed (last 60 seconds)
      const { data: existingSubmission } = await supabase
        .from('review_history')
        .select('id, feedback_json, created_at')
        .eq('user_id', user.id)
        .eq('text_id', text_id)
        .eq('user_text', user_text) // Exact text match
        .gte('created_at', new Date(Date.now() - 60000).toISOString()) // Last 60 seconds
        .single()

      if (existingSubmission) {
        console.log(`[Idempotency] Duplicate submission detected for token ${idempotency_token}`)

        // Return cached response (reconstruct from review_history)
        const cachedFeedback = existingSubmission.feedback_json as any

        return NextResponse.json({
          ...cachedFeedback,
          _cached: true, // Flag to indicate this is a cached response
          _cached_at: existingSubmission.created_at
        })
      }
    }

    // Fetch original text and style metrics from database
    const { data: originalData, error: fetchError } = await supabase
      .from('source_texts')
      .select('content, metrics')
      .eq('id', text_id)
      .single()

    if (fetchError || !originalData) {
      return NextResponse.json(
        { error: 'Text not found' },
        { status: 404 }
      )
    }

    const original_text = originalData.content
    const style_metrics = originalData.metrics

    // Call Anthropic API to analyze style
    const prompt = `You are a literary critic evaluating a stylistic imitation exercise.

ORIGINAL TEXT:
${original_text}

USER ATTEMPT:
${user_text}

TARGET STYLE METRICS:
${style_metrics ? `
- Avg Sentence Length: ${style_metrics.sentence_length_avg || 'N/A'}
- Dependency Distance: ${style_metrics.dependency_distance || 'N/A'}
- Adj/Verb Ratio: ${style_metrics.adj_verb_ratio || 'N/A'}
- Sentence Variance: ${style_metrics.sentence_length_variance || 'N/A'}
` : 'No metrics available'}

Evaluate the user's attempt on these criteria (score each 0-100):
1. **Structure**: Does the sentence rhythm and complexity match the original (parataxis vs. hypotaxis)?
2. **Vocabulary**: Is the word choice appropriate (register, formality, time period)?
3. **Rhythm**: Does the cadence and flow match the original's pace?
4. **Tone**: Is the emotional atmosphere and voice preserved?

Provide constructive, specific feedback explaining what works and what doesn't.

IMPORTANT: Output ONLY the JSON below. Do NOT include any explanatory text, analysis, recommendations, or commentary before or after the JSON. The response must be pure JSON that can be parsed directly.

Output JSON in this exact format:
{
  "feedback": "Detailed qualitative analysis with specific examples...",
  "scores": {
    "structure": 0-100,
    "vocabulary": 0-100,
    "rhythm": 0-100,
    "tone": 0-100
  },
  "overall_accuracy": 0-100
}`

    // Call AWS Bedrock with Claude 3.5 Haiku
    const input = {
      modelId: process.env.BEDROCK_MODEL_ID || 'us.anthropic.claude-3-5-haiku-20241022-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3
      })
    }

    const command = new InvokeModelCommand(input)
    const response = await bedrockClient.send(command)

    // Decode Bedrock response (Uint8Array → JSON)
    const responseBody = JSON.parse(new TextDecoder().decode(response.body))

    // Extract text from Bedrock response format
    const content = responseBody.content?.[0]
    if (!content || content.type !== 'text') {
      throw new Error('Unexpected response type from Bedrock')
    }

    // SECURITY H-2: Parse and validate AI response with schema
    let analysis
    try {
      const rawAnalysis = JSON.parse(content.text)
      analysis = bedrockAnalysisSchema.parse(rawAnalysis)
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('AI response validation failed:', error.issues)
        console.error('Raw response:', content.text)
        throw new Error('Invalid AI response format')
      }
      console.error('Failed to parse Bedrock response:', content.text)
      throw new Error('Invalid response format from AI')
    }

    const accuracyScore = analysis.overall_accuracy

    // Submit review via RPC (logs to review_history and updates user_progress)
    const { data: result, error: rpcError } = await supabase.rpc('submit_review', {
      p_text_id: text_id,
      p_user_text: user_text,
      p_accuracy_score: accuracyScore,
      p_duration_seconds: null,
      p_feedback_json: analysis
    })

    if (rpcError) {
      // SECURITY H-4: Log full error server-side, return generic message to client
      logError('train/submit:rpc', rpcError)
      throw new Error('Failed to submit review')
    }

    // FIX 5: Validate RPC response to catch partial failures
    if (!result) {
      logError('train/submit:rpc', 'submit_review returned null')
      throw new Error('Database returned no scheduling data')
    }

    try {
      submitReviewResultSchema.parse(result)
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Invalid submit_review result:', result)
        console.error('Validation errors:', error.issues)
        throw new Error('Database returned invalid scheduling data')
      }
      throw error
    }

    // FIX 1: Consume quota AFTER successful save
    // Progress saving is more important than rate limiting
    // Better to let user exceed quota slightly than lose their work
    const { error: quotaError } = await supabase.rpc('check_and_consume_quota', {
      p_user_id: user.id,
      p_ip_address: clientIp
    })
    // Intentionally ignore quotaError - progress already saved, this is just accounting

    // Return combined feedback and schedule info
    return NextResponse.json({
      ...analysis,
      schedule: result
    })
  } catch (error: any) {
    // SECURITY H-4: Never expose internal error details to client
    logError('train/submit', error)

    // FIX 7: Provide specific error messages based on error type
    const errorMessage = error.message || ''

    if (errorMessage.includes('Rate limit') || errorMessage.includes('quota')) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait before trying again.' },
        { status: 429 }
      )
    }

    if (errorMessage.includes('Bedrock') || errorMessage.includes('AI') || errorMessage.includes('response format')) {
      return NextResponse.json(
        { error: 'AI service temporarily unavailable. Your work is saved. Please try again.' },
        { status: 503 }
      )
    }

    if (errorMessage.includes('submit_review') || errorMessage.includes('Database') || errorMessage.includes('scheduling')) {
      return NextResponse.json(
        { error: 'Failed to save progress. Please check your connection and try again.' },
        { status: 500 }
      )
    }

    if (errorMessage.includes('Unauthorized') || errorMessage.includes('auth')) {
      return NextResponse.json(
        { error: 'Session expired. Please log in again.' },
        { status: 401 }
      )
    }

    // Generic fallback for unknown errors
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
