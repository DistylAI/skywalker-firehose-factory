import { Agent } from '@openai/agents';
import { createOrdersAgent } from './ordersAgent';
import { createJokeAgent } from './jokeAgent';
import ordersConfig from './definitions/ordersAgent.yaml';
import jokeConfig from './definitions/jokeAgent.yaml';
import config from './definitions/assistantAgent.yaml';
import { sdkLanguageGuardrail } from '../guardrails/languageGuardrail';

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
export function createAssistantAgent(context: Context) {
  const userAuthLevel = parseInt(context.auth_level || '0', 10);

  /**
   * Registry of all known child agents.
   *
   * If you add a new agent to the project, simply import its `create` factory
   * and YAML config below – no additional changes to the logic are required.
   */
  const childAgents: Array<{
    createAgent: (authLevel: number) => Agent;
    config: AgentConfig & { name: string; handoffDescription?: string };
  }> = [
    {
      createAgent: createJokeAgent,
      config: jokeConfig as AgentConfig & { name: string; handoffDescription?: string },
    },
    {
      createAgent: createOrdersAgent,
      config: ordersConfig as AgentConfig & { name: string; handoffDescription?: string },
    },
  ];

  const handoffs: Agent[] = [];
  const availableHandoffRules: string[] = [];
  const unavailableAgents: Array<{
    name: string;
    requiredAuthLevel: number;
    handoffDescription?: string;
  }> = [];

  // Iterate over the registry and compose hand-offs that match the user's auth level
  childAgents.forEach(({ createAgent, config: childConfig }) => {
    const requiredLevel = childConfig.requiredAuthLevel || 0;

    if (userAuthLevel >= requiredLevel) {
      // User is authorised – enable hand-off
      handoffs.push(createAgent(userAuthLevel));

      // Prefer a concise bullet if provided in the YAML (handoffDescription)
      if (childConfig.handoffDescription) {
        // Extract the first bullet or sentence to keep instructions short
        const firstLine = childConfig.handoffDescription
          .split('\n')
          .find((line) => line.trim().startsWith('-'))?.trim();

        if (firstLine) {
          availableHandoffRules.push(`${firstLine} → Hand off to the **"${childConfig.name}"**.`);
        } else {
          availableHandoffRules.push(`- **${childConfig.name} related request** → Hand off to the **"${childConfig.name}"**.`);
        }
      } else {
        availableHandoffRules.push(`- **${childConfig.name} related request** → Hand off to the **"${childConfig.name}"**.`);
      }
    } else {
      // Not authorised – store info so we can mention restriction later on
      unavailableAgents.push({
        name: childConfig.name,
        requiredAuthLevel: requiredLevel,
        handoffDescription: childConfig.handoffDescription,
      });
    }
  });

  // Build the assistant instructions
  let instructions = `## Role\n\nYou are a helpful AI assistant ready to tackle a wide range of user requests.`;

  if (availableHandoffRules.length > 0) {
    instructions += `\n\n### Hand-off rules\n\n${availableHandoffRules.join('\n')}\n\n> **Important:** Do **not** answer these requests yourself – always perform a hand-off. For any other topic, respond normally.`;
  }

  if (unavailableAgents.length > 0) {
    instructions += `\n\n### Access Restrictions`;

    unavailableAgents.forEach(({ name, handoffDescription }) => {
      // Attempt to craft a user-friendly topic description based on the first bullet of handoffDescription
      let topic = name;
      if (handoffDescription) {
        const firstBullet = handoffDescription
          .split('\n')
          .find((line) => line.trim().startsWith('-'));
        if (firstBullet) {
          // Remove the leading dash for cleaner output
          topic = firstBullet.replace(/^-\s*/, '').trim();
        }
      }

      instructions += `\n\n- If asked about ${topic}, politely inform the user that you don't have access to that information.`;
    });
  }

  return new Agent({
    name: config.name,
    instructions,
    handoffs,
    inputGuardrails: [sdkLanguageGuardrail],
  });
} 