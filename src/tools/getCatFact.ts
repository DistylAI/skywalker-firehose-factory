import { tool } from '@openai/agents';
import { z } from 'zod';

const getCatFact = tool({
  name: 'get_cat_fact',
  description: 'Return a fun cat fact (same every time).',
  parameters: z.object({}),
  async execute() {
    return 'Cats sleep for around 70% of their lives.';
  },
});

export default getCatFact; 