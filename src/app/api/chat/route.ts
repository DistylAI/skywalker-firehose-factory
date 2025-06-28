import './openai-polyfill';
import { run, user as userMessage, assistant as assistantMessage } from '@openai/agents';
import { NextRequest } from 'next/server';
import { createAssistantAgent } from '@/agents/assistantAgent';

export const runtime = 'edge';

interface IncomingMessage {
  id: string;
  role: 'user' | 'assistant' | string;
  parts: Array<{ type: string; text?: string }>;
}

interface ChatRequestBody {
  messages?: IncomingMessage[];
  data?: {
    context?: Record<string, unknown>;
  };
}

export async function POST(req: NextRequest): Promise<Response> {
  const { messages = [], data }: ChatRequestBody = await req.json();

  const context = data?.context ?? { scenario: 'default' };

  const historyItems = (messages as IncomingMessage[])
    .filter((m) => m?.parts?.[0]?.text)
    .map((m) => {
      const text = m.parts[0].text as string;
      return m.role === 'user' ? userMessage(text) : assistantMessage(text);
    });

  const agent = createAssistantAgent(context);

  const streamed = await run(agent, historyItems, { stream: true, context });

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