import { Agent } from '@openai/agents';
import { toolRegistry } from '@/tools';
import config from './definitions/jokeAgent.yaml';

const { tools: toolNames = [], ...agentConfig } = config as any;

const resolvedTools = (toolNames as string[]).map((n) => toolRegistry[n]).filter(Boolean);

const jokeAgent = new Agent({
  ...agentConfig,
  tools: resolvedTools,
});

export default jokeAgent; 