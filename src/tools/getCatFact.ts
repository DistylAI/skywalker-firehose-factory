import { tool } from '@openai/agents';
import { z } from 'zod';
import getCatFactExecute from './executions/getCatFactExecute';

export const getCatFactName = 'get_cat_fact';

const getCatFactTool = tool({
  name: getCatFactName,
  description: 'Return a fun cat fact (same every time).',
  parameters: z.object({}),
  execute: getCatFactExecute,
});

// Export the tool with auth level metadata
export const getCatFact = {
  tool: getCatFactTool,
  requiredAuthLevel: 0,
};

export default getCatFact; 