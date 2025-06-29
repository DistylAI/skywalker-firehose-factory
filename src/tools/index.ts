import getOrders, { getOrdersName } from './getOrders';
import getJoke, { getJokeName } from './getJoke';
import getCatFact, { getCatFactName } from './getCatFact';
import detectLanguage, { detectLanguageName } from './detectLanguage';

interface ToolWrapper {
  tool: unknown;
  requiredAuthLevel: number;
}

export const toolRegistry: Record<string, ToolWrapper> = {
  [getOrdersName]: getOrders,
  [getJokeName]: getJoke,
  [getCatFactName]: getCatFact,
  [detectLanguageName]: detectLanguage,
};

export function getToolsForAuthLevel(toolNames: string[], authLevel: number = 0) {
  return toolNames
    .map((name) => {
      const toolWrapper = toolRegistry[name];
      if (!toolWrapper) return null;
      const requiredLevel = toolWrapper.requiredAuthLevel || 0;
      if (authLevel >= requiredLevel) {
        return toolWrapper.tool;
      }
      return null;
    })
    .filter(Boolean);
} 