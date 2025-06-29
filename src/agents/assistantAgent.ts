import { Agent } from '@openai/agents';
import { createOrdersAgent } from './ordersAgent';
import { createJokeAgent } from './jokeAgent';
import ordersConfig from './definitions/ordersAgent.yaml';
import jokeConfig from './definitions/jokeAgent.yaml';
import config from './definitions/assistantAgent.yaml';
import { sdkLanguageGuardrail } from '../guardrails/languageGuardrail';

interface Context {
  /** Authentication level provided by the client (e.g. "0", "1"). */
  auth_level?: string;
  /** Scenario identifier used by the demo UI (e.g. "default", "cancelled"). */
  scenario?: string;
}

interface AgentConfig {
  /** Human-readable agent name. */
  name: string;
  /** Minimum auth level required to access this agent. */
  requiredAuthLevel?: number;
  /** System instructions for the agent. */
  instructions?: string;
  /** Description shown to the parent assistant when deciding hand-offs. */
  handoffDescription?: string;
  /** Additional optional settings coming from YAML (ignored here). */
  modelSettings?: Record<string, unknown>;
  tools?: string[];
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
    config: AgentConfig;
  }> = [
    {
      createAgent: createJokeAgent,
      config: jokeConfig as AgentConfig,
    },
    {
      createAgent: createOrdersAgent,
      config: ordersConfig as AgentConfig,
    },
  ];

  const handoffs: Agent[] = [];
  const availableHandoffRules: string[] = [];
  const unavailableAgents: Array<{
    name: string;
    requiredAuthLevel: number;
    handoffDescription?: string;
  }> = [];

  childAgents.forEach(({ createAgent, config: childConfig }) => {
    const requiredLevel = childConfig.requiredAuthLevel || 0;

    if (userAuthLevel >= requiredLevel) {
      handoffs.push(createAgent(userAuthLevel));

      if (childConfig.handoffDescription) {
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
      unavailableAgents.push({
        name: childConfig.name,
        requiredAuthLevel: requiredLevel,
        handoffDescription: childConfig.handoffDescription,
      });
    }
  });

  let instructions = `## Role\n\nYou are a helpful AI assistant ready to tackle a wide range of user requests.`;

  if (availableHandoffRules.length > 0) {
    instructions += `\n\n### Hand-off rules\n\n${availableHandoffRules.join('\n')}\n\n> **Important:** Do **not** answer these requests yourself – always perform a hand-off. For any other topic, respond normally.`;
  }

  if (unavailableAgents.length > 0) {
    instructions += `\n\n### Access Restrictions`;

    unavailableAgents.forEach(({ name, handoffDescription }) => {
      let topic = name;
      if (handoffDescription) {
        const firstBullet = handoffDescription
          .split('\n')
          .find((line) => line.trim().startsWith('-'));
        if (firstBullet) {
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