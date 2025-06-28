import { tool } from '@openai/agents';
import { z } from 'zod';

const getJoke = tool({
  name: 'get_joke',
  description: 'Return a timeless classic joke (same every time).',
  parameters: z.object({}),
  async execute() {
    return "Why don't scientists trust atoms? Because they make up everything! ";
  },
});

export default getJoke; 