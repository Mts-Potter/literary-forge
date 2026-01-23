/**
 * MOCK: UDPipe Parser
 * Simuliert syntaktische Analyse bis WASM Integration bereit ist
 */

export type Token = {
  id: number
  form: string
  lemma: string
  upos: string  // Universal POS Tag
  head: number  // ID des syntaktischen Kopfes
  deprel: string
}

export type ParsedSentence = {
  tokens: Token[]
}

export class UDPipeParser {
  private initialized = false

  async initialize(modelPath: string): Promise<void> {
    // Mock: Simuliere Ladezeit
    await new Promise(resolve => setTimeout(resolve, 500))
    this.initialized = true
    console.log('[MOCK] UDPipe initialized with model:', modelPath)
  }

  parse(text: string): ParsedSentence[] {
    if (!this.initialized) {
      throw new Error('Parser not initialized')
    }

    // Mock: Einfache Tokenisierung ohne echte Syntax
    const sentences = text.split(/[.!?]+/).filter(s => s.trim())

    return sentences.map(sentence => {
      const words = sentence.trim().split(/\s+/)
      const tokens: Token[] = words.map((word, idx) => ({
        id: idx + 1,
        form: word,
        lemma: word.toLowerCase(),
        upos: this.mockPOS(word), // Grobe Heuristik
        head: idx > 0 ? idx : 0, // Simuliere lineare Abhängigkeit
        deprel: 'mock'
      }))

      return { tokens }
    })
  }

  private mockPOS(word: string): string {
    // Sehr grobe Heuristik für Demo
    if (/\p{Lu}/u.test(word[0])) return 'PROPN'
    if (word.endsWith('en')) return 'VERB'
    if (word.endsWith('lich') || word.endsWith('ig')) return 'ADJ'
    return 'NOUN'
  }
}

// Singleton Instance
let parserInstance: UDPipeParser | null = null

export async function getParser(): Promise<UDPipeParser> {
  if (!parserInstance) {
    parserInstance = new UDPipeParser()
    await parserInstance.initialize('german-gsd.udpipe')
  }
  return parserInstance
}
