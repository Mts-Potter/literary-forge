import { NextResponse } from 'next/server'
import { warmNlpService } from '@/lib/nlp/parser-client'

export const runtime = 'edge'

/**
 * Pre-Warm Endpoint
 *
 * Wird vom /train-Page beim Mount aufgerufen, um den Render-Free-Tier-NLP-Service
 * aus dem Sleep zu holen, bevor der User submittet. Fire-and-forget.
 *
 * Kein Auth-Schutz nötig — pingt nur /health auf dem NLP-Service, kein
 * teurer Compute-Pfad.
 */
export async function GET() {
  const result = await warmNlpService()
  return NextResponse.json(result)
}
