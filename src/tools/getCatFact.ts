import { tool } from '@openai/agents';
import { z } from 'zod';

export const getCatFactName = 'get_cat_fact';

const getCatFact = tool({
  name: getCatFactName,
  description: 'Return a fun cat fact (same every time).',
  parameters: z.object({}),
  async execute() {
    return 'Cats sleep for around 70% of their lives.';
  },
});

export default getCatFact; 