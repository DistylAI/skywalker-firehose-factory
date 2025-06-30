import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'url';
import yaml from '@rollup/plugin-yaml';

// This configuration is dedicated to running the JSON evaluation suite located in tests/evals
export default defineConfig({
  plugins: [yaml()],
  test: {
    environment: 'node',
    globals: true,
    // Pick up evaluation and framework tests
    include: ['tests/evals/**/*.test.ts', 'tests/framework/**/*.test.ts'],
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
}); 