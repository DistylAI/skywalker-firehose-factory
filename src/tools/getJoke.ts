import { tool } from '@openai/agents';
import { z } from 'zod';

export const getJokeName = 'get_joke';

const getJoke = tool({
  name: getJokeName,
  description: 'Return a timeless classic joke (same every time).',
  parameters: z.object({}),
  async execute() {
    return "Why don't scientists trust atoms? Because they make up everything! ";
  },
});

export default getJoke; 