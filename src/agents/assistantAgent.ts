import { Agent } from '@openai/agents';
import { createOrdersAgent } from './ordersAgent';
import { createJokeAgent } from './jokeAgent';
import ordersConfig from './definitions/ordersAgent.yaml';
import jokeConfig from './definitions/jokeAgent.yaml';
import config from './definitions/assistantAgent.yaml';

interface Context {
  auth_level?: string;
  [key: string]: any;
}

interface AgentConfig {
  requiredAuthLevel?: number;
  instructions?: string;
  [key: string]: any;
}

// Create assistant agent with dynamically created handoffs based on auth level
export function createAssistantAgent(context: Context): Agent {
  const userAuthLevel = parseInt(context.auth_level || '0', 10);
  
  // Only include handoffs where user meets the required auth level
  const handoffs = [];
  const availableHandoffRules: string[] = [];
  
  // Check joke agent auth requirement
  const jokeRequiredLevel = (jokeConfig as AgentConfig).requiredAuthLevel || 0;
  if (userAuthLevel >= jokeRequiredLevel) {
    handoffs.push(createJokeAgent(userAuthLevel));
    availableHandoffRules.push('- **Jokes or anything funny** → Hand off to the **"Joke Agent"**.');
  }
  
  // Check orders agent auth requirement
  const ordersRequiredLevel = (ordersConfig as AgentConfig).requiredAuthLevel || 0;
  if (userAuthLevel >= ordersRequiredLevel) {
    handoffs.push(createOrdersAgent(userAuthLevel));
    availableHandoffRules.push('- **Orders or order information** → Hand off to the **"Orders Agent"**.');
  }

  // Dynamically update instructions based on available handoffs
  let instructions = `## Role

You are a helpful AI assistant ready to tackle a wide range of user requests.`;

  if (availableHandoffRules.length > 0) {
    instructions += `

### Hand-off rules

${availableHandoffRules.join('\n')}

> **Important:** Do **not** answer these requests yourself – always perform a hand-off. For any other topic, respond normally.`;
  }
  
  // Add specific handling for unavailable services
  if (userAuthLevel < ordersRequiredLevel) {
    instructions += `

### Access Restrictions

- If asked about orders or order information, politely inform the user that you don't have access to order information.`;
  }

  return Agent.create({
    ...config,
    instructions,
    handoffs,
  });
}

// Export a default agent instance for backwards compatibility
const assistantAgent = Agent.create({
  ...config,
  handoffs: [
    createOrdersAgent(0),
    createJokeAgent(0),
  ],
});

export default assistantAgent; 