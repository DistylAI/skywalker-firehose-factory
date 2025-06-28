import { run, user as userMessage } from '@openai/agents';
import { createAssistantAgent } from '../src/agents/assistantAgent';
import { llmJudge } from './helpers/llmJudge';

async function runAgentWithContext(context: any, prompt: string): Promise<string> {
  const history = [userMessage(prompt)];
  
  // Create agent with the specific context
  const agent = createAssistantAgent(context);
  
  const streamed = await run(agent, history, { 
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

  describe('Auth Level Tests', () => {
    const orderScenarios = [
      { scenario: 'default', expectedOrderId: '1001' },
      { scenario: 'single', expectedOrderId: '4001' },
      { scenario: 'multiple', expectedOrderId: '3001' },
      { scenario: 'cancelled', expectedOrderId: '2001' },
      { scenario: 'returned', expectedOrderId: '6001' },
      { scenario: 'intranit', expectedOrderId: '5001' }
    ];

    describe('Auth Level 0 - No order access', () => {
      orderScenarios.forEach(({ scenario, expectedOrderId }) => {
        it(`${scenario} scenario should NOT include order ID ${expectedOrderId} with auth level 0`, async () => {
          const context = {
            scenario: scenario,
            auth_level: '0'
          };
          
          const response = await runAgentWithContext(context, 'Show me my orders');
          
          // Should not contain the order ID
          expect(response).not.toContain(expectedOrderId);
          
          // Should indicate lack of access
          const judgeDeny = await llmJudge({
            response,
            requirements: 'The response should politely deny access to order information and should not list any order IDs.',
          });
          expect(judgeDeny.meets, judgeDeny.reason).toBe(true);
        }, 30000);
      });

      it('should still handle jokes with auth level 0', async () => {
        const context = {
          scenario: 'default',
          auth_level: '0'
        };
        
        const response = await runAgentWithContext(context, 'Tell me a joke');
        
        const judge = await llmJudge({
          response,
          requirements: 'The response should be a short, humorous joke suitable for a general audience.',
        });
        expect(judge.meets, judge.reason).toBe(true);
      }, 30000);
    });

    describe('Auth Level 1 - Full order access', () => {
      orderScenarios.forEach(({ scenario, expectedOrderId }) => {
        it(`${scenario} scenario should include order ID ${expectedOrderId} with auth level 1`, async () => {
          const context = {
            scenario: scenario,
            auth_level: '1'
          };
          
          const response = await runAgentWithContext(context, 'Show me my orders');
          
          // Should contain the order ID
          expect(response).toContain(expectedOrderId);
        }, 30000);
      });

      it('should handle both jokes and orders with auth level 1', async () => {
        const context = {
          scenario: 'default',
          auth_level: '1'
        };
        
        // Test joke access
        const jokeResponse = await runAgentWithContext(context, 'Tell me a joke');
        const judgeJoke = await llmJudge({
          response: jokeResponse,
          requirements: 'The response should be a short, humorous joke suitable for a general audience.',
        });
        expect(judgeJoke.meets, judgeJoke.reason).toBe(true);
        
        // Test order access
        const orderResponse = await runAgentWithContext(context, 'Show me my orders');
        expect(orderResponse).toContain('1001');
      }, 60000);
    });
  });

  describe('Legacy Order scenarios (backward compatibility)', () => {
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
      it(`${name} should work without explicit auth level (defaults to 0)`, async () => {
        const context = { scenario };
        const response = await runAgentWithContext(context, prompt);
        
        // With default auth level 0, should not contain order ID
        expect(response).not.toContain(expectedOrderId);
      }, 30000);
    });
  });

  describe('Natural conversation flows with auth levels', () => {
    it('should politely decline order requests with auth level 0', async () => {
      const context = {
        scenario: 'default',
        auth_level: '0'
      };
      
      const response = await runAgentWithContext(context, 'I want to check my order status');
      
      // Should not contain order IDs
      const hasDefaultOrder = ['1001', '1002', '1003'].some(id => response.includes(id));
      expect(hasDefaultOrder).toBe(false);
      
      // Should indicate lack of access
      const judgeDeny = await llmJudge({
        response,
        requirements: 'The response should politely deny access to order information and should not list any order IDs.',
      });
      expect(judgeDeny.meets, judgeDeny.reason).toBe(true);
    }, 30000);

    it('should provide order information with auth level 1', async () => {
      const context = {
        scenario: 'single',
        auth_level: '1'
      };
      
      const response = await runAgentWithContext(context, 'Could you help me see what I\'ve ordered recently?');
      
      expect(response).toContain('4001');
    }, 30000);
  });
});