/**
 * Map from raw API/DB feature keys to human-readable German labels + short
 * explanations. Used by /autoren/[slug] stylometry display.
 */

export interface FeatureMeta {
  label: string
  short: string
  unit?: string
  /** True if higher value = more of the thing (display green-on-high). False if lower = better. */
  preferLower?: boolean
}

export const FEATURE_META: Record<string, FeatureMeta> = {
  ttr: {
    label: 'Type-Token-Ratio (TTR)',
    short: 'Lexikalische Vielfalt: einzigartige Wörter ÷ Gesamtwörter.',
  },
  mtld: {
    label: 'MTLD',
    short: 'Bias-resistente Variante der TTR (McCarthy 2010). Höher = vielfältiger.',
  },
  hapax_ratio: {
    label: 'Hapax-Legomena-Ratio',
    short: 'Anteil einmaliger Wörter. Höher = mehr seltenes Vokabular.',
  },
  avg_word_length: {
    label: 'Durchschnittliche Wortlänge',
    short: 'Mittlere Zeichenzahl pro Wort.',
    unit: 'Zeichen',
  },
  avg_sentence_length: {
    label: 'Durchschnittliche Satzlänge',
    short: 'Mittlere Wortzahl pro Satz.',
    unit: 'Wörter',
  },
  sentence_length_variance: {
    label: 'Satzlängen-Varianz',
    short: 'Wie stark die Satzlängen schwanken. Hoch = abwechslungsreicher Rhythmus.',
  },
  sentence_length_stddev: {
    label: 'Satzlängen-Standardabweichung',
    short: 'Wurzel der Varianz; gleicher Befund in anderer Einheit.',
  },
  punctuation_per_sentence: {
    label: 'Komma-Dichte',
    short: 'Satzzeichen pro Satz — Indikator für Hypotaxe (Schachtelung).',
  },
  adj_ratio: {
    label: 'Adjektiv-Anteil',
    short: 'Adjektive ÷ Gesamtwörter. Hoch = beschreibender Stil.',
  },
  adv_ratio: {
    label: 'Adverb-Anteil',
    short: 'Adverbien ÷ Gesamtwörter.',
  },
  adj_verb_ratio: {
    label: 'Adjektiv-zu-Verb-Verhältnis',
    short: 'Adjektive ÷ Verben. Hoch = statisch-deskriptiv, niedrig = handlungsbetont.',
  },
  dependency_distance: {
    label: 'Dependency-Distance',
    short: 'Mittlerer Abstand zwischen abhängigen Wörtern im Satz. Hoch = komplexere Syntax.',
  },
  sub_sentence_ratio: {
    label: 'Nebensatz-Anteil',
    short: 'Nebensätze pro Hauptsatz — Indikator für hypotaktische Schreibweise.',
  },
  compound_ratio: {
    label: 'Komposita-Anteil',
    short: 'Wortzusammensetzungen (typisch deutsch). Höher bei Mann vs. Kafka.',
  },
  direct_speech_ratio: {
    label: 'Direkte-Rede-Anteil',
    short: 'Anteil Text in Anführungszeichen.',
  },
}

/** Order in which to display features (most diagnostic first) */
export const FEATURE_DISPLAY_ORDER = [
  'avg_sentence_length',
  'sentence_length_stddev',
  'punctuation_per_sentence',
  'mtld',
  'ttr',
  'hapax_ratio',
  'adj_verb_ratio',
  'dependency_distance',
  'sub_sentence_ratio',
  'compound_ratio',
  'direct_speech_ratio',
  'avg_word_length',
  'adj_ratio',
  'adv_ratio',
  'sentence_length_variance',
] as const

/**
 * Map a numeric feature value to a sigma-position relative to a corpus mean+stddev.
 * Returns a value in [-3, +3] capped, where 0 = at mean, +1 = 1 std above, -1 = 1 std below.
 */
export function sigmaFromCorpus(
  value: number,
  corpusMean: number,
  corpusStddev: number
): number {
  if (!Number.isFinite(value) || !Number.isFinite(corpusMean) || corpusStddev <= 0) return 0
  const z = (value - corpusMean) / corpusStddev
  return Math.max(-3, Math.min(3, z))
}
