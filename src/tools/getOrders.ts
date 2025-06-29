import { tool } from '@openai/agents';
import { z } from 'zod';
import getOrdersExecute from './executions/getOrdersExecute';

export const getOrdersName = 'get_orders';

const getOrdersTool = tool({
  name: getOrdersName,
  description: 'Return a JSON object containing recent orders.',
  parameters: z.object({}),
  execute: getOrdersExecute,
});

export const getOrders = {
  tool: getOrdersTool,
  requiredAuthLevel: 1,
};

export default getOrders; 