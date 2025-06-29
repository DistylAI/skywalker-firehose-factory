import { tool } from '@openai/agents';
import { z } from 'zod';
import getJokeExecute from './executions/getJokeExecute';

export const getJokeName = 'get_joke';

const getJokeTool = tool({
  name: getJokeName,
  description: 'Return a timeless classic joke (same every time).',
  parameters: z.object({}),
  execute: getJokeExecute,
});

// Export the tool with auth level metadata
export const getJoke = {
  tool: getJokeTool,
  requiredAuthLevel: 0,
};

export default getJoke; 