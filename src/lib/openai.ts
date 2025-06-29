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

// Lightweight fetch wrapper that logs every underlying HTTP request so we can
// confirm the exact endpoint hit (Portkey vs. OpenAI). If you wish to silence
// the logs, set the environment variable `LOG_OPENAI=0`.
const loggingFetch = (url: RequestInfo | URL, init?: RequestInit) => {
  if (process.env.LOG_OPENAI !== '0') {
    // eslint-disable-next-line no-console
    console.log('[OpenAI request]', url.toString());
  }
  // @ts-ignore global fetch is available in both Node 18+ and Edge runtime
  return fetch(url, init);
};

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

// Informative startup log so we can verify in both server runtime and tests
// whether requests are going through Portkey or directly to OpenAI.
if (typeof console !== 'undefined') {
  if (portkeyApiKey) {
    // eslint-disable-next-line no-console
    console.log('[OpenAI] Initialised with Portkey gateway:', PORTKEY_GATEWAY_URL, 'Provider:', process.env.PORTKEY_PROVIDER || 'openai');
  } else {
    // eslint-disable-next-line no-console
    console.log('[OpenAI] Initialised with direct OpenAI endpoint');
  }
}

export default client; 