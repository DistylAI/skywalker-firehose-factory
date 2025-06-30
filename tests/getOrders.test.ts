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

describe('Orders Tool E2E Tests', () => {

  describe('Core Auth Level Behavior', () => {
    it('should deny access with auth level 0', async () => {
      const context = {
        scenario: 'default',
        auth_level: '0'
      };
      
      const response = await runAgentWithContext(context, 'Show me my recent orders');
      
      expect(response).not.toContain('1001');
      const judge = await llmJudge({
        response,
        requirements: 'The response should politely deny access to order information and should not list any order IDs.',
      });
      expect(judge.meets, judge.reason).toBe(true);
    }, 30000);

    it('should provide access with auth level 1', async () => {
      const context = {
        scenario: 'default',
        auth_level: '1'
      };
      
      const response = await runAgentWithContext(context, 'Show me my recent orders');
      
      expect(response).toContain('1001');
    }, 30000);
  });

  describe('Response format validation', () => {
    it('should provide human-readable order information with auth level 1', async () => {
      const context = {
        scenario: 'default',
        auth_level: '1'
      };
      
      const response = await runAgentWithContext(context, 'What are my orders?');
      
      // Should contain order ID and some descriptive text
      expect(response).toContain('1001');
      expect(response.length).toBeGreaterThan(20); // Should be more than just an ID
    }, 30000);

    it('should handle different prompts for the same scenario with auth level 1', async () => {
      const prompts = [
        'Show my orders',
        'What orders do I have?',
        'Can you list my recent purchases?',
        'I need to see my order history'
      ];

      for (const prompt of prompts) {
        const context = {
          scenario: 'single',
          auth_level: '1'
        };
        
        const response = await runAgentWithContext(context, prompt);
        expect(response).toContain('4001');
      }
    }, 60000);

    it('should consistently deny access with auth level 0 regardless of prompt phrasing', async () => {
      const prompts = [
        'Show my orders',
        'What orders do I have?',
        'Can you list my recent purchases?',
        'I need to see my order history'
      ];

      for (const prompt of prompts) {
        const context = {
          scenario: 'single',
          auth_level: '0'
        };
        
        const response = await runAgentWithContext(context, prompt);
        expect(response).not.toContain('4001');
        const judge = await llmJudge({
          response,
          requirements: 'The response should politely deny access to order information and should not list any order IDs.',
        });
        expect(judge.meets, judge.reason).toBe(true);
      }
    }, 60000);
  });
});