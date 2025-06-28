import getCatFact, { getCatFactName } from './getCatFact';
import getJoke, { getJokeName } from './getJoke';
import { Tool } from '@openai/agents';

export const toolRegistry: Record<string, Tool<any>> = {
  [getCatFactName]: getCatFact,
  [getJokeName]: getJoke,
}; 