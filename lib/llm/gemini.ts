/**
 * Gemini LLM Wrapper
 *
 * Zentraler Wrapper für Google Gemini API. Ersetzt den vorherigen AWS Bedrock
 * Stack (Phase 1 der Renovierung).
 *
 * Verwendung:
 *   const text = await invokeGemini('Was ist 2+2?')
 *   const json = await invokeGemini(prompt, { jsonOutput: true })
 *
 * Konfiguration via Env-Vars:
 *   GEMINI_API_KEY    — API-Key aus Google AI Studio
 *   GEMINI_MODEL      — Modell-ID, default: gemini-3.1-flash-lite-preview
 *
 * Edge-Runtime-kompatibel (nutzt nur fetch).
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

const DEFAULT_MODEL = 'gemini-3.1-flash-lite-preview'

export interface InvokeOptions {
  /** Output-Token-Limit (Default 2048). Niedriger = schneller + günstiger. */
  maxTokens?: number
  /** Sampling-Temperature (0-1). 0 = deterministisch, 1 = kreativ. Default 0.3. */
  temperature?: number
  /** Wenn true: Response wird als application/json erzwungen (Gemini JSON-Mode). */
  jsonOutput?: boolean
  /** Modell-Override pro Call. Wenn nicht gesetzt: aus GEMINI_MODEL env, fallback DEFAULT_MODEL. */
  model?: string
  /** Maximale Retry-Anzahl bei 5xx-Fehlern (Default 2). */
  maxRetries?: number
}

export class GeminiError extends Error {
  constructor(
    message: string,
    public status: number,
    public retryable: boolean
  ) {
    super(message)
    this.name = 'GeminiError'
  }
}

/**
 * Ruft Gemini auf und liefert den Text-Output zurück.
 *
 * @throws GeminiError bei API-Fehlern (mit status + retryable Flag)
 * @throws Error wenn GEMINI_API_KEY fehlt
 */
export async function invokeGemini(
  prompt: string,
  options: InvokeOptions = {}
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set')
  }

  const modelId = options.model || process.env.GEMINI_MODEL || DEFAULT_MODEL
  const maxTokens = options.maxTokens ?? 2048
  const temperature = options.temperature ?? 0.3
  const maxRetries = options.maxRetries ?? 2

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: modelId,
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature,
      ...(options.jsonOutput ? { responseMimeType: 'application/json' } : {})
    }
  })

  let lastError: Error | null = null
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.generateContent(prompt)
      const text = result.response.text()
      if (!text) {
        throw new GeminiError('Empty response from Gemini', 500, true)
      }
      return text
    } catch (err: any) {
      lastError = err

      // Identify retryable errors (5xx, network)
      const status = err?.status ?? err?.statusText ?? 0
      const retryable =
        err instanceof GeminiError
          ? err.retryable
          : status >= 500 || status === 429 || err?.code === 'ECONNRESET'

      if (!retryable || attempt === maxRetries) {
        if (err instanceof GeminiError) throw err
        throw new GeminiError(
          err?.message || 'Gemini call failed',
          status || 500,
          false
        )
      }

      // Exponential backoff: 500ms, 1s, 2s
      const delay = Math.min(2000, 500 * Math.pow(2, attempt))
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError ?? new Error('Gemini retries exhausted')
}

/**
 * Variante die direkt geparstes JSON liefert.
 * Setzt automatisch jsonOutput=true.
 *
 * @throws SyntaxError wenn die Response kein valides JSON ist
 */
export async function invokeGeminiJson<T = unknown>(
  prompt: string,
  options: Omit<InvokeOptions, 'jsonOutput'> = {}
): Promise<T> {
  const text = await invokeGemini(prompt, { ...options, jsonOutput: true })
  return JSON.parse(text) as T
}
