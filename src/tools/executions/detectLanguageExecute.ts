import openai from '../../lib/openai';
import { z } from 'zod';

// ────────────────────────────────────────────────────────────────────────────
// Local type helpers
// ────────────────────────────────────────────────────────────────────────────

// The openai@5.x types don't yet expose `output_text` on Response.  This minimal
// interface lets us keep strict typing until the SDK is updated.
export interface ResponseWithText { output_text?: string }

// Runtime-safe schema that also doubles as the JSON-schema we pass to the model
const LanguageDetectionSchema = z.object({
  languageCode: z.string().min(2).max(8), // ISO-639-1 or "unknown"
  reason: z.string().min(1).max(50),
});

export type LanguageDetection = z.infer<typeof LanguageDetectionSchema>;

// Manual JSON schema to avoid issues with zod-to-json-schema generating $ref
const languageDetectionJsonSchema = {
  type: 'object',
  properties: {
    languageCode: { 
      type: 'string', 
      minLength: 2,
      maxLength: 8,
      description: 'ISO 639-1 lowercase code or "unknown"' 
    },
    reason: { 
      type: 'string',
      minLength: 1,
      maxLength: 50,
      description: 'Short reasoning for the detection'
    }
  },
  required: ['languageCode', 'reason'],
  additionalProperties: false
};

export async function detectLanguageExecute(input: { text: string }) {
  try {
    const response = await openai.responses.create({
      model: 'gpt-4.1-mini',
      temperature: 0,
      text: {
        format: {
          type: 'json_schema',
          name: 'language_detection',
          strict: true,
          schema: languageDetectionJsonSchema,
        },
      },
      instructions: 'Detect the primary language and respond with JSON.',
      input: input.text,
      max_output_tokens: 150,
    });

    const rawContent = (response as ResponseWithText).output_text ?? '';

    const json = JSON.parse(rawContent);

    const parsed: LanguageDetection = LanguageDetectionSchema.parse(json);

    return { ...parsed, text: input.text };
  } catch (error) {
    console.error('Error detecting language:', error);
    return {
      languageCode: 'unknown',
      reason: 'error',
      text: input.text,
    };
  }
}