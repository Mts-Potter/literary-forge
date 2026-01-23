import Levenshtein from 'fast-levenshtein'

export type SRSCard = {
  interval: number      // Tage bis nächste Wiederholung
  repetitions: number   // Anzahl erfolgreicher Wiederholungen
  efFactor: number      // Easiness Factor (1.3 - 2.5)
  nextReview: Date      // Fälligkeitsdatum
}

/**
 * SM-2 Algorithmus mit Fuzzy Grading
 */
export class SM2Algorithm {
  /**
   * Berechnet Quality aus Levenshtein-Distanz
   * @param userInput Was der User eingegeben hat
   * @param correctAnswer Die korrekte Antwort
   * @returns Quality 0-5
   */
  calculateQuality(userInput: string, correctAnswer: string): number {
    const distance = Levenshtein.get(
      userInput.trim().toLowerCase(),
      correctAnswer.trim().toLowerCase()
    )
    const maxLen = Math.max(userInput.length, correctAnswer.length)
    const ratio = 1 - (distance / maxLen)

    if (ratio >= 0.98) return 5 // Perfekt
    if (ratio >= 0.95) return 4 // Fast perfekt
    if (ratio >= 0.90) return 4 // Gut
    if (ratio >= 0.80) return 3 // Akzeptabel
    if (ratio >= 0.60) return 2 // Schwierig
    return 0 // Fail
  }

  /**
   * Aktualisiert SRS-Karte basierend auf Quality
   */
  updateCard(card: SRSCard, quality: number): SRSCard {
    let { interval, repetitions, efFactor } = card

    // EF-Faktor anpassen
    efFactor = Math.max(
      1.3,
      efFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    )

    // Intervall berechnen
    if (quality < 3) {
      // Fail: Reset
      repetitions = 0
      interval = 1
    } else {
      repetitions++
      if (repetitions === 1) {
        interval = 1
      } else if (repetitions === 2) {
        interval = 6
      } else {
        interval = Math.round(interval * efFactor)
      }
    }

    const nextReview = new Date()
    nextReview.setDate(nextReview.getDate() + interval)

    return {
      interval,
      repetitions,
      efFactor,
      nextReview
    }
  }
}

export const sm2 = new SM2Algorithm()
