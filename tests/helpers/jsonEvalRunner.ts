import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { run, user as userMessage, assistant as assistantMessage } from '@openai/agents';
import { createAssistantAgent } from '../../src/agents/assistantAgent';
import { llmJudge } from './llmJudge';
import { z } from 'zod';

// Schema for conversation message
const ConversationMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string()
});

// Schema for eval definition validation
const EvalDefinitionSchema = z.object({
  name: z.string(),
  context: z.record(z.any()).optional(),
  input: z.union([
    z.string(), // Backward compatibility - single user input
    z.array(ConversationMessageSchema).min(1) // Multi-turn conversation
  ]),
  assertions: z.array(z.object({
    type: z.enum(['contains', 'not_contains', 'llm_judge', 'exact_match', 'regex']),
    value: z.string(),
    description: z.string().optional()
  })).min(1),
  tags: z.array(z.string()).optional()
});

export type EvalDefinition = z.infer<typeof EvalDefinitionSchema>;

export interface EvalResult {
  name: string;
  passed: boolean;
  response?: string;
  assertionResults: Array<{
    type: string;
    description?: string;
    passed: boolean;
    error?: string;
  }>;
  error?: string;
  tags?: string[];
}

export async function runAgentWithContext(context: any, input: string | Array<{role: 'user' | 'assistant', content: string}>): Promise<string> {
  let history: any[];
  
  // Handle both single input (backward compatibility) and multi-turn conversation
  if (typeof input === 'string') {
    // Single user input - backward compatibility
    history = [userMessage(input)];
  } else {
    // Multi-turn conversation - convert to agent message format
    history = input.map(msg => {
      if (msg.role === 'user') {
        return userMessage(msg.content);
      } else {
        // For assistant messages, use the assistantMessage function
        return assistantMessage(msg.content);
      }
    });
  }
  
  // Create agent with the specific context
  const agent = createAssistantAgent(context);
  
  try {
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
  } catch (error) {
    // Handle guardrail exceptions
    if (error instanceof Error && error.message.includes('Input guardrail triggered:')) {
      // Extract the guardrail result from the error message
      const match = error.message.match(/Input guardrail triggered: (.+)$/);
      if (match) {
        try {
          const guardrailResult = JSON.parse(match[1]);
          if (guardrailResult.errorMessage) {
            return guardrailResult.errorMessage;
          }
        } catch (parseError) {
          // If we can't parse the guardrail result, fall back to the raw error
        }
      }
    }
    
    // Re-throw other errors
    throw error;
  }
}

async function runAssertion(assertion: EvalDefinition['assertions'][0], response: string): Promise<{ passed: boolean; error?: string }> {
  try {
    switch (assertion.type) {
      case 'contains':
        return { passed: response.includes(assertion.value) };
      
      case 'not_contains':
        return { passed: !response.includes(assertion.value) };
      
      case 'exact_match':
        return { passed: response === assertion.value };
      
      case 'regex':
        const regex = new RegExp(assertion.value);
        return { passed: regex.test(response) };
      
      case 'llm_judge':
        const judgeResult = await llmJudge({
          response,
          requirements: assertion.value
        });
        return { 
          passed: judgeResult.meets,
          error: judgeResult.meets ? undefined : judgeResult.reason
        };
      
      default:
        return { passed: false, error: `Unknown assertion type: ${assertion.type}` };
    }
  } catch (error) {
    return { passed: false, error: `Assertion failed: ${error}` };
  }
}

export async function runJsonEval(evalDef: EvalDefinition): Promise<EvalResult> {
  try {
    // Run the agent with the provided context and input
    const response = await runAgentWithContext(evalDef.context || {}, evalDef.input);
    
    // Run all assertions
    const assertionResults = [];
    let allPassed = true;
    
    for (const assertion of evalDef.assertions) {
      const result = await runAssertion(assertion, response);
      assertionResults.push({
        type: assertion.type,
        description: assertion.description,
        passed: result.passed,
        error: result.error
      });
      
      if (!result.passed) {
        allPassed = false;
      }
    }
    
    return {
      name: evalDef.name,
      passed: allPassed,
      response,
      assertionResults,
      tags: evalDef.tags
    };
  } catch (error) {
    return {
      name: evalDef.name,
      passed: false,
      assertionResults: [],
      error: `Eval execution failed: ${error}`,
      tags: evalDef.tags
    };
  }
}

export function loadJsonEval(filePath: string): EvalDefinition {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(content);
    return EvalDefinitionSchema.parse(parsed);
  } catch (error) {
    throw new Error(`Failed to load eval from ${filePath}: ${error}`);
  }
}

export function loadAllJsonEvals(evalDir: string): EvalDefinition[] {
  const evals: EvalDefinition[] = [];
  
  try {
    const files = readdirSync(evalDir);
    
    for (const file of files) {
      if (file.endsWith('.json') && file !== 'schema.json') {
        const filePath = join(evalDir, file);
        try {
          const evalDef = loadJsonEval(filePath);
          evals.push(evalDef);
        } catch (error) {
          console.warn(`Warning: Failed to load eval from ${file}: ${error}`);
        }
      }
    }
  } catch (error) {
    console.warn(`Warning: Failed to read eval directory ${evalDir}: ${error}`);
  }
  
  return evals;
}

export async function runAllJsonEvals(evalDir: string): Promise<EvalResult[]> {
  const evals = loadAllJsonEvals(evalDir);
  const results: EvalResult[] = [];
  
  for (const evalDef of evals) {
    console.log(`Running eval: ${evalDef.name}`);
    const result = await runJsonEval(evalDef);
    results.push(result);
    
    if (result.passed) {
      console.log(`✅ ${evalDef.name}`);
    } else {
      console.log(`❌ ${evalDef.name}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      for (const assertion of result.assertionResults) {
        if (!assertion.passed) {
          console.log(`   Failed assertion (${assertion.type}): ${assertion.description || 'No description'}`);
          if (assertion.error) {
            console.log(`   Reason: ${assertion.error}`);
          }
        }
      }
    }
  }
  
  return results;
}