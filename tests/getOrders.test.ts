import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { run, user as userMessage } from '@openai/agents';
import assistantAgent from '../src/agents/assistantAgent';

// Helper – run the assistant for a single user utterance and collect the full response text
async function queryAssistant(prompt: string): Promise<string> {
  const history = [userMessage(prompt)];
  const streamed = await run(assistantAgent, history, { stream: true });
  let text = '';
  for await (const ev of streamed) {
    if (
      ev.type === 'raw_model_stream_event' &&
      ev.data.type === 'output_text_delta'
    ) {
      text += ev.data.delta as string;
    }
  }
  return text;
}

describe('Orders Agent – end-to-end through assistantAgent', () => {
  beforeEach(() => {
    delete (globalThis as any).currentScenario;
  });
  afterEach(() => {
    delete (globalThis as any).currentScenario;
  });

  interface Case {
    scenario?: string; // undefined → default scenario
    expectedId: string;
  }

  const cases: Case[] = [
    { expectedId: '1001' },
    { scenario: 'single', expectedId: '4001' },
    { scenario: 'multiple', expectedId: '3001' },
    { scenario: 'cancelled', expectedId: '2001' },
    { scenario: 'returned', expectedId: '6001' },
  ];

  for (const { scenario, expectedId } of cases) {
    const title = scenario
      ? `scenario "${scenario}" returns order ${expectedId}`
      : `default scenario returns order ${expectedId}`;

    it(title, async () => {
      const history = [
        userMessage('Show my recent orders'),
        {
          type: 'function_call',
          name: 'get_orders',
          arguments: JSON.stringify({ context: { scenario: scenario ?? 'default' } }),
          callId: 'test-call',
          status: 'in_progress',
        } as any,
      ];

      const streamed = await run(assistantAgent, history, { stream: true });
      let response = '';
      for await (const ev of streamed) {
        if (
          ev.type === 'raw_model_stream_event' &&
          ev.data.type === 'output_text_delta'
        ) {
          response += ev.data.delta as string;
        }
      }

      expect(response).toMatch(new RegExp(expectedId));
    });
  }
}); 