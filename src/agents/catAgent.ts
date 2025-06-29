import { Agent } from '@openai/agents';
import { getToolsForAuthLevel } from '@/tools';
import config from './definitions/catAgent.yaml';

const { tools: toolNames = [], ...agentConfig } = config;

// Create agent factory that filters tools based on auth level
export function createCatAgent(authLevel: number = 0) {
  const resolvedTools = getToolsForAuthLevel(toolNames as string[], authLevel);

  return new Agent({
    ...agentConfig,
    tools: resolvedTools,
  });
}

// Default export for backwards compatibility
const catAgent = new Agent({
  ...agentConfig,
  tools: getToolsForAuthLevel(toolNames as string[], 0),
});

export default catAgent; 