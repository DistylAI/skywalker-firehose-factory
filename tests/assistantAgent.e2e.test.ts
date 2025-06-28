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

describe('Assistant Agent E2E Tests', () => {

  describe('Order scenarios', () => {
    const scenarios = [
      { 
        name: 'default scenario', 
        scenario: 'default', 
        expectedOrderId: '1001',
        prompt: 'Show me my recent orders'
      },
      { 
        name: 'single order scenario', 
        scenario: 'single', 
        expectedOrderId: '4001',
        prompt: 'What orders do I have?'
      },
      { 
        name: 'multiple orders scenario', 
        scenario: 'multiple', 
        expectedOrderId: '3001',
        prompt: 'Can you show me my orders?'
      },
      { 
        name: 'cancelled orders scenario', 
        scenario: 'cancelled', 
        expectedOrderId: '2001',
        prompt: 'Show my orders please'
      },
      { 
        name: 'returned orders scenario', 
        scenario: 'returned', 
        expectedOrderId: '6001',
        prompt: 'List my recent orders'
      },
      { 
        name: 'in transit orders scenario', 
        scenario: 'intranit', 
        expectedOrderId: '5001',
        prompt: 'What are my current orders?'
      }
    ];

    scenarios.forEach(({ name, scenario, expectedOrderId, prompt }) => {
      it(`${name} should return order ${expectedOrderId} in response`, async () => {
        const response = await runAgentWithScenario(scenario, prompt);
        
        // Assert that the expected order ID appears in the response
        expect(response).toContain(expectedOrderId);
      }, { timeout: 30000 });
    });
  });

  describe('Natural conversation flows', () => {
    it('should handle order requests naturally in default scenario', async () => {
      const response = await runAgentWithScenario('default', 'I want to check my order status');
      
      // Should contain at least one of the default scenario order IDs
      const hasDefaultOrder = ['1001', '1002', '1003'].some(id => response.includes(id));
      expect(hasDefaultOrder).toBe(true);
    }, { timeout: 30000 });

    it('should handle varied phrasing for order requests', async () => {
      const response = await runAgentWithScenario('single', 'Could you help me see what I\'ve ordered recently?');
      
      expect(response).toContain('4001');
    }, { timeout: 30000 });

    it('should work with casual language', async () => {
      const response = await runAgentWithScenario('cancelled', 'yo what\'s up with my orders?');
      
      expect(response).toContain('2001');
    }, { timeout: 30000 });
  });
});