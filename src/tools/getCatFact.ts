import { tool } from '@openai/agents';
import { z } from 'zod';
import getCatFactExecute from './executions/getCatFactExecute';

export const getCatFactName = 'get_cat_fact';

const getCatFact = tool({
  name: getCatFactName,
  description: 'Return a fun cat fact (same every time).',
  parameters: z.object({}),
  execute: getCatFactExecute,
});

export default getCatFact; 