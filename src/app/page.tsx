'use client';

import { useChat } from '@ai-sdk/react';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import assistantConfig from '@/agents/definitions/assistantAgent.yaml';
import catConfig from '@/agents/definitions/catAgent.yaml';
import jokeConfig from '@/agents/definitions/jokeAgent.yaml';

enum Tab {
  Chat = 'chat',
  Docs = 'docs',
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.Chat);

  // Chat hook (only used when on chat tab but always initialised for simplicity)
  const { messages, input, handleInputChange, handleSubmit, status } =
    useChat({ streamProtocol: 'text' });

  return (
    <main className="flex flex-col h-screen p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">AI Chat Prototype</h1>

      {/* Tabs */}
      <div className="flex border-b mb-4">
        <button
          className={`px-4 py-2 -mb-px border-b-2 transition-colors ${
            activeTab === Tab.Chat
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent hover:text-blue-600'
          }`}
          onClick={() => setActiveTab(Tab.Chat)}
        >
          Chat
        </button>
        <button
          className={`ml-4 px-4 py-2 -mb-px border-b-2 transition-colors ${
            activeTab === Tab.Docs
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent hover:text-blue-600'
          }`}
          onClick={() => setActiveTab(Tab.Docs)}
        >
          Documentation
        </button>
      </div>

      {/* Content */}
      {activeTab === Tab.Chat ? (
        <>
          {/* Message list */}
          <div className="flex-1 overflow-y-auto space-y-2 mb-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`whitespace-pre-wrap p-3 rounded-lg max-w-[80%] ${
                  m.role === 'user'
                    ? 'bg-blue-600 text-white self-end ml-auto'
                    : 'bg-gray-200 text-gray-900'
                }`}
              >
                {/* We only render text parts for this simple prototype */}
                {m.parts.map((part, i) =>
                  part.type === 'text' ? <span key={i}>{part.text}</span> : null,
                )}
              </div>
            ))}
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="flex gap-2 items-center border-t pt-3"
          >
            <input
              type="text"
              className="flex-1 border rounded-md p-2 disabled:opacity-50"
              placeholder="Type your message…"
              value={input}
              onChange={handleInputChange}
              disabled={status !== 'ready'}
              autoFocus
            />
            <button
              type="submit"
              disabled={status !== 'ready'}
              className="bg-blue-600 text-white rounded-md px-4 py-2 disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </>
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
        const { instructions, handoffDescription, tools, name, ...rest } =
          data as any;

        return (
          <div
            key={title}
            className="border rounded-md p-4 bg-gray-50 dark:bg-gray-700"
          >
            <h2 className="text-xl font-semibold mb-4">{title}</h2>

            {/* Instructions (Markdown) */}
            {instructions && (
              <div className="mb-4 prose dark:prose-invert max-w-none">
                <ReactMarkdown>{instructions}</ReactMarkdown>
              </div>
            )}

            {/* Handoff description (Markdown) */}
            {handoffDescription && (
              <div className="mb-4 prose dark:prose-invert max-w-none">
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
              <pre className="whitespace-pre-wrap bg-white dark:bg-gray-800 p-3 rounded text-sm overflow-x-auto text-gray-800 dark:text-gray-100">
                {JSON.stringify(rest, null, 2)}
              </pre>
            )}
          </div>
        );
      })}
    </div>
  );
}
