import './openai-polyfill';
import '@/lib/openai'; // Ensure OpenAI client (with Portkey proxy & logging) is initialised early
import { run, user as userMessage, assistant as assistantMessage } from '@openai/agents';
import { NextRequest } from 'next/server';
import { createAssistantAgent } from '@/agents/assistantAgent';

export const runtime = 'edge';

interface IncomingMessage {
  role: 'user' | 'assistant';
  parts?: Array<{
    text?: string;
  }>;
}

interface ChatRequestBody {
  messages?: IncomingMessage[];
  data?: {
    context?: any;
  };
}

export async function POST(req: NextRequest): Promise<Response> {
  const { messages = [], data }: ChatRequestBody = await req.json();

  const context = data?.context ?? { scenario: 'default' };

  const historyItems = (messages as IncomingMessage[])
    .filter((m) => m?.parts?.[0]?.text)
    .map((m) => {
      const text = m.parts![0].text as string;
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
            const chunk = encoder.encode(ev.data.delta as string);
            controller.enqueue(chunk);
          }
        }
      } catch (error: any) {
        if (error.constructor.name === 'InputGuardrailTripwireTriggered') {
          const errorMessage = error.guardrailResults?.[0]?.output?.outputInfo?.errorMessage || '[[ error unsupported language ]]';
          controller.enqueue(encoder.encode(errorMessage));
        } else {
          console.error('Stream error:', error);
          controller.enqueue(encoder.encode('An error occurred while processing your request.'));
        }
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