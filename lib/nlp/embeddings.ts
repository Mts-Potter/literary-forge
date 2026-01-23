/**
 * Real Semantic Embeddings using Transformers.js
 * Replaces mock implementation with actual NLP model
 *
 * Model: Xenova/all-MiniLM-L6-v2 (384 dimensions, ~22MB quantized)
 * Binary Quantization: 96% storage reduction (1,536 bytes → 48 bytes)
 * Memory Management: Strict .dispose() calls to prevent WASM leaks
 */

import { pipeline, env, type FeatureExtractionPipeline } from '@xenova/transformers'

// Configure Transformers.js for Edge Runtime compatibility
env.allowLocalModels = false  // Don't load from disk
env.allowRemoteModels = true  // Fetch from CDN
env.useBrowserCache = true    // Cache in browser storage
env.useCustomCache = false     // Don't use custom cache directory

/**
 * Result of embedding generation
 * Includes both formats for dual-write strategy
 */
export interface EmbeddingResult {
  float32: number[]   // Original 384-dim vector (1,536 bytes)
  binary: string      // Hex-encoded binary quantization (48 bytes)
}

/**
 * EmbeddingGenerator with real Transformers.js model
 * Singleton pattern to reuse model across multiple calls
 */
export class EmbeddingGenerator {
  private model: FeatureExtractionPipeline | null = null
  private isInitializing = false
  private initPromise: Promise<void> | null = null

  /**
   * Initialize the embedding model
   * Downloads ~22MB model on first call (cached thereafter)
   */
  async initialize(): Promise<void> {
    // Prevent multiple simultaneous initializations
    if (this.model) {
      return  // Already initialized
    }

    if (this.isInitializing) {
      // Already initializing - wait for it to complete
      await this.initPromise
      return
    }

    this.isInitializing = true
    this.initPromise = (async () => {
      try {
        console.log('[EmbeddingGenerator] Initializing model...')
        const startTime = Date.now()

        // Load the model
        // Note: Uses quantized ONNX model for smaller size (80MB → 22MB)
        this.model = await pipeline(
          'feature-extraction',
          'Xenova/all-MiniLM-L6-v2',
          {
            quantized: true,  // Use int8 quantized model (smaller, faster)
            progress_callback: (progress: any) => {
              // Log download progress
              if (progress.status === 'progress') {
                const percent = (progress.loaded / progress.total * 100).toFixed(1)
                console.log(`[EmbeddingGenerator] Downloading: ${percent}%`)
              } else if (progress.status === 'ready') {
                console.log('[EmbeddingGenerator] Model ready')
              }
            }
          }
        )

        const elapsed = Date.now() - startTime
        console.log(`[EmbeddingGenerator] Model loaded in ${elapsed}ms`)
      } catch (error) {
        console.error('[EmbeddingGenerator] Failed to load model:', error)
        this.model = null
        throw error
      } finally {
        this.isInitializing = false
      }
    })()

    await this.initPromise
  }

  /**
   * Generate embedding for given text
   * Returns both float32 and binary quantized versions
   *
   * @param text - Input text (truncated to 5000 chars to avoid token limits)
   * @returns EmbeddingResult with float32 array and hex binary string
   *
   * @throws Error if model not initialized
   */
  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    if (!this.model) {
      throw new Error('Model not initialized. Call initialize() first.')
    }

    // Truncate text to avoid token limit (512 tokens ≈ 2000-3000 chars)
    // Model has max sequence length of 512 tokens
    const truncatedText = text.slice(0, 5000)

