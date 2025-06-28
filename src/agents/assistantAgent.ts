import { Agent } from '@openai/agents';
import catAgent from './catAgent';
import jokeAgent from './jokeAgent';
import config from './definitions/assistantAgent.yaml';

const assistantAgent = Agent.create({
  ...config,
  handoffs: [catAgent, jokeAgent],
});

export default assistantAgent; 