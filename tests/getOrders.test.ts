import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { run, user as userMessage } from '@openai/agents';
import assistantAgent from '../src/agents/assistantAgent';

async function runAgentWithScenario(scenario: string, prompt: string): Promise<string> {
  const history = [userMessage(prompt)];
  const context = { scenario };
  
  const streamed = await run(assistantAgent, history, { 
    stream: true,
    context: context
  });
  
  let response = '';
  for await (const ev of streamed) {
    if (
      ev.type === 'raw_model_stream_event' &&
      ev.data.type === 'output_text_delta'
    ) {
      response += ev.data.delta as string;
    }
  }
  
  return response.trim();
}

describe('Orders Tool E2E Tests', () => {

  describe('Order ID verification', () => {
    const testCases = [
      { scenario: 'default', expectedOrderId: '1001', description: 'default scenario' },
      { scenario: 'single', expectedOrderId: '4001', description: 'single order scenario' },
      { scenario: 'multiple', expectedOrderId: '3001', description: 'multiple orders scenario' },
      { scenario: 'cancelled', expectedOrderId: '2001', description: 'cancelled orders scenario' },
      { scenario: 'returned', expectedOrderId: '6001', description: 'returned orders scenario' },
      { scenario: 'intranit', expectedOrderId: '5001', description: 'in transit orders scenario' },
    ];

    testCases.forEach(({ scenario, expectedOrderId, description }) => {
      it(`${description} should include order ${expectedOrderId}`, async () => {
        const response = await runAgentWithScenario(scenario, 'Show me my recent orders');
        
        expect(response).toContain(expectedOrderId);
      }, { timeout: 30000 });
    });
  });

  describe('Response format validation', () => {
    it('should provide human-readable order information', async () => {
      const response = await runAgentWithScenario('default', 'What are my orders?');
      
      // Should contain order ID and some descriptive text
      expect(response).toContain('1001');
      expect(response.length).toBeGreaterThan(20); // Should be more than just an ID
    }, { timeout: 30000 });

    it('should handle different prompts for the same scenario', async () => {
      const prompts = [
        'Show my orders',
        'What orders do I have?',
        'Can you list my recent purchases?',
        'I need to see my order history'
      ];

      for (const prompt of prompts) {
        const response = await runAgentWithScenario('single', prompt);
        expect(response).toContain('4001');
      }
    }, { timeout: 60000 });
  });
});