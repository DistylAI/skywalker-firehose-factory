import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { run, user as userMessage } from '@openai/agents';
import assistantAgent from '../src/agents/assistantAgent';

// Helper to get assistant response as a full string (non-streaming)
async function getAssistantResponse(input: string): Promise<string> {
  const history = [userMessage(input)];
  const streamed = await run(assistantAgent, history, { stream: true });
  let output = '';
  for await (const ev of streamed) {
    if (
      ev.type === 'raw_model_stream_event' &&
      ev.data.type === 'output_text_delta'
    ) {
      output += ev.data.delta as string;
    }
  }
  return output.trim();
}

describe('Assistant agent end-to-end order flow', () => {
  beforeEach(() => {
    // Reset scenario before each test
    delete (globalThis as any).currentScenario;
  });

  afterEach(() => {
    delete (globalThis as any).currentScenario;
  });

  it('returns default orders list when no scenario provided', async () => {
    const response = await getAssistantResponse('Can you show me my recent orders?');
    expect(response).toContain('Order 1001');
    expect(response).toContain('Lightsaber');
  });

  async function runWithScenario(scenario: string, prompt = 'Show my orders') {
    const history = [
      userMessage(prompt),
      {
        type: 'function_call',
        name: 'get_orders',
        arguments: JSON.stringify({ context: { scenario } }),
        callId: 'test-call',
        status: 'in_progress',
      } as any,
    ];

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

  it('returns single order when scenario is "single"', async () => {
    const response = await runWithScenario('single');
    expect(response).toMatch(/4001/);
    expect(response.match(/•/g)?.length).toBe(1);
  });

  it('formats cancelled orders correctly', async () => {
    const response = await runWithScenario('cancelled');
    expect(response).toMatch(/cancelled/);
    expect(response).toMatch(/2001/);
    expect(response).toMatch(/Purple Lightsaber Crystal/);
  });
}); 