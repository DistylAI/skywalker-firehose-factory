import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'url';
import yaml from '@rollup/plugin-yaml';

export default defineConfig({
  plugins: [yaml()],
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
}); 