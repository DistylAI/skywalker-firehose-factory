'use client';

import { useChat } from '@ai-sdk/react';
import type React from 'react';
import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import assistantConfig from '@/agents/definitions/assistantAgent.yaml';
import ordersConfig from '@/agents/definitions/ordersAgent.yaml';
import jokeConfig from '@/agents/definitions/jokeAgent.yaml';
import { Button } from "@/components/ui/button";
import { ArrowUp, ChevronDown, Square, RotateCcw } from "lucide-react";
import { ChatMessageList } from "@/components/ui/chat/chat-message-list";
import { ChatBubble, ChatBubbleMessage } from "@/components/ui/chat/chat-bubble";
import { ChatInput } from "@/components/ui/chat/chat-input";
import { cn } from "@/lib/utils";
import { OrderCard } from "@/components/ui/order-card";

enum Tab {
  Chat = 'chat',
  Docs = 'docs',
}

type ChatMessage = {
  id: string;
  role: string;
  parts: Array<{ type: string; text: string }>;
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.Chat);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    status,
    stop,
    setMessages,
  } = useChat({ streamProtocol: 'text' }) as any;

  // Ref to re-focus the input after submit
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scenario selection state
  const scenarios = [
    { label: "Cancelled Orders", value: "cancelled" },
    { label: "Multiple Item Orders", value: "multiple" },
    { label: "Single Item Orders", value: "single" },
    { label: "In-Transit Orders", value: "intranit" },
    { label: "Returned Orders", value: "returned" },
  ];

  const [scenario, setScenario] = useState<string>(scenarios[0].value);
  
  // Auth level state
  const [authLevel, setAuthLevel] = useState<string>("0");

  const handleSubmitAndFocus = (e: React.SyntheticEvent) => {
    handleSubmit(
      e,
      {
        data: {
          context: {
            scenario,
            auth_level: authLevel,
          },
        },
      },
    );

    setTimeout(() => inputRef.current?.focus(), 0);
  };

  // Reset chat by clearing messages and re-focusing the input
  const handleResetChat = () => {
    if (status === 'streaming' || status === 'submitted') {
      stop();
    }

    setMessages([]);

    setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <main className="flex flex-col h-screen max-w-4xl mx-auto bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background px-6 py-4">
        <h1 className="text-xl font-semibold text-foreground">Skywalker Firehose Factory</h1>

        <div className="mt-4 flex gap-8 text-sm font-medium">
          <button
            className={cn(
              "border-b-2 pb-2 transition-colors cursor-pointer",
              activeTab === Tab.Chat
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
            onClick={() => setActiveTab(Tab.Chat)}
          >
            Chat
          </button>
          <button
            className={cn(
              "border-b-2 pb-2 transition-colors cursor-pointer",
              activeTab === Tab.Docs
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
            onClick={() => setActiveTab(Tab.Docs)}
          >
            Documentation
          </button>
        </div>

        {activeTab === Tab.Chat && (
          <div className="mt-4 flex gap-4">
            <div className="flex flex-col gap-1 w-48">
              <label htmlFor="scenario" className="text-sm font-medium text-foreground">
                Scenario
              </label>
              <div className="relative">
                <select
                  id="scenario"
                  name="scenario"
                  value={scenario}
                  onChange={(e) => setScenario(e.target.value)}
                  className="appearance-none w-full border border-border rounded px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary pr-8"
                >
                  {scenarios.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute pointer-events-none right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            
            <div className="flex flex-col gap-1 w-32">
              <label htmlFor="auth_level" className="text-sm font-medium text-foreground">
                Auth Level
              </label>
              <div className="relative">
                <select
                  id="auth_level"
                  name="auth_level"
                  value={authLevel}
                  onChange={(e) => setAuthLevel(e.target.value)}
                  className="appearance-none w-full border border-border rounded px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary pr-8"
                >
                  <option value="0">0</option>
                  <option value="1">1</option>
                </select>
                <ChevronDown className="absolute pointer-events-none right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        )}
      </header>

      {activeTab === Tab.Chat ? (
        <div className="flex flex-col flex-1 min-h-0">
          {/* Message list */}
          <ChatMessageList className="flex-1 px-6 py-6 space-y-6" smooth>
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>Start a conversation...</p>
              </div>
            ) : (
              <>
                {messages.map((m: ChatMessage) => {
                  // Combine all text parts into a single string for easier processing
                  const textContent = m.parts
                    .filter((p: { type: string; text: string }) => p.type === "text")
                    .map((p) => p.text)
                    .join("\n");

                  // Helper to parse a bullet line like "• Order 1001 — Lightsaber (Qty 1) — shipped"
                  const parseOrderLine = (line: string) => {
                    const orderRegex = /•\s*Order\s*(\d+)\s*—\s*([^–]+)\s*\(Qty\s*(\d+)\)\s*—\s*(.*)/i;
                    const match = line.match(orderRegex);
                    if (!match) return undefined;
                    const [, id, item, quantity, status] = match;
                    return {
                      id,
                      customer: "", // customer name is not provided in bullet line
                      item: item.trim(),
                      quantity: Number(quantity),
                      status: status.trim(),
                    } as const;
                  };

                  // Split lines and separate into bullet lines/orders and other content
                  const lines = textContent.split(/\n+/);
                  const orderLines = lines.filter((l: string) => l.trim().startsWith("•"));
                  const orderCards = orderLines
                    .map(parseOrderLine)
                    .filter(Boolean) as Array<{
                      id: string;
                      customer: string;
                      item: string;
                      quantity: number;
                      status: string;
                    }>;

                  const nonOrderText = lines
                    .filter((l: string) => !l.trim().startsWith("•"))
                    .join("\n");

                  return (
                    <ChatBubble
                      key={m.id}
                      variant={m.role === "user" ? "sent" : "received"}
                      className="flex-col"
                    >
                      {nonOrderText && (
                        <ChatBubbleMessage
                          variant={
                            m.role === "user" ? "sent" : "received"
                          }
                        >
                          {nonOrderText}
                        </ChatBubbleMessage>
                      )}

                      {orderCards.length > 0 && (
                        <div className="flex flex-col gap-4 w-full">
                          {orderCards.map((order) => (
                            <OrderCard key={order.id} order={order} />
                          ))}
                        </div>
                      )}
                    </ChatBubble>
                  );
                })}
                {status !== 'ready' && messages[messages.length - 1]?.role === 'user' && (
                  <ChatBubble variant="received">
                    <ChatBubbleMessage variant="received" isLoading={true} />
                  </ChatBubble>
                )}
              </>
            )}
          </ChatMessageList>

          {/* Input */}
          <form
            onSubmit={handleSubmitAndFocus}
            className="flex gap-3 items-end border-t border-border bg-background px-6 py-4 flex-shrink-0"
          >
            <Button
              type="button"
              variant="outline"
              onClick={handleResetChat}
              className="w-[44px] h-[44px] p-0"
            >
              <RotateCcw className="h-5 w-5" />
            </Button>
            <ChatInput
              placeholder="Type your message…"
              value={input}
              onChange={handleInputChange}
              ref={inputRef}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  handleSubmitAndFocus(e);
                }
              }}
              className="flex-1 min-h-[44px] resize-none"
              autoFocus
            />
            <Button
              type={status === 'ready' ? 'submit' : 'button'}
              variant="outline"
              onClick={status === 'ready' ? undefined : stop}
              disabled={status !== 'ready' && status !== 'submitted' && status !== 'streaming'}
              className="w-[44px] h-[44px] p-0"
            >
              {status === 'ready' ? (
                <ArrowUp className="h-5 w-5" />
              ) : (
                <Square className="h-5 w-5" />
              )}
            </Button>
          </form>
        </div>
      ) : (
        <Documentation />
      )}
    </main>
  );
}

function Documentation() {
  const docs = [
    { title: 'Assistant', data: assistantConfig },
    { title: 'Orders Agent', data: ordersConfig },
    { title: 'Joke Agent', data: jokeConfig },
  ];

  const [tools, setTools] = useState<Array<{
    name: string;
    description?: string;
    parameters?: unknown;
    execution?: string | null;
  }>>([]);

  useEffect(() => {
    fetch('/api/docs/tools')
      .then((res) => res.json())
      .then((data) => setTools(data))
      .catch(() => {
        /* noop */
      });
  }, []);

  const renderKeyValue = (value: unknown): React.ReactNode => {
    if (Array.isArray(value)) {
      return (
        <ul className="list-disc list-inside">
          {value.map((item, idx) => (
            <li key={idx}>{renderKeyValue(item)}</li>
          ))}
        </ul>
      );
    }

    if (value && typeof value === 'object') {
      return (
        <dl className="space-y-1">
          {Object.entries(value).map(([k, v]) => (
            <div key={k} className="flex flex-col sm:flex-row sm:items-baseline gap-1">
              <dt className="font-medium text-foreground sm:w-40 shrink-0">
                {k}
              </dt>
              <dd className="text-muted-foreground break-words flex-1">
                {renderKeyValue(v) as React.ReactNode}
              </dd>
            </div>
          ))}
        </dl>
      );
    }

    return String(value) as React.ReactNode;
  };

  return (
    <div className="flex-1 overflow-y-auto space-y-6">
      {docs.map(({ title, data }) => {
        const {
          instructions,
          handoffDescription,
          tools: agentTools,
          ...rest
        } = data as unknown as Record<string, unknown>;

        const instructionsStr = instructions ? String(instructions) : '';
        const handoffStr = handoffDescription ? String(handoffDescription) : '';
        const hasRest = Object.keys(rest).length > 0;

        return (
          <div
            key={title}
            className="border border-border rounded-lg p-6 bg-card"
          >
            <h2 className="text-xl font-semibold mb-4">{title}</h2>

            {instructionsStr && (
              <div className="mb-4 prose max-w-none">
                <ReactMarkdown>{instructionsStr}</ReactMarkdown>
              </div>
            )}

            {handoffStr && (
              <div className="mb-4 prose max-w-none">
                <ReactMarkdown>{handoffStr}</ReactMarkdown>
              </div>
            )}

            {Array.isArray(agentTools) && agentTools.length > 0 && (
              <div className="mb-4">
                <h3 className="font-medium mb-1">Tools</h3>
                {renderKeyValue(agentTools)}
              </div>
            )}

            {hasRest && (
              <div className="mt-4 space-y-2">
                <h3 className="font-medium mb-1">Additional Settings</h3>
                {renderKeyValue(rest)}
              </div>
            )}
          </div>
        );
      })}

      {tools.length > 0 && (
        <div className="space-y-6">
          {tools.map((tool) => (
            <div
              key={tool.name}
              className="border border-border rounded-lg p-6 bg-card"
            >
              <h2 className="text-xl font-semibold mb-4">Tool: {tool.name}</h2>
              {tool.description && (
                <p className="mb-4 text-muted-foreground">{tool.description}</p>
              )}
              {tool.parameters != null && (
                <div className="mb-4">
                  <h3 className="font-medium mb-1">Parameters (JSON Schema)</h3>
                  <pre className="whitespace-pre-wrap bg-white p-3 rounded text-sm overflow-x-auto text-gray-800">
                    {JSON.stringify(tool.parameters, null, 2)}
                  </pre>
                </div>
              )}
              {tool.execution && (
                <div className="mb-4">
                  <h3 className="font-medium mb-1">Execution Function Source</h3>
                  <pre className="whitespace-pre-wrap bg-white p-3 rounded text-sm overflow-x-auto text-gray-800">
                    {tool.execution}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
