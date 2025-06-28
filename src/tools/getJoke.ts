import { tool } from '@openai/agents';
import { z } from 'zod';
import getJokeExecute from './executions/getJokeExecute';

export const getJokeName = 'get_joke';

const getJoke = tool({
  name: getJokeName,
  description: 'Return a timeless classic joke (same every time).',
  parameters: z.object({}),
  execute: getJokeExecute,
});

export default getJoke; 