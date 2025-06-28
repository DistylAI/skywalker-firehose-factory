import '../../../openai-polyfill';
import { Agent, run } from '@openai/agents';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  // Grab latest user text (AI SDK message format)
  const lastUserMessage = Array.isArray(messages)
    ? [...messages].reverse().find((m: any) => m.role === 'user')?.parts?.[0]?.text ?? ''
    : '';

  const agent = new Agent({
    name: 'Assistant',
    instructions: 'You are a helpful assistant.',
  });

  // Streamed run
  const streamed = await run(agent, lastUserMessage, { stream: true });

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
        // done - nothing for text protocol
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