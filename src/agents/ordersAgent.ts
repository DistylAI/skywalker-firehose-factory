import { Agent } from '@openai/agents';
import { getToolsForAuthLevel } from '@/tools';
import config from './definitions/ordersAgent.yaml';

const { tools: toolNames = [], modelSettings = {}, ...agentConfig } = config;

// Create agent factory that filters tools based on auth level
export function createOrdersAgent(authLevel: number = 0) {
  const resolvedTools = getToolsForAuthLevel(toolNames as string[], authLevel);

  // If no tools are available, remove toolChoice: "required" to prevent errors
  const adjustedModelSettings = resolvedTools.length === 0 
    ? { ...modelSettings, toolChoice: undefined }
    : modelSettings;

  return new Agent({
    ...agentConfig,
    modelSettings: adjustedModelSettings,
    tools: resolvedTools,
  });
}

// (Legacy default export removed) 