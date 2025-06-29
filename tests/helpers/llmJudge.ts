import openai from '../../src/lib/openai';
import { z } from 'zod';

const JudgeResponse = z.object({
  meets: z.boolean(),
  reason: z.string(),
});

type JudgeResponse = z.infer<typeof JudgeResponse>;

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
  // Reuse global Portkey-routed OpenAI client
  
  const prompt = `You are an evaluator that judges whether an AI assistant response meets certain requirements.

Requirements:
${requirements}

Assistant Response:
"""
${response}
"""

Evaluate whether the response meets the requirements and provide your judgment.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0,
    messages: [
      { 
        role: 'system', 
        content: 'You are an expert evaluator. Analyze the given response against the requirements and provide a clear judgment with reasoning.' 
      },
      { role: 'user', content: prompt },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'judge_response',
        strict: true,
        schema: {
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
        }
      }
    }
  });

  const content = completion.choices[0].message.content;
  if (!content) {
    throw new Error('No content returned from OpenAI');
  }

  const parsed = JSON.parse(content);
  const validated = JudgeResponse.parse(parsed);
  
  return validated;
} 