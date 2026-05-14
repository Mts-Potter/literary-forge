/**
 * Burrows' Delta-Variante für Stildistanz.
 *
 * Vergleicht User-Stilfeatures gegen ein Author-Style-Profile (Mittelwert +
 * Standardabweichung pro Feature). Ergebnis: deterministischer Score 0-100.
 *
 * Referenz: Burrows (2002) "'Delta': a Measure of Stylistic Difference and a
 * Guide to Likely Authorship", Literary and Linguistic Computing.
 *
 * Algorithmus:
 *   1. Pro Feature i: z_i = |user_value_i - author_mean_i| / max(stddev_i, ε)
 *   2. style_distance = mean(z_i) über die relevanten Features
 *   3. style_score = max(0, 100 - 25 · style_distance)
 *
 * Begründung Faktor 25: empirisch kalibrierbar; bei z = 4 (4 Standardabweichungen
 * weg) ist score = 0. Plan-Verifikation in Phase 3 prüft die Kalibrierung
 * mit echten Kafka- vs Mann-Versuchen.
 */

import type { StyleFeatures } from '@/lib/nlp/parser-client'

const STDDEV_EPSILON = 1e-6
const DEFAULT_SCALING = 25

/**
 * Die Features, die in den Vergleich eingehen. Verschachtelte JSONB-Felder
 * (function_word_frequencies, distributions) werden separat behandelt
 * (siehe scoreFunctionWords + scoreDistribution).
 */
const SCALAR_FEATURE_KEYS = [
  'avg_sentence_length',
  'sentence_length_variance',
  'sentence_length_stddev',
  'mtld',
  'ttr',
  'hapax_ratio',
  'avg_word_length',
  'adj_ratio',
  'adv_ratio',
  'adj_verb_ratio',
  'dependency_distance',
  'punctuation_per_sentence',
  'sub_sentence_ratio',
  'compound_ratio',
  'direct_speech_ratio'
] as const

export interface PerFeatureDelta {
  feature: string
  user_value: number
  author_mean: number
  author_stddev: number
  z_score: number
}

export interface StyleDistanceResult {
  style_distance: number
  style_score: number
  per_feature: PerFeatureDelta[]
  features_compared: number
}

/**
 * Hauptfunktion. Liefert deterministischen Style-Score.
 */
export function computeStyleDistance(
  user: StyleFeatures,
  authorMeans: Record<string, number>,
  authorStddevs: Record<string, number>,
  options: { scaling?: number } = {}
): StyleDistanceResult {
  const scaling = options.scaling ?? DEFAULT_SCALING

  const perFeature: PerFeatureDelta[] = []
  const zScores: number[] = []

  for (const key of SCALAR_FEATURE_KEYS) {
    const userVal = (user as any)[key]
    const mean = authorMeans[key]
    const stddev = authorStddevs[key]

    if (typeof userVal !== 'number' || typeof mean !== 'number') continue
    if (!Number.isFinite(userVal) || !Number.isFinite(mean)) continue

    const safeStddev = Math.max(stddev ?? 0, STDDEV_EPSILON)
    const z = Math.abs(userVal - mean) / safeStddev
    zScores.push(z)
    perFeature.push({
      feature: key,
      user_value: userVal,
      author_mean: mean,
      author_stddev: safeStddev,
      z_score: z
    })
  }

  const styleDistance =
    zScores.length > 0 ? zScores.reduce((a, b) => a + b, 0) / zScores.length : 0
  const styleScore = Math.max(0, Math.min(100, 100 - scaling * styleDistance))

  // Sort per_feature for UI display: worst (highest z) first
  perFeature.sort((a, b) => b.z_score - a.z_score)

  return {
    style_distance: styleDistance,
    style_score: styleScore,
    per_feature: perFeature,
    features_compared: zScores.length
  }
}

/**
 * Findet die N größten Abweichungen für UI-Anzeige.
 * (z. B. "Du nutzt zu wenige Adjektive — Author: 0.12 ± 0.03, du: 0.04").
 */
export function topDeviations(result: StyleDistanceResult, n: number = 3): PerFeatureDelta[] {
  return result.per_feature.slice(0, n)
}
