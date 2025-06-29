import 'dotenv/config';
import { vi } from 'vitest';
import getOrdersExecute from './src/tools/executions/getOrdersExecute';
import { getOrdersName } from './src/tools/getOrders';
import './src/lib/openai'; // Initialise OpenAI client with Portkey proxy & logging for tests

// Mock the @openai/agents module so that its `run` method executes the
// `get_orders` tool locally for tests, removing the need to hit the OpenAI
// service and ensuring deterministic output.

vi.mock('@openai/agents', async () => {
  // Import the real module (ESM) so we can forward all other exports.
  const actual: any = await vi.importActual('@openai/agents');

  // Our wrapped implementation.
  async function patchedRun(agent: any, history: any[], options: any = {}) {
    const idx = history.findIndex(
      (e) =>
        e?.type === 'function_call' &&
        e.status === 'in_progress' &&
        e.name === getOrdersName,
    );

    if (idx !== -1) {
      const pending = history[idx];
      try {
        const args = JSON.parse(pending.arguments ?? '{}');
        const result = await getOrdersExecute(args);

        history.splice(idx, 1, // replace pending item and add result right after
          { ...pending, status: 'completed' },
          {
            type: 'function_call_result',
            id: `${pending.callId}-result`,
            call_id: pending.callId,
            name: pending.name,
            output: { type: 'text', text: JSON.stringify(result) },
            status: 'completed',
          },
        );
      } catch (err) {
        console.error('Local tool execution failed:', err);
      }
    }

    // Call the original implementation to complete the run.
    return actual.run(agent, history, options);
  }

  return { ...actual, run: patchedRun };
});