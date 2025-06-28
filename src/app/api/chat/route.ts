import './openai-polyfill';
import { run, user as userMessage, assistant as assistantMessage } from '@openai/agents';
import { NextRequest } from 'next/server';
import assistantAgent from '@/agents/assistantAgent';

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

  // The assistantAgent already encapsulates the hand-off logic and specialized agents.
  const agent = assistantAgent;

  const streamed = await run(agent, historyItems as any, { stream: true });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const ev of streamed) {
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