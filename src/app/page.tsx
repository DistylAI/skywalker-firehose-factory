'use client';

import { useChat } from '@ai-sdk/react';
import { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import assistantConfig from '@/agents/definitions/assistantAgent.yaml';
import catConfig from '@/agents/definitions/catAgent.yaml';
import jokeConfig from '@/agents/definitions/jokeAgent.yaml';
import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";
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

  const handleSubmitAndFocus = (e: any) => {
    handleSubmit(e);
    // Using a timeout ensures focus after UI updates
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <main className="flex flex-col h-screen max-w-4xl mx-auto bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background px-6 py-4">
        <h1 className="text-xl font-semibold text-foreground">AI Chat</h1>

        {/* Tabs */}
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

  return (
    <div className="flex-1 overflow-y-auto space-y-6">
      {docs.map(({ title, data }) => {
        const { instructions, handoffDescription, tools, ...rest } =
          data as Record<string, unknown>;

        return (
          <div
            key={title}
            className="border border-border rounded-lg p-6 bg-card"
          >
            <h2 className="text-xl font-semibold mb-4">{title}</h2>

            {/* Instructions (Markdown) */}
            {instructions && (
              <div className="mb-4 prose max-w-none">
                <ReactMarkdown>{instructions}</ReactMarkdown>
              </div>
            )}

            {/* Handoff description (Markdown) */}
            {handoffDescription && (
              <div className="mb-4 prose max-w-none">
                <ReactMarkdown>{handoffDescription}</ReactMarkdown>
              </div>
            )}

            {/* Tools list */}
            {Array.isArray(tools) && tools.length > 0 && (
              <div className="mb-4">
                <h3 className="font-medium mb-1">Tools</h3>
                <ul className="list-disc list-inside">
                  {tools.map((t: string) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Any remaining fields rendered as JSON for completeness */}
            {Object.keys(rest).length > 0 && (
              <pre className="whitespace-pre-wrap bg-white p-3 rounded text-sm overflow-x-auto text-gray-800">
                {JSON.stringify(rest, null, 2)}
              </pre>
            )}
          </div>
        );
      })}
    </div>
  );
}
