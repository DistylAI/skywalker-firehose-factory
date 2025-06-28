// Polyfill CustomEvent for environments (like Next.js edge runtime) where it is missing.
// The OpenAI Agents SDK relies on CustomEvent in its browser shims.
// This lightweight polyfill is sufficient for the SDK's event emitter.

/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
if (typeof globalThis.CustomEvent === 'undefined') {
  // Minimal CustomEvent polyfill that mimics constructor signature
  class PolyfilledCustomEvent<T = unknown> extends Event {
    public detail: T;
    constructor(type: string, params: CustomEventInit<T> = {}) {
      super(type, params);
      this.detail = params.detail as T;
    }
  }
  // @ts-ignore
  globalThis.CustomEvent = PolyfilledCustomEvent;
} 