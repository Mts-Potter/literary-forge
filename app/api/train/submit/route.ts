import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'

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

    const { text_id, user_text, original_text, style_metrics } = await request.json()

    // Validate inputs
    if (!text_id || !user_text || !original_text) {
      return NextResponse.json(
        { error: 'Missing required fields: text_id, user_text, original_text' },
        { status: 400 }
      )
    }

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

    // Parse JSON from response
    let analysis
    try {
      analysis = JSON.parse(content.text)
    } catch (parseError) {
      console.error('Failed to parse Bedrock response:', content.text)
      throw new Error('Invalid response format from AI')
    }

    const accuracyScore = analysis.overall_accuracy

    // Validate accuracy score
    if (typeof accuracyScore !== 'number' || accuracyScore < 0 || accuracyScore > 100) {
      throw new Error(`Invalid accuracy score: ${accuracyScore}`)
    }

    // Submit review via RPC (logs to review_history and updates user_progress)
    const { data: result, error: rpcError } = await supabase.rpc('submit_review', {
      p_text_id: text_id,
      p_user_text: user_text,
      p_accuracy_score: accuracyScore,
      p_duration_seconds: null,
      p_feedback_json: analysis
    })

    if (rpcError) {
      console.error('RPC error:', rpcError)
      throw new Error(`Database error: ${rpcError.message}`)
    }

    // Return combined feedback and schedule info
    return NextResponse.json({
      ...analysis,
      schedule: result
    })
  } catch (error: any) {
    console.error('Training submit error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
