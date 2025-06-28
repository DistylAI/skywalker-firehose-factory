import './openai-polyfill';
import { Agent, run, user as userMessage, assistant as assistantMessage, tool } from '@openai/agents';
import { NextRequest } from 'next/server';
import { z } from 'zod';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  const historyItems = Array.isArray(messages)
    ? messages
        .filter((m: any) => m?.parts?.[0]?.text)
        .map((m: any) => {
          const text = m.parts[0].text as string;
          return m.role === 'user' ? userMessage(text) : assistantMessage(text);
        })
    : [];

  // --- Tools ---
  const catFactTool = tool({
    name: 'get_cat_fact',
    description: 'Return a fun cat fact (same every time).',
    parameters: z.object({}),
    execute: async () => {
      // eslint-disable-next-line no-console
      console.log('[chat-route] get_cat_fact tool invoked');
      const fact = 'Cats sleep for around 70% of their lives.';
      // eslint-disable-next-line no-console
      console.log('[chat-route] get_cat_fact result', fact);
      return fact;
    },
  });

  const jokeTool = tool({
    name: 'get_joke',
    description: 'Return a timeless classic joke (same every time).',
    parameters: z.object({}),
    execute: async () => {
      // eslint-disable-next-line no-console
      console.log('[chat-route] get_joke tool invoked');
      const joke =
        "Why don't scientists trust atoms? Because they make up everything! ";
      // eslint-disable-next-line no-console
      console.log('[chat-route] get_joke result', joke);
      return joke;
    },
  });

  // --- Specialized Agents ---
  const catAgent = new Agent({
    name: 'Cat Facts Agent',
    instructions: 'You are an expert on cat facts. Provide interesting cat facts when asked.',
    handoffDescription:
      'Use this agent when the user asks for information or fun facts about cats.',
    tools: [catFactTool],
    modelSettings: { toolChoice: 'required' },
  });

  const jokeAgent = new Agent({
    name: 'Joke Agent',
    instructions: 'You are a comedian. Tell short, humorous jokes when requested.',
    handoffDescription:
      'Use this agent for user requests related to jokes, humor, or something funny.',
    tools: [jokeTool],
    modelSettings: { toolChoice: 'required' },
  });

  // --- Parent Agent that can delegate ---
  const agent = Agent.create({
    name: 'Assistant',
    instructions:
      `You are a helpful assistant. 
If the user requests:
  • A joke or something funny – immediately hand off to the "Joke Agent".
  • Cat facts or anything about cats – immediately hand off to the "Cat Facts Agent".
Do NOT answer these requests yourself; always hand off. For all other topics respond normally.`,
    handoffs: [catAgent, jokeAgent],
  });

  const streamed = await run(agent, historyItems as any, { stream: true });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const ev of streamed) {
          // Log when the agent switches (delegation to another agent)
          if (ev.type === 'agent_updated_stream_event') {
            // eslint-disable-next-line no-console
            console.log(
              `[chat-route] Delegated to agent: ${(ev as any).agent?.name ?? 'unknown'}`,
            );
          }

          // Log handoff-related run items
          if (ev.type === 'run_item_stream_event') {
            const itemType = (ev as any).item?.type;
            if (
              itemType === 'handoff_call_item' ||
              itemType === 'handoff_output_item'
            ) {
              // eslint-disable-next-line no-console
              console.log(`[chat-route] Handoff event: ${itemType}`);
            }
          }

          // Continue streaming tokens as before
          if (
            ev.type === 'raw_model_stream_event' &&
            ev.data.type === 'output_text_delta'
          ) {
            const token = ev.data.delta as string;
            controller.enqueue(encoder.encode(token));
          }
        }
      } catch (e) {
        controller.error(e);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  });
} 