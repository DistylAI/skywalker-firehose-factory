import getOrders, { getOrdersName } from './getOrders';
import getJoke, { getJokeName } from './getJoke';

export const toolRegistry = {
  [getOrdersName]: getOrders,
  [getJokeName]: getJoke,
}; 