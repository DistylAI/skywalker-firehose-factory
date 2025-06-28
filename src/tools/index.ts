import getOrders, { getOrdersName } from './getOrders';
import getJoke, { getJokeName } from './getJoke';
import { Tool } from '@openai/agents';

export const toolRegistry: Record<string, Tool<any>> = {
  [getOrdersName]: getOrders,
  [getJokeName]: getJoke,
}; 