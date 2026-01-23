import { ParsedSentence, Token } from './parsing'

export type StyleScore = {
  semanticFidelity: number      // Vektor A: 0-1
  syntacticIsomorphism: number  // Vektor B: 0-1
  overallScore: number          // Gewichtete Kombination
  details: {
    dependencyDistance: number
    adjVerbRatio: number
    sentenceLengthVariance: number
  }
}

export class StyleAnalyzer {
  /**
   * Berechnet mittlere Dependency Distance (MDD)
   */
  calculateDependencyDistance(sentences: ParsedSentence[]): number {
    let totalDistance = 0
    let tokenCount = 0

    for (const sentence of sentences) {
      for (const token of sentence.tokens) {
        if (token.head > 0) { // Ignoriere ROOT
          totalDistance += Math.abs(token.id - token.head)
          tokenCount++
        }
      }
    }

    return tokenCount > 0 ? totalDistance / tokenCount : 0
  }

  /**
   * Berechnet Adjektiv/Verb-Verhältnis
   */
  calculateAdjVerbRatio(sentences: ParsedSentence[]): number {
    let adjCount = 0
    let verbCount = 0

    for (const sentence of sentences) {
      for (const token of sentence.tokens) {
        if (token.upos === 'ADJ') adjCount++
        if (token.upos === 'VERB') verbCount++
      }
    }

    return verbCount > 0 ? adjCount / verbCount : 0
  }

  /**
   * Berechnet Varianz der Satzlängen
   */
  calculateSentenceLengthVariance(sentences: ParsedSentence[]): number {
    const lengths = sentences.map(s => s.tokens.length)
    const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length
    const variance = lengths.reduce((sum, len) => sum + Math.pow(len - mean, 2), 0) / lengths.length
    return Math.sqrt(variance)
  }

  /**
   * Vergleicht User-Text mit Original und gibt Score
   */
  compareStyles(
    userSentences: ParsedSentence[],
    originalMetrics: {
      dependencyDistance: number
      adjVerbRatio: number
      sentenceLengthVariance: number
    }
  ): StyleScore {
    const userDD = this.calculateDependencyDistance(userSentences)
    const userAVR = this.calculateAdjVerbRatio(userSentences)
    const userSLV = this.calculateSentenceLengthVariance(userSentences)

    // Normalisierte Distanzen (je näher an 1, desto besser)
    const ddScore = 1 - Math.min(Math.abs(userDD - originalMetrics.dependencyDistance) / 10, 1)
    const avrScore = 1 - Math.min(Math.abs(userAVR - originalMetrics.adjVerbRatio) / 2, 1)
    const slvScore = 1 - Math.min(Math.abs(userSLV - originalMetrics.sentenceLengthVariance) / 10, 1)

    const syntacticIsomorphism = (ddScore * 0.4 + avrScore * 0.3 + slvScore * 0.3)

    return {
      semanticFidelity: 0.85, // Placeholder - kommt von Embedding-Vergleich
      syntacticIsomorphism,
      overallScore: 0.85 * 0.4 + syntacticIsomorphism * 0.6, // 40% Semantik, 60% Syntax
      details: {
        dependencyDistance: userDD,
        adjVerbRatio: userAVR,
        sentenceLengthVariance: userSLV
      }
    }
  }
}

export const styleAnalyzer = new StyleAnalyzer()
