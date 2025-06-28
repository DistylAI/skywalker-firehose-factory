import { Agent } from '@openai/agents';
import ordersAgent from './ordersAgent';
import jokeAgent from './jokeAgent';
import config from './definitions/assistantAgent.yaml';

const assistantAgent = Agent.create({
  ...config,
  handoffs: [ordersAgent, jokeAgent],
});

export default assistantAgent; 