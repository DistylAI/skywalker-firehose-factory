'use client';

import { useChat } from '@ai-sdk/react';
import type React from 'react';
import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import assistantConfig from '@/agents/definitions/assistantAgent.yaml';
import catConfig from '@/agents/definitions/catAgent.yaml';
import jokeConfig from '@/agents/definitions/jokeAgent.yaml';
import { Button } from "@/components/ui/button";
import { ArrowUp, ChevronDown } from "lucide-react";
import { ChatMessageList } from "@/components/ui/chat/chat-message-list";
import { ChatBubble, ChatBubbleMessage } from "@/components/ui/chat/chat-bubble";
import { ChatInput } from "@/components/ui/chat/chat-input";
import { cn } from "@/lib/utils";

enum Tab {
  Chat = 'chat',
  Docs = 'docs',
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.Chat);

  // Chat hook (only used when on chat tab but always initialised for simplicity)
  const { messages, input, handleInputChange, handleSubmit, status } =
    useChat({ streamProtocol: 'text' });

  // Ref to re-focus the input after submit
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scenario selection state
  const scenarios = [
    { label: "Default", value: "default" },
    { label: "Assistant", value: "assistant" },
    { label: "Cat Facts", value: "cat" },
    { label: "Jokes", value: "joke" },
  ];

  const [scenario, setScenario] = useState<string>(scenarios[0].value);

  const handleSubmitAndFocus = (e: React.SyntheticEvent) => {
    handleSubmit(
      e,
      {
        data: {
          scenario,
        },
      },
    );

    // Using a timeout ensures focus after UI updates
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <main className="flex flex-col h-screen max-w-4xl mx-auto bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background px-6 py-4">
        <h1 className="text-xl font-semibold text-foreground">Skywalker Firehose Factory</h1>

        {/* Tabs & Scenario selector */}
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

        {/* Scenario selector (only visible on Chat tab) */}
        {activeTab === Tab.Chat && (
          <div className="mt-4 flex flex-col gap-1 w-48">
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
        )}
      </header>

      {/* Tabs */}
      {/* Content */}
      {activeTab === Tab.Chat ? (
        <div className="flex flex-col flex-1 min-h-0">
          {/* Message list */}
          <ChatMessageList className="flex-1 px-6 py-6 space-y-6" smooth>
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>Start a conversation...</p>
              </div>
            ) : (
              messages.map((m) => (
                <ChatBubble
                  key={m.id}
                  variant={m.role === 'user' ? 'sent' : 'received'}
                >
                  <ChatBubbleMessage variant={m.role === 'user' ? 'sent' : 'received'}>
                    {m.parts
                      .filter((p) => p.type === 'text')
                      .map((p, i) => (
                        <span key={i}>{(p as any).text}</span>
                      ))}
                  </ChatBubbleMessage>
                </ChatBubble>
              ))
            )}
          </ChatMessageList>

          {/* Input */}
          <form
            onSubmit={handleSubmitAndFocus}
            className="flex gap-3 items-end border-t border-border bg-background px-6 py-4 flex-shrink-0"
          >
            <ChatInput
              placeholder="Type your message…"
              value={input}
              onChange={handleInputChange}
              disabled={status !== 'ready'}
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
              type="submit"
              variant="outline"
              disabled={status !== 'ready'}
              className="w-[44px] h-[44px] p-0"
            >
              <ArrowUp className="h-5 w-5" />
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
    { title: 'Cat Facts Agent', data: catConfig },
    { title: 'Joke Agent', data: jokeConfig },
  ];

  const [tools, setTools] = useState<Array<{
    name: string;
    description?: string;
    parameters?: any;
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

  // Recursive renderer for key-value pairs (objects, arrays, primitives)
  const renderKeyValue = (value: any): React.ReactNode => {
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
                {renderKeyValue(v)}
              </dd>
            </div>
          ))}
        </dl>
      );
    }

    // Primitive fallback
    return String(value);
  };

  return (
    <div className="flex-1 overflow-y-auto space-y-6">
      {docs.map(({ title, data }) => {
        const {
          name: _ignoredName,
          instructions,
          handoffDescription,
          tools: agentTools,
          ...rest
        } = data as Record<string, unknown>;

        const instructionsStr = instructions ? String(instructions) : '';
        const handoffStr = handoffDescription ? String(handoffDescription) : '';
        const hasRest = Object.keys(rest).length > 0;

        return (
          <div
            key={title}
            className="border border-border rounded-lg p-6 bg-card"
          >
            <h2 className="text-xl font-semibold mb-4">{title}</h2>

            {/* Instructions (Markdown) */}
            {instructionsStr && (
              <div className="mb-4 prose max-w-none">
                <ReactMarkdown>{instructionsStr}</ReactMarkdown>
              </div>
            )}

            {/* Handoff description (Markdown) */}
            {handoffStr && (
              <div className="mb-4 prose max-w-none">
                <ReactMarkdown>{handoffStr}</ReactMarkdown>
              </div>
            )}

            {/* Tools list */}
            {Array.isArray(agentTools) && agentTools.length > 0 && (
              <div className="mb-4">
                <h3 className="font-medium mb-1">Tools</h3>
                {renderKeyValue(agentTools)}
              </div>
            )}

            {/* Any remaining fields rendered as friendly key-value list */}
            {hasRest && (
              <div className="mt-4 space-y-2">
                <h3 className="font-medium mb-1">Additional Settings</h3>
                {renderKeyValue(rest)}
              </div>
            )}
          </div>
        );
      })}

      {/* Tools Documentation */}
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
              {tool.parameters && (
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
