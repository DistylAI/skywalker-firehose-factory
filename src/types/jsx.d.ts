// Minimal JSX namespace fallback to satisfy third-party libraries compiled in JS/TS

export {};

declare global {
  namespace JSX {
    // Allow any intrinsic element without type checking its props
    interface IntrinsicElements {
      [elemName: string]: Record<string, unknown>;
    }
  }
} 