import OpenAI from 'openai';
import { setDefaultOpenAIClient } from '@openai/agents-openai';

// Centralised OpenAI client routed through Portkey Gateway.
// Set the following environment variables in your runtime:
// 1. OPENAI_API_KEY      – Your regular OpenAI key (needed by Portkey to forward the call)
// 2. PORTKEY_API_KEY     – Your Portkey account key (required)
// 3. PORTKEY_PROVIDER    – Optional. Defaults to 'openai'. Use your virtual key slug if you created one.
//
// Simple caching is enabled by default via the inline config object below.
// If you maintain configs in the Portkey dashboard instead, replace the
// `config` value with the config slug.

const portkeyApiKey = process.env.PORTKEY_API_KEY;

let client: OpenAI;

// Optional: log every underlying HTTP request. Enable by setting LOG_OPENAI=1.
const loggingFetch = process.env.LOG_OPENAI === '1'
  ? (url: RequestInfo | URL, init?: RequestInit) => {
      // eslint-disable-next-line no-console
      console.log('[OpenAI request]', url.toString());
      // @ts-ignore global fetch
      return fetch(url, init);
    }
  : undefined;

const PORTKEY_GATEWAY_URL = 'https://api.portkey.ai/v1';

if (portkeyApiKey) {
  // Use Portkey gateway
  client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: PORTKEY_GATEWAY_URL,
    defaultHeaders: {
      'x-portkey-api-key': portkeyApiKey,
      'x-portkey-provider': process.env.PORTKEY_PROVIDER || 'openai',
      'x-portkey-config': JSON.stringify({ cache: { mode: 'simple' } }),
    },
    fetch: loggingFetch,
  });
} else {
  // Fallback to direct OpenAI calls
  client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, fetch: loggingFetch });
}

// Make the Portkey-routed client the default for the OpenAI Agents SDK so
// that all uses of `@openai/agents` (e.g., assistantAgent, language guardrail)
// automatically go through Portkey as well.
setDefaultOpenAIClient(client);

export default client; 