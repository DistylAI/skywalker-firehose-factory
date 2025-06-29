import { describe, expect, it } from 'vitest';
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

async function expectGuardrailToBlock(context: any, prompt: string, expectedLanguage: string): Promise<void> {
  const history = [userMessage(prompt)];
  const agent = createAssistantAgent(context);
  
  try {
    const streamed = await run(agent, history, { 
      stream: true,
      context: context
    });
    
    // If we get here without an error, the guardrail didn't trigger
    // Consume the stream to see what we got
    let response = '';
    for await (const ev of streamed) {
      if (
        ev.type === 'raw_model_stream_event' &&
        ev.data.type === 'output_text_delta'
      ) {
        response += ev.data.delta as string;
      }
    }
    
    throw new Error(`Expected guardrail to block ${expectedLanguage} text, but got response: ${response}`);
  } catch (error: any) {
    // Verify it's the correct guardrail error
    expect(error.message).toMatch(/Input guardrail triggered/);
    
    // Check the guardrail result details
    if (error.result?.output?.outputInfo) {
      expect(error.result.output.outputInfo.isAllowed).toBe(false);
      expect(error.result.output.outputInfo.detectedLanguage).toBe(expectedLanguage);
      expect(error.result.output.outputInfo.errorMessage).toBe('[[ error unsupported language ]]');
    }
  }
}

describe('Language Guardrail Integration Tests', () => {
  const context = { auth_level: '0' };

  describe('Supported Languages (should get normal responses)', () => {
    it('should allow English text and provide a helpful response', async () => {
      const response = await runAgentWithContext(context, 'Hello, how are you today?');
      
      const evaluation = await llmJudge({
        response,
        requirements: 'The response should be helpful, polite, and in English. It should not contain any error messages.'
      });
      
      expect(evaluation.meets).toBe(true);
    });

    it('should allow Spanish text and provide a helpful response', async () => {
      const response = await runAgentWithContext(context, 'Hola, ¿cómo estás hoy?');
      
      const evaluation = await llmJudge({
        response,
        requirements: 'The response should be helpful and polite. It should not contain any error messages about unsupported language.'
      });
      
      expect(evaluation.meets).toBe(true);
    });

    it('should handle mixed English/Spanish text', async () => {
      const prompt = 'Hello, I need help. Por favor, ayúdame.';
      const response = await runAgentWithContext(context, prompt);
      
      const evaluation = await llmJudge({
        response,
        requirements: 'The response should be helpful and address the mixed language request. It should not contain error messages.'
      });
      
      expect(evaluation.meets).toBe(true);
    });
  });

  describe('Unsupported Languages (should be blocked)', () => {
    it('should reject French text with appropriate error message', async () => {
      await expectGuardrailToBlock(context, 'Bonjour, comment allez-vous?', 'fr');
    });

    it('should reject German text with appropriate error message', async () => {
      await expectGuardrailToBlock(context, 'Guten Tag, wie geht es Ihnen?', 'de');
    });

    it('should reject Chinese text with appropriate error message', async () => {
      await expectGuardrailToBlock(context, '你好，你今天好吗？', 'zh');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty text gracefully', async () => {
      // Empty text returns 'unknown' language which we allow through
      const response = await runAgentWithContext(context, '');
      
      const evaluation = await llmJudge({
        response,
        requirements: 'The response should handle the empty input gracefully, either by asking for clarification or providing a generic greeting.'
      });
      
      expect(evaluation.meets).toBe(true);
    });

    it('should handle very short text', async () => {
      const response = await runAgentWithContext(context, 'Hi');
      
      const evaluation = await llmJudge({
        response,
        requirements: 'The response should be a polite greeting in response to "Hi". It should not contain error messages.'
      });
      
      expect(evaluation.meets).toBe(true);
    });
  });
}); 