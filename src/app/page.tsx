'use client';

import { useChat } from '@ai-sdk/react';
import type React from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowUp, ChevronDown, Square, RotateCcw } from "lucide-react";
import { ChatMessageList } from "@/components/ui/chat/chat-message-list";
import { ChatBubble, ChatBubbleMessage } from "@/components/ui/chat/chat-bubble";
import { ChatInput } from "@/components/ui/chat/chat-input";
import { cn } from "@/lib/utils";

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

  const chat = useChat({ streamProtocol: 'text' });
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    status,
    stop,
    setMessages,
  } = chat;

  // Ref to re-focus the input after submit
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scenario selection state
  const scenarios = [
    { label: "Cancelled Orders", value: "cancelled" },
    { label: "Multiple Item Orders", value: "multiple" },
    { label: "Single Item Orders", value: "single" },
    { label: "In-Transit Orders", value: "intransit" },
    { label: "Returned Orders", value: "returned" },
  ];

  const [scenario, setScenario] = useState<string>(scenarios[0].value);
  
  // Auth level state
  const [authLevel, setAuthLevel] = useState<string>("0");

  // Narrow the type of the chat messages to the subset used in this component.
  const typedMessages = messages as unknown as ChatMessage[];

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
  const handleResetChat = useCallback(() => {
    if (status === 'streaming' || status === 'submitted') {
      stop();
    }

    setMessages([]);

    // Refocus after clearing
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [status, stop, setMessages]);

  // Add Command+R shortcut to reset chat without reloading the page
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // On macOS, Meta key corresponds to the Command key
      if (e.metaKey && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault();
        handleResetChat();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleResetChat]);

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
            Evals
          </button>
        </div>

        {activeTab === Tab.Chat && (
          <div className="mt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
              Context
            </h3>
            <div className="flex gap-4">
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
          </div>
        )}
      </header>

      {activeTab === Tab.Chat ? (
        <div className="flex flex-col flex-1 min-h-0">
          {/* Message list */}
          <ChatMessageList className="flex-1 px-6 py-6 space-y-6" smooth>
            {typedMessages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>Start a conversation...</p>
              </div>
            ) : (
              <>
                {typedMessages.map((m) => {
                  // Combine all text parts into a single string
                  const textContent = m.parts
                    .filter((p: { type: string; text: string }) => p.type === "text")
                    .map((p) => p.text)
                    .join("\n");

                  return (
                    <ChatBubble
                      key={m.id}
                      variant={m.role === "user" ? "sent" : "received"}
                    >
                      <ChatBubbleMessage variant={m.role === "user" ? "sent" : "received"}>
                        {textContent}
                      </ChatBubbleMessage>
                    </ChatBubble>
                  );
                })}
                {status !== 'ready' && typedMessages[typedMessages.length - 1]?.role === 'user' && (
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
  const [evals, setEvals] = useState<Array<{
    name: string;
    description?: string;
    context?: {
      scenario?: string;
      auth_level?: string;
      authLevel?: number;
    };
    input: string | Array<{role: string; content: string}>;
    assertions?: Array<{
      type: string;
      value: string;
      description?: string;
    }>;
    tags?: string[];
  }>>([]);

  const [tags, setTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    // Load all evals
    fetch('/api/evals?action=list')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setEvals(data.data);
        }
      })
      .catch(() => {
        /* noop */
      });

    // Load available tags
    fetch('/api/evals?action=tags')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setTags(data.data);
        }
      })
      .catch(() => {
        /* noop */
      });
  }, []);

  const filteredEvals = selectedTags.length > 0 
    ? evals.filter(e => e.tags?.some(tag => selectedTags.includes(tag)))
    : evals;

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  // Render the test input using the same chat bubbles as the main chat UI
  const renderInput = (input: string | Array<{role: string; content: string}>) => {
    // Helper to map role ➝ bubble variant
    const getVariant = (role: string) => (role === 'user' ? 'sent' : 'received');

    if (typeof input === 'string') {
      return (
        <div className="flex flex-col items-end w-full">
          <ChatBubble variant="sent" className="flex-col">
            <ChatBubbleMessage variant="sent">{input}</ChatBubbleMessage>
          </ChatBubble>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-3">
        {input.map((msg, idx) => (
          <ChatBubble key={idx} variant={getVariant(msg.role)} className="flex-col">
            <ChatBubbleMessage variant={getVariant(msg.role)}>
              {msg.content}
            </ChatBubbleMessage>
          </ChatBubble>
        ))}
      </div>
    );
  };

  // Reusable section with consistent heading style
  const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
        {title}
      </h3>
      {children}
    </div>
  );

  const getScenarioDisplay = (context?: { scenario?: string; auth_level?: string; authLevel?: number }) => {
    if (!context) return null;
    
    const parts = [];
    if (context.scenario && context.scenario !== 'default') {
      parts.push(`${context.scenario} scenario`);
    }
    if (context.auth_level || context.authLevel !== undefined) {
      const authLevel = context.auth_level || context.authLevel;
      parts.push(`auth level ${authLevel}`);
    }
    
    return parts.length > 0 ? parts.join(', ') : null;
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {filteredEvals.map((evaluation, idx) => (
        <div key={idx} className="border border-border rounded-lg p-6 bg-card">
          <div className="flex items-start justify-between mb-3">
            <h2 className="text-lg font-semibold">{evaluation.name}</h2>
            {evaluation.tags && evaluation.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {evaluation.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {evaluation.description && (
            <p className="text-muted-foreground mb-3">{evaluation.description}</p>
          )}

          {/*
            Use a responsive grid: on medium screens and above show two columns.
            The left column is reserved for context information (fixed min width),
            while the right column stacks the Input and Expected Behavior sections.
          */}
          <div
            className={cn(
              "grid gap-6",
              evaluation.context && getScenarioDisplay(evaluation.context)
                ? "md:grid-cols-[200px_1fr]"
                : ""
            )}
          >
            {/* Context column (only rendered if available) */}
            {evaluation.context && getScenarioDisplay(evaluation.context) && (
              <Section title="Context">
                <span className="text-sm text-muted-foreground capitalize">
                  {getScenarioDisplay(evaluation.context)}
                </span>
              </Section>
            )}

            {/* Right column – Input followed by Expected Behavior */}
            <div className="space-y-6">
              <Section title="Input">
                {renderInput(evaluation.input)}
              </Section>

              {evaluation.assertions && evaluation.assertions.length > 0 && (
                <Section title="Expected Behavior">
                  <ul className="space-y-1">
                    {evaluation.assertions.map((assertion, aIdx) => (
                      <li key={aIdx} className="text-sm">
                        <span className="inline-block w-2 h-2 bg-primary rounded-full mr-2"></span>
                        <>
                          <span className="font-mono text-xs bg-muted px-1 rounded mr-1">
                            {assertion.type}
                          </span>
                          {assertion.value}
                        </>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}
            </div>
          </div>
        </div>
      ))}

      {filteredEvals.length === 0 && evals.length > 0 && (
        <div className="text-center text-muted-foreground py-8">
          No evaluations match the selected tags.
        </div>
      )}
    </div>
  );
}
