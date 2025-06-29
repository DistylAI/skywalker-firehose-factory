import { tool } from '@openai/agents';
import { z } from 'zod';
import { detectLanguageExecute } from './executions/detectLanguageExecute';

export const detectLanguageName = 'detectLanguage';

const detectLanguageTool = tool({
  name: detectLanguageName,
  description: 'Detects the language of the given text and returns an ISO 639-1 language code',
  parameters: z.object({
    text: z.string().describe('The text to detect the language of'),
  }),
  execute: detectLanguageExecute,
});

// Export the tool with auth level metadata
export const detectLanguage = {
  tool: detectLanguageTool,
  requiredAuthLevel: 0,
};

export default detectLanguage; 