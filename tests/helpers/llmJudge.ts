import openai from '../../src/lib/openai';
import { z } from 'zod';

// ────────────────────────────────────────────────────────────────────────────
// Local type helpers
// ────────────────────────────────────────────────────────────────────────────

// The openai@5.x types don't yet expose `output_text` on Response.  This minimal
// interface lets us keep strict typing until the SDK is updated.
export interface ResponseWithText { output_text?: string }

// Runtime-safe schema for response validation
const JudgeResponse = z.object({
  meets: z.boolean(),
  reason: z.string(),
});

type JudgeResponse = z.infer<typeof JudgeResponse>;

// Manual JSON schema to avoid issues with zod-to-json-schema generating $ref
const judgeResponseJsonSchema = {
  type: 'object',
  properties: {
    meets: {
      type: 'boolean',
      description: 'Whether the response meets the requirements'
    },
    reason: {
      type: 'string',
      description: 'Detailed explanation of the judgment'
    }
  },
  required: ['meets', 'reason'],
  additionalProperties: false
};

/**
 * Uses OpenAI to judge responses using structured outputs for guaranteed schema compliance.
 */
export async function llmJudge({
  response,
  requirements,
}: {
  response: string;
  requirements: string;
}): Promise<{ meets: boolean; reason: string }> {
  try {
    const instructions = `You are an expert evaluator that judges whether AI assistant responses meet specific requirements.

Requirements:
${requirements}

Evaluate whether the provided response meets the requirements and provide your judgment with clear reasoning.`;

    const inputText = `Assistant Response:
"""
${response}
"""`;

    const completion = await openai.responses.create({
      model: 'gpt-4.1-mini',
      temperature: 0,
      text: {
        format: {
          type: 'json_schema',
          name: 'judge_response',
          strict: true,
          schema: judgeResponseJsonSchema,
        },
      },
      instructions: instructions,
      input: inputText,
      max_output_tokens: 300,
    });

    const rawContent = (completion as ResponseWithText).output_text ?? '';
    
    if (!rawContent) {
      throw new Error('No content returned from OpenAI');
    }

    const parsed = JSON.parse(rawContent);
    const validated = JudgeResponse.parse(parsed);
    
    return validated;
  } catch (error) {
    console.error('Error in llmJudge:', error);
    // Fallback response indicating evaluation failed
    return {
      meets: false,
      reason: 'Evaluation failed due to technical error'
    };
  }
} 