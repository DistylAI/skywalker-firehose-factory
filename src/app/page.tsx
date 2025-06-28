'use client';

import { useChat } from '@ai-sdk/react';
import { useState } from 'react';

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
        // Documentation tab content placeholder - will be replaced with real docs in next steps
        <div className="flex-1 overflow-y-auto prose max-w-none">
          <h2>Agent Documentation</h2>
          <p>
            This section will provide detailed documentation about the available
            agents and tools in the system.
          </p>
          <ul>
            <li><strong>Assistant</strong> – The main agent that delegates to specialised agents.</li>
            <li><strong>Cat Facts Agent</strong> – Provides fun facts about cats.</li>
            <li><strong>Joke Agent</strong> – Tells short, timeless jokes.</li>
          </ul>
          <p>
            Further information will be added in the upcoming steps.
          </p>
        </div>
      )}
    </main>
  );
}
