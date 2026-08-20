import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      thresholds: {
        branches: 75,
        functions: 70,
        lines: 70,
        statements: 70,
      },
    },
  },
});
