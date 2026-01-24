/**
 * API Input Validation Schemas
 *
 * Uses Zod for runtime validation of all API inputs.
 * Prevents injection attacks, resource exhaustion, and type confusion.
 *
 * SECURITY: All API routes MUST validate inputs using these schemas.
 */

import { z } from 'zod'

/**
 * Admin Book Ingestion Schema
 * Used by: /api/admin/ingest
 */
export const ingestSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(500, 'Title must be less than 500 characters'),

  content: z.string()
    .min(100, 'Content must be at least 100 characters')
    .max(1_000_000, 'Content must be less than 1MB'),

  chunkSize: z.number()
    .int('Chunk size must be an integer')
    .min(50, 'Chunk size must be at least 50')
    .max(5000, 'Chunk size must not exceed 5000')
    .optional()
    .default(500),

  language: z.enum(['de', 'en', 'fr', 'es', 'it'] as const, {
    message: 'Invalid language code'
  }),

  cefrLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const, {
    message: 'Invalid CEFR level'
  }).optional(),

  newAuthorName: z.string()
    .min(1, 'Author name is required')
    .max(200, 'Author name must be less than 200 characters')
    .optional(),

  existingAuthorId: z.string()
    .uuid('Invalid author ID format')
    .optional(),

  tags: z.array(z.string().max(50))
    .max(20, 'Maximum 20 tags allowed')
    .optional(),
})

/**
 * Training Submission Schema
 * Used by: /api/train/submit
 */
export const submitTrainingSchema = z.object({
  text_id: z.string()
    .uuid('Invalid text ID format'),

  user_text: z.string()
    .min(1, 'User text is required')
    .max(10_000, 'User text must be less than 10,000 characters'),
})

/**
 * Text Analysis Schema
 * Used by: /api/analyze
 */
export const analyzeSchema = z.object({
  type: z.enum(['destyle', 'style_mimic'] as const, {
    message: 'Invalid analysis type'
  }),

  userText: z.string()
    .min(10, 'User text must be at least 10 characters')
    .max(10_000, 'User text must be less than 10,000 characters'),

  originalText: z.string()
    .min(10, 'Original text must be at least 10 characters')
    .max(10_000, 'Original text must be less than 10,000 characters')
    .optional(),

  styleMetrics: z.object({
    dependencyDistance: z.number()
      .min(0, 'Dependency distance must be positive')
      .max(100, 'Dependency distance too high'),

    adjVerbRatio: z.number()
      .min(0, 'Adj/verb ratio must be positive')
      .max(10, 'Adj/verb ratio too high'),

    sentenceLengthVariance: z.number()
      .min(0, 'Sentence variance must be positive')
      .max(1000, 'Sentence variance too high'),
  }).optional(),
})

/**
 * Scene Description Generation Schema
 * Used by: /api/generate-scene-description
 */
export const sceneDescriptionSchema = z.object({
  userText: z.string()
    .min(10, 'User text must be at least 10 characters')
    .max(5_000, 'User text must be less than 5,000 characters'),
})

/**
 * AI Response Validation Schemas
 * Used to validate responses from AWS Bedrock
 */

/**
 * Bedrock Training Analysis Response
 * Expected format from /api/train/submit Bedrock call
 */
export const bedrockAnalysisSchema = z.object({
  feedback: z.string()
    .min(1, 'Feedback is required'),

  scores: z.object({
    structure: z.number().min(0).max(100),
    vocabulary: z.number().min(0).max(100),
    rhythm: z.number().min(0).max(100),
    tone: z.number().min(0).max(100),
  }),

  overall_accuracy: z.number()
    .min(0, 'Accuracy must be at least 0')
    .max(100, 'Accuracy must not exceed 100'),

  suggestions: z.array(z.string())
    .optional()
    .default([]),
})

/**
 * Bedrock Analysis Response
 * Expected format from /api/analyze Bedrock call
 */
export const bedrockMetadataSchema = z.object({
  dependencyDistance: z.number().min(0).max(100),
  adjVerbRatio: z.number().min(0).max(10),
  sentenceLengthVariance: z.number().min(0).max(1000),
  // Allow other fields but validate known ones
}).passthrough()

/**
 * Type exports for TypeScript
 */
export type IngestInput = z.infer<typeof ingestSchema>
export type SubmitTrainingInput = z.infer<typeof submitTrainingSchema>
export type AnalyzeInput = z.infer<typeof analyzeSchema>
export type SceneDescriptionInput = z.infer<typeof sceneDescriptionSchema>
export type BedrockAnalysis = z.infer<typeof bedrockAnalysisSchema>
export type BedrockMetadata = z.infer<typeof bedrockMetadataSchema>
