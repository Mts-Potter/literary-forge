/**
 * NLP Parser Client (server-side)
 *
 * Wrapper für den separaten Python+Flask+spaCy NLP-Microservice auf Render.
 * Wird nur in Vercel-Routes (Edge oder Node) verwendet, NIE im Browser
 * (verwendet `NLP_SHARED_SECRET`).
 *
 * Konfiguration (Env-Vars):
 *   NLP_SERVICE_URL       — z. B. https://literary-forge-nlp.onrender.com
 *   NLP_SHARED_SECRET     — Auth-Token gegen den Render-Service
 *
 * Cold-Start-Mitigation: Render Free Tier schläft nach 15 min Idle.
 * Client-Code sollte beim /train-Page-Load einen `warmNlpService()`-Call machen,
 * sodass der Service warm ist wenn der User submittet.
 */

const DEFAULT_TIMEOUT_MS = 60_000

export type Language = 'de' | 'en'

export interface StyleFeatures {
  ttr: number
  mtld: number
  hapax_ratio: number
  avg_word_length: number
  word_length_distribution: number[]
  avg_sentence_length: number
  sentence_length_stddev: number
  sentence_length_variance: number
  punctuation_per_sentence: number
  sub_sentence_ratio: number
  function_word_frequencies: Record<string, number>
  adj_ratio: number
  adv_ratio: number
  adj_verb_ratio: number
  tense_distribution: { past: number; pres: number; fut: number }
  compound_ratio: number
  direct_speech_ratio: number
  sentence_opening_distribution: Record<string, number>
  dependency_distance: number
  n_words: number
  n_sentences: number
}

export class NlpServiceError extends Error {
  constructor(message: string, public status: number, public retryable: boolean) {
    super(message)
    this.name = 'NlpServiceError'
  }
}

function getConfig(): { url: string; secret: string | undefined } {
  const url = process.env.NLP_SERVICE_URL
  if (!url) {
    throw new Error('NLP_SERVICE_URL environment variable is not set')
  }
  return { url: url.replace(/\/$/, ''), secret: process.env.NLP_SHARED_SECRET }
}

/**
 * Holt Stilfeatures für einen Text. Latenz: ~200 ms warm, ~30-60 s cold-start.
 */
export async function parseText(
  text: string,
  language: Language = 'de',
  options: { timeoutMs?: number } = {}
): Promise<StyleFeatures> {
  const { url, secret } = getConfig()
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (secret) headers['X-NLP-Secret'] = secret

    const res = await fetch(`${url}/parse`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ text, language }),
      signal: controller.signal
    })

    if (!res.ok) {
      const retryable = res.status >= 500 || res.status === 429
      const errText = await res.text().catch(() => '')
      throw new NlpServiceError(
        `NLP service ${res.status}: ${errText.slice(0, 200)}`,
        res.status,
        retryable
      )
    }

    const data = (await res.json()) as { features?: StyleFeatures; error?: string }
    if (data.error) {
      throw new NlpServiceError(data.error, 500, false)
    }
    if (!data.features) {
      throw new NlpServiceError('NLP service returned no features', 500, true)
    }
    return data.features
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new NlpServiceError(
        `NLP service timeout after ${timeoutMs}ms`,
        408,
        true
      )
    }
    if (err instanceof NlpServiceError) throw err
    throw new NlpServiceError(err?.message || 'NLP fetch failed', 500, true)
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Pingt /health auf dem NLP-Service. Wird im /train Page-Load aufgerufen,
 * um Cold-Start während des User-Schreibvorgangs zu vermeiden.
 *
 * Fire-and-forget — keine Exception bei Fehler.
 */
export async function warmNlpService(): Promise<{ ok: boolean }> {
  try {
    const { url } = getConfig()
    const res = await fetch(`${url}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5_000)
    })
    return { ok: res.ok }
  } catch {
    return { ok: false }
  }
}
