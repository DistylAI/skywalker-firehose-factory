import getOrders, { getOrdersName } from './getOrders';
import getJoke, { getJokeName } from './getJoke';
import getCatFact, { getCatFactName } from './getCatFact';
import detectLanguage, { detectLanguageName } from './detectLanguage';

// Tool registry with auth level metadata
export const toolRegistry: Record<string, any> = {
  [getOrdersName]: getOrders,
  [getJokeName]: getJoke,
  [getCatFactName]: getCatFact,
  [detectLanguageName]: detectLanguage,
};

// Get tools filtered by auth level
export function getToolsForAuthLevel(toolNames: string[], authLevel: number = 0) {
  return toolNames
    .map((name) => {
      const toolWrapper = toolRegistry[name];
      if (!toolWrapper) return null;
      
      // Check if the user has sufficient auth level
      const requiredLevel = toolWrapper.requiredAuthLevel || 0;
      if (authLevel >= requiredLevel) {
        return toolWrapper.tool;
      }
      return null;
    })
    .filter(Boolean);
} 