    try {
      // Generate embedding with mean pooling and L2 normalization
      const output = await this.model(truncatedText, {
        pooling: 'mean',      // Average across all token embeddings
        normalize: true       // L2 normalization (unit length)
      })

      // CRITICAL: Extract data BEFORE dispose()
      // output.data is Float32Array, must copy to regular array
      const float32: number[] = Array.from(output.data)

      // Verify dimensionality
      if (float32.length !== 384) {
        throw new Error(`Expected 384 dimensions, got ${float32.length}`)
      }

      // Apply binary quantization via sign function
      const binary = this.quantizeToBinary(float32)

      // CRITICAL: Dispose tensor to prevent memory leak
      // Without this, each call leaks ~1.5KB in WASM memory
      // After 1000 calls without dispose: ~1.5MB leaked → OOM crash
      if (typeof (output as any).dispose === 'function') {
        (output as any).dispose()
      }

      return { float32, binary }
    } catch (error) {
      console.error('[EmbeddingGenerator] Failed to generate embedding:', error)
      throw error
    }
  }

  /**
   * Binary quantization via sign function
   * Converts float32 vector to binary (1 if >= 0, else 0)
   *
   * @param embedding - 384-dimension float32 vector
   * @returns Hex-encoded binary string (96 hex chars = 384 bits = 48 bytes)
   *
   * Example: [0.5, -0.3, 0.1, -0.8] → "1010" → "A" (hex)
   */
  private quantizeToBinary(embedding: number[]): string {
    if (embedding.length !== 384) {
      throw new Error(`Expected 384 dimensions for binary quantization, got ${embedding.length}`)
    }

    // Convert each dimension to binary: 1 if >= 0, else 0
    let bitString = ''
    for (const value of embedding) {
      bitString += value >= 0 ? '1' : '0'
    }

    // Convert bitstring to hexadecimal for PostgreSQL BIT type
    // PostgreSQL expects hex format: x'ABCD...' or '\\xABCD...'
    const bytes: string[] = []
    for (let i = 0; i < bitString.length; i += 8) {
      const byte = bitString.slice(i, i + 8)
      const hexByte = parseInt(byte, 2).toString(16).padStart(2, '0')
      bytes.push(hexByte)
    }

    return bytes.join('')  // Returns hex string like "a3f2c1d4..." (96 chars)
  }

  /**
   * Compute cosine similarity between two embeddings
   * Range: [-1, 1] where 1 = identical, 0 = orthogonal, -1 = opposite
   *
   * @param a - First embedding
   * @param b - Second embedding
   * @returns Similarity score (-1 to 1)
   */
  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error(`Dimension mismatch: ${a.length} vs ${b.length}`)
    }

    // Dot product: sum of element-wise multiplication
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0)

    // Magnitudes: L2 norm (Euclidean length)
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))

    // Avoid division by zero
    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0
    }

    // Cosine similarity = dot product / (magnitude_a * magnitude_b)
    return dotProduct / (magnitudeA * magnitudeB)
  }

  /**
   * Clean up resources
   * Call when embedding generator is no longer needed
   */
  dispose(): void {
    if (this.model && typeof (this.model as any).dispose === 'function') {
      (this.model as any).dispose()
    }
    this.model = null
    console.log('[EmbeddingGenerator] Resources disposed')
  }
}

// ============================================================================
// Singleton Pattern
// ============================================================================
// Reuse single instance across application to avoid multiple model loads
// Model is ~22MB and takes ~2-5 seconds to load first time

let globalEmbedder: EmbeddingGenerator | null = null

/**
 * Get singleton embedding generator instance
 * Automatically initializes on first call
 *
 * @returns Initialized EmbeddingGenerator
 */
export async function getEmbeddingGenerator(): Promise<EmbeddingGenerator> {
  if (!globalEmbedder) {
    globalEmbedder = new EmbeddingGenerator()
    await globalEmbedder.initialize()
  }
  return globalEmbedder
}

/**
 * Dispose singleton instance
 * Call when shutting down application or switching models
 */
export function disposeGlobalEmbedder(): void {
  if (globalEmbedder) {
    globalEmbedder.dispose()
    globalEmbedder = null
  }
}

// ============================================================================
// Usage Example
// ============================================================================
/*
// Server-side or client-side usage:

import { getEmbeddingGenerator } from '@/lib/nlp/embeddings'

// Generate embedding for text
const embedder = await getEmbeddingGenerator()
const { float32, binary } = await embedder.generateEmbedding('Hello world')

// Store in database (Supabase)
await supabase.from('source_texts').insert({
  content: 'Hello world',
  embedding: float32,                    // VECTOR(384) column
  embedding_binary: `\\x${binary}`       // BIT(384) column
})

// Compute similarity between texts
const similarity = embedder.cosineSimilarity(embedding1, embedding2)
console.log(`Similarity: ${(similarity * 100).toFixed(1)}%`)

// Cleanup (optional, typically done on app shutdown)
import { disposeGlobalEmbedder } from '@/lib/nlp/embeddings'
disposeGlobalEmbedder()
*/
