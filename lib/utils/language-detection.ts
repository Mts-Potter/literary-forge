/**
 * Language detection utility to validate imported text content
 * Prevents importing wrong-language content (e.g., French text labeled as German)
 */

export interface LanguageDetectionResult {
  detectedLanguage: 'de' | 'en' | 'fr' | 'unknown'
  confidence: number // 0-1
  indicators: {
    german: number
    english: number
    french: number
  }
}

/**
 * Detect the language of a text sample
 * Uses frequency analysis of common words
 */
export function detectLanguage(text: string): LanguageDetectionResult {
  const lowerText = text.toLowerCase()

  // Common words for each language
  const indicators = {
    german: [
      'und', 'der', 'die', 'das', 'ich', 'sie', 'nicht', 'ein', 'eine',
      'ist', 'war', 'mir', 'dir', 'aber', 'auch', 'wenn', 'über'
    ],
    english: [
      'the', 'and', 'to', 'of', 'a', 'in', 'that', 'it', 'was', 'for',
      'on', 'with', 'as', 'is', 'he', 'she', 'you', 'at'
    ],
    french: [
      'le', 'la', 'les', 'de', 'et', 'un', 'une', 'des', 'dans', 'que',
      'pour', 'avec', 'sur', 'est', 'sont', 'ce', 'il', 'elle'
    ]
  }

  // Count indicator words
  const counts = {
    german: 0,
    english: 0,
    french: 0
  }

  for (const [lang, words] of Object.entries(indicators)) {
    for (const word of words) {
      // Use word boundaries to avoid false matches
      const regex = new RegExp(`\\b${word}\\b`, 'gi')
      const matches = lowerText.match(regex)
      counts[lang as keyof typeof counts] += matches ? matches.length : 0
    }
  }

  // Determine dominant language
  const total = counts.german + counts.english + counts.french

  if (total === 0) {
    return {
      detectedLanguage: 'unknown',
      confidence: 0,
      indicators: counts
    }
  }

  const maxCount = Math.max(counts.german, counts.english, counts.french)
  const confidence = maxCount / total

  let detectedLanguage: 'de' | 'en' | 'fr' | 'unknown'

  if (counts.german === maxCount) {
    detectedLanguage = 'de'
  } else if (counts.english === maxCount) {
    detectedLanguage = 'en'
  } else if (counts.french === maxCount) {
    detectedLanguage = 'fr'
  } else {
    detectedLanguage = 'unknown'
  }

  return {
    detectedLanguage,
    confidence,
    indicators: counts
  }
}

/**
 * Validate that text content matches expected language
 * Returns true if validation passes, false if mismatch detected
 */
export function validateTextLanguage(
  text: string,
  expectedLanguage: 'de' | 'en',
  minConfidence = 0.3
): {
  valid: boolean
  detection: LanguageDetectionResult
  error?: string
} {
  const detection = detectLanguage(text)

  // Check if detected language matches expected
  if (detection.detectedLanguage !== expectedLanguage) {
    // Allow 'unknown' if confidence is very low (short texts)
    if (detection.detectedLanguage === 'unknown' && detection.confidence < 0.1) {
      return {
        valid: true,
        detection,
        error: undefined
      }
    }

    return {
      valid: false,
      detection,
      error: `Language mismatch: Expected ${expectedLanguage}, detected ${detection.detectedLanguage} with ${(detection.confidence * 100).toFixed(0)}% confidence`
    }
  }

  // Check if confidence is high enough
  if (detection.confidence < minConfidence) {
    return {
      valid: false,
      detection,
      error: `Low confidence: ${(detection.confidence * 100).toFixed(0)}% (minimum ${(minConfidence * 100).toFixed(0)}%)`
    }
  }

  return {
    valid: true,
    detection,
    error: undefined
  }
}

/**
 * Detect if text is Project Gutenberg metadata/headers (not actual content)
 */
export function isGutenbergMetadata(text: string): boolean {
  const metadataPatterns = [
    /produced by/i,
    /project gutenberg/i,
    /enquete/i,
    /marie lebert/i,
    /http:\/\//i,
    /version numérique/i,
    /livre électronique/i,
    /éditeurs.*libraires/i
  ]

  // Check first 2000 characters for metadata
  const sample = text.substring(0, 2000).toLowerCase()

  const matchCount = metadataPatterns.filter(pattern => pattern.test(sample)).length

  // If 3+ patterns match, likely metadata
  return matchCount >= 3
}